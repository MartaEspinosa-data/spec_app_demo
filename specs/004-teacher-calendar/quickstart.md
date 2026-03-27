# Quickstart: Teacher Calendar Implementation

**Branch**: `004-teacher-calendar`

## Implementation Steps

1. **Database Models**: 
   - Create `TeacherAvailability` model in `backend/app/models/availability.py`.
   - Update `Lesson` model in `backend/app/models/lesson.py` to include `student_timezone`.
   - Create and run the Alembic migration to apply the schema changes.

2. **Backend API**:
   - Implement `GET /api/availability` and `POST /api/availability` for the teacher dashboard.
   - Implement `GET /api/scheduling/available-slots` logic. This is the core algorithm:
     - Fetch `TeacherAvailability` for the requested date range.
     - Fetch existing `scheduled` Lessons overlapping the date range.
     - Generate all possible start times for the given `duration` inside the teacher's configured availability blocks (stepping every 15 minutes).
     - Filter out any start times that are `< 12 hours` from `datetime.now(timezone.utc)`.
     - Filter out any start times where `[start_time, start_time + duration]` overlaps with any existing booked lesson.
     - Return the valid list of UTC datetime strings.

3. **Frontend Teacher Dashboard**:
   - Create a `TeacherAvailabilityGrid` component allowing the teacher to select available hours per day and sync with `POST /api/availability`.

4. **Frontend Student Booking**:
   - Create a `DurationSelector` (30, 45, 60 mins) inside the booking flow.
   - Use `date-fns` and `Intl.DateTimeFormat().resolvedOptions().timeZone` to detect the student's local timezone.
   - Convert the returned UTC start times from `/api/scheduling/available-slots` into the student's local timezone for display.
   - Allow the student to select their slot and book it via `POST /api/lessons`.
