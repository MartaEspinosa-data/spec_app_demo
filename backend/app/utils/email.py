import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

GOOGLE_MEET_LINK = "https://meet.google.com/pyv-dxwi-mxc"

# SMTP Config — set these as env vars in production
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")  # e.g. your-email@gmail.com
SMTP_PASS = os.getenv("SMTP_PASS", "")  # App password from Gmail
SENDER_NAME = "Profe Marta"
TEACHER_EMAIL = os.getenv("TEACHER_NOTIFICATION_EMAIL", "")


def _send_email(to_email: str, subject: str, html_body: str) -> bool:
    """Internal helper to send an email via SMTP. Falls back to console logging in demo mode."""
    if not SMTP_USER or not SMTP_PASS:
        print(f"[EMAIL DEMO] To: {to_email}")
        print(f"[EMAIL DEMO] Subject: {subject}")
        print(f"[EMAIL DEMO] Body preview: {html_body[:200]}...")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{SENDER_NAME} <{SMTP_USER}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, to_email, msg.as_string())

        print(f"[EMAIL] Sent to {to_email}: {subject}")
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send to {to_email}: {e}")
        return False


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

    return _send_email(student_email, subject, html_body)


def send_teacher_notification(student_name: str, lesson_date: str, duration: int, lesson_type: str, student_payment_account: str = ""):
    """Notify Marta about a new booking, including student payment details."""
    subject = f"🔔 New Booking: {student_name} ({lesson_date})"

    payment_info_block = ""
    if student_payment_account:
        payment_info_block = f"""
        <div style="background: #fefce8; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="font-weight: bold; color: #92400e; margin: 0 0 8px 0;">💳 Student Payment Account:</p>
            <p style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 0; font-family: monospace;">{student_payment_account}</p>
            <p style="font-size: 12px; color: #a16207; margin: 8px 0 0 0;">The student stated they transferred the payment from this account.</p>
        </div>
        """

    html_body = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
        <h2 style="color: #4f46e5;">Nueva Clase Reservada! 🇪🇸</h2>
        <p>You have a new booking from <strong>{student_name}</strong>.</p>
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Date:</strong> {lesson_date}</p>
            <p><strong>Duration:</strong> {duration} mins</p>
            <p><strong>Type:</strong> {lesson_type}</p>
        </div>
        {payment_info_block}
        <p>Verify the payment and then accept or reject the lesson on your <a href="http://localhost:5174/teacher/dashboard">Teacher Dashboard</a>.</p>
    </div>
    """

    return _send_email(TEACHER_EMAIL, subject, html_body)


def send_lesson_reminder(email: str, name: str, lesson_time: str, minutes_left: int, meeting_link: str = GOOGLE_MEET_LINK, teacher_name: str = "Marta"):
    """Send a reminder email before the lesson starts."""
    if minutes_left == 60:
        reminder_text = f"En una hora comienza tu clase con {teacher_name}"
        subtitle_text = f"⏰ {reminder_text}"
    elif minutes_left == 30:
        reminder_text = f"En 30 minutos comienza tu clase con {teacher_name}"
        subtitle_text = f"⏰ {reminder_text}"
    else:
        reminder_text = f"Your Spanish class with {teacher_name} starts soon"
        subtitle_text = f"In {minutes_left} minutes at {lesson_time}"

    subject = f"⏰ Lesson Reminder: Your Spanish class starts in {minutes_left} minutes!"
    
    html_body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fffcf8; border-radius: 24px; overflow: hidden; border: 1px solid #ffedd5;">
        <div style="background: #ea580c; padding: 40px 32px; text-align: center;">
            <h1 style="color: white; font-size: 28px; margin: 0;">¡Tu clase empieza pronto! 🇪🇸</h1>
            <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin-top: 8px;">{subtitle_text}</p>
        </div>
        
        <div style="padding: 32px;">
            <p style="font-size: 18px; color: #1f2937;">Hola <strong>{name}</strong>,</p>
            <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
                {reminder_text}. Get your materials ready and join the classroom!
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
                ¡Nos vemos en clase! — {teacher_name} ❤️
            </p>
        </div>
    </div>
    """

    return _send_email(email, subject, html_body)


# ---------------------------------------------------------------------------
# Teacher Acceptance / Rejection Notification Emails
# ---------------------------------------------------------------------------

