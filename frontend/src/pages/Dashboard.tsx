import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp, Users, Activity, BarChart2, Search, RefreshCw,
  Globe, Database, PieChart as PieIcon, Brain, Newspaper,
  Video, AlertCircle, Hash
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell
} from "recharts";
import { motion } from "framer-motion";

const BACKEND = import.meta.env.VITE_API_URL || "http://localhost:8000";
const PIE_COLORS = ["#10b981", "#ef4444", "#64748b"];

const PRESET_KEYWORDS = ["AI", "Bitcoin", "Tesla", "Virat Kohli", "Apple", "OpenAI"];

function EmptyState({ keyword }: { keyword: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <AlertCircle size={36} className="text-slate-600" />
      <p className="text-sm font-bold text-slate-400">No live data available for <span className="text-purple-400">#{keyword}</span></p>
      <p className="text-xs text-slate-600 max-w-xs">NewsAPI, Video, and Gemini returned no results. Try a different keyword.</p>
    </div>
  );
}

export const Dashboard: React.FC = () => {
  const { authToken } = useAuth();
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState("AI");
  const [inputKw, setInputKw] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [datasetsCount, setDatasetsCount] = useState(0);

  const fetchLive = useCallback(async (kw: string) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const headers: Record<string, string> = {};
      if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
      const res = await fetch(`${BACKEND}/api/dashboard/live?keyword=${encodeURIComponent(kw)}`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e: any) {
      setError(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  const fetchUserMeta = useCallback(async () => {
    if (!authToken) return;
    try {
      const [hRes, dsRes] = await Promise.all([
        fetch(`${BACKEND}/api/history/recent`, { headers: { Authorization: `Bearer ${authToken}` } }),
        fetch(`${BACKEND}/api/datasets`, { headers: { Authorization: `Bearer ${authToken}` } })
      ]);
      if (hRes.ok) setRecentSearches(await hRes.json());
      if (dsRes.ok) { const d = await dsRes.json(); setDatasetsCount(d.length); }
    } catch {}
  }, [authToken]);

  useEffect(() => { fetchLive(keyword); fetchUserMeta(); }, [keyword, fetchLive, fetchUserMeta]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const kw = inputKw.trim();
    if (kw) { setKeyword(kw); setInputKw(""); }
  };

  const kpis = data?.kpis ?? {};
  const history: any[] = data?.history ?? [];
  const hashtags: any[] = data?.top_hashtags ?? [];
  const heatmap: any[] = data?.heatmap ?? [];
  const newsItems: any[] = data?.news ?? [];
  const ytItems: any[] = data?.youtube ?? [];
  const aiInsights = data?.ai_insights ?? {};

  const sentimentData = [
    { name: "Positive", value: kpis.sentiment?.positive ?? 0 },
    { name: "Negative", value: kpis.sentiment?.negative ?? 0 },
    { name: "Neutral",  value: kpis.sentiment?.neutral  ?? 0 }
  ];

  const isEmpty = !loading && !error && data && kpis.total_mentions === 0 && newsItems.length === 0 && ytItems.length === 0;

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER + SEARCH */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Live stats from NewsAPI · YouTube · Gemini AI. Changes with every keyword.</p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text" value={inputKw} onChange={e => setInputKw(e.target.value)}
            placeholder="Enter keyword…"
            className="px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:border-purple-500 focus:outline-none w-40 sm:w-52 text-slate-200"
          />
          <button type="submit"
            className="px-3 py-2 bg-purple-900/60 hover:bg-purple-800 border border-purple-500/20 text-purple-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors">
            <Search size={13} /> Go
          </button>
          <button type="button" onClick={() => fetchLive(keyword)} disabled={loading}
            className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-slate-200 cursor-pointer disabled:opacity-50 transition-colors">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </form>
      </div>

      {/* KEYWORD PRESETS */}
      <div className="flex flex-wrap gap-2">
        {PRESET_KEYWORDS.map(kw => (
          <button key={kw} onClick={() => setKeyword(kw)}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold border cursor-pointer transition-all ${
              keyword === kw
                ? "bg-purple-900/60 border-purple-500/40 text-purple-300"
                : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-300"
            }`}>
            #{kw}
          </button>
        ))}
      </div>

      {/* ACTIVE KEYWORD BADGE */}
      {data && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-purple-950/20 border border-purple-500/10 rounded-2xl w-fit">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-slate-300">Live data for <span className="text-purple-400">#{data.keyword}</span></span>
          <span className="text-[10px] text-slate-600 ml-2">cached at {data.cached_at ? new Date(data.cached_at).toLocaleTimeString() : "—"}</span>
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-500">
          <div className="h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs">Fetching live data for <span className="text-purple-400 font-bold">#{keyword}</span> from APIs…</p>
        </div>
      )}

      {/* ERROR */}
      {!loading && error && (
        <div className="glass-card rounded-3xl p-8 border border-red-900/30 flex flex-col items-center gap-3 text-center">
          <AlertCircle size={28} className="text-red-400" />
          <p className="text-sm font-bold text-red-400">Live data fetch failed</p>
          <p className="text-xs text-slate-500">{error}</p>
          <button onClick={() => fetchLive(keyword)}
            className="mt-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold hover:bg-slate-800 cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* EMPTY STATE */}
      {isEmpty && <EmptyState keyword={keyword} />}

      {/* DATA PANELS */}
      {!loading && !error && data && !isEmpty && (
        <>
          {/* KPI CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Trend Strength",    value: `${kpis.trend_strength ?? 0}%`,                   sub: `${kpis.news_count ?? 0} news + ${kpis.youtube_count ?? 0} videos`,     icon: Activity,    color: "text-purple-400" },
              { label: "Total Mentions",    value: (kpis.total_mentions ?? 0).toLocaleString(),       sub: "News + YouTube results",                                                 icon: Users,       color: "text-cyan-400" },
              { label: "Total Engagement",  value: (kpis.total_engagement ?? 0).toLocaleString(),     sub: "Views + Likes + Comments",                                               icon: TrendingUp,  color: "text-emerald-400" },
              { label: "Growth Rate",       value: `${kpis.growth_rate ?? 0}%`,                       sub: "Based on publish frequency",                                             icon: BarChart2,   color: "text-pink-400" }
            ].map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="glass-card rounded-2xl p-5 border border-slate-900/60 flex flex-col justify-between gap-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">{kpi.label}</p>
                      <p className="text-xl font-black mt-1">{kpi.value}</p>
                      <p className="text-[10px] text-slate-600 mt-0.5">{kpi.sub}</p>
                    </div>
                    <div className={`h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center ${kpi.color}`}>
                      <Icon size={18} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trend Volume */}
            <div className="lg:col-span-2 glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-4">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Activity size={14} className="text-cyan-400" /> Trend Volume Over Time
              </span>
              {history.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-xs text-slate-600 italic">No historical data for this keyword</div>
              ) : (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradVol" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 9 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 9 }} />
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", fontSize: 11 }} />
                      <Area type="monotone" dataKey="volume" stroke="#a855f7" fill="url(#gradVol)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Sentiment Pie */}
            <div className="glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-4">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <PieIcon size={14} className="text-purple-400" /> Sentiment Distribution
              </span>
              {sentimentData.every(s => s.value === 0) ? (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-600 italic">No sentiment data</div>
              ) : (
                <div className="flex flex-col items-center gap-3 flex-1 justify-center">
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                        {sentimentData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex gap-4 text-[10px] justify-center">
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />Pos ({kpis.sentiment?.positive ?? 0}%)</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" />Neg ({kpis.sentiment?.negative ?? 0}%)</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-500" />Neu ({kpis.sentiment?.neutral ?? 0}%)</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* HASHTAGS + HEATMAP + WORKSPACE */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Source Intensity */}
            <div className="glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-4">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Globe size={14} className="text-purple-400" /> Source Intensity
              </span>
              {heatmap.length === 0 ? (
                <p className="text-xs text-slate-600 italic py-4 text-center">No source data</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  {heatmap.map((h: any, i: number) => {
                    const bg = h.intensity > 70 ? "bg-purple-700/50 text-white border-purple-500/40"
                             : h.intensity > 40 ? "bg-purple-900/40 text-purple-300 border-purple-500/20"
                             : "bg-purple-950/20 text-purple-400 border-purple-500/10";
                    return (
                      <div key={i} className={`p-3 rounded-xl flex flex-col gap-1 border ${bg}`}>
                        <span className="font-bold truncate text-[9px]">{h.category}</span>
                        <span className="font-mono">{h.intensity}%</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Trending Hashtags */}
            <div className="glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-4">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Hash size={14} className="text-cyan-400" /> Trending Keywords
              </span>
              {hashtags.length === 0 ? (
                <p className="text-xs text-slate-600 italic py-4 text-center">No trending keywords found</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {hashtags.map((tag: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-900/40 last:border-0">
                      <span className="font-bold text-slate-300">{tag.tag}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500">{tag.count} results</span>
                        <span className="text-emerald-400 font-bold">+{tag.growth}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Workspace Status */}
            <div className="glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-4">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Database size={14} className="text-emerald-400" /> Workspace Status
              </span>
              <div className="flex flex-col gap-3">
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold">Uploaded Datasets</p>
                    <p className="text-[10px] text-slate-500">Combined with live API data</p>
                  </div>
                  <span className="text-xl font-black text-purple-400">{datasetsCount}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Recent Searches</span>
                  {recentSearches.length === 0 ? (
                    <p className="text-[11px] text-slate-600 italic">No history yet.</p>
                  ) : (
                    recentSearches.slice(0, 4).map((s, i) => (
                      <button key={i} onClick={() => setKeyword(s.keyword)}
                        className="text-[11px] px-3 py-2 bg-slate-900/60 rounded-xl flex justify-between hover:bg-slate-900 cursor-pointer transition-colors">
                        <span className="font-bold text-purple-400">#{s.keyword}</span>
                        <span className="text-slate-500">{new Date(s.created_at).toLocaleDateString()}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* AI INSIGHTS */}
          {aiInsights.executive_summary && (
            <div className="glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-4">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Brain size={14} className="text-purple-400" /> Gemini AI Insights for #{keyword}
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                {[
                  { title: "Executive Summary",   key: "executive_summary" },
                  { title: "Sentiment Analysis",  key: "sentiment_summary" },
                  { title: "Business Insights",   key: "business_insights" },
                  { title: "Future Prediction",   key: "future_prediction" }
                ].map(s => (
                  aiInsights[s.key] ? (
                    <div key={s.key} className="p-4 bg-slate-900/30 rounded-2xl flex flex-col gap-2">
                      <span className="font-bold text-slate-200">{s.title}</span>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{aiInsights[s.key]}</p>
                    </div>
                  ) : null
                ))}
                {aiInsights.content_suggestions?.length > 0 && (
                  <div className="lg:col-span-2 p-4 bg-slate-900/30 rounded-2xl">
                    <span className="font-bold text-slate-200 text-xs">Content Strategy</span>
                    <ul className="mt-2 list-disc pl-4 text-[11px] text-slate-400 space-y-1">
                      {aiInsights.content_suggestions.slice(0, 4).map((s: string, i: number) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RECENT NEWS + YOUTUBE */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-4">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Newspaper size={14} className="text-purple-400" /> Latest News
              </span>
              {newsItems.length === 0 ? (
                <p className="text-xs text-slate-600 italic py-4 text-center">No news articles found for #{keyword}</p>
              ) : newsItems.map((a: any, i: number) => (
                <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                  className="flex gap-3 p-3 bg-slate-900/40 hover:bg-slate-900 border border-slate-800/40 rounded-2xl text-xs transition-colors">
                  {a.urlToImage && <img src={a.urlToImage} alt="" className="h-12 w-12 object-cover rounded-lg shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="font-bold text-slate-200 line-clamp-2 text-[11px]">{a.title}</span>
                    <span className="text-[10px] text-purple-400">{a.source}</span>
                  </div>
                </a>
              ))}
            </div>

            <div className="glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-4">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Video size={14} className="text-red-400" /> YouTube Videos
              </span>
              {ytItems.length === 0 ? (
                <p className="text-xs text-slate-600 italic py-4 text-center">No YouTube videos found for #{keyword}</p>
              ) : ytItems.map((v: any, i: number) => (
                <a key={i} href={`https://youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer"
                  className="flex gap-3 p-3 bg-slate-900/40 hover:bg-slate-900 border border-slate-800/40 rounded-2xl text-xs transition-colors">
                  <img src={v.thumbnail} alt="" className="h-12 w-20 object-cover rounded-lg shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="font-bold text-slate-200 line-clamp-2 text-[11px]">{v.title}</span>
                    <span className="text-[10px] text-slate-500">{(v.views ?? 0).toLocaleString()} views · {(v.likes ?? 0).toLocaleString()} likes</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

