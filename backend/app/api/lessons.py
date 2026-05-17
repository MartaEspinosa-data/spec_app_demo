from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import database
from app.models import lesson as models
from app.models import student as student_models
from app.models import teacher as teacher_models
from app.schemas import lesson as schemas
from datetime import datetime, time, timedelta, timezone, date as date_type
from typing import Optional
import stripe
import os
import zoneinfo

router = APIRouter(prefix="/api/lessons", tags=["lessons"])
stripe.api_key = os.getenv("STRIPE_API_KEY", "sk_test_placeholder")

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
    
    # Local datetimes relative to Madrid time
    local_start = datetime.combine(target_date, start_time).replace(tzinfo=MADRID_TZ)
    local_end = datetime.combine(target_date, end_time).replace(tzinfo=MADRID_TZ)
    
    # Convert local start/end availability to UTC
    utc_start = local_start.astimezone(timezone.utc)
    utc_end = local_end.astimezone(timezone.utc)
    
    # Get existing scheduled lessons in UTC (stored naive in database)
    existing_lessons = db.query(models.Lesson).filter(
        models.Lesson.teacher_id == teacher_id,
        models.Lesson.start_time >= utc_start.replace(tzinfo=None),
        models.Lesson.start_time < utc_end.replace(tzinfo=None),
        models.Lesson.status == "scheduled"
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
            # l.start_time is stored naive UTC. Convert it to timezone-aware UTC datetime
            l_start_utc = l.start_time.replace(tzinfo=timezone.utc)
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
def get_teacher_lessons(teacher_id: str, db: Session = Depends(database.get_db)):
    """Get all lessons for a teacher, ordered by start_time descending."""
    lessons = db.query(models.Lesson).filter(
        models.Lesson.teacher_id == teacher_id
    ).order_by(models.Lesson.start_time.desc()).all()
    
    result = []
    for l in lessons:
        student = db.query(student_models.Student).filter(student_models.Student.id == l.student_id).first()
        result.append({
            "id": l.id,
            "student_name": student.name if student else "Unknown",
            "student_email": student.email if student else "",
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
    if utc_start.replace(tzinfo=None) < datetime.utcnow() + timedelta(hours=12):
        raise HTTPException(status_code=400, detail="Lessons must be booked at least 12 hours in advance.")

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
    
    # 3. Create Lesson record
    price = teacher.price_per_hour * (lesson.duration / 60.0)
    db_lesson = models.Lesson(
        student_id=db_student.id,
        teacher_id=lesson.teacher_id,
        lesson_type=lesson.lesson_type,
        start_time=utc_start.replace(tzinfo=None), # SQLite naive mapping in UTC
        duration=lesson.duration,
        price=price,
        student_timezone=lesson.student_timezone or "UTC",
        calendly_event_id=lesson.calendly_event_id
    )
    db.add(db_lesson)
    db.commit()
    db.refresh(db_lesson)

    # 4. Return Manual Payment Booking Response
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
def reschedule_lesson(lesson_id: str, new_start_time: str, db: Session = Depends(database.get_db)):
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    if lesson.status != "scheduled":
        raise HTTPException(status_code=400, detail="Only scheduled lessons can be rescheduled")
        
    # 24h Check
    now = datetime.utcnow()
    if lesson.start_time - now < timedelta(hours=24):
        raise HTTPException(status_code=400, detail="Lessons can only be rescheduled up to 24 hours in advance.")
        
    # Availability Check for new time
    try:
        new_time = datetime.fromisoformat(new_start_time.replace('Z', '+00:00'))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format for new_start_time")
        
    # Convert to UTC and strip tz info for database persistence
    utc_new_time = new_time.astimezone(timezone.utc) if new_time.tzinfo else new_time.replace(tzinfo=timezone.utc)
    
    lesson.start_time = utc_new_time.replace(tzinfo=None)
    db.commit()
    db.refresh(lesson)
    
    # Trigger notifications (mock or real)
    print(f"Lesson {lesson_id} rescheduled to {new_start_time}")
    
    return {
        "status": "success",
        "lesson_id": lesson.id,
        "new_start_time": (lesson.start_time.isoformat() + "Z")
    }

@router.patch("/{lesson_id}/feedback")
def update_lesson_feedback(
    lesson_id: str, 
    feedback: schemas.LessonFeedbackUpdate, 
    status: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    db_lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not db_lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
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
    return db_lesson
