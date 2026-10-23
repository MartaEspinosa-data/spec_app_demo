from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Float, func
from sqlalchemy.orm import relationship
from app.database.database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class LessonPackage(Base):
    __tablename__ = "lesson_packages"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.id"), nullable=False, index=True)
    teacher_id = Column(String, ForeignKey("teachers.id"), nullable=False)
    lesson_type = Column(String, nullable=False)
    duration = Column(Integer, default=60, nullable=False)
    total_credits = Column(Integer, default=5, nullable=False)
    used_credits = Column(Integer, default=0, nullable=False)
    discount_percent = Column(Float, default=3.0, nullable=False)
    single_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    per_lesson_price = Column(Float, nullable=False)
    status = Column(String, default="pending", nullable=False)  # pending, active, completed, cancelled
    stripe_session_id = Column(String, nullable=True, index=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    student = relationship("Student")
    teacher = relationship("Teacher")
    lessons = relationship("Lesson", back_populates="package")
