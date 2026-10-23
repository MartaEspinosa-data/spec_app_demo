# Research & Decisions: Lesson Packages (5-Class Bundles with 3% Discount)

## 1. Credit-Based Package Architecture
**Decision**: When a package of 5 lessons is purchased and paid, a `LessonPackage` record is created/activated with `total_credits = 5` and `used_credits = 0`. Each redeemed lesson creates a normal `Lesson` record pointing to `package_id`, setting `price = package.per_lesson_price` and `payment_method = 'package'`.
**Rationale**: Keeps booking calendar, teacher availability, Google Meet links, reminders, and feedback completely consistent with regular lessons. No special lesson types or separate booking engines needed.
**Alternatives considered**:
- Pre-booking 5 calendar slots upfront at purchase time: Rejected per user decision. Students want flexibility to book dates individually over time.
- Coupon codes: Fragile, requires Stripe coupon management, vulnerable to code leaks.

## 2. Dynamic Stripe Checkout for Package Bundles
**Decision**: Use `stripe.checkout.Session.create` with inline `price_data` (currency EUR, unit_amount in cents calculated dynamically from `5 * single_lesson_price * 0.97`) and metadata `payment_type="package"`, `package_id=pkg.id`, `student_id=student.id`.
**Rationale**: Eliminates the need to manually configure separate fixed Stripe Price IDs for every combination of lesson type (Conversation, Basic Course, DELE, etc.) and duration (30, 45, 60 min). Allows teacher to adjust rates in DB/config without breaking Stripe products.
**Alternatives considered**:
- Creating pre-configured Stripe Payment Links/Price IDs for all combinations: High maintenance, cluttered Stripe dashboard.

## 3. Atomic Credit Consumption & Concurrency
**Decision**: Decrement remaining credits using atomic conditional database updates:
`UPDATE lesson_packages SET used_credits = used_credits + 1 WHERE id = :pkg_id AND used_credits < total_credits AND status = 'active'`
If rowcount == 0, raise HTTP 400 (insufficient credits).
**Rationale**: Prevents double-spend concurrency issues across SQLite and PostgreSQL without needing complex distributed locks.

## 4. Cancellation & Rejection Refund Policy
**Decision**: When a package lesson is cancelled (by student >=24h in advance or by teacher anytime), increment available credit (`used_credits = used_credits - 1`), set lesson status to `cancelled`, and do NOT invoke Stripe refund.
**Rationale**: User explicitly decided that package classes refund the credit to the bundle rather than money.
