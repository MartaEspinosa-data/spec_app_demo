# Implementation Plan: Teacher Calendar & Flexible Scheduling

**Branch**: `004-teacher-calendar` | **Date**: 2026-03-23 | **Spec**: [spec.md](../../004-teacher-calendar/spec.md)
**Input**: Feature specification from `/specs/004-teacher-calendar/spec.md`

## Summary

Implement a custom scheduling system that allows the teacher to set availability, auto-detects student timezones, and supports flexible lesson durations (30, 45, 60 minutes) with 12-hour advance booking, replacing the existing Calendly integration.

## Technical Context

**Language/Version**: TypeScript (Frontend), Python 3.11+ (Backend)
**Primary Dependencies**: React, TailwindCSS, FastAPI, SQLAlchemy, `date-fns-tz` / `Intl` API (Frontend Timezones), `zoneinfo` (Backend Timezones) 
**Storage**: SQLite (dev) / PostgreSQL (prod)
**Testing**: pytest (Backend), None configured yet (Frontend)
**Target Platform**: Responsive Web (Mobile-First)
**Project Type**: Web Application
**Performance Goals**: Page loads under 1 second
**Constraints**: Must handle complex timezone arithmetic and DST boundaries gracefully.
**Scale/Scope**: Single teacher, supporting multiple concurrent student bookings.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Simplicity First**: Custom UI must be as simple as Calendly's booking flow.
- **Teacher-First Design**: Setting availability must take < 3 minutes.
- **Student Learning Focus**: NA (this is purely logistics).
- **Mobile-First & Performance**: Booking flow must work flawlessly on mobile.
- **Maintainable & Open Code**: Timezone logic must be heavily abstracted and documented.
- **Integrations**: *VIOLATION*. The constitution explicitly lists "Scheduling: Calendly". This feature replaces Calendly with a custom built solution.
  - *Justification*: The user explicitly requested to build a custom calendar to replace Calendly to support dynamic features (fragmented time, advanced duration logic) that may not be easily supported by native Calendly-Stripe embeds without Zapier/complex webhooks.

## Project Structure

### Documentation (this feature)

```text
specs/004-teacher-calendar/
├── plan.md              
├── research.md          
├── data-model.md        
├── quickstart.md        
├── contracts/           
└── tasks.md             
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── models/
│   │   └── availability.py
│   │   └── lesson.py (update)
│   ├── schemas/
│   │   └── availability.py
│   │   └── lesson.py (update)
│   ├── api/
│   │   └── availability.py
│   │   └── lessons.py (update)
│   └── services/
│       └── scheduling.py

frontend/
├── src/
│   ├── components/
│   │   ├── calendar/
│   │   │   ├── TeacherAvailabilityGrid.tsx
│   │   │   ├── StudentBookingCalendar.tsx
│   │   │   └── DurationSelector.tsx
│   ├── pages/
│   │   ├── TeacherDashboard.tsx (update)
│   │   └── BookingPage.tsx (update)
│   └── utils/
│       └── timezones.ts
```

**Structure Decision**: Standard full-stack web application structure separating backend API and frontend React application.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Custom Calendar instead of Calendly | Complete control over durations and fragmentation logic | Native Calendly cannot natively handle our exact 12-hour advanced notice + fragmented back-to-back 45-minute logic deeply integrated into our app's UX without complex webhooks. |
