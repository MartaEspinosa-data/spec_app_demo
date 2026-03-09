# Feature Specification: Phase 1 MVP - Marta's Spanish Tutor Website

**Feature Branch**: `001-platform-mvp`  
**Created**: 2026-03-09  
**Status**: Draft  
**Input**: User description of the single-teacher Spanish Tutor Website for Marta.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Discover and Evaluate Teacher (Priority: P1)

A new student lands on the website and wants to find if Marta is the right fit. They can view Marta's profile, watch her introduction video, read her bio, and see the lesson packages offered (similar to Spanish with Caye).

**Why this priority**: Essential first step. Students won't book if they can't evaluate the teacher.

**Independent Test**: Student can navigate to the landing page and view all listed components: photo, video, bio, lesson packages (e.g., Starter Solo, Frequent Learner), and FAQ.

**Acceptance Scenarios**:

1. **Given** Marta's landing page, **When** a student visits, **Then** all profile components (bio, video, lesson packages) and a FAQ section are visible.
2. **Given** the landing page, **When** viewed on mobile, **Then** all elements reflow correctly and the "Book Lesson" button remains prominent.

---

### User Story 2 - Lesson Booking Flow via Calendly (Priority: P1)

A student decided to hire Marta and wants to book a trial lesson or a specific lesson package. The booking flow utilizes Calendly for scheduling.

**Why this priority**: Core value of the website. Enables the primary service.

**Independent Test**: Student selects a lesson package, picks a date/time from the Calendly widget/calendar, and successfully completes the booking.

**Acceptance Scenarios**:

1. **Given** available time slots in Calendly, **When** a student clicks "Book Lesson" or selects a package, **Then** the Calendly scheduling interface is displayed with Marta's availability.
2. **Given** the Calendly interface, **When** the student selects a time and confirms, **Then** a lesson record is pending until payment is confirmed.

---

### User Story 3 - Secure Online Payment via Stripe (Priority: P1)

A student pays for their booked lesson or package via Stripe to confirm the appointment.

**Why this priority**: Necessary for business viability and teacher productivity.

**Independent Test**: Completing a successful Stripe transaction updates the lesson status to "scheduled" and sends a confirmation to both student and Marta.

**Acceptance Scenarios**:

1. **Given** a pending Calendly booking, **When** a successful Stripe payment is completed, **Then** the lesson status changes to "scheduled".
2. **Given** a scheduled lesson, **When** payment is confirmed, **Then** both student and Marta receive notification emails.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display Marta's landing page with: photo, intro video, biography, FAQs, and lesson packages.
- **FR-002**: System MUST integrate with Calendly for Marta's availability and slot selection.
- **FR-003**: System MUST support booking specific lesson packages (e.g., Trial Lesson, Starter Solo, Frequent Learner).
- **FR-004**: System MUST integrate with Stripe for payments (single lessons or packages).
- **FR-005**: System MUST persist student and lesson data in the database (SQLite/Postgres). *No multiple teacher management required.*
- **FR-006**: System MUST set lesson status to 'scheduled' only after successful payment confirmation.
- **FR-007**: System MUST send confirmation emails to the student and Marta after successful booking/payment.

### Key Entities *(include if feature involves data)*

- **Student**: Basic profile (name, email, language level) for billing and notifications.
- **Lesson**: The core appointment record (student_id, Calendly event ID, date, status, package_type).
- **Payment**: Tracking Stripe transactions connected to lessons.

*Note: As this is a single-teacher platform exclusively for Marta, the "Teacher" entity is no longer required in the database; profile details can be statically configured.*

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can understand the service and Marta's offering within 10 seconds (clear hero section).
- **SC-002**: Students can complete a lesson booking from start (landing) to Calendly/Stripe flow in under 60 seconds.
- **SC-003**: Page load time for the landing page remains under 1 second on mobile networks.
- **SC-004**: 100% of successful payments result in a "scheduled" status update within 5 seconds.

## Edge Cases

- How does the system handle a failed or cancelled Stripe payment session? (Graceful return to booking or notification to retry).
- What if Marta updates her Calendly availability while a student is in the booking flow? (Handled natively by Calendly).
- Does the student book before paying, or pay before booking? (Depends on Calendly's native Stripe integration vs. post-booking payment link).

**Assumptions**:
- Initial version uses Stripe for all payments.
- Initial booking relies on Calendly integration.
- The platform is a single-tenant application exclusively for Marta (no multi-teacher marketplace features like search or teacher filtering).
- "Mobile First" means primary testing will be on mobile viewport sizes.
