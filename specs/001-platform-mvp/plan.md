# Implementation Plan: Phase 1 MVP - Spanish Tutor Platform

**Branch**: `001-platform-mvp` | **Date**: 2026-03-09 | **Spec**: [spec.md](file:///C:/Users/marth/Desktop/git/spec_app_demo/specs/001-platform-mvp/spec.md)
**Input**: Feature specification from `/specs/001-platform-mvp/spec.md`

## Summary

Build the foundational MVP of the Spanish Tutor Platform incorporating a React frontend, FastAPI backend, and critical integrations (Stripe, Calendly). The focus is on the core user journey: Discover Teacher -> Select Slot -> Pay -> Scheduled.

## Technical Context

**Language/Version**: Python 3.11+ / Node.js 20+ (React 18+)
**Primary Dependencies**: FastAPI (Backend), React (Frontend), Axios, React-Query, Stripe-Python, Calendly API
**Storage**: SQLite (Local Dev) / PostgreSQL (Production)
**Testing**: Pytest (Backend), Vitest (Frontend)
**Target Platform**: Windows (Development), Web Browser (User)
**Project Type**: Web Application (Decoupled Frontend + Backend)
**Performance Goals**: < 1s Page Load, < 5s for payment-to-status update
**Constraints**: PowerShell compatibility for all scripts, Mobile-First responsive design

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Simplicity First**: Booking flow optimized for < 60s completion.
- [x] **Teacher-First**: Minimal administration; Calendly integration offloads scheduling logic.
- [x] **Learning Value**: Phase 1 includes base lesson persistence to support future note-taking artifacts.
- [x] **Mobile-First & Performance**: Decoupled API architecture and React optimized for speed.
- [x] **Maintainable & Open Code**: Modular structure using separated `frontend` and `backend` directories.

## Project Structure

### Documentation (this feature)

```text
specs/001-platform-mvp/
├── spec.md              # Completed
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (future)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/             # API Router/Endpoints
│   ├── models/          # SQLAlchemy Entities
│   ├── schemas/         # Pydantic validation
│   ├── services/        # Business logic (Stripe, Calendly)
│   └── main.py          # Entry point
└── tests/               # Pytest suite

frontend/
├── src/
│   ├── components/      # UI components (Profile, Hero, Booking)
│   ├── pages/           # Landing, Profile, Dashboard
│   ├── services/        # API calls (Axios/React-Query)
│   └── App.tsx
└── tests/               # Vitest suite
```

**Structure Decision**: Option 2 (Web application) selected to support decoupled frontend/backend as per constitution.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None      | N/A        | N/A                                 |
