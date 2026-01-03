"""Entry point for running the application."""
import os
from backend.app import create_app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("ENV", "development") != "production"
    app.run(debug=debug, host="0.0.0.0", port=port)
