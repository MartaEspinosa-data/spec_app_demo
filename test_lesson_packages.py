import os
import sys

# Ensure backend root in path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from fastapi.testclient import TestClient
from app.main import app
from app.database.database import SessionLocal, Base, engine
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.lesson_package import LessonPackage
from app.models.lesson import Lesson
from app.utils.auth import create_student_token

client = TestClient(app)

def test_package_flow():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 1. Preview
    resp = client.get("/api/v1/packages/preview?lesson_type=Conversación&duration=60")
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["count"] == 5
    assert data["single_price"] == 31.0
    assert data["subtotal"] == 155.0
    assert data["discount_percent"] == 3.0
    assert data["discount_amount"] == 4.65
    assert data["total_price"] == 150.35
    assert data["per_lesson_price"] == 30.07
    print("✅ Preview pricing verified (Total: €150.35, Per lesson: €30.07)")

    # 2. Get or create student & teacher
    student = db.query(Student).first()
    if not student:
        student = Student(name="Test Student", email="student_pkg_test@example.com")
        db.add(student)
        db.commit()
        db.refresh(student)

    teacher = db.query(Teacher).first()
    if not teacher:
        teacher = Teacher(id="test-teacher-id", name="Profe Marta", email="marta@example.com", price_per_hour=31.0)
        db.add(teacher)
        db.commit()
        db.refresh(teacher)

    token = create_student_token(student.id, student.name, student.email)
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Purchase package
    purchase_resp = client.post(
        "/api/v1/packages/purchase",
        json={"teacher_id": teacher.id, "lesson_type": "Conversación", "duration": 60},
        headers=headers,
    )
    assert purchase_resp.status_code == 200, purchase_resp.text
    p_data = purchase_resp.json()
    pkg_id = p_data["package_id"]
    print(f"✅ Package purchased successfully: {pkg_id}")

    # Ensure active for testing
    pkg = db.query(LessonPackage).filter(LessonPackage.id == pkg_id).first()
    pkg.status = "active"
    db.commit()

    # 4. List student packages
    list_resp = client.get(f"/api/v1/packages/student/{student.id}", headers=headers)
    assert list_resp.status_code == 200, list_resp.text
    pkgs = list_resp.json()["packages"]
    assert any(p["id"] == pkg_id for p in pkgs)
    print("✅ Package list retrieved successfully")

    # 5. Book using credit
    from datetime import datetime, timezone, timedelta
    booking_time = (datetime.now(timezone.utc) + timedelta(days=2)).replace(minute=0, second=0, microsecond=0)
    book_resp = client.post(
        f"/api/v1/packages/{pkg_id}/book",
        json={"start_time": booking_time.isoformat(), "student_timezone": "UTC"},
        headers=headers,
    )
    assert book_resp.status_code == 200, book_resp.text
    b_data = book_resp.json()
    assert b_data["remaining_credits"] == 4
    lesson_id = b_data["lesson_id"]
    print(f"✅ Lesson booked with credit: {lesson_id}, remaining: 4")

    # 6. Cancel lesson -> credit restored
    cancel_resp = client.patch(f"/api/v1/lessons/{lesson_id}/cancel", headers=headers)
    assert cancel_resp.status_code == 200, cancel_resp.text
    db.refresh(pkg)
    assert pkg.used_credits == 0
    print("✅ Lesson cancelled and credit restored back to 5 credits")

    db.close()
    print("🎉 ALL PACKAGE BACKEND TESTS PASSED!")

if __name__ == "__main__":
    test_package_flow()
