from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session, joinedload
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta, timezone

from app.database import database
from app.models.lesson_package import LessonPackage
from app.models.lesson import Lesson
from app.models.student import Student
from app.models.teacher import Teacher
from app.utils.auth import require_student
from app.services.packages import (
    calculate_package_pricing,
    consume_package_credit,
    restore_package_credit,
    PACKAGE_SIZE,
)
from app.utils.stripe import create_package_checkout_session, is_stripe_configured
from app.utils.email import send_package_confirmation_email, send_teacher_package_notification, send_teacher_notification, send_lesson_confirmation

router = APIRouter(prefix="/api/v1/packages", tags=["packages"])


class PackagePurchaseRequest(BaseModel):
    teacher_id: str
    lesson_type: str
    duration: int = 60


class PackageBookRequest(BaseModel):
    start_time: datetime
    student_timezone: Optional[str] = "UTC"


@router.get("/preview")
def get_package_preview(
    lesson_type: str,
    duration: int = 60,
    teacher_id: Optional[str] = None,
    db: Session = Depends(database.get_db),
):
    """Calculate and return pricing breakdown for a 5-lesson bundle with 3% discount."""
    if duration not in {30, 45, 60}:
        raise HTTPException(status_code=400, detail="Duration must be 30, 45, or 60 minutes.")

    teacher = None
    if teacher_id:
        teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()

    return calculate_package_pricing(
        lesson_type=lesson_type,
        duration=duration,
        teacher=teacher,
    )


