import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  Search, Brain, Heart, MessageSquare, Share2, 
  Globe, Video, Calendar, Activity, FileText
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip
} from "recharts";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const KeywordSearch: React.FC = () => {
  const { authToken } = useAuth();
  
  const [keyword, setKeyword] = useState("AI");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchData, setSearchData] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isSavingReport, setIsSavingReport] = useState(false);

  // Suggestions Fetch
  useEffect(() => {
    if (query.trim().length < 1) {
      setSuggestions([]);
      return;
    }
    fetch(`${BACKEND_URL}/api/suggestions?q=${query}`)
      .then(res => res.json())
      .then(data => setSuggestions(data))
      .catch(() => {});
  }, [query]);

  const loadAnalysis = async (kw: string) => {
    setLoading(true);
    try {
      const headers: any = {};
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      // Concurrently load main analytics + forecast
      const [resAnalyze, resForecast] = await Promise.all([
        fetch(`${BACKEND_URL}/api/analyze?keyword=${kw}`, { headers }),
        fetch(`${BACKEND_URL}/api/forecast?keyword=${kw}`)
      ]);

      if (resAnalyze.ok && resForecast.ok) {
        const analyzeData = await resAnalyze.json();
        const forecastData = await resForecast.json();
        setSearchData(analyzeData);
        setForecastData(forecastData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalysis(keyword);
  }, [keyword]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setKeyword(query);
      setQuery("");
      setSuggestions([]);
    }
  };

  const saveAiReport = async () => {
    if (!authToken || !searchData) return;
    setIsSavingReport(true);
    try {
      const content = JSON.stringify(searchData.ai_analysis);
      const res = await fetch(`${BACKEND_URL}/api/reports/save?keyword=${keyword}&report_content=${encodeURIComponent(content)}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      if (res.ok) {
        alert("Gemini AI Report saved successfully to your profile!");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingReport(false);
    }
  };

  const chartData = searchData ? searchData.history : [];

  return (
    <div className="flex flex-col gap-6">
      {/* SEARCH HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Keyword Intelligence</h1>
          <p className="text-xs text-slate-500">Query keywords to fetch live News, Video views, and Gemini-based analytical summaries.</p>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80 z-20">
          <div className="flex bg-slate-950 border border-slate-900 rounded-xl overflow-hidden focus-within:border-purple-500">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search keyword (AI, Bitcoin...)"
              className="px-4 py-2.5 text-xs bg-transparent focus:outline-none flex-1"
            />
            <button type="submit" className="p-2.5 text-slate-400 hover:text-white cursor-pointer">
              <Search size={16} />
            </button>
          </div>
          
          {/* Suggestions Dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute top-12 left-0 right-0 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-30 overflow-hidden">
              {suggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setKeyword(item);
                    setQuery("");
                    setSuggestions([]);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs hover:bg-slate-950 text-slate-300 transition-colors"
                >
                  #{item}
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        searchData && (
          <div className="flex flex-col gap-6">
            {/* META STRIP */}
            <div className="flex flex-wrap items-center gap-4 bg-purple-950/20 border border-purple-500/10 rounded-2xl p-5 justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-sm font-bold text-slate-200">Analysis for #{keyword}</span>
              </div>
              <div className="flex items-center gap-6 text-xs text-slate-400">
                <span>Mentions: <b className="text-slate-200">{searchData.total_mentions}</b></span>
                <span>Engagement Rate: <b className="text-slate-200">{searchData.engagement.rate}%</b></span>
                <span>Trend Score: <b className="text-purple-400">{forecastData?.metrics.score || 72}</b></span>
              </div>
              {authToken && (
                <button
                  onClick={saveAiReport}
                  disabled={isSavingReport}
                  className="px-3.5 py-1.5 bg-purple-900/60 hover:bg-purple-800 text-purple-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-purple-500/20 cursor-pointer"
                >
                  <FileText size={12} />
                  {isSavingReport ? "Saving..." : "Save AI Report"}
                </button>
              )}
            </div>

            {/* CHART & STATS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Popularity chart */}
              <div className="lg:col-span-2 glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-4">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><Activity size={14} className="text-cyan-400" /> Historical Trend Velocity</span>
                <div className="h-64 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }} />
                      <Area type="monotone" dataKey="volume" stroke="#06b6d4" fillOpacity={1} fill="url(#colorVol)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Engagement counts */}
              <div className="glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-4">
                <span className="text-xs font-bold uppercase tracking-wider">Social Media Metrics</span>
                <div className="flex flex-col gap-4 justify-center flex-1">
                  {[
                    { label: "Likes / Upvotes", count: searchData.engagement.likes, icon: Heart, color: "bg-red-500/10 text-red-400" },
                    { label: "Comments / Replies", count: searchData.engagement.comments, icon: MessageSquare, color: "bg-cyan-500/10 text-cyan-400" },
                    { label: "Shares / Retweets", count: searchData.engagement.shares, icon: Share2, color: "bg-purple-500/10 text-purple-400" }
                  ].map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                      <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-900/40 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                            <Icon size={16} />
                          </div>
                          <span className="text-xs text-slate-400">{stat.label}</span>
                        </div>
                        <span className="text-sm font-bold">{stat.count.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* GEMINI ANALYSIS PANEL */}
            <div className="glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-4">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><Brain size={14} className="text-purple-400" /> Gemini AI Deep Analysis</span>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2 text-xs">
                <div className="p-4 bg-slate-900/30 rounded-2xl flex flex-col gap-2">
                  <span className="font-bold text-slate-200">Executive Summary</span>
                  <p className="text-slate-400 leading-relaxed text-[11px]">{searchData.ai_analysis.executive_summary}</p>
                </div>
                <div className="p-4 bg-slate-900/30 rounded-2xl flex flex-col gap-2">
                  <span className="font-bold text-slate-200">Sentiment & Emotion Analysis</span>
                  <p className="text-slate-400 leading-relaxed text-[11px]">{searchData.ai_analysis.sentiment_summary}</p>
                </div>
                <div className="p-4 bg-slate-900/30 rounded-2xl flex flex-col gap-2">
                  <span className="font-bold text-slate-200">Business & Market Insights</span>
                  <p className="text-slate-400 leading-relaxed text-[11px]">{searchData.ai_analysis.business_insights}</p>
                </div>
                <div className="p-4 bg-slate-900/30 rounded-2xl flex flex-col gap-2">
                  <span className="font-bold text-slate-200">Future Trend Forecast</span>
                  <p className="text-slate-400 leading-relaxed text-[11px]">{searchData.ai_analysis.future_prediction}</p>
                </div>
                <div className="lg:col-span-2 p-4 bg-slate-900/30 rounded-2xl flex flex-col gap-2">
                  <span className="font-bold text-slate-200">Content Strategy Suggestions</span>
                  <ul className="list-disc pl-4 text-slate-400 space-y-1.5 text-[11px]">
                    {searchData.ai_analysis.content_suggestions.map((s: string, idx: number) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* NEWS & Video LAYER */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* News Section */}
              <div className="glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-4">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><Globe size={14} className="text-purple-400" /> Latest Related News</span>
                <div className="flex flex-col gap-4 max-h-[480px] overflow-y-auto pr-1">
                  {searchData.news.map((item: any, idx: number) => (
                    <a 
                      key={idx}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3.5 bg-slate-900/40 hover:bg-slate-900 border border-slate-800/40 rounded-2xl flex gap-3 transition-colors text-xs"
                    >
                      <img src={item.urlToImage} alt="news thumbnail" className="h-16 w-16 object-cover rounded-xl shrink-0 border border-slate-800" />
                      <div className="flex flex-col gap-1.5">
                        <span className="font-bold text-slate-200 line-clamp-1">{item.title}</span>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{item.description}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                          <span className="font-bold text-purple-400">{item.source}</span>
                          <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Video Section */}
              <div className="glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-4">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><Video size={14} className="text-red-400" /> Video Video Analysis</span>
                <div className="flex flex-col gap-4 max-h-[480px] overflow-y-auto pr-1">
                  {searchData.Video.map((item: any, idx: number) => (
                    <a 
                      key={idx}
                      href={`https://Video.com/watch?v=${item.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3.5 bg-slate-900/40 hover:bg-slate-900 border border-slate-800/40 rounded-2xl flex gap-3 transition-colors text-xs"
                    >
                      <div className="relative shrink-0">
                        <img src={item.thumbnail} alt="video thumbnail" className="h-16 w-24 object-cover rounded-xl border border-slate-800" />
                      </div>
                      <div className="flex flex-col justify-between py-0.5 flex-1 min-w-0">
                        <span className="font-bold text-slate-200 line-clamp-1">{item.title}</span>
                        <span className="text-[10px] text-slate-400 truncate">{item.channel}</span>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5">
                          <div className="flex gap-3">
                            <span>{item.views.toLocaleString()} views</span>
                            <span>{item.likes.toLocaleString()} likes</span>
                          </div>
                          <span className="flex items-center gap-1"><Calendar size={10} /> {item.published_at}</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};
