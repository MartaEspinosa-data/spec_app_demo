from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.database import database
from app.models import lesson as models
from app.models import student as student_models
from app.models import teacher as teacher_models
from app.schemas import lesson as schemas
from datetime import datetime, time, timedelta, timezone, date as date_type
from typing import Optional, Dict, Any
import os
import zoneinfo

from app.utils.auth import require_student, require_teacher

router = APIRouter(prefix="/api/v1/lessons", tags=["lessons"])

from app.models.availability import TeacherAvailability

MADRID_TZ = zoneinfo.ZoneInfo("Europe/Madrid")

# ── Lesson-type-specific pricing (EUR) ──────────────────────────────────────
# Each lesson type maps to per-duration prices.
# If a lesson_type or duration is not found here, the teacher's pricing_schema
# or hourly rate is used as fallback.
LESSON_TYPE_PRICING: Dict[str, Dict[int, float]] = {
    # Core types (most common)
    "Conversación":    {30: 16.34, 45: 23.56, 60: 30.95},
    "Conversacion":    {30: 16.34, 45: 23.56, 60: 30.95},
    "Conversation":    {30: 16.34, 45: 23.56, 60: 30.95},
    "Grammar":         {30: 16.34, 45: 23.56, 60: 30.95},
    "Gramática":       {30: 16.34, 45: 23.56, 60: 30.95},

    # Structured courses — higher price (curriculum preparation)
    "Curso Básico":    {30: 18.00, 45: 25.50, 60: 33.00},
    "Curso Basico":    {30: 18.00, 45: 25.50, 60: 33.00},
    "Basic Course":    {30: 18.00, 45: 25.50, 60: 33.00},

    # Premium / specialized types
    "Examen DELE":           {30: 20.00, 45: 28.00, 60: 36.00},
    "Entrevista de Trabajo": {30: 20.00, 45: 28.00, 60: 36.00},
}

def get_lesson_price(
    lesson_type: str,
    duration: int,
    teacher_pricing_schema: Optional[Dict[str, Any]] = None,
    teacher_hourly_rate: float = 30.95,
) -> float:
    """
    Determine the price for a lesson by checking, in order:
    1. LESSON_TYPE_PRICING[lesson_type][duration]
    2. teacher.pricing_schema[duration]
    3. teacher.price_per_hour * (duration / 60)
    """
    # 1. Lesson-type-specific pricing
    type_prices = LESSON_TYPE_PRICING.get(lesson_type)
    if type_prices and duration in type_prices:
        return float(type_prices[duration])

    # 2. Teacher's custom pricing schema
    if teacher_pricing_schema and str(duration) in teacher_pricing_schema:
        return float(teacher_pricing_schema[str(duration)])

    # 3. Fallback to proportional hourly rate
    return teacher_hourly_rate * (duration / 60.0)

