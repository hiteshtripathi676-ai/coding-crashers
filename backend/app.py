"""Application factory."""
import os
from flask import Flask
from flask_cors import CORS
from backend.config import Config, IS_PRODUCTION
from backend.extensions import db, bcrypt, sess
from backend.routes import api


def create_app():
    """Create and configure Flask application."""
    app = Flask(__name__, static_folder="../frontend/dist", static_url_path="/")
    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)
    bcrypt.init_app(app)
    sess.init_app(app)
    
    # CORS configuration
    frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
    CORS(app, supports_credentials=True, origins=[frontend_origin, "http://localhost:3000"])

    # Register blueprints
    app.register_blueprint(api)

    # Serve React frontend
    @app.route("/")
    @app.route("/<path:path>")
    def serve_frontend(path=""):
        return app.send_static_file("index.html")

    # Create database tables
    with app.app_context():
        db.create_all()

    return app
