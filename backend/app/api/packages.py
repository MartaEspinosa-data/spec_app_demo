from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.package import StudentPackage
from app.models.student import Student
from app.models.lesson import Lesson
from app.models import teacher as teacher_models
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
import stripe
import os

router = APIRouter(prefix="/api/packages", tags=["packages"])
stripe.api_key = os.getenv("STRIPE_API_KEY", "sk_test_placeholder")

# Pricing: base prices in USD with 3% discount for packages
BASE_PRICES = {30: 18.50, 45: 23.50, 60: 30.94}
PACKAGE_DISCOUNT = 0.03
LESSONS_PER_PACKAGE = 5


class PurchasePackageRequest(BaseModel):
    student_id: str
    duration: int  # 30, 45, or 60


class BookWithPackageRequest(BaseModel):
    package_id: str
    teacher_id: str
    lesson_type: str
    start_time: datetime
    student_timezone: str = "UTC"


@router.post("/purchase")
def purchase_package(data: PurchasePackageRequest, db: Session = Depends(get_db)):
    if data.duration not in BASE_PRICES:
        raise HTTPException(status_code=400, detail="Invalid duration. Must be 30, 45, or 60.")

    student = db.query(Student).filter(Student.id == data.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    single_price = BASE_PRICES[data.duration]
    package_price = round(single_price * LESSONS_PER_PACKAGE * (1 - PACKAGE_DISCOUNT), 2)

    # Create the package record (pending until payment confirms)
    pkg = StudentPackage(
        student_id=data.student_id,
        duration=data.duration,
        total_lessons=LESSONS_PER_PACKAGE,
        remaining_lessons=LESSONS_PER_PACKAGE,
        price_paid=package_price,
        status="pending",
    )
    db.add(pkg)
    db.commit()
    db.refresh(pkg)

    # Create Stripe PaymentIntent
    try:
        payment_intent = stripe.PaymentIntent.create(
            amount=int(package_price * 100),
            currency="usd",
            payment_method_types=["card"],
            metadata={
                "package_id": pkg.id,
                "student_id": data.student_id,
                "type": "package",
            },
            description=f"5-Lesson Package ({data.duration}min) - Spanish with Marta",
        )
        return {
            "package_id": pkg.id,
            "client_secret": payment_intent.client_secret,
            "price": package_price,
        }
    except Exception as e:
        print(f"Stripe error: {e}")
        raise HTTPException(status_code=500, detail="Payment initialization failed")


@router.post("/confirm")
def confirm_package_payment(data: dict, db: Session = Depends(get_db)):
    package_id = data.get("package_id")
    if not package_id:
        raise HTTPException(status_code=400, detail="package_id required")

    pkg = db.query(StudentPackage).filter(StudentPackage.id == package_id).first()
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")

    pkg.status = "active"
    db.commit()
    return {"status": "active", "package_id": pkg.id, "remaining_lessons": pkg.remaining_lessons}


@router.post("/book-with-package")
def book_with_package(data: BookWithPackageRequest, db: Session = Depends(get_db)):
    pkg = db.query(StudentPackage).filter(StudentPackage.id == data.package_id).first()
    if not pkg or pkg.status != "active" or pkg.remaining_lessons <= 0:
        raise HTTPException(status_code=400, detail="No available credits in this package")

    # Convert to UTC and enforce 12 hour cutoff in UTC
    utc_start = data.start_time.astimezone(timezone.utc) if data.start_time.tzinfo else data.start_time.replace(tzinfo=timezone.utc)
    if utc_start.replace(tzinfo=None) < datetime.utcnow() + timedelta(hours=12):
        raise HTTPException(status_code=400, detail="Lessons must be booked at least 12 hours in advance.")

    # Get teacher for context
    teacher = db.query(teacher_models.Teacher).filter(teacher_models.Teacher.id == data.teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    # Create lesson (no payment needed — using credit)
    lesson = Lesson(
        student_id=pkg.student_id,
        teacher_id=data.teacher_id,
        lesson_type=data.lesson_type,
        start_time=utc_start.replace(tzinfo=None), # SQLite naive mapping in UTC
        duration=pkg.duration,
        price=0,  # Paid via package
        status="scheduled",
        student_timezone=data.student_timezone,
    )
    db.add(lesson)

    # Deduct credit
    pkg.remaining_lessons -= 1
    if pkg.remaining_lessons <= 0:
        pkg.status = "exhausted"

    db.commit()
    db.refresh(lesson)

    return {
        "status": "scheduled",
        "lesson_id": lesson.id,
        "remaining_lessons": pkg.remaining_lessons,
    }


@router.get("/student/{student_id}")
def get_student_packages(student_id: str, db: Session = Depends(get_db)):
    packages = db.query(StudentPackage).filter(
        StudentPackage.student_id == student_id
    ).order_by(StudentPackage.created_at.desc()).all()

    return {
        "packages": [
            {
                "id": p.id,
                "duration": p.duration,
                "total_lessons": p.total_lessons,
                "remaining_lessons": p.remaining_lessons,
                "price_paid": p.price_paid,
                "status": p.status,
            }
            for p in packages
        ]
    }
