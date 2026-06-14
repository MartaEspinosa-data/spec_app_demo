"""
Stripe Checkout Session integration.

This module provides helpers to create Stripe Checkout Sessions for lesson
bookings and to verify incoming webhook signatures.

Instead of dynamically creating Price objects (old Payment Links approach),
this module uses pre-defined Stripe Price IDs configured via environment
variables. This keeps your Stripe product catalog clean and predictable.

Environment variables required:
    STRIPE_SECRET_KEY        — Stripe secret key (sk_...)
    STRIPE_WEBHOOK_SECRET   — Stripe webhook signing secret (whsec_...)
    STRIPE_PRICE_ID_30      — Stripe Price ID for 30-min lessons
    STRIPE_PRICE_ID_45      — Stripe Price ID for 45-min lessons
    STRIPE_PRICE_ID_60      — Stripe Price ID for 60-min lessons
"""

import os
import stripe
from typing import Optional, Dict, Tuple


def _get_secret_key() -> str:
    """Re-read the secret key from env on every call (dotenv may load after import)."""
    return os.getenv("STRIPE_SECRET_KEY", "")


def _get_webhook_secret() -> str:
    """Re-read the webhook secret from env on every call."""
    return os.getenv("STRIPE_WEBHOOK_SECRET", "")


def _get_frontend_url() -> str:
    """Get the frontend base URL for Stripe success/cancel redirects."""
    return os.getenv("FRONTEND_URL", "http://localhost:5173")


def is_stripe_configured() -> bool:
    """Return True if Stripe keys are present in the environment."""
    key = _get_secret_key()
    return bool(key and key.startswith("sk_"))


# ── Payment Link helpers (pre-built Stripe Payment Links) ────────────────

def get_payment_link_urls() -> Dict[int, str]:
    """
    Return the mapping of duration → Stripe Payment Link URL.

    These are pre-built Payment Links created in the Stripe Dashboard:
      - 30 min → https://buy.stripe.com/test_XXX...
      - 45 min → https://buy.stripe.com/test_XXX...
      - 60 min → https://buy.stripe.com/test_XXX...

    Set these in your .env file as:
      STRIPE_PAYMENT_LINK_30=https://buy.stripe.com/test_...
      STRIPE_PAYMENT_LINK_45=https://buy.stripe.com/test_...
      STRIPE_PAYMENT_LINK_60=https://buy.stripe.com/test_...
    """
    return {
        30: os.getenv("STRIPE_PAYMENT_LINK_30", ""),
        45: os.getenv("STRIPE_PAYMENT_LINK_45", ""),
        60: os.getenv("STRIPE_PAYMENT_LINK_60", ""),
    }


def get_payment_link_url(
    duration: int,
    lesson_id: str,
    student_email: str = "",
) -> Optional[str]:
    """
    Build a Payment Link URL pointing at the correct pre-built Stripe Payment Link.

    Appends query parameters so Stripe associates the resulting Checkout Session
    with our lesson:
      - client_reference_id={lesson_id}  → looked up by the webhook
      - prefilled_email={student_email}   → pre-fills the email field

    Returns None if no Payment Link is configured for the given duration.
    """
    links = get_payment_link_urls()
    base_url = links.get(duration, "")
    if not base_url:
        print(f"[STRIPE] No Payment Link configured for duration={duration}min.")
        return None

    import urllib.parse
    params = {"client_reference_id": lesson_id}
    if student_email:
        params["prefilled_email"] = student_email

    separator = "&" if "?" in base_url else "?"
    query_string = urllib.parse.urlencode(params)
    full_url = f"{base_url}{separator}{query_string}"

    print(f"[STRIPE] Payment Link URL built: {full_url}")
    return full_url


# ── Checkout Session creators ──────────────────────────────────────────────

