from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import database
from app.models import teacher as models
from app.schemas import teacher as schemas

router = APIRouter(prefix="/api/teachers", tags=["teachers"])

@router.get("/", response_model=List[schemas.Teacher])
def get_teachers(db: Session = Depends(database.get_db)):
    teachers = db.query(models.Teacher).all()
    return teachers

@router.get("/{id}", response_model=schemas.Teacher)
def get_teacher(id: str, db: Session = Depends(database.get_db)):
    teacher = db.query(models.Teacher).filter(models.Teacher.id == id).first()
    if teacher is None:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return teacher

@router.post("/", response_model=schemas.Teacher)
def create_teacher(teacher: schemas.TeacherCreate, db: Session = Depends(database.get_db)):
    db_teacher = models.Teacher(**teacher.dict())
    db.add(db_teacher)
    db.commit()
    db.refresh(db_teacher)
    return db_teacher
