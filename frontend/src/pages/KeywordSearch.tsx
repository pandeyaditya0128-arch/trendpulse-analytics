import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  Search, Brain, Heart, MessageSquare, Share2, 
  Globe, Video, Calendar, Activity, FileText, TrendingUp, AlertCircle
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
  const [error, setError] = useState<string | null>(null);
  const [isSavingReport, setIsSavingReport] = useState(false);

  useEffect(() => {
    if (query.trim().length < 1) {
      setSuggestions([]);
      return;
    }
    fetch(`${BACKEND_URL}/api/suggestions?q=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => setSuggestions(Array.isArray(data) ? data : []))
      .catch(() => setSuggestions([]));
  }, [query]);

  const loadAnalysis = async (kw: string) => {
    setLoading(true);
    setError(null);
    setSearchData(null);
    setForecastData(null);
    try {
      const headers: Record<string, string> = {};
      if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

      const [resAnalyze, resForecast] = await Promise.all([
        fetch(`${BACKEND_URL}/api/analyze?keyword=${encodeURIComponent(kw)}`, { headers }),
        fetch(`${BACKEND_URL}/api/forecast?keyword=${encodeURIComponent(kw)}`)
      ]);

      if (!resAnalyze.ok) throw new Error(`Analysis failed: ${resAnalyze.status}`);

      const analyzeData = await resAnalyze.json();
      const forecastJson = resForecast.ok ? await resForecast.json() : null;
      setSearchData(analyzeData);
      setForecastData(forecastJson);
    } catch (err: any) {
      setError(err.message || "Failed to load keyword data");
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
      setKeyword(query.trim());
      setQuery("");
      setSuggestions([]);
    }
  };

  const saveAiReport = async () => {
    if (!authToken || !searchData) return;
    setIsSavingReport(true);
    try {
      const content = JSON.stringify(searchData.ai_analysis);
      const res = await fetch(
        `${BACKEND_URL}/api/reports/save?keyword=${encodeURIComponent(keyword)}&report_content=${encodeURIComponent(content)}`,
        { method: "POST", headers: { Authorization: `Bearer ${authToken}` } }
      );
      if (res.ok) alert("Report saved successfully!");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingReport(false);
    }
  };

  const chartData = searchData?.history ?? [];
  const youtubeVideos: any[] = searchData?.youtube ?? [];
  const newsArticles: any[] = searchData?.news ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER + SEARCH BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Keyword Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time news, YouTube engagement, and Gemini AI analysis for any keyword.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80 z-20">
          <div className="flex bg-slate-950 border border-slate-800 rounded-xl overflow-hidden focus-within:border-purple-500 transition-colors">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. AI, Bitcoin, Tesla..."
              className="px-4 py-2.5 text-xs bg-transparent focus:outline-none flex-1 text-slate-200"
            />
            <button type="submit" className="px-3 text-slate-400 hover:text-purple-400 cursor-pointer transition-colors">
              <Search size={15} />
            </button>
          </div>
          {suggestions.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-30 overflow-hidden">
              {suggestions.map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => { setKeyword(item); setQuery(""); setSuggestions([]); }}
                  className="w-full text-left px-4 py-2.5 text-xs hover:bg-slate-800 text-slate-300 transition-colors"
                >
                  #{item}
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div className="h-80 flex flex-col items-center justify-center gap-4 text-slate-500">
          <div className="h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs">Fetching live data for <span className="text-purple-400 font-bold">#{keyword}</span>…</p>
        </div>
      )}

      {/* ERROR STATE */}
      {!loading && error && (
        <div className="glass-card rounded-3xl p-8 border border-red-900/40 flex flex-col items-center gap-3 text-center">
          <AlertCircle size={28} className="text-red-400" />
          <p className="text-sm font-bold text-red-400">Failed to load data</p>
          <p className="text-xs text-slate-500">{error}</p>
          <button
            onClick={() => loadAnalysis(keyword)}
            className="mt-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold hover:bg-slate-800 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* DATA VIEW */}
      {!loading && !error && searchData && (
        <div className="flex flex-col gap-6">
          {/* META STRIP */}
          <div className="flex flex-wrap items-center gap-3 bg-purple-950/20 border border-purple-500/10 rounded-2xl p-4 justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-bold text-slate-200">#{keyword}</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span>Mentions: <b className="text-slate-200">{searchData.total_mentions?.toLocaleString()}</b></span>
              <span>Engagement: <b className="text-slate-200">{searchData.engagement?.rate}%</b></span>
              <span>Score: <b className="text-purple-400">{forecastData?.metrics?.score ?? 72}</b></span>
            </div>
            {authToken && (
              <button
                onClick={saveAiReport}
                disabled={isSavingReport}
                className="px-3.5 py-1.5 bg-purple-900/60 hover:bg-purple-800 text-purple-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-purple-500/20 cursor-pointer disabled:opacity-60"
              >
                <FileText size={12} />
                {isSavingReport ? "Saving…" : "Save Report"}
              </button>
            )}
          </div>

          {/* CHART + SOCIAL STATS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-4">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Activity size={14} className="text-cyan-400" /> Trend Velocity
              </span>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", fontSize: 11 }} />
                    <Area type="monotone" dataKey="volume" stroke="#06b6d4" fillOpacity={1} fill="url(#colorVol)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-4">
              <span className="text-xs font-bold uppercase tracking-wider">Social Metrics</span>
              <div className="flex flex-col gap-3 flex-1 justify-center">
                {[
                  { label: "Likes / Upvotes", count: searchData.engagement?.likes, icon: Heart, color: "text-red-400 bg-red-500/10" },
                  { label: "Comments", count: searchData.engagement?.comments, icon: MessageSquare, color: "text-cyan-400 bg-cyan-500/10" },
                  { label: "Shares", count: searchData.engagement?.shares, icon: Share2, color: "text-purple-400 bg-purple-500/10" }
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                          <Icon size={14} />
                        </div>
                        <span className="text-xs text-slate-400">{stat.label}</span>
                      </div>
                      <span className="text-sm font-bold">{(stat.count ?? 0).toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* GEMINI AI ANALYSIS */}
          {searchData.ai_analysis && (
            <div className="glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-4">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Brain size={14} className="text-purple-400" /> Gemini AI Deep Analysis
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                {[
                  { title: "Executive Summary", key: "executive_summary" },
                  { title: "Sentiment Analysis", key: "sentiment_summary" },
                  { title: "Business Insights", key: "business_insights" },
                  { title: "Future Forecast", key: "future_prediction" }
                ].map(section => (
                  <div key={section.key} className="p-4 bg-slate-900/30 rounded-2xl flex flex-col gap-2">
                    <span className="font-bold text-slate-200">{section.title}</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{searchData.ai_analysis[section.key]}</p>
                  </div>
                ))}
                {searchData.ai_analysis.content_suggestions?.length > 0 && (
                  <div className="lg:col-span-2 p-4 bg-slate-900/30 rounded-2xl flex flex-col gap-2">
                    <span className="font-bold text-slate-200">Content Strategy</span>
                    <ul className="list-disc pl-4 text-[11px] text-slate-400 space-y-1.5 leading-relaxed">
                      {searchData.ai_analysis.content_suggestions.map((s: string, i: number) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* NEWS + YOUTUBE */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* News */}
            <div className="glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-4">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Globe size={14} className="text-purple-400" /> Latest News
              </span>
              {newsArticles.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center italic">No news articles found.</p>
              ) : (
                <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
                  {newsArticles.map((item: any, idx: number) => (
                    <a
                      key={idx}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3.5 bg-slate-900/40 hover:bg-slate-900 border border-slate-800/40 rounded-2xl flex gap-3 transition-colors text-xs"
                    >
                      {item.urlToImage && (
                        <img
                          src={item.urlToImage}
                          alt=""
                          className="h-14 w-14 object-cover rounded-xl shrink-0 border border-slate-800"
                          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      )}
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="font-bold text-slate-200 line-clamp-2 leading-snug">{item.title}</span>
                        <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{item.description}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                          <span className="font-semibold text-purple-400 truncate">{item.source}</span>
                          <span className="shrink-0 ml-2">{new Date(item.publishedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* YouTube */}
            <div className="glass-card rounded-3xl p-6 border border-slate-900/60 flex flex-col gap-4">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Video size={14} className="text-red-400" /> YouTube Engagement
              </span>
              {youtubeVideos.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center italic">No videos found.</p>
              ) : (
                <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
                  {youtubeVideos.map((item: any, idx: number) => (
                    <a
                      key={idx}
                      href={`https://youtube.com/watch?v=${item.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3.5 bg-slate-900/40 hover:bg-slate-900 border border-slate-800/40 rounded-2xl flex gap-3 transition-colors text-xs"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={item.thumbnail}
                          alt=""
                          className="h-16 w-24 object-cover rounded-xl border border-slate-800"
                          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      </div>
                      <div className="flex flex-col justify-between py-0.5 flex-1 min-w-0">
                        <span className="font-bold text-slate-200 line-clamp-2 leading-snug text-[11px]">{item.title}</span>
                        <span className="text-[10px] text-slate-400 truncate">{item.channel}</span>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                          <div className="flex gap-3">
                            <span>{(item.views ?? 0).toLocaleString()} views</span>
                            <span>{(item.likes ?? 0).toLocaleString()} likes</span>
                          </div>
                          <span className="flex items-center gap-1 shrink-0">
                            <Calendar size={9} />{item.published_at}
                          </span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
