# Tasks: Lesson Packages (5-Class Bundles with 3% Discount)

**Input**: Design documents from `/specs/005-lesson-packages/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

## Phase 1: Foundational Database & Models
- [ ] T001 Create `LessonPackage` model in `backend/app/models/lesson_package.py` and register in `backend/app/database/database.py` / `bootstrap_db.py`.
- [ ] T002 Add `package_id` foreign key column and relationship to `backend/app/models/lesson.py`.
- [ ] T003 Ensure table and columns are created idempotently on startup in `backend/app/main.py` lifespan and `bootstrap_db.py`.

## Phase 2: Backend Package Service & API
- [ ] T004 Implement package pricing and calculations in `backend/app/services/packages.py` (5 lessons * single_price * 0.97).
- [ ] T005 Implement `backend/app/api/packages.py` endpoints:
  - `GET /api/v1/packages/preview`: Calculate discount breakdown.
  - `POST /api/v1/packages/purchase`: Create pending package and Stripe Checkout session.
  - `GET /api/v1/packages/student/{student_id}`: List student's packages.
  - `POST /api/v1/packages/{package_id}/book`: Atomically consume a credit and book slot.
- [ ] T006 Update `backend/app/utils/stripe.py` to support dynamic session creation with `price_data` for packages.
- [ ] T007 Update Stripe webhook in `backend/app/api/webhooks.py` and `verify-payment` to handle `payment_type="package"`.
- [ ] T008 Update lesson cancellation and rejection in `backend/app/api/lessons.py` to return 1 credit if `lesson.package_id` exists instead of refunding money.
- [ ] T009 Register `packages.router` in `backend/app/main.py`.

## Phase 3: Frontend Booking Flow
- [ ] T010 Add package purchase toggle & discount breakdown card to `frontend/src/pages/BookingPage.tsx`.
- [ ] T011 Handle package purchase flow and redirect to Stripe Checkout in `BookingPage.tsx`.
- [ ] T012 Update `frontend/src/pages/PaymentStatus.tsx` to display package confirmation copy and direct to student portal.

## Phase 4: Frontend Student Portal & Credit Redemption
- [ ] T013 Create package list and status component (`PackageCard.tsx` or in `DashboardPage.tsx`) showing total/used/remaining credits.
- [ ] T014 Add "Reservar con crédito" modal in `DashboardPage.tsx` using `StudentBookingCalendar` with pre-selected duration.
- [ ] T015 Display "Paquete" badge on package-backed lessons in Student Portal & Teacher Dashboard.

## Phase 5: Internationalization (i18n) & Validation
- [ ] T016 Add translations in `es.json`, `en.json`, `fr.json`, `ru.json` for all package terms (e.g. "Paquete de 5 clases", "3% de descuento", "Créditos disponibles", "Reservar con crédito").
- [ ] T017 Verify TypeScript compilation and start local dev servers for user browser review.