def send_teacher_acceptance_email(teacher_email: str, teacher_name: str, student_name: str, lesson_date: str, lesson_type: str):
    """Confirmation sent to the teacher after they accept a pending lesson."""
    subject = f"✅ Lesson Accepted: {student_name} on {lesson_date}"

    html_body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f0fdf4; border-radius: 24px; overflow: hidden; border: 1px solid #bbf7d0;">
        <div style="background: #16a34a; padding: 40px 32px; text-align: center;">
            <h1 style="color: white; font-size: 28px; margin: 0;">✅ Lesson Accepted</h1>
            <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin-top: 8px;">You confirmed this lesson</p>
        </div>
        <div style="padding: 32px;">
            <p style="font-size: 18px; color: #1f2937;">Hola <strong>{teacher_name}</strong>,</p>
            <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
                You have accepted the lesson with <strong>{student_name}</strong>. The student has been notified.
            </p>
            <div style="background: white; border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #e5e7eb;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #9ca3af; font-size: 14px; font-weight: bold;">STUDENT</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 16px; font-weight: bold;">{student_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #9ca3af; font-size: 14px; font-weight: bold;">DATE & TIME</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 16px;">{lesson_date}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #9ca3af; font-size: 14px; font-weight: bold;">TYPE</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 16px;">{lesson_type}</td>
                    </tr>
                </table>
            </div>
            <p style="font-size: 14px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 24px;">
                ¡Nos vemos en clase! — Profe Marta ❤️
            </p>
        </div>
    </div>
    """

    return _send_email(teacher_email, subject, html_body)


def send_student_acceptance_email(student_email: str, student_name: str, lesson_date: str, duration: int, lesson_type: str):
    """Notification sent to the student when the teacher accepts their lesson."""
    subject = f"🎉 Your Spanish Lesson is Confirmed!"

    html_body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f0fdf4; border-radius: 24px; overflow: hidden; border: 1px solid #bbf7d0;">
        <div style="background: linear-gradient(135deg, #16a34a, #15803d); padding: 40px 32px; text-align: center;">
            <h1 style="color: white; font-size: 28px; margin: 0;">✅ Clase Aceptada 🇪🇸</h1>
            <p style="color: rgba(255,255,255,0.85); font-size: 16px; margin-top: 8px;">Your teacher has confirmed your lesson!</p>
        </div>
        <div style="padding: 32px;">
            <p style="font-size: 18px; color: #1f2937;">Hola <strong>{student_name}</strong>,</p>
            <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
                Profe Marta has accepted your lesson. Here are your details:
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
                   style="display: inline-block; background: #16a34a; color: white; padding: 16px 40px;
                          border-radius: 12px; text-decoration: none; font-size: 18px; font-weight: bold;
                          box-shadow: 0 4px 14px rgba(22,163,74,0.4);">
                    📹 Join Google Meet Lesson
                </a>
            </div>
            <p style="font-size: 14px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 24px;">
                ¡Nos vemos pronto! — Profe Marta ❤️
            </p>
        </div>
    </div>
    """

    return _send_email(student_email, subject, html_body)


