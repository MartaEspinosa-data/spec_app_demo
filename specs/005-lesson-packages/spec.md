# Feature Specification: Lesson Packages (5-Class Bundles with 3% Discount)

**Feature Branch**: `005-lesson-packages`  
**Created**: 2026-10-23  
**Status**: Draft  
**Input**: User description: "Me gustaría que el alumno tuviera la opción de reservar paquetes de 5 clases con un descuento del 3%"

## Clarifications

### Session 2026-10-23

- Q: How does the student book the 5 lessons of a package? → A: The student buys 5 credits up front and books each lesson whenever they want from their student portal.
- Q: How is the package charged? → A: A single payment for all 5 lessons with the 3% discount applied, with the amount calculated dynamically (no new pre-defined products in the payment provider).
- Q: Must all lessons in a package share the same type and duration? → A: Yes. The student picks lesson type and duration at purchase time; the package contains 5 identical lessons.
- Q: What happens when a package lesson is cancelled by the student or rejected by the teacher? → A: The credit is returned to the package (no money refund).
- Q: Process? → A: Full speckit flow with a new spec (005-lesson-packages).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Purchase a 5-lesson package (Priority: P1)

A logged-in student wants to commit to regular classes and save money. From the booking page they choose "Package of 5 lessons", select a lesson type and a duration, see the regular price for 5 lessons, the 3% discount and the final total, and pay once. After payment the package appears in their student portal with 5 available credits.

**Why this priority**: Without the ability to buy a package there is no feature. It also delivers immediate business value (upfront revenue, student commitment).

**Independent Test**: Log in as a student, buy a package of 5 × 60-min Conversation lessons, complete payment, and verify the portal shows a package with 5 of 5 credits remaining and the discounted total paid.

**Acceptance Scenarios**:

1. **Given** a logged-in student on the booking page, **When** they select "Package of 5" with type "Conversation" and duration 60 min, **Then** they see: single-lesson price €31.00, subtotal €155.00, discount 3% (−€4.65), total €150.35.
2. **Given** the student confirms the package, **When** payment completes successfully, **Then** the package is activated with 5 available credits and the student receives a confirmation email with the package details.
3. **Given** the student abandons or fails the payment, **When** they return to the site, **Then** no credits are available and the package is not shown as active.
4. **Given** a visitor who is not logged in, **When** they select the package option, **Then** they are asked to log in or register before purchasing.

---

### User Story 2 - Book a lesson using a package credit (Priority: P1)

A student with an active package opens the booking calendar, picks an available slot, and books it using one of their package credits — without paying again. The lesson is created with the package's type and duration, and the remaining credits decrease by one.

**Why this priority**: Credits are worthless unless they can be redeemed; this completes the core value loop together with Story 1.

**Independent Test**: With an active package holding 5 credits, book a slot via "Use package credit" and verify the lesson appears in "My lessons", the teacher is notified, and the package shows 4 of 5 credits remaining.

**Acceptance Scenarios**:

1. **Given** a student with an active package (≥1 credit), **When** they choose a free slot and confirm "Use package credit", **Then** a lesson is created for that slot with the package's type and duration, no payment is requested, and remaining credits decrease by 1.
2. **Given** a package credit booking, **When** the lesson is created, **Then** the teacher receives the same "new lesson" notification as for a paid individual lesson (marked as paid via package) and the student receives a booking confirmation.
3. **Given** a student whose package has 0 credits remaining, **When** they try to book with that package, **Then** the option is not available and they are offered to buy an individual lesson or a new package.
4. **Given** the selected slot was taken by someone else meanwhile, **When** the student confirms, **Then** the booking is rejected with a "slot no longer available" message and no credit is consumed.
5. **Given** the standard booking rules (minimum 12 h in advance, teacher availability), **When** booking with a credit, **Then** the same rules apply as for individual lessons.

---

### User Story 3 - View package status in the student portal (Priority: P2)

The student sees each of their packages in their portal: lesson type, duration, credits used/remaining, price paid, purchase date, and the list of lessons booked with it.

**Why this priority**: Transparency builds trust and drives re-purchase, but the core purchase/redeem flow works without a rich view.

**Independent Test**: With a package that has 2 booked lessons, open the portal and verify it shows "3 of 5 remaining" and lists the 2 lessons.

**Acceptance Scenarios**:

1. **Given** a student with one or more packages, **When** they open the portal, **Then** each package shows type, duration, remaining/total credits, total paid, and purchase date.
2. **Given** a package with all 5 credits used, **Then** it is shown as "Completed" and a "Buy another package" call-to-action is displayed.

---

### User Story 4 - Credit returned on cancellation or rejection (Priority: P2)

If the student cancels a package lesson (respecting the existing 24 h rule) or the teacher rejects/cancels it, the credit returns to the package instead of issuing a money refund.

**Why this priority**: Required for fairness and consistency with the chosen policy, but rarer than the main flows.

**Independent Test**: Book a lesson with a credit (4 remaining), cancel it more than 24 h before, verify credits return to 5 and no refund is attempted.

**Acceptance Scenarios**:

1. **Given** a scheduled/pending package lesson more than 24 h away, **When** the student cancels it, **Then** the lesson is cancelled, the slot is freed, and the package regains 1 credit.
2. **Given** a package lesson, **When** the teacher rejects or cancels it, **Then** the lesson is cancelled, the package regains 1 credit, no money refund is issued, and the student's email states the credit has been returned (instead of "refund being processed").
3. **Given** a package lesson less than 24 h away, **When** the student tries to cancel, **Then** the existing 24 h rule blocks it and the credit is not returned.

