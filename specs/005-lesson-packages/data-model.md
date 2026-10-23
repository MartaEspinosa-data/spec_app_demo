# Data Model: Lesson Packages

## Entities

### 1. `LessonPackage` (New Table: `lesson_packages`)
Represents a purchased 5-class bundle owned by a student with a teacher.

**Fields**:
- `id`: String (UUID primary key)
- `student_id`: String (Foreign Key to `students.id`, indexed, not null)
- `teacher_id`: String (Foreign Key to `teachers.id`, not null)
- `lesson_type`: String (e.g. 'Conversación', 'Curso Básico')
- `duration`: Integer (30, 45, or 60 minutes)
- `total_credits`: Integer (Default 5)
- `used_credits`: Integer (Default 0)
- `discount_percent`: Float (Default 3.0)
- `single_price`: Float (Original price per class)
- `total_price`: Float (5 * single_price * 0.97 rounded to 2 decimals)
- `per_lesson_price`: Float (total_price / 5 rounded to 2 decimals)
- `status`: String (pending, active, completed, cancelled; default 'pending')
- `stripe_session_id`: String (Nullable, indexed)
- `created_at`: DateTime (Server default now)
- `updated_at`: DateTime (Server default now, onupdate now)

**Relationships**:
- Belongs to `Student` (`student = relationship("Student")`)
- Belongs to `Teacher` (`teacher = relationship("Teacher")`)
- Has many `Lesson`s (`lessons = relationship("Lesson", back_populates="package")`)

### 2. `Lesson` (Modified Table: `lessons`)
Extended to link back to the package if booked with credits.

**Modifications**:
- Add `package_id`: String (Nullable, Foreign Key to `lesson_packages.id`, indexed)
- Relationship: `package = relationship("LessonPackage", back_populates="lessons")`
- `payment_method`: 'package' when booked via credit (or 'stripe' / 'manual')

## State Transitions

### `LessonPackage.status`:
- `pending`: Package purchase initiated, awaiting Stripe checkout completion.
- `active`: Stripe payment succeeded, available credits > 0.
- `completed`: All 5 credits have been redeemed (`used_credits == total_credits`).
- `cancelled`: Manually cancelled or refunded administratively.
