from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class StudentBase(BaseModel):
    name: str
    email: EmailStr

class StudentCreate(StudentBase):
    pass

class Student(StudentBase):
    id: str
    created_at: datetime

    class Config:
        orm_mode = True

from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime
import zoneinfo

VALID_LESSON_TYPES = [
    "Conversación",
    "Conversacion",
    "Curso Básico",
    "Curso Basico",
    "Basic Course",
    "Conversation",
    "Examen DELE",
    "Entrevista de Trabajo",
    "Grammar",
    "Gramática",
]

VALID_DURATIONS = {30, 45, 60}

class LessonCreate(BaseModel):
    student_name: str
    student_email: EmailStr
    teacher_id: str
    lesson_type: str
    start_time: datetime
    duration: int = 60
    student_timezone: Optional[str] = "UTC"

    @field_validator("lesson_type")
    @classmethod
    def validate_lesson_type(cls, v: str) -> str:
        if v not in VALID_LESSON_TYPES:
            raise ValueError(f"Invalid lesson_type '{v}'. Must be one of: {', '.join(VALID_LESSON_TYPES)}")
        return v

    @field_validator("duration")
    @classmethod
    def validate_duration(cls, v: int) -> int:
        if v not in VALID_DURATIONS:
            raise ValueError(f"Invalid duration {v}. Must be one of: {sorted(VALID_DURATIONS)}")
        return v

    @field_validator("student_timezone")
    @classmethod
    def validate_timezone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return "UTC"
        try:
            zoneinfo.ZoneInfo(v)
            return v
        except (zoneinfo.ZoneInfoNotFoundError, KeyError):
            raise ValueError(f"Invalid IANA timezone '{v}'. Use e.g. 'Europe/Madrid', 'America/New_York'.")

class Lesson(BaseModel):
    id: str
    student_id: str
    teacher_id: str
    lesson_type: str
    start_time: datetime
    duration: int
    price: float
    status: str
    feedback_vocabulary: Optional[str] = None
    feedback_errors: Optional[str] = None
    feedback_materials: Optional[str] = None

    class Config:
        orm_mode = True

class LessonFeedbackUpdate(BaseModel):
    feedback_vocabulary: Optional[str] = None
    feedback_errors: Optional[str] = None
    feedback_materials: Optional[str] = None