@router.post("/purchase")
def purchase_package(
    body: PackagePurchaseRequest,
    user: Dict[str, Any] = Depends(require_student),
    db: Session = Depends(database.get_db),
):
    """
    Initiate purchase of a 5-class package.
    Generates Stripe Checkout Session with dynamic price_data.
    """
    if body.duration not in {30, 45, 60}:
        raise HTTPException(status_code=400, detail="Duration must be 30, 45, or 60 minutes.")

    student = db.query(Student).filter(Student.id == user["sub"]).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    teacher = db.query(Teacher).filter(Teacher.id == body.teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found.")

    pricing = calculate_package_pricing(
        lesson_type=body.lesson_type,
        duration=body.duration,
        teacher=teacher,
    )

    # Create pending package record
    pkg = LessonPackage(
        student_id=student.id,
        teacher_id=teacher.id,
        lesson_type=body.lesson_type,
        duration=body.duration,
        total_credits=PACKAGE_SIZE,
        used_credits=0,
        discount_percent=pricing["discount_percent"],
        single_price=pricing["single_price"],
        total_price=pricing["total_price"],
        per_lesson_price=pricing["per_lesson_price"],
        status="pending",
    )
    db.add(pkg)
    db.commit()
    db.refresh(pkg)

    if is_stripe_configured():
        session_id, session_url = create_package_checkout_session(
            package_id=pkg.id,
            total_amount_eur=pkg.total_price,
            lesson_type=pkg.lesson_type,
            duration=pkg.duration,
            student_name=student.name,
            student_email=student.email,
        )
        if session_id and session_url:
            pkg.stripe_session_id = session_id
            db.commit()
            return {
                "package_id": pkg.id,
                "stripe_checkout_url": session_url,
                "total_price": pkg.total_price,
                "status": "pending",
            }

    # Dev/demo mode fallback when Stripe is not configured
    pkg.status = "active"
    db.commit()
    send_package_confirmation_email(
        student_email=student.email,
        student_name=student.name,
        lesson_type=pkg.lesson_type,
        duration=pkg.duration,
        total_price=pkg.total_price,
        credits=pkg.total_credits,
    )
    send_teacher_package_notification(
        student_name=student.name,
        student_email=student.email,
        lesson_type=pkg.lesson_type,
        duration=pkg.duration,
        total_price=pkg.total_price,
    )

    return {
        "package_id": pkg.id,
        "stripe_checkout_url": None,
        "total_price": pkg.total_price,
        "status": "active",
        "message": "Package activated (demo mode).",
    }


@router.get("/student/{student_id}")
def get_student_packages(
    student_id: str,
    user: Dict[str, Any] = Depends(require_student),
    db: Session = Depends(database.get_db),
):
    """Retrieve all packages owned by the authenticated student."""
    if user["sub"] != student_id:
        raise HTTPException(status_code=403, detail="You can only access your own packages.")

    packages = db.query(LessonPackage).options(
        joinedload(LessonPackage.teacher),
        joinedload(LessonPackage.lessons),
    ).filter(
        LessonPackage.student_id == student_id,
        LessonPackage.status.in_(["active", "completed"]),
    ).order_by(LessonPackage.created_at.desc()).all()

    result = []
    for p in packages:
        remaining = max(0, p.total_credits - p.used_credits)
        result.append({
            "id": p.id,
            "teacher_id": p.teacher_id,
            "teacher_name": p.teacher.name if p.teacher else "Marta",
            "lesson_type": p.lesson_type,
            "duration": p.duration,
            "total_credits": p.total_credits,
            "used_credits": p.used_credits,
            "remaining_credits": remaining,
            "discount_percent": p.discount_percent,
            "total_price": p.total_price,
            "per_lesson_price": p.per_lesson_price,
            "status": p.status,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "lessons": [
                {
                    "id": l.id,
                    "start_time": (l.start_time.isoformat() + "Z") if l.start_time else None,
                    "status": l.status,
                }
                for l in (p.lessons or []) if l.status != "cancelled"
            ]
        })

    return {"packages": result}


@router.post("/{package_id}/book")
def book_with_package_credit(
    package_id: str,
    body: PackageBookRequest,
    user: Dict[str, Any] = Depends(require_student),
    db: Session = Depends(database.get_db),
):
    """Redeem a package credit to schedule a lesson."""
    pkg = db.query(LessonPackage).filter(LessonPackage.id == package_id).first()
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found.")

    if pkg.student_id != user["sub"]:
        raise HTTPException(status_code=403, detail="You can only redeem your own package credits.")

    if pkg.status != "active" or pkg.used_credits >= pkg.total_credits:
        raise HTTPException(status_code=400, detail="No remaining credits available in this package.")

    # 12-hour advance check
    utc_start = body.start_time.astimezone(timezone.utc) if body.start_time.tzinfo else body.start_time.replace(tzinfo=timezone.utc)
    if utc_start < datetime.now(timezone.utc) + timedelta(hours=12):
        raise HTTPException(status_code=400, detail="Lessons must be booked at least 12 hours in advance.")

    # Check for conflicts
    utc_end = utc_start + timedelta(minutes=pkg.duration)
    conflicts = db.query(Lesson).filter(
        Lesson.teacher_id == pkg.teacher_id,
        Lesson.status.in_(["scheduled", "pending"]),
        Lesson.start_time < utc_end,
    ).all()
    for existing in conflicts:
        existing_start = existing.start_time if existing.start_time.tzinfo else existing.start_time.replace(tzinfo=timezone.utc)
        existing_end = existing_start + timedelta(minutes=existing.duration)
        if utc_start < existing_end and utc_end > existing_start:
            raise HTTPException(status_code=409, detail="This time slot is no longer available. Please choose another time.")

    # Atomically consume 1 credit
    success = consume_package_credit(db, package_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to consume credit. Package might have 0 credits remaining.")

    # Create the lesson record
    lesson = Lesson(
        student_id=pkg.student_id,
        teacher_id=pkg.teacher_id,
        lesson_type=pkg.lesson_type,
        start_time=utc_start,
        duration=pkg.duration,
        price=pkg.per_lesson_price,
        status="scheduled",
        student_timezone=body.student_timezone or "UTC",
        payment_method="package",
        package_id=pkg.id,
        meeting_link="https://meet.google.com/pyv-dxwi-mxc",
        student_payment_account=f"Paid via 5-class package ({pkg.id})",
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)

    student = db.query(Student).filter(Student.id == pkg.student_id).first()
    student_name = student.name if student else "Student"
    student_email = student.email if student else ""
    lesson_date_str = utc_start.strftime("%A, %B %d at %I:%M %p UTC")

    # Send confirmations
    if student_email:
        send_lesson_confirmation(
            student_email=student_email,
            student_name=student_name,
            lesson_date=lesson_date_str,
            duration=lesson.duration,
            lesson_type=lesson.lesson_type,
            price=lesson.price,
        )

    send_teacher_notification(
        student_name=student_name,
        lesson_date=lesson_date_str,
        duration=lesson.duration,
        lesson_type=lesson.lesson_type,
        student_payment_account=f"Bono de 5 clases ({pkg.id})",
        paid=True,
        student_email=student_email,
        price=lesson.price,
    )

    # Refresh package for remaining credits count
    db.refresh(pkg)
    remaining_credits = max(0, pkg.total_credits - pkg.used_credits)

    return {
        "status": "success",
        "lesson_id": lesson.id,
        "package_id": pkg.id,
        "remaining_credits": remaining_credits,
        "meeting_link": lesson.meeting_link,
        "start_time": lesson.start_time.isoformat() + "Z",
    }
