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

def get_slots_for_day(db: Session, teacher_id: str, target_date: date_type):
    # Working hours: 09:00 to 17:00
    start_hour = 9
    end_hour = 17
    slots = []
    
    current_time = datetime.combine(target_date, time(start_hour))
    end_working_time = datetime.combine(target_date, time(end_hour))
    
    print(f"Calculating slots for {teacher_id} on {target_date}")
    
    # Get existing scheduled lessons for this day
    existing_lessons = db.query(models.Lesson).filter(
        models.Lesson.teacher_id == teacher_id,
        models.Lesson.start_time >= current_time,
        models.Lesson.start_time < end_working_time + timedelta(hours=1),
        models.Lesson.status == "scheduled"
    ).all()
    
    occupied_starts = {l.start_time for l in existing_lessons}
    print(f"Occupied slots: {occupied_starts}")
    
    while current_time < end_working_time:
        if current_time not in occupied_starts:
            slots.append(current_time.isoformat())
        current_time += timedelta(hours=1)
        
    print(f"Generated slots: {len(slots)}")
    return slots

@router.get("/slots")
def get_available_slots(teacher_id: str, date: str, db: Session = Depends(database.get_db)):
    print(f"Inbound slot request: teacher_id={teacher_id}, date='{date}'")
    try:
        # Strip any accidental quotes or whitespace
        clean_date = date.strip("'\" ")
        target_date = datetime.strptime(clean_date, "%Y-%m-%d").date()
        slots = get_slots_for_day(db, teacher_id, target_date)
        return {"slots": slots}
    except Exception as e:
        print(f"Slot error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid date format '{date}'. Exception: {str(e)}")

@router.post("/", response_model=dict)
def create_lesson(lesson: schemas.LessonCreate, db: Session = Depends(database.get_db)):
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
    db_lesson = models.Lesson(
        student_id=db_student.id,
        teacher_id=lesson.teacher_id,
        lesson_type=lesson.lesson_type,
        start_time=lesson.start_time,
        duration=lesson.duration,
        price=teacher.price_per_hour,
        calendly_event_id=lesson.calendly_event_id
    )
    db.add(db_lesson)
    db.commit()
    db.refresh(db_lesson)

    # 4. Create Stripe Session
    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": f"Spanish Lesson ({lesson.lesson_type})",
                        "description": f"Teacher: {teacher.name}, Start Time: {lesson.start_time}",
                    },
                    "unit_amount": int(db_lesson.price * 100),
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=f"{os.getenv('FRONTEND_URL')}/payment-success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{os.getenv('FRONTEND_URL')}/profile/{teacher.id}",
            metadata={"lesson_id": db_lesson.id},
        )
        return {
            "lesson_id": db_lesson.id,
            "stripe_checkout_url": checkout_session.url
        }
    except Exception as e:
        # For demo purposes if Stripe fails, still return lesson_id with a local path
        return {
            "lesson_id": db_lesson.id,
            "stripe_checkout_url": f"/payment-success?debug=true&lesson_id={db_lesson.id}"
        }
