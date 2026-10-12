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
TEACHER_EMAIL = os.getenv("TEACHER_NOTIFICATION_EMAIL") or os.getenv("TEACHER_EMAIL", "")


def _send_email(to_email: str, subject: str, html_body: str) -> bool:
    """Internal helper to send an email via SMTP. Falls back to console logging in demo mode."""
    safe_subject = subject.encode("ascii", errors="replace").decode("ascii")
    if not SMTP_USER or not SMTP_PASS:
        print(f"[EMAIL DEMO] To: {to_email}")
        print(f"[EMAIL DEMO] Subject: {safe_subject}")
        safe_preview = html_body[:200].encode("ascii", errors="replace").decode("ascii")
        print(f"[EMAIL DEMO] Body preview: {safe_preview}...")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{SENDER_NAME} <{SMTP_USER}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)

        safe_subject = subject.encode("ascii", errors="replace").decode("ascii")
        print(f"[EMAIL] Sent to {to_email}: {safe_subject}")
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send to {to_email}: {e}")
        return False


def send_lesson_confirmation(student_email: str, student_name: str, lesson_date: str, duration: int, lesson_type: str, price: float = None):
    """Send a payment confirmation email to the student after completing Stripe checkout."""
    subject = "💳 Payment Received Successfully — Spanish with Marta"

    price_row = ""
    if price is not None:
        price_row = f"""
                    <tr>
                        <td style="padding: 10px 0; color: #4b5563; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #f3f4f6;">AMOUNT PAID</td>
                        <td style="padding: 10px 0; color: #111827; font-size: 15px; font-weight: 700; text-align: right; border-top: 1px solid #f3f4f6;">${price:.2f}</td>
                    </tr>
        """

    html_body = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
        <!-- Header Banner with dark solid background for Outlook/Hotmail -->
        <div style="background-color: #4338ca; background: #4338ca; padding: 36px 24px; text-align: center;">
            <h1 style="color: #ffffff !important; font-size: 26px; font-weight: 800; margin: 0; line-height: 1.3;">Payment Received Successfully 💳</h1>
            <p style="color: #e0e7ff !important; font-size: 15px; margin: 8px 0 0 0; font-weight: 600;">Thank you! Your payment has been processed</p>
        </div>
        
        <div style="padding: 32px 28px; background-color: #ffffff;">
            <p style="font-size: 18px; color: #111827; margin: 0 0 12px 0;">Hi <strong>{student_name}</strong>,</p>
            <p style="font-size: 15px; color: #374151; line-height: 1.6; margin: 0 0 24px 0;">
                Your payment has been received successfully. Thank you for booking a Spanish lesson with Profe Marta! Here are the details of your booking:
            </p>
            
            <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px 24px; margin: 24px 0; border: 1px solid #e5e7eb;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px 0; color: #4b5563; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">DATE &amp; TIME</td>
                        <td style="padding: 10px 0; color: #111827; font-size: 15px; font-weight: 700; text-align: right;">{lesson_date}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #4b5563; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #f3f4f6;">DURATION</td>
                        <td style="padding: 10px 0; color: #111827; font-size: 15px; font-weight: 700; text-align: right; border-top: 1px solid #f3f4f6;">{duration} minutes</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #4b5563; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #f3f4f6;">TYPE</td>
                        <td style="padding: 10px 0; color: #111827; font-size: 15px; font-weight: 700; text-align: right; border-top: 1px solid #f3f4f6;">{lesson_type}</td>
                    </tr>
                    {price_row}
                    <tr>
                        <td style="padding: 10px 0; color: #4b5563; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #f3f4f6;">PAYMENT STATUS</td>
                        <td style="padding: 10px 0; color: #059669; font-size: 15px; font-weight: 700; text-align: right; border-top: 1px solid #f3f4f6;">✅ Confirmed (Stripe)</td>
                    </tr>
                </table>
            </div>

            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px 20px; margin: 20px 0;">
                <p style="font-size: 14px; color: #166534; font-weight: 600; margin: 0; line-height: 1.6;">
                    📩 You will receive another email as soon as Profe Marta confirms your class for the agreed date and time.
                </p>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 24px; margin-top: 24px;">
                See you soon! — Profe Marta ❤️
            </p>
        </div>
    </div>
    """

    return _send_email(student_email, subject, html_body)


def send_teacher_notification(student_name: str, lesson_date: str, duration: int, lesson_type: str, student_payment_account: str = "", paid: bool = False):
    """Notify Marta about a new booking, including student payment details.

    When ``paid`` is True the email states that the student has paid the lesson.
    """
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    dashboard_url = f"{frontend_url}/teacher/dashboard?tab=lessons"
    if paid:
        subject = f"💳 {student_name} has paid the lesson ({lesson_date})"
        heading = "¡Clase pagada! 💳🇪🇸"
        intro = f"<strong>{student_name}</strong> has paid the lesson successfully via Stripe."
        payment_note = "Payment confirmed by Stripe."
    else:
        subject = f"🔔 New Booking: {student_name} ({lesson_date})"
        heading = "Nueva Clase Reservada! 🇪🇸"
        intro = f"You have a new booking from <strong>{student_name}</strong>."
        payment_note = "The student stated they transferred the payment from this account."

    payment_info_block = ""
    if student_payment_account:
        payment_info_block = f"""
        <div style="background: #fefce8; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="font-weight: bold; color: #92400e; margin: 0 0 8px 0;">💳 Student Payment Account:</p>
            <p style="font-size: 18px; font-weight: bold; color: #1f2937; margin: 0; font-family: monospace;">{student_payment_account}</p>
            <p style="font-size: 12px; color: #a16207; margin: 8px 0 0 0;">{payment_note}</p>
        </div>
        """

    html_body = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
        <h2 style="color: #4f46e5;">{heading}</h2>
        <p>{intro}</p>
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Date:</strong> {lesson_date}</p>
            <p><strong>Duration:</strong> {duration} mins</p>
            <p><strong>Type:</strong> {lesson_type}</p>
        </div>
        {payment_info_block}
        <div style="text-align: center; margin: 24px 0;">
            <a href="{dashboard_url}" style="display: inline-block; background: #4f46e5; color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-size: 16px; font-weight: bold;">
                Ver y Aceptar Clase en el Dashboard →
            </a>
        </div>
        <p style="font-size: 13px; color: #6b7280; text-align: center;">Accede a tu panel para aceptar o rechazar la clase: <a href="{dashboard_url}" style="color: #4f46e5;">Teacher Dashboard</a>.</p>
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
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background-color: #065f46; background: #065f46; padding: 36px 24px; text-align: center;">
            <h1 style="color: #ffffff !important; font-size: 26px; font-weight: 800; margin: 0; line-height: 1.3;">✅ Lesson Accepted</h1>
            <p style="color: #d1fae5 !important; font-size: 15px; margin: 8px 0 0 0; font-weight: 600;">You confirmed this lesson</p>
        </div>
        <div style="padding: 32px 28px; background-color: #ffffff;">
            <p style="font-size: 18px; color: #111827; margin: 0 0 12px 0;">Hola <strong>{teacher_name}</strong>,</p>
            <p style="font-size: 15px; color: #374151; line-height: 1.6; margin: 0 0 24px 0;">
                You have accepted the lesson with <strong>{student_name}</strong>. The student has been notified.
            </p>
            <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px 24px; margin: 24px 0; border: 1px solid #e5e7eb;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px 0; color: #4b5563; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">STUDENT</td>
                        <td style="padding: 10px 0; color: #111827; font-size: 15px; font-weight: 700; text-align: right;">{student_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #4b5563; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #f3f4f6;">DATE &amp; TIME</td>
                        <td style="padding: 10px 0; color: #111827; font-size: 15px; font-weight: 700; text-align: right; border-top: 1px solid #f3f4f6;">{lesson_date}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #4b5563; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #f3f4f6;">TYPE</td>
                        <td style="padding: 10px 0; color: #111827; font-size: 15px; font-weight: 700; text-align: right; border-top: 1px solid #f3f4f6;">{lesson_type}</td>
                    </tr>
                </table>
            </div>
            <p style="font-size: 14px; color: #6b7280; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 24px; margin-top: 24px;">
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
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
        <!-- Header Banner with dark solid background for full Outlook/Hotmail support -->
        <div style="background-color: #065f46; background: #065f46; padding: 36px 24px; text-align: center;">
            <h1 style="color: #ffffff !important; font-size: 26px; font-weight: 800; margin: 0; line-height: 1.3;">✅ ¡Clase Aceptada! 🇪🇸</h1>
            <p style="color: #d1fae5 !important; font-size: 15px; margin: 8px 0 0 0; font-weight: 600;">Your teacher has confirmed your Spanish lesson</p>
        </div>
        
        <div style="padding: 32px 28px; background-color: #ffffff;">
            <p style="font-size: 18px; color: #111827; margin: 0 0 12px 0;">Hola <strong>{student_name}</strong>,</p>
            <p style="font-size: 15px; color: #374151; line-height: 1.6; margin: 0 0 24px 0;">
                Profe Marta has accepted your lesson. Here are your lesson details:
            </p>
            
            <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px 24px; margin: 24px 0; border: 1px solid #e5e7eb;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px 0; color: #4b5563; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">DATE &amp; TIME</td>
                        <td style="padding: 10px 0; color: #111827; font-size: 15px; font-weight: 700; text-align: right;">{lesson_date}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #4b5563; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #f3f4f6;">DURATION</td>
                        <td style="padding: 10px 0; color: #111827; font-size: 15px; font-weight: 700; text-align: right; border-top: 1px solid #f3f4f6;">{duration} minutes</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #4b5563; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #f3f4f6;">TYPE</td>
                        <td style="padding: 10px 0; color: #111827; font-size: 15px; font-weight: 700; text-align: right; border-top: 1px solid #f3f4f6;">{lesson_type}</td>
                    </tr>
                </table>
            </div>

            <div style="text-align: center; margin: 32px 0 20px 0;">
                <a href="{GOOGLE_MEET_LINK}"
                   style="display: inline-block; background-color: #059669; background: #059669; color: #ffffff !important; padding: 16px 36px;
                          border-radius: 12px; text-decoration: none; font-size: 17px; font-weight: 800;
                          box-shadow: 0 4px 12px rgba(5,150,105,0.3);">
                    📹 Join Google Meet Lesson
                </a>
                <p style="color: #6b7280; font-size: 13px; margin: 12px 0 0 0;">
                    Meeting link: <a href="{GOOGLE_MEET_LINK}" style="color: #059669; font-weight: 600; text-decoration: underline;">{GOOGLE_MEET_LINK}</a>
                </p>
            </div>

            <p style="font-size: 14px; color: #6b7280; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 24px; margin-top: 24px;">
                ¡Nos vemos pronto en clase! — Profe Marta ❤️
            </p>
        </div>
    </div>
    """

    return _send_email(student_email, subject, html_body)


