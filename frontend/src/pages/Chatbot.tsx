import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { Send, Bot, User as UserIcon, Zap } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface Message {
  role: "user" | "bot";
  content: string;
  timestamp: string;
}

export const Chatbot: React.FC = () => {
  const { authToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchHistory = async () => {
    if (!authToken) { setHistoryLoading(false); return; }
    try {
      const res = await fetch(`${BACKEND_URL}/api/query-bot/history`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = data.flatMap((h: any) => [
          { role: "user" as const, content: h.message, timestamp: h.created_at },
          { role: "bot" as const, content: h.response, timestamp: h.created_at }
        ]);
        setMessages(mapped);
      }
    } catch {}
    finally { setHistoryLoading(false); }
  };

  useEffect(() => { fetchHistory(); }, [authToken]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !authToken) return;
    setLoading(true);
    const now = new Date().toLocaleTimeString();
    setMessages(prev => [...prev, { role: "user", content: text, timestamp: now }]);
    setInput("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/query-bot`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: "bot", content: data.response, timestamp: now }]);
      }
    } catch {}
    finally { setLoading(false); }
  };

  const presets = [
    "Why is AI trending right now?",
    "Compare Bitcoin vs Ethereum trends",
    "Summarize today'\''s tech news",
    "What stocks are rising this week?"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto rounded-3xl overflow-hidden border border-slate-900/60 bg-slate-950/20">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-900/60 bg-slate-950/50 flex items-center gap-3 shrink-0">
        <div className="h-9 w-9 rounded-xl bg-purple-950/40 border border-purple-500/20 flex items-center justify-center text-purple-400">
          <Bot size={16} />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-200">Query Bot</p>
          <p className="text-[10px] text-slate-500">Ask about trends, markets, keywords, and news.</p>
        </div>
        <div className="ml-auto flex items-center gap-1 text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-semibold">Live</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
        {historyLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="h-6 w-6 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center">
            <div className="h-14 w-14 rounded-2xl bg-purple-950/30 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Zap size={24} />
            </div>
            <div>
              <p className="text-sm font-bold mb-1">Start a conversation</p>
              <p className="text-xs text-slate-500 max-w-xs">Ask anything about trends, or pick a quick prompt below.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {presets.map((p, i) => (
                <button key={i} onClick={() => sendMessage(p)}
                  className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 rounded-xl text-left text-[10px] text-slate-400 font-medium transition-all cursor-pointer">
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isUser = msg.role === "user";
              return (
                <div key={i} className={`flex gap-2.5 max-w-[85%] ${isUser ? "self-end flex-row-reverse" : "self-start"}`}>
                  <div className={`h-7 w-7 rounded-xl border flex items-center justify-center shrink-0 text-[11px] ${
                    isUser ? "bg-cyan-950/20 border-cyan-500/20 text-cyan-400" : "bg-purple-950/20 border-purple-500/20 text-purple-400"
                  }`}>
                    {isUser ? <UserIcon size={12} /> : <Bot size={12} />}
                  </div>
                  <div className={`px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                    isUser ? "bg-cyan-950/20 text-cyan-100 rounded-tr-sm border border-cyan-500/10"
                           : "bg-slate-900/60 text-slate-300 rounded-tl-sm border border-slate-800/80"
                  }`}>
                    <p dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, "<br/>") }} />
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex gap-2.5 self-start">
                <div className="h-7 w-7 rounded-xl bg-purple-950/20 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <Bot size={12} />
                </div>
                <div className="px-4 py-3 bg-slate-900/60 rounded-2xl rounded-tl-sm border border-slate-800/80 flex gap-1.5 items-center">
                  <div className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-900/60 bg-slate-950/50 shrink-0">
        <form onSubmit={e => { e.preventDefault(); sendMessage(input); }}
          className="flex bg-slate-950 border border-slate-800 rounded-xl overflow-hidden focus-within:border-purple-500 transition-colors">
          <input
            type="text" value={input} onChange={e => setInput(e.target.value)}
            placeholder="Ask Query Bot anything…" disabled={loading}
            className="px-4 py-3 text-xs bg-transparent focus:outline-none flex-1 text-slate-200"
          />
          <button type="submit" disabled={!input.trim() || loading}
            className="px-3.5 text-purple-400 hover:text-purple-300 disabled:opacity-40 cursor-pointer transition-colors">
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};
