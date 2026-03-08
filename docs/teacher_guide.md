# Teacher Guide: Managing Your Profile & Lessons

Welcome to the Spanish Tutor Platform! As a teacher, your focus should be on teaching. We've automated the administrative overhead.

## 1. Setting Up Your Availability
We use **Calendly** to manage scheduling.
1. Create a Calendly account.
2. Link your Zoom/Google Meet in Calendly Integrations.
3. Update your `calendly_url` in your platform profile (via the `Teacher` record in the database).

## 2. Managing Lessons
When a student books a lesson:
1. You will receive a Calendly email notification with the meeting link.
2. The platform will automatically record the `Lesson` as `pending`.
3. Once the student pays via Stripe, the status changes to `scheduled`.
4. You can view all your `scheduled` lessons in your teacher dashboard (Future Phase).

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
