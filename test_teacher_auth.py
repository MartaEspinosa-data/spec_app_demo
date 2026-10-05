import sys
import os

# Ensure backend directory is in python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_marta_teacher_login():
    print("Testing Teacher Login for Marta...")

    # 1. Exact credentials
    resp = client.post("/api/v1/teachers/login", json={
        "email": "martaespinosagarcia@gmail.com",
        "password": "1378945m"
    })
    print(f"Status Code: {resp.status_code}")
    print(f"Response: {resp.json()}")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    data = resp.json()
    assert "access_token" in data, "No access token in response"
    assert data["email"] == "martaespinosagarcia@gmail.com"
    print("  [PASS] Exact email & password login")

    # 2. Uppercase email & trailing spaces
    resp_case = client.post("/api/v1/teachers/login", json={
        "email": "  MARTAESPINOSAGARCIA@GMAIL.COM  ",
        "password": "1378945m"
    })
    assert resp_case.status_code == 200, f"Expected 200 for whitespace/case-insensitive email, got {resp_case.status_code}"
    print("  [PASS] Case-insensitive & trimmed email login")

    # 3. Wrong password
    resp_wrong = client.post("/api/v1/teachers/login", json={
        "email": "martaespinosagarcia@gmail.com",
        "password": "wrongpassword"
    })
    assert resp_wrong.status_code == 401
    print("  [PASS] Wrong password rejected with 401")

    print("\nALL TEACHER AUTH TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    test_marta_teacher_login()
