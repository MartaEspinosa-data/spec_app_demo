import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

GOOGLE_MEET_LINK = "https://meet.google.com/pyv-dxwi-mxc"

# SMTP Config — set these as env vars in production
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")  # e.g. martaespinosagarcia@gmail.com
SMTP_PASS = os.getenv("SMTP_PASS", "")  # App password from Gmail
SENDER_NAME = "Profe Marta"


def send_lesson_confirmation(student_email: str, student_name: str, lesson_date: str, duration: int, lesson_type: str):
    """Send a lesson confirmation email with the Google Meet link."""
    
    subject = f"🎉 Your Spanish Lesson is Confirmed!"
    
    html_body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8faff; border-radius: 24px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 40px 32px; text-align: center;">
            <h1 style="color: white; font-size: 28px; margin: 0;">¡Clase Confirmada! 🇪🇸</h1>
            <p style="color: rgba(255,255,255,0.85); font-size: 16px; margin-top: 8px;">Your lesson has been successfully booked</p>
        </div>
        
        <div style="padding: 32px;">
            <p style="font-size: 18px; color: #1f2937;">Hola <strong>{student_name}</strong>,</p>
            <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
                Thank you for booking a lesson with Profe Marta! Here are your lesson details:
            </p>
            
            <div style="background: white; border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #e5e7eb;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #9ca3af; font-size: 14px; font-weight: bold;">DATE & TIME</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 16px; font-weight: bold;">{lesson_date}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #9ca3af; font-size: 14px; font-weight: bold;">DURATION</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 16px;">{duration} minutes</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #9ca3af; font-size: 14px; font-weight: bold;">TYPE</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 16px;">{lesson_type}</td>
                    </tr>
                </table>
            </div>
            
            <div style="text-align: center; margin: 32px 0;">
                <a href="{GOOGLE_MEET_LINK}" 
                   style="display: inline-block; background: #4f46e5; color: white; padding: 16px 40px; 
                          border-radius: 12px; text-decoration: none; font-size: 18px; font-weight: bold;
                          box-shadow: 0 4px 14px rgba(79,70,229,0.4);">
                    📹 Join Google Meet Lesson
                </a>
                <p style="color: #9ca3af; font-size: 13px; margin-top: 12px;">
                    Link: <a href="{GOOGLE_MEET_LINK}" style="color: #4f46e5;">{GOOGLE_MEET_LINK}</a>
                </p>
            </div>
            
            <p style="font-size: 14px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 32px;">
                ¡Nos vemos pronto! — Profe Marta ❤️
            </p>
        </div>
    </div>
    """

    if not SMTP_USER or not SMTP_PASS:
        print(f"[EMAIL DEMO] Would send confirmation to {student_email}")
        print(f"[EMAIL DEMO] Meet link: {GOOGLE_MEET_LINK}")
        print(f"[EMAIL DEMO] Subject: {subject}")
        return True  # Return success in demo mode

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{SENDER_NAME} <{SMTP_USER}>"
        msg["To"] = student_email
        
        msg.attach(MIMEText(html_body, "html"))
        
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, student_email, msg.as_string())
        
        print(f"[EMAIL] Confirmation sent to {student_email}")
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send to {student_email}: {e}")
        return False


def send_teacher_notification(student_name: str, lesson_date: str, duration: int, lesson_type: str):
    """Notify Marta about a new booking."""
    # In production, this would be Marta's email
    teacher_email = os.getenv("TEACHER_NOTIFICATION_EMAIL", SMTP_USER)
    if not teacher_email:
        teacher_email = "martaespinosagarcia@gmail.com"

    subject = f"🔔 New Booking: {student_name} ({lesson_date})"

    html_body = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
        <h2 style="color: #4f46e5;">Nueva Clase Reservada! 🇪🇸</h2>
        <p>You have a new booking from <strong>{student_name}</strong>.</p>
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Date:</strong> {lesson_date}</p>
            <p><strong>Duration:</strong> {duration} mins</p>
            <p><strong>Type:</strong> {lesson_type}</p>
        </div>
        <p>Check your <a href="http://localhost:5174/teacher/dashboard">Teacher Dashboard</a> for more details.</p>
    </div>
    """

    if not SMTP_USER or not SMTP_PASS:
        print(f"[EMAIL DEMO] Would notify teacher {teacher_email} about booking by {student_name}")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"Booking System <{SMTP_USER}>"
        msg["To"] = teacher_email
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, teacher_email, msg.as_string())

        print(f"[EMAIL] Teacher notification sent to {teacher_email}")
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to notify teacher: {e}")
        return False


def send_lesson_reminder(email: str, name: str, lesson_time: str, minutes_left: int, meeting_link: str = GOOGLE_MEET_LINK):
    """Send a reminder email before the lesson starts."""
    subject = f"⏰ Lesson Reminder: Your Spanish class starts in {minutes_left} minutes!"
    
    html_body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fffcf8; border-radius: 24px; overflow: hidden; border: 1px solid #ffedd5;">
        <div style="background: #ea580c; padding: 40px 32px; text-align: center;">
            <h1 style="color: white; font-size: 28px; margin: 0;">¡Tu clase empieza pronto! 🇪🇸</h1>
            <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin-top: 8px;">In {minutes_left} minutes at {lesson_time}</p>
        </div>
        
        <div style="padding: 32px;">
            <p style="font-size: 18px; color: #1f2937;">Hola <strong>{name}</strong>,</p>
            <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
                This is a friendly reminder that your Spanish lesson with Profe Marta is about to start. 
                Get your materials ready and join the classroom!
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
                <a href="{meeting_link}" 
                   style="display: inline-block; background: #ea580c; color: white; padding: 18px 48px; 
                          border-radius: 12px; text-decoration: none; font-size: 20px; font-weight: bold;
                          box-shadow: 0 4px 14px rgba(234,88,12,0.4);">
                    🚀 Join the Classroom
                </a>
                <p style="color: #9ca3af; font-size: 13px; margin-top: 12px;">
                    Link: <a href="{meeting_link}" style="color: #ea580c;">{meeting_link}</a>
                </p>
            </div>
            
            <p style="font-size: 14px; color: #9ca3af; text-align: center; border-top: 1px solid #ffedd5; padding-top: 24px;">
                ¡Nos vemos en clase! — Profe Marta ❤️
            </p>
        </div>
    </div>
    """

    if not SMTP_USER or not SMTP_PASS:
        print(f"[EMAIL DEMO] Would send {minutes_left}m reminder to {email}")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{SENDER_NAME} <{SMTP_USER}>"
        msg["To"] = email
        msg.attach(MIMEText(html_body, "html"))
        
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, email, msg.as_string())
        
        print(f"[EMAIL] {minutes_left}m reminder sent to {email}")
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send reminder to {email}: {e}")
        return False
