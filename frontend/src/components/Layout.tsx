import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  TrendingUp, LayoutDashboard, Search, Database, MessageSquare, 
  FileText, User as UserIcon, LogOut, Menu, X, Sun, Moon, Sparkles, Bell
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // Add dynamic theme class
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.style.backgroundColor = "#020617";
    } else {
      root.classList.remove("dark");
      root.style.backgroundColor = "#f8fafc";
    }
  }, [theme]);

  // Simulate alerts / smart push notifications
  useEffect(() => {
    const timer = setTimeout(() => {
      setNotifications(prev => [
        "AI: Virality explosion detected for #Bitcoin (+42% in 2h)",
        ...prev
      ]);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  const navItems = [
    { path: "/dashboard", label: "Analytics Dashboard", icon: LayoutDashboard },
    { path: "/search", label: "Keyword Intelligence", icon: Search },
    { path: "/compare", label: "Trend Comparison", icon: TrendingUp },
    { path: "/datasets", label: "CSV Dataset Upload", icon: Database },
    { path: "/query-bot", label: "Query Bot", icon: MessageSquare },
    { path: "/reports", label: "Generated Reports", icon: FileText },
    { path: "/profile", label: "Profile Settings", icon: UserIcon }
  ];

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const currentPath = location.pathname;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
      theme === "dark" ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    }`}>
      {/* 1. TOP HEADER BAR */}
      <header className={`h-16 px-6 border-b flex items-center justify-between shrink-0 sticky top-0 z-50 backdrop-blur-md ${
        theme === "dark" 
          ? "bg-slate-950/70 border-slate-900/60" 
          : "bg-white/70 border-slate-200"
      }`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-1.5 rounded-lg border lg:hidden transition-colors ${
              theme === "dark" ? "border-slate-800 hover:bg-slate-900" : "border-slate-200 hover:bg-slate-100"
            }`}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <TrendingUp size={18} className="animate-pulse" />
            </div>
            <span className="font-bold text-sm tracking-wider uppercase bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              TrendPulse AI
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={`p-2 rounded-xl border transition-all duration-300 ${
              theme === "dark" 
                ? "border-slate-800 hover:bg-slate-900 text-yellow-400" 
                : "border-slate-200 hover:bg-slate-100 text-slate-700"
            }`}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-xl border transition-all relative ${
                theme === "dark" ? "border-slate-800 hover:bg-slate-900" : "border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Bell size={16} />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-purple-500 rounded-full animate-pulse" />
              )}
            </button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={`absolute right-0 mt-3 w-80 rounded-2xl border p-4 shadow-xl backdrop-blur-lg z-50 ${
                    theme === "dark" 
                      ? "bg-slate-900/95 border-slate-800/80 text-slate-200" 
                      : "bg-white/95 border-slate-200 text-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between border-b pb-2 mb-2">
                    <span className="text-xs font-bold flex items-center gap-1"><Sparkles size={12} className="text-purple-400" /> Platform Insights</span>
                    <button onClick={() => setNotifications([])} className="text-[10px] text-slate-500 hover:underline">Clear all</button>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">No new notifications</p>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                      {notifications.map((notif, index) => (
                        <div key={index} className="text-[11px] p-2 bg-purple-950/20 border border-purple-500/10 rounded-lg">
                          {notif}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold">{profile?.profile_name || "User"}</p>
              <p className="text-[10px] text-slate-500">{profile?.email || "user@trendpulse.ai"}</p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-purple-950 border border-purple-500/20 flex items-center justify-center text-lg">
              {profile?.avatar || "??"}
            </div>
          </div>
        </div>
      </header>

      {/* 2. BODY LAYOUT PANELS */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar Nav */}
        <aside className={`w-64 shrink-0 flex flex-col justify-between py-6 border-r transition-all duration-300 z-40 absolute lg:relative inset-y-0 ${
          sidebarOpen ? "left-0" : "-left-64 lg:left-0"
        } ${
          theme === "dark" 
            ? "bg-slate-950/95 border-slate-900/60" 
            : "bg-white/95 border-slate-200"
        }`}>
          <div className="flex flex-col gap-1.5 px-4">
            <span className="text-[10px] font-bold text-slate-500 tracking-widest px-3 uppercase mb-2">Workspace</span>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs transition-all duration-200 ${
                    isActive 
                      ? "bg-purple-950/30 text-purple-400 border border-purple-500/25 font-bold" 
                      : theme === "dark" 
                        ? "text-slate-400 hover:bg-slate-900/30 hover:text-white border border-transparent" 
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
                  }`}
                >
                  <Icon size={16} className={isActive ? "text-purple-400" : "text-slate-400"} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="px-4">
            <button 
              onClick={handleLogout}
              className={`w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-xs font-semibold border transition-all ${
                theme === "dark" 
                  ? "bg-slate-900 hover:bg-red-950/20 text-slate-400 hover:text-red-400 border-slate-800/80 hover:border-red-900/30" 
                  : "bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border-slate-200 hover:border-red-100"
              }`}
            >
              <LogOut size={14} />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* Content Container */}
        <main className={`flex-1 overflow-y-auto p-6 md:p-8 transition-colors duration-300 ${
          theme === "dark" ? "bg-slate-950" : "bg-slate-50"
        }`}>
          {children}
        </main>
      </div>
    </div>
  );
};

