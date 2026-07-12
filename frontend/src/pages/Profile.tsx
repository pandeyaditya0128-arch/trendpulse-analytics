import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  User as UserIcon, Mail, Calendar, Settings, 
  CheckCircle2, Sparkles, AlertCircle
} from "lucide-react";

export const Profile: React.FC = () => {
  const { profile, updateProfile } = useAuth();
  
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("\u{1F916}");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.profile_name || "");
      setAvatar(profile.avatar || "\u{1F916}");
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsUpdating(true);
    try {
      await updateProfile(name.trim(), avatar);
      alert("Profile updated successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  // Emojis defined using JS escape codes to prevent encoding corruption in Windows/PowerShell
  const avatars = [
    { emoji: "\u{1F916}", label: "AI Robot" },
    { emoji: "\u{1F468}\u{200D}\u{1F4BB}", label: "Developer" },
    { emoji: "\u{1F469}\u{200D}\u{1F4BB}", label: "Analyst" },
    { emoji: "\u{1F680}", label: "Rocket" },
    { emoji: "\u{1F4CA}", label: "Chart" },
    { emoji: "\u{1F4A1}", label: "Insight" },
    { emoji: "\u{1F9E0}", label: "Brain" },
    { emoji: "\u{1F525}", label: "Trending" },
    { emoji: "\u{1F451}", label: "Admin" },
    { emoji: "\u{1F3AF}", label: "Target" }
  ];

  if (!profile) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      {/* HEADER */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Profile Settings</h1>
        <p className="text-xs text-slate-500 mt-1">Manage your identity, customize your avatar, and review your account details.</p>
      </div>

      <div className="glass-card rounded-3xl p-8 border border-slate-900/60 flex flex-col gap-6 text-xs text-slate-300">
        <div className="flex items-center gap-5 border-b border-slate-900 pb-6">
          <div className="h-16 w-16 rounded-2xl bg-purple-950/30 border border-purple-500/20 flex items-center justify-center text-3xl shadow-lg shadow-purple-500/5">
            {avatar}
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="text-base font-bold text-white tracking-tight">{profile.profile_name || "User"}</h2>
            <span className="text-[10px] text-slate-400 flex items-center gap-1.5"><Mail size={12} className="text-slate-500" /> {profile.email}</span>
            <span className="text-[10px] text-slate-400 flex items-center gap-1.5"><Calendar size={12} className="text-slate-500" /> Member since {new Date(profile.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Display Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:border-purple-500 focus:outline-none w-full text-slate-200"
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Select Avatar Identity</label>
            <div className="grid grid-cols-5 gap-2.5">
              {avatars.map((av) => (
                <button
                  key={av.emoji}
                  type="button"
                  onClick={() => setAvatar(av.emoji)}
                  title={av.label}
                  className={`h-11 w-11 text-xl rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                    avatar === av.emoji 
                      ? "bg-purple-950/40 border-purple-500 text-white shadow-md shadow-purple-500/10 scale-105" 
                      : "bg-slate-900/40 border-slate-850 hover:bg-slate-900 text-slate-400"
                  }`}
                >
                  {av.emoji}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isUpdating}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-purple-500/10 cursor-pointer transition-all mt-2"
          >
            {isUpdating ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Settings size={13} />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
