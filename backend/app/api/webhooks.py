from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/webhooks", tags=["webhooks"])


@router.get("/health")
def webhook_health():
    """Webhook health check — reserved for future Stripe/email webhook integration."""
    return {"status": "ok", "service": "webhooks"}