def get_slots_for_day(db: Session, teacher_id: str, target_date: date_type, duration: int = 60):
    # Fetch availability rules
    # We prioritize specific_date over day_of_week
    specific = db.query(TeacherAvailability).filter(
        TeacherAvailability.teacher_id == teacher_id,
        TeacherAvailability.specific_date == target_date
    ).first()
    
    recurring = db.query(TeacherAvailability).filter(
        TeacherAvailability.teacher_id == teacher_id,
        TeacherAvailability.day_of_week == target_date.weekday()
    ).first()
    
    rule = specific if specific else recurring
    
    if not rule or not rule.is_available:
        return []
        
    start_time = rule.start_time
    end_time = rule.end_time
    
    # Availability times are stored as Madrid local wall-clock time
    # Combine them with the target date to create Madrid-local datetimes
    local_start = datetime.combine(target_date, start_time).replace(tzinfo=MADRID_TZ)
    local_end = datetime.combine(target_date, end_time).replace(tzinfo=MADRID_TZ)
    
    # Convert local start/end availability to UTC for comparison
    utc_start = local_start.astimezone(timezone.utc)
    utc_end = local_end.astimezone(timezone.utc)
    
    # Get existing lessons (scheduled AND pending) to prevent double-booking
    existing_lessons = db.query(models.Lesson).filter(
        models.Lesson.teacher_id == teacher_id,
        models.Lesson.start_time >= utc_start,
        models.Lesson.start_time < utc_end,
        models.Lesson.status.in_(["scheduled", "pending"])
    ).all()
    
    slots = []
    scan_time = utc_start
    
    # We enforce 12 hours ahead constraint in UTC
    cutoff_time = datetime.now(timezone.utc) + timedelta(hours=12)
    
    while scan_time + timedelta(minutes=duration) <= utc_end:
        # Check overlaps
        slot_end = scan_time + timedelta(minutes=duration)
        overlap = False
        for l in existing_lessons:
            # l.start_time is stored as timezone-aware UTC datetime
            l_start_utc = l.start_time if l.start_time.tzinfo else l.start_time.replace(tzinfo=timezone.utc)
            l_end_utc = l_start_utc + timedelta(minutes=l.duration)
            if (scan_time < l_end_utc and slot_end > l_start_utc):
                overlap = True
                break
        
        if not overlap and scan_time > cutoff_time:
            slots.append(scan_time.strftime("%Y-%m-%dT%H:%M:%SZ"))
                
        scan_time += timedelta(minutes=30) # Step by 30 mins
        
    return slots

@router.get("/slots")
def get_available_slots(teacher_id: str, date: str, duration: int = 60, db: Session = Depends(database.get_db)):
    print(f"Inbound slot request: teacher_id={teacher_id}, date='{date}', duration={duration}")
    try:
        # Strip any accidental quotes or whitespace
        clean_date = date.strip("'\" ")
        target_date = datetime.strptime(clean_date, "%Y-%m-%d").date()
        slots = get_slots_for_day(db, teacher_id, target_date, duration)
        return {"slots": slots}
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Slot error: {str(e)}\n{error_trace}")
        raise HTTPException(status_code=400, detail=f"Slot error: {str(e)}")

@router.get("/teacher/{teacher_id}")
def get_teacher_lessons(teacher_id: str, user: Dict[str, Any] = Depends(require_teacher), db: Session = Depends(database.get_db)):
    """Get all lessons for a teacher, ordered by start_time descending. Uses joinedload to avoid N+1 queries."""
    lessons = db.query(models.Lesson).options(
        joinedload(models.Lesson.student)
    ).filter(
        models.Lesson.teacher_id == teacher_id
    ).order_by(models.Lesson.start_time.desc()).all()
    
    result = []
    for l in lessons:
        result.append({
            "id": l.id,
            "student_name": l.student.name if l.student else "Unknown",
            "student_email": l.student.email if l.student else "",
            "lesson_type": l.lesson_type,
            "start_time": (l.start_time.isoformat() + "Z") if l.start_time else None,
            "duration": l.duration,
            "price": l.price,
            "status": l.status,
            "payment_method": l.payment_method or "manual",
            "stripe_payment_link_url": l.stripe_payment_link_url or "",
            "stripe_session_id": l.stripe_session_id or "",
            "feedback_vocabulary": l.feedback_vocabulary,
            "feedback_errors": l.feedback_errors,
            "feedback_materials": l.feedback_materials,
            "student_payment_account": l.student_payment_account or "",
        })
    return {"lessons": result}

