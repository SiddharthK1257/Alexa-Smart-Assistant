import React, { useState, useEffect } from 'react';
import { User, Volume2, Cpu, Check, LogOut, Sliders } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

export const SettingsView: React.FC = () => {
  const { user, profile, token, signOut } = useAuth();
  const { speak, isSpeaking, rate, setRate, isMuted, toggleMute } = useSpeechSynthesis();

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [speechRate, setSpeechRate] = useState(rate);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [healthStatus, setHealthStatus] = useState<any>(null);

  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    }
  }, [profile]);

  useEffect(() => {
    api.getHealth().then(setHealthStatus).catch(console.error);
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await api.updateProfile(
        {
          display_name: displayName.trim(),
          preferences: {
            speech_rate: speechRate,
            voice_muted: isMuted,
            theme: 'alexa_dark',
          },
        },
        token
      );
      setRate(speechRate);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(`Failed to save settings: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSpeech = () => {
    speak(`Hello ${displayName || 'there'}! This is a voice test of your Alexa+ smart assistant at ${speechRate}x speed.`);
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-8 space-y-8">
      {/* Title */}
      <div className="border-b border-gray-800 pb-4">
        <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
          <Sliders className="w-6 h-6 text-cyan-400" />
          <span>Assistant Settings & Preferences</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Configure profile details, voice synthesis speed, and review active MCP endpoints
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: User Profile Form */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-4 shadow-lg">
          <div className="flex items-center gap-2 text-cyan-400">
            <User className="w-5 h-5" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">Profile Details</h2>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div>
              <label className="block text-gray-400 mb-1 font-medium">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your preferred name"
                className="w-full bg-[#1F2937] border border-gray-700 rounded-xl p-3 text-sm text-gray-100 outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1 font-medium">Email Account (Read-Only)</label>
              <input
                type="email"
                disabled
                value={user?.email || 'Guest Mode'}
                className="w-full bg-[#0B0F19] border border-gray-800 rounded-xl p-3 text-sm text-gray-500 outline-none cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1 font-medium">User Identifier (UUID)</label>
              <input
                type="text"
                disabled
                value={user?.id || 'Unauthenticated'}
                className="w-full bg-[#0B0F19] border border-gray-800 rounded-xl p-3 text-xs font-mono text-cyan-400/80 outline-none cursor-not-allowed"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              {saveSuccess && (
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                  <Check className="w-4 h-4" />
                  Preferences Saved!
                </span>
              )}
              <button
                type="submit"
                disabled={isSaving || !token}
                className="ml-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-xs transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Section 2: Voice & Speech Engine Settings */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-cyan-400">
              <Volume2 className="w-5 h-5" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">Voice & Speech</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between text-gray-400 mb-1">
                  <span>Speech Rate</span>
                  <span className="font-mono text-cyan-400">{speechRate}x</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.5"
                  step="0.05"
                  value={speechRate}
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    setSpeechRate(val);
                    setRate(val);
                  }}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-1">
                  <span>0.75x (Relaxed)</span>
                  <span>1.0x (Natural)</span>
                  <span>1.5x (Fast)</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between p-3 rounded-xl bg-[#1F2937]/50 border border-gray-700">
                <span className="text-gray-300">Spoken Voice Responses</span>
                <button
                  type="button"
                  onClick={toggleMute}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    isMuted
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {isMuted ? 'Muted' : 'Enabled'}
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTestSpeech}
                  disabled={isSpeaking || isMuted}
                  className="w-full py-2.5 rounded-xl bg-[#1F2937] hover:bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{isSpeaking ? 'Playing Voice Test...' : 'Test Vocal Output'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          {user && (
            <div className="pt-4 border-t border-gray-800 flex items-center justify-between text-xs">
              <span className="text-gray-500">Session Active</span>
              <button
                type="button"
                onClick={() => signOut()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Connection & Protocol Health Status */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-400">
            <Cpu className="w-5 h-5" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              System Connections & Protocol Specs
            </h2>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {healthStatus?.status === 'ok' ? 'Online' : 'Connected'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="bg-[#0B0F19] border border-gray-800 rounded-xl p-3 space-y-1">
            <span className="text-gray-500 text-[10px] uppercase">MCP Transport</span>
            <p className="text-cyan-300 font-semibold">Streamable HTTP</p>
            <p className="text-gray-400 text-[10px]">
              {healthStatus?.mcp?.toolsCount ? `${healthStatus.mcp.toolsCount} Tools Registered` : 'Path: /mcp (JSON-RPC 2.0)'}
            </p>
          </div>

          <div className="bg-[#0B0F19] border border-gray-800 rounded-xl p-3 space-y-1">
            <span className="text-gray-500 text-[10px] uppercase">Database Engine</span>
            <p className="text-emerald-300 font-semibold">Supabase PostgreSQL</p>
            <p className="text-gray-400 text-[10px]">
              {healthStatus?.database?.latencyMs ? `Ping: ${healthStatus.database.latencyMs}ms (RLS active)` : 'Pool: 10 connections'}
            </p>
          </div>

          <div className="bg-[#0B0F19] border border-gray-800 rounded-xl p-3 space-y-1">
            <span className="text-gray-500 text-[10px] uppercase">AI Orchestrator</span>
            <p className="text-purple-300 font-semibold">Google Gemini 3.8 Flash</p>
            <p className="text-gray-400 text-[10px]">
              {healthStatus?.aiModel ? `Model: ${healthStatus.aiModel}` : 'Native Function Calling'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
