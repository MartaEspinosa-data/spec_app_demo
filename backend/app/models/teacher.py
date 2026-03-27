from sqlalchemy import Column, String, Float, Text, JSON
from app.database.database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    bio = Column(Text)
    languages = Column(JSON, default=[])  # List of strings
    price_per_hour = Column(Float, nullable=False)
    pricing_schema = Column(JSON, default={})  # {duration_min: price}
    lessons_taught = Column(Float, default=0.0)
    video_url = Column(String)
    calendly_url = Column(String)
