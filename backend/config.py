"""Application configuration."""
import os
from dotenv import load_dotenv

load_dotenv()

ENV = os.getenv("ENV", "development")
IS_PRODUCTION = ENV == "production"


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "super_secret_key")
    SESSION_TYPE = "filesystem"
    SESSION_COOKIE_SECURE = IS_PRODUCTION
    SESSION_COOKIE_SAMESITE = "None" if IS_PRODUCTION else "Lax"
    SESSION_COOKIE_HTTPONLY = True
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///codecell.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
