import os
from pathlib import Path
from dotenv import load_dotenv

_backend_env = Path(__file__).resolve().parent.parent.parent / ".env"
if _backend_env.is_file():
    load_dotenv(_backend_env)
load_dotenv()

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from typing import Optional

GOOGLE_MEET_LINK = "https://meet.google.com/pyv-dxwi-mxc"


def _reload_env():
    if _backend_env.is_file():
        load_dotenv(_backend_env)
    load_dotenv()


def get_teacher_email() -> str:
    """Return the recipient email address for teacher notifications."""
    _reload_env()
    return (
        os.getenv("TEACHER_NOTIFICATION_EMAIL")
        or os.getenv("TEACHER_EMAIL")
        or "martaespinosagarcia@gmail.com"
    )


def _send_email(to_email: str, subject: str, html_body: str) -> bool:
    """Internal helper to send an email via SMTP. Falls back to console logging in demo mode."""
    _reload_env()
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASS", "")
    sender_name = os.getenv("SENDER_NAME", "Profe Marta")

    target_email = to_email or get_teacher_email()
    safe_subject = subject.encode("ascii", errors="replace").decode("ascii")

    if not smtp_user or not smtp_pass:
        print(f"[EMAIL DEMO] To: {target_email}")
        print(f"[EMAIL DEMO] Subject: {safe_subject}")
        safe_preview = html_body[:200].encode("ascii", errors="replace").decode("ascii")
        print(f"[EMAIL DEMO] Body preview: {safe_preview}...")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{sender_name} <{smtp_user}>"
        msg["To"] = target_email
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)

        print(f"[EMAIL] Sent to {target_email}: {safe_subject}")
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send to {target_email}: {e}")
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


