# Tasks: Teacher Calendar & Flexible Scheduling

**Input**: Design documents from `/specs/004-teacher-calendar/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Install `date-fns` and `date-fns-tz` in `frontend/package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core schema infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 [P] Create `TeacherAvailability` model in `backend/app/models/availability.py`
- [x] T003 [P] Add `student_timezone` and deprecate `calendly_event_id` in `backend/app/models/lesson.py`
- [x] T004 Generate and apply Alembic database migration for new models

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Teacher Availability Management (Priority: P1) 🎯 MVP

**Goal**: Allow the teacher to set up their recurring weekly schedule.

**Independent Test**: The teacher can log into the dashboard, select days and time ranges (e.g., Monday 9 AM - 2 PM), save them, and these hours are successfully persisted to the database and displayed upon refresh.

### Implementation for User Story 1

- [x] T005 [P] [US1] Create API schemas for availability in `backend/app/schemas/availability.py`
- [x] T006 [US1] Implement `GET /api/availability/teacher/{teacher_id}` and `POST ...` in `backend/app/api/availability.py`
- [x] T007 [P] [US1] Create `TeacherAvailabilityGrid.tsx` component in `frontend/src/components/calendar/TeacherAvailabilityGrid.tsx`
- [x] T008 [US1] Update `TeacherDashboard.tsx` to include the availability grid in `frontend/src/pages/TeacherDashboard.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Timezone-Aware Student Booking (Priority: P1)

**Goal**: Display teacher availability in the student's detected local timezone.

**Independent Test**: A student accessing the booking page from a different timezone (e.g., New York vs Madrid) sees the exact same absolute time slots displayed properly aligned to their respective local time.

### Implementation for User Story 2

- [x] T009 [P] [US2] Create timezone conversion utilities in `frontend/src/utils/timezones.ts`
- [x] T010 [US2] Implement dynamic timezone-aware `GET /api/scheduling/available-slots` logic in `backend/app/api/lessons.py`
- [x] T011 [P] [US2] Create responsive `StudentBookingCalendar.tsx` component in `frontend/src/components/calendar/StudentBookingCalendar.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Flexible Lesson Durations (Priority: P1)

**Goal**: Allow students to pick lesson durations of 30, 45, or 60 minutes and accurately schedule fragmented blocks.

**Independent Test**: During the booking flow, the student is presented with duration options (30, 45, 60 mins). Changing the option filters the available slots to ensure the lesson fits consecutively without overlapping another booking and correctly accommodates fragmented times.

### Implementation for User Story 3

- [x] T012 [P] [US3] Create `DurationSelector.tsx` component in `frontend/src/components/calendar/DurationSelector.tsx`
- [x] T013 [US3] Integrate `StudentBookingCalendar` and `DurationSelector` into `frontend/src/pages/BookingPage.tsx`
- [x] T014 [US3] Update `GET /api/scheduling/available-slots` in `backend/app/api/lessons.py` to filter out slots based on selected duration and existing booked overlapping lessons.
- [x] T015 [US3] Update `POST /api/lessons` in `backend/app/api/lessons.py` to calculate exact end times, enforce the 12-hour advance booking limit, and commit the lesson cleanly.

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T016 [P] Update UI to handle loading states gracefully across all new calendar components.
- [x] T017 Extract timezone strings consistently for UI display.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately
- **Foundational (Phase 2)**: Depends on Setup
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1**: Can start after Foundational
- **User Story 2**: Depends on User Story 1 (needs the availability model to query against)
- **User Story 3**: Depends on User Story 2 (needs the booking calendar to add durations to)

### Parallel Opportunities

- Foundational tasks T002 and T003 can be executed in parallel.
- Frontend components (T007, T009, T011, T012) can be built in parallel with corresponding backend API logic (T006, T010, T014) given the strict API contracts provided in `contracts/api.md`.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and 2 (Database schema).
2. Complete Phase 3 (Teacher Dashboard).
3. **STOP and VALIDATE**: Ensure teacher scheduling persists correctly.
4. Move on to Phase 4 & 5 to replace the Calendly flow for students.
