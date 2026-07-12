import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  TrendingUp, Activity, Brain, BarChart2, Video,
  Newspaper, AlertCircle, ArrowRightLeft
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";

const BACKEND = import.meta.env.VITE_API_URL || "http://localhost:8000";

const PRESETS = [
  ["AI", "ChatGPT"],
  ["Bitcoin", "Ethereum"],
  ["Apple", "Samsung"],
  ["Tesla", "Ford"],
  ["OpenAI", "Google"]
];

function StatCell({ label, value, color = "text-slate-200" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex flex-col p-3 bg-slate-900/40 rounded-xl gap-1">
      <span className="text-[10px] text-slate-500">{label}</span>
      <span className={`font-extrabold text-sm mt-0.5 ${color}`}>{value}</span>
    </div>
  );
}

export const KeywordComparison: React.FC = () => {
  const { authToken } = useAuth();
  const [in1, setIn1] = useState("AI");
  const [in2, setIn2] = useState("ChatGPT");
  const [kw1, setKw1] = useState("");
  const [kw2, setKw2] = useState("");
  const [compareData, setCompareData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    const k1 = in1.trim(), k2 = in2.trim();
    if (!k1 || !k2) return;
    setKw1(k1); setKw2(k2);
    setLoading(true); setError(null); setCompareData(null);
    try {
      const headers: Record<string, string> = {};
      if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
      const res = await fetch(
        `${BACKEND}/api/compare/full?kw1=${encodeURIComponent(k1)}&kw2=${encodeURIComponent(k2)}`,
        { headers }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setCompareData(json);
    } catch (err: any) {
      setError(err.message || "Comparison failed");
    } finally {
      setLoading(false);
    }
  };

  // Derive chart data from real API response
  const a1 = compareData?.analysis_1;
  const a2 = compareData?.analysis_2;

  const lineData: any[] = [];
  if (a1 && a2) {
    const allDates = new Set([
      ...(a1.history ?? []).map((h: any) => h.date),
      ...(a2.history ?? []).map((h: any) => h.date)
    ]);
    const h1Map = Object.fromEntries((a1.history ?? []).map((h: any) => [h.date, h.volume]));
    const h2Map = Object.fromEntries((a2.history ?? []).map((h: any) => [h.date, h.volume]));
    [...allDates].sort().forEach(d => {
      lineData.push({ date: d, [kw1]: h1Map[d] ?? 0, [kw2]: h2Map[d] ?? 0 });
    });
  }

  const barData = a1 && a2 ? [
    { name: "Mentions",   [kw1]: a1.total_mentions,        [kw2]: a2.total_mentions },
    { name: "Likes",      [kw1]: a1.engagement?.likes ?? 0, [kw2]: a2.engagement?.likes ?? 0 },
    { name: "Comments",   [kw1]: a1.engagement?.comments ?? 0, [kw2]: a2.engagement?.comments ?? 0 },
    { name: "Shares",     [kw1]: a1.engagement?.shares ?? 0, [kw2]: a2.engagement?.shares ?? 0 }
  ] : [];

  const radarData = a1 && a2 ? [
    { metric: "Mentions",   [kw1]: Math.min(a1.total_mentions, 100),                         [kw2]: Math.min(a2.total_mentions, 100) },
    { metric: "Sentiment",  [kw1]: a1.sentiment?.positive ?? 0,                               [kw2]: a2.sentiment?.positive ?? 0 },
    { metric: "Engagement", [kw1]: Math.min(100, ((a1.engagement?.likes ?? 0) + (a1.engagement?.comments ?? 0)) / 10), [kw2]: Math.min(100, ((a2.engagement?.likes ?? 0) + (a2.engagement?.comments ?? 0)) / 10) },
    { metric: "News",       [kw1]: Math.min(100, (a1.news?.length ?? 0) * 10),                [kw2]: Math.min(100, (a2.news?.length ?? 0) * 10) },
    { metric: "YouTube",    [kw1]: Math.min(100, (a1.youtube?.length ?? 0) * 20),             [kw2]: Math.min(100, (a2.youtube?.length ?? 0) * 20) }
  ] : [];

  const tooltipStyle = { backgroundColor: "#0f172a", borderColor: "#1e293b", fontSize: 11 };

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Trend Comparison
        </h1>
        <p className="text-xs text-slate-500 mt-1">Compare two keywords using real-time NewsAPI, Video, and Gemini AI data.</p>
      </div>

      {/* FORM */}
      <div className="glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-4">
        <form onSubmit={handleCompare} className="flex flex-wrap items-center gap-3">
          <input type="text" required value={in1} onChange={e => setIn1(e.target.value)}
            placeholder="Keyword 1 (e.g. Apple)"
            className="px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:border-purple-500 focus:outline-none w-full sm:w-44 text-slate-200" />
          <span className="self-center text-sm text-slate-500 font-black px-1">VS</span>
          <input type="text" required value={in2} onChange={e => setIn2(e.target.value)}
            placeholder="Keyword 2 (e.g. Samsung)"
            className="px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:border-cyan-500 focus:outline-none w-full sm:w-44 text-slate-200" />
          <button type="submit"
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-500 hover:opacity-90 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer">
            <ArrowRightLeft size={13} /> Compare
          </button>
        </form>

        {/* Preset comparisons */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-900/60">
          <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider self-center">Quick:</span>
          {PRESETS.map(([p1, p2]) => (
            <button key={`${p1}-${p2}`} type="button"
              onClick={() => { setIn1(p1); setIn2(p2); }}
              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 cursor-pointer transition-all">
              {p1} vs {p2}
            </button>
          ))}
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-500">
          <div className="h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs">Fetching live data for <b className="text-purple-400">#{kw1}</b> and <b className="text-cyan-400">#{kw2}</b>…</p>
        </div>
      )}

      {/* ERROR */}
      {!loading && error && (
        <div className="glass-card rounded-3xl p-8 border border-red-900/30 flex flex-col items-center gap-3 text-center">
          <AlertCircle size={28} className="text-red-400" />
          <p className="text-sm font-bold text-red-400">Comparison failed</p>
          <p className="text-xs text-slate-500">{error}</p>
        </div>
      )}

      {/* RESULTS */}
      {!loading && !error && compareData && (
        <div className="flex flex-col gap-6">
          {/* STAT CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: "PRIMARY", kw: compareData.keyword_1, a: a1, color: "border-l-purple-500", badge: "text-purple-400" },
              { label: "COMPARED", kw: compareData.keyword_2, a: a2, color: "border-l-cyan-400",   badge: "text-cyan-400" }
            ].map(({ label, kw, a, color, badge }) => (
              <div key={kw} className={`glass-card rounded-2xl p-5 border-l-4 ${color} flex flex-col gap-3`}>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{label} TERM</span>
                <h3 className={`text-lg font-extrabold ${badge}`}>#{kw}</h3>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <StatCell label="Mentions"   value={(a?.total_mentions ?? 0).toLocaleString()} />
                  <StatCell label="Engagement" value={((a?.engagement?.likes ?? 0) + (a?.engagement?.comments ?? 0)).toLocaleString()} />
                  <StatCell label="Positive %"  value={`${a?.sentiment?.positive ?? 0}%`} color="text-emerald-400" />
                  <StatCell label="News"        value={a?.news?.length ?? 0} />
                  <StatCell label="YouTube"     value={a?.youtube?.length ?? 0} />
                  <StatCell label="Neg %"       value={`${a?.sentiment?.negative ?? 0}%`} color="text-red-400" />
                </div>
              </div>
            ))}
          </div>

          {/* LINE + BAR CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-4">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Activity size={14} className="text-purple-400" /> Volume Trend Overlay
              </span>
              {lineData.length === 0 ? (
                <p className="text-xs text-slate-600 italic py-8 text-center">No historical data available</p>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 9 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 9 }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }} />
                      <Line type="monotone" dataKey={kw1} stroke="#a855f7" strokeWidth={2.5} dot={false} />
                      <Line type="monotone" dataKey={kw2} stroke="#06b6d4" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-4">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <BarChart2 size={14} className="text-cyan-400" /> Engagement Breakdown
              </span>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey={kw1} fill="#a855f7" radius={[4,4,0,0]} />
                    <Bar dataKey={kw2} fill="#06b6d4" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* RADAR CHART */}
          <div className="glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp size={14} className="text-emerald-400" /> Multi-Dimensional Radar Comparison
            </span>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#1e293b" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: "#64748b" }} />
                  <Radar name={kw1} dataKey={kw1} stroke="#a855f7" fill="#a855f7" fillOpacity={0.2} strokeWidth={2} />
                  <Radar name={kw2} dataKey={kw2} stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} strokeWidth={2} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GEMINI AI COMPARISON */}
          {compareData.ai_comparison && (
            <div className="glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-4">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Brain size={14} className="text-purple-400" /> Gemini AI Comparative Intelligence
              </span>
              <div className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl text-xs leading-relaxed text-slate-300">
                <div dangerouslySetInnerHTML={{ __html: compareData.ai_comparison.replace(/\n/g, "<br/>") }} />
              </div>
            </div>
          )}

          {/* NEWS + YOUTUBE side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[
              { kw: compareData.keyword_1, a: a1, accentColor: "text-purple-400", borderColor: "border-purple-500/20" },
              { kw: compareData.keyword_2, a: a2, accentColor: "text-cyan-400",   borderColor: "border-cyan-500/20" }
            ].map(({ kw, a, accentColor, borderColor }) => (
              <div key={kw} className={`glass-card rounded-3xl p-6 border ${borderColor} flex flex-col gap-4`}>
                <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${accentColor}`}>
                  <Newspaper size={14} /> #{kw} — Top News
                </span>
                {(a?.news ?? []).length === 0 ? (
                  <p className="text-xs text-slate-600 italic">No news found</p>
                ) : (a.news ?? []).slice(0, 3).map((art: any, i: number) => (
                  <a key={i} href={art.url} target="_blank" rel="noopener noreferrer"
                    className="p-3 bg-slate-900/40 hover:bg-slate-900 border border-slate-800/40 rounded-2xl text-xs transition-colors line-clamp-2 text-slate-300">
                    {art.title}
                  </a>
                ))}

                <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${accentColor} border-t border-slate-900/60 pt-3`}>
                  <Video size={14} /> #{kw} — Top Videos
                </span>
                {(a?.youtube ?? []).length === 0 ? (
                  <p className="text-xs text-slate-600 italic">No videos found</p>
                ) : (a.youtube ?? []).slice(0, 2).map((v: any, i: number) => (
                  <a key={i} href={`https://youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer"
                    className="flex gap-3 p-3 bg-slate-900/40 hover:bg-slate-900 border border-slate-800/40 rounded-2xl text-xs transition-colors">
                    <img src={v.thumbnail} alt="" className="h-10 w-16 object-cover rounded-lg shrink-0" onError={e => { (e.target as HTMLImageElement).style.display="none"; }} />
                    <span className="text-slate-300 line-clamp-2 text-[11px]">{v.title}</span>
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


