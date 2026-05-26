from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database.database import get_db
from app.models.availability import TeacherAvailability
from app.schemas.availability import TeacherAvailabilityResponse, TeacherAvailabilityUpdate, AvailabilitySlotBase
from app.utils.auth import require_teacher

router = APIRouter(prefix="/api/v1/availability", tags=["availability"])

@router.get("/teacher/{teacher_id}", response_model=TeacherAvailabilityResponse)
def get_teacher_availability(teacher_id: str, db: Session = Depends(get_db)):
    slots = db.query(TeacherAvailability).filter(TeacherAvailability.teacher_id == teacher_id).all()
    return {"availability": slots}

@router.post("/teacher/{teacher_id}", response_model=TeacherAvailabilityResponse)
def update_teacher_availability(teacher_id: str, payload: TeacherAvailabilityUpdate, user: Dict[str, Any] = Depends(require_teacher), db: Session = Depends(get_db)):
    # Only delete RECURRING slots (day_of_week), preserve specific_date overrides
    db.query(TeacherAvailability).filter(
        TeacherAvailability.teacher_id == teacher_id,
        TeacherAvailability.specific_date == None
    ).delete()
    
    new_slots = []
    for slot_data in payload.availability:
        slot = TeacherAvailability(
            teacher_id=teacher_id,
            **slot_data.dict()
        )
        db.add(slot)
        new_slots.append(slot)
    
    db.commit()
    
    slots = db.query(TeacherAvailability).filter(TeacherAvailability.teacher_id == teacher_id).all()
    return {"availability": slots}

@router.post("/teacher/{teacher_id}/override")
def add_date_override(teacher_id: str, payload: AvailabilitySlotBase, user: Dict[str, Any] = Depends(require_teacher), db: Session = Depends(get_db)):
    """Add or update a specific date override."""
    if not payload.specific_date:
        raise HTTPException(status_code=400, detail="specific_date is required for overrides")
    
    # Remove existing override for this date
    db.query(TeacherAvailability).filter(
        TeacherAvailability.teacher_id == teacher_id,
        TeacherAvailability.specific_date == payload.specific_date
    ).delete()
    
    slot = TeacherAvailability(
        teacher_id=teacher_id,
        specific_date=payload.specific_date,
        start_time=payload.start_time,
        end_time=payload.end_time,
        is_available=payload.is_available,
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return {"status": "ok", "id": slot.id}

@router.delete("/teacher/{teacher_id}/override/{override_id}")
def delete_date_override(teacher_id: str, override_id: str, user: Dict[str, Any] = Depends(require_teacher), db: Session = Depends(get_db)):
    deleted = db.query(TeacherAvailability).filter(
        TeacherAvailability.id == override_id,
        TeacherAvailability.teacher_id == teacher_id,
        TeacherAvailability.specific_date != None,
    ).delete()
    db.commit()
    if not deleted:
        raise HTTPException(status_code=404, detail="Override not found")
    return {"status": "deleted"}

