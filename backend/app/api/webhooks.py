from fastapi import APIRouter, Request, HTTPException, Header, Depends
from sqlalchemy.orm import Session
from app.database import database
from app.models import lesson as models
from app.models import student as student_models
import stripe
import os
from app.utils.email import send_lesson_confirmation

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])
stripe.api_key = os.getenv("STRIPE_API_KEY", "sk_test_placeholder")
webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_placeholder")

@router.post("/stripe")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None), db: Session = Depends(database.get_db)):
    payload = await request.body()
    
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, webhook_secret
        )
    except Exception as e:
        # In demo/local testing without valid signatures, we might want a fallback or just log error
        raise HTTPException(status_code=400, detail=str(e))

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        lesson_id = session.get("metadata", {}).get("lesson_id")
        
        if lesson_id:
            db_lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
            if db_lesson:
                db_lesson.status = "scheduled"
                db.commit()
                
                # Send confirmation email
                student = db.query(student_models.Student).filter(student_models.Student.id == db_lesson.student_id).first()
                if student:
                    lesson_date_str = db_lesson.start_time.strftime("%A, %B %d at %I:%M %p UTC") if db_lesson.start_time else "TBD"
                    send_lesson_confirmation(
                        student_email=student.email,
                        student_name=student.name,
                        lesson_date=lesson_date_str,
                        duration=db_lesson.duration,
                        lesson_type=db_lesson.lesson_type
                    )
                
                return {"status": "success"}

    return {"status": "ignored"}
