# Student Authentication & Email Verification Guide

This document details the student authentication and email verification architecture for **Spanish with Marta**.

---

## 1. Overview & Architecture

To prevent spam accounts, fake registrations, and ensure students receive class confirmations, student email verification is enforced prior to granting access to the student dashboard.

```
                    STUDENT REGISTRATION & VERIFICATION FLOW
                    
 [Student] ─── 1. POST /students/register ───▶ [FastAPI Backend]
                    (name, email, password)           │
                                                      ├─ Hashes password (bcrypt)
                                                      ├─ Sets email_verified = False
                                                      ├─ Generates 32-byte secure token (24h expiry)
                                                      └─ Queues verification email via BackgroundTasks
                                                                      │
 [Gmail Inbox] ◀── 2. SMTP Delivery (HTML Email with Button) ────────┘
       │
       ▼
 [Student Clicks Link]
 (https://martaspanishteacher.com/student/verify-email?token=...)
       │
       ▼
 [Frontend VerifyEmail.tsx] ─── 3. POST /students/verify-email ───▶ [FastAPI Backend]
                                          (token)                           │
                                                                            ├─ Validates token & expiry
                                                                            ├─ Sets email_verified = True
                                                                            ├─ Clears token & expiry
                                                                            ├─ Queues welcome email
                                                                            └─ Issues JWT access token
                                                                                    │
 [Frontend Dashboard] ◀────── 4. Saves auth state & redirects ──────────────────────┘
```

---

## 2. Security Design

1. **Cryptographically Secure Tokens**:
   - Verification tokens are generated using `secrets.token_urlsafe(32)`.
   - Single-use: once verified, `verification_token` and `verification_token_expiry` are set to `NULL`.
2. **Time-Limited Expiry**:
   - Verification links are valid for **24 hours**. Expired tokens prompt the user to request a fresh link.
3. **Login Enforcement**:
   - `/api/v1/students/login` strictly checks `student.email_verified`.
   - If `False`, it returns HTTP `403 Forbidden` with a message instructing the user to check their email, and the frontend displays a 1-click **Resend Verification Email** button.
4. **Anti-Enumeration Protection**:
   - `/api/v1/students/resend-verification` always responds with HTTP `200` and a generic message, preventing attackers from probing for registered emails.
5. **Password Security**:
   - All passwords are encrypted with `bcrypt` (12 rounds). Legacy SHA-256 hashes are automatically upgraded to `bcrypt` upon next successful login.

---

## 3. Database Schema

The `students` table includes the following columns managed by Alembic migration `005_student_email_verification`:

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | `VARCHAR` | No (PK) | UUID v4 student identifier |
| `name` | `VARCHAR` | No | Student display name |
| `email` | `VARCHAR` | No (Unique, Indexed) | Student email address |
| `password_hash` | `VARCHAR` | Yes | Bcrypt hash (`$2b$12$...`) |
| `email_verified` | `BOOLEAN` | No (Default: False) | `True` only after email confirmation |
| `verification_token` | `VARCHAR` | Yes (Indexed) | 32-byte URL-safe verification token |
| `verification_token_expiry`| `TIMESTAMP` | Yes | Token expiration date/time (UTC) |
| `created_at` | `TIMESTAMP` | No | Timestamp of initial account creation |

---

## 4. API Endpoints

### `POST /api/v1/students/register`
Creates an unverified student account and queues the verification email.

- **Request Body**:
  ```json
  {
    "name": "Maria Garcia",
    "email": "maria@example.com",
    "password": "StrongPassword123!"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "status": "pending_verification",
    "message": "Account created! Please check your email to verify your account before logging in.",
    "student_id": "fe53dbdf-0585-431f-b7dd-d59b6d4f85a7",
    "name": "Maria Garcia",
    "email": "maria@example.com",
    "email_verified": false
  }
  ```

---

### `POST /api/v1/students/verify-email`
Validates the token, activates the account, and returns a session JWT token.

- **Request Body**:
  ```json
  {
    "token": "4vS49y9iY0L3-..."
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "message": "Email verified successfully! Welcome to Spanish with Marta.",
    "student_id": "fe53dbdf-0585-431f-b7dd-d59b6d4f85a7",
    "name": "Maria Garcia",
    "email": "maria@example.com",
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer"
  }
  ```

---

### `POST /api/v1/students/resend-verification`
Generates a new token and resends the verification email.

- **Request Body**:
  ```json
  {
    "email": "maria@example.com"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "message": "If an unverified account exists for this email, a new verification link has been sent."
  }
  ```

---

### `POST /api/v1/students/login`
Authenticates existing students.

- **Unverified Error (403 Forbidden)**:
  ```json
  {
    "detail": "Please verify your email address before logging in. Check your inbox for the verification link."
  }
  ```

---

## 5. Frontend Pages & Routes

| Route | Component | Purpose |
|---|---|---|
| `/student/login` | `StudentLogin.tsx` | Sign in & Sign up tabs. Displays pending verification banner and resend action. |
| `/student/verify-email?token=...` | `VerifyEmail.tsx` | Captures token from URL, verifies account, shows celebration card, redirects to `/dashboard`. |
| `/dashboard` | `DashboardPage.tsx` | Authenticated student portal for lessons and packages. |

---

## 6. Production Configuration

Required environment variables in Coolify / Docker:

| Key | Example (Prod) | Purpose |
|---|---|---|
| `FRONTEND_URL` | `https://martaspanishteacher.com` | Base URL used to construct the verification link |
| `SMTP_HOST` | `smtp.gmail.com` | Outgoing email server |
| `SMTP_PORT` | `587` | TLS port |
| `SMTP_USER` | `martaespinosagarcia@gmail.com` | Sender Google Account |
| `SMTP_PASS` | `qadvkcqmkqekqjaa` | Google App Password (16 characters) |

---

## 7. PostgreSQL vs SQLite Timezone Handling

A critical difference between development (SQLite) and production (PostgreSQL):
- **PostgreSQL** returns `DateTime(timezone=True)` values as **timezone-aware** Python `datetime` objects (`tzinfo=datetime.timezone.utc`).
- **SQLite** stores datetimes as naive strings/integers, returning **timezone-naive** `datetime` objects (`tzinfo=None`).

Comparing a timezone-aware datetime directly with `datetime.now(timezone.utc).replace(tzinfo=None)` raises:
`TypeError: can't compare offset-naive and offset-aware datetimes`

### Helper: `is_token_expired` (`app.utils.auth`)

To ensure robust token expiration checks across both engines, all expiration checks use `is_token_expired`:
```python
def is_token_expired(expiry_dt: Optional[datetime]) -> bool:
    """
    Check if a token expiry datetime has passed.
    Works seamlessly with both timezone-aware (PostgreSQL) and naive (SQLite) datetimes.
    """
    if expiry_dt is None:
        return True
    now = datetime.now(timezone.utc)
    if expiry_dt.tzinfo is not None:
        return expiry_dt < now
    return expiry_dt < now.replace(tzinfo=None)
```

---

## 8. Unverified Account Re-Registration & Testing Cleanup

1. **Re-registration Resilience**:
   If a user signs up but closes the tab or loses their email, submitting the registration form again with the same email updates their credentials, generates a fresh token, and re-dispatches the verification email rather than failing with HTTP 409.
2. **Database Migrations for Test Cleanup**:
   - `005_student_email_verification.py`: Adds columns and grandfathers existing active accounts.
   - `006_remove_test_student_linxsaturnos.py`: Cleanly removes test records and orphan lessons via atomic cascading deletes.

