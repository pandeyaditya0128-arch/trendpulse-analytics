import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  User as UserIcon, Mail, Calendar, Settings, 
  CheckCircle2, Sparkles, AlertCircle
} from "lucide-react";

export const Profile: React.FC = () => {
  const { profile, updateProfile } = useAuth();
  
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("??");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.profile_name || "");
      setAvatar(profile.avatar || "??");
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

  const avatars = ["??", "?????", "?????", "??", "??", "??", "??", "??", "??", "??"];

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
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-xs text-slate-500">Manage your profile identity, selection avatars, and account specifications.</p>
      </div>

      <div className="glass-card rounded-3xl p-8 border border-slate-900/60 flex flex-col gap-6 text-xs text-slate-300">
        <div className="flex items-center gap-4 border-b border-slate-900 pb-6">
          <div className="h-16 w-16 rounded-2xl bg-purple-950 border border-purple-500/20 flex items-center justify-center text-3xl">
            {avatar}
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-bold text-white">{profile.profile_name}</h2>
            <span className="text-[10px] text-slate-500 flex items-center gap-1"><Mail size={12} /> {profile.email}</span>
            <span className="text-[10px] text-slate-500 flex items-center gap-1"><Calendar size={12} /> Registered on {new Date(profile.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-500">Display Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-xs focus:border-purple-500 focus:outline-none w-full text-slate-200"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase font-bold text-slate-500">Select Avatar Emoji</label>
            <div className="flex flex-wrap gap-2">
              {avatars.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setAvatar(av)}
                  className={`h-9 w-9 text-lg rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                    avatar === av 
                      ? "bg-purple-950 border-purple-500 text-white" 
                      : "bg-slate-900/60 border-slate-850 hover:bg-slate-850"
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isUpdating}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-purple-500/10 cursor-pointer"
          >
            {isUpdating ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Settings size={12} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
