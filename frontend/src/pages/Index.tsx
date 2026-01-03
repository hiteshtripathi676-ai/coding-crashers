import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui";
import { Navbar, BackgroundEffects } from "@/components/shared";
import { Zap, Brain, Shield, Sparkles } from "lucide-react";
import { apiUrl } from "@/lib/utils";

interface UserData {
  id: number;
  email: string;
  username: string;
}

const features = [
  { icon: Zap, title: "AI-Powered", desc: "Generate flashcards instantly using advanced AI" },
  { icon: Brain, title: "Quiz Mode", desc: "Test your knowledge with interactive quizzes" },
  { icon: Shield, title: "Anti-Cheat", desc: "Secure quiz mode with violation detection" },
  { icon: Sparkles, title: "Multi-Input", desc: "Text, voice, audio, image, video, and PDF" },
];

const Index = () => {
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(apiUrl("/api/me"), { credentials: "include" });
        const data = await res.json();
        if (data.status === "success" && data.user) {
          setUser(data.user);
        }
      } catch {
        setUser(null);
      }
    };
    checkAuth();
  }, []);

  return (
    <div className="min-h-screen">
      <BackgroundEffects />
      <Navbar />
      
      <main className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Hero */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Learn Smarter with{" "}
              <span className="gradient-text">Coding Crashers</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Transform your study notes into AI-powered flashcards. Multiple input modes, 
              interactive quizzes, and secure testing.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/dashboard">
                <Button variant="glow" size="lg">
                  {user ? "Go to Dashboard" : "Get Started"}
                </Button>
              </Link>
              {!user && (
                <Link to="/register">
                  <Button variant="outline" size="lg">Sign Up Free</Button>
                </Link>
              )}
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {features.map((f, i) => (
              <div key={i} className="glass-card p-6 rounded-xl text-center">
                <f.icon className="w-10 h-10 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Index;
