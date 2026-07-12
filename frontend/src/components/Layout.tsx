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
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.style.backgroundColor = "#020617";
    } else {
      root.classList.remove("dark");
      root.style.backgroundColor = "#f8fafc";
    }
  }, [theme]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setNotifications(["Trend alert: AI sector up +18% this week"]);
    }, 12000);
    return () => clearTimeout(timer);
  }, []);

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/search", label: "Keyword Intelligence", icon: Search },
    { path: "/compare", label: "Trend Comparison", icon: TrendingUp },
    { path: "/datasets", label: "Dataset Manager", icon: Database },
    { path: "/query-bot", label: "Query Bot", icon: MessageSquare },
    { path: "/reports", label: "Reports", icon: FileText },
    { path: "/profile", label: "Profile", icon: UserIcon }
  ];

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const currentPath = location.pathname;

  // Safe avatar: use profile avatar if set, else default robot emoji via codepoint
  const displayAvatar = profile?.avatar || "";
  const displayName = profile?.profile_name || "";

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
      theme === "dark" ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    }`}>
      {/* TOP HEADER */}
      <header className={`h-16 px-4 sm:px-6 border-b flex items-center justify-between shrink-0 sticky top-0 z-50 backdrop-blur-md ${
        theme === "dark" ? "bg-slate-950/80 border-slate-900/60" : "bg-white/80 border-slate-200"
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-1.5 rounded-lg border transition-colors ${
              theme === "dark" ? "border-slate-800 hover:bg-slate-900" : "border-slate-200 hover:bg-slate-100"
            }`}
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>

          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <TrendingUp size={16} />
            </div>
            <span className="font-bold text-sm tracking-wider uppercase bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent hidden sm:block">
              TrendPulse AI
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={`p-2 rounded-xl border transition-all ${
              theme === "dark" ? "border-slate-800 hover:bg-slate-900 text-yellow-400" : "border-slate-200 hover:bg-slate-100 text-slate-600"
            }`}
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-xl border relative transition-all ${
                theme === "dark" ? "border-slate-800 hover:bg-slate-900" : "border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Bell size={15} />
              {notifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-purple-500 rounded-full" />
              )}
            </button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className={`absolute right-0 mt-2 w-72 rounded-2xl border p-4 shadow-xl backdrop-blur-lg z-50 ${
                    theme === "dark" ? "bg-slate-900/95 border-slate-800/80 text-slate-200" : "bg-white/95 border-slate-200 text-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800/50 pb-2 mb-3">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <Sparkles size={11} className="text-purple-400" /> Insights
                    </span>
                    <button onClick={() => setNotifications([])} className="text-[10px] text-slate-500 hover:text-slate-300">Clear</button>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 text-center">No new alerts</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {notifications.map((n, i) => (
                        <div key={i} className="text-[11px] p-2.5 bg-purple-950/20 border border-purple-500/10 rounded-xl leading-relaxed">
                          {n}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile — avatar + name only, no token */}
          <div className="flex items-center gap-2.5 pl-1">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold leading-tight">{displayName}</p>
              <p className="text-[10px] text-slate-500 leading-tight">{profile?.email}</p>
            </div>
            <Link to="/profile" className="h-9 w-9 rounded-xl bg-purple-950/30 border border-purple-500/20 flex items-center justify-center text-xl hover:border-purple-500/50 transition-all" title="Profile">
              {displayAvatar}
            </Link>
          </div>
        </div>
      </header>

      {/* BODY */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <aside className={`w-56 shrink-0 flex flex-col justify-between py-5 border-r transition-all duration-300 z-40 absolute lg:relative inset-y-0 ${
          sidebarOpen ? "left-0" : "-left-56 lg:left-0"
        } ${
          theme === "dark" ? "bg-slate-950/95 border-slate-900/60" : "bg-white/95 border-slate-200"
        }`}>
          <div className="flex flex-col gap-1 px-3">
            <span className="text-[9px] font-bold text-slate-600 tracking-widest px-2 uppercase mb-2">Workspace</span>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-medium transition-all ${
                    isActive
                      ? "bg-purple-950/30 text-purple-400 border border-purple-500/20"
                      : theme === "dark"
                        ? "text-slate-400 hover:bg-slate-900/50 hover:text-slate-200 border border-transparent"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
                  }`}
                >
                  <Icon size={15} className={isActive ? "text-purple-400" : "text-slate-500"} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="px-3">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-medium border transition-all ${
                theme === "dark"
                  ? "bg-slate-900 hover:bg-red-950/20 text-slate-500 hover:text-red-400 border-slate-800/60 hover:border-red-900/30"
                  : "bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 border-slate-200"
              }`}
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className={`flex-1 overflow-y-auto p-5 md:p-7 ${
          theme === "dark" ? "bg-slate-950" : "bg-slate-50"
        }`}>
          {children}
        </main>
      </div>
      {/* FOOTER */}
      <footer className={`shrink-0 border-t py-3 px-6 text-center text-[10px] font-medium tracking-wide transition-colors ${
        theme === "dark" ? "bg-slate-950/80 border-slate-900/60 text-slate-600" : "bg-white/80 border-slate-200 text-slate-400"
      }`}>
        &copy; 2026 TrendPulse AI Platform. Developed by <span className="text-purple-500 font-semibold">Sweta Maurya</span>. All Rights Reserved.
      </footer>
    </div>
  );
};