---

### User Story 5 - Teacher visibility of package lessons (Priority: P3)

The teacher can tell in her dashboard which lessons were booked with a package credit and see the per-lesson value.

**Why this priority**: Useful for bookkeeping; not required for students to use the feature.

**Independent Test**: Book a lesson with a credit and verify the teacher dashboard shows a "Package" badge on it.

**Acceptance Scenarios**:

1. **Given** a lesson booked with a package credit, **When** the teacher views her lessons, **Then** it is labelled "Package" and shows the discounted per-lesson price.

### Edge Cases

- **Double-spend**: Two simultaneous bookings with the last remaining credit → exactly one succeeds; the other is rejected and no negative balance occurs.
- **Duplicate payment confirmation**: Payment confirmation received multiple times (webhook + success-page polling) → package activated once, credits granted once, one confirmation email.
- **Rounding**: Total = 5 × single price × 0.97 rounded to 2 decimals; per-lesson recorded value = total ÷ 5 rounded to 2 decimals (e.g. 60-min Conversation: €150.35 total, €30.07 per lesson).
- **Price changes**: Changing standard lesson prices later does not alter the price paid for, or the per-lesson value of, already purchased packages.
- **Rescheduling**: Rescheduling a package lesson works exactly like an individual lesson and does not consume an additional credit.
- **Payment provider unavailable**: If online payment is not configured, the package option is hidden or shown as unavailable (no manual-payment fallback for packages).
- **Multiple packages**: A student can hold several packages (even of different types/durations); when booking they choose which package to use, defaulting to the oldest active package.
- **Lesson duration mismatch**: When booking with a credit, the calendar uses the package's duration; the student cannot change it.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST offer a "Package of 5 lessons" option alongside the individual lesson option on the booking page.
- **FR-002**: Students MUST select one lesson type and one duration (30, 45 or 60 min) for the package; all 5 credits are bound to that type and duration.
- **FR-003**: The system MUST compute the package price as 5 × the standard single-lesson price for the chosen type/duration, minus a 3% discount, rounded to 2 decimals.
- **FR-004**: The system MUST display the single-lesson price, the subtotal, the discount amount and percentage, and the final total before payment.
- **FR-005**: Only authenticated, verified students MUST be able to purchase a package.
- **FR-006**: The system MUST collect a single online payment for the package total and only activate the package (grant 5 credits) after payment is confirmed.
- **FR-007**: Package activation MUST be idempotent: repeated payment confirmations must not grant extra credits or duplicate emails.
- **FR-008**: Students with an active package MUST be able to book an available slot using one credit without additional payment.
- **FR-009**: Booking with a credit MUST apply the same availability, double-booking and 12 h minimum-notice rules as individual bookings.
- **FR-010**: Consuming a credit MUST be atomic with lesson creation; a credit is only consumed if the lesson is created, and balances can never go negative.
- **FR-011**: Lessons booked with a credit MUST record their link to the package and a per-lesson value equal to the package total ÷ 5.
- **FR-012**: When a package lesson is cancelled by the student (subject to the 24 h rule) or rejected/cancelled by the teacher, the system MUST return 1 credit to the package and MUST NOT issue a money refund for that lesson.
- **FR-013**: Rejection/cancellation emails for package lessons MUST state that the credit was returned rather than that a refund is being processed.
- **FR-014**: The student portal MUST list the student's packages with type, duration, remaining/total credits, total paid, purchase date, status (active / completed) and booked lessons.
- **FR-015**: The student MUST receive a confirmation email upon package activation; the teacher MUST be notified of each new package purchase.
- **FR-016**: The teacher dashboard MUST visually distinguish package lessons from individual lessons.
- **FR-017**: All new user-facing text MUST be available in every supported UI language (ES, EN, FR, RU).
- **FR-018**: Packages do not expire.

### Key Entities

- **Lesson Package**: A purchased bundle belonging to one student and one teacher. Attributes: lesson type, duration, total credits (5), used credits, discount percentage (3%), single-lesson reference price, total paid, per-lesson value, status (pending payment, active, completed, cancelled), payment reference, purchase date.
- **Lesson** (existing, extended): May optionally reference the Lesson Package it was booked with; when it does, it is considered paid by the package and its price equals the package's per-lesson value.
- **Student** (existing): Owns zero or more Lesson Packages.

## Assumptions

- Package size (5) and discount (3%) are fixed business constants, not configurable from the UI in this iteration.
- Packages never expire (FR-018); can be revisited later.
- A package that is fully refunded outside the system (e.g. via the payment provider dashboard) is handled manually by the teacher.
- Currency is EUR, matching existing pricing.
- Manual (offline) payment is not supported for packages.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A student can purchase a package in under 3 minutes from the booking page to payment confirmation.
- **SC-002**: A student can book a lesson with a package credit in under 1 minute, with no payment step.
- **SC-003**: 100% of displayed package totals equal 5 × single price × 0.97 (rounded to cents) for every type/duration combination.
- **SC-004**: 0 cases of credits granted more than once per payment or of negative credit balances.
- **SC-005**: 100% of cancelled/rejected package lessons return exactly one credit and trigger no money refund.
