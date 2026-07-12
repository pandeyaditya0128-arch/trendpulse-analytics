import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  Send, MessageSquare, Bot, User as UserIcon, 
  HelpCircle, Trash2, RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";

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

  const fetchChatHistory = async () => {
    if (!authToken) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/query-bot/history`, {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = data.flatMap((h: any) => [
          { role: "user", content: h.message, timestamp: h.created_at },
          { role: "bot", content: h.response, timestamp: h.created_at }
        ]);
        setMessages(mapped);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchChatHistory();
  }, [authToken]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !authToken) return;
    setLoading(true);
    
    // Add user message locally
    const nowStr = new Date().toLocaleTimeString();
    const newMsg: Message = { role: "user", content: text, timestamp: nowStr };
    setMessages(prev => [...prev, newMsg]);
    setInput("");

    try {
      const res = await fetch(`${BACKEND_URL}/api/query-bot`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: text })
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg: Message = { role: "bot", content: data.response, timestamp: nowStr };
        setMessages(prev => [...prev, botMsg]);
      } else {
        alert("Failed to get chatbot response");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const presetPrompts = [
    "Why is AI trending?",
    "Why is Bitcoin increasing?",
    "Compare Apple and Samsung.",
    "Summarize today's news."
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto border border-slate-900/60 rounded-3xl overflow-hidden glass-panel bg-slate-950/20">
      {/* HEADER */}
      <div className="px-6 py-4 border-b border-slate-900/60 flex items-center justify-between bg-slate-950/40 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-purple-950/40 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Bot size={16} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-200">TrendPulse Query Bot</span>
            <p className="text-[10px] text-slate-500">Ask questions about trends, crypto, tech, or compare keywords.</p>
          </div>
        </div>
      </div>

      {/* MESSAGES VIEW */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {historyLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="h-6 w-6 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-8">
            <MessageSquare size={36} className="text-slate-600 animate-pulse" />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold">Start a Conversation</span>
              <p className="text-[11px] text-slate-500 max-w-xs">Ask anything, or click one of the suggested quick prompts below to begin.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 w-full max-w-md">
              {presetPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p)}
                  className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 rounded-xl text-left text-[10px] text-slate-400 font-semibold transition-all cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((msg, index) => {
              const isUser = msg.role === "user";
              return (
                <div 
                  key={index} 
                  className={`flex gap-3 max-w-[85%] ${isUser ? "self-end flex-row-reverse" : "self-start"}`}
                >
                  <div className={`h-8 w-8 rounded-xl border flex items-center justify-center shrink-0 text-xs ${
                    isUser 
                      ? "bg-cyan-950/20 border-cyan-500/20 text-cyan-400" 
                      : "bg-purple-950/20 border-purple-500/20 text-purple-400"
                  }`}>
                    {isUser ? <UserIcon size={14} /> : <Bot size={14} />}
                  </div>
                  
                  <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                    isUser 
                      ? "bg-cyan-950/20 text-cyan-200 rounded-tr-none border border-cyan-500/10" 
                      : "bg-slate-900/60 text-slate-300 rounded-tl-none border border-slate-800/80"
                  }`}>
                    <p dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, "<br/>") }} />
                  </div>
                </div>
              );
            })}
            
            {loading && (
              <div className="flex gap-3 self-start max-w-[80%]">
                <div className="h-8 w-8 rounded-xl bg-purple-950/20 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <Bot size={14} className="animate-spin" />
                </div>
                <div className="p-4 bg-slate-900/60 rounded-2xl rounded-tl-none border border-slate-800/80 flex items-center gap-1 text-slate-500 text-[10px]">
                  <span>Query Bot is thinking...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* INPUT FORM */}
      <div className="p-4 border-t border-slate-900/60 bg-slate-950/40 shrink-0">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }}
          className="flex bg-slate-950 border border-slate-900 rounded-2xl overflow-hidden focus-within:border-purple-500"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Query Bot..."
            disabled={loading}
            className="px-4 py-3.5 text-xs bg-transparent focus:outline-none flex-1 text-slate-200"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || loading}
            className="p-3.5 text-purple-400 hover:text-purple-300 disabled:opacity-40 disabled:hover:text-purple-400 cursor-pointer"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};


