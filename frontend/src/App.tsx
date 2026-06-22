import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  TrendingUp, TrendingDown, Search, Users, Settings, AlertCircle, 
  Brain, Upload, Database, Key, FileText, Activity, LogOut, User as UserIcon, 
  Mail, Plus, Trash2, RefreshCw, Play, Globe, Clock, Heart, 
  MessageSquare, Share2, Eye, Download, LayoutDashboard, ShieldAlert,
  Menu, X, Sparkles, CheckCircle2, Lock, HelpCircle
} from "lucide-react";
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, 
  Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area 
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

const BACKEND_URL = import.meta.env.VITE_API_URL || "https://trendpulse-backend-yi4b.onrender.com";

interface RegionType {
  name: string;
  x: string;
  y: string;
  popularity: number;
  color: string;
}

const REGIONS: RegionType[] = [
  { name: "USA", x: "25%", y: "35%", popularity: 88, color: "#a855f7" },
  { name: "Canada", x: "22%", y: "22%", popularity: 65, color: "#3b82f6" },
  { name: "UK", x: "47%", y: "28%", popularity: 74, color: "#06b6d4" },
  { name: "Germany", x: "51%", y: "29%", popularity: 70, color: "#3b82f6" },
  { name: "India", x: "68%", y: "48%", popularity: 95, color: "#a855f7" },
  { name: "Japan", x: "85%", y: "36%", popularity: 82, color: "#06b6d4" },
  { name: "Australia", x: "88%", y: "78%", popularity: 58, color: "#3b82f6" }
];

