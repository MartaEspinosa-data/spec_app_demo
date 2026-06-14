# Spec App Demo

A full-stack language tutoring platform connecting students with teachers via an interactive booking calendar, with Stripe payment integration and multi-language support.

## Tech Stack

| Layer        | Technology                                 |
| ------------ | ------------------------------------------ |
| **Frontend** | React 18 + TypeScript, Vite, Tailwind CSS  |
| **Backend**  | Python 3.11+, FastAPI, SQLAlchemy, Alembic |
| **Database** | PostgreSQL                                 |
| **Payments** | Stripe (payment links + webhooks)          |
| **Auth**     | JWT-based authentication                   |
| **i18n**     | English, Spanish, French, Russian          |

## Project Structure

```
spec_app_demo/
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── api/              # REST endpoints (teachers, students, lessons, availability, webhooks)
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # Business logic
│   │   ├── database/         # DB connection & session management
│   │   └── utils/            # Auth, email, Stripe, timezone utilities
│   ├── alembic/              # Database migrations
│   └── requirements.txt
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── pages/            # Route pages (landing, booking, dashboard, login, etc.)
│   │   ├── components/       # Reusable UI components + calendar
│   │   ├── services/         # API client & service layers
│   │   ├── i18n/             # Translation locales (en, es, fr, ru)
│   │   └── utils/            # Timezone & helper utilities
│   └── vite.config.ts
├── specs/                    # Technical specifications per feature
└── docs/                     # User-facing documentation
```

## Features

- **Student Booking** — Browse teacher availability by calendar, select time slots, and book lessons
- **Teacher Calendar** — Teachers manage their availability with a visual weekly grid
- **Stripe Payments** — Secure payment via Stripe payment links with webhook confirmation
- **Multi-language** — UI available in English, Spanish, French, and Russian
- **Auth System** — JWT login for teachers and students, with password reset flow
- **Timezone-aware** — All times displayed in Europe/Madrid (UTC+2)
- **Cookie Consent** — GDPR-compliant cookie banner
- **Legal Pages** — Privacy policy, terms of use, and cookie policy

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Stripe account (for payments)

### Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate      # Windows
source .venv/bin/activate   # macOS/Linux

pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env with your DATABASE_URL, STRIPE_API_KEY, etc.

# Run migrations
alembic upgrade head

# Seed data (optional)
python seed.py

# Start dev server
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install

# Configure environment
copy .env.example .env
# Edit .env with your VITE_API_BASE_URL

# Start dev server
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies API requests to the backend on `http://localhost:8000`.

## API Endpoints

| Method | Path                              | Description                   |
| ------ | --------------------------------- | ----------------------------- |
| POST   | `/api/teachers/login`             | Teacher authentication        |
| POST   | `/api/students/login`             | Student authentication        |
| GET    | `/api/teachers`                   | List teachers                 |
| GET    | `/api/teachers/{id}`              | Teacher profile               |
| GET    | `/api/teachers/{id}/availability` | Teacher availability slots    |
| PUT    | `/api/teachers/{id}/availability` | Update availability (teacher) |
| POST   | `/api/lessons`                    | Book a lesson                 |
| GET    | `/api/lessons/{id}`               | Lesson details                |
| POST   | `/api/webhooks/stripe`            | Stripe webhook endpoint       |

## Environment Variables

### Backend (`backend/.env`)

| Variable                                              | Description                   |
| ----------------------------------------------------- | ----------------------------- |
| `DATABASE_URL`                                        | PostgreSQL connection string  |
| `SECRET_KEY`                                          | JWT signing secret            |
| `STRIPE_API_KEY`                                      | Stripe secret key             |
| `STRIPE_WEBHOOK_SECRET`                               | Stripe webhook signing secret |
| `STUDENT_AUTH_TOKEN`                                  | Shared token for student auth |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Email configuration           |

### Frontend (`frontend/.env`)

| Variable            | Description                                             |
| ------------------- | ------------------------------------------------------- |
| `VITE_API_BASE_URL` | Backend API base URL (default: `http://localhost:8000`) |

## License

This project is proprietary. All rights reserved.
