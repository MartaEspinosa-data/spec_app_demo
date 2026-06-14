"""
Background job that expires pending lessons that have no completed payment.

When a student abandons Stripe checkout, the lesson stays "pending" forever
and blocks that time slot for other students. This job cancels any pending
lesson older than 30 minutes where the Stripe session is either expired or
never existed.
"""

from datetime import datetime, timedelta, timezone

from app.database.database import SessionLocal
from app.models.lesson import Lesson


# ── Configuration ──────────────────────────────────────────────────────────
# Lessons stuck in "pending" for longer than this are considered abandoned.
# The Stripe Checkout Session itself expires after 24 h, but we clean up
# earlier so the slot reappears quickly for other students.
PENDING_EXPIRY_MINUTES = 30


def expire_pending_lessons():
    """
    Find lessons older than PENDING_EXPIRY_MINUTES that are still pending,
    verify the Stripe session is not paid, and cancel them so the time slot
    is freed for other students.

    This runs as a periodic APScheduler job (see app/main.py).
    """
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(minutes=PENDING_EXPIRY_MINUTES)

    db = SessionLocal()
    try:
        # Query all lessons stuck in "pending" that were created before the cutoff
        stale = (
            db.query(Lesson)
            .filter(
                Lesson.status == "pending",
                Lesson.created_at < cutoff,
            )
            .all()
        )

        if not stale:
            return

        cancelled_count = 0

        for lesson in stale:
            # If there's a Stripe session, double-check it isn't paid.
            # (The webhook may have been delayed — don't cancel a paid lesson.)
            if lesson.stripe_session_id:
                if _stripe_session_is_paid(lesson.stripe_session_id):
                    continue  # skip — payment exists, webhook just hasn't fired yet

            # Mark as cancelled so the slot reappears in get_slots_for_day()
            lesson.status = "cancelled"
            cancelled_count += 1

        if cancelled_count > 0:
            db.commit()
            print(
                f"[PENDING-CLEANUP] Cancelled {cancelled_count} stale pending "
                f"lesson(s) older than {PENDING_EXPIRY_MINUTES} minutes."
            )

    finally:
        db.close()


def _stripe_session_is_paid(stripe_session_id: str) -> bool:
    """
    Ask Stripe whether a Checkout Session has been paid.

    Returns True if the session exists and payment_status == 'paid'.
    Returns False on any error, non-paid status, or if Stripe is not configured
    — in which case we fall back to simply expiring the lesson.
    """
    try:
        from app.utils.stripe import is_stripe_configured
        import stripe
        import os

        if not is_stripe_configured():
            return False

        stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")

        session = stripe.checkout.Session.retrieve(stripe_session_id)
        return session.get("payment_status") == "paid"

    except Exception:
        # If Stripe lookup fails for any reason (network, invalid id, etc.),
        # assume the session is not paid and allow the cleanup to proceed.
        return False
