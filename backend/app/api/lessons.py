from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import database
from app.models import lesson as models
from app.models import student as student_models
from app.models import teacher as teacher_models
from app.schemas import lesson as schemas
from datetime import datetime, time, timedelta, date as date_type
import stripe
import os

router = APIRouter(prefix="/api/lessons", tags=["lessons"])
stripe.api_key = os.getenv("STRIPE_API_KEY", "sk_test_placeholder")

from app.models.availability import TeacherAvailability

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
    
    current_time = datetime.combine(target_date, start_time)
    end_working_time = datetime.combine(target_date, end_time)
    
    # Get existing scheduled lessons for this day
    existing_lessons = db.query(models.Lesson).filter(
        models.Lesson.teacher_id == teacher_id,
        models.Lesson.start_time >= current_time,
        models.Lesson.start_time < end_working_time,
        models.Lesson.status == "scheduled"
    ).all()
    
    # Generate 30-min candidate slots
    slots = []
    scan_time = current_time
    
    # We enforce 12 hours ahead constraint
    cutoff_time = datetime.utcnow() + timedelta(hours=12)
    
    while scan_time + timedelta(minutes=duration) <= end_working_time:
        # Check overlaps
        slot_end = scan_time + timedelta(minutes=duration)
        overlap = False
        for l in existing_lessons:
            l_end = l.start_time + timedelta(minutes=l.duration)
            if (scan_time < l_end and slot_end > l.start_time):
                overlap = True
                break
        
        if not overlap and scan_time > cutoff_time:
            slots.append(scan_time.isoformat() + "Z")
                
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
        print(f"Slot error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid date format '{date}'. Exception: {str(e)}")

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
            "start_time": l.start_time.isoformat() if l.start_time else None,
            "duration": l.duration,
            "price": l.price,
            "status": l.status,
        })
    return {"lessons": result}

@router.post("/", response_model=dict)
def create_lesson(lesson: schemas.LessonCreate, db: Session = Depends(database.get_db)):
    # 0. Enforce 12 hour cutoff
    if lesson.start_time.replace(tzinfo=None) < datetime.utcnow() + timedelta(hours=12):
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
        start_time=lesson.start_time.replace(tzinfo=None), # SQLite naive mapping
        duration=lesson.duration,
        price=price,
        student_timezone=lesson.student_timezone or "UTC",
        calendly_event_id=lesson.calendly_event_id
    )
    db.add(db_lesson)
    db.commit()
    db.refresh(db_lesson)

    # 4. Create Stripe PaymentIntent for card payment
    try:
        payment_intent = stripe.PaymentIntent.create(
            amount=int(price * 100),  # cents
            currency="usd",
            payment_method_types=["card"],  # card + Google Pay, no Amazon Pay
            metadata={
                "lesson_id": db_lesson.id,
                "student_email": lesson.student_email,
                "student_name": lesson.student_name,
            },
            description=f"Spanish Lesson ({lesson.lesson_type}) - {lesson.duration}min",
        )
        return {
            "lesson_id": db_lesson.id,
            "client_secret": payment_intent.client_secret,
            "price": price,
        }
    except Exception as e:
        print(f"Stripe PaymentIntent error: {e}")
        # Fallback: auto-schedule if Stripe fails
        db_lesson.status = "scheduled"
        db.commit()
        return {
            "lesson_id": db_lesson.id,
            "client_secret": None,
            "price": price,
        }


@router.post("/confirm-payment")
def confirm_payment(data: dict, db: Session = Depends(database.get_db)):
    """Called by the frontend after Stripe payment succeeds to mark lesson as scheduled and send email."""
    lesson_id = data.get("lesson_id")
    if not lesson_id:
        raise HTTPException(status_code=400, detail="lesson_id is required")
    
    db_lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not db_lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    db_lesson.status = "scheduled"
    db.commit()
    
    # Send confirmation email
    from app.utils.email import send_lesson_confirmation
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
    
    return {"status": "confirmed", "lesson_id": lesson_id}
