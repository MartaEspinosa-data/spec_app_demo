import sqlite3
import datetime

db_path = "backend/sql_app.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get a lesson
cursor.execute("SELECT id, start_time FROM lessons LIMIT 1")
row = cursor.fetchone()
if not row:
    print("No lessons found to test.")
else:
    lesson_id, start_time = row
    print(f"Testing lesson {lesson_id} (original start: {start_time})")
    
    # Try to reschedule to tomorrow (should fail if already < 24h away, or pass if > 24h away)
    # Let's set the lesson start_time to 1 hour from now to test failure
    fail_time = (datetime.datetime.utcnow() + datetime.timedelta(hours=1)).isoformat()
    cursor.execute("UPDATE lessons SET start_time = ? WHERE id = ?", (fail_time, lesson_id))
    conn.commit()
    print(f"Set lesson to 1h from now: {fail_time}. Reschedule SHOULD fail.")
    
conn.close()
