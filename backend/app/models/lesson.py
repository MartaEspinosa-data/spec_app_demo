from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Float, func
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
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    meeting_link = Column(String, nullable=True, default="https://meet.google.com/pyv-dxwi-mxc")
    
    # Pedagogical Feedback
    feedback_vocabulary = Column(String, nullable=True)
    feedback_errors = Column(String, nullable=True)
    feedback_materials = Column(String, nullable=True)
    
    # Payment tracking (Stripe handles all payments)
    student_payment_account = Column(String, nullable=True)
    
    # Stripe Payment Link tracking
    stripe_payment_link_id = Column(String, nullable=True)  # Stripe PaymentLink ID (pl_xxx)
    stripe_payment_link_url = Column(String, nullable=True)  # Full URL for the Stripe-hosted payment page
    stripe_session_id = Column(String, nullable=True)  # Stripe Checkout Session ID (cs_xxx)
    payment_method = Column(String, nullable=True, default="stripe")  # 'stripe' or 'manual'
    
    # Notifications tracking
    reminder_60m_sent = Column(Integer, default=0) # Using 0/1 for SQLite simplicity
    reminder_30m_sent = Column(Integer, default=0)
    
    student = relationship("Student")
    teacher = relationship("Teacher")