def send_teacher_notification(
    student_name: str,
    lesson_date: str,
    duration: int,
    lesson_type: str,
    student_payment_account: str = "",
    paid: bool = False,
    student_email: str = "",
    price: Optional[float] = None,
):
    """Notify Marta about a new lesson booking waiting for her acceptance or rejection."""
    load_dotenv()
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    dashboard_url = f"{frontend_url}/teacher/dashboard?tab=lessons"

    subject = f"🔔 Nueva clase para aceptar o rechazar: {student_name} ({lesson_date})"

    # Payment badge & note
    if paid:
        payment_badge = "✅ Pagado con Stripe"
        payment_badge_color = "#059669"
        payment_desc = "El pago ha sido completado y verificado en Stripe."
    else:
        payment_badge = "💵 Pago manual pendiente"
        payment_badge_color = "#d97706"
        payment_desc = "El alumno ha solicitado reserva manual. Verifica el pago antes de aceptar."

    # Price row
    price_row = ""
    if price is not None:
        price_row = f"""
                    <tr>
                        <td style="padding: 10px 0; color: #4b5563; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #f3f4f6;">PRECIO / AMOUNT</td>
                        <td style="padding: 10px 0; color: #111827; font-size: 15px; font-weight: 700; text-align: right; border-top: 1px solid #f3f4f6;">${price:.2f}</td>
                    </tr>
        """

    # Student email row
    student_email_row = ""
    if student_email:
        student_email_row = f"""
                    <tr>
                        <td style="padding: 10px 0; color: #4b5563; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #f3f4f6;">EMAIL ALUMNO</td>
                        <td style="padding: 10px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right; border-top: 1px solid #f3f4f6;"><a href="mailto:{student_email}" style="color: #4f46e5; text-decoration: none;">{student_email}</a></td>
                    </tr>
        """

    payment_info_block = ""
    if student_payment_account:
        payment_info_block = f"""
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; margin: 20px 0;">
            <p style="margin: 0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Detalle del pago:</p>
            <p style="margin: 4px 0 0 0; font-size: 13px; font-weight: 600; color: #1e293b; font-family: monospace;">{student_payment_account}</p>
        </div>
        """

    html_body = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
        <!-- Header Banner -->
        <div style="background-color: #4338ca; background: #4338ca; padding: 36px 24px; text-align: center;">
            <h1 style="color: #ffffff !important; font-size: 24px; font-weight: 800; margin: 0; line-height: 1.3;">🔔 Nueva Clase por Aceptar o Rechazar</h1>
            <p style="color: #e0e7ff !important; font-size: 14px; margin: 8px 0 0 0; font-weight: 600;">Tienes una clase pendiente de confirmación en tu panel</p>
        </div>

        <div style="padding: 32px 28px; background-color: #ffffff;">
            <p style="font-size: 18px; color: #111827; margin: 0 0 12px 0;">Hola <strong>Profe Marta</strong>,</p>
            <p style="font-size: 15px; color: #374151; line-height: 1.6; margin: 0 0 24px 0;">
                Has recibido una nueva clase con <strong>{student_name}</strong>. Esta clase se encuentra actualmente <strong>pendiente de aceptación</strong> en tu panel de control.
            </p>

            <!-- Lesson Details Table -->
            <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px 24px; margin: 24px 0; border: 1px solid #e5e7eb;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px 0; color: #4b5563; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">ALUMNO / STUDENT</td>
                        <td style="padding: 10px 0; color: #111827; font-size: 15px; font-weight: 700; text-align: right;">{student_name}</td>
                    </tr>
                    {student_email_row}
                    <tr>
                        <td style="padding: 10px 0; color: #4b5563; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #f3f4f6;">FECHA Y HORA</td>
                        <td style="padding: 10px 0; color: #111827; font-size: 15px; font-weight: 700; text-align: right; border-top: 1px solid #f3f4f6;">{lesson_date}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #4b5563; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #f3f4f6;">DURACIÓN</td>
                        <td style="padding: 10px 0; color: #111827; font-size: 15px; font-weight: 700; text-align: right; border-top: 1px solid #f3f4f6;">{duration} minutos</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #4b5563; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #f3f4f6;">TIPO DE CLASE</td>
                        <td style="padding: 10px 0; color: #111827; font-size: 15px; font-weight: 700; text-align: right; border-top: 1px solid #f3f4f6;">{lesson_type}</td>
                    </tr>
                    {price_row}
                    <tr>
                        <td style="padding: 10px 0; color: #4b5563; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #f3f4f6;">ESTADO DEL PAGO</td>
                        <td style="padding: 10px 0; color: {payment_badge_color}; font-size: 15px; font-weight: 700; text-align: right; border-top: 1px solid #f3f4f6;">{payment_badge}</td>
                    </tr>
                </table>
            </div>

            {payment_info_block}

            <!-- Instructions Box -->
            <div style="background-color: #fefce8; border: 1px solid #fde68a; border-radius: 12px; padding: 18px 20px; margin: 24px 0;">
                <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 800; color: #92400e;">
                    ⚡ ¿Qué debes hacer ahora?
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 13px; line-height: 1.6;">
                    <li style="margin-bottom: 6px;">
                        <strong>Aceptar la clase:</strong> Se confirmará el horario y se enviará un email al alumno con el enlace de Google Meet.
                    </li>
                    <li>
                        <strong>Rechazar la clase:</strong> Se cancelará la reserva y se realizará el reembolso completo al alumno de forma automática.
                    </li>
                </ul>
            </div>

            <!-- Call to action button -->
            <div style="text-align: center; margin: 32px 0 20px 0;">
                <a href="{dashboard_url}"
                   style="display: inline-block; background-color: #4f46e5; background: #4f46e5; color: #ffffff !important; padding: 16px 36px;
                          border-radius: 12px; text-decoration: none; font-size: 16px; font-weight: 800;
                          box-shadow: 0 4px 14px rgba(79,70,229,0.35);">
                    👉 Ver y Aceptar o Rechazar Clase en el Dashboard
                </a>
                <p style="color: #6b7280; font-size: 12px; margin: 12px 0 0 0;">
                    Enlace directo: <a href="{dashboard_url}" style="color: #4f46e5; font-weight: 600;">{dashboard_url}</a>
                </p>
            </div>

            <p style="font-size: 14px; color: #6b7280; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 24px; margin-top: 24px;">
                Panel de Profesora — Spanish with Marta ❤️
            </p>
        </div>
    </div>
    """

    return _send_email(get_teacher_email(), subject, html_body)


send_teacher_pending_lesson_email = send_teacher_notification


def send_lesson_reminder(
    email: str,
    name: str,
    lesson_time: str,
    minutes_left: int,
    meeting_link: Optional[str] = None,
    teacher_name: str = "Marta",
    lesson_id: Optional[str] = None,
    classroom_url: Optional[str] = None,
):
    """Send a reminder email before the lesson starts with a link to join the classroom on our platform."""
    load_dotenv()
    frontend_url = os.getenv("FRONTEND_URL", "https://martaspanishteacher.com").rstrip("/")

    # Resolve platform classroom URL instead of Google Meet
    join_url = classroom_url
    if not join_url:
        if lesson_id:
            join_url = f"{frontend_url}/classroom/{lesson_id}"
        elif meeting_link and "meet.google.com" not in meeting_link:
            join_url = meeting_link
        else:
            join_url = f"{frontend_url}/dashboard"

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
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #fed7aa; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
        <!-- Header Banner with solid vibrant warm background for full Outlook/Gmail support -->
        <div style="background-color: #ea580c; background: #ea580c; padding: 36px 24px; text-align: center;">
            <h1 style="color: #ffffff !important; font-size: 28px; font-weight: 800; margin: 0; line-height: 1.3;">¡Tu clase empieza pronto! 🇪🇸</h1>
            <p style="color: #ffedd5 !important; font-size: 16px; margin: 8px 0 0 0; font-weight: 600;">{subtitle_text}</p>
        </div>
        
        <div style="padding: 32px 28px; background-color: #ffffff;">
            <p style="font-size: 18px; color: #111827; margin: 0 0 12px 0;">Hola <strong>{name}</strong>,</p>
            <p style="font-size: 15px; color: #374151; line-height: 1.6; margin: 0 0 24px 0;">
                {reminder_text}. Prepárate y accede directamente a nuestra aula virtual para comenzar la clase.
            </p>

            <div style="background-color: #fff7ed; border-radius: 12px; padding: 20px 24px; margin: 24px 0; border: 1px solid #ffedd5;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #9a3412; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">HORA / TIME</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 15px; font-weight: 700; text-align: right;">{lesson_time}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #9a3412; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #fed7aa;">COMIENZA EN / STARTS IN</td>
                        <td style="padding: 8px 0; color: #ea580c; font-size: 15px; font-weight: 800; text-align: right; border-top: 1px solid #fed7aa;">{minutes_left} minutes</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #9a3412; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #fed7aa;">PLATAFORMA / PLATFORM</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 15px; font-weight: 700; text-align: right; border-top: 1px solid #fed7aa;">Aula Virtual Profe Marta 💻</td>
                    </tr>
                </table>
            </div>
            
            <div style="text-align: center; margin: 32px 0 20px 0;">
                <a href="{join_url}"
                   style="display: inline-block; background-color: #ea580c; background: #ea580c; color: #ffffff !important; padding: 18px 44px;
                           border-radius: 12px; text-decoration: none; font-size: 18px; font-weight: 800;
                           box-shadow: 0 4px 14px rgba(234,88,12,0.35);">
                    🚀 Entrar al Aula Virtual / Join Classroom
                </a>
                <p style="color: #6b7280; font-size: 13px; margin: 14px 0 0 0;">
                    Enlace directo al aula: <br/>
                    <a href="{join_url}" style="color: #ea580c; font-weight: 600; text-decoration: underline; word-break: break-all;">{join_url}</a>
                </p>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 24px; margin-top: 24px;">
                ¡Nos vemos en clase! — {teacher_name} ❤️
            </p>
        </div>
    </div>
    """

    return _send_email(email, subject, html_body)


