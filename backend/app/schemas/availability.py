from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import time, date

class AvailabilitySlotBase(BaseModel):
    day_of_week: Optional[int] = Field(None, ge=0, le=6)
    specific_date: Optional[date] = None
    start_time: time
    end_time: time
    is_available: bool = True

class AvailabilitySlotResponse(AvailabilitySlotBase):
    id: str
    teacher_id: str

    class Config:
        orm_mode = True

class TeacherAvailabilityResponse(BaseModel):
    availability: List[AvailabilitySlotResponse]

class TeacherAvailabilityUpdate(BaseModel):
    availability: List[AvailabilitySlotBase]
