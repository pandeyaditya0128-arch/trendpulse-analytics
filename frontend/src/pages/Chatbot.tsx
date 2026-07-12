import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { Send, Bot, User as UserIcon, Zap, Trash2, Copy, RefreshCw, CheckCircle2 } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface Message {
  id?: number;
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
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchHistory = async () => {
    if (!authToken) { setHistoryLoading(false); return; }
    try {
      const res = await fetch(`${BACKEND_URL}/api/query-bot/history`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        const mapped: Message[] = [];
        data.forEach((h: any, idx: number) => {
          mapped.push({ id: idx * 2, role: "user", content: h.message, timestamp: new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
          mapped.push({ id: idx * 2 + 1, role: "bot", content: h.response, timestamp: new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
        });
        setMessages(mapped);
      }
    } catch {}
    finally { setHistoryLoading(false); }
  };

  useEffect(() => { fetchHistory(); }, [authToken]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !authToken || loading) return;
    setLoading(true);
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = { id: Date.now(), role: "user", content: text, timestamp: now };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    try {
      const res = await fetch(`${BACKEND_URL}/api/query-bot`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });
      if (res.ok) {
        const data = await res.json();
        const botMsg: Message = { id: Date.now() + 1, role: "bot", content: data.response, timestamp: now };
        setMessages(prev => [...prev, botMsg]);
      } else {
        const botMsg: Message = { id: Date.now() + 1, role: "bot", content: "Failed to connect to the assistant engine. Please try again.", timestamp: now };
        setMessages(prev => [...prev, botMsg]);
      }
    } catch {
      const botMsg: Message = { id: Date.now() + 1, role: "bot", content: "Connection timeout. Please retry.", timestamp: now };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!authToken || !window.confirm("Clear all conversation history?")) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/query-bot/history`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        setMessages([]);
      }
    } catch {}
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const suggestions = [
    "Analyze AI",
    "Analyze Bitcoin",
    "Compare Apple vs Samsung",
    "Explain Machine Learning",
    "Summarize today's technology news",
    "Analyze my uploaded dataset",
    "Predict future AI trends"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto rounded-3xl overflow-hidden border border-slate-900/60 bg-slate-950/20">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-900/60 bg-slate-950/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-purple-950/40 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Bot size={16} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-200">Query Bot</p>
            <p className="text-[10px] text-slate-500">Ask about trends, markets, keywords, and news.</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="p-2 bg-slate-900/50 border border-slate-800 hover:bg-slate-900 hover:text-red-400 text-slate-400 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
            title="Clear Chat"
          >
            <Trash2 size={13} />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
        {historyLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="h-6 w-6 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center my-auto">
            <div className="h-14 w-14 rounded-2xl bg-purple-950/30 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Zap size={24} />
            </div>
            <div>
              <p className="text-sm font-bold mb-1">Start a conversation</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">Ask anything about trends, or pick a quick prompt below.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {suggestions.map((p, i) => (
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
              const messageId = msg.id ?? i;
              return (
                <div key={messageId} className={`flex gap-2.5 max-w-[85%] ${isUser ? "self-end flex-row-reverse" : "self-start"}`}>
                  <div className={`h-7 w-7 rounded-xl border flex items-center justify-center shrink-0 text-[11px] ${
                    isUser ? "bg-cyan-950/20 border-cyan-500/20 text-cyan-400" : "bg-purple-950/20 border-purple-500/20 text-purple-400"
                  }`}>
                    {isUser ? <UserIcon size={12} /> : <Bot size={12} />}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className={`px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                      isUser ? "bg-cyan-950/20 text-cyan-100 rounded-tr-sm border border-cyan-500/10"
                             : "bg-slate-900/60 text-slate-300 rounded-tl-sm border border-slate-800/80"
                    }`}>
                      {/* Simple custom markdown newline & lists formatter */}
                      <div 
                        className="space-y-1.5"
                        dangerouslySetInnerHTML={{ 
                          __html: msg.content
                            .replace(/\n/g, "<br/>")
                            .replace(/### (.*?)(<br\/>|$)/g, "<h3 class='font-bold text-slate-200 mt-2 mb-1'>$1</h3>")
                            .replace(/- \*\*(.*?)\*\*: (.*?)(<br\/>|$)/g, "<li class='list-none pl-1'><strong>$1</strong>: $2</li>")
                        }} 
                      />
                    </div>
                    {/* Message Actions */}
                    <div className={`flex items-center gap-2 text-[9px] text-slate-500 px-1 ${isUser ? "justify-end" : "justify-start"}`}>
                      <span>{msg.timestamp}</span>
                      {!isUser && (
                        <>
                          <span>·</span>
                          <button 
                            onClick={() => copyToClipboard(msg.content, messageId)}
                            className="hover:text-slate-300 cursor-pointer flex items-center gap-0.5"
                            title="Copy response"
                          >
                            {copiedId === messageId ? <CheckCircle2 size={10} className="text-emerald-400" /> : <Copy size={10} />}
                            {copiedId === messageId ? "Copied" : "Copy"}
                          </button>
                          <span>·</span>
                          <button 
                            onClick={() => {
                              const lastUserMsg = messages.slice(0, i).reverse().find(m => m.role === "user");
                              if (lastUserMsg) sendMessage(lastUserMsg.content);
                            }}
                            className="hover:text-slate-300 cursor-pointer flex items-center gap-0.5"
                            title="Regenerate response"
                          >
                            <RefreshCw size={10} />
                            Regenerate
                          </button>
                        </>
                      )}
                    </div>
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
          className="flex bg-slate-950 border border-slate-800 rounded-xl overflow-hidden focus-within:border-purple-500 transition-colors items-end p-1">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Query Bot anything… (Enter to send, Shift+Enter for newline)"
            disabled={loading}
            rows={1}
            className="px-3 py-2 text-xs bg-transparent focus:outline-none flex-1 text-slate-200 resize-none max-h-24 font-sans"
          />
          <button type="submit" disabled={!input.trim() || loading}
            className="p-2 text-purple-400 hover:text-purple-300 disabled:opacity-40 cursor-pointer transition-colors shrink-0">
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};
