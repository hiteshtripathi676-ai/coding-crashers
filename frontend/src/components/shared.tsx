import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "./ui";
import { Zap, Menu, X, Mic, Loader2, LogOut, ChevronDown } from "lucide-react";
import { apiUrl } from "@/lib/utils";

interface UserData {
  id: number;
  email: string;
  username: string;
}

// ========== NAVBAR ==========
export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const res = await fetch(apiUrl("/api/me"), { credentials: "include" });
        const data = await res.json();
        if (data.status === "success" && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    };
    checkAuth();
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await fetch(apiUrl("/api/logout"), { method: "POST", credentials: "include" });
      setUser(null);
      setShowDropdown(false);
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  const links = [
    { to: "/", label: "Home" },
    { to: "/dashboard", label: "Dashboard" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold">
          <Zap className="w-6 h-6 text-primary" />
          <span className="gradient-text">Coding Crashers</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === link.to ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                  {getInitials(user.username)}
                </div>
                <span className="text-sm font-medium">{user.username}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
              </button>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-medium">{user.username}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-sm text-left hover:bg-secondary flex items-center gap-2 text-red-400"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login"><Button variant="ghost" size="sm">Login</Button></Link>
              <Link to="/register"><Button variant="glow" size="sm">Sign Up</Button></Link>
            </div>
          )}
        </div>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-background border-b border-border"
        >
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            {links.map((link) => (
              <Link key={link.to} to={link.to} className="text-sm font-medium" onClick={() => setIsOpen(false)}>
                {link.label}
              </Link>
            ))}
            {user ? (
              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                    {getInitials(user.username)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user.username}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-400">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="flex-1"><Button variant="outline" className="w-full">Login</Button></Link>
                <Link to="/register" className="flex-1"><Button variant="glow" className="w-full">Sign Up</Button></Link>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </nav>
  );
};

// ========== BACKGROUND EFFECTS ==========
export const BackgroundEffects = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.15),transparent_50%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(236,72,153,0.1),transparent_50%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.1),transparent_50%)]" />
  </div>
);

// ========== FLASHCARD ==========
interface FlashcardProps {
  question: string;
  answer: string;
  index: number;
}

export const Flashcard = ({ question, answer, index }: FlashcardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="flashcard-container h-64 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
      <motion.div
        className={`flashcard-flip relative w-full h-full ${isFlipped ? "flipped" : ""}`}
        initial={{ rotateY: 0 }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front */}
        <div
          className="flashcard-front absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-xl p-6 flex flex-col items-center justify-center border border-primary/30"
          style={{ backfaceVisibility: "hidden" }}
        >
          <span className="text-xs text-muted-foreground mb-2">Question {index + 1}</span>
          <p className="text-lg font-medium text-center">{question}</p>
          <span className="text-xs text-muted-foreground mt-4">Click to reveal</span>
        </div>
        {/* Back */}
        <div
          className="flashcard-back absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-xl p-6 flex flex-col items-center justify-center border border-green-500/30"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <span className="text-xs text-muted-foreground mb-2">Answer</span>
          <p className="text-lg font-medium text-center">{answer}</p>
          <span className="text-xs text-muted-foreground mt-4">Click to flip back</span>
        </div>
      </motion.div>
    </div>
  );
};

// ========== AUDIO RECORDER ==========
interface AudioRecorderProps {
  onTranscription: (text: string) => void;
}

export const AudioRecorder = ({ onTranscription }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/wav" });
        await sendAudioToServer(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      intervalRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (err) {
      console.error("Mic error:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  };

  const sendAudioToServer = async (blob: Blob) => {
    setIsProcessing(true);
    const formData = new FormData();
    formData.append("audio", blob, "recording.wav");

    try {
      const res = await fetch(apiUrl("/api/transcribe_audio"), { method: "POST", body: formData });
      const data = await res.json();
      if (data.status === "success") onTranscription(data.transcript);
    } catch (err) {
      console.error("Transcription error:", err);
    }
    setIsProcessing(false);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-colors ${
          isRecording ? "bg-red-500 animate-pulse" : "bg-primary hover:bg-primary/90"
        } ${isProcessing ? "opacity-50" : ""}`}
      >
        {isProcessing ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <Mic className="w-8 h-8 text-white" />}
      </motion.button>
      <p className="text-sm text-muted-foreground">
        {isProcessing ? "Processing..." : isRecording ? formatTime(duration) : "Click to record"}
      </p>
    </div>
  );
};
