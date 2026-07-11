import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  TrendingUp, Search, Brain, HelpCircle, Activity, Globe 
} from "lucide-react";
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";
import { motion } from "framer-motion";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const KeywordComparison: React.FC = () => {
  const { authToken } = useAuth();
  
  const [kw1, setKw1] = useState("AI");
  const [kw2, setKw2] = useState("ChatGPT");
  const [in1, setIn1] = useState("");
  const [in2, setIn2] = useState("");
  const [compareData, setCompareData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadComparison = async (k1: string, k2: string) => {
    setLoading(true);
    try {
      const headers: any = {};
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }
      const res = await fetch(`${BACKEND_URL}/api/compare?kw1=${k1}&kw2=${k2}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setCompareData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComparison(kw1, kw2);
  }, [kw1, kw2]);

  const handleCompareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (in1.trim() && in2.trim()) {
      setKw1(in1.trim());
      setKw2(in2.trim());
      setIn1("");
      setIn2("");
    }
  };

  // Combine history dates for dual-line charting
  const chartDataCombined = useMemo(() => {
    if (!compareData) return [];
    
    const h1 = compareData.analysis_1.history;
    const h2 = compareData.analysis_2.history;
    
    // Merge dates
    const dates = Array.from(new Set([
      ...h1.map((h: any) => h.date),
      ...h2.map((h: any) => h.date)
    ])).sort();
    
    return dates.map(d => {
      const p1 = h1.find((h: any) => h.date === d);
      const p2 = h2.find((h: any) => h.date === d);
      return {
        date: d,
        [kw1]: p1 ? p1.volume : null,
        [kw2]: p2 ? p2.volume : null
      };
    });
  }, [compareData, kw1, kw2]);

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER & FORM */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Trend Comparison</h1>
          <p className="text-xs text-slate-500">Examine how two search terms align in search velocity, sentiment distribution, and news impact.</p>
        </div>

        <form onSubmit={handleCompareSubmit} className="flex flex-wrap gap-2.5 w-full lg:w-auto z-10">
          <input
            type="text"
            required
            value={in1}
            onChange={(e) => setIn1(e.target.value)}
            placeholder="Keyword 1 (e.g. Apple)"
            className="px-3.5 py-2 text-xs bg-slate-950 border border-slate-900 rounded-xl focus:border-purple-500 focus:outline-none w-full sm:w-40"
          />
          <span className="self-center text-xs text-slate-500 font-bold px-1">VS</span>
          <input
            type="text"
            required
            value={in2}
            onChange={(e) => setIn2(e.target.value)}
            placeholder="Keyword 2 (e.g. Samsung)"
            className="px-3.5 py-2 text-xs bg-slate-950 border border-slate-900 rounded-xl focus:border-purple-500 focus:outline-none w-full sm:w-40"
          />
          <button 
            type="submit" 
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-500 hover:opacity-90 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-purple-500/10 cursor-pointer"
          >
            <TrendingUp size={12} />
            <span>Compare</span>
          </button>
        </form>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        compareData && (
          <div className="flex flex-col gap-6">
            {/* KPI STAT CARDS COMPARATIVE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Keyword 1 summary */}
              <div className="glass-card rounded-2xl p-5 border-l-4 border-l-purple-500 flex flex-col gap-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">PRIMARY TERM</span>
                <h3 className="text-lg font-extrabold text-slate-200">#{compareData.keyword_1}</h3>
                <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-slate-400">
                  <div className="flex flex-col p-2 bg-slate-900/40 rounded-xl">
                    <span>Mentions</span>
                    <span className="font-extrabold text-slate-200 text-sm mt-0.5">{compareData.analysis_1.total_mentions}</span>
                  </div>
                  <div className="flex flex-col p-2 bg-slate-900/40 rounded-xl">
                    <span>Engagement</span>
                    <span className="font-extrabold text-slate-200 text-sm mt-0.5">{compareData.analysis_1.engagement.likes + compareData.analysis_1.engagement.comments}</span>
                  </div>
                  <div className="flex flex-col p-2 bg-slate-900/40 rounded-xl">
                    <span>Positive</span>
                    <span className="font-extrabold text-emerald-400 text-sm mt-0.5">{compareData.analysis_1.sentiment.positive}%</span>
                  </div>
                </div>
              </div>

              {/* Keyword 2 summary */}
              <div className="glass-card rounded-2xl p-5 border-l-4 border-l-cyan-400 flex flex-col gap-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">COMPARED TERM</span>
                <h3 className="text-lg font-extrabold text-slate-200">#{compareData.keyword_2}</h3>
                <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-slate-400">
                  <div className="flex flex-col p-2 bg-slate-900/40 rounded-xl">
                    <span>Mentions</span>
                    <span className="font-extrabold text-slate-200 text-sm mt-0.5">{compareData.analysis_2.total_mentions}</span>
                  </div>
                  <div className="flex flex-col p-2 bg-slate-900/40 rounded-xl">
                    <span>Engagement</span>
                    <span className="font-extrabold text-slate-200 text-sm mt-0.5">{compareData.analysis_2.engagement.likes + compareData.analysis_2.engagement.comments}</span>
                  </div>
                  <div className="flex flex-col p-2 bg-slate-900/40 rounded-xl">
                    <span>Positive</span>
                    <span className="font-extrabold text-emerald-400 text-sm mt-0.5">{compareData.analysis_2.sentiment.positive}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* DUAL COMPARATIVE CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Dual Line Chart */}
              <div className="glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-4">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><Activity size={14} className="text-purple-400" /> Historical Volume Overlay</span>
                <div className="h-64 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartDataCombined} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }} />
                      <Legend />
                      <Line type="monotone" dataKey={kw1} stroke="#a855f7" strokeWidth={2.5} activeDot={{ r: 6 }} dot={false} />
                      <Line type="monotone" dataKey={kw2} stroke="#06b6d4" strokeWidth={2.5} activeDot={{ r: 6 }} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Chart comparing engagement */}
              <div className="glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-4">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><TrendingUp size={14} className="text-cyan-400" /> Engagement Breakdown Comparison</span>
                <div className="h-64 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Likes", [kw1]: compareData.analysis_1.engagement.likes, [kw2]: compareData.analysis_2.engagement.likes },
                        { name: "Comments", [kw1]: compareData.analysis_1.engagement.comments, [kw2]: compareData.analysis_2.engagement.comments },
                        { name: "Shares", [kw1]: compareData.analysis_1.engagement.shares, [kw2]: compareData.analysis_2.engagement.shares }
                      ]}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }} />
                      <Legend />
                      <Bar dataKey={kw1} fill="#a855f7" radius={[4, 4, 0, 0]} />
                      <Bar dataKey={kw2} fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* COMPARATIVE AI INSIGHT SUMMARY */}
            <div className="glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-4">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><Brain size={14} className="text-purple-400" /> Gemini AI Comparative Intelligence</span>
              <div className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl text-xs leading-relaxed text-slate-300">
                <div dangerouslySetInnerHTML={{ __html: compareData.ai_comparison.replace(/\n/g, "<br/>") }} />
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};
