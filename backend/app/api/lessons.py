from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import database
from app.models import lesson as models
from app.models import student as student_models
from app.models import teacher as teacher_models
from app.schemas import lesson as schemas
import stripe
import os

router = APIRouter(prefix="/api/lessons", tags=["lessons"])
stripe.api_key = os.getenv("STRIPE_API_KEY", "sk_test_placeholder")

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
