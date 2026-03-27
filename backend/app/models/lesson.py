from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Float
from sqlalchemy.orm import relationship
from app.database.database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.id"), nullable=False)
    teacher_id = Column(String, ForeignKey("teachers.id"), nullable=False)
    lesson_type = Column(String, nullable=False)  # e.g., 'conversation'
    start_time = Column(DateTime(timezone=True), nullable=False)
    duration = Column(Integer, default=60)  # in minutes
    price = Column(Float, nullable=False)
    status = Column(String, default="pending")  # pending, scheduled, completed, cancelled
    student_timezone = Column(String, default="UTC", nullable=False)
    calendly_event_id = Column(String, unique=True, nullable=True) # DEPRECATED: Switched to custom teacher calendar
    
    student = relationship("Student")
    teacher = relationship("Teacher")
