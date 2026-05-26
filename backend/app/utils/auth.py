"""
JWT Authentication utilities for the Spanish Tutor Platform.
Uses python-jose for JWT encoding/decoding and bcrypt for password hashing.
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
import bcrypt

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production-use-a-strong-random-secret")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24  # Tokens valid for 24 hours

# HTTP Bearer security scheme
security = HTTPBearer(auto_error=False)


# ---- Password Hashing (bcrypt) ----

def hash_password(password: str) -> str:
    """Hash a password using bcrypt with automatic salt generation."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


# ---- JWT Token Creation ----

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_student_token(student_id: str, name: str, email: str) -> str:
    """Create a JWT for a student user."""
    return create_access_token({
        "sub": student_id,
        "role": "student",
        "name": name,
        "email": email,
    })


def create_teacher_token(teacher_id: str, name: str, email: str) -> str:
    """Create a JWT for a teacher user."""
    return create_access_token({
        "sub": teacher_id,
        "role": "teacher",
        "name": name,
        "email": email,
    })


# ---- JWT Token Decoding / Verification ----

def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and verify a JWT token. Raises JWTError on failure."""
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])


# ---- FastAPI Dependencies ----

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Dict[str, Any]:
    """
    FastAPI dependency: extracts and validates the JWT from the Authorization header.
    Returns the decoded token payload if valid.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Provide a Bearer token in the Authorization header.",
        )
    try:
        payload = decode_access_token(credentials.credentials)
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        )


def require_student(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """FastAPI dependency: requires a valid student JWT."""
    if user.get("role") != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access this resource.",
        )
    return user


def require_teacher(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """FastAPI dependency: requires a valid teacher JWT."""
    if user.get("role") != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can access this resource.",
        )
    return user


def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[Dict[str, Any]]:
    """
    FastAPI dependency: extracts JWT if present, but does not require it.
    Returns None if no token is provided or if it's invalid.
    """
    if credentials is None:
        return None
    try:
        return decode_access_token(credentials.credentials)
    except JWTError:
        return None
