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
    start_time = Column(DateTime(timezone=False), nullable=False)
    duration = Column(Integer, default=60)  # in minutes
    price = Column(Float, nullable=False)
    status = Column(String, default="pending")  # pending, scheduled, completed, cancelled
    student_timezone = Column(String, default="UTC", nullable=False)
    meeting_link = Column(String, nullable=True, default="https://meet.google.com/pyv-dxwi-mxc")
    
    # Pedagogical Feedback
    feedback_vocabulary = Column(String, nullable=True)
    feedback_errors = Column(String, nullable=True)
    feedback_materials = Column(String, nullable=True)
    
    # Notifications tracking
    reminder_60m_sent = Column(Integer, default=0) # Using 0/1 for SQLite simplicity
    reminder_30m_sent = Column(Integer, default=0)
    
    student = relationship("Student")
    teacher = relationship("Teacher")
