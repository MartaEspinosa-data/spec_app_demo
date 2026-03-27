from sqlalchemy import Column, String, Integer, Boolean, Time, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.database.database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class TeacherAvailability(Base):
    __tablename__ = "teacher_availability"

    id = Column(String, primary_key=True, default=generate_uuid)
    teacher_id = Column(String, ForeignKey("teachers.id"), nullable=False)
    
    # Mutually exclusive: either this is a recurring day of week, or a specific date override
    day_of_week = Column(Integer, nullable=True)  # 0 = Monday, 1 = Tuesday, etc.
    specific_date = Column(Date, nullable=True)   # Override for a specific calendar date
    
    start_time = Column(Time(timezone=False), nullable=False) # Stored as UTC Time
    end_time = Column(Time(timezone=False), nullable=False)   # Stored as UTC Time
    
    is_available = Column(Boolean, default=True, nullable=False)
    
    teacher = relationship("Teacher")
