"""Authentication controller."""
from flask import session
from backend.extensions import db, bcrypt
from backend.models import User


class AuthController:
    """Handles authentication logic."""

    @staticmethod
    def login(email: str, password: str) -> tuple[bool, str]:
        """Authenticate user and create session."""
        if not email or not password:
            return False, "Email and password required"

        user = User.query.filter_by(email=email).first()
        if user and user.password and bcrypt.check_password_hash(user.password, password):
            session["user_id"] = user.id
            session["email"] = user.email
            session["username"] = user.username
            return True, "Login successful"

        return False, "Invalid credentials"

    @staticmethod
    def register(username: str, email: str, password: str) -> tuple[bool, str]:
        """Register new user."""
        if not username or not email or not password:
            return False, "All fields are required"

        if User.query.filter_by(email=email).first():
            return False, "Email already exists"

        hashed_pw = bcrypt.generate_password_hash(password).decode("utf-8")
        user = User(username=username, email=email, password=hashed_pw)
        db.session.add(user)
        db.session.commit()
        return True, "Registration successful"

    @staticmethod
    def logout():
        """Clear user session."""
        session.clear()

    @staticmethod
    def is_authenticated() -> bool:
        """Check if user is logged in."""
        return "user_id" in session
