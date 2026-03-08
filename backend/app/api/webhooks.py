from fastapi import APIRouter, Request, HTTPException, Header, Depends
from sqlalchemy.orm import Session
from app.database import database
from app.models import lesson as models
import stripe
import os

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
                return {"status": "success"}

    return {"status": "ignored"}