@router.post("/", response_model=dict)
def create_lesson(lesson: schemas.LessonCreate, db: Session = Depends(database.get_db)):
    # 0. Convert start_time to UTC and enforce 12 hour cutoff in UTC
    utc_start = lesson.start_time.astimezone(timezone.utc) if lesson.start_time.tzinfo else lesson.start_time.replace(tzinfo=timezone.utc)
    if utc_start < datetime.now(timezone.utc) + timedelta(hours=12):
        raise HTTPException(status_code=400, detail="Lessons must be booked at least 12 hours in advance.")

    # 0b. Check for conflicting lessons (scheduled or pending) to prevent double-booking
    utc_end = utc_start + timedelta(minutes=lesson.duration)
    # Fetch all potentially overlapping lessons for this teacher and check in Python
    existing_lessons = db.query(models.Lesson).filter(
        models.Lesson.teacher_id == lesson.teacher_id,
        models.Lesson.status.in_(["scheduled", "pending"]),
        models.Lesson.start_time < utc_end,
    ).all()
    for existing in existing_lessons:
        # Ensure DB datetime is treated as timezone-aware UTC
        existing_start = existing.start_time if existing.start_time.tzinfo else existing.start_time.replace(tzinfo=timezone.utc)
        existing_end = existing_start + timedelta(minutes=existing.duration)
        if utc_start < existing_end and utc_end > existing_start:
            raise HTTPException(status_code=409, detail="This time slot is no longer available. Please choose another time.")

    # 1. Ensure/Create Student
    db_student = db.query(student_models.Student).filter(student_models.Student.email == lesson.student_email).first()
    if not db_student:
        db_student = student_models.Student(name=lesson.student_name, email=lesson.student_email)
        db.add(db_student)
        db.commit()
        db.refresh(db_student)
    
    # 2. Get Teacher for Price
    teacher = db.query(teacher_models.Teacher).filter(teacher_models.Teacher.id == lesson.teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    # 3. Create Lesson record (stored as timezone-aware UTC datetime)
    # Use lesson-type + duration-specific pricing from centralized LESSON_TYPE_PRICING,
    # falling back to teacher's pricing_schema or hourly rate.
    price = get_lesson_price(
        lesson_type=lesson.lesson_type,
        duration=lesson.duration,
        teacher_pricing_schema=teacher.pricing_schema,
        teacher_hourly_rate=teacher.price_per_hour,
    )

    lesson_date_str = utc_start.strftime("%A, %B %d at %I:%M %p UTC") if utc_start else "TBD"

    # 4. Create the lesson record first (so we have an ID for Stripe metadata)
    db_lesson = models.Lesson(
        student_id=db_student.id,
        teacher_id=lesson.teacher_id,
        lesson_type=lesson.lesson_type,
        start_time=utc_start,  # timezone-aware UTC
        duration=lesson.duration,
        price=price,
        student_timezone=lesson.student_timezone or "UTC",
        payment_method="stripe",
    )
    db.add(db_lesson)
    db.commit()
    db.refresh(db_lesson)

    # 5. Build Stripe Payment Link URL with client_reference_id={lesson_id}
    from app.utils.stripe import get_payment_link_url, is_stripe_configured
    stripe_checkout_url: Optional[str] = None
    payment_method = "stripe" if is_stripe_configured() else "manual"

    if is_stripe_configured():
        stripe_checkout_url = get_payment_link_url(
            duration=lesson.duration,
            lesson_id=db_lesson.id,
            student_email=db_student.email,
        )
        if stripe_checkout_url:
            db_lesson.stripe_payment_link_url = stripe_checkout_url
            db_lesson.payment_method = "stripe"
        else:
            db_lesson.payment_method = "manual"
        db.commit()
        db.refresh(db_lesson)
    else:
        db_lesson.payment_method = "manual"
        db.commit()
        db.refresh(db_lesson)

    # 6. Send confirmation email to student immediately upon booking
    from app.utils.email import send_lesson_confirmation, send_teacher_notification
    send_lesson_confirmation(
        student_email=db_student.email,
        student_name=db_student.name,
        lesson_date=lesson_date_str,
        duration=db_lesson.duration,
        lesson_type=db_lesson.lesson_type
    )

    # 6b. Send teacher notification immediately — don't wait for webhook
    payment_account_info = "Stripe payment — waiting for checkout completion" if db_lesson.payment_method == "stripe" else f"Manual payment — student email: {db_student.email}"
    send_teacher_notification(
        student_name=db_student.name,
        lesson_date=lesson_date_str,
        duration=db_lesson.duration,
        lesson_type=db_lesson.lesson_type,
        student_payment_account=payment_account_info,
    )

    # 7. Return response — includes the Stripe Checkout URL if configured
    return {
        "lesson_id": db_lesson.id,
        "client_secret": None,
        "price": price,
        "student_id": db_student.id,
        "student_name": db_student.name,
        "student_email": db_student.email,
        "stripe_payment_link_url": stripe_checkout_url,
        "payment_method": payment_method,
    }


@router.get("/price")
def lookup_lesson_price(
    lesson_type: str,
    duration: int = 60,
    teacher_id: Optional[str] = None,
    db: Session = Depends(database.get_db),
):
    """
    Return the total price for a given lesson_type + duration combination.
    Optionally accepts a teacher_id to fall back to teacher-specific pricing.
    Does NOT require authentication — the frontend needs this before booking.
    """
    if duration not in schemas.VALID_DURATIONS:
        raise HTTPException(status_code=400, detail=f"Invalid duration {duration}. Must be one of: {sorted(schemas.VALID_DURATIONS)}")

    # Gather teacher fallback data if a teacher_id was provided
    teacher_pricing_schema = None
    teacher_hourly_rate = 30.95
    if teacher_id:
        teacher = db.query(teacher_models.Teacher).filter(teacher_models.Teacher.id == teacher_id).first()
        if teacher:
            teacher_pricing_schema = teacher.pricing_schema
            teacher_hourly_rate = teacher.price_per_hour

    price = get_lesson_price(
        lesson_type=lesson_type,
        duration=duration,
        teacher_pricing_schema=teacher_pricing_schema,
        teacher_hourly_rate=teacher_hourly_rate,
    )

    return {
        "lesson_type": lesson_type,
        "duration": duration,
        "price": price,
        "currency": "EUR",
    }


@router.patch("/{lesson_id}/reschedule")
def reschedule_lesson(lesson_id: str, new_start_time: str, user: Dict[str, Any] = Depends(require_student), db: Session = Depends(database.get_db)):
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    if lesson.status != "scheduled":
        raise HTTPException(status_code=400, detail="Only scheduled lessons can be rescheduled")
        
    # 24h Check - lesson.start_time is timezone-aware UTC
    now = datetime.now(timezone.utc)
    lesson_start = lesson.start_time if lesson.start_time.tzinfo else lesson.start_time.replace(tzinfo=timezone.utc)
    if lesson_start - now < timedelta(hours=24):
        raise HTTPException(status_code=400, detail="Lessons can only be rescheduled up to 24 hours in advance.")
        
    # Availability Check for new time
    try:
        new_time = datetime.fromisoformat(new_start_time.replace('Z', '+00:00'))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format for new_start_time")
        
    # Convert to timezone-aware UTC
    utc_new_time = new_time.astimezone(timezone.utc) if new_time.tzinfo else new_time.replace(tzinfo=timezone.utc)
    
    lesson.start_time = utc_new_time  # store as timezone-aware UTC
    db.commit()
    db.refresh(lesson)
    
    # Update Stripe Checkout Session metadata if this was a stripe-paid lesson.
    # Keeps the 'slot' field in sync for reconciliation and support lookups.
    if lesson.stripe_session_id:
        from app.utils.stripe import update_session_metadata
        new_slot_iso = utc_new_time.strftime("%Y-%m-%dT%H:%M:%SZ")
        update_session_metadata(
            lesson.stripe_session_id,
            {"slot": new_slot_iso, "rescheduled": "true"}
        )
    
    # Trigger notifications (mock or real)
    print(f"Lesson {lesson_id} rescheduled to {new_start_time}")
    
    return {
        "status": "success",
        "lesson_id": lesson.id,
        "new_start_time": (lesson.start_time.isoformat() + "Z") if lesson.start_time else None,
        "stripe_metadata_updated": bool(lesson.stripe_session_id),
    }

@router.patch("/{lesson_id}/cancel")
def cancel_lesson(lesson_id: str, user: Dict[str, Any] = Depends(require_student), db: Session = Depends(database.get_db)):
    """Student cancels their own scheduled lesson. The time slot becomes available again.
    
    """
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # Verify the lesson belongs to the authenticated student
    if lesson.student_id != user["sub"]:
        raise HTTPException(status_code=403, detail="You can only cancel your own lessons.")

    if lesson.status not in ("scheduled", "pending"):
        raise HTTPException(status_code=400, detail="Only scheduled or pending lessons can be cancelled.")

    # 24h check - lesson.start_time is timezone-aware UTC
    now = datetime.now(timezone.utc)
    lesson_start = lesson.start_time if lesson.start_time.tzinfo else lesson.start_time.replace(tzinfo=timezone.utc)
    if lesson_start - now < timedelta(hours=24):
        raise HTTPException(status_code=400, detail="Lessons can only be cancelled up to 24 hours in advance.")

    lesson.status = "cancelled"
    db.commit()
    db.refresh(lesson)

    return {
        "status": "success",
        "message": "Lesson cancelled. The time slot is now available for other students.",
        "lesson_id": lesson.id,
    }


@router.patch("/{lesson_id}/teacher-cancel")
def teacher_cancel_lesson(lesson_id: str, user: Dict[str, Any] = Depends(require_teacher), db: Session = Depends(database.get_db)):
    """Teacher cancels (rejects) a lesson — any status except completed.

    If the lesson was paid via Stripe, a full refund is issued automatically.
    The student is notified by email. No 24h restriction applies; the teacher
    can cancel at any time.
    """
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    if lesson.status == "completed":
        raise HTTPException(status_code=400, detail="Completed lessons cannot be cancelled.")

    old_status = lesson.status

    # ── Issue Stripe refund if the lesson was paid ──────────────────────────
    refund_status: Optional[str] = None
    if lesson.stripe_session_id and lesson.payment_method == "stripe":
        from app.utils.stripe import refund_checkout_session
        refunded = refund_checkout_session(lesson.stripe_session_id)
        refund_status = "refunded" if refunded else "refund_failed"
        if refunded:
            print(f"[TEACHER-CANCEL] Full Stripe refund issued for lesson {lesson_id} "
                  f"(session={lesson.stripe_session_id}).")
        else:
            print(f"[TEACHER-CANCEL] WARNING — refund attempt failed for lesson {lesson_id} "
                  f"(session={lesson.stripe_session_id}). Check Stripe dashboard manually.")

    lesson.status = "cancelled"
    db.commit()
    db.refresh(lesson)

    # ── Send rejection emails ──────────────────────────────────────────────
    from app.utils.email import send_student_rejection_email, send_teacher_rejection_confirmation_email

    student = db.query(student_models.Student).filter(
        student_models.Student.id == lesson.student_id
    ).first()

    lesson_date_str = lesson.start_time.strftime("%A, %B %d at %I:%M %p UTC") if lesson.start_time else "TBD"

    if student:
        send_student_rejection_email(
            student_email=student.email,
            student_name=student.name,
            lesson_date=lesson_date_str,
            lesson_type=lesson.lesson_type,
            price=lesson.price,
        )

    # Teacher notification
    teacher = db.query(teacher_models.Teacher).filter(
        teacher_models.Teacher.id == lesson.teacher_id
    ).first()
    teacher_email = os.getenv("TEACHER_NOTIFICATION_EMAIL", "")
    teacher_name = teacher.name if teacher else user.get("name", "Teacher")

    send_teacher_rejection_confirmation_email(
        teacher_email=teacher_email,
        teacher_name=teacher_name,
        student_name=student.name if student else "Unknown",
        lesson_date=lesson_date_str,
        lesson_type=lesson.lesson_type,
    )

    return {
        "status": "success",
        "message": "Lesson cancelled by teacher. The student has been notified.",
        "lesson_id": lesson.id,
        "refund": refund_status,
    }


@router.get("/verify-payment/{session_id}")
def verify_payment(session_id: str, db: Session = Depends(database.get_db)):
    """
    Fallback for Stripe webhook reliability.

    The frontend calls this from /payment-success to poll Stripe directly
    and confirm the lesson when the webhook hasn't fired yet.

    If payment_status = "paid" but the associated lesson is still "pending",
    this endpoint promotes it to "scheduled" immediately.
    """
    from app.utils.stripe import is_stripe_configured
    import stripe

    if not is_stripe_configured():
        return {
            "status": "unconfigured",
            "message": "Stripe is not configured on this server.",
        }

    stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")

    try:
        session = stripe.checkout.Session.retrieve(session_id)
    except stripe.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid or expired session: {str(e)}")

    payment_status = session.get("payment_status")
    metadata = session.get("metadata", {}) or {}
    payment_type = metadata.get("payment_type", "lesson")

    if payment_status != "paid":
        return {
            "status": "pending",
            "message": "Payment has not been completed yet.",
            "payment_status": payment_status,
        }

    # ── Lesson payment ───────────────────────────────────────────────
    booking_id = metadata.get("booking_id")
    client_reference_id = session.get("client_reference_id")

    # 1. Look up by stripe_session_id
    lesson = db.query(models.Lesson).filter(
        models.Lesson.stripe_session_id == session_id
    ).first()

    # 2. Look up by booking_id in metadata (checkout-session approach)
    if not lesson and booking_id:
        lesson = db.query(models.Lesson).filter(
            models.Lesson.id == booking_id
        ).first()

    # 3. Look up by client_reference_id (Payment Link approach)
    if not lesson and client_reference_id:
        lesson = db.query(models.Lesson).filter(
            models.Lesson.id == client_reference_id
        ).first()

    if lesson:
        was_pending = lesson.status == "pending"

        # Always fill in the stripe_session_id if missing
        if not lesson.stripe_session_id:
            lesson.stripe_session_id = session_id
        if not lesson.payment_method or lesson.payment_method == "manual":
            lesson.payment_method = "stripe"

        # Promote from pending → scheduled when payment is confirmed
        if lesson.status == "pending":
            lesson.status = "scheduled"
            db.commit()
            db.refresh(lesson)
            print(f"[VERIFY-PAYMENT] Lesson {lesson.id} promoted pending→scheduled via fallback.")

            # Send teacher notification (webhook may have been missed)
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
                    student_payment_account=f"Stripe session: {session_id}",
                )
        elif not was_pending and lesson.stripe_session_id != session_id:
            # Lesson already had a different session_id; update it
            lesson.stripe_session_id = session_id
            db.commit()
            db.refresh(lesson)

        return {
            "status": "confirmed",
            "message": "Lesson payment verified.",
            "record_status": lesson.status,
            "lesson_id": lesson.id,
        }
    else:
        return {
            "status": "confirmed",
            "message": "Payment verified, but no matching lesson record found. The record may take a moment to appear.",
            "payment_status": payment_status,
        }


