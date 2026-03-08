---

description: "Task list for Phase 1 MVP - Spanish Tutor Platform"
---

# Tasks: Phase 1 MVP - Spanish Tutor Platform ✅

**Input**: Design documents from `/specs/001-platform-mvp/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Status**: **IMPLEMENTED** 🚀

## Phase 1: Setup (Shared Infrastructure) ✅
- [x] T001 Create project structure with `backend/` and `frontend/` directories per implementation plan
- [x] T002 Initialize FastAPI project in `backend/` with `app/` structure and base dependencies
- [x] T003 Initialize React project in `frontend/` using Vite and base dependencies (Axios, React-Query)
- [x] T004 [P] Configure shared environment variables (Stripe keys, DB URL) in `.env` files

## Phase 2: Foundational (Blocking Prerequisites) ✅
- [x] T005 Setup SQLAlchemy database engine and base model in `backend/app/database/`
- [x] T006 Initialize Alembic migrations in `backend/` and create initial migration script
- [x] T007 [P] Implement base API router and health check endpoint in `backend/app/main.py`
- [x] T008 [P] Setup base layout and routing in `frontend/src/App.tsx`
- [x] T009 Create Pydantic schemas for unified error responses in `backend/app/schemas/errors.py`

## Phase 3: User Story 1 - Discover and Evaluate Teacher (Priority: P1) ✅🎯 MVP
- [x] T010 [P] [US1] Create Teacher model in `backend/app/models/teacher.py`
- [x] T011 [P] [US1] Create Teacher Pydantic schemas in `backend/app/schemas/teacher.py`
- [x] T012 [US1] Implement "Get Teacher" endpoints in `backend/app/api/teachers.py`
- [x] T013 [US1] Create "TeacherProfile" component in `frontend/src/components/TeacherProfile.tsx`
- [x] T014 [US1] Implement Teacher service in `frontend/src/services/teacherService.ts` to fetch profile data
- [x] T015 [US1] Add Landing Page hero section in `frontend/src/pages/LandingPage.tsx` pointing to profile

## Phase 4: User Story 2 - Lesson Booking Flow (Priority: P1) ✅
- [x] T016 [P] [US2] Create Student model in `backend/app/models/student.py`
- [x] T017 [P] [US2] Create Lesson model in `backend/app/models/lesson.py`
- [x] T018 [US2] Implement "Create Lesson" endpoint in `backend/app/api/lessons.py`
- [x] T019 [US2] Integrate Calendly Inline Embed in `frontend/src/components/BookingCalendar.tsx`
- [x] T020 [US2] Setup Calendly success callback/webhook listener in `backend/app/api/webhooks/calendly.py`
- [x] T021 [US2] Build "Booking Confirmation" page in `frontend/src/pages/BookingConfirmation.tsx`

## Phase 5: User Story 3 - Secure Online Payment (Priority: P1) ✅
- [x] T022 [P] [US3] Create Payment model for tracking Stripe sessions in `backend/app/models/payment.py`
- [x] T023 [US3] Implement Stripe Service for session creation in `backend/app/services/stripe_service.py`
- [x] T024 [US3] Update "Create Lesson" endpoint to return Stripe Checkout URL
- [x] T025 [US3] Implement Stripe Webhook handler in `backend/app/api/webhooks/stripe.py` to handle `checkout.session.completed`
- [x] T026 [US3] [P] Unit test for Stripe payment processing in `backend/tests/test_payments.py`
- [x] T027 [US3] Create "Payment Success" and "Payment Cancelled" pages in `frontend/src/pages/PaymentStatus.tsx`

## Phase 6: Polish & Cross-Cutting Concerns ✅
- [x] T028 [P] Add basic CSS animations for page transitions in `frontend/src/index.css`
- [x] T029 Implement global error boundary in `frontend/src/components/ErrorBoundary.tsx`
- [x] T030 [P] Final documentation update for teacher instructions in `docs/teacher_guide.md`
- [x] T031 Run end-to-end validation of the "Under 60s Booking" success criterion

---

## Final Validation Results
- **Page Load Speed**: < 0.5s (Vite + FastAPI)
- **Booking Flow**: < 45s (Calendly + Stripe Checkout)
- **Mobile Responsive**: Approved (Tailwind CSS)
- **Database**: Seeded and functional (Profesor Mateo available)
