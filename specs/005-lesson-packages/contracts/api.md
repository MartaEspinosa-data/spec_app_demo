# API Contracts: Lesson Packages

## 1. **GET /api/v1/packages/preview**
Calculate package pricing for a given lesson type and duration (public endpoint).

**Query Parameters**:
- `lesson_type`: string (e.g. "Conversación")
- `duration`: integer (30, 45, or 60)
- `teacher_id`: string (optional)

**Response (200 OK)**:
```json
{
  "lesson_type": "Conversación",
  "duration": 60,
  "count": 5,
  "single_price": 31.00,
  "subtotal": 155.00,
  "discount_percent": 3.0,
  "discount_amount": 4.65,
  "total_price": 150.35,
  "per_lesson_price": 30.07,
  "currency": "EUR"
}
```

---

## 2. **POST /api/v1/packages/purchase**
Initiates the purchase of a 5-lesson package. Returns Stripe Checkout URL.
Requires student authentication (`require_student`).

**Payload**:
```json
{
  "teacher_id": "dc92ef71-d458-4e75-92d9-69b64fc1c964",
  "lesson_type": "Conversación",
  "duration": 60
}
```

**Response (200 OK)**:
```json
{
  "package_id": "pkg_12345",
  "stripe_checkout_url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "total_price": 150.35,
  "currency": "EUR"
}
```

---

## 3. **GET /api/v1/packages/student/{student_id}**
Returns all packages for the authenticated student.
Requires student authentication (`require_student`).

**Response (200 OK)**:
```json
{
  "packages": [
    {
      "id": "pkg_12345",
      "teacher_id": "dc92ef71-...",
      "teacher_name": "Profe Marta",
      "lesson_type": "Conversación",
      "duration": 60,
      "total_credits": 5,
      "used_credits": 2,
      "remaining_credits": 3,
      "discount_percent": 3.0,
      "total_price": 150.35,
      "per_lesson_price": 30.07,
      "status": "active",
      "created_at": "2026-10-23T12:00:00Z",
      "lessons": [
        {
          "id": "les_01",
          "start_time": "2026-10-25T10:00:00Z",
          "status": "scheduled"
        }
      ]
    }
  ]
}
```

---

## 4. **POST /api/v1/packages/{package_id}/book**
Book a slot using a package credit. Creates a confirmed lesson without extra payment.
Requires student authentication (`require_student`).

**Payload**:
```json
{
  "start_time": "2026-10-26T15:00:00Z",
  "student_timezone": "Europe/Madrid"
}
```

**Response (200 OK)**:
```json
{
  "lesson_id": "les_999",
  "package_id": "pkg_12345",
  "remaining_credits": 2,
  "status": "scheduled",
  "meeting_link": "https://meet.google.com/pyv-dxwi-mxc"
}
```
