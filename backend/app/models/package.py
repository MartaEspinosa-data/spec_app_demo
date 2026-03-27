from sqlalchemy import Column, String, Integer, Float, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class StudentPackage(Base):
    __tablename__ = "student_packages"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, nullable=False)
    duration = Column(Integer, nullable=False)  # 30, 45, or 60
    total_lessons = Column(Integer, default=5, nullable=False)
    remaining_lessons = Column(Integer, default=5, nullable=False)
    price_paid = Column(Float, nullable=False)
    status = Column(String, default="active")  # active, exhausted, cancelled
    created_at = Column(DateTime(timezone=True), server_default=func.now())
