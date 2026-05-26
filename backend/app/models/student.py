from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from app.database.database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class Student(Base):
    __tablename__ = "students"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True)  # nullable for legacy/google students
    google_id = Column(String, unique=True, index=True, nullable=True)
    reset_token = Column(String, nullable=True, index=True)  # password reset token
    reset_token_expiry = Column(DateTime(timezone=True), nullable=True)  # expiration for reset token
    created_at = Column(DateTime(timezone=True), server_default=func.now())

