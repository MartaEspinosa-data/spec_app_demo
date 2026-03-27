# Data Model: Teacher Calendar & Flexible Scheduling

## Entities

### 1. `TeacherAvailability` (New Table)
Represents the recurring weekly schedule or specific date overrides configured by the teacher.

**Fields**:
- `id`: UUID (Primary Key)
- `teacher_id`: String (Foreign Key to `teachers.id`)
- `day_of_week`: Integer (0-6, where 0 is Monday. Nullable if specific date override).
- `specific_date`: Date (Nullable. Mutually exclusive with `day_of_week`. Used for blocking off holidays or adding extra days).
- `start_time`: Time (UTC time of day representing the start. e.g. 09:00:00)
- `end_time`: Time (UTC time of day representing the end. e.g. 14:00:00)
- `is_available`: Boolean (Default True, can be False to block off default availability)

**Relationships**:
- Belongs to `Teacher`

### 2. `Lesson` (Modified Table)
Represents a booked lesson between a student and teacher.

**Modifications**:
- Remove or deprecate `calendly_event_id`, as we are moving to a custom scheduling system.
- Add `student_timezone`: String (e.g. "America/New_York"). useful for sending reminder emails in their local time.

## State Transitions
**Lesson Status**:
- `pending`: Created when the student selects a time but hasn't paid.
- `scheduled`: Confirmed after Stripe checkout completion.
- `completed`: After the end time has passed.
- `cancelled`: Manually cancelled by teacher or student.

## Validation Rules
- `TeacherAvailability.start_time` MUST be before `end_time`.
- `Lesson.start_time` MUST be at least 12 hours in the future at the time of booking.
- `Lesson.duration` MUST be exactly 30, 45, or 60.
- `Lesson` `start_time` to `start_time + duration` MUST fit entirely within a contiguous `TeacherAvailability` block.
- `Lesson` `start_time` to `start_time + duration` MUST NOT overlap with any existing `scheduled` Lesson for the same teacher.