def send_teacher_lesson_reminder(
    teacher_email: str,
    teacher_name: str,
    student_name: str,
    lesson_time: str,
    minutes_left: int,
    meeting_link: Optional[str] = None,
    lesson_id: Optional[str] = None,
    classroom_url: Optional[str] = None,
    duration: int = 60,
    lesson_type: str = "Spanish Lesson",
) -> bool:
    """Send a reminder email to the teacher before the lesson starts with a link to join the classroom."""
    load_dotenv()
    frontend_url = os.getenv("FRONTEND_URL", "https://martaspanishteacher.com").rstrip("/")

    join_url = classroom_url
    if not join_url:
        if lesson_id:
            join_url = f"{frontend_url}/classroom/{lesson_id}"
        elif meeting_link and "meet.google.com" not in meeting_link:
            join_url = meeting_link
        else:
            join_url = f"{frontend_url}/teacher/dashboard"

    if minutes_left == 60:
        time_text = "en 1 hora (60 minutos)"
        subject = f"⏰ Recordatorio: Tu clase con {student_name} comienza en 1 hora"
    elif minutes_left == 30:
        time_text = "en 30 minutos"
        subject = f"⏰ Recordatorio: Tu clase con {student_name} comienza en 30 minutos"
    else:
        time_text = f"en {minutes_left} minutos"
        subject = f"⏰ Recordatorio: Tu clase con {student_name} comienza en {minutes_left} minutos"

    html_body = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #c7d2fe; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
        <!-- Header Banner with solid dark indigo background -->
        <div style="background-color: #4338ca; background: #4338ca; padding: 36px 24px; text-align: center;">
            <h1 style="color: #ffffff !important; font-size: 28px; font-weight: 800; margin: 0; line-height: 1.3;">¡Tu clase comienza pronto! 👩‍🏫</h1>
            <p style="color: #e0e7ff !important; font-size: 16px; margin: 8px 0 0 0; font-weight: 600;">⏰ Tu clase con {student_name} empieza {time_text}</p>
        </div>
        
        <div style="padding: 32px 28px; background-color: #ffffff;">
            <p style="font-size: 18px; color: #111827; margin: 0 0 12px 0;">Hola <strong>{teacher_name}</strong>,</p>
            <p style="font-size: 15px; color: #374151; line-height: 1.6; margin: 0 0 24px 0;">
                Te recordamos que tu próxima clase con <strong>{student_name}</strong> comienza {time_text}. Accede al aula virtual para preparar la sesión y recibir a tu alumno.
            </p>

            <div style="background-color: #eef2ff; border-radius: 12px; padding: 20px 24px; margin: 24px 0; border: 1px solid #c7d2fe;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #3730a3; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">ALUMNO / STUDENT</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 15px; font-weight: 700; text-align: right;">{student_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #3730a3; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #c7d2fe;">HORA / TIME</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 15px; font-weight: 700; text-align: right;">{lesson_time}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #3730a3; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #c7d2fe;">DURACIÓN / DURATION</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 15px; font-weight: 700; text-align: right;">{duration} minutos</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #3730a3; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #c7d2fe;">TIPO / TYPE</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 15px; font-weight: 700; text-align: right;">{lesson_type}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #3730a3; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #c7d2fe;">COMIENZA EN / STARTS IN</td>
                        <td style="padding: 8px 0; color: #4338ca; font-size: 15px; font-weight: 800; text-align: right; border-top: 1px solid #c7d2fe;">{minutes_left} minutes</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #3730a3; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #c7d2fe;">PLATAFORMA / PLATFORM</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 15px; font-weight: 700; text-align: right;">Aula Virtual Profe Marta 💻</td>
                    </tr>
                </table>
            </div>
            
            <div style="text-align: center; margin: 32px 0 20px 0;">
                <a href="{join_url}"
                   style="display: inline-block; background-color: #4338ca; background: #4338ca; color: #ffffff !important; padding: 18px 44px;
                           border-radius: 12px; text-decoration: none; font-size: 18px; font-weight: 800;
                           box-shadow: 0 4px 14px rgba(67,56,202,0.35);">
                    🚀 Entrar al Aula Virtual / Join Classroom
                </a>
                <p style="color: #6b7280; font-size: 13px; margin: 14px 0 0 0;">
                    Enlace directo al aula: <br/>
                    <a href="{join_url}" style="color: #4338ca; font-weight: 600; text-decoration: underline; word-break: break-all;">{join_url}</a>
                </p>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 24px; margin-top: 24px;">
                ¡Buena clase! 🌟
            </p>
        </div>
    </div>
    """

    target_email = teacher_email or get_teacher_email()
    return _send_email(target_email, subject, html_body)


# ---------------------------------------------------------------------------
# Teacher Acceptance / Rejection Notification Emails
# ---------------------------------------------------------------------------

def send_teacher_acceptance_email(
    teacher_email: str,
    teacher_name: str,
    student_name: str,
    lesson_date: str,
    lesson_type: str,
    lesson_id: Optional[str] = None,
    classroom_url: Optional[str] = None,
):
    """Confirmation sent to the teacher after they accept a pending lesson."""
    subject = f"✅ Lesson Accepted: {student_name} on {lesson_date}"
    load_dotenv()
    frontend_url = os.getenv("FRONTEND_URL", "https://martaspanishteacher.com").rstrip("/")
    join_url = classroom_url or (f"{frontend_url}/classroom/{lesson_id}" if lesson_id else f"{frontend_url}/teacher/dashboard")

    html_body = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background-color: #065f46; background: #065f46; padding: 36px 24px; text-align: center;">
            <h1 style="color: #ffffff !important; font-size: 26px; font-weight: 800; margin: 0; line-height: 1.3;">✅ Lesson Accepted</h1>
            <p style="color: #d1fae5 !important; font-size: 15px; margin: 8px 0 0 0; font-weight: 600;">You confirmed this lesson</p>
        </div>
        <div style="padding: 32px 28px; background-color: #ffffff;">
            <p style="font-size: 18px; color: #111827; margin: 0 0 12px 0;">Hola <strong>{teacher_name}</strong>,</p>
            <p style="font-size: 15px; color: #374151; line-height: 1.6; margin: 0 0 24px 0;">
                You have accepted the lesson with <strong>{student_name}</strong>. The student has received their confirmation email with the link to our video classroom platform.
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
                    <tr>
                        <td style="padding: 10px 0; color: #4b5563; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #f3f4f6;">PLATFORM</td>
                        <td style="padding: 10px 0; color: #059669; font-size: 15px; font-weight: 700; text-align: right; border-top: 1px solid #f3f4f6;">Aula Virtual Profe Marta 💻</td>
                    </tr>
                </table>
            </div>

            <div style="text-align: center; margin: 30px 0 20px 0;">
                <a href="{join_url}"
                   style="display: inline-block; background-color: #059669; background: #059669; color: #ffffff !important; padding: 16px 36px;
                          border-radius: 12px; text-decoration: none; font-size: 16px; font-weight: 800;
                          box-shadow: 0 4px 12px rgba(5,150,105,0.3);">
                    🚀 Entrar al Aula Virtual / Enter Classroom
                </a>
                <p style="color: #6b7280; font-size: 13px; margin: 12px 0 0 0;">
                    Enlace al aula: <a href="{join_url}" style="color: #059669; font-weight: 600; text-decoration: underline; word-break: break-all;">{join_url}</a>
                </p>
            </div>

            <p style="font-size: 14px; color: #6b7280; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 24px; margin-top: 24px;">
                ¡Nos vemos en clase! — Profe Marta ❤️
            </p>
        </div>
    </div>
    """

    return _send_email(teacher_email, subject, html_body)