export default function App() {
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentKeyword, setCurrentKeyword] = useState<string>("AI");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [toasts, setToasts] = useState<any[]>([]);

  // Auth States
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem("tp_token"));
  const [user, setUser] = useState<any>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup" | "forgot" | "verify">("login");
  const [authEmail, setAuthEmail] = useState<string>("");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [authName, setAuthName] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");
  const [authSuccess, setAuthSuccess] = useState<string>("");
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Dashboard Data States
  const [dbData, setDbData] = useState<any>(null);
  const [searchData, setSearchData] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any>(null);
  const [insightsData, setInsightsData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeFilter, setTimeFilter] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [timeAnalysisTab, setTimeAnalysisTab] = useState<"hourly" | "daily" | "weekly" | "monthly">("daily");

  // Admin & Dataset States
  const [datasets, setDatasets] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [newKeyLabel, setNewKeyLabel] = useState<string>("");
  const [isRetraining, setIsRetraining] = useState<boolean>(false);
  const [retrainMetrics, setRetrainMetrics] = useState<any>(null);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Trigger Toast Notification
  const addToast = (message: string, type: "info" | "warning" | "success" = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Fetch Suggestions
  useEffect(() => {
    if (searchQuery.length < 1) {
      setSuggestions([]);
      return;
    }
    fetch(`${BACKEND_URL}/api/suggestions?q=${searchQuery}`)
      .then(res => res.json())
      .then(data => setSuggestions(data))
      .catch(() => {});
  }, [searchQuery]);

  // Fetch Dashboard Stats & Profile
  useEffect(() => {
    fetchDashboardData();
    fetchAlerts();
    fetchDatasets();
    fetchApiKeys();
    fetchHealth();
    fetchLogs();
    
    if (authToken) {
      fetch(`${BACKEND_URL}/api/auth/profile?token=${authToken}`)
        .then(res => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then(data => setUser(data))
        .catch(() => {
          setAuthToken(null);
          localStorage.removeItem("tp_token");
        });
    }
  }, [authToken]);

  // Handle Search Query
  useEffect(() => {
    if (currentKeyword) {
      fetchAnalysis(currentKeyword);
    }
  }, [currentKeyword]);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/dashboard`);
      const data = await res.json();
      setDbData(data);
    } catch (err) {
      console.error("Error fetching dashboard KPIs", err);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/alerts`);
      const data = await res.json();
      setAlerts(data);
    } catch (err) {}
  };

  const fetchDatasets = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/datasets`);
      const data = await res.json();
      setDatasets(data);
    } catch (err) {}
  };

  const fetchApiKeys = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/keys`);
      const data = await res.json();
      setApiKeys(data);
    } catch (err) {}
  };

  const fetchHealth = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/health`);
      const data = await res.json();
      setSystemHealth(data);
    } catch (err) {}
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/logs`);
      const data = await res.json();
      setLogs(data);
    } catch (err) {}
  };

  const fetchAnalysis = async (keyword: string) => {
    setLoading(true);
    try {
      // Parallel requests
      const [resAnalyze, resForecast, resInsights] = await Promise.all([
        fetch(`${BACKEND_URL}/api/analyze?keyword=${keyword}`),
        fetch(`${BACKEND_URL}/api/forecast?keyword=${keyword}`),
        fetch(`${BACKEND_URL}/api/insights?keyword=${keyword}`)
      ]);
      
      const dataAnalyze = await resAnalyze.json();
      const dataForecast = await resForecast.json();
      const dataInsights = await resInsights.json();

      setSearchData(dataAnalyze);
      setForecastData(dataForecast);
      setInsightsData(dataInsights);
      addToast(`Data loaded for #${keyword}`, "success");
    } catch (err) {
      addToast("Failed to load analysis for keyword", "warning");
    } finally {
      setLoading(false);
    }
  };

  // Auth Functions
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    const formData = new FormData();
    formData.append("email", authEmail);
    formData.append("password", authPassword);

    try {
      if (authMode === "signup") {
        formData.append("profile_name", authName);
        const res = await fetch(`${BACKEND_URL}/api/auth/signup`, { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Registration failed");
        setAuthToken(data.token);
        localStorage.setItem("tp_token", data.token);
        setUser(data.user);
        addToast("Registered and logged in!", "success");
        setShowAuthModal(false);
      } else if (authMode === "login") {
        const res = await fetch(`${BACKEND_URL}/api/auth/login`, { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Login failed");
        setAuthToken(data.token);
        localStorage.setItem("tp_token", data.token);
        setUser(data.user);
        addToast("Welcome back!", "success");
        setShowAuthModal(false);
      } else if (authMode === "forgot") {
        const res = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Operation failed");
        setAuthSuccess(data.message);
      } else if (authMode === "verify") {
        const res = await fetch(`${BACKEND_URL}/api/auth/verify-email`, { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Verification failed");
        setAuthSuccess(data.message);
        if (user) setUser({ ...user, is_verified: true });
      }
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    localStorage.removeItem("tp_token");
    setUser(null);
    addToast("Logged out successfully", "info");
  };

  // Dismiss Alert
  const dismissAlert = async (id: number) => {
    try {
      await fetch(`${BACKEND_URL}/api/alerts/dismiss/${id}`, { method: "POST" });
      setAlerts(prev => prev.filter(a => a.id !== id));
      addToast("Alert dismissed", "info");
    } catch (err) {}
  };

  // Generate API Key
  const generateApiKey = async () => {
    if (!newKeyLabel) return;
    const formData = new FormData();
    formData.append("label", newKeyLabel);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/keys/create`, { method: "POST", body: formData });
      const data = await res.json();
      setApiKeys(prev => [...prev, { id: Date.now(), key: data.key, label: data.label, is_active: true }]);
      setNewKeyLabel("");
      addToast("API Key created", "success");
    } catch (err) {}
  };

  // Toggle API Key
  const toggleApiKey = async (id: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/keys/toggle/${id}`, { method: "POST" });
      const data = await res.json();
      setApiKeys(prev => prev.map(k => k.id === id ? { ...k, is_active: data.is_active } : k));
      addToast("API Key toggled", "info");
    } catch (err) {}
  };

  // Trigger Retraining
  const triggerRetraining = async () => {
    setIsRetraining(true);
    addToast("Model retraining started...", "info");
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/models/retrain`, { method: "POST" });
      const data = await res.json();
      setRetrainMetrics(data.metrics);
      addToast("Model retraining complete!", "success");
    } catch (err) {
      addToast("Model retraining failed", "warning");
    } finally {
      setIsRetraining(false);
    }
  };

  // Upload Dataset
  const handleDatasetUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFile) return;
    setUploadLoading(true);
    const formData = new FormData();
    formData.append("file", uploadedFile);

    try {
      const res = await fetch(`${BACKEND_URL}/api/upload`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");
      addToast("Dataset uploaded and active!", "success");
      setUploadedFile(null);
      fetchDatasets();
      fetchDashboardData();
      if (currentKeyword) fetchAnalysis(currentKeyword);
    } catch (err: any) {
      addToast(err.message, "warning");
    } finally {
      setUploadLoading(false);
    }
  };

  // Delete Dataset
  const deleteDataset = async (id: number) => {
    try {
      await fetch(`${BACKEND_URL}/api/datasets/${id}`, { method: "DELETE" });
      setDatasets(prev => prev.filter(d => d.id !== id));
      fetchDashboardData();
      if (currentKeyword) fetchAnalysis(currentKeyword);
      addToast("Dataset deleted", "info");
    } catch (err) {}
  };

  // Filtered Time Series Data (incorporates zoom levels / date slicing)
  const historyDataFiltered = useMemo(() => {
    if (!searchData || !searchData.history) return [];
    const full = searchData.history;
    const len = full.length;
    if (timeFilter === "7d") return full.slice(Math.max(0, len - 7));
    if (timeFilter === "30d") return full.slice(Math.max(0, len - 30));
    if (timeFilter === "90d") return full.slice(Math.max(0, len - 90));
    return full;
  }, [searchData, timeFilter]);

  // Combine History & Dotted Forecast Line
  const chartDataCombined = useMemo(() => {
    if (historyDataFiltered.length === 0) return [];
    
    // Convert history
    const combined: any[] = historyDataFiltered.map((h: any) => ({
      date: h.date,
      volume: h.volume,
      forecast: null,
      lower: null,
      upper: null
    }));

    // Add forecast
    if (forecastData && forecastData.forecast) {
      const lastHistVal = combined[combined.length - 1].volume;
      // Hook prediction start to the last historical point for visual continuity
      combined[combined.length - 1].forecast = lastHistVal;
      combined[combined.length - 1].lower = lastHistVal;
      combined[combined.length - 1].upper = lastHistVal;

      forecastData.forecast.forEach((f: any) => {
        combined.push({
          date: f.date,
          volume: null,
          forecast: f.forecast,
          lower: f.lower,
          upper: f.upper
        });
      });
    }

    return combined;
  }, [historyDataFiltered, forecastData]);

  // Export Data functions
  const exportToCSV = () => {
    if (!searchData) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Volume\n";
    searchData.history.forEach((row: any) => {
      csvContent += `${row.date},${row.volume}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `trendpulse_${currentKeyword}_history.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("Exported CSV successfully", "success");
  };

  return (
    <div className="min-h-screen text-slate-100 mesh-bg-animated flex flex-col font-sans">
      
      {/* 1. TOP HEADER NAVIGATION */}
      <header className="glass-panel border-b border-slate-800/60 sticky top-0 z-50 h-16 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-slate-800/60 rounded-lg text-slate-400 hover:text-white transition-colors lg:hidden">
            <Menu size={18} />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Brain size={18} className="text-white animate-pulse" />
            </div>
            <span className="font-display font-black text-lg tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-purple-400">
              TrendPulse <span className="text-purple-400 text-glow-purple">AI</span>
            </span>
          </div>
        </div>

        {/* Smart Search Box with autocomplete suggestion dropdown */}
        <div className="flex-1 max-w-xl mx-8 relative hidden md:block">
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search keyword (e.g. AI, Nvidia, Bitcoin, Fitness...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  setCurrentKeyword(searchQuery);
                  setSearchQuery("");
                  setSuggestions([]);
                }
              }}
              className="w-full bg-slate-900/60 border border-slate-800 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/30 text-white placeholder-slate-500 transition-all shadow-inner"
            />
          </div>
          {/* Autocomplete Suggestions */}
          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl z-50 glass-panel"
              >
                {suggestions.map((s: string, idx: number) => (
                  <button 
                    key={idx}
                    onClick={() => {
                      setCurrentKeyword(s);
                      setSearchQuery("");
                      setSuggestions([]);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs hover:bg-purple-950/30 hover:text-purple-400 border-b border-slate-800/40 last:border-0 text-slate-300 transition-colors flex items-center gap-2"
                  >
                    <TrendingUp size={12} className="text-purple-400" />
                    {s}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Account / Auth Widget */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              {user.is_verified && (
                <span className="text-[10px] text-green-400 bg-green-950/50 border border-green-500/20 px-2 py-0.5 rounded-full font-medium hidden sm:inline-flex items-center gap-1">
                  <CheckCircle2 size={10} /> Verified
                </span>
              )}
              <div 
                onClick={() => setShowAuthModal(true)}
                className="w-8 h-8 rounded-full bg-purple-900/60 border border-purple-500/40 flex items-center justify-center text-sm cursor-pointer hover:scale-105 transition-transform"
                title="Profile Settings"
              >
                {user.avatar || "😎"}
              </div>
              <div className="flex flex-col hidden sm:block">
                <span className="text-xs font-semibold text-white leading-none block">{user.profile_name}</span>
                <span className="text-[9px] text-slate-400">{user.email}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-red-400 hover:border-red-500/20 transition-all"
                title="Logout"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => { setAuthMode("login"); setShowAuthModal(true); }}
              className="btn-premium-glow flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-md shadow-purple-500/10"
            >
              <Lock size={12} />
              <span>Login / Sign Up</span>
            </button>
          )}
        </div>
      </header>

      {/* Quick Search Tags Ticker */}
      <div className="bg-slate-950/50 border-b border-slate-900/40 px-6 py-2 flex items-center gap-2 overflow-x-auto whitespace-nowrap text-xs">
        <span className="text-slate-500 font-mono text-[10px] uppercase tracking-wider select-none mr-2">Top Keywords:</span>
        {["AI", "Nvidia", "Cricket", "Bitcoin", "Elections", "Cooking", "Fitness"].map((kw) => (
          <button 
            key={kw}
            onClick={() => setCurrentKeyword(kw)}
            className={`px-3 py-1 rounded-full border transition-all ${
              currentKeyword === kw 
                ? "bg-purple-950/50 text-purple-400 border-purple-500/40 shadow-sm shadow-purple-500/10 font-bold" 
                : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
            }`}
          >
            #{kw}
          </button>
        ))}
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* 2. SIDEBAR SIDE-NAV PANEL */}
        <aside className={`glass-panel border-r border-slate-900/60 w-64 shrink-0 flex flex-col justify-between py-6 transition-all duration-300 z-40 absolute lg:relative inset-y-16 lg:inset-y-0 ${
          sidebarOpen ? "left-0" : "-left-64 lg:left-0"
        }`}>
          <div className="flex flex-col gap-1.5 px-4">
            <span className="text-[10px] font-bold text-slate-500 tracking-widest px-3 uppercase mb-2">Workspace</span>
            {[
              { id: "dashboard", label: "Analytics Dashboard", icon: LayoutDashboard },
              { id: "alerts", label: "Smart Alerts", icon: AlertCircle, badge: alerts.length },
              { id: "datasets", label: "Dataset Manager", icon: Database },
              { id: "integrations", label: "Data Integrations", icon: Globe },
              { id: "admin", label: "Admin Operations", icon: Settings },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all ${
                    activeTab === tab.id
                      ? "bg-purple-950/40 text-purple-400 border border-purple-500/20 font-bold"
                      : "text-slate-400 hover:bg-slate-900/40 hover:text-white border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} className={activeTab === tab.id ? "text-purple-400" : "text-slate-400"} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge && tab.badge > 0 ? (
                    <span className="bg-purple-900 text-purple-200 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* System Health Summary */}
          <div className="px-6 border-t border-slate-900/80 pt-6">
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1"><Activity size={10} className="text-cyan-400" /> Pipeline:</span>
                <span className="text-green-400 font-bold">Ready</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1"><Database size={10} className="text-purple-400" /> DB Storage:</span>
                <span className="font-mono text-slate-300">{systemHealth?.dataset_rows || 3000} rows</span>
              </div>
              {/* Trigger manual retraining */}
              <button 
                onClick={triggerRetraining} 
                disabled={isRetraining}
                className="w-full text-center py-1.5 rounded bg-purple-900/60 hover:bg-purple-800 text-[9px] font-bold text-purple-200 transition-colors flex items-center justify-center gap-1"
              >
                <RefreshCw size={8} className={isRetraining ? "animate-spin" : ""} />
                {isRetraining ? "Retraining..." : "Retrain ML Engine"}
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN COMPONENT CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          
          <AnimatePresence mode="wait">
            
            {/* TAB 1: ANALYTICS DASHBOARD */}
            {activeTab === "dashboard" && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col gap-6"
              >
                {/* 3. KPI CARDS GRID */}
                <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { 
                      title: "Trend Strength", 
                      value: forecastData?.metrics?.score !== undefined 
                        ? forecastData.metrics.score 
                        : (dbData?.kpis?.trend_strength ?? "..."), 
                      color: "text-purple-400", 
                      metric: "/ 100" 
                    },
                    { 
                      title: "Total Mentions", 
                      value: searchData?.total_mentions !== undefined 
                        ? searchData.total_mentions.toLocaleString() 
                        : (dbData?.kpis?.total_mentions?.toLocaleString() ?? "..."), 
                      color: "text-blue-400", 
                      metric: "posts" 
                    },
                    { 
                      title: "Total Engagement", 
                      value: searchData?.engagement 
                        ? (searchData.engagement.likes + searchData.engagement.comments + searchData.engagement.shares).toLocaleString() 
                        : (dbData?.kpis?.total_engagement?.toLocaleString() ?? "..."), 
                      color: "text-cyan-400", 
                      metric: "actions" 
                    },
                    { 
                      title: "Positive Sentiment", 
                      value: searchData?.sentiment?.positive !== undefined 
                        ? `${searchData.sentiment.positive}%` 
                        : (dbData?.kpis?.sentiment?.positive ? `${dbData.kpis.sentiment.positive}%` : "..."), 
                      color: "text-emerald-400", 
                      metric: "😄" 
                    },
                    { 
                      title: "Negative Sentiment", 
                      value: searchData?.sentiment?.negative !== undefined 
                        ? `${searchData.sentiment.negative}%` 
                        : (dbData?.kpis?.sentiment?.negative ? `${dbData.kpis.sentiment.negative}%` : "..."), 
                      color: "text-rose-400", 
                      metric: "😡" 
                    },
                    { 
                      title: "Neutral Sentiment", 
                      value: searchData?.sentiment?.neutral !== undefined 
                        ? `${searchData.sentiment.neutral}%` 
                        : (dbData?.kpis?.sentiment?.neutral ? `${dbData.kpis.sentiment.neutral}%` : "..."), 
                      color: "text-amber-400", 
                      metric: "😐" 
                    },
                    { 
                      title: "Virality Score", 
                      value: forecastData?.metrics?.peak_probability !== undefined 
                        ? forecastData.metrics.peak_probability 
                        : (dbData?.kpis?.virality_score ?? "..."), 
                      color: "text-fuchsia-400", 
                      metric: "scale" 
                    },
                    { 
                      title: "Growth Rate", 
                      value: forecastData?.metrics?.growth !== undefined 
                        ? `+${forecastData.metrics.growth}%` 
                        : (dbData?.kpis?.growth_rate ? `+${dbData.kpis.growth_rate}%` : "..."), 
                      color: "text-teal-400", 
                      metric: "YoY" 
                    }
                  ].map((card, idx) => (
                    <motion.div 
                      key={idx}
                      whileHover={{ scale: 1.02 }}
                      className="glass-card p-4 rounded-2xl border border-slate-900/60 bg-slate-900/20 flex flex-col justify-between"
                    >
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{card.title}</span>
                      <div className="flex items-baseline gap-1.5 mt-2">
                        <span className={`text-xl sm:text-2xl font-black font-display tracking-tight ${card.color}`}>
                          {card.value}
                        </span>
                        <span className="text-[10px] text-slate-500">{card.metric}</span>
                      </div>
                    </motion.div>
                  ))}
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left columns (65%) */}
                  <div className="lg:col-span-2 flex flex-col gap-6">
                    
                    {/* A. TREND TRAJECTORY CHART (Zoom, Date Selection, Forecast extension) */}
                    <div className="glass-card p-5 sm:p-6 rounded-3xl border border-slate-900/60 bg-slate-900/20">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                        <div>
                          <h3 className="font-display font-black text-sm text-white flex items-center gap-1.5">
                            <TrendingUp size={16} className="text-purple-400" />
                            Trend Trajectory Forecast – #{currentKeyword}
                          </h3>
                          <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                            Time-series predictive forecasting utilizing a Random Forest lag-regressor model.
                          </p>
                        </div>

                        {/* Date selection & Export */}
                        <div className="flex items-center gap-2">
                          <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-900 text-[10px] font-bold font-mono text-slate-400">
                            {["7d", "30d", "90d", "1y"].map((t) => (
                              <button 
                                key={t}
                                onClick={() => setTimeFilter(t as any)}
                                className={`px-2 py-1 rounded transition-colors ${timeFilter === t ? "bg-purple-900/60 text-purple-200" : "hover:text-white"}`}
                              >
                                {t.toUpperCase()}
                              </button>
                            ))}
                          </div>

                          <button 
                            onClick={exportToCSV}
                            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                            title="Export to CSV"
                          >
                            <Download size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Recharts Area/Line Chart */}
                      <div className="h-64 sm:h-72">
                        {loading ? (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-500 font-mono text-[11px]">
                            <RefreshCw size={24} className="animate-spin text-purple-400" />
                            <span>Recalculating forecast model...</span>
                          </div>
                        ) : chartDataCombined.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartDataCombined}>
                              <defs>
                                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                              <XAxis dataKey="date" stroke="#64748b" fontSize={9} tickLine={false} />
                              <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: "#0b1329", borderColor: "#1e293b", borderRadius: "12px", fontSize: "10px" }}
                                labelClassName="text-slate-400 font-bold"
                              />
                              <Legend wrapperStyle={{ fontSize: "10px" }} verticalAlign="top" height={36} />
                              {/* Historical volume */}
                              <Area name="Historical volume" type="monotone" dataKey="volume" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVolume)" />
                              {/* Dotted forecast extension */}
                              <Line name="RF Prediction" type="monotone" dataKey="forecast" stroke="#a855f7" strokeDasharray="5 5" strokeWidth={2.5} dot={false} />
                              <Line name="Lower Bound CI" type="monotone" dataKey="lower" stroke="#06b6d4" strokeWidth={1} strokeOpacity={0.4} dot={false} />
                              <Line name="Upper Bound CI" type="monotone" dataKey="upper" stroke="#a855f7" strokeWidth={1} strokeOpacity={0.4} dot={false} />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500 font-mono text-[10px]">No historical data found</div>
                        )}
                      </div>
                    </div>

                    {/* B. TIME ANALYSIS & CATEGORIES HEATMAP */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* B1: Time Analysis */}
                      <div className="glass-card p-5 rounded-3xl border border-slate-900/60 bg-slate-900/20">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-display font-black text-xs text-white">Time Intensity Analysis</h3>
                            <p className="text-[9px] text-slate-500 leading-tight mt-0.5">Mentions spread by time categories.</p>
                          </div>
                          
                          <div className="flex bg-slate-950 p-0.5 rounded border border-slate-900 text-[8px] font-bold font-mono">
                            {["hourly", "daily", "weekly", "monthly"].map((tab) => (
                              <button 
                                key={tab}
                                onClick={() => setTimeAnalysisTab(tab as any)}
                                className={`px-1.5 py-0.5 rounded transition-colors ${timeAnalysisTab === tab ? "bg-purple-900/60 text-purple-200" : "text-slate-400 hover:text-white"}`}
                              >
                                {tab[0].toUpperCase() + tab.slice(1, 3)}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="h-44">
                          {dbData?.time_analysis ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={dbData.time_analysis[timeAnalysisTab]}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.2} />
                                <XAxis dataKey="time" stroke="#64748b" fontSize={8} tickLine={false} />
                                <YAxis stroke="#64748b" fontSize={8} tickLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", fontSize: "9px" }} />
                                <Bar dataKey="volume" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                                  {dbData.time_analysis[timeAnalysisTab].map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#8b5cf6" : "#3b82f6"} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500 font-mono text-[9px]">Loading chart...</div>
                          )}
                        </div>
                      </div>

                      {/* B2: Trend Heatmap */}
                      <div className="glass-card p-5 rounded-3xl border border-slate-900/60 bg-slate-900/20">
                        <h3 className="font-display font-black text-xs text-white">Trend Category Heatmap</h3>
                        <p className="text-[9px] text-slate-500 leading-tight mt-0.5 mb-4">Darker colors mean stronger trend intensity.</p>
                        
                        <div className="grid grid-cols-3 gap-2">
                          {dbData?.heatmap.map((item: any, idx: number) => {
                            const intensity = item.intensity;
                            let bg = "bg-purple-950/20 text-purple-400 border-purple-900/20";
                            if (intensity > 60) bg = "bg-purple-700/80 text-white border-purple-500/50 shadow-md shadow-purple-500/10 font-bold";
                            else if (intensity > 35) bg = "bg-purple-900/50 text-purple-200 border-purple-700/30";
                            else if (intensity > 15) bg = "bg-purple-950/60 text-purple-300 border-purple-800/20";
                            
                            return (
                              <div 
                                key={idx}
                                className={`p-2.5 rounded-xl border text-[10px] flex flex-col justify-between h-14 ${bg} transition-all duration-300 hover:scale-105`}
                              >
                                <span className="font-semibold leading-tight">{item.category}</span>
                                <span className="font-mono text-[8px] opacity-80 mt-1">{intensity}% intensity</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>

                    {/* C. HASHTAG CLOUD & TOPIC BUBBLE CLUSTERING */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* C1: Hashtags & Word Cloud widget */}
                      <div className="glass-card p-5 rounded-3xl border border-slate-900/60 bg-slate-900/20">
                        <h3 className="font-display font-black text-xs text-white">Top Hashtags Analysis</h3>
                        <p className="text-[9px] text-slate-500 leading-tight mt-0.5 mb-4">Word Cloud & Virality Metrics.</p>
                        
                        <div className="flex flex-wrap gap-2 justify-center p-3 bg-slate-950/40 rounded-2xl border border-slate-900/60 mb-4 min-h-[90px]">
                          {dbData?.top_hashtags.map((h: any, idx: number) => {
                            const size = h.count > 50 ? "text-sm font-black" : h.count > 25 ? "text-xs font-bold" : "text-[10px]";
                            const colors = ["text-purple-400", "text-blue-400", "text-cyan-400", "text-pink-400", "text-indigo-400", "text-emerald-400"];
                            const color = colors[idx % colors.length];
                            return (
                              <span key={idx} className={`${size} ${color} cursor-pointer hover:underline p-1.5 transition-transform hover:scale-110 block`} title={`${h.count} occurrences`}>
                                {h.tag}
                              </span>
                            );
                          })}
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between text-[8px] text-slate-500 border-b border-slate-900 pb-1 font-mono uppercase">
                            <span>Hashtag</span>
                            <div className="flex items-center gap-6">
                              <span>Growth</span>
                              <span>Virality</span>
                            </div>
                          </div>
                          {dbData?.top_hashtags.slice(0, 4).map((h: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-[10px] py-0.5">
                              <span className="font-bold text-slate-300 font-mono">{h.tag}</span>
                              <div className="flex items-center gap-6 font-mono">
                                <span className="text-emerald-400">+{h.growth}%</span>
                                <span className="text-purple-400">{h.virality}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* C2: Topic Clustering Bubble Chart */}
                      <div className="glass-card p-5 rounded-3xl border border-slate-900/60 bg-slate-900/20">
                        <h3 className="font-display font-black text-xs text-white">Topic Clustering Visualization</h3>
                        <p className="text-[9px] text-slate-500 leading-tight mt-0.5 mb-2">Automated dataset categorization bubble clusters.</p>
                        
                        <div className="relative w-full h-44 bg-slate-950/60 border border-slate-900 rounded-2xl overflow-hidden">
                          {dbData?.clusters.map((c: any, idx: number) => {
                            const size = 45 + (c.size % 25);
                            return (
                              <motion.div 
                                key={idx}
                                animate={{ 
                                  y: [0, 4, 0],
                                  x: [0, -3, 0]
                                }}
                                transition={{
                                  duration: 6 + idx,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                                className="absolute bg-gradient-to-br from-purple-500/20 to-blue-600/30 border border-purple-500/40 rounded-full flex flex-col items-center justify-center text-center cursor-pointer hover:border-purple-400 hover:scale-105 transition-all shadow-lg select-none"
                                style={{
                                  left: c.x ? `${c.x}%` : "30%",
                                  top: c.y ? `${c.y}%` : "30%",
                                  width: `${size}px`,
                                  height: `${size}px`
                                }}
                                title={`Keywords: ${c.keywords.join(", ")}`}
                              >
                                <span className="text-[9px] font-black text-white leading-tight font-display px-1.5">{c.name.split(" ")[0]}</span>
                                <span className="text-[8px] font-mono text-purple-300 mt-0.5">{c.size} docs</span>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>

                    </div>

                    {/* D. ML PIPELINE FLOW VISUALIZATION (Animated Flow Chart) */}
                    <div className="glass-card p-5 rounded-3xl border border-slate-900/60 bg-slate-900/20">
                      <h3 className="font-display font-black text-xs text-white mb-1">ML Pipeline Execution Flow</h3>
                      <p className="text-[9px] text-slate-500 leading-tight mb-6">Visual model processing flow with active pipeline updates.</p>

                      <div className="overflow-x-auto">
                        <div className="flex items-center min-w-[700px] justify-between px-4 pb-2 relative">
                          {dbData?.ml_pipeline.steps.map((step: any, idx: number) => (
                            <React.Fragment key={idx}>
                              <div className="flex flex-col items-center gap-1.5 z-10">
                                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-purple-500/50 flex items-center justify-center shadow-lg shadow-purple-500/10 text-purple-400 text-xs font-bold font-mono">
                                  {idx + 1}
                                </div>
                                <span className="text-[9px] font-mono text-slate-300 font-bold whitespace-nowrap">{step.name}</span>
                              </div>

                              {/* Arrow */}
                              {idx < dbData.ml_pipeline.steps.length - 1 && (
                                <div className="flex-1 flex items-center justify-center px-1">
                                  <svg className="w-10 h-2 text-purple-500/60 overflow-visible" fill="none">
                                    <path 
                                      d="M 0,4 L 40,4" 
                                      stroke="currentColor" 
                                      strokeWidth="2" 
                                      strokeDasharray="4 4" 
                                      className="animate-[dash_2s_linear_infinite]" 
                                    />
                                    <path d="M 37,1 L 41,4 L 37,7" stroke="currentColor" strokeWidth="2" fill="none" />
                                  </svg>
                                </div>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Right Column Sidebar (35%) */}
                  <div className="flex flex-col gap-6">
                    
                    {/* A. LIVE TRENDING PIPELINE FEED */}
                    <div className="glass-card p-5 rounded-3xl border border-slate-900/60 bg-slate-900/20">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-display font-black text-xs text-white">Live Trending Pipeline</h3>
                          <p className="text-[9px] text-slate-500 leading-tight mt-0.5">Real-time keyword streaming feed.</p>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      </div>

                      <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
                        {dbData?.top_hashtags.map((item: any, idx: number) => {
                          const isSpike = item.growth > 60;
                          return (
                            <div 
                              key={idx} 
                              onClick={() => setCurrentKeyword(item.tag.replace("#", ""))}
                              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-900/80 bg-slate-900/40 cursor-pointer hover:border-purple-500/40 hover:bg-purple-950/10 transition-all"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] text-slate-500 font-mono">#{idx+1}</span>
                                <span className="text-xs font-bold text-slate-200">{item.tag}</span>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                  isSpike ? "bg-purple-950 text-purple-400 border border-purple-500/20" : "bg-slate-950 text-slate-400 border border-slate-800"
                                }`}>
                                  {isSpike ? "Exploding" : "Steady"}
                                </span>
                                <span className={`text-[10px] font-mono font-bold ${isSpike ? "text-purple-400" : "text-emerald-400"}`}>
                                  +{item.growth}%
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* B. SENTIMENT BREAKDOWN CHART (Pie & Gauge emoji indicators) */}
                    <div className="glass-card p-5 rounded-3xl border border-slate-900/60 bg-slate-900/20 flex flex-col items-center">
                      <div className="w-full text-left mb-2">
                        <h3 className="font-display font-black text-xs text-white">Sentiment Analysis Breakdown</h3>
                        <p className="text-[9px] text-slate-500 leading-tight mt-0.5 font-sans">NLP opinion tagging results.</p>
                      </div>

                      {searchData ? (
                        <>
                          <div className="h-44 w-full relative flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={[
                                    { name: "Positive", value: searchData.sentiment.positive, color: "#10b981" },
                                    { name: "Negative", value: searchData.sentiment.negative, color: "#f43f5e" },
                                    { name: "Neutral", value: searchData.sentiment.neutral, color: "#f59e0b" }
                                  ]}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={45}
                                  outerRadius={65}
                                  paddingAngle={4}
                                  dataKey="value"
                                >
                                  <Cell fill="#10b981" />
                                  <Cell fill="#f43f5e" />
                                  <Cell fill="#f59e0b" />
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", fontSize: "10px" }} />
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute text-2xl">
                              {searchData.sentiment.positive > 50 ? "📈" : searchData.sentiment.negative > 30 ? "📉" : "⚖️"}
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 w-full text-center mt-2 text-[10px]">
                            <div className="bg-emerald-950/20 border border-emerald-900/20 rounded-xl p-2">
                              <span className="block text-emerald-400 font-bold">{searchData.sentiment.positive}%</span>
                              <span className="text-[9px] text-slate-500 uppercase">Positive</span>
                            </div>
                            <div className="bg-rose-950/20 border border-rose-900/20 rounded-xl p-2">
                              <span className="block text-rose-400 font-bold">{searchData.sentiment.negative}%</span>
                              <span className="text-[9px] text-slate-500 uppercase">Negative</span>
                            </div>
                            <div className="bg-amber-950/20 border border-amber-900/20 rounded-xl p-2">
                              <span className="block text-amber-400 font-bold">{searchData.sentiment.neutral}%</span>
                              <span className="text-[9px] text-slate-500 uppercase">Neutral</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-slate-500 text-xs font-mono py-12">Search keyword to load breakdown</div>
                      )}
                    </div>

                    {/* C. AI INSIGHTS PANEL */}
                    <div className="glass-card p-5 rounded-3xl border border-slate-900/60 bg-slate-900/20">
                      <h3 className="font-display font-black text-xs text-white mb-1 flex items-center gap-1">
                        <Sparkles size={14} className="text-purple-400" />
                        AI Sentiment Insights Panel
                      </h3>
                      <p className="text-[9px] text-slate-500 leading-tight mb-4 font-sans">Dynamically generated NLP context reports.</p>

                      {insightsData ? (
                        <div className="flex flex-col gap-3 text-[10px] leading-relaxed text-slate-300">
                          <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-900/80">
                            <span className="font-bold text-slate-400 block mb-1">Key Observation:</span>
                            <p>{insightsData.observations}</p>
                          </div>
                          
                          <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-900/80">
                            <span className="font-bold text-rose-400/90 block mb-1">Potential Risk Profile:</span>
                            <p className="text-rose-200/80">{insightsData.risks}</p>
                          </div>

                          <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-900/80">
                            <span className="font-bold text-purple-400/90 block mb-1">Predicted Outlook:</span>
                            <p className="text-purple-200/80">{insightsData.future}</p>
                          </div>

                          <div className="bg-purple-950/20 p-2.5 rounded-xl border border-purple-500/20">
                            <span className="font-bold text-purple-400 block mb-1">Recommended Action:</span>
                            <p className="text-purple-200">{insightsData.action}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-500 text-xs font-mono py-12 text-center">Search keyword to generate insights</div>
                      )}
                    </div>

                    {/* D. RELATED TOPICS */}
                    <div className="glass-card p-5 rounded-3xl border border-slate-900/60 bg-slate-900/20">
                      <h3 className="font-display font-black text-xs text-white mb-2">Related Keyword Associations</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {searchData?.related && searchData.related.length > 0 ? (
                          searchData.related.map((tag: string, idx: number) => (
                            <button 
                              key={idx}
                              onClick={() => setCurrentKeyword(tag)}
                              className="px-2.5 py-1 bg-slate-950/50 hover:bg-purple-950/40 text-[9px] font-bold text-slate-400 hover:text-purple-400 border border-slate-900 hover:border-purple-500/30 rounded-lg transition-all"
                            >
                              #{tag}
                            </button>
                          ))
                        ) : (
                          ["Machine Learning", "OpenAI", "LLM", "Deep Learning", "Agents", "Generative AI", "Neural Networks"].map((tag, idx) => (
                            <button 
                              key={idx} 
                              onClick={() => setCurrentKeyword("AI")}
                              className="px-2.5 py-1 bg-slate-950/50 text-[9px] text-slate-500 border border-slate-900 rounded-lg"
                            >
                              #{tag}
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    {/* E. SMART ALERTS TICKETS FEED */}
                    <div className="glass-card p-5 rounded-3xl border border-slate-900/60 bg-slate-900/20">
                      <h3 className="font-display font-black text-xs text-white mb-1">Smart Triggered Alerts</h3>
                      <p className="text-[9px] text-slate-500 leading-tight mb-4">Volume spikes and sentiment drops.</p>

                      <div className="flex flex-col gap-2">
                        {alerts.slice(0, 3).map((item: any, idx: number) => {
                          const isCrit = item.severity === "Critical" || item.severity === "High";
                          return (
                            <div 
                              key={idx}
                              className={`p-3 rounded-xl border flex flex-col gap-1 relative ${
                                isCrit ? "bg-rose-950/20 border-rose-500/20 text-rose-300" : "bg-amber-950/20 border-amber-500/20 text-amber-300"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                  isCrit ? "bg-rose-900/40 text-rose-200" : "bg-amber-900/40 text-amber-200"
                                }`}>
                                  {item.severity} severity
                                </span>
                                
                                <button 
                                  onClick={() => dismissAlert(item.id)}
                                  className="text-[9px] hover:text-white text-slate-500 font-bold"
                                  title="Dismiss Alert"
                                >
                                  Dismiss
                                </button>
                              </div>
                              
                              <p className="text-[10px] leading-tight font-semibold mt-1 text-slate-200">{item.message}</p>
                              <span className="text-[8px] text-slate-500 font-mono mt-1">{new Date(item.timestamp).toLocaleTimeString()}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* F. COUNTRY REGIONAL ANALYSIS MAP */}
                    <div className="glass-card p-5 rounded-3xl border border-slate-900/60 bg-slate-900/20">
                      <h3 className="font-display font-black text-xs text-white mb-1">Regional Popularity Index</h3>
                      <p className="text-[9px] text-slate-500 leading-tight mb-4 font-sans">Popularity Index by Region.</p>

                      <div className="w-full h-32 bg-slate-950/60 border border-slate-900 rounded-xl relative overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 opacity-5 pointer-events-none">
                          {[...Array(72)].map((_, i) => <div key={i} className="border-r border-b border-white" />)}
                        </div>

                        {REGIONS.map((r, idx) => (
                          <div 
                            key={idx}
                            className="absolute cursor-pointer group"
                            style={{ left: r.x, top: r.y }}
                          >
                            <span 
                              className="w-2.5 h-2.5 rounded-full block animate-ping absolute"
                              style={{ backgroundColor: r.color }}
                            />
                            <span 
                              className="w-2.5 h-2.5 rounded-full block relative border border-white/20"
                              style={{ backgroundColor: r.color }}
                            />
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-3.5 bg-slate-900 border border-slate-800 text-[8px] px-1.5 py-0.5 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-white">
                              {r.name}: {r.popularity} score
                            </div>
                          </div>
                        ))}
                        <span className="text-[8px] text-slate-600 font-mono absolute bottom-1 right-2">World popularity wireframe</span>
                      </div>
                    </div>

                  </div>

                </div>
              </motion.div>
            )}

            {/* TAB 2: ALERTS LIST */}
            {activeTab === "alerts" && (
              <motion.div 
                key="alerts"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="glass-card p-6 rounded-3xl border border-slate-900/60 bg-slate-900/20 max-w-4xl mx-auto flex flex-col gap-6"
              >
                <div>
                  <h2 className="font-display font-black text-lg text-white flex items-center gap-1.5">
                    <ShieldAlert className="text-purple-400" size={20} />
                    Active Triggered Alerts Logs
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 font-sans">
                    Emergency alerts triggered automatically by the ML model analyzing engagement metrics.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  {alerts.length > 0 ? (
                    alerts.map((item: any, idx: number) => {
                      const isCrit = item.severity === "Critical" || item.severity === "High";
                      return (
                        <div 
                          key={idx}
                          className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                            isCrit ? "bg-rose-950/20 border-rose-500/20 text-rose-300" : "bg-amber-950/20 border-amber-500/20 text-amber-300"
                          }`}
                        >
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                                isCrit ? "bg-rose-900/60 text-rose-100" : "bg-amber-900/60 text-amber-100"
                              }`}>
                                {item.severity} Severity
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">{new Date(item.timestamp).toLocaleString()}</span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-100 mt-1">{item.message}</h4>
                          </div>

                          <button 
                            onClick={() => dismissAlert(item.id)}
                            className="bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white px-3 py-1.5 rounded-xl border border-slate-800 text-[10px] font-bold"
                          >
                            Dismiss
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-slate-500 text-xs font-mono py-12 text-center border border-dashed border-slate-800 rounded-2xl">
                      No active alerts found. Clear state.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 3: DATASET MANAGER */}
            {activeTab === "datasets" && (
              <motion.div 
                key="datasets"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="max-w-4xl mx-auto flex flex-col gap-6"
              >
                <div className="glass-card p-6 rounded-3xl border border-slate-900/60 bg-slate-900/20">
                  <h2 className="font-display font-black text-lg text-white flex items-center gap-1.5 mb-2">
                    <Upload className="text-purple-400" size={20} />
                    Social Media Dataset Manager
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed mb-6 font-sans">
                    Upload Twitter, Instagram, or custom scraping logs in CSV or JSON format. Columns like text, timestamps, engagement are auto detected.
                  </p>

                  <form onSubmit={handleDatasetUpload} className="flex flex-col sm:flex-row items-center gap-4 border border-dashed border-slate-800 p-6 rounded-2xl bg-slate-950/20">
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <input 
                        type="file" 
                        accept=".csv,.json"
                        onChange={(e) => setUploadedFile(e.target.files ? e.target.files[0] : null)}
                        className="hidden"
                        id="dataset-upload-input"
                      />
                      <label htmlFor="dataset-upload-input" className="cursor-pointer flex flex-col items-center gap-2">
                        <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-500/20 text-purple-400">
                          <FileText size={20} />
                        </div>
                        <span className="text-xs text-slate-300 font-bold">
                          {uploadedFile ? uploadedFile.name : "Select CSV / JSON File"}
                        </span>
                        <span className="text-[10px] text-slate-500">Max size 20MB. Automatically maps column schemas.</span>
                      </label>
                    </div>

                    <button 
                      type="submit"
                      disabled={!uploadedFile || uploadLoading}
                      className="btn-premium-glow bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold text-xs px-6 py-3 rounded-xl disabled:opacity-50"
                    >
                      {uploadLoading ? "Uploading & Validating..." : "Process Dataset"}
                    </button>
                  </form>
                </div>

                <div className="glass-card p-6 rounded-3xl border border-slate-900/60 bg-slate-900/20">
                  <h3 className="font-display font-black text-sm text-white mb-4">Active Database Datasets</h3>
                  <div className="flex flex-col gap-3">
                    {datasets.map((d: any, idx: number) => (
                      <div key={idx} className="p-4 bg-slate-950/40 border border-slate-900 rounded-2xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                            <Database size={16} />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">{d.filename}</h4>
                            <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                              <span>Rows: <strong className="text-slate-300">{d.row_count}</strong></span>
                              <span>•</span>
                              <span>Uploaded: <strong className="text-slate-300">{new Date(d.uploaded_at).toLocaleDateString()}</strong></span>
                            </div>
                          </div>
                        </div>

                        <button 
                          onClick={() => deleteDataset(d.id)}
                          className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-red-400 hover:border-red-500/20 transition-all"
                          title="Delete Dataset"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            )}

            {/* TAB 4: DATA INTEGRATIONS */}
            {activeTab === "integrations" && (
              <motion.div 
                key="integrations"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                {[
                  { name: "Twitter / X Sync", desc: "Sync real-time hashtags and mentions streams via streaming API.", status: "Active", icon: "🐦", type: "API" },
                  { name: "Reddit Analytics", desc: "Pull popular keyword spikes from subreddits like r/technology, r/investing.", status: "Active", icon: "🤖", type: "API" },
                  { name: "YouTube Keywords", desc: "Query top search terms and comment trends on trending video databases.", status: "Inactive", icon: "📺", type: "OAuth" },
                  { name: "Instagram Hashtags", desc: "Fetch media tagging frequencies and comment sentiment indices.", status: "Inactive", icon: "📸", type: "OAuth" },
                  { name: "TikTok Video API", desc: "Extract current audios and hashtag metadata growth coefficients.", status: "Inactive", icon: "🎵", type: "API" },
                  { name: "Facebook Page Sync", desc: "Sync engagement metrics and comment trends from connected pages.", status: "Inactive", icon: "👤", type: "OAuth" },
                  { name: "LinkedIn Pages Feed", desc: "Import professional keyword mentions and sector growth metrics.", status: "Inactive", icon: "💼", type: "API" },
                  { name: "RSS Feed Importer", desc: "Scrape tech blogs and news agencies dynamically at hour intervals.", status: "Active", icon: "📰", type: "Custom" }
                ].map((item: any, idx: number) => (
                  <div key={idx} className="glass-card p-5 rounded-3xl border border-slate-900/60 bg-slate-900/20 flex flex-col justify-between h-40">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl bg-slate-900/60 w-10 h-10 rounded-xl border border-slate-800 flex items-center justify-center shadow-lg">
                          {item.icon}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">{item.name}</h4>
                          <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block mt-0.5">{item.type} Connection</span>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        item.status === "Active" ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/20" : "bg-slate-950/60 text-slate-500 border-slate-800"
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-relaxed my-2">{item.desc}</p>
                    
                    <button className={`w-full py-2 rounded-xl text-[10px] font-bold border transition-colors ${
                      item.status === "Active" ? "bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-300" : "bg-purple-900/60 border-purple-500/20 hover:bg-purple-800 text-purple-200"
                    }`}>
                      {item.status === "Active" ? "Configure Settings" : "Connect Account"}
                    </button>
                  </div>
                ))}
              </motion.div>
            )}

            {/* TAB 5: ADMIN OPERATIONS */}
            {activeTab === "admin" && (
              <motion.div 
                key="admin"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="max-w-4xl mx-auto flex flex-col gap-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* System Health */}
                  <div className="glass-card p-5 rounded-3xl border border-slate-900/60 bg-slate-900/20">
                    <h3 className="font-display font-black text-xs text-white mb-4 flex items-center gap-1.5">
                      <Activity size={14} className="text-purple-400" />
                      Platform Health Statistics
                    </h3>

                    <div className="flex flex-col gap-3 text-xs">
                      {[
                        { label: "CPU Utilization", val: systemHealth?.cpu_usage || "18.2%", status: "healthy" },
                        { label: "Memory Allocated", val: systemHealth?.memory || "2.4 GB / 8.0 GB", status: "healthy" },
                        { label: "SQL Database Connection", val: systemHealth?.database || "healthy", status: "healthy" },
                        { label: "Redis Client Cache", val: systemHealth?.cache === "connected" ? "Connected" : "In-Memory Fallback Active", status: systemHealth?.cache === "connected" ? "healthy" : "warning" }
                      ].map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-950/40 border border-slate-900 rounded-xl">
                          <span className="text-slate-400 text-[10px]">{item.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[10px] text-white">{item.val}</span>
                            <span className={`w-1.5 h-1.5 rounded-full ${item.status === "healthy" ? "bg-green-500" : "bg-amber-500"}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ML Retraining triggers */}
                  <div className="glass-card p-5 rounded-3xl border border-slate-900/60 bg-slate-900/20 flex flex-col justify-between">
                    <div>
                      <h3 className="font-display font-black text-xs text-white mb-1 flex items-center gap-1.5">
                        <Brain size={14} className="text-purple-400" />
                        ML Pipeline Engine Tuning
                      </h3>
                      <p className="text-[9px] text-slate-500 leading-tight mb-4">Trigger model retraining manually over the database.</p>
                    </div>

                    {retrainMetrics ? (
                      <div className="p-3 bg-slate-950/50 border border-slate-900 rounded-xl text-[10px] font-mono mb-3">
                        <span className="text-emerald-400 font-bold block mb-1">✓ Training Successful!</span>
                        <span>RMSE: {retrainMetrics.rmse}</span><br />
                        <span>Accuracy: {retrainMetrics.accuracy * 100}%</span><br />
                        <span>Loss: {retrainMetrics.validation_loss}</span>
                      </div>
                    ) : null}

                    <button 
                      onClick={triggerRetraining}
                      disabled={isRetraining}
                      className="btn-premium-glow w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2"
                    >
                      <Play size={12} className={isRetraining ? "animate-spin" : ""} />
                      {isRetraining ? "Tuning random forest parameters..." : "Execute Complete Model Retraining"}
                    </button>
                  </div>

                </div>

                {/* API Key management */}
                <div className="glass-card p-6 rounded-3xl border border-slate-900/60 bg-slate-900/20">
                  <h3 className="font-display font-black text-sm text-white mb-2 flex items-center gap-1.5">
                    <Key size={16} className="text-purple-400" />
                    Secure API Key Management
                  </h3>
                  <p className="text-xs text-slate-400 mb-6 font-sans">Create access keys to expose endpoints like /api/trending or /api/analyze to third party systems.</p>

                  <div className="flex gap-2 mb-4">
                    <input 
                      type="text" 
                      placeholder="Label (e.g. Server Sync Key)"
                      value={newKeyLabel}
                      onChange={(e) => setNewKeyLabel(e.target.value)}
                      className="bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 flex-1"
                    />
                    <button 
                      onClick={generateApiKey}
                      className="bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-500/20 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1"
                    >
                      <Plus size={12} /> Key
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    {apiKeys.map((k: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl flex items-center justify-between text-xs font-mono">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-slate-300 font-bold text-[10px]">{k.label}</span>
                          <span className="text-[9px] text-slate-500">{k.key}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${k.is_active ? "bg-green-500" : "bg-slate-700"}`} />
                          <button 
                            onClick={() => toggleApiKey(k.id)}
                            className="bg-slate-900 border border-slate-800 hover:bg-slate-850 px-2 py-1 rounded text-[9px] font-bold text-slate-300"
                          >
                            {k.is_active ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Logs console */}
                <div className="glass-card p-5 rounded-3xl border border-slate-900/60 bg-slate-900/20">
                  <h3 className="font-display font-black text-xs text-white mb-2 flex items-center gap-1">
                    <FileText size={14} className="text-purple-400" />
                    System Log Console
                  </h3>
                  <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 h-48 overflow-y-auto font-mono text-[9px] text-slate-400 flex flex-col gap-1">
                    {logs.map((l: any, idx: number) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-slate-600">[{new Date(l.timestamp).toLocaleTimeString()}]</span>
                        <span className={l.level === "WARNING" ? "text-amber-500" : "text-purple-500"}>{l.level}</span>
                        <span className="text-slate-500 font-bold">{l.service}:</span>
                        <span className="text-slate-300">{l.message}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            )}

          </AnimatePresence>
          
        </main>
      </div>

      {/* 4. TOAST NOTIFICATION STACK */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2.5 z-50">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div 
              key={t.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className={`p-3 rounded-xl border shadow-xl flex items-center gap-2 text-xs font-semibold ${
                t.type === "success" ? "bg-emerald-950/80 border-emerald-500/30 text-emerald-200" :
                t.type === "warning" ? "bg-rose-950/80 border-rose-500/30 text-rose-200" :
                "bg-slate-900/80 border-slate-800 text-slate-200"
              }`}
            >
              <AlertCircle size={14} className={t.type === "success" ? "text-emerald-400" : t.type === "warning" ? "text-rose-400" : "text-purple-400"} />
              <span>{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 5. USER PROFILE & AUTHENTICATION MODAL */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-sm p-6 rounded-3xl border border-slate-800/80 bg-slate-900 relative"
            >
              <button 
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>

              {user ? (
                // View and Edit Profile Panel
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="text-5xl p-4 bg-purple-950/40 border border-purple-500/20 rounded-full w-20 h-20 flex items-center justify-center shadow-lg">
                    {user.avatar || "🤖"}
                  </div>
                  <div>
                    <h3 className="font-display font-black text-base text-white">{user.profile_name}</h3>
                    <span className="text-xs text-slate-500 font-mono">{user.email}</span>
                  </div>

                  <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 w-full text-left text-[11px] flex flex-col gap-2 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Security Token:</span>
                      <span className="text-purple-400 font-bold">Active</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Account Role:</span>
                      <span className="text-slate-300">Administrator</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">DB Status:</span>
                      <span className="text-emerald-400">Synced</span>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full mt-2">
                    <button 
                      onClick={() => {
                        setAuthMode("verify");
                        setAuthEmail(user.email);
                        setAuthError("");
                        setAuthSuccess("");
                      }}
                      disabled={user.is_verified}
                      className="flex-1 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-bold text-slate-300 disabled:opacity-50"
                    >
                      {user.is_verified ? "Verified Email" : "Verify Email"}
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="flex-1 py-2 bg-rose-900/60 border border-rose-500/20 hover:bg-rose-800 rounded-xl text-[10px] font-bold text-rose-200"
                    >
                      Logout Session
                    </button>
                  </div>
                </div>
              ) : (
                // Login / Signup / Reset Password flows
                <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
                  <div>
                    <h3 className="font-display font-black text-lg text-white">
                      {authMode === "login" ? "Welcome to TrendPulse" : 
                       authMode === "signup" ? "Create Administrator" : 
                       authMode === "forgot" ? "Retrieve Access Key" : "Verification Verification"}
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {authMode === "login" ? "Login to unlock ML model retraining and exports." : 
                       authMode === "signup" ? "Set up your admin credentials." : 
                       authMode === "forgot" ? "Enter your email to receive recovery parameters." : "Enter confirmation password."}
                    </p>
                  </div>

                  {authError && (
                    <div className="bg-rose-950/20 border border-rose-500/20 text-rose-300 p-2.5 rounded-xl text-[10px] font-semibold">
                      {authError}
                    </div>
                  )}

                  {authSuccess && (
                    <div className="bg-green-950/20 border border-green-500/20 text-green-300 p-2.5 rounded-xl text-[10px] font-semibold">
                      {authSuccess}
                    </div>
                  )}

                  {authMode === "signup" && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Profile Display Name</label>
                      <input 
                        type="text" 
                        required
                        placeholder="John Doe"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        className="bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Registered Email</label>
                    <input 
                      type="email" 
                      required
                      placeholder="admin@trendpulse.ai"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {authMode !== "forgot" && authMode !== "verify" && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Access Password</label>
                      <input 
                        type="password" 
                        required
                        placeholder="••••••••"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  )}

                  {authMode === "verify" && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Simulated Verification Code</label>
                      <input 
                        type="text" 
                        required
                        placeholder="ANY CODE WORKS"
                        className="bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  )}

                  <button 
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg mt-2"
                  >
                    {authMode === "login" ? "Authorize Session" : 
                     authMode === "signup" ? "Initialize Administrator" : 
                     authMode === "forgot" ? "Send Recovery Parameters" : "Verify Email Connection"}
                  </button>

                  <div className="flex items-center justify-between text-[9px] text-slate-500 mt-2 font-semibold">
                    {authMode === "login" ? (
                      <>
                        <button type="button" onClick={() => setAuthMode("signup")} className="hover:text-purple-400">Register Account</button>
                        <button type="button" onClick={() => setAuthMode("forgot")} className="hover:text-purple-400">Forgot Password?</button>
                      </>
                    ) : (
                      <button type="button" onClick={() => setAuthMode("login")} className="hover:text-purple-400 w-full text-center">Back to Login Portal</button>
                    )}
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
