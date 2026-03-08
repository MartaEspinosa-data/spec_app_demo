<!--
Sync Impact Report:
- Version change: [NEW] → 1.0.0
- Summary: Initial ratification of the Spanish Tutor Platform Constitution.
- Modified Principles:
  - PRINCIPLE_1: Simplicity First (Booking < 60s)
  - PRINCIPLE_2: Teacher-First Design (Workflow optimization)
  - PRINCIPLE_3: Student Learning Focus (Structured outputs)
  - PRINCIPLE_4: Mobile-First & Performance (Speed < 1s)
  - PRINCIPLE_5: Maintainable & Open Code (Predictability)
- Added Sections:
  - Technical Stack & Environment (React, FastAPI, SQLite/Postgres)
  - Security & Privacy (Stripe, Secure Auth)
- Templates requiring updates: ✅ All align with story-driven MVP approach.
- Follow-up TODOs: None.
-->

# Spanish Tutor Platform Constitution

## Core Principles

### I. Simplicity First
Users must be able to understand the service within 10 seconds and book a lesson within 60 seconds. Every design decision must prioritize removing friction from the scheduling and learning experience.

### II. Teacher-First Design
The system is built around the teacher's workflow. Management of availability, tracking student progress, and writing lesson notes must require minimal administrative effort to maximize teaching time.

### III. Student Learning Focus
Learning value must extend beyond the live lesson. Every session should produce structured digital outputs: a lesson summary, vocabulary list, grammar corrections, and homework exercises.

### IV. Mobile-First & Performance
Most users access the platform via mobile. All pages must be fully responsive and optimized for speed, targeting page loads under 1 second. An API-First architecture ensures decoupled, efficient communication between the React frontend and FastAPI backend.

### V. Maintainable & Open Code
Code must be readable, modular, and easy to refactor. We prefer simple and predictable solutions over clever or complex ones. Documentation is mandatory for all core logic.

## Technical Stack & Environment

- **Frontend**: React (Modern, responsive)
- **Backend**: Python FastAPI (API-first architecture)
- **Database**: SQLite for local development, PostgreSQL for production. The ORM layer must remain compatible across both.
- **Integrations**: 
  - Scheduling: Calendly
  - Payments: Stripe (Transparent pricing, no hidden costs)
  - Video: Zoom or Google Meet
  - AI: OpenAI API (Support the teacher, not replace them)
- **Environment**: All scripts and tools must be compatible with PowerShell on Windows.

## Security & Privacy

The platform must protect user data through:
- Secure authentication.
- Encrypted payment processing via Stripe.
- Minimal data collection and compliance with privacy standards.

## Governance

- **Decision Hierarchy**: When making trade-offs, prioritize: 1. Simplicity, 2. Learning Value, 3. Speed of Development, 4. Scalability.
- **Roadmap Constraint**: Features must follow the phased approach (Phase 1: MVP, Phase 2: Learning Platform, Phase 3: AI Features).
- **Compliance**: All implementation plans and task lists must be checked against these principles before execution.
- **Amendments**: Changes to this constitution require a MINOR or MAJOR version bump and must be propagated to all AI development agents.

**Version**: 1.0.0 | **Ratified**: 2026-03-08 | **Last Amended**: 2026-03-08
