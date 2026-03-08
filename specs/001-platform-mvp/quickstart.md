# Quickstart: Phase 1 MVP - Spanish Tutor Platform

**Feature**: Phase 1 MVP - Spanish Tutor Platform
**Updated**: 2026-03-09

## 1. Prerequisites
- Python 3.11+
- Node.js 20+
- Stripe CLI (for webhook testing)
- Calendly Developer Account (for webhook sink testing)

## 2. Local Setup

### Backend (FastAPI)
1. Navigate to `backend/`
2. Create virtual environment: `python -m venv .venv`
3. Activate: `.venv\Scripts\Activate.ps1`
4. Install: `pip install fastapi uvicorn sqlalchemy alembic stripe-python pydantic`
5. Create `.env` from `.env.example` (add Stripe keys)
6. Run: `uvicorn app.main:app --reload`

### Frontend (React + Vite)
1. Navigate to `frontend/`
2. Install: `npm install`
3. Dependencies: `axios react-query lucide-react clsx tailwind-merge`
4. Run: `npm run dev`

## 3. Core Developer Workflows

### Testing the Booking Flow
1. Load the landing page.
2. Select the teacher profile.
3. Use the Calendly embed to pick a slot.
4. On booking success (Redirect/Webhook), ensure a `Lesson` record exists in the SQLite database with status `pending`.
5. Verify redirection to Stripe Checkout.

### Testing Payments
1. Use a Stripe test card (4242...) on the checkout page.
2. Use the Stripe CLI to forward webhooks:
   `stripe listen --forward-to localhost:8000/api/webhooks/stripe`
3. Verify that the `Lesson` status updates to `scheduled` after the `checkout.session.completed` event.
