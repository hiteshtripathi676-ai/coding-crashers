import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Textarea, Input, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Navbar, BackgroundEffects, Flashcard, AudioRecorder } from "@/components/shared";
import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";
import { toast } from "sonner";
import {
  Zap, Sparkles, Mic, FileText, Loader2, ChevronLeft, ChevronRight, RotateCcw, Send,
  CheckCircle, XCircle, Image, Video, FileUp, Upload, Brain, Trophy, Target, Play, X,
  Download, Shield, ShieldAlert, AlertTriangle, Lock,
} from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface FlashcardData {
  question: string;
  answer: string;
  userAnswer?: string;
  isCorrect?: boolean;
}

interface UserData {
  id: number;
  email: string;
  username: string;
}

type InputMode = "text" | "voice" | "audio" | "image" | "video" | "pdf";
type AppMode = "flashcard" | "quiz";

const Dashboard = () => {
  const navigate = useNavigate();
  
  // Auth state
  const [user, setUser] = useState<UserData | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  // Core state
  const [notes, setNotes] = useState("");
  const [numCards, setNumCards] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluationResult, setEvaluationResult] = useState<boolean | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");

  // Quiz state
  const [appMode, setAppMode] = useState<AppMode>("flashcard");
  const [quizActive, setQuizActive] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<FlashcardData[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState("");
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const [numQuestions, setNumQuestions] = useState(5);

  // Security state
  const [securityViolations, setSecurityViolations] = useState(0);
  const [windowBlurCount, setWindowBlurCount] = useState(0);
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  const [quizTerminated, setQuizTerminated] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // === AUTH CHECK ===
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        const data = await res.json();
        if (data.status === "success" && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
      setAuthChecking(false);
    };
    checkAuth();
  }, []);

  // === HANDLERS ===
  const handleGenerate = async () => {
    if (!notes.trim()) return;
    if (!user) {
      toast.error("Please login to generate flashcards");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate_flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: notes, count: numCards }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.status === "success" && data.flashcards) {
        setFlashcards(data.flashcards);
        setCurrentIndex(0);
      } else if (res.status === 401) {
        toast.error("Session expired. Please login again.");
        setUser(null);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate flashcards");
    }
    setIsGenerating(false);
  };

  const handleTranscription = (text: string) => {
    setNotes((prev) => prev + (prev ? "\n\n" : "") + text);
    setInputMode("text");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    setProcessingStatus("🔍 Scanning image...");
    try {
      const { data: { text } } = await Tesseract.recognize(file, "eng");
      if (text.trim()) {
        setNotes((prev) => prev + (prev ? "\n\n" : "") + text);
        setProcessingStatus("✅ Done!");
        setTimeout(() => { setInputMode("text"); setProcessingStatus(""); }, 1500);
      }
    } catch (err) {
      setProcessingStatus("❌ Failed");
    }
    setIsProcessing(false);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    setProcessingStatus("📄 Extracting text...");
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      let text = "";
      for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(" ") + "\n";
      }
      if (text.trim()) {
        setNotes((prev) => prev + (prev ? "\n\n" : "") + text);
        setProcessingStatus("✅ Done!");
        setTimeout(() => { setInputMode("text"); setProcessingStatus(""); }, 1500);
      }
    } catch (err) {
      setProcessingStatus("❌ Failed");
    }
    setIsProcessing(false);
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    setProcessingStatus("🎵 Transcribing...");
    try {
      const formData = new FormData();
      formData.append("audio", file);
      const res = await fetch("/api/transcribe_audio", { method: "POST", body: formData });
      const data = await res.json();
      if (data.status === "success") {
        setNotes((prev) => prev + (prev ? "\n\n" : "") + data.transcript);
        setProcessingStatus("✅ Done!");
        setTimeout(() => { setInputMode("text"); setProcessingStatus(""); }, 1500);
      }
    } catch (err) {
      setProcessingStatus("❌ Failed");
    }
    setIsProcessing(false);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    setProcessingStatus("🎬 Extracting audio...");
    try {
      const videoUrl = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.src = videoUrl;
      await new Promise((r) => (video.onloadedmetadata = r));
      
      const audioContext = new AudioContext();
      const response = await fetch(videoUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Convert to WAV
      const wavBlob = audioBufferToWav(audioBuffer);
      setProcessingStatus("🎵 Transcribing...");
      
      const formData = new FormData();
      formData.append("audio", wavBlob, "video.wav");
      const res = await fetch("/api/transcribe_audio", { method: "POST", body: formData });
      const data = await res.json();
      if (data.status === "success") {
        setNotes((prev) => prev + (prev ? "\n\n" : "") + data.transcript);
        setProcessingStatus("✅ Done!");
        setTimeout(() => { setInputMode("text"); setProcessingStatus(""); }, 1500);
      }
    } catch (err) {
      setProcessingStatus("❌ Failed");
    }
    setIsProcessing(false);
  };

  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    const channels: Float32Array[] = [];
    let pos = 0;
    const setUint16 = (d: number) => { view.setUint16(pos, d, true); pos += 2; };
    const setUint32 = (d: number) => { view.setUint32(pos, d, true); pos += 4; };
    setUint32(0x46464952); setUint32(length - 8); setUint32(0x45564157);
    setUint32(0x20746d66); setUint32(16); setUint16(1); setUint16(numOfChan);
    setUint32(buffer.sampleRate); setUint32(buffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2); setUint16(16); setUint32(0x61746164); setUint32(length - pos - 4);
    for (let i = 0; i < numOfChan; i++) channels.push(buffer.getChannelData(i));
    let offset = 0;
    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }
    return new Blob([bufferArray], { type: "audio/wav" });
  };

  const handleEvaluate = async () => {
    if (!userAnswer.trim()) return;
    setIsEvaluating(true);
    try {
      const res = await fetch("/api/evaluate_answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_answer: userAnswer, correct_answer: flashcards[currentIndex].answer }),
      });
      const data = await res.json();
      setEvaluationResult(data.correct);
    } catch (err) {
      setEvaluationResult(false);
    }
    setIsEvaluating(false);
  };

  const nextCard = () => { setCurrentIndex((p) => Math.min(p + 1, flashcards.length - 1)); setUserAnswer(""); setEvaluationResult(null); };
  const prevCard = () => { setCurrentIndex((p) => Math.max(p - 1, 0)); setUserAnswer(""); setEvaluationResult(null); };
  const resetCards = () => { setCurrentIndex(0); setUserAnswer(""); setEvaluationResult(null); };

  // === QUIZ FUNCTIONS ===
  const startQuiz = async () => {
    if (!notes.trim()) return;
    if (!user) {
      toast.error("Please login to start a quiz");
      return;
    }
    setIsGenerating(true);
    setProcessingStatus("🤖 Generating quiz...");
    try {
      const res = await fetch("/api/generate_flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: notes, count: numQuestions }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.status === "success" && data.flashcards) {
        const shuffled = data.flashcards.sort(() => Math.random() - 0.5);
        setQuizQuestions(shuffled);
        setQuizIndex(0);
        setQuizAnswer("");
        setCorrectCount(0);
        setWrongCount(0);
        setQuizComplete(false);
        setQuizStartTime(new Date());
        setQuizActive(true);
        setShowFeedback(false);
        setLastAnswerCorrect(null);
      } else if (res.status === 401) {
        toast.error("Session expired. Please login again.");
        setUser(null);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate quiz");
    }
    setIsGenerating(false);
    setProcessingStatus("");
  };

  const submitQuizAnswer = async () => {
    if (!quizAnswer.trim() || !quizQuestions[quizIndex]) return;
    setIsEvaluating(true);
    try {
      const res = await fetch("/api/evaluate_answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_answer: quizAnswer, correct_answer: quizQuestions[quizIndex].answer }),
      });
      const data = await res.json();
      const isCorrect = data.correct;
      
      const updated = [...quizQuestions];
      updated[quizIndex] = { ...updated[quizIndex], userAnswer: quizAnswer, isCorrect };
      setQuizQuestions(updated);
      
      if (isCorrect) setCorrectCount((p) => p + 1);
      else setWrongCount((p) => p + 1);
      
      setLastAnswerCorrect(isCorrect);
      setShowFeedback(true);
      
      setTimeout(() => {
        setShowFeedback(false);
        setLastAnswerCorrect(null);
        if (quizIndex < quizQuestions.length - 1) { setQuizIndex((p) => p + 1); setQuizAnswer(""); }
        else setQuizComplete(true);
      }, 1500);
    } catch (err) {
      console.error(err);
    }
    setIsEvaluating(false);
  };

  const closeQuiz = () => { setQuizActive(false); setQuizComplete(false); setQuizQuestions([]); setQuizIndex(0); setQuizAnswer(""); };
  const getScorePercentage = () => (correctCount + wrongCount === 0 ? 0 : Math.round((correctCount / (correctCount + wrongCount)) * 100));

  // === SECURITY ===
  const recordViolation = useCallback((v: string) => {
    setSecurityViolations((p) => { if (p + 1 >= 3) { setQuizTerminated(true); setQuizComplete(true); } return p + 1; });
    setSecurityWarning(v);
    setTimeout(() => setSecurityWarning(null), 3000);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!quizActive || quizComplete) return;
    const blocked = [
      { key: "PrintScreen" }, { key: "F12" }, { key: "i", ctrl: true, shift: true },
      { key: "j", ctrl: true, shift: true }, { key: "u", ctrl: true }, { key: "s", ctrl: true },
      { key: "p", ctrl: true }, { key: "c", ctrl: true }, { key: "v", ctrl: true }, 
      { key: "x", ctrl: true }, { key: "a", ctrl: true },
      { key: "Insert", ctrl: true }, { key: "Insert", shift: true },
    ];
    if (blocked.some((b) => e.key.toLowerCase() === b.key.toLowerCase() && e.ctrlKey === (b.ctrl || false) && e.shiftKey === (b.shift || false))) {
      e.preventDefault();
      recordViolation(`Blocked: ${e.ctrlKey ? "Ctrl+" : ""}${e.shiftKey ? "Shift+" : ""}${e.key}`);
    }
  }, [quizActive, quizComplete, recordViolation]);

  const handleCopyPaste = useCallback((e: ClipboardEvent) => {
    if (!quizActive || quizComplete) return;
    e.preventDefault();
    recordViolation(`${e.type === "copy" ? "Copy" : e.type === "paste" ? "Paste" : "Cut"} blocked`);
  }, [quizActive, quizComplete, recordViolation]);

  const handleVisibility = useCallback(() => {
    if (!quizActive || quizComplete) return;
    if (document.hidden) { setWindowBlurCount((p) => p + 1); recordViolation("Tab switched"); }
  }, [quizActive, quizComplete, recordViolation]);

  const handleWindowBlur = useCallback(() => {
    if (!quizActive || quizComplete) return;
    setWindowBlurCount((p) => p + 1);
    recordViolation("Window focus lost");
  }, [quizActive, quizComplete, recordViolation]);

  const handleContext = useCallback((e: MouseEvent) => {
    if (quizActive && !quizComplete) { e.preventDefault(); recordViolation("Right-click blocked"); }
  }, [quizActive, quizComplete, recordViolation]);

  const handleScreenCapture = useCallback(() => {
    if (!quizActive || quizComplete) return;
    recordViolation("Screenshot attempt detected");
  }, [quizActive, quizComplete, recordViolation]);

  useEffect(() => {
    if (quizActive && !quizComplete) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("visibilitychange", handleVisibility);
      document.addEventListener("contextmenu", handleContext);
      document.addEventListener("copy", handleCopyPaste);
      document.addEventListener("paste", handleCopyPaste);
      document.addEventListener("cut", handleCopyPaste);
      window.addEventListener("blur", handleWindowBlur);
      
      // Disable text selection during quiz
      document.body.style.userSelect = "none";
      
      // Listen for PrintScreen key (some browsers)
      const handlePrintScreen = (e: KeyboardEvent) => {
        if (e.key === "PrintScreen") {
          e.preventDefault();
          handleScreenCapture();
        }
      };
      document.addEventListener("keyup", handlePrintScreen);
      
      setSecurityViolations(0);
      setWindowBlurCount(0);
      setQuizTerminated(false);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("contextmenu", handleContext);
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
      document.removeEventListener("cut", handleCopyPaste);
      window.removeEventListener("blur", handleWindowBlur);
      document.body.style.userSelect = "";
    };
  }, [quizActive, quizComplete, handleKeyDown, handleVisibility, handleContext, handleCopyPaste, handleWindowBlur, handleScreenCapture]);

  // === DOWNLOAD ===
  const downloadFlashcardsTXT = () => {
    if (!flashcards.length) return alert("No flashcards!");
    const content = flashcards.map((fc, i) => `Q${i + 1}: ${fc.question}\nA${i + 1}: ${fc.answer}`).join("\n\n---\n\n");
    const blob = new Blob([`CODING CRASHERS FLASHCARDS\n\n${content}`], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "CodingCrashers_Flashcards.txt";
    link.click();
    setShowExportMenu(false);
  };

  const downloadFlashcardsCSV = () => {
    if (!flashcards.length) return alert("No flashcards!");
    const csv = "Question,Answer\n" + flashcards.map((fc) => `"${fc.question.replace(/"/g, '""')}","${fc.answer.replace(/"/g, '""')}"`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "CodingCrashers_Flashcards.csv";
    link.click();
    setShowExportMenu(false);
  };

  const downloadQuizReport = () => {
    const time = quizStartTime ? Math.floor((Date.now() - quizStartTime.getTime()) / 1000) : 0;
    let report = `CODING CRASHERS QUIZ REPORT\n\nScore: ${getScorePercentage()}%\nCorrect: ${correctCount}\nIncorrect: ${wrongCount}\nTime: ${Math.floor(time / 60)}m ${time % 60}s\nViolations: ${securityViolations}\n\n`;
    quizQuestions.forEach((q, i) => {
      report += `Q${i + 1}: ${q.question}\nYour Answer: ${q.userAnswer || "N/A"}\nCorrect: ${q.answer}\nResult: ${q.isCorrect ? "✓" : "✗"}\n\n`;
    });
    const blob = new Blob([report], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "CodingCrashers_Quiz_Report.txt";
    link.click();
  };

  // Input mode buttons config
  const inputModes = [
    { mode: "text" as InputMode, icon: FileText, label: "Text" },
    { mode: "voice" as InputMode, icon: Mic, label: "Voice" },
    { mode: "audio" as InputMode, icon: Upload, label: "Audio" },
    { mode: "image" as InputMode, icon: Image, label: "Image" },
    { mode: "video" as InputMode, icon: Video, label: "Video" },
    { mode: "pdf" as InputMode, icon: FileUp, label: "PDF" },
  ];

  return (
    <div className="min-h-screen">
      <BackgroundEffects />
      <Navbar />

      {/* Auth Loading */}
      {authChecking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Login Required Modal */}
      {!authChecking && !user && (
        <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full"
          >
            <Card variant="glass" className="text-center">
              <CardContent className="p-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <Lock className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Login Required</h2>
                <p className="text-muted-foreground mb-6">
                  Please login or create an account to access the Dashboard and use AI-powered flashcard and quiz features.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button variant="outline" onClick={() => navigate("/login")}>
                    Login
                  </Button>
                  <Button variant="glow" onClick={() => navigate("/register")}>
                    Sign Up
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Security Warning */}
      <AnimatePresence>
        {securityWarning && quizActive && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <ShieldAlert className="w-5 h-5" />
            <div>
              <p className="font-semibold">Security Warning!</p>
              <p className="text-sm">{securityWarning} ({3 - securityViolations} left)</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiz Modal */}
      <AnimatePresence>
        {quizActive && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="w-full max-w-2xl">
              <Card variant="glass" className="relative">
                <Button variant="ghost" size="sm" className="absolute top-4 right-4" onClick={closeQuiz}><X className="w-5 h-5" /></Button>

                {!quizComplete ? (
                  <CardContent className="p-8">
                    <div className="flex items-center justify-center gap-2 mb-4 text-xs text-green-400">
                      <Shield className="w-4 h-4" /><span>Anti-cheat active</span>
                    </div>
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">Q {quizIndex + 1}/{quizQuestions.length}</span>
                        <div className="flex gap-4 text-sm">
                          <span className="text-green-500">✓ {correctCount}</span>
                          <span className="text-red-500">✗ {wrongCount}</span>
                        </div>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <motion.div className="bg-primary h-2 rounded-full" animate={{ width: `${((quizIndex + 1) / quizQuestions.length) * 100}%` }} />
                      </div>
                    </div>
                    <h2 className="text-2xl font-semibold mb-8">{quizQuestions[quizIndex]?.question}</h2>
                    <AnimatePresence>
                      {showFeedback && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                          className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${lastAnswerCorrect ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                          {lastAnswerCorrect ? <><CheckCircle className="w-6 h-6" /><span>Correct!</span></> :
                            <><XCircle className="w-6 h-6" /><div><span className="block">Incorrect</span><span className="text-sm opacity-80">Answer: {quizQuestions[quizIndex]?.answer}</span></div></>}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <Textarea placeholder="Your answer..." value={quizAnswer} onChange={(e) => setQuizAnswer(e.target.value)} className="min-h-[120px] mb-4" disabled={showFeedback} />
                    <Button variant="glow" className="w-full" onClick={submitQuizAnswer} disabled={isEvaluating || !quizAnswer.trim() || showFeedback}>
                      {isEvaluating ? <><Loader2 className="w-4 h-4 animate-spin" />Evaluating...</> : <><Send className="w-4 h-4" />Submit</>}
                    </Button>
                  </CardContent>
                ) : (
                  <CardContent className="p-8 text-center">
                    {quizTerminated ? (
                      <>
                        <ShieldAlert className="w-20 h-20 mx-auto mb-4 text-red-500" />
                        <h2 className="text-3xl font-bold mb-2 text-red-500">Quiz Terminated</h2>
                        <p className="text-muted-foreground mb-6">Security violations: {securityViolations}</p>
                        <Button variant="outline" onClick={closeQuiz}>Close</Button>
                      </>
                    ) : (
                      <>
                        <Trophy className="w-20 h-20 mx-auto mb-4 text-yellow-500" />
                        <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                            <p className="text-2xl font-bold text-green-500">{correctCount}</p>
                            <p className="text-sm text-muted-foreground">Correct</p>
                          </div>
                          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                            <XCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
                            <p className="text-2xl font-bold text-red-500">{wrongCount}</p>
                            <p className="text-sm text-muted-foreground">Wrong</p>
                          </div>
                          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                            <Target className="w-8 h-8 mx-auto mb-2 text-primary" />
                            <p className="text-2xl font-bold text-primary">{getScorePercentage()}%</p>
                            <p className="text-sm text-muted-foreground">Score</p>
                          </div>
                        </div>
                        <div className={`p-3 rounded-lg mb-6 flex items-center justify-center gap-2 ${securityViolations > 0 ? "bg-yellow-500/10 text-yellow-400" : "bg-green-500/10 text-green-400"}`}>
                          {securityViolations > 0 ? <><AlertTriangle className="w-4 h-4" /><span className="text-sm">{securityViolations} violations</span></> : <><Shield className="w-4 h-4" /><span className="text-sm">No violations</span></>}
                        </div>
                        <div className="flex gap-4 justify-center flex-wrap">
                          <Button variant="outline" onClick={closeQuiz}>Close</Button>
                          <Button variant="secondary" onClick={downloadQuizReport}><Download className="w-4 h-4" />Report</Button>
                          <Button variant="glow" onClick={() => { setQuizComplete(false); setQuizIndex(0); setQuizAnswer(""); setCorrectCount(0); setWrongCount(0); setQuizStartTime(new Date()); setSecurityViolations(0); setQuizQuestions([...quizQuestions].sort(() => Math.random() - 0.5)); }}>
                            <RotateCcw className="w-4 h-4" />Retry
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                )}
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl font-bold mb-2"><span className="gradient-text">Dashboard</span></h1>
            <p className="text-muted-foreground">Create flashcards from your study notes using AI</p>
          </motion.div>

          {/* Mode Toggle */}
          <div className="mb-8 flex gap-2 p-1 bg-secondary/50 rounded-lg w-fit">
            <Button variant={appMode === "flashcard" ? "default" : "ghost"} onClick={() => setAppMode("flashcard")} className="gap-2">
              <Zap className="w-4 h-4" />Flashcard
            </Button>
            <Button variant={appMode === "quiz" ? "default" : "ghost"} onClick={() => setAppMode("quiz")} className="gap-2">
              <Brain className="w-4 h-4" />Quiz
            </Button>
          </div>

          {appMode === "flashcard" ? (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Input Section */}
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary" />Input</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {inputModes.map((m) => (
                      <Button key={m.mode} variant={inputMode === m.mode ? "default" : "secondary"} size="sm" onClick={() => setInputMode(m.mode)} className="flex flex-col h-auto py-2 gap-1">
                        <m.icon className="w-4 h-4" /><span className="text-xs">{m.label}</span>
                      </Button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {inputMode === "text" && <motion.div key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Textarea placeholder="Paste your study notes here..." value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[200px]" />
                    </motion.div>}
                    {inputMode === "voice" && <motion.div key="voice" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[200px] flex items-center justify-center">
                      <AudioRecorder onTranscription={handleTranscription} />
                    </motion.div>}
                    {inputMode === "audio" && <motion.div key="audio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[200px] flex flex-col items-center justify-center gap-4">
                      <input type="file" ref={audioInputRef} accept="audio/*" onChange={handleAudioUpload} className="hidden" />
                      <div onClick={() => audioInputRef.current?.click()} className="w-full h-32 border-2 border-dashed border-primary/30 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/60 transition-all">
                        <Upload className="w-10 h-10 text-primary/60 mb-2" /><p className="text-sm text-muted-foreground">Upload audio</p>
                      </div>
                      {isProcessing && <div className="flex items-center gap-2 text-primary"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">{processingStatus}</span></div>}
                    </motion.div>}
                    {inputMode === "image" && <motion.div key="image" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[200px] flex flex-col items-center justify-center gap-4">
                      <input type="file" ref={imageInputRef} accept="image/*" onChange={handleImageUpload} className="hidden" />
                      <div onClick={() => imageInputRef.current?.click()} className="w-full h-32 border-2 border-dashed border-pink-500/30 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-pink-500/60 transition-all">
                        <Image className="w-10 h-10 text-pink-500/60 mb-2" /><p className="text-sm text-muted-foreground">Upload image (OCR)</p>
                      </div>
                      {isProcessing && <div className="flex items-center gap-2 text-pink-500"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">{processingStatus}</span></div>}
                    </motion.div>}
                    {inputMode === "video" && <motion.div key="video" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[200px] flex flex-col items-center justify-center gap-4">
                      <input type="file" ref={videoInputRef} accept="video/*" onChange={handleVideoUpload} className="hidden" />
                      <div onClick={() => videoInputRef.current?.click()} className="w-full h-32 border-2 border-dashed border-orange-500/30 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-500/60 transition-all">
                        <Video className="w-10 h-10 text-orange-500/60 mb-2" /><p className="text-sm text-muted-foreground">Upload video</p>
                      </div>
                      {isProcessing && <div className="flex items-center gap-2 text-orange-500"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">{processingStatus}</span></div>}
                    </motion.div>}
                    {inputMode === "pdf" && <motion.div key="pdf" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[200px] flex flex-col items-center justify-center gap-4">
                      <input type="file" ref={pdfInputRef} accept=".pdf" onChange={handlePdfUpload} className="hidden" />
                      <div onClick={() => pdfInputRef.current?.click()} className="w-full h-32 border-2 border-dashed border-yellow-500/30 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-yellow-500/60 transition-all">
                        <FileUp className="w-10 h-10 text-yellow-500/60 mb-2" /><p className="text-sm text-muted-foreground">Upload PDF</p>
                      </div>
                      {isProcessing && <div className="flex items-center gap-2 text-yellow-500"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">{processingStatus}</span></div>}
                    </motion.div>}
                  </AnimatePresence>

                  {notes && inputMode !== "text" && <div className="p-3 bg-primary/10 rounded-lg"><p className="text-xs text-muted-foreground mb-1">Extracted:</p><p className="text-sm line-clamp-3">{notes}</p></div>}

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-sm text-muted-foreground mb-2 block"># Cards</label>
                      <Input type="number" min={1} max={20} value={numCards} onChange={(e) => setNumCards(parseInt(e.target.value) || 5)} />
                    </div>
                    <div className="flex-1">
                      <label className="text-sm text-muted-foreground mb-2 block">&nbsp;</label>
                      <Button variant="glow" className="w-full" onClick={handleGenerate} disabled={isGenerating || !notes.trim() || isProcessing}>
                        {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4" />Generate</>}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Flashcard Display */}
              <Card variant="glass">
                <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="w-5 h-5 text-primary" />Flashcards</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  {flashcards.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Card {currentIndex + 1}/{flashcards.length}</span>
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Button variant="ghost" size="sm" onClick={() => setShowExportMenu(!showExportMenu)}><Download className="w-4 h-4" />Export</Button>
                            {showExportMenu && (
                              <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden">
                                <button onClick={downloadFlashcardsTXT} className="w-full px-4 py-2 text-sm text-left hover:bg-secondary">📄 TXT</button>
                                <button onClick={downloadFlashcardsCSV} className="w-full px-4 py-2 text-sm text-left hover:bg-secondary">📊 CSV</button>
                              </div>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" onClick={resetCards}><RotateCcw className="w-4 h-4" />Reset</Button>
                        </div>
                      </div>
                      <AnimatePresence mode="wait">
                        <motion.div key={currentIndex} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
                          <Flashcard question={flashcards[currentIndex].question} answer={flashcards[currentIndex].answer} index={currentIndex} />
                        </motion.div>
                      </AnimatePresence>
                      <div className="flex items-center justify-between">
                        <Button variant="outline" onClick={prevCard} disabled={currentIndex === 0}><ChevronLeft className="w-4 h-4" />Prev</Button>
                        <div className="flex gap-1">{flashcards.map((_, i) => <button key={i} className={`w-2 h-2 rounded-full ${i === currentIndex ? "bg-primary" : "bg-muted"}`} onClick={() => { setCurrentIndex(i); setUserAnswer(""); setEvaluationResult(null); }} />)}</div>
                        <Button variant="outline" onClick={nextCard} disabled={currentIndex === flashcards.length - 1}>Next<ChevronRight className="w-4 h-4" /></Button>
                      </div>
                      <div className="pt-4 border-t border-border space-y-4">
                        <div className="flex gap-2">
                          <Input placeholder="Test yourself..." value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} className="flex-1" />
                          <Button variant="glow" onClick={handleEvaluate} disabled={isEvaluating || !userAnswer.trim()}>
                            {isEvaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          </Button>
                        </div>
                        <AnimatePresence>
                          {evaluationResult !== null && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                              className={`flex items-center gap-2 p-3 rounded-lg ${evaluationResult ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                              {evaluationResult ? <><CheckCircle className="w-5 h-5" /><span>Correct!</span></> : <><XCircle className="w-5 h-5" /><span>Try again</span></>}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                      <Sparkles className="w-16 h-16 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Flashcards Yet</h3>
                      <p className="text-muted-foreground text-sm">Enter notes and click Generate</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Quiz Mode */
            <Card variant="glass" className="max-w-3xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Brain className="w-5 h-5 text-primary" />Quiz Mode</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {inputModes.map((m) => (
                    <Button key={m.mode} variant={inputMode === m.mode ? "default" : "secondary"} size="sm" onClick={() => setInputMode(m.mode)} className="flex flex-col h-auto py-2 gap-1">
                      <m.icon className="w-4 h-4" /><span className="text-xs">{m.label}</span>
                    </Button>
                  ))}
                </div>
                
                <AnimatePresence mode="wait">
                  {inputMode === "text" && (
                    <motion.div key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Textarea placeholder="Paste your study notes..." value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[200px]" />
                    </motion.div>
                  )}
                  {inputMode === "voice" && (
                    <motion.div key="voice" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[200px] flex items-center justify-center">
                      <AudioRecorder onTranscription={handleTranscription} />
                    </motion.div>
                  )}
                  {inputMode === "audio" && (
                    <motion.div key="audio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[200px] flex flex-col items-center justify-center gap-4">
                      <input type="file" ref={audioInputRef} accept="audio/*" onChange={handleAudioUpload} className="hidden" />
                      <div onClick={() => audioInputRef.current?.click()} className="w-full h-32 border-2 border-dashed border-primary/30 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/60 transition-all">
                        <Upload className="w-10 h-10 text-primary/60 mb-2" /><p className="text-sm text-muted-foreground">Upload audio file</p>
                      </div>
                      {isProcessing && <div className="flex items-center gap-2 text-primary"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">{processingStatus}</span></div>}
                    </motion.div>
                  )}
                  {inputMode === "image" && (
                    <motion.div key="image" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[200px] flex flex-col items-center justify-center gap-4">
                      <input type="file" ref={imageInputRef} accept="image/*" onChange={handleImageUpload} className="hidden" />
                      <div onClick={() => imageInputRef.current?.click()} className="w-full h-32 border-2 border-dashed border-pink-500/30 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-pink-500/60 transition-all">
                        <Image className="w-10 h-10 text-pink-500/60 mb-2" /><p className="text-sm text-muted-foreground">Upload image (OCR)</p>
                      </div>
                      {isProcessing && <div className="flex items-center gap-2 text-pink-500"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">{processingStatus}</span></div>}
                    </motion.div>
                  )}
                  {inputMode === "video" && (
                    <motion.div key="video" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[200px] flex flex-col items-center justify-center gap-4">
                      <input type="file" ref={videoInputRef} accept="video/*" onChange={handleVideoUpload} className="hidden" />
                      <div onClick={() => videoInputRef.current?.click()} className="w-full h-32 border-2 border-dashed border-orange-500/30 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-500/60 transition-all">
                        <Video className="w-10 h-10 text-orange-500/60 mb-2" /><p className="text-sm text-muted-foreground">Upload video</p>
                      </div>
                      {isProcessing && <div className="flex items-center gap-2 text-orange-500"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">{processingStatus}</span></div>}
                    </motion.div>
                  )}
                  {inputMode === "pdf" && (
                    <motion.div key="pdf" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[200px] flex flex-col items-center justify-center gap-4">
                      <input type="file" ref={pdfInputRef} accept=".pdf" onChange={handlePdfUpload} className="hidden" />
                      <div onClick={() => pdfInputRef.current?.click()} className="w-full h-32 border-2 border-dashed border-yellow-500/30 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-yellow-500/60 transition-all">
                        <FileUp className="w-10 h-10 text-yellow-500/60 mb-2" /><p className="text-sm text-muted-foreground">Upload PDF</p>
                      </div>
                      {isProcessing && <div className="flex items-center gap-2 text-yellow-500"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">{processingStatus}</span></div>}
                    </motion.div>
                  )}
                </AnimatePresence>

                {notes && inputMode !== "text" && <div className="p-3 bg-primary/10 rounded-lg"><p className="text-xs text-muted-foreground mb-1">Extracted:</p><p className="text-sm line-clamp-3">{notes}</p></div>}
                
                <div className="grid sm:grid-cols-2 gap-4 p-4 bg-secondary/30 rounded-xl">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block"># Questions</label>
                    <Input type="number" min={3} max={20} value={numQuestions} onChange={(e) => setNumQuestions(parseInt(e.target.value) || 5)} />
                  </div>
                  <div className="flex items-end">
                    <Button variant="glow" className="w-full gap-2" onClick={startQuiz} disabled={isGenerating || !notes.trim()}>
                      {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : <><Play className="w-4 h-4" />Start Quiz</>}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
