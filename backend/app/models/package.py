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
    
    # Stripe Payment Link tracking
    stripe_payment_link_id = Column(String, nullable=True)  # Stripe PaymentLink ID (pl_xxx)
    stripe_payment_link_url = Column(String, nullable=True)  # Full URL for the Stripe-hosted payment page
    stripe_session_id = Column(String, nullable=True)  # Stripe Checkout Session ID (cs_xxx)
    payment_method = Column(String, nullable=True, default="manual")  # 'stripe' or 'manual'