def create_checkout_session(
    lesson_id: str,
    duration: int,
    student_name: str,
    student_email: str,
    slot_iso: str,
    success_url: Optional[str] = None,
    cancel_url: Optional[str] = None,
) -> Tuple[Optional[str], Optional[str]]:
    """
    Create a Stripe Checkout Session for a single lesson booking.

    Uses the pre-defined Price ID for the given duration. The booking's
    lesson_id is embedded in the session metadata so the webhook can
    reliably confirm the reservation when payment completes.

    Returns a tuple of (session_id, session_url).
    Returns (None, None) if Stripe is not configured or the Price ID is missing.
    """
    if not is_stripe_configured():
        print("[STRIPE] Stripe not configured — skipping Checkout Session creation.")
        return None, None

    price_id = get_price_id_for_duration(duration)
    if not price_id:
        print(f"[STRIPE] No Price ID configured for duration={duration}min.")
        return None, None

    # Build success/cancel URLs from env if not provided
    frontend_url = _get_frontend_url()
    if success_url is None:
        success_url = f"{frontend_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    if cancel_url is None:
        cancel_url = f"{frontend_url}/payment-cancelled"

    try:
        stripe.api_key = _get_secret_key()

        session = stripe.checkout.Session.create(
            mode="payment",
            customer_email=student_email,
            line_items=[
                {
                    "price": price_id,
                    "quantity": 1,
                }
            ],
            metadata={
                "booking_id": lesson_id,
                "duration": str(duration),
                "slot": slot_iso,
                "student_name": student_name,
                "student_email": student_email,
                "payment_type": "lesson",
            },
            success_url=success_url,
            cancel_url=cancel_url,
        )

        print(f"[STRIPE] Checkout Session created: {session.id} -> {session.url}")
        return session.id, session.url

    except stripe.StripeError as e:
        print(f"[STRIPE ERROR] Failed to create Checkout Session: {e}")
        return None, None


# ── Session metadata updates (for reschedule, etc.) ─────────────────────────

def update_session_metadata(session_id: str, metadata_updates: dict) -> bool:
    """
    Update metadata on an existing Stripe Checkout Session.

    Useful after a lesson is rescheduled — the original session's 'slot'
    metadata becomes stale, so we update it to reflect the new time for
    reconciliation and support purposes.

    Returns True on success, False on failure (logs the error, does not raise).
    """
    if not session_id or not is_stripe_configured():
        return False

    try:
        stripe.api_key = _get_secret_key()
        session = stripe.checkout.Session.retrieve(session_id)
        existing_metadata = session.get("metadata", {}) or {}
        merged = {**existing_metadata, **metadata_updates}
        stripe.checkout.Session.modify(session_id, metadata=merged)
        print(f"[STRIPE] Updated metadata on session {session_id}: {metadata_updates}")
        return True
    except stripe.StripeError as e:
        print(f"[STRIPE] Failed to update session {session_id} metadata: {e}")
        return False


# ── Webhook verification ───────────────────────────────────────────────────

def construct_webhook_event(payload: bytes, signature_header: str) -> Optional[stripe.Event]:
    """
    Verify and construct a Stripe webhook event from the raw payload.

    Returns None if verification fails or Stripe isn't configured.
    """
    webhook_secret = _get_webhook_secret()
    if not webhook_secret:
        print("[STRIPE] Webhook secret not configured — cannot verify events.")
        return None

    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=signature_header,
            secret=webhook_secret,
        )
        return event
    except stripe.SignatureVerificationError as e:
        print(f"[STRIPE] Webhook signature verification failed: {e}")
        return None
    except Exception as e:
        print(f"[STRIPE] Error constructing webhook event: {e}")
        return None


# ── Refund helper ───────────────────────────────────────────────────────────

def refund_checkout_session(session_id: str) -> bool:
    """
    Issue a full refund for a Stripe Checkout Session.

    Retrieves the Payment Intent ID from the session, then creates a full
    refund via Stripe. Returns True on success, False on failure.

    Only works when Stripe is properly configured.
    """
    if not session_id or not is_stripe_configured():
        print("[STRIPE] Cannot refund — Stripe not configured or no session_id.")
        return False

    try:
        stripe.api_key = _get_secret_key()

        # Retrieve the Checkout Session to get the payment_intent
        session = stripe.checkout.Session.retrieve(session_id)
        payment_intent_id = session.get("payment_intent")

        if not payment_intent_id:
            print(f"[STRIPE] No payment_intent found on session {session_id}. Cannot refund.")
            return False

        # Issue a full refund
        refund = stripe.Refund.create(
            payment_intent=payment_intent_id,
            reason="requested_by_customer",
        )

        print(f"[STRIPE] Full refund issued for session {session_id}: "
              f"refund_id={refund.id}, amount={refund.amount}, status={refund.status}")
        return refund.status in ("succeeded", "pending")

    except stripe.StripeError as e:
        print(f"[STRIPE] Refund failed for session {session_id}: {e}")
        return False
