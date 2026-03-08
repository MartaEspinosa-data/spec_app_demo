# Phase 0 Research: Phase 1 MVP - Spanish Tutor Platform

**Feature**: Phase 1 MVP - Spanish Tutor Platform
**Date**: 2026-03-09

## Research Tasks

| Topic                 | Goal                                                                 | Status      |
|-----------------------|----------------------------------------------------------------------|-------------|
| Payment Integration    | Best practice for FastAPI + Stripe                                   | Completed   |
| Scheduling Integration | Best approach for Calendly + React                                   | Completed   |
| Database ORM          | Support SQLite (Local) and Postgres (Production)                      | Completed   |
| Auth Strategy         | Choice for decoupled React + FastAPI                                 | Completed   |

---

## Findings & Decisions

### 1. Payment Integration (Stripe)
- **Problem**: Need to collect payments for individual lessons and packages securely.
- **Decision**: **Stripe Checkout (Server-side session generation)**. 
- **Rationale**: Minimal code to maintain, offloads PCI compliance, consistent with "Simplicity First" principle.
- **Alternatives**: Stripe Elements (greater control, higher complexity). Rejected for MVP.

### 2. Scheduling Integration (Calendly)
- **Problem**: Need to manage teacher availability and booking time slots.
- **Decision**: **Calendly v2 Embed + Webhook Sink**. 
- **Rationale**: Calendly provides superior UX for scheduling. Embedding it satisfies "Teacher-First" by using their existing tools. Webhooks let us sync back to our DB.
- **Alternatives**: Custom booking calendar in React. Rejected (High development effort, contradicts "Simplicity First").

### 3. Database ORM
- **Problem**: Must work with SQLite locally and Postgres in production.
- **Decision**: **SQLAlchemy 2.0 + Alembic**.
- **Rationale**: Standard choice for FastAPI, powerful migrations via Alembic support both targets easily.
- **Alternatives**: Tortoise (rejected: SQLAlchemy is more mature for complex migrations).

### 4. Authentication Strategy
- **Problem**: Decoupled frontend needs to authenticate requests.
- **Decision**: **OAuth2 + Password Flow with JWT Tokens (FastAPI Security)**.
- **Rationale**: Native support in FastAPI, well-documented, standard for modern web apps.
- **Alternatives**: Session-based cookies (rejected: more complex for cross-domain decoupled apps).

### 5. Frontend Framework
- **Decision**: **Vite + React + TypeScript**.
- **Rationale**: Fast development cycle, stable ecosystem, typed safety.
