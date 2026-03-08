from pydantic import BaseModel, HttpUrl
from typing import List, Optional

class TeacherBase(BaseModel):
    name: str
    bio: Optional[str] = None
    languages: List[str] = []
    price_per_hour: float
    video_url: Optional[HttpUrl] = None
    calendly_url: Optional[HttpUrl] = None

class TeacherCreate(TeacherBase):
    pass

class Teacher(TeacherBase):
    id: str

    class Config:
        orm_mode = True
