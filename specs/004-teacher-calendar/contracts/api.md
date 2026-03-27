# API Contracts: Teacher Calendar

## 1. **GET /api/availability/teacher/{teacher_id}**
Returns the configured recurring availability blocks for the teacher.
**Response**:
```json
{
  "availability": [
    {
      "id": "uuid",
      "day_of_week": 1,
      "start_time": "09:00:00",
      "end_time": "14:00:00",
      "is_available": true
    }
  ]
}
```

## 2. **GET /api/scheduling/available-slots**
Returns dynamically calculated available start times for a given date range and requested lesson duration, respecting the 12-hour advance booking limit and existing booked lessons.
**Query Params**: 
- `teacher_id` (string)
- `start_date` (YYYY-MM-DD)
- `end_date` (YYYY-MM-DD)
- `duration` (integer: 30, 45, or 60)

**Response**:
```json
{
  "slots": [
    "2026-03-24T09:00:00Z",
    "2026-03-24T09:15:00Z",
    "2026-03-24T09:45:00Z"
  ]
}
```

## 3. **POST /api/availability/teacher/{teacher_id}**
Updates the teacher's availability.
**Payload**:
```json
{
  "availability": [
    {
      "day_of_week": 1,
      "start_time": "09:00:00",
      "end_time": "14:00:00",
      "is_available": true
    }
  ]
}
```
