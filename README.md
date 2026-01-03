# 🚀 Coding Crashers - AI-Powered Flashcard & Quiz App

A modern full-stack application that uses **Google Gemini AI** to generate flashcards from your study notes, with multiple input modes and an interactive quiz system with anti-cheating features.

## 🏆 Google Technologies Used

| Technology | Usage |
|------------|-------|
| **Google Gemini 2.5 Flash** | AI-powered flashcard generation from text |
| **Google Gemini API** | Semantic answer evaluation for quizzes |

## 📁 Project Structure (MVC Architecture)

```
coding-crashers/
├── backend/                  # Flask Backend (MVC)
│   ├── config.py            # Configuration settings
│   ├── extensions.py        # Flask extensions (db, bcrypt, session)
│   ├── app.py               # Application factory
│   ├── requirements.txt     # Python dependencies
│   ├── models/
│   │   └── __init__.py      # User model
│   ├── controllers/
│   │   ├── auth.py          # Authentication controller
│   │   └── flashcard.py     # Flashcard/AI controller (Gemini)
│   └── routes/
│       └── api.py           # API routes
├── frontend/                 # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui.tsx       # UI components (Button, Input, Card, etc.)
│   │   │   └── shared.tsx   # Shared components (Navbar, Flashcard, etc.)
│   │   ├── pages/
│   │   │   ├── Index.tsx    # Landing page
│   │   │   ├── Login.tsx    # Login page
│   │   │   ├── Register.tsx # Registration page
│   │   │   └── Dashboard.tsx# Main flashcard/quiz dashboard
│   │   ├── lib/
│   │   │   └── utils.ts     # Utility functions
│   │   ├── App.tsx          # Main app with routing
│   │   └── main.tsx         # Entry point
│   ├── package.json
│   └── vite.config.ts
├── run.py                    # Application entry point
├── .env                      # Environment variables
└── README.md
```

## ✨ Features

### Input Modes (6 Ways to Add Content)
- **📝 Text** - Paste your study notes directly
- **🎤 Voice** - Record and transcribe speech in real-time
- **🎵 Audio** - Upload audio files for transcription
- **🖼️ Image** - Extract text from images using OCR (Tesseract.js)
- **🎬 Video** - Extract and transcribe audio from videos
- **📄 PDF** - Extract text from PDF documents (PDF.js)

### Flashcard Mode
- AI-generated Q&A flashcards using **Google Gemini 2.5 Flash**
- Interactive flip cards with smooth animations
- Self-testing with AI-powered semantic evaluation
- Export to TXT or CSV formats

### Quiz Mode
- Timed quiz sessions with random questions
- Real-time answer evaluation by **Google Gemini AI**
- Progress tracking with score display
- Downloadable quiz reports

### Security Features (Anti-Cheating)
- 🔒 Tab switch detection
- 📋 Copy/Paste prevention
- 🖥️ Window focus detection
- ⌨️ Blocked keyboard shortcuts (PrintScreen, DevTools, etc.)
- 🚫 Right-click prevention
- ⚠️ 3-strike violation system with auto-termination
- 📊 Violation tracking in reports

### Authentication
- User registration & login
- Session-based authentication
- Protected routes requiring login
- User avatar with initials in navbar

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Google Gemini API Key

### Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

### Frontend Setup

```bash
cd frontend
npm install
```

### Environment Variables

Create a `.env` file in root:
```env
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///codecell.db
GEMINI_API_KEY=your-gemini-api-key
```

Get your Gemini API key from: https://aistudio.google.com/apikey

### Run the App

```bash
# Terminal 1 - Backend
python run.py

# Terminal 2 - Frontend
cd frontend && npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000/api

## 🛠️ Tech Stack

### Backend
- **Flask** - Python web framework
- **SQLAlchemy** - ORM for database
- **Flask-Bcrypt** - Password hashing
- **Flask-Session** - Server-side sessions
- **Google Generative AI** - Gemini API for AI features
- **faster-whisper** - Audio transcription

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Framer Motion** - Animations
- **Tesseract.js** - OCR for images
- **PDF.js** - PDF text extraction
- **React Router** - Navigation
- **Sonner** - Toast notifications

## 👥 Team - Coding Crashers

Built with ❤️ for Google Hackathon

## 📄 License

MIT License
