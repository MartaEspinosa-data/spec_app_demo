# spec_app_demo Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-09

## Active Technologies
- TypeScript (React frontend), Python 3.x (backend — no changes required) + React, react-router-dom, Vite, Tailwind CSS v4 (002-multilanguage-ui)
- localStorage (browser-side persistence only — no database changes) (002-multilanguage-ui)
- TypeScript (Frontend), Python 3.11+ (Backend) + React, TailwindCSS, FastAPI, SQLAlchemy, `date-fns-tz` / `Intl` API (Frontend Timezones), `zoneinfo` (Backend Timezones) (004-teacher-calendar)
- SQLite (dev) / PostgreSQL (prod) (004-teacher-calendar)

- Python 3.11+ / Node.js 20+ (React 18+) + FastAPI (Backend), React (Frontend), Axios, React-Query, Stripe-Python, Calendly API (001-platform-mvp)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

cd src; pytest; ruff check .

## Code Style

Python 3.11+ / Node.js 20+ (React 18+): Follow standard conventions

## Recent Changes
- 004-teacher-calendar: Added TypeScript (Frontend), Python 3.11+ (Backend) + React, TailwindCSS, FastAPI, SQLAlchemy, `date-fns-tz` / `Intl` API (Frontend Timezones), `zoneinfo` (Backend Timezones)
- 002-multilanguage-ui: Added TypeScript (React frontend), Python 3.x (backend — no changes required) + React, react-router-dom, Vite, Tailwind CSS v4

- 001-platform-mvp: Added Python 3.11+ / Node.js 20+ (React 18+) + FastAPI (Backend), React (Frontend), Axios, React-Query, Stripe-Python, Calendly API

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
