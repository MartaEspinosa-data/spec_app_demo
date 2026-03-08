# API Contract: Teachers

**Base Path**: `/api/teachers`
**Feature**: Phase 1 MVP - Spanish Tutor Platform

## 1. Get Teachers List
Retrieve a list of available teachers with their basic profile for the landing page.

**Endpoint**: `GET /api/teachers`

### Response (200 OK)
```json
[
  {
    "id": "uuid-1",
    "name": "Profesor Mateo",
    "bio": "Expert in conversational Spanish...",
    "price_per_hour": 25.00,
    "languages": ["Spanish", "English"],
    "video_url": "https://youtube.com/v/example"
  }
]
```

## 2. Get Teacher Profile
Download full details for a single teacher to build the booking profile page.

**Endpoint**: `GET /api/teachers/{id}`

### Response (200 OK)
```json
{
  "id": "uuid-1",
  "name": "Profesor Mateo",
  "bio": "Full biography text...",
  "price_per_hour": 25.00,
  "languages": ["Spanish", "English"],
  "video_url": "https://youtube.com/v/example",
  "calendly_url": "https://calendly.com/mateo-spanish"
}
```

---

# API Contract: Lessons

**Base Path**: `/api/lessons`
**Feature**: Phase 1 MVP - Spanish Tutor Platform

## 1. Create Lesson Booking
Initiate a lesson booking after a user selects a slot in the Calendly embed.

**Endpoint**: `POST /api/lessons`

### Request (JSON)
```json
{
  "student_name": "Jane Student",
  "student_email": "jane@example.com",
  "teacher_id": "uuid-1",
  "lesson_type": "conversation",
  "start_time": "2026-03-20T17:00:00Z",
  "duration": 60,
  "calendly_event_id": "EV-1234"
}
```

### Response (201 Created)
Returns the created lesson and a Stripe Checkout URL to initiate payment.

```json
{
  "lesson_id": "uuid-lesson-123",
  "status": "pending",
  "stripe_checkout_url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

## 2. Stripe Webhook Handler
Internal endpoint called by Stripe to settle payment and confirm booking.

**Endpoint**: `POST /api/webhooks/stripe`
**Event**: `checkout.session.completed`

### Payload (Example)
```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_...",
      "metadata": {
        "lesson_id": "uuid-lesson-123"
      }
    }
  }
}
```

### Response (204 No Content)
Successfully marks the lesson as "scheduled".
