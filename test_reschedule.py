import requests

lesson_id = "..." # Need to get this from DB
new_time = "2026-04-01T15:00:00Z"

# I'll just run a simple python script to do everything
import sqlite3
import datetime

db_path = "backend/sql_app.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute("SELECT id FROM lessons LIMIT 1")
row = cursor.fetchone()
if row:
    lesson_id = row[0]
    print(f"Testing with lesson_id: {lesson_id}")
    
    # FAILURE CASE (< 24h)
    # Set to 1h from now
    now = datetime.datetime.utcnow()
    near_time = (now + datetime.timedelta(hours=1)).isoformat()
    cursor.execute("UPDATE lessons SET start_time = ? WHERE id = ?", (near_time, lesson_id))
    conn.commit()
    
    try:
        r = requests.patch(f"http://localhost:8000/api/v1/lessons/{lesson_id}/reschedule?new_start_time=2026-05-01T10:00:00Z")
        print(f"Failure case result: {r.status_code} - {r.json()}")
    except Exception as e:
        print(f"Request failed: {e}")
        
    # SUCCESS CASE (> 24h)
    # Set to 48h from now
    far_time = (now + datetime.timedelta(hours=48)).isoformat()
    cursor.execute("UPDATE lessons SET start_time = ? WHERE id = ?", (far_time, lesson_id))
    conn.commit()
    
    try:
        r = requests.patch(f"http://localhost:8000/api/v1/lessons/{lesson_id}/reschedule?new_start_time=2026-05-01T10:00:00Z")
        print(f"Success case result: {r.status_code} - {r.json()}")
    except Exception as e:
        print(f"Request failed: {e}")

conn.close()