def send_student_rejection_email(student_email: str, student_name: str, lesson_date: str, lesson_type: str, price: float):
    """Notification sent to the student when the teacher rejects their lesson. Includes refund info."""
    subject = f"❌ Your Spanish Lesson Request was Declined"

    html_body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fef2f2; border-radius: 24px; overflow: hidden; border: 1px solid #fecaca;">
        <div style="background: #dc2626; padding: 40px 32px; text-align: center;">
            <h1 style="color: white; font-size: 28px; margin: 0;">❌ Clase Rechazada</h1>
            <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin-top: 8px;">Your lesson request could not be accepted</p>
        </div>
        <div style="padding: 32px;">
            <p style="font-size: 18px; color: #1f2937;">Hola <strong>{student_name}</strong>,</p>
            <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
                Unfortunately, Profe Marta is unable to accept your lesson request for the following time:
            </p>
            <div style="background: white; border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #e5e7eb;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #9ca3af; font-size: 14px; font-weight: bold;">DATE & TIME</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 16px; font-weight: bold;">{lesson_date}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #9ca3af; font-size: 14px; font-weight: bold;">TYPE</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 16px;">{lesson_type}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #9ca3af; font-size: 14px; font-weight: bold;">AMOUNT</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 16px; font-weight: bold;">${price:.2f}</td>
                    </tr>
                </table>
            </div>
            <div style="background: #fefce8; border: 1px solid #fde68a; border-radius: 16px; padding: 20px; margin: 24px 0; text-align: center;">
                <p style="font-size: 16px; color: #92400e; font-weight: bold; margin: 0;">💸 A refund of <strong>${price:.2f}</strong> will be issued back to you.</p>
                <p style="font-size: 13px; color: #a16207; margin: 8px 0 0 0;">Please allow 5–10 business days for the refund to appear on your statement.</p>
            </div>
            <p style="font-size: 16px; color: #4b5563; text-align: center;">
                You are welcome to <a href="http://localhost:5174" style="color: #4f46e5; font-weight: bold;">book another time</a> that works for you.
            </p>
            <p style="font-size: 14px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 32px;">
                Disculpa las molestias — Profe Marta ❤️
            </p>
        </div>
    </div>
    """

    return _send_email(student_email, subject, html_body)


def send_teacher_rejection_confirmation_email(teacher_email: str, teacher_name: str, student_name: str, lesson_date: str, lesson_type: str):
    """Confirmation sent to the teacher after they reject a pending lesson."""
    subject = f"❌ Lesson Rejected: {student_name} on {lesson_date}"

    html_body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fef2f2; border-radius: 24px; overflow: hidden; border: 1px solid #fecaca;">
        <div style="background: #dc2626; padding: 40px 32px; text-align: center;">
            <h1 style="color: white; font-size: 28px; margin: 0;">❌ Lesson Rejected</h1>
            <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin-top: 8px;">You declined this lesson request</p>
        </div>
        <div style="padding: 32px;">
            <p style="font-size: 18px; color: #1f2937;">Hola <strong>{teacher_name}</strong>,</p>
            <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
                You have rejected the lesson request from <strong>{student_name}</strong>. The student has been notified and their refund is being processed.
            </p>
            <div style="background: white; border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #e5e7eb;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #9ca3af; font-size: 14px; font-weight: bold;">STUDENT</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 16px; font-weight: bold;">{student_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #9ca3af; font-size: 14px; font-weight: bold;">DATE & TIME</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 16px;">{lesson_date}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #9ca3af; font-size: 14px; font-weight: bold;">TYPE</td>
                        <td style="padding: 8px 0; color: #1f2937; font-size: 16px;">{lesson_type}</td>
                    </tr>
                </table>
            </div>
            <p style="font-size: 14px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 24px;">
                The time slot is now free for other bookings.
            </p>
        </div>
    </div>
    """

    return _send_email(teacher_email, subject, html_body)


# ---------------------------------------------------------------------------
# Password Reset Email
# ---------------------------------------------------------------------------

def send_password_reset_email(email: str, name: str, reset_url: str, role: str = "student"):
    """Send a password reset email with a secure reset link."""
    subject = f"🔐 Reset Your Password — Spanish with Marta"

    html_body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8faff; border-radius: 24px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 40px 32px; text-align: center;">
            <h1 style="color: white; font-size: 28px; margin: 0;">Password Reset 🔐</h1>
            <p style="color: rgba(255,255,255,0.85); font-size: 16px; margin-top: 8px;">You requested a password reset</p>
        </div>
        
        <div style="padding: 32px;">
            <p style="font-size: 18px; color: #1f2937;">Hola <strong>{name}</strong>,</p>
            <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">
                We received a request to reset the password for your {role} account on Spanish with Marta.
                Click the button below to set a new password:
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
                <a href="{reset_url}"
                   style="display: inline-block; background: #4f46e5; color: white; padding: 16px 40px;
                          border-radius: 12px; text-decoration: none; font-size: 18px; font-weight: bold;
                          box-shadow: 0 4px 14px rgba(79,70,229,0.4);">
                    🔑 Reset My Password
                </a>
                <p style="color: #9ca3af; font-size: 13px; margin-top: 12px;">
                    Or copy this link: <a href="{reset_url}" style="color: #4f46e5;">{reset_url}</a>
                </p>
            </div>
            
            <div style="background: #fefce8; border: 1px solid #fde68a; border-radius: 12px; padding: 16px; margin: 24px 0;">
                <p style="font-size: 13px; color: #92400e; margin: 0; text-align: center;">
                    ⚠️ This link expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.
                </p>
            </div>
            
            <p style="font-size: 14px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 24px;">
                ¡Hasta pronto! — Profe Marta ❤️
            </p>
        </div>
    </div>
    """

    return _send_email(email, subject, html_body)
