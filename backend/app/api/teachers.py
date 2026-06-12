from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database.database import get_db
from app.models import teacher as teacher_models
from app.schemas import teacher as teacher_schemas
from app.utils.auth import (
    hash_password,
    verify_password,
    create_teacher_token,
    require_teacher,
    get_current_user,
)
from app.utils.email import send_password_reset_email
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta, timezone
import secrets
import os

router = APIRouter(prefix="/api/v1/teachers", tags=["teachers"])

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


# ---- Auth Schemas ----

class TeacherLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TeacherSetupRequest(BaseModel):
    """Create/update teacher credentials (admin use)."""
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


# ---- Public Routes ----

@router.get("/", response_model=List[teacher_schemas.Teacher])
def get_teachers(db: Session = Depends(get_db)):
    """Public: list all teachers."""
    teachers = db.query(teacher_models.Teacher).all()
    return teachers


@router.get("/{id}", response_model=teacher_schemas.Teacher)
def get_teacher(id: str, db: Session = Depends(get_db)):
    """Public: get a specific teacher profile."""
    teacher = db.query(teacher_models.Teacher).filter(teacher_models.Teacher.id == id).first()
    if teacher is None:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return teacher


# ---- Auth Routes ----

def _validate_teacher_password(plain: str, teacher: teacher_models.Teacher) -> bool:
    """
    Check the provided password against the teacher's credentials.
    Priority: 1) DB-stored bcrypt hash, 2) TEACHER_PASSWORD env var, 3) plain text env.
    """
    teacher_email = os.getenv("TEACHER_EMAIL", "martaespinosagarcia@gmail.com")

    # 1) Try DB-stored password_hash first (set via forgot-password or setup)
    if teacher and teacher.password_hash:
        if teacher.password_hash.startswith("$2"):
            return verify_password(plain, teacher.password_hash)
        else:
            # Legacy plaintext stored in DB (shouldn't happen, but handle it)
            return plain == teacher.password_hash

    # 2) Fall back to TEACHER_PASSWORD env var
    env_password = os.getenv("TEACHER_PASSWORD", "")
    if env_password:
        if env_password.startswith("$2"):
            return verify_password(plain, env_password)
        else:
            return plain == env_password

    return False


@router.post("/login")
def teacher_login(data: TeacherLoginRequest, db: Session = Depends(get_db)):
    """
    Teacher login. Validates against DB password_hash first, then falls back
    to TEACHER_PASSWORD env var for backward compatibility.
    """
    teacher_email = os.getenv("TEACHER_EMAIL", "martaespinosagarcia@gmail.com")

    if data.email.lower() != teacher_email.lower():
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    # Look up the teacher record
    teacher = db.query(teacher_models.Teacher).first()
    if not teacher:
        raise HTTPException(status_code=500, detail="No teacher record found in database.")

    if not _validate_teacher_password(data.password, teacher):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_teacher_token(teacher.id, teacher.name, teacher_email)
    return {
        "teacher_id": teacher.id,
        "name": teacher.name,
        "email": teacher_email,
        "access_token": token,
        "token_type": "bearer",
    }


@router.post("/setup-password")
def setup_teacher_password(data: TeacherSetupRequest, db: Session = Depends(get_db)):
    """
    Set or update the teacher's password (hashed with bcrypt).
    Stores directly in the database so password resets work.
    """
    teacher = db.query(teacher_models.Teacher).first()
    if not teacher:
        raise HTTPException(status_code=500, detail="No teacher record found in database.")

    hashed = hash_password(data.password)
    teacher.password_hash = hashed
    db.commit()

    print(f"[TEACHER SETUP] Password updated in DB for teacher: {teacher.name}")
    return {
        "status": "ok",
        "message": "Password has been set successfully in the database.",
    }


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Send a password reset email to the teacher.
    Always returns 200 to prevent email enumeration.
    """
    teacher_email = os.getenv("TEACHER_EMAIL", "martaespinosagarcia@gmail.com")

    # Always return same message to prevent email enumeration
    if data.email.lower() != teacher_email.lower():
        return {
            "message": "If an account with that email exists, a password reset link has been sent."
        }

    teacher = db.query(teacher_models.Teacher).first()
    if not teacher:
        return {
            "message": "If an account with that email exists, a password reset link has been sent."
        }

    # Generate a secure reset token valid for 1 hour
    # NOTE: Store naive UTC datetime because SQLite strips timezone info.
    reset_token = secrets.token_urlsafe(32)
    teacher.reset_token = reset_token
    teacher.reset_token_expiry = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(hours=1)
    db.commit()

    reset_url = f"{FRONTEND_URL}/teacher/reset-password?token={reset_token}"
    send_password_reset_email(teacher.email if hasattr(teacher, 'email') else teacher_email,
                              teacher.name, reset_url, role="teacher")

    return {
        "message": "If an account with that email exists, a password reset link has been sent."
    }


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Reset the teacher's password using a valid reset token.
    """
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    teacher = db.query(teacher_models.Teacher).filter(
        teacher_models.Teacher.reset_token == data.token
    ).first()

    if not teacher:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    # Compare with naive UTC since SQLite strips timezone info on storage.
    now_utc_naive = datetime.now(timezone.utc).replace(tzinfo=None)
    if teacher.reset_token_expiry is None or teacher.reset_token_expiry < now_utc_naive:
        # Clean up expired token
        teacher.reset_token = None
        teacher.reset_token_expiry = None
        db.commit()
        raise HTTPException(status_code=400, detail="Reset token has expired. Please request a new one.")

    # Update password and clear reset token
    teacher.password_hash = hash_password(data.new_password)
    teacher.reset_token = None
    teacher.reset_token_expiry = None
    db.commit()

    return {
        "message": "Password has been reset successfully. You can now log in with your new password."
    }


# ---- Protected Routes (require teacher JWT) ----

@router.post("/", response_model=teacher_schemas.Teacher)
def create_teacher(
    teacher: teacher_schemas.TeacherCreate,
    user: Dict[str, Any] = Depends(require_teacher),
    db: Session = Depends(get_db),
):
    """Protected: create a new teacher profile."""
    db_teacher = teacher_models.Teacher(**teacher.dict())
    db.add(db_teacher)
    db.commit()
    db.refresh(db_teacher)
    return db_teacher
