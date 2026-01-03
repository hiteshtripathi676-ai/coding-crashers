"""API routes."""
from flask import Blueprint, request, jsonify
from backend.controllers import AuthController, FlashcardController

api = Blueprint("api", __name__, url_prefix="/api")


# === Auth Routes ===
@api.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    success, message = AuthController.login(
        data.get("email"), data.get("password")
    )
    if success:
        return jsonify({"status": "success"})
    return jsonify({"status": "error", "message": message}), 401


@api.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    success, message = AuthController.register(
        data.get("username"), data.get("email"), data.get("password")
    )
    if success:
        return jsonify({"status": "success"})
    return jsonify({"status": "error", "message": message}), 400


@api.route("/logout", methods=["POST"])
def logout():
    AuthController.logout()
    return jsonify({"status": "success"})


@api.route("/me", methods=["GET"])
def get_current_user():
    """Get current logged-in user info."""
    from flask import session
    if AuthController.is_authenticated():
        return jsonify({
            "status": "success",
            "user": {
                "id": session.get("user_id"),
                "email": session.get("email"),
                "username": session.get("username")
            }
        })
    return jsonify({"status": "error", "message": "Not authenticated"}), 401


# === Flashcard Routes ===
@api.route("/generate_flashcards", methods=["POST"])
def generate_flashcards():
    if not AuthController.is_authenticated():
        return jsonify({"status": "error", "message": "Login required", "flashcards": []}), 401

    data = request.get_json()
    print(f"[DEBUG] Received data: {data}")  # Debug log
    
    success, message, flashcards = FlashcardController.generate(
        data.get("text", "").strip(), data.get("count", 5)
    )
    
    print(f"[DEBUG] Result - Success: {success}, Message: {message}, Cards: {len(flashcards)}")  # Debug log

    if success:
        return jsonify({"status": "success", "flashcards": flashcards})
    return jsonify({"status": "error", "message": message, "flashcards": []}), 400


@api.route("/transcribe_audio", methods=["POST"])
def transcribe_audio():
    if "audio" not in request.files:
        return jsonify({"status": "error", "message": "No audio uploaded"}), 400

    success, result = FlashcardController.transcribe_audio(request.files["audio"])
    if success:
        return jsonify({"status": "success", "transcript": result})
    return jsonify({"status": "error", "message": result}), 400


@api.route("/evaluate_answer", methods=["POST"])
def evaluate_answer():
    data = request.get_json()
    correct = FlashcardController.evaluate_answer(
        data.get("user_answer", "").strip(),
        data.get("correct_answer", "").strip()
    )
    return jsonify({"correct": correct})
