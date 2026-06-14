# Teacher Guide: Managing Your Profile & Lessons

Welcome to the Spanish Tutor Platform! As a teacher, your focus should be on teaching. We've automated the administrative overhead.

## 1. Setting Up Your Availability

We use **Calendly** to manage scheduling.

1. Create a Calendly account.
2. Link your Zoom/Google Meet in Calendly Integrations.
3. Update your `calendly_url` in your platform profile (via the `Teacher` record in the database).

## 2. Managing Lessons

When a student books a lesson:

1. The student selects a time slot and submits the booking form. A `Lesson` record is created with status `pending`.
2. The student is redirected to Stripe to complete payment.
3. **Once Stripe confirms payment, the lesson is auto-confirmed**: status changes to `scheduled`. No manual teacher acceptance is needed — payment is the acceptance.
4. The teacher dashboard shows only `scheduled` lessons (not pending/unpaid ones). You can then mark them `completed` after the session or cancel if needed.

## 3. Post-Lesson Artifacts (Coming Soon)

After each lesson, you will be able to upload:

- Lesson Summary
- Vocabulary Lists
- Grammar Corrections

These will be immediately available to your students in their dashboards.

## 4. Getting Paid

Payments are processed via **Stripe**.

- Earnings are settled to your linked bank account according to your Stripe schedule.
- You can view transaction history in the Stripe Express Dashboard.
