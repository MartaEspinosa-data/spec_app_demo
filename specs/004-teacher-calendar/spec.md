# Feature Specification: Teacher Calendar & Flexible Scheduling

**Feature Branch**: `004-teacher-calendar`  
**Created**: 2026-03-23  
**Status**: Draft  
**Input**: User description: "In my calendar me as the teacher: 1) I want to be able to select the hours that I am available. 2) I want that the calendar can detect the uso horario the zone where the student lives 3) The student should be able schedule a lesson of 30 min 45 min or 1 hour"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Teacher Availability Management (Priority: P1)

As a teacher, I want to be able to select the specific hours I am available to teach, so that students can only book lessons during my working hours.

**Why this priority**: Core foundation of the custom scheduling system. The teacher must define availability before any bookings can occur.

**Independent Test**: The teacher can log into a dashboard, select days and time ranges (e.g., Monday 9 AM - 2 PM), save them, and these hours are successfully persisted.

**Acceptance Scenarios**:

1. **Given** the teacher is on their availability dashboard, **When** they select specific time blocks and click save, **Then** the system records those available hours.
2. **Given** previously saved availability, **When** the teacher removes a time block, **Then** that time block is no longer available for future bookings.

---

### User Story 2 - Timezone-Aware Student Booking (Priority: P1)

As a student, I want to view the teacher's available slots automatically converted to my local timezone, so I don't have to manually calculate the time difference.

**Why this priority**: Critical for international students to avoid confusion and missed lessons due to timezone math errors.

**Independent Test**: A student accessing the booking page from different timezones (e.g., New York vs. Tokyo) sees the exact same absolute time slots displayed in their respective local times.

**Acceptance Scenarios**:

1. **Given** the teacher's availability is set in Madrid time (CET), **When** a student in New York (EST) views the calendar, **Then** the available slots are displayed in EST.
2. **Given** the booking calendar, **When** the system cannot auto-detect the timezone accurately, **Then** the student can manually override or select their timezone from a dropdown.

---

### User Story 3 - Flexible Lesson Durations (Priority: P1)

As a student, I want to be able to choose the duration of my lesson (30 minutes, 45 minutes, or 1 hour) when scheduling, so that I can tailor the lesson to my budget and attention span.

**Why this priority**: Directly satisfies the user constraint for flexible scheduling options.

**Independent Test**: During the booking flow, the student is presented with duration options (30, 45, 60 mins), and selecting one appropriately blocks off the correct amount of time on the calendar and calculates the correct price.

**Acceptance Scenarios**:

1. **Given** an open 1-hour slot, **When** a student schedules a 45-minute lesson, **Then** the 45-minute lesson is booked.
2. **Given** the duration selector, **When** the student changes the duration, **Then** the available starting times update to only show slots that can accommodate the chosen length.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an interface for the teacher to set available recurring weekly hours or specific date overrides.
- **FR-002**: System MUST automatically detect the student's timezone via browser APIs.
- **FR-003**: System MUST display all available booking slots in the student's detected or manually selected timezone.
- **FR-004**: System MUST allow the student to select a lesson duration of exactly 30 minutes, 45 minutes, or 60 minutes.
- **FR-005**: System MUST validate that the selected duration fits within the teacher's contiguous available time block.
- **FR-006**: System MUST handle timezone conversions correctly across Daylight Saving Time (DST) boundaries for both teacher and student.
- **FR-007**: System MUST allow teachers to have back-to-back lessons of varying lengths, and NOT force mandatory buffer times for fragmented slots.
- **FR-008**: System MUST prevent students from booking a lesson less than 12 hours in advance.

### Key Entities *(include if feature involves data)*

- **AvailabilitySlot**: Time blocks defined by the teacher (start_time, end_time, day_of_week or specific_date).
- **Lesson**: Includes the chosen `duration` (30, 45, 60), the scheduled `start_timestamp`, and the `student_timezone`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The teacher can configure a full week's availability schedule in under 3 minutes.
- **SC-002**: 100% of available time slots displayed to the student correctly match the teacher's absolute availability regardless of the student's timezone.
- **SC-003**: Students can successfully select between the 3 duration options and complete the booking without encountering double-booking errors.
- **SC-004**: Timezone detection is accurate for at least 95% of users without requiring manual intervention.

## Edge Cases

- What happens if the teacher's timezone changes (e.g., traveling)? 
- How does the system handle a situation where a student tries to book a 1-hour lesson, but only a 45-minute slot is left available for that day? (It should disable the 1-hour option or prevent the booking).
- What happens if a student's timezone observes DST differently from the teacher's timezone during the week of the lesson?
