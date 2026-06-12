from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
import zoneinfo

from app.database.database import get_db
from app.models.package import StudentPackage
from app.models.student import Student
from app.models.lesson import Lesson
from app.models import teacher as teacher_models
from pydantic import BaseModel, field_validator
from datetime import datetime, timezone, timedelta

from app.utils.auth import require_student

router = APIRouter(prefix="/api/v1/packages", tags=["packages"])

# Pricing: base prices in EUR with 3% discount for packages
BASE_PRICES = {30: 16.34, 45: 23.56, 60: 30.95}
PACKAGE_DISCOUNT = 0.03
LESSONS_PER_PACKAGE = 5

VALID_DURATIONS = {30, 45, 60}
VALID_LESSON_TYPES = [
    "Conversación", "Conversacion", "Curso Básico", "Curso Basico",
    "Basic Course", "Conversation", "Examen DELE",
    "Entrevista de Trabajo", "Grammar", "Gramática",
]


class PurchasePackageRequest(BaseModel):
    student_id: str
    duration: int  # 30, 45, or 60

    @field_validator("duration")
    @classmethod
    def validate_duration(cls, v: int) -> int:
        if v not in VALID_DURATIONS:
            raise ValueError(f"Invalid duration {v}. Must be one of: {sorted(VALID_DURATIONS)}")
        return v


class BookWithPackageRequest(BaseModel):
    package_id: str
    teacher_id: str
    lesson_type: str
    start_time: datetime
    student_timezone: str = "UTC"

    @field_validator("lesson_type")
    @classmethod
    def validate_lesson_type(cls, v: str) -> str:
        if v not in VALID_LESSON_TYPES:
            raise ValueError(f"Invalid lesson_type '{v}'. Must be one of: {', '.join(VALID_LESSON_TYPES)}")
        return v

    @field_validator("student_timezone")
    @classmethod
    def validate_timezone(cls, v: str) -> str:
        try:
            zoneinfo.ZoneInfo(v)
            return v
        except (zoneinfo.ZoneInfoNotFoundError, KeyError):
            raise ValueError(f"Invalid IANA timezone '{v}'.")


@router.post("/purchase")
def purchase_package(data: PurchasePackageRequest, user: Dict[str, Any] = Depends(require_student), db: Session = Depends(get_db)):
    if data.duration not in BASE_PRICES:
        raise HTTPException(status_code=400, detail="Invalid duration. Must be 30, 45, or 60.")

    student = db.query(Student).filter(Student.id == data.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    single_price = BASE_PRICES[data.duration]
    package_price = round(single_price * LESSONS_PER_PACKAGE * (1 - PACKAGE_DISCOUNT), 2)

    # Create the package record first (so we have an ID for Stripe metadata)
    from app.utils.stripe import create_package_checkout_session, is_stripe_configured
    payment_method = "stripe" if is_stripe_configured() else "manual"
    initial_status = "pending" if is_stripe_configured() else "active"

    pkg = StudentPackage(
        student_id=data.student_id,
        duration=data.duration,
        total_lessons=LESSONS_PER_PACKAGE,
        remaining_lessons=LESSONS_PER_PACKAGE,
        price_paid=package_price,
        status=initial_status,
        payment_method=payment_method,
    )
    db.add(pkg)
    db.commit()
    db.refresh(pkg)

    # Create Stripe Checkout Session if configured
    stripe_checkout_url: Optional[str] = None
    if is_stripe_configured():
        stripe_session_id, stripe_checkout_url = create_package_checkout_session(
            package_id=pkg.id,
            duration=data.duration,
            price_eur=package_price,
            student_name=student.name,
            student_email=student.email,
            total_lessons=LESSONS_PER_PACKAGE,
        )
        if stripe_session_id:
            pkg.stripe_session_id = stripe_session_id
        if stripe_checkout_url:
            pkg.stripe_payment_link_url = stripe_checkout_url
        if stripe_session_id or stripe_checkout_url:
            pkg.payment_method = "stripe"
        else:
            pkg.payment_method = "manual"
        db.commit()
        db.refresh(pkg)

    return {
        "package_id": pkg.id,
        "client_secret": None,
        "price": package_price,
        "stripe_payment_link_url": stripe_checkout_url,
        "payment_method": payment_method,
    }


@router.post("/book-with-package")
def book_with_package(data: BookWithPackageRequest, user: Dict[str, Any] = Depends(require_student), db: Session = Depends(get_db)):
    pkg = db.query(StudentPackage).filter(StudentPackage.id == data.package_id).first()
    if not pkg or pkg.status != "active" or pkg.remaining_lessons <= 0:
        raise HTTPException(status_code=400, detail="No available credits in this package")

    # Convert to UTC and enforce 12 hour cutoff in UTC
    utc_start = data.start_time.astimezone(timezone.utc) if data.start_time.tzinfo else data.start_time.replace(tzinfo=timezone.utc)
    if utc_start < datetime.now(timezone.utc) + timedelta(hours=12):
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
        start_time=utc_start,  # timezone-aware UTC
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
def get_student_packages(student_id: str, user: Dict[str, Any] = Depends(require_student), db: Session = Depends(get_db)):
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
