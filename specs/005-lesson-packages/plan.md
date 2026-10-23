# Implementation Plan: Lesson Packages (5-Class Bundles with 3% Discount)

**Branch**: `005-lesson-packages` | **Date**: 2026-10-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-lesson-packages/spec.md`

## Summary

Students can buy a bundle of 5 identical lessons (same type and duration) at 5 × the single price minus 3%, paid once via a dynamically-priced Stripe Checkout Session. On payment the package becomes `active` with 5 credits. Students redeem credits from their portal by picking a slot in the existing calendar; the lesson is created with no payment step. Cancelling/rejecting a package lesson returns the credit instead of refunding money. Credit consumption/return uses conditional atomic `UPDATE`s so balances can never go negative or be double-spent.

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript + React 19 (frontend)
**Primary Dependencies**: FastAPI, SQLAlchemy, Alembic, stripe-python, APScheduler; React Router, axios, lucide-react, date-fns, Tailwind utility classes (existing)
**Storage**: SQLite (dev) / PostgreSQL (prod) via SQLAlchemy — new `lesson_packages` table, new nullable `lessons.package_id` column
**Testing**: Python scripts with FastAPI `TestClient` (project convention: root-level `test_*.py`), `npm run build` (tsc) for the frontend
**Target Platform**: Linux container (Coolify) + browser SPA
**Project Type**: Web application (backend + frontend)
**Performance Goals**: Booking with credit < 1 s server time; no extra round-trips vs. single booking
**Constraints**: Must work identically on SQLite and PostgreSQL; idempotent payment activation (webhook + polling + notify may all fire)
**Scale/Scope**: Single teacher, tens–hundreds of students

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment | Status |
|-----------|-----------|--------|
| I. Simplicity First | Package purchase = 1 extra toggle on the existing booking page; redeeming = 1 click + slot pick in portal. No new pages. | ✅ |
| II. Teacher-First | Teacher gets the same notification flow; package lessons clearly badged; no manual credit bookkeeping. | ✅ |
| III. Student Learning Focus | Encourages regular lessons (commitment), feedback flow unchanged. | ✅ |
| IV. Mobile-First & Performance | Reuses responsive components; no heavy dependencies added. | ✅ |
| V. Maintainable & Open Code | Pricing and credit logic isolated in `app/services/packages.py` with docstrings; constants in one place. | ✅ |
| Stack: SQLite/Postgres compatible ORM | Plain columns + conditional UPDATE work on both. | ✅ |
| Security: Stripe payments, secure auth | Purchase/redeem endpoints require student JWT + ownership checks; amount computed server-side only. | ✅ |
| Env: PowerShell compatible | No new scripts beyond Python. | ✅ |

**Post-design re-check**: ✅ No violations. Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/005-lesson-packages/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/api.md     # Phase 1 output
├── checklists/requirements.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── alembic/versions/009_lesson_packages.py      # NEW migration
├── bootstrap_db.py                              # register new model
└── app/
    ├── main.py                                  # include router, dev schema patch
    ├── models/lesson_package.py                 # NEW LessonPackage model
    ├── models/lesson.py                         # + package_id
    ├── services/packages.py                     # NEW pricing + credit logic
    ├── api/packages.py                          # NEW /api/v1/packages router
    ├── api/lessons.py                           # cancel/reject hooks, verify-payment/notify branch
    ├── api/webhooks.py                          # payment_type == "package" branch
    ├── api/students.py                          # expose package_id/payment_method on lessons
    ├── utils/stripe.py                          # create_package_checkout_session (price_data)
    ├── utils/package_emails.py                  # NEW package emails
    └── utils/cleanup.py                         # never expire package lessons

frontend/src/
├── pages/BookingPage.tsx                        # single vs package toggle + breakdown
├── pages/DashboardPage.tsx                      # "My packages" section + book-with-credit modal
├── components/PackageCard.tsx                   # NEW package card w/ progress
├── pages/PaymentStatus.tsx                      # package-specific success copy
├── pages/TeacherDashboard.tsx                   # "Package" badge
└── i18n/locales/{en,es,fr,ru}.json              # new keys

test_lesson_packages.py                          # NEW backend test script (root, project convention)
```

**Structure Decision**: Existing web-app layout (`backend/app`, `frontend/src`) is extended in place. Package logic lives in a new service module so `lessons.py` (already ~1000 lines) only gains small hooks.

## Complexity Tracking

Not applicable — no constitution violations.
