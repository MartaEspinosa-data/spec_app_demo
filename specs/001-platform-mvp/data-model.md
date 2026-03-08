# Data Model: Phase 1 MVP - Spanish Tutor Platform

**Feature**: Phase 1 MVP - Spanish Tutor Platform
**Status**: Proposal
**Date**: 2026-03-09

## Entities & Relationships

### 1. Student
*Represents a learner.*

| Field      | Type      | Validation              | Relationships        |
|------------|-----------|-------------------------|----------------------|
| id         | UUID      | Primary Key             | 1:N Lessons          |
| name       | String    | Min 2 chars             | 1:N Payments         |
| email      | String    | Unique, Email Format    |                      |
| created_at | DateTime  | Default: Now            |                      |

### 2. Teacher
*The instructor profile.*

| Field          | Type      | Validation              | Relationships        |
|----------------|-----------|-------------------------|----------------------|
| id             | UUID      | Primary Key             | 1:N Lessons          |
| name           | String    | Min 2 chars             |                      |
| bio            | Text      |                         |                      |
| languages      | List      | JSON format             |                      |
| price_per_hour | Decimal   | Positive, > 0           |                      |
| video_url      | String    | Valid URL Format        |                      |
| calendly_url   | String    | Valid Calendly Link     |                      |

### 3. Lesson
*A specific booking.*

| Field          | Type      | Validation              | Relationships        |
|----------------|-----------|-------------------------|----------------------|
| id             | UUID      | Primary Key             |                      |
| student_id     | UUID      | Foreign Key             | N:1 Student          |
| teacher_id     | UUID      | Foreign Key             | N:1 Teacher          |
| lesson_type    | String    | Enum: Conversation...   |                      |
| start_time     | DateTime  | Future Only             |                      |
| duration       | Integer   | Minutes (30, 60, 90)    |                      |
| price          | Decimal   | Point-in-time snapshot  |                      |
| status         | String    | Enum: Pending, Scheduled|                      |
| calendly_event_id| String  | External ID reference   |                      |

### 4. Payment
*Stripe transaction tracking.*

| Field            | Type      | Validation              | Relationships        |
|------------------|-----------|-------------------------|----------------------|
| id               | UUID      | Primary Key             |                      |
| lesson_id        | UUID      | Foreign Key             | 1:1 Lesson           |
| amount           | Decimal   | Final paid amount       |                      |
| stripe_session_id| String    | Unique index            |                      |
| status           | String    | Enum: Initiated, Paid...|                      |
| created_at       | DateTime  | Default: Now            |                      |

## State Transitions (Lesson)
1. **Initiated**: Student arrives on booking success from Calendly embed.
2. **Pending**: Database record created, redirect to Stripe.
3. **Scheduled**: Payment confirmed via Stripe Webhook.
4. **Completed**: Teacher marks as done after the session (Phase 2 feature).
5. **Cancelled**: Student/Teacher cancels via dashboard (Phase 1 basic support).
