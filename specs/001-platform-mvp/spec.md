# Feature Specification: Phase 1 MVP - Spanish Tutor Platform

**Feature Branch**: `001-platform-mvp`  
**Created**: 2026-03-09  
**Status**: Draft  
**Input**: User description of the complete Spanish Tutor Platform "Spec Kit".

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Discover and Evaluate Teacher (Priority: P1)

A new student lands on the platform and wants to find if this teacher is the right fit. They can view the profile, watch the video, and read the bio.

**Why this priority**: Essential first step. Students won't book if they can't evaluate the teacher.

**Independent Test**: Student can navigate to the teacher profile and view all listed components: photo, video, bio, and lesson types.

**Acceptance Scenarios**:

1. **Given** a teacher has a complete profile, **When** a student visits the landing/profile page, **Then** all profile components (bio, video, lesson types) are visible.
2. **Given** the profile page, **When** viewed on mobile, **Then** all elements reflow correctly and the "Book Now" button remains prominent.

---

### User Story 2 - Lesson Booking Flow (Priority: P1)

A student decided to hire the teacher and wants to book a specific lesson type and time slot.

**Why this priority**: Core value of the platform. Enables the primary service.

**Independent Test**: Student selects a lesson type, picks a date/time from the calendar, and is successfully redirected to the payment phase with a pending booking record.

**Acceptance Scenarios**:

1. **Given** available time slots, **When** a student selects a conversation lesson and a time slot, **Then** a lesson record is created with status "pending" (awaiting payment).
2. **Given** a selected booking, **When** the student confirms, **Then** they are redirected to Stripe Checkout.

---

### User Story 3 - Secure Online Payment (Priority: P1)

A student pays for their booked lesson via Stripe to confirm the appointment.

**Why this priority**: Necessary for business viability and teacher productivity.

**Independent Test**: Completing a successful Stripe transaction updates the lesson status to "scheduled" and sends a confirmation.

**Acceptance Scenarios**:

1. **Given** a pending booking, **When** a successful Stripe payment is completed, **Then** the lesson status changes to "scheduled".
2. **Given** a scheduled lesson, **When** payment is confirmed, **Then** both student and teacher receive notification emails.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a teacher profile with: photo, intro video (URL-based), biography, languages, and lesson types.
- **FR-002**: System MUST integrate with Calendly for availability or provide a self-managed calendar UI for slot selection.
- **FR-003**: System MUST support booking specific lesson types (e.g., Conversation, Grammar, Test Prep).
- **FR-004**: System MUST integrate with Stripe for single lesson payments.
- **FR-005**: System MUST provide a "per-lesson" payment option as part of the initial MVP.
- **FR-006**: System MUST persist student, teacher, and lesson data in the database (SQLite/Postgres).
- **FR-007**: System MUST set lesson status to 'scheduled' only after successful payment confirmation.
- **FR-008**: System MUST send confirmation emails after successful booking/payment.

### Key Entities *(include if feature involves data)*

- **Student**: Basic profile (name, email) for billing and notifications.
- **Teacher**: Core profile data (bio, languages, video_url, price_per_hour).
- **Lesson**: The core appointment record (student_id, teacher_id, date, status, type).
- **Payment**: Tracking Stripe transactions connected to lessons.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can understand the service within 10 seconds (clear hero section).
- **SC-002**: Students can complete a lesson booking from start (landing) to payment-redirect in under 60 seconds.
- **SC-003**: Page load time for the teacher profile remains under 1 second on mobile networks.
- **SC-004**: 100% of successful payments result in a "scheduled" status update within 5 seconds.

## Edge Cases

- What happens when two students attempt to book the same time slot simultaneously? (Concurrency handling).
- How does the system handle a failed or cancelled Stripe payment session? (Graceful return to booking).
- What if the teacher updates their availability while a student is in the booking flow?

**Assumptions**:
- Initial version uses Stripe for all payments.
- Initial booking relies on Calendly integration as per spec kit suggestions.
- "Mobile First" means primary testing will be on mobile viewport sizes.
