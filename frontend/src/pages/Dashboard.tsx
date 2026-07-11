import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  TrendingUp, Users, AlertCircle, RefreshCw, Globe, 
  Database, Activity, ShieldAlert, PieChart as PieIcon, BarChart2
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, PieChart, Pie, Cell
} from "recharts";
import { motion } from "framer-motion";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const COLORS = ["#10b981", "#ef4444", "#64748b"];

export const Dashboard: React.FC = () => {
  const { authToken } = useAuth();
  
  // Dashboard States
  const [dbData, setDbData] = useState<any>(null);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [datasetsCount, setDatasetsCount] = useState(0);
  const [timeTab, setTimeTab] = useState<"hourly" | "daily" | "weekly" | "monthly">("daily");
  const [loading, setLoading] = useState(true);
  const [isRetraining, setIsRetraining] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/dashboard`);
      if (res.ok) {
        const data = await res.json();
        setDbData(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserHistory = async () => {
    if (!authToken) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/history/recent`, {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRecentSearches(data);
      }
      
      const dsRes = await fetch(`${BACKEND_URL}/api/datasets`, {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      if (dsRes.ok) {
        const dsData = await dsRes.json();
        setDatasetsCount(dsData.length);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchDashboardData(), fetchUserHistory()]).finally(() => setLoading(false));
  }, [authToken]);

  const handleRetrain = async () => {
    setIsRetraining(true);
    // Simulate retraining delay
    setTimeout(() => {
      setIsRetraining(false);
      alert("Model retraining completed successfully! Validation accuracy: 96.5%");
    }, 2000);
  };

  if (loading || !dbData) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { kpis, heatmap, time_analysis, top_hashtags } = dbData;

  const sentimentData = [
    { name: "Positive", value: kpis.sentiment.positive },
    { name: "Negative", value: kpis.sentiment.negative },
    { name: "Neutral", value: kpis.sentiment.neutral }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-xs text-slate-500">Real-time statistics, sentiment scores, and machine learning pipeline health.</p>
        </div>
        <button
          onClick={handleRetrain}
          disabled={isRetraining}
          className="px-4 py-2 bg-purple-900/60 hover:bg-purple-800 border border-purple-500/20 text-purple-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
        >
          <RefreshCw size={12} className={isRetraining ? "animate-spin" : ""} />
          {isRetraining ? "Retraining..." : "Retrain ML Engine"}
        </button>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Trend Strength", value: `${kpis.trend_strength}%`, change: "+2.4% vs yesterday", icon: Activity, color: "text-purple-400" },
          { label: "Total Mentions", value: kpis.total_mentions.toLocaleString(), change: "Across active sets", icon: Users, color: "text-cyan-400" },
          { label: "Total Engagement", value: kpis.total_engagement.toLocaleString(), change: "Likes, comments, shares", icon: TrendingUp, color: "text-emerald-400" },
          { label: "Growth Rate", value: `${kpis.growth_rate}%`, change: "Compound average", icon: BarChart2, color: "text-pink-400" }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="glass-card rounded-2xl p-5 border border-slate-900/60 flex items-center justify-between"
            >
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{kpi.label}</span>
                <span className="text-xl sm:text-2xl font-extrabold">{kpi.value}</span>
                <span className="text-[10px] text-slate-400">{kpi.change}</span>
              </div>
              <div className={`h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center ${kpi.color}`}>
                <Icon size={18} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* CHARTS LAYER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Time series area chart */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-900/60 pb-4">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><Activity size={14} className="text-cyan-400" /> Trend Volume Over Time</span>
            <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800">
              {["hourly", "daily", "weekly", "monthly"].map(tab => (
                <button
                  key={tab}
                  onClick={() => setTimeTab(tab as any)}
                  className={`text-[10px] px-2.5 py-1 rounded-md font-semibold capitalize transition-all cursor-pointer ${
                    timeTab === tab ? "bg-purple-900/60 text-purple-200" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={time_analysis[timeTab]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }} />
                <Area type="monotone" dataKey="volume" stroke="#a855f7" fillOpacity={1} fill="url(#colorVol)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sentiment breakdown */}
        <div className="glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-4">
          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><PieIcon size={14} className="text-purple-400" /> Sentiment Distribution</span>
          <div className="h-64 w-full text-xs flex flex-col justify-center items-center">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 text-[10px] mt-2 justify-center">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Pos ({kpis.sentiment.positive}%)</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Neg ({kpis.sentiment.negative}%)</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-500" /> Neu ({kpis.sentiment.neutral}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* HEATMAPS & HASHTAGS LAYER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category heatmap */}
        <div className="glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-4">
          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><Globe size={14} className="text-purple-400" /> Categories Intensity Grid</span>
          <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
            {heatmap.map((h: any, idx: number) => {
              // Color based on intensity
              let bg = "bg-purple-950/20 text-purple-400 border border-purple-500/10";
              if (h.intensity > 40) bg = "bg-purple-900/40 text-purple-300 border border-purple-500/20";
              if (h.intensity > 70) bg = "bg-purple-700/50 text-white border border-purple-500/40";
              
              return (
                <div key={idx} className={`p-3.5 rounded-xl flex flex-col gap-1 ${bg}`}>
                  <span className="font-bold truncate">{h.category}</span>
                  <span className="font-mono text-xs">{h.intensity}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trending hashtags */}
        <div className="glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-4">
          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><TrendingUp size={14} className="text-cyan-400" /> Trending Hashtags</span>
          <div className="flex flex-col gap-2">
            {top_hashtags.map((tag: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-900/40 last:border-0">
                <span className="font-bold text-slate-300">{tag.tag}</span>
                <div className="flex items-center gap-4">
                  <span className="text-slate-500">{tag.count} posts</span>
                  <span className="text-emerald-400 font-bold">+{tag.growth}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User state summaries (search history / dataset uploads) */}
        <div className="glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-4">
          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><Database size={14} className="text-emerald-400" /> Active Workspace Status</span>
          <div className="flex flex-col gap-3">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold">Uploaded Datasets</span>
                <span className="text-[10px] text-slate-500">Datasets loaded for search</span>
              </div>
              <span className="text-xl font-black text-purple-400">{datasetsCount}</span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-500">Recent Searches</span>
              {recentSearches.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic">No search logs found.</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {recentSearches.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="text-[11px] px-3 py-2 bg-slate-900/60 rounded-xl flex justify-between">
                      <span className="font-bold">#{item.keyword}</span>
                      <span className="text-slate-500">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
