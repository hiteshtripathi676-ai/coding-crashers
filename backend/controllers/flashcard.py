"""Flashcard controller."""
import re
import tempfile
import google.generativeai as genai
from faster_whisper import WhisperModel
from backend.config import Config

# Initialize Google Gemini
try:
    genai.configure(api_key=Config.GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-2.5-flash')
    print(f"[INFO] Gemini API initialized with key: {Config.GEMINI_API_KEY[:10]}...")
except Exception as e:
    print(f"[ERROR] Failed to initialize Gemini: {e}")
    gemini_model = None

flashcard_cache = {}


class FlashcardController:
    """Handles flashcard generation and evaluation."""

    @staticmethod
    def generate(text: str, count: int = 5) -> tuple[bool, str, list]:
        """Generate flashcards from text using Google Gemini."""
        if not text:
            return False, "Please enter study notes.", []
        
        if gemini_model is None:
            return False, "Gemini API not configured. Check your API key.", []

        # Check cache
        if text in flashcard_cache:
            flashcards = flashcard_cache[text]
        else:
            prompt = (
                "Generate informative flashcards from this content.\n"
                "Format each flashcard as:\n"
                "Question: <question>\nAnswer: <answer>\n"
                "No other output.\n\n"
                f"Content:\n{text}"
            )

            try:
                print(f"[DEBUG] Sending to Gemini: {text[:100]}...")
                response = gemini_model.generate_content(prompt)
                output = response.text.strip()
                print(f"[DEBUG] Gemini response: {output[:200]}...")

                matches = re.findall(
                    r"Question[:>]\s*(.+?)\s*Answer[:>]\s*(.+?)(?=\nQuestion[:>]|$)",
                    output,
                    flags=re.IGNORECASE | re.DOTALL,
                )

                flashcards = []
                for q, a in matches:
                    q, a = q.strip(), a.strip()
                    if len(q) > 5 and len(a) > 5:
                        flashcards.append({"id": len(flashcards) + 1, "question": q, "answer": a})

                if not flashcards:
                    return False, "No flashcards found. Try different input.", []

                flashcard_cache[text] = flashcards

            except Exception as e:
                return False, f"Error: {str(e)}", []

        # Limit based on count
        if isinstance(count, int) and count > 0:
            flashcards = flashcards[:count]

        return True, "Success", flashcards

    @staticmethod
    def transcribe_audio(audio_file) -> tuple[bool, str]:
        """Transcribe audio to text."""
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
                audio_file.save(tmp.name)
                whisper_model = WhisperModel("base", compute_type="int8")
                segments, _ = whisper_model.transcribe(tmp.name)
                transcript = " ".join([seg.text for seg in segments])

            if not transcript.strip():
                return False, "Could not transcribe audio"

            return True, transcript
        except Exception as e:
            return False, f"Transcription error: {str(e)}"

    @staticmethod
    def evaluate_answer(user_answer: str, correct_answer: str) -> bool:
        """Evaluate user answer against correct answer using Google Gemini."""
        if not user_answer or not correct_answer:
            return False

        try:
            prompt = (
                "You are a smart evaluator. Compare the user's answer to the correct answer.\n"
                f"Correct Answer: {correct_answer}\n"
                f"User Answer: {user_answer}\n"
                "Is the user's answer semantically correct? Reply only 'yes' or 'no'."
            )
            response = gemini_model.generate_content(prompt)
            result = response.text.strip().lower()
            return "yes" in result
        except Exception:
            return False
