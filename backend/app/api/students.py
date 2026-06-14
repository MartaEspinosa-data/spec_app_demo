from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.student import Student
from app.models.lesson import Lesson
from app.utils.auth import (
    hash_password,
    verify_password,
    create_student_token,
    get_current_user,
    require_student,
)
from app.utils.email import send_password_reset_email
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime, timedelta, timezone
import secrets
import os

router = APIRouter(prefix="/api/v1/students", tags=["students"])


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleLoginRequest(BaseModel):
    token: str
    email: EmailStr
    name: str
    google_id: str


@router.post("/register")
def register_student(data: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(Student).filter(Student.email == data.email).first()
    if existing:
        # If student exists but has no password (legacy from booking), set password
        if not existing.password_hash:
            existing.password_hash = hash_password(data.password)
            existing.name = data.name
            db.commit()
            db.refresh(existing)
            token = create_student_token(existing.id, existing.name, existing.email)
            return {
                "student_id": existing.id,
                "name": existing.name,
                "email": existing.email,
                "access_token": token,
                "token_type": "bearer",
            }
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    student = Student(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    token = create_student_token(student.id, student.name, student.email)
    return {
        "student_id": student.id,
        "name": student.name,
        "email": student.email,
        "access_token": token,
        "token_type": "bearer",
    }


@router.post("/login")
def login_student(data: LoginRequest, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.email == data.email).first()
    if not student or not student.password_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    # Support both bcrypt (new) and SHA-256 (legacy) password hashes during migration
    import hashlib
    password_valid = False

    # Try bcrypt first (new format)
    if student.password_hash.startswith("$2"):
        password_valid = verify_password(data.password, student.password_hash)
    else:
        # Legacy SHA-256 fallback — re-hash with bcrypt on success
        legacy_hash = hashlib.sha256(data.password.encode()).hexdigest()
        if student.password_hash == legacy_hash:
            password_valid = True
            # Migrate to bcrypt immediately
            student.password_hash = hash_password(data.password)
            db.commit()

    if not password_valid:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_student_token(student.id, student.name, student.email)
    return {
        "student_id": student.id,
        "name": student.name,
        "email": student.email,
        "access_token": token,
        "token_type": "bearer",
    }


@router.post("/google-login")
def google_login(data: GoogleLoginRequest, db: Session = Depends(get_db)):
    # In a production app, we would verify 'data.token' with google.oauth2.id_token
    # For now, we trust the frontend's verified data

    student = db.query(Student).filter(Student.email == data.email).first()

    if not student:
        # Create new student from Google data
        student = Student(
            name=data.name,
            email=data.email,
            google_id=data.google_id
        )
        db.add(student)
        db.commit()
        db.refresh(student)
    elif not student.google_id:
        # Link existing account to Google
        student.google_id = data.google_id
        db.commit()
        db.refresh(student)

    token = create_student_token(student.id, student.name, student.email)
    return {
        "student_id": student.id,
        "name": student.name,
        "email": student.email,
        "access_token": token,
        "token_type": "bearer",
    }


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Send a password reset email to the student if the account exists.
    Always returns 200 to prevent email enumeration.

    Note: Allows reset for students without a password_hash (e.g., Google login
    or legacy booking accounts) — the reset link lets them set a password.

    Idempotent: if a valid (non-expired) token already exists, re-send the same
    link instead of generating a new one. This prevents double-click issues
    where the second request overwrites the token before the first link is used.
    """
    student = db.query(Student).filter(Student.email == data.email).first()

    # Always return same message to prevent email enumeration
    if not student:
        return {
            "message": "If an account with that email exists, a password reset link has been sent."
        }

    # Reuse existing token if it's still valid (prevents double-click overwrite)
    now_utc_naive = datetime.now(timezone.utc).replace(tzinfo=None)
    if (
        student.reset_token is not None
        and student.reset_token_expiry is not None
        and student.reset_token_expiry > now_utc_naive
    ):
        # Token still valid — re-send the same link
        reset_url = f"{FRONTEND_URL}/student/reset-password?token={student.reset_token}"
        send_password_reset_email(student.email, student.name, reset_url, role="student")
        return {
            "message": "If an account with that email exists, a password reset link has been sent."
        }

    # Generate a fresh token (old one expired or never existed)
    # NOTE: Store naive UTC datetime because SQLite strips timezone info.
    reset_token = secrets.token_urlsafe(32)
    student.reset_token = reset_token
    student.reset_token_expiry = now_utc_naive + timedelta(hours=1)
    db.commit()

    reset_url = f"{FRONTEND_URL}/student/reset-password?token={reset_token}"
    send_password_reset_email(student.email, student.name, reset_url, role="student")

    return {
        "message": "If an account with that email exists, a password reset link has been sent."
    }


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Reset the student's password using a valid reset token.
    """
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    student = db.query(Student).filter(Student.reset_token == data.token).first()

    if not student:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    # Compare with naive UTC since SQLite strips timezone info on storage.
    now_utc_naive = datetime.now(timezone.utc).replace(tzinfo=None)
    if student.reset_token_expiry is None or student.reset_token_expiry < now_utc_naive:
        # Clean up expired token
        student.reset_token = None
        student.reset_token_expiry = None
        db.commit()
        raise HTTPException(status_code=400, detail="Reset token has expired. Please request a new one.")

    # Update password and clear reset token
    student.password_hash = hash_password(data.new_password)
    student.reset_token = None
    student.reset_token_expiry = None
    db.commit()

    return {
        "message": "Password has been reset successfully. You can now log in with your new password."
    }


@router.get("/me")
def get_current_student_info(user: Dict[str, Any] = Depends(require_student), db: Session = Depends(get_db)):
    """Get the currently authenticated student's profile."""
    student = db.query(Student).filter(Student.id == user["sub"]).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return {
        "student_id": student.id,
        "name": student.name,
        "email": student.email,
    }


@router.get("/{student_id}/lessons")
def get_student_lessons(
    student_id: str,
    user: Dict[str, Any] = Depends(require_student),
    db: Session = Depends(get_db),
):
    """Get all lessons for a student. Only the owner can view their own lessons."""
    if user["sub"] != student_id:
        raise HTTPException(status_code=403, detail="You can only access your own lessons.")

    lessons = db.query(Lesson).filter(
        Lesson.student_id == student_id
    ).order_by(Lesson.start_time.desc()).all()

    result = []
    for l in lessons:
        result.append({
            "id": l.id,
            "lesson_type": l.lesson_type,
            "start_time": (l.start_time.isoformat() + "Z") if l.start_time else None,
            "duration": l.duration,
            "price": l.price,
            "status": l.status,
            "meeting_link": l.meeting_link,
            "feedback_vocabulary": l.feedback_vocabulary,
            "feedback_errors": l.feedback_errors,
            "feedback_materials": l.feedback_materials,
        })
    return {"lessons": result}


@router.delete("/{student_id}/lessons/clean")
def clean_student_lessons(
    student_id: str,
    user: Dict[str, Any] = Depends(require_student),
    db: Session = Depends(get_db),
):
    """Delete all cancelled and completed lessons for the authenticated student."""
    if user["sub"] != student_id:
        raise HTTPException(status_code=403, detail="You can only clean your own lessons.")

    deleted_count = db.query(Lesson).filter(
        Lesson.student_id == student_id,
        Lesson.status.in_(["cancelled", "completed"])
    ).delete(synchronize_session='fetch')
    db.commit()

    return {
        "status": "success",
        "message": f"{deleted_count} cancelled and/or completed lesson(s) have been permanently removed.",
        "deleted_count": deleted_count,
    }
