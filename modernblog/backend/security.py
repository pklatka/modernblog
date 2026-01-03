"""Security utilities for ModernBlog."""

import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional

import jwt


def hash_password(password: str) -> str:
    """Hash a password using PBKDF2 with a random salt."""
    salt = secrets.token_hex(16)
    # 100,000 iterations of SHA256
    hash_bytes = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100_000,
    )
    return f"{salt}${hash_bytes.hex()}"


def verify_password(password: str, hashed_password: str) -> bool:
    """Verify a password against a stored hash."""
    try:
        salt, stored_hash = hashed_password.split("$")
    except ValueError:
        # Invalid format
        return False

    hash_bytes = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100_000,
    )
    return hash_bytes.hex() == stored_hash


def create_access_token(
    data: dict, secret_key: str, expires_delta: Optional[timedelta] = None
) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=1440)  # Default 24 hours

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm="HS256")
    return encoded_jwt


def verify_access_token(token: str, secret_key: str) -> Optional[dict]:
    """Verify a JWT access token."""
    try:
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])
        return payload
    except jwt.PyJWTError:
        return None
