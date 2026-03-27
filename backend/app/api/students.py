from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.student import Student
from app.models.lesson import Lesson
from pydantic import BaseModel, EmailStr
import hashlib

router = APIRouter(prefix="/api/students", tags=["students"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


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
            return {
                "student_id": existing.id,
                "name": existing.name,
                "email": existing.email,
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
    return {
        "student_id": student.id,
        "name": student.name,
        "email": student.email,
    }


@router.post("/login")
def login_student(data: LoginRequest, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.email == data.email).first()
    if not student or not student.password_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if student.password_hash != hash_password(data.password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return {
        "student_id": student.id,
        "name": student.name,
        "email": student.email,
    }


@router.get("/{student_id}/lessons")
def get_student_lessons(student_id: str, db: Session = Depends(get_db)):
    lessons = db.query(Lesson).filter(
        Lesson.student_id == student_id
    ).order_by(Lesson.start_time.desc()).all()

    result = []
    for l in lessons:
        result.append({
            "id": l.id,
            "lesson_type": l.lesson_type,
            "start_time": l.start_time.isoformat() if l.start_time else None,
            "duration": l.duration,
            "price": l.price,
            "status": l.status,
        })
    return {"lessons": result}
