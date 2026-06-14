import json

from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import database
from app.models import lesson as lesson_models
from app.models import student as student_models
from app.utils.stripe import construct_webhook_event, is_stripe_configured

router = APIRouter(prefix="/api/v1/webhooks", tags=["webhooks"])


@router.get("/health")
def webhook_health():
    """Webhook health check."""
    stripe_ready = is_stripe_configured()
    return {
        "status": "ok",
        "service": "webhooks",
        "stripe_configured": stripe_ready,
    }


@router.post("/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(database.get_db)):
    """
    Stripe webhook endpoint.

    Listens for:
      - checkout.session.completed  → payment successful, activate the lesson
      - checkout.session.expired    → payment abandoned, keep lesson pending

    Stripe sends the raw body and a Stripe-Signature header that we verify
    using the webhook signing secret.
    """
    payload = await request.body()
    signature = request.headers.get("stripe-signature", "")

    if not is_stripe_configured():
        raise HTTPException(status_code=503, detail="Stripe is not configured on this server.")

    event = construct_webhook_event(payload, signature)
    if event is None:
        raise HTTPException(status_code=400, detail="Invalid webhook signature or payload.")

    event_type = event["type"]
    session_obj = event["data"]["object"]
    metadata = session_obj.get("metadata", {})
    payment_type = metadata.get("payment_type", "lesson") if metadata else "lesson"
    print(f"[STRIPE WEBHOOK] Received event: {event_type} (payment_type={payment_type})")

    # ── Handle completed checkout ──────────────────────────────────────────
    if event_type == "checkout.session.completed":
        _handle_lesson_checkout_completed(db, session_obj, metadata)

    # ── Handle expired / abandoned checkout ────────────────────────────────
    elif event_type == "checkout.session.expired":
        _handle_lesson_checkout_expired(db, session_obj)

    else:
        print(f"[STRIPE WEBHOOK] Unhandled event type: {event_type}")

    return {"status": "ok"}


# ── Lesson-specific checkout handlers ───────────────────────────────────────

def _handle_lesson_checkout_completed(db: Session, session_obj: dict, metadata: dict):
    """
    Handle completed checkout for a single lesson.

    DESIGN RULE: Payment-backed lessons (payment_method='stripe') are AUTO-CONFIRMED.
    A successful Stripe payment is the only gate between pending→scheduled.
    No manual teacher acceptance is required or expected for stripe-paid lessons.
    The teacher only intervenes for non-stripe/manual lessons or edge cases.
    """
    stripe_session_id = session_obj.get("id")
    booking_id = metadata.get("booking_id") if metadata else None
    client_reference_id = session_obj.get("client_reference_id")

    lesson = None
    # 1. Look up by booking_id in metadata (checkout-session approach)
    if booking_id:
        lesson = db.query(lesson_models.Lesson).filter(
            lesson_models.Lesson.id == booking_id
        ).first()

    # 2. Look up by client_reference_id (Payment Link approach)
    if not lesson and client_reference_id:
        lesson = db.query(lesson_models.Lesson).filter(
            lesson_models.Lesson.id == client_reference_id
        ).first()

    # 3. Fallback: look up by stripe_session_id
    if not lesson and stripe_session_id:
        lesson = db.query(lesson_models.Lesson).filter(
            lesson_models.Lesson.stripe_session_id == stripe_session_id
        ).first()

    if not lesson:
        print(f"[STRIPE WEBHOOK] No lesson found for session {stripe_session_id}. "
              f"booking_id: {booking_id}, client_reference_id: {client_reference_id}, metadata: {metadata}")
        return

    # Idempotency guard — only process if lesson is still pending
    if lesson.status != "pending":
        print(f"[STRIPE WEBHOOK] Lesson {lesson.id} already processed (status={lesson.status}). Skipping.")
        return

    lesson.stripe_session_id = stripe_session_id
    lesson.payment_method = "stripe"
    lesson.status = "scheduled"  # payment confirmed — lesson is now scheduled

    db.commit()
    db.refresh(lesson)

    from app.utils.email import send_teacher_notification
    student = db.query(student_models.Student).filter(
        student_models.Student.id == lesson.student_id
    ).first()
    if student:
        lesson_date_str = lesson.start_time.strftime("%A, %B %d at %I:%M %p UTC") if lesson.start_time else "TBD"
        send_teacher_notification(
            student_name=student.name,
            lesson_date=lesson_date_str,
            duration=lesson.duration,
            lesson_type=lesson.lesson_type,
            student_payment_account=f"Stripe session: {stripe_session_id}",
        )

    print(f"[STRIPE WEBHOOK] Lesson {lesson.id} payment confirmed via Stripe. Status: {lesson.status}")


def _handle_lesson_checkout_expired(db: Session, session_obj: dict):
    """Handle expired checkout for a single lesson."""
    stripe_session_id = session_obj.get("id")
    if stripe_session_id:
        lesson = db.query(lesson_models.Lesson).filter(
            lesson_models.Lesson.stripe_session_id == stripe_session_id
        ).first()
        if lesson and lesson.status == "pending" and lesson.stripe_session_id == stripe_session_id:
            print(f"[STRIPE WEBHOOK] Checkout Session expired for lesson {lesson.id}. Keeping pending for manual fallback.")


