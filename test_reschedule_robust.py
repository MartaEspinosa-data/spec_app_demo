import sqlite3
import datetime
import requests

db_path = "backend/sql_app.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Find or Create a scheduled lesson
cursor.execute("SELECT id FROM lessons WHERE status = 'scheduled' LIMIT 1")
row = cursor.fetchone()

if not row:
    print("No scheduled lesson found. Creating one...")
    # I need a student and teacher ID. I'll just use known ones.
    teacher_id = "dc92ef71-d458-4e75-92d9-69b64fc1c964"
    cursor.execute("SELECT id FROM students LIMIT 1")
    s_row = cursor.fetchone()
    if not s_row:
        print("No student found. Can't create lesson.")
        conn.close()
        exit()
    student_id = s_row[0]
    lesson_id = "test-reschedule-id"
    # Create a lesson 48h from now
    now = datetime.datetime.utcnow()
    far_time = (now + datetime.timedelta(hours=48))
    cursor.execute("INSERT INTO lessons (id, student_id, teacher_id, start_time, duration, price, lesson_type, status) VALUES (?,?,?,?,?,?,?,?)",
                   (lesson_id, student_id, teacher_id, far_time.isoformat(), 60, 30.0, "Conversation", "scheduled"))
    conn.commit()
else:
    lesson_id = row[0]

print(f"Testing with lesson_id: {lesson_id}")

# 1. SUCCESS CASE (> 24h)
# Already set to far_time if newly created, or just use existing
try:
    r = requests.patch(f"http://localhost:8000/api/lessons/{lesson_id}/reschedule?new_start_time=2026-06-01T10:00:00Z")
    print(f"Success case result: {r.status_code} - {r.json()}")
except Exception as e:
    print(f"Request failed: {e}")

# 2. FAILURE CASE (< 24h)
# Set to 1h from now
now = datetime.datetime.utcnow()
near_time = (now + datetime.timedelta(hours=1))
cursor.execute("UPDATE lessons SET start_time = ? WHERE id = ?", (near_time.isoformat(), lesson_id))
conn.commit()

try:
    r = requests.patch(f"http://localhost:8000/api/lessons/{lesson_id}/reschedule?new_start_time=2026-06-01T12:00:00Z")
    print(f"Failure case result: {r.status_code} - {r.json()}")
except Exception as e:
    print(f"Request failed: {e}")

conn.close()