def send_student_acceptance_email(
    student_email: str,
    student_name: str,
    lesson_date: str,
    duration: int,
    lesson_type: str,
    lesson_id: Optional[str] = None,
    classroom_url: Optional[str] = None,
):
    """Notification sent to the student when the teacher accepts their lesson."""
    subject = f"🎉 ¡Tu clase de español ha sido confirmada! / Your Spanish Lesson is Confirmed!"
    load_dotenv()
    frontend_url = os.getenv("FRONTEND_URL", "https://martaspanishteacher.com").rstrip("/")
    join_url = classroom_url or (f"{frontend_url}/classroom/{lesson_id}" if lesson_id else f"{frontend_url}/dashboard")

    html_body = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
        <!-- Header Banner with dark solid background for full Outlook/Hotmail support -->
        <div style="background-color: #065f46; background: #065f46; padding: 36px 24px; text-align: center;">
            <h1 style="color: #ffffff !important; font-size: 26px; font-weight: 800; margin: 0; line-height: 1.3;">✅ ¡Clase Aceptada! 🇪🇸</h1>
            <p style="color: #d1fae5 !important; font-size: 15px; margin: 8px 0 0 0; font-weight: 600;">Profe Marta has confirmed your Spanish lesson</p>
        </div>
        
        <div style="padding: 32px 28px; background-color: #ffffff;">
            <p style="font-size: 18px; color: #111827; margin: 0 0 12px 0;">Hola <strong>{student_name}</strong>,</p>
            <p style="font-size: 15px; color: #374151; line-height: 1.6; margin: 0 0 24px 0;">
                ¡Buenas noticias! Profe Marta ha aceptado tu clase. Ya está todo preparado para nuestra sesión.
                <br/>
                <span style="color: #6b7280; font-size: 14px;">(Great news! Profe Marta has accepted your lesson. Everything is ready for your session.)</span>
            </p>
            
            <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px 24px; margin: 24px 0; border: 1px solid #e5e7eb;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px 0; color: #4b5563; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">FECHA Y HORA / DATE &amp; TIME</td>
                        <td style="padding: 10px 0; color: #111827; font-size: 15px; font-weight: 700; text-align: right;">{lesson_date}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #4b5563; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #f3f4f6;">DURACIÓN / DURATION</td>
                        <td style="padding: 10px 0; color: #111827; font-size: 15px; font-weight: 700; text-align: right; border-top: 1px solid #f3f4f6;">{duration} minutos</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #4b5563; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #f3f4f6;">TIPO DE CLASE / TYPE</td>
                        <td style="padding: 10px 0; color: #111827; font-size: 15px; font-weight: 700; text-align: right; border-top: 1px solid #f3f4f6;">{lesson_type}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; color: #4b5563; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-top: 1px solid #f3f4f6;">PLATAFORMA / PLATFORM</td>
                        <td style="padding: 10px 0; color: #059669; font-size: 15px; font-weight: 700; text-align: right; border-top: 1px solid #f3f4f6;">Aula Virtual Profe Marta 💻</td>
                    </tr>
                </table>
            </div>

            <!-- Video Platform Callout Box -->
            <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 20px 22px; margin: 24px 0;">
                <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 800; color: #065f46;">
                    💻 Aula Virtual con Videollamada / Video Platform
                </p>
                <p style="margin: 0; color: #047857; font-size: 14px; line-height: 1.6;">
                    Tu clase se realizará directamente en nuestra <strong>propia plataforma de video interactiva</strong> con videollamada y pizarra en tiempo real. A la hora acordada, solo tienes que hacer clic en el enlace para unirte:
                </p>
                <p style="margin: 8px 0 0 0; color: #065f46; font-size: 13px; line-height: 1.5; font-style: italic;">
                    (Your class will take place on our integrated video platform. No extra software or installation needed — simply click the button below to join!)
                </p>
            </div>

            <div style="text-align: center; margin: 32px 0 20px 0;">
                <a href="{join_url}"
                   style="display: inline-block; background-color: #059669; background: #059669; color: #ffffff !important; padding: 18px 40px;
                          border-radius: 12px; text-decoration: none; font-size: 18px; font-weight: 800;
                          box-shadow: 0 4px 14px rgba(5,150,105,0.35);">
                    🚀 Entrar al Aula Virtual / Join Video Classroom
                </a>
                <p style="color: #6b7280; font-size: 13px; margin: 14px 0 0 0;">
                    Enlace directo al aula / Direct classroom link: <br/>
                    <a href="{join_url}" style="color: #059669; font-weight: 600; text-decoration: underline; word-break: break-all;">{join_url}</a>
                </p>
            </div>

            <div style="background-color: #f9fafb; border-radius: 10px; padding: 14px 18px; margin: 20px 0; border: 1px dashed #d1d5db;">
                <p style="margin: 0; color: #4b5563; font-size: 13px; line-height: 1.5;">
                    💡 <strong>Consejo / Tip:</strong> Para una mejor experiencia, permite el acceso a tu cámara y micrófono en el navegador cuando entres al aula virtual.
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

