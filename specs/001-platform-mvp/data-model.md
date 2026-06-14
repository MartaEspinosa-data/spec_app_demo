# Data Model: Phase 1 MVP - Spanish Tutor Platform

**Feature**: Phase 1 MVP - Spanish Tutor Platform
**Status**: Proposal
**Date**: 2026-03-09

## Entities & Relationships

### 1. Student

_Represents a learner._

| Field      | Type     | Validation           | Relationships |
| ---------- | -------- | -------------------- | ------------- |
| id         | UUID     | Primary Key          | 1:N Lessons   |
| name       | String   | Min 2 chars          | 1:N Payments  |
| email      | String   | Unique, Email Format |               |
| created_at | DateTime | Default: Now         |               |

### 2. Teacher

_The instructor profile._

| Field          | Type    | Validation          | Relationships |
| -------------- | ------- | ------------------- | ------------- |
| id             | UUID    | Primary Key         | 1:N Lessons   |
| name           | String  | Min 2 chars         |               |
| bio            | Text    |                     |               |
| languages      | List    | JSON format         |               |
| price_per_hour | Decimal | Positive, > 0       |               |
| video_url      | String  | Valid URL Format    |               |
| calendly_url   | String  | Valid Calendly Link |               |

### 3. Lesson

_A specific booking._

| Field             | Type     | Validation               | Relationships |
| ----------------- | -------- | ------------------------ | ------------- |
| id                | UUID     | Primary Key              |               |
| student_id        | UUID     | Foreign Key              | N:1 Student   |
| teacher_id        | UUID     | Foreign Key              | N:1 Teacher   |
| lesson_type       | String   | Enum: Conversation...    |               |
| start_time        | DateTime | Future Only              |               |
| duration          | Integer  | Minutes (30, 60, 90)     |               |
| price             | Decimal  | Point-in-time snapshot   |               |
| status            | String   | Enum: Pending, Scheduled |               |
| calendly_event_id | String   | External ID reference    |               |

### 4. Payment

_Stripe transaction tracking._

| Field             | Type     | Validation               | Relationships |
| ----------------- | -------- | ------------------------ | ------------- |
| id                | UUID     | Primary Key              |               |
| lesson_id         | UUID     | Foreign Key              | 1:1 Lesson    |
| amount            | Decimal  | Final paid amount        |               |
| stripe_session_id | String   | Unique index             |               |
| status            | String   | Enum: Initiated, Paid... |               |
| created_at        | DateTime | Default: Now             |               |

## State Transitions (Lesson)

```
                 ┌──────────┐
                 │ pending  │  ← Lesson record created, awaiting payment
                 └────┬─────┘
                      │
          ┌───────────┴───────────┐
          │                       │
     payment succeeds        payment expires
     (Stripe webhook)        or student cancels
          │                       │
          ▼                       ▼
   ┌──────────────┐       ┌───────────┐
   │  scheduled   │       │ cancelled │
   └──────┬───────┘       └───────────┘
          │
          │ teacher marks complete
          ▼
   ┌──────────────┐
   │  completed   │
   └──────────────┘
```

1. **pending** — Database record created when student chooses a slot and submits the booking form. The lesson is NOT yet confirmed. A Stripe Checkout Session is created and the student must pay.
2. **scheduled** — Payment succeeds (Stripe `checkout.session.completed` webhook). The lesson is **auto-confirmed** — no manual teacher acceptance is required for payment-backed lessons. The slot is now locked.
3. **completed** — Teacher marks the lesson as complete after the session via the feedback endpoint.
4. **cancelled** — Student cancels their own lesson (with 24h advance notice) OR the Stripe checkout session expires unpaid OR the teacher manually rejects it (rare, e.g., scheduling conflict).

**Key rule**: Payment-backed lessons (`payment_method='stripe'`) transition `pending→scheduled` automatically on payment success. The teacher does NOT manually accept these — the payment is the acceptance. Only unusual scenarios (e.g., a lesson created manually outside Stripe) might go through a teacher-accept path.
