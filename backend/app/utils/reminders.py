from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.database.database import SessionLocal
from app.models.lesson import Lesson
from app.models.student import Student
from app.models.teacher import Teacher
from app.utils.email import send_lesson_reminder

def check_reminders():
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        
        # 1. Check for 60-minute reminders (lessons starting in 55-65 mins)
        remind_60 = db.query(Lesson).filter(
            Lesson.status == "scheduled",
            Lesson.reminder_60m_sent == 0,
            Lesson.start_time >= now + timedelta(minutes=55),
            Lesson.start_time <= now + timedelta(minutes=65)
        ).all()
        
        for lesson in remind_60:
            student = db.query(Student).filter(Student.id == lesson.student_id).first()
            teacher = db.query(Teacher).filter(Teacher.id == lesson.teacher_id).first()
            teacher_name = teacher.name if teacher else "Marta"
            if student:
                success = send_lesson_reminder(
                    email=student.email,
                    name=student.name,
                    lesson_time=lesson.start_time.strftime("%I:%M %p"),
                    minutes_left=60,
                    meeting_link=lesson.meeting_link,
                    teacher_name=teacher_name
                )
                if success:
                    lesson.reminder_60m_sent = 1
                    db.commit()

        # 2. Check for 30-minute reminders (lessons starting in 25-35 mins)
        remind_30 = db.query(Lesson).filter(
            Lesson.status == "scheduled",
            Lesson.reminder_30m_sent == 0,
            Lesson.start_time >= now + timedelta(minutes=25),
            Lesson.start_time <= now + timedelta(minutes=35)
        ).all()
        
        for lesson in remind_30:
            student = db.query(Student).filter(Student.id == lesson.student_id).first()
            teacher = db.query(Teacher).filter(Teacher.id == lesson.teacher_id).first()
            teacher_name = teacher.name if teacher else "Marta"
            if student:
                success = send_lesson_reminder(
                    email=student.email,
                    name=student.name,
                    lesson_time=lesson.start_time.strftime("%I:%M %p"),
                    minutes_left=30,
                    meeting_link=lesson.meeting_link,
                    teacher_name=teacher_name
                )
                if success:
                    lesson.reminder_30m_sent = 1
                    db.commit()
    finally:
        db.close()
