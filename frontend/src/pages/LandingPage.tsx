import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, Sparkles, Brain, Clock, ShieldAlert, BarChart3, 
  MessageSquare, FileText, CheckCircle2, Lock, ArrowRight, Eye, EyeOff, X
} from "lucide-react";

export const LandingPage: React.FC = () => {
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();

  // Auth Modal States
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<"login" | "signup" | "forgot" | "verify">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Status States
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "login") {
        await signIn(email, password);
        setShowModal(false);
        navigate("/dashboard");
      } else if (mode === "signup") {
        await signUp(email, password, name);
        setMode("verify");
        setSuccess("Account simulated successfully. Please verify your email below!");
      } else if (mode === "forgot") {
        await resetPassword(email);
        setSuccess("Simulated reset link sent to " + email);
      } else if (mode === "verify") {
        setSuccess("Email verification verified successfully! Logging you in...");
        setTimeout(async () => {
          await signIn(email, password);
          setShowModal(false);
          navigate("/dashboard");
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Brain, title: "Gemini Analysis", desc: "Instantly generate summaries, business insights, sentiments, and predictions." },
    { icon: BarChart3, title: "Interactive Recharts", desc: "Explore velocity with Line, Bar, Area, and Pie charts." },
    { icon: Clock, title: "YouTube & News Sync", desc: "Retrieve latest top headlines and YouTube video engagement counts." },
    { icon: Sparkles, title: "Multi-Term Comparison", desc: "Compare multiple keywords side-by-side with comparison graphs." },
    { icon: MessageSquare, title: "Query Bot", desc: "Chat with the TrendPulse Query Bot to summarize daily topics." },
    { icon: FileText, title: "Exportable Reports", desc: "Save AI research reports and export data sheets to PDF or Excel." }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden mesh-bg-animated relative">
      {/* BACKGROUND GRAPHICS */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />

      {/* NAVBAR */}
      <nav className="h-20 max-w-7xl mx-auto px-6 flex items-center justify-between border-b border-slate-900/50 sticky top-0 bg-slate-950/80 backdrop-blur-md z-40">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
            <TrendingUp size={18} />
          </div>
          <span className="font-bold text-sm tracking-wider uppercase bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            TrendPulse AI
          </span>
        </div>
        <button 
          onClick={() => { setMode("login"); setShowModal(true); }}
          className="btn-premium-glow flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl shadow-lg shadow-purple-500/10 cursor-pointer"
        >
          <Lock size={12} />
          <span>SaaS Console</span>
        </button>
      </nav>

      {/* HERO SECTION */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-24 text-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-950/20 text-purple-400 text-xs font-semibold tracking-wider">
            <Sparkles size={12} />
            <span>AI Powered Trend Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] max-w-3xl">
            Uncover and Predict Markets with{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              TrendPulse AI
            </span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg max-w-2xl leading-relaxed mt-2">
            A premium commercial SaaS platform combining real-time API research, custom machine learning forecasting pipelines, and conversational AI summaries.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
            <button 
              onClick={() => { setMode("signup"); setShowModal(true); }}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white text-sm font-semibold shadow-lg shadow-purple-500/25 flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Get Started Free</span>
              <ArrowRight size={14} />
            </button>
            <button 
              onClick={() => { setMode("login"); setShowModal(true); }}
              className="px-6 py-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-white text-sm font-semibold transition-all cursor-pointer"
            >
              Login to Account
            </button>
          </div>
        </motion.div>
      </section>

      {/* FEATURES SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-900/40 relative z-10">
        <div className="text-center mb-16 flex flex-col items-center gap-3">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">Everything you need for Trend Analysis</h2>
          <p className="text-slate-400 max-w-xl text-sm">Real-time analytical pipelines powered by Gemini and search engines, designed to keep you ahead.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card rounded-2xl p-6 flex flex-col gap-3"
              >
                <div className="h-10 w-10 rounded-xl bg-purple-950/40 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Icon size={20} />
                </div>
                <h3 className="font-bold text-sm">{feat.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-900/60 py-10 text-center text-xs text-slate-600 relative z-10 bg-slate-950">
        <p>© 2026 TrendPulse AI Platform. Developed for Final Year College Project Submission.</p>
      </footer>

      {/* AUTHENTICATION MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 relative z-50 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold tracking-tight uppercase">
                  {mode === "login" && "Login"}
                  {mode === "signup" && "Sign Up"}
                  {mode === "forgot" && "Forgot Password"}
                  {mode === "verify" && "Verify Email"}
                </h3>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-950/30 border border-red-500/20 text-red-400 text-xs rounded-xl mb-4 flex items-center gap-2">
                  <ShieldAlert size={14} />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-950/30 border border-green-500/20 text-green-400 text-xs rounded-xl mb-4 flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
                {mode === "signup" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Name</label>
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Name"
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-xs focus:border-purple-500 focus:outline-none w-full"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-xs focus:border-purple-500 focus:outline-none w-full"
                  />
                </div>

                {(mode === "login" || mode === "signup") && (
                  <div className="flex flex-col gap-1.5 relative">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-xs focus:border-purple-500 focus:outline-none w-full pr-10"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                )}

                {mode === "verify" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Verification Code</label>
                    <input 
                      type="text" 
                      required
                      placeholder="123456"
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-xs focus:border-purple-500 focus:outline-none text-center font-bold tracking-widest"
                    />
                    <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                      We have simulated sending a verification email to your address. Clicking "Confirm" will simulate confirmation.
                    </p>
                  </div>
                )}

                {mode === "login" && (
                  <button 
                    type="button" 
                    onClick={() => { setMode("forgot"); setError(""); setSuccess(""); }}
                    className="text-[10px] text-slate-500 hover:underline text-right"
                  >
                    Forgot Password?
                  </button>
                )}

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-xs font-semibold rounded-xl hover:opacity-90 shadow-md shadow-purple-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {loading ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Lock size={12} />
                      <span>
                        {mode === "login" && "Login"}
                        {mode === "signup" && "Sign Up"}
                        {mode === "forgot" && "Send Reset Link"}
                        {mode === "verify" && "Confirm Verification"}
                      </span>
                    </>
                  )}
                </button>

                {mode === "login" && (
                  <p className="text-[10px] text-slate-500 text-center mt-2">
                    Don't have an account?{" "}
                    <button type="button" onClick={() => { setMode("signup"); setError(""); setSuccess(""); }} className="text-purple-400 hover:underline">
                      Sign Up
                    </button>
                  </p>
                )}
                {mode === "signup" && (
                  <p className="text-[10px] text-slate-500 text-center mt-2">
                    Already have an account?{" "}
                    <button type="button" onClick={() => { setMode("login"); setError(""); setSuccess(""); }} className="text-purple-400 hover:underline">
                      Login
                    </button>
                  </p>
                )}
                {mode === "forgot" && (
                  <button type="button" onClick={() => { setMode("login"); setError(""); setSuccess(""); }} className="text-[10px] text-purple-400 hover:underline text-center">
                    Back to Login
                  </button>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

