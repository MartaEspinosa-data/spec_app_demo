from datetime import datetime, timedelta, timezone
import zoneinfo
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.database.database import SessionLocal
from app.models.lesson import Lesson
from app.models.student import Student
from app.models.teacher import Teacher
from app.utils.email import (
    send_lesson_reminder,
    send_teacher_lesson_reminder,
    get_teacher_email,
)

MADRID_TZ = zoneinfo.ZoneInfo("Europe/Madrid")


def check_reminders():
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)

        # -------------------------------------------------------------------
        # 1. Check for 60-minute reminders (lessons starting in 55-65 mins)
        # -------------------------------------------------------------------
        remind_60 = db.query(Lesson).filter(
            Lesson.status == "scheduled",
            or_(
                Lesson.reminder_60m_sent == 0,
                Lesson.teacher_reminder_60m_sent == 0,
            ),
            Lesson.start_time >= now + timedelta(minutes=55),
            Lesson.start_time <= now + timedelta(minutes=65),
        ).all()

        for lesson in remind_60:
            student = db.query(Student).filter(Student.id == lesson.student_id).first()
            teacher = db.query(Teacher).filter(Teacher.id == lesson.teacher_id).first()
            teacher_name = teacher.name if teacher else "Marta"
            teacher_email = (
                getattr(teacher, "email", None)
                or get_teacher_email()
            )
            student_name = student.name if student else "Student"

            start_utc = (
                lesson.start_time
                if getattr(lesson.start_time, "tzinfo", None)
                else lesson.start_time.replace(tzinfo=timezone.utc)
            )

            # Send 60m reminder to student
            if getattr(lesson, "reminder_60m_sent", 0) == 0 and student:
                try:
                    st_tz = (
                        zoneinfo.ZoneInfo(lesson.student_timezone)
                        if lesson.student_timezone
                        else timezone.utc
                    )
                    st_time_str = start_utc.astimezone(st_tz).strftime("%I:%M %p")
                except Exception:
                    st_time_str = start_utc.strftime("%I:%M %p UTC")

                success_student = send_lesson_reminder(
                    email=student.email,
                    name=student.name,
                    lesson_time=st_time_str,
                    minutes_left=60,
                    meeting_link=lesson.meeting_link,
                    teacher_name=teacher_name,
                    lesson_id=str(lesson.id),
                )
                if success_student:
                    lesson.reminder_60m_sent = 1
                    db.commit()

            # Send 60m reminder to teacher
            if getattr(lesson, "teacher_reminder_60m_sent", 0) == 0 and teacher_email:
                madrid_time_str = start_utc.astimezone(MADRID_TZ).strftime("%I:%M %p (Madrid)")
                success_teacher = send_teacher_lesson_reminder(
                    teacher_email=teacher_email,
                    teacher_name=teacher_name,
                    student_name=student_name,
                    lesson_time=madrid_time_str,
                    minutes_left=60,
                    meeting_link=lesson.meeting_link,
                    lesson_id=str(lesson.id),
                    duration=lesson.duration or 60,
                    lesson_type=lesson.lesson_type or "Clase de Español",
                )
                if success_teacher:
                    lesson.teacher_reminder_60m_sent = 1
                    db.commit()

        # -------------------------------------------------------------------
        # 2. Check for 30-minute reminders (lessons starting in 25-35 mins)
        # -------------------------------------------------------------------
        remind_30 = db.query(Lesson).filter(
            Lesson.status == "scheduled",
            or_(
                Lesson.reminder_30m_sent == 0,
                Lesson.teacher_reminder_30m_sent == 0,
            ),
            Lesson.start_time >= now + timedelta(minutes=25),
            Lesson.start_time <= now + timedelta(minutes=35),
        ).all()

        for lesson in remind_30:
            student = db.query(Student).filter(Student.id == lesson.student_id).first()
            teacher = db.query(Teacher).filter(Teacher.id == lesson.teacher_id).first()
            teacher_name = teacher.name if teacher else "Marta"
            teacher_email = (
                getattr(teacher, "email", None)
                or get_teacher_email()
            )
            student_name = student.name if student else "Student"

            start_utc = (
                lesson.start_time
                if getattr(lesson.start_time, "tzinfo", None)
                else lesson.start_time.replace(tzinfo=timezone.utc)
            )

            # Send 30m reminder to student
            if getattr(lesson, "reminder_30m_sent", 0) == 0 and student:
                try:
                    st_tz = (
                        zoneinfo.ZoneInfo(lesson.student_timezone)
                        if lesson.student_timezone
                        else timezone.utc
                    )
                    st_time_str = start_utc.astimezone(st_tz).strftime("%I:%M %p")
                except Exception:
                    st_time_str = start_utc.strftime("%I:%M %p UTC")

                success_student = send_lesson_reminder(
                    email=student.email,
                    name=student.name,
                    lesson_time=st_time_str,
                    minutes_left=30,
                    meeting_link=lesson.meeting_link,
                    teacher_name=teacher_name,
                    lesson_id=str(lesson.id),
                )
                if success_student:
                    lesson.reminder_30m_sent = 1
                    db.commit()

            # Send 30m reminder to teacher
            if getattr(lesson, "teacher_reminder_30m_sent", 0) == 0 and teacher_email:
                madrid_time_str = start_utc.astimezone(MADRID_TZ).strftime("%I:%M %p (Madrid)")
                success_teacher = send_teacher_lesson_reminder(
                    teacher_email=teacher_email,
                    teacher_name=teacher_name,
                    student_name=student_name,
                    lesson_time=madrid_time_str,
                    minutes_left=30,
                    meeting_link=lesson.meeting_link,
                    lesson_id=str(lesson.id),
                    duration=lesson.duration or 60,
                    lesson_type=lesson.lesson_type or "Clase de Español",
                )
                if success_teacher:
                    lesson.teacher_reminder_30m_sent = 1
                    db.commit()

    finally:
        db.close()
