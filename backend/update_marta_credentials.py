import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bcrypt
from app.database import database
from app.models import teacher
from app.utils.auth import hash_password, verify_password
from sqlalchemy.orm import Session
from sqlalchemy import text

def update_marta_credentials():
    db: Session = database.SessionLocal()
    
    # Ensure email column exists on teachers table
    try:
        db.execute(text("ALTER TABLE teachers ADD COLUMN email VARCHAR"))
        db.commit()
        print("Added email column to teachers table.")
    except Exception as e:
        print(f"Note: email column check: {e}")
        db.rollback()

    marta = db.query(teacher.Teacher).first()
    if marta:
        marta.name = "Profe Marta"
        marta.email = "martaespinosagarcia@gmail.com"
        password_plain = "1378945m"
        new_hash = hash_password(password_plain)
        marta.password_hash = new_hash
        
        db.commit()
        print(f"Successfully updated credentials for teacher: {marta.name}")
        print(f"  Email: {marta.email}")
        print(f"  Password Hash: {marta.password_hash}")
        
        # Verify
        is_valid = verify_password(password_plain, marta.password_hash)
        print(f"  Password Verification Test ('{password_plain}'): {is_valid}")
    else:
        print("No teacher found in database.")
    
    db.close()

if __name__ == "__main__":
    update_marta_credentials()
