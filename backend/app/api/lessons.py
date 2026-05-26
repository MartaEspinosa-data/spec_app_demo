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
            "feedback_vocabulary": l.feedback_vocabulary,
            "feedback_errors": l.feedback_errors,
            "feedback_materials": l.feedback_materials,
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
        existing_end = existing.start_time + timedelta(minutes=existing.duration)
        if utc_start < existing_end and utc_end > existing.start_time:
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
    # Use duration-specific pricing from teacher's pricing_schema, fall back to proportional
    if teacher.pricing_schema and str(lesson.duration) in teacher.pricing_schema:
        price = float(teacher.pricing_schema[str(lesson.duration)])
    else:
        price = teacher.price_per_hour * (lesson.duration / 60.0)
    db_lesson = models.Lesson(
        student_id=db_student.id,
        teacher_id=lesson.teacher_id,
        lesson_type=lesson.lesson_type,
        start_time=utc_start,  # timezone-aware UTC
        duration=lesson.duration,
        price=price,
        student_timezone=lesson.student_timezone or "UTC",
    )
    db.add(db_lesson)
    db.commit()
    db.refresh(db_lesson)

    # 4. Send confirmation email to student immediately upon booking
    from app.utils.email import send_lesson_confirmation
    lesson_date_str = db_lesson.start_time.strftime("%A, %B %d at %I:%M %p UTC") if db_lesson.start_time else "TBD"
    send_lesson_confirmation(
        student_email=db_student.email,
        student_name=db_student.name,
        lesson_date=lesson_date_str,
        duration=db_lesson.duration,
        lesson_type=db_lesson.lesson_type
    )

    # 5. Return Manual Payment Booking Response
    return {
        "lesson_id": db_lesson.id,
        "client_secret": None,
        "price": price,
        "student_id": db_student.id,
        "student_name": db_student.name,
        "student_email": db_student.email,
    }


@router.post("/confirm-payment")
def confirm_payment(data: dict, db: Session = Depends(database.get_db)):
    """Called by the frontend after manual payment completes to notify teacher."""
    lesson_id = data.get("lesson_id")
    if not lesson_id:
        raise HTTPException(status_code=400, detail="lesson_id is required")
    
    db_lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not db_lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Keep status as pending until teacher manually approves
    db_lesson.status = "pending"
    db.commit()
    
    # Send manual booking notifications
    from app.utils.email import send_lesson_confirmation, send_teacher_notification
    student = db.query(student_models.Student).filter(student_models.Student.id == db_lesson.student_id).first()
    if student:
        lesson_date_str = db_lesson.start_time.strftime("%A, %B %d at %I:%M %p UTC") if db_lesson.start_time else "TBD"
        send_lesson_confirmation(
            student_email=student.email,
            student_name=student.name,
            lesson_date=lesson_date_str,
            duration=db_lesson.duration,
            lesson_type=db_lesson.lesson_type
        )
        # Notify Teacher
        send_teacher_notification(
            student_name=student.name,
            lesson_date=lesson_date_str,
            duration=db_lesson.duration,
            lesson_type=db_lesson.lesson_type
        )
    
    return {"status": "pending_approval", "lesson_id": lesson_id}


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
    
    # Trigger notifications (mock or real)
    print(f"Lesson {lesson_id} rescheduled to {new_start_time}")
    
    return {
        "status": "success",
        "lesson_id": lesson.id,
        "new_start_time": (lesson.start_time.isoformat() + "Z") if lesson.start_time else None
    }

@router.patch("/{lesson_id}/cancel")
def cancel_lesson(lesson_id: str, user: Dict[str, Any] = Depends(require_student), db: Session = Depends(database.get_db)):
    """Student cancels their own scheduled lesson. The time slot becomes available again."""
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

    db.commit()
    db.refresh(db_lesson)

    # --- Send notification emails on status transitions ---
    new_status = db_lesson.status
    if old_status != new_status:
        from app.utils.email import (
            send_teacher_acceptance_email,
            send_student_acceptance_email,
            send_student_rejection_email,
            send_teacher_rejection_confirmation_email,
        )
        lesson_date_str = db_lesson.start_time.strftime("%A, %B %d at %I:%M %p UTC") if db_lesson.start_time else "TBD"

        # Teacher info
        teacher = db_lesson.teacher
        teacher_email = teacher.email if (teacher and teacher.email) else os.getenv("TEACHER_NOTIFICATION_EMAIL", "martaespinosagarcia@gmail.com")
        teacher_name = teacher.name if teacher else "Marta"

        # Student info
        student = db_lesson.student
        student_email = student.email if student else ""
        student_name = student.name if student else "Student"

        if old_status == "pending" and new_status == "scheduled":
            # Teacher accepted the lesson
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
            # Teacher rejected the lesson — notify student about refund
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