def send_student_rejection_email(student_email: str, student_name: str, lesson_date: str, lesson_type: str, price: float):
    """Notification sent to the student when the teacher rejects their lesson. Includes refund info."""
    subject = f"❌ Your Spanish Lesson Request was Declined"

    html_body = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background-color: #991b1b; background: #991b1b; padding: 36px 24px; text-align: center;">
            <h1 style="color: #ffffff !important; font-size: 26px; font-weight: 800; margin: 0; line-height: 1.3;">❌ Clase No Confirmada</h1>
            <p style="color: #fee2e2 !important; font-size: 15px; margin: 8px 0 0 0; font-weight: 600;">Your lesson request could not be accepted</p>
        </div>
        <div style="padding: 32px 28px; background-color: #ffffff;">
            <p style="font-size: 18px; color: #111827; margin: 0 0 12px 0;">Hola <strong>{student_name}</strong>,</p>
            <p style="font-size: 15px; color: #374151; line-height: 1.6; margin: 0 0 24px 0;">
                Unfortunately, Profe Marta is unable to accept your lesson request for the requested time:
            </p>
            <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px 24px; margin: 24px 0; border: 1px solid #e5e7eb;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px 0; color: #4b5563; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">DATE &amp; TIME</td>
                        <td style="padding: 10px 0; color: #111827; font-size: 15px; font-weight: 700; text-align: right;">{lesson_date}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #4b5563; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #f3f4f6;">TYPE</td>
                        <td style="padding: 10px 0; color: #111827; font-size: 15px; font-weight: 700; text-align: right; border-top: 1px solid #f3f4f6;">{lesson_type}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #4b5563; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #f3f4f6;">AMOUNT</td>
                        <td style="padding: 10px 0; color: #111827; font-size: 15px; font-weight: 700; text-align: right; border-top: 1px solid #f3f4f6;">${price:.2f}</td>
                    </tr>
                </table>
            </div>
            <div style="background-color: #fefce8; border: 1px solid #fde68a; border-radius: 12px; padding: 18px; margin: 24px 0; text-align: center;">
                <p style="font-size: 15px; color: #92400e; font-weight: 700; margin: 0;">💸 A full refund of <strong>${price:.2f}</strong> is being processed.</p>
                <p style="font-size: 13px; color: #a16207; margin: 6px 0 0 0;">Please allow 5–10 business days for the credit to appear on your statement.</p>
            </div>
            <p style="font-size: 15px; color: #374151; text-align: center; margin: 24px 0;">
                You are welcome to <a href="{os.getenv('FRONTEND_URL', 'https://martaspanishteacher.com')}" style="color: #4f46e5; font-weight: bold; text-decoration: underline;">book another time slot</a> that fits your schedule.
            </p>
            <p style="font-size: 14px; color: #6b7280; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 24px; margin-top: 24px;">
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
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background-color: #991b1b; background: #991b1b; padding: 36px 24px; text-align: center;">
            <h1 style="color: #ffffff !important; font-size: 26px; font-weight: 800; margin: 0; line-height: 1.3;">❌ Lesson Rejected</h1>
            <p style="color: #fee2e2 !important; font-size: 15px; margin: 8px 0 0 0; font-weight: 600;">You declined this lesson request</p>
        </div>
        <div style="padding: 32px 28px; background-color: #ffffff;">
            <p style="font-size: 18px; color: #111827; margin: 0 0 12px 0;">Hola <strong>{teacher_name}</strong>,</p>
            <p style="font-size: 15px; color: #374151; line-height: 1.6; margin: 0 0 24px 0;">
                You have rejected the lesson request from <strong>{student_name}</strong>. The student has been notified and their refund is being processed.
            </p>
            <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px 24px; margin: 24px 0; border: 1px solid #e5e7eb;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px 0; color: #4b5563; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">STUDENT</td>
                        <td style="padding: 10px 0; color: #111827; font-size: 15px; font-weight: 700; text-align: right;">{student_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #4b5563; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #f3f4f6;">DATE &amp; TIME</td>
                        <td style="padding: 10px 0; color: #111827; font-size: 15px; font-weight: 700; text-align: right; border-top: 1px solid #f3f4f6;">{lesson_date}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #4b5563; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #f3f4f6;">TYPE</td>
                        <td style="padding: 10px 0; color: #111827; font-size: 15px; font-weight: 700; text-align: right; border-top: 1px solid #f3f4f6;">{lesson_type}</td>
                    </tr>
                </table>
            </div>
            <p style="font-size: 14px; color: #6b7280; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 24px; margin-top: 24px;">
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
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background-color: #4338ca; background: #4338ca; padding: 36px 24px; text-align: center;">
            <h1 style="color: #ffffff !important; font-size: 26px; font-weight: 800; margin: 0; line-height: 1.3;">Password Reset 🔐</h1>
            <p style="color: #e0e7ff !important; font-size: 15px; margin: 8px 0 0 0; font-weight: 600;">You requested a password reset</p>
        </div>
        
        <div style="padding: 32px 28px; background-color: #ffffff;">
            <p style="font-size: 18px; color: #111827; margin: 0 0 12px 0;">Hola <strong>{name}</strong>,</p>
            <p style="font-size: 15px; color: #374151; line-height: 1.6; margin: 0 0 24px 0;">
                We received a request to reset the password for your {role} account on Spanish with Marta.
                Click the button below to set a new password:
            </p>
            
            <div style="text-align: center; margin: 32px 0 20px 0;">
                <a href="{reset_url}"
                   style="display: inline-block; background-color: #4f46e5; background: #4f46e5; color: #ffffff !important; padding: 16px 36px;
                          border-radius: 12px; text-decoration: none; font-size: 17px; font-weight: 800;
                          box-shadow: 0 4px 12px rgba(79,70,229,0.3);">
                    🔑 Reset My Password
                </a>
                <p style="color: #6b7280; font-size: 13px; margin: 12px 0 0 0;">
                    Or copy this link: <a href="{reset_url}" style="color: #4f46e5; font-weight: 600; text-decoration: underline;">{reset_url}</a>
                </p>
            </div>
            
            <div style="background-color: #fefce8; border: 1px solid #fde68a; border-radius: 12px; padding: 16px; margin: 24px 0;">
                <p style="font-size: 13px; color: #92400e; margin: 0; text-align: center;">
                    ⚠️ This link expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.
                </p>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 24px; margin-top: 24px;">
                ¡Hasta pronto! — Profe Marta ❤️
            </p>
        </div>
    </div>
    """

    return _send_email(email, subject, html_body)


# ---------------------------------------------------------------------------
# Welcome Email (new student account)
# ---------------------------------------------------------------------------

def send_student_welcome_email(email: str, name: str):
    """Congratulate a student on creating their account and invite them to book a lesson."""
    frontend_url = os.getenv("FRONTEND_URL", "https://martaspanishteacher.com")
    subject = "🎉 ¡Bienvenido/a! Your account is ready — Spanish with Marta"

    html_body = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background-color: #4338ca; background: #4338ca; padding: 36px 24px; text-align: center;">
            <h1 style="color: #ffffff !important; font-size: 26px; font-weight: 800; margin: 0; line-height: 1.3;">¡Enhorabuena! 🎉🇪🇸</h1>
            <p style="color: #e0e7ff !important; font-size: 15px; margin: 8px 0 0 0; font-weight: 600;">Your account has been created successfully</p>
        </div>

        <div style="padding: 32px 28px; background-color: #ffffff;">
            <p style="font-size: 18px; color: #111827; margin: 0 0 12px 0;">Hola <strong>{name}</strong>,</p>
            <p style="font-size: 15px; color: #374151; line-height: 1.6; margin: 0 0 24px 0;">
                Congratulations — you now have an account with <strong>Spanish with Marta</strong>!
                You can now book Spanish lessons, manage your upcoming classes and review your lesson feedback, all in one place.
            </p>

            <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px 24px; margin: 24px 0; border: 1px solid #e5e7eb;">
                <p style="font-size: 13px; color: #4b5563; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">WHAT YOU CAN DO NOW</p>
                <p style="font-size: 15px; color: #111827; margin: 8px 0; font-weight: 600;">📅 Book your first Spanish lesson</p>
                <p style="font-size: 15px; color: #111827; margin: 8px 0; font-weight: 600;">📹 Join your classes via Google Meet</p>
                <p style="font-size: 15px; color: #111827; margin: 8px 0; font-weight: 600;">📝 Review vocabulary, corrections &amp; materials after each class</p>
            </div>

            <div style="text-align: center; margin: 32px 0 20px 0;">
                <a href="{frontend_url}"
                   style="display: inline-block; background-color: #4f46e5; background: #4f46e5; color: #ffffff !important; padding: 16px 36px;
                          border-radius: 12px; text-decoration: none; font-size: 17px; font-weight: 800;
                          box-shadow: 0 4px 12px rgba(79,70,229,0.3);">
                    📚 Book a Lesson
                </a>
            </div>

            <p style="font-size: 14px; color: #6b7280; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 24px; margin-top: 24px;">
                ¡Nos vemos pronto en clase! — Profe Marta ❤️
            </p>
        </div>
    </div>
    """

    return _send_email(email, subject, html_body)


# ---------------------------------------------------------------------------
# Account Verification Email
# ---------------------------------------------------------------------------

def send_student_verification_email(email: str, name: str, verify_url: str):
    """Send an account verification email with a secure link to confirm the email exists."""
    subject = "✉️ Confirma tu correo — Spanish with Marta"

    html_body = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background-color: #4338ca; background: #4338ca; padding: 36px 24px; text-align: center;">
            <h1 style="color: #ffffff !important; font-size: 26px; font-weight: 800; margin: 0; line-height: 1.3;">¡Verifica tu cuenta! ✉️🇪🇸</h1>
            <p style="color: #e0e7ff !important; font-size: 15px; margin: 8px 0 0 0; font-weight: 600;">Please verify your email address to get started</p>
        </div>

        <div style="padding: 32px 28px; background-color: #ffffff;">
            <p style="font-size: 18px; color: #111827; margin: 0 0 12px 0;">Hola <strong>{name}</strong>,</p>
            <p style="font-size: 15px; color: #374151; line-height: 1.6; margin: 0 0 24px 0;">
                Thank you for creating an account on <strong>Spanish with Marta</strong>!
                Please confirm that this is your email address by clicking the button below:
            </p>

            <div style="text-align: center; margin: 32px 0 20px 0;">
                <a href="{verify_url}"
                   style="display: inline-block; background-color: #4f46e5; background: #4f46e5; color: #ffffff !important; padding: 16px 36px;
                          border-radius: 12px; text-decoration: none; font-size: 17px; font-weight: 800;
                          box-shadow: 0 4px 12px rgba(79,70,229,0.3);">
                    ✅ Confirm Email Address
                </a>
                <p style="color: #6b7280; font-size: 13px; margin: 12px 0 0 0;">
                    Or copy this link: <a href="{verify_url}" style="color: #4f46e5; font-weight: 600; text-decoration: underline;">{verify_url}</a>
                </p>
            </div>

            <div style="background-color: #fefce8; border: 1px solid #fde68a; border-radius: 12px; padding: 16px; margin: 24px 0;">
                <p style="font-size: 13px; color: #92400e; margin: 0; text-align: center;">
                    ⚠️ This link expires in <strong>24 hours</strong>. If you did not create this account, you can safely ignore this email.
                </p>
            </div>

            <p style="font-size: 14px; color: #6b7280; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 24px; margin-top: 24px;">
                ¡Hasta pronto! — Profe Marta ❤️
            </p>
        </div>
    </div>
    """

    return _send_email(email, subject, html_body)

