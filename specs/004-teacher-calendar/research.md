# Research & Decisions: Teacher Calendar

## 1. Timezone Handling (Frontend & Backend)
**Decision**: Use `Intl.DateTimeFormat().resolvedOptions().timeZone` for the frontend to automatically detect the student's timezone. Use standard `datetime` objects with `zoneinfo` (built-in Python 3.9+) on the backend. All dates and times will be stored in PostgreSQL/SQLite as UTC.
**Rationale**: `Intl` is native to all modern browsers and doesn't require heavy libraries for basic detection. Python's `zoneinfo` is part of the standard library and uses the IANA timezone database, which properly handles complex DST transition rules. Storing as UTC prevents systemic bugs when crossing timezones or DST boundaries.
**Alternatives considered**: 
- `moment-timezone`: Deprecated and excessively large for modern web applications.
- `date-fns-tz`: Kept as a fallback for complex formatting, but native `Intl` is preferred.

## 2. Storing Availability
**Decision**: Store teacher availability in the database as generic weekly recurring blocks (e.g., "Monday 09:00 - 14:00") evaluated in the teacher's configured timezone. Overrides can be implemented in a separate table for specific dates (e.g., holidays).
**Rationale**: Allows the teacher to set a "typical week" effortlessly. Evaluating against the teacher's configured timezone ensures that if they live in Madrid, their 9 AM slot remains 9 AM local time across DST shifts.
**Alternatives considered**: Storing explicit entries for every single day into the future (wasteful and very hard to update if the general schedule changes).

## 3. Conflict Resolution & Fragmented Time
**Decision**: Implement a dynamic slot-finding algorithm on the backend that given a duration (`duration`), searches for any contiguous `duration` block inside the teacher's availability, ensuring it is at least 12 hours from "now()", and NOT overlapping with any existing `Lesson`.
**Rationale**: This natively supports fragmented time without manual buffer rules. For instance, if availability is 09:00-10:00, and a 45-minute lesson is booked at 09:15-10:00, the remaining 15 minutes (09:00-09:15) simply won't return any valid slots since the minimum lesson is 30 minutes, cleanly solving fragmentation naturally.
**Alternatives considered**: Restricting bookings to specific half-hour increments, but this reduces flexibility and contradicts the user's explicit request.