@router.delete("/teacher/{teacher_id}")
def delete_all_teacher_lessons(
    teacher_id: str,
    user: Dict[str, Any] = Depends(require_teacher),
    db: Session = Depends(database.get_db)
):
    """Teacher permanently deletes ALL their lesson records."""
    deleted_count = db.query(models.Lesson).filter(
        models.Lesson.teacher_id == teacher_id
    ).delete(synchronize_session='fetch')
    db.commit()

    return {
        "status": "success",
        "message": f"{deleted_count} lesson(s) have been permanently deleted.",
        "deleted_count": deleted_count,
    }


@router.patch("/{lesson_id}/feedback")
def update_lesson_feedback(
    lesson_id: str,
    feedback: schemas.LessonFeedbackUpdate,
    status: Optional[str] = None,
    user: Dict[str, Any] = Depends(require_teacher),
    db: Session = Depends(database.get_db)
):
    db_lesson = db.query(models.Lesson).options(
        joinedload(models.Lesson.student),
        joinedload(models.Lesson.teacher),
    ).filter(models.Lesson.id == lesson_id).first()
    if not db_lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # Capture old status before mutation so we can detect transitions
    old_status = db_lesson.status

    if feedback.feedback_vocabulary is not None:
        db_lesson.feedback_vocabulary = feedback.feedback_vocabulary
    if feedback.feedback_errors is not None:
        db_lesson.feedback_errors = feedback.feedback_errors
    if feedback.feedback_materials is not None:
        db_lesson.feedback_materials = feedback.feedback_materials

    if status is not None:
        if status not in ["pending", "scheduled", "completed", "cancelled"]:
            raise HTTPException(status_code=400, detail="Invalid status value")
        db_lesson.status = status

    new_status = db_lesson.status

    db.commit()
    db.refresh(db_lesson)

    # --- Send notification emails on status transitions ---
    # NOTE: Payment-backed (stripe) lessons transition pending→scheduled
    # automatically via the Stripe webhook. The teacher-accept path below
    # only fires for non-stripe/manual lessons or edge cases where the
    # teacher explicitly promotes a pending lesson.
    if old_status != new_status:
        from app.utils.email import (
            send_teacher_acceptance_email,
            send_student_acceptance_email,
            send_student_rejection_email,
            send_teacher_rejection_confirmation_email,
        )
        lesson_date_str = db_lesson.start_time.strftime("%A, %B %d at %I:%M %p UTC") if db_lesson.start_time else "TBD"

        # Teacher info (model has no email field, use env var)
        teacher = db_lesson.teacher
        teacher_email = os.getenv("TEACHER_NOTIFICATION_EMAIL", "")
        teacher_name = teacher.name if teacher else "Marta"

        # Student info
        student = db_lesson.student
        student_email = student.email if student else ""
        student_name = student.name if student else "Student"

        if old_status == "pending" and new_status == "scheduled":
            # Teacher manually accepted a non-stripe/manual lesson
            # (Payment-backed lessons skip this path entirely; the webhook auto-schedules them)
            if student_email:
                send_student_acceptance_email(
                    student_email=student_email,
                    student_name=student_name,
                    lesson_date=lesson_date_str,
                    duration=db_lesson.duration,
                    lesson_type=db_lesson.lesson_type,
                )
            send_teacher_acceptance_email(
                teacher_email=teacher_email,
                teacher_name=teacher_name,
                student_name=student_name,
                lesson_date=lesson_date_str,
                lesson_type=db_lesson.lesson_type,
            )

        elif old_status == "pending" and new_status == "cancelled":
            # Teacher rejected a pending (unpaid/manual) lesson — notify student about refund
            if student_email:
                send_student_rejection_email(
                    student_email=student_email,
                    student_name=student_name,
                    lesson_date=lesson_date_str,
                    lesson_type=db_lesson.lesson_type,
                    price=db_lesson.price,
                )
            send_teacher_rejection_confirmation_email(
                teacher_email=teacher_email,
                teacher_name=teacher_name,
                student_name=student_name,
                lesson_date=lesson_date_str,
                lesson_type=db_lesson.lesson_type,
            )

        elif old_status == "scheduled" and new_status == "cancelled":
            # Teacher cancelled an already-scheduled (paid) lesson — issue Stripe refund
            refund_status: Optional[str] = None
            if db_lesson.stripe_session_id and db_lesson.payment_method == "stripe":
                from app.utils.stripe import refund_checkout_session
                refunded = refund_checkout_session(db_lesson.stripe_session_id)
                refund_status = "refunded" if refunded else "refund_failed"
                if refunded:
                    print(f"[FEEDBACK-CANCEL] Full Stripe refund issued for lesson {lesson_id} "
                          f"(session={db_lesson.stripe_session_id}).")
                else:
                    print(f"[FEEDBACK-CANCEL] WARNING — refund attempt failed for lesson {lesson_id} "
                          f"(session={db_lesson.stripe_session_id}). Check Stripe dashboard manually.")

            # Notify student and teacher
            if student_email:
                send_student_rejection_email(
                    student_email=student_email,
                    student_name=student_name,
                    lesson_date=lesson_date_str,
                    lesson_type=db_lesson.lesson_type,
                    price=db_lesson.price,
                )
            send_teacher_rejection_confirmation_email(
                teacher_email=teacher_email,
                teacher_name=teacher_name,
                student_name=student_name,
                lesson_date=lesson_date_str,
                lesson_type=db_lesson.lesson_type,
            )

    return db_lesson
