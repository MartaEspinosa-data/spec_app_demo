"""
Stripe Checkout Session integration.

This module provides helpers to create Stripe Checkout Sessions for lesson
bookings and package purchases, and to verify incoming webhook signatures.

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


# ── Price ID lookup (pre-defined products in Stripe dashboard) ────────────

def get_price_ids() -> Dict[int, str]:
    """
    Return the mapping of duration → Stripe Price ID.

    These are configured in the Stripe dashboard (Product Catalog → Products).
    Each product corresponds to a lesson duration:
      - 30 min → price_1xxx...
      - 45 min → price_1xxx...
      - 60 min → price_1xxx...

    Set these in your .env file as:
      STRIPE_PRICE_ID_30=price_1RabcdEfghijklmn
      STRIPE_PRICE_ID_45=price_1RbcdeEfghijklmn
      STRIPE_PRICE_ID_60=price_1RcdefEfghijklmn
    """
    return {
        30: os.getenv("STRIPE_PRICE_ID_30", ""),
        45: os.getenv("STRIPE_PRICE_ID_45", ""),
        60: os.getenv("STRIPE_PRICE_ID_60", ""),
    }


def get_price_id_for_duration(duration: int) -> Optional[str]:
    """Get the Stripe Price ID for a given lesson duration, or None if not configured."""
    price_ids = get_price_ids()
    pid = price_ids.get(duration, "")
    return pid if pid else None


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


def create_package_checkout_session(
    package_id: str,
    duration: int,
    price_eur: float,
    student_name: str,
    student_email: str,
    total_lessons: int = 5,
    success_url: Optional[str] = None,
    cancel_url: Optional[str] = None,
) -> Tuple[Optional[str], Optional[str]]:
    """
    Create a Stripe Checkout Session for a lesson package purchase.

    Since package products vary in price (depending on duration and number of
    lessons), we create a dynamic Price object on the fly rather than requiring
    pre-defined Price IDs for every package combination.

    Returns a tuple of (session_id, session_url).
    Returns (None, None) if Stripe is not configured.
    """
    if not is_stripe_configured():
        print("[STRIPE] Stripe not configured — skipping package Checkout Session creation.")
        return None, None

    # Build success/cancel URLs from env if not provided
    frontend_url = _get_frontend_url()
    if success_url is None:
        success_url = f"{frontend_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    if cancel_url is None:
        cancel_url = f"{frontend_url}/payment-cancelled"

    try:
        stripe.api_key = _get_secret_key()
        price_in_cents = int(round(price_eur * 100))

        # Create a dynamic Price for the package
        discount_pct = 3  # 3% package discount
        single_price_eur = price_eur / (total_lessons * (1 - discount_pct / 100))

        price_obj = stripe.Price.create(
            currency="eur",
            unit_amount=price_in_cents,
            product_data={
                "name": f"Paquete {total_lessons} Clases — {duration} min",
                "description": (
                    f"{total_lessons} × {duration} min lessons "
                    f"(~€{single_price_eur:.2f}/lesson, {discount_pct}% dto.)"
                ),
            },
        )

        session = stripe.checkout.Session.create(
            mode="payment",
            customer_email=student_email,
            line_items=[
                {
                    "price": price_obj.id,
                    "quantity": 1,
                }
            ],
            metadata={
                "package_id": package_id,
                "student_name": student_name,
                "student_email": student_email,
                "payment_type": "package",
                "duration": str(duration),
                "total_lessons": str(total_lessons),
            },
            success_url=success_url,
            cancel_url=cancel_url,
        )

        print(f"[STRIPE] Package Checkout Session created: {session.id} -> {session.url}")
        return session.id, session.url

    except stripe.StripeError as e:
        print(f"[STRIPE ERROR] Failed to create package Checkout Session: {e}")
        return None, None


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
