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

class LessonCreate(BaseModel):
    student_name: str
    student_email: EmailStr
    teacher_id: str
    lesson_type: str
    start_time: datetime
    duration: int = 60
    calendly_event_id: Optional[str] = None

class Lesson(BaseModel):
    id: str
    student_id: str
    teacher_id: str
    lesson_type: str
    start_time: datetime
    duration: int
    price: float
    status: str
    calendly_event_id: Optional[str] = None

    class Config:
        orm_mode = True
