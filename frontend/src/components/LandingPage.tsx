import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Database,
  Cpu,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Terminal,
} from 'lucide-react';
import { AlexaRing } from './AlexaRing';
import { useAuth } from '../context/AuthContext';

interface LandingPageProps {
  onLaunch: () => void;
  onOpenAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunch, onOpenAuth }) => {
  const { user, quickDemoLogin } = useAuth();

  return (
    <div className="flex-1 flex flex-col bg-[#0B0F19] text-gray-100 overflow-x-hidden">
      {/* 1. Hero Section */}
      <section className="relative pt-12 pb-20 px-4 max-w-6xl mx-auto w-full flex flex-col items-center text-center">
        {/* Subtle Ambient Background Light */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-cyan-500/20 via-blue-600/15 to-purple-600/10 blur-[120px] pointer-events-none rounded-full" />

        {/* Prototype Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111827] border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-6 shadow-md"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Independent Prototype • Model Context Protocol & Supabase Edition</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.15]"
        >
          Conversational Intelligence <br className="hidden sm:inline" />
          Connected to <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">Real Action</span>.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-base sm:text-lg text-gray-400 max-w-2xl leading-relaxed"
        >
          Experience next-generation voice and text intelligence with zero simulated data. Genuine Supabase PostgreSQL persistence, Google Gemini AI function calling, and standardized Streamable HTTP MCP tools.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <button
            onClick={onLaunch}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-sm transition-all shadow-[0_0_25px_rgba(0,202,255,0.3)] active:scale-95"
          >
            <span>Launch Assistant</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {!user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => quickDemoLogin()}
                className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-[#111827] hover:bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold text-sm transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Instant Demo Access</span>
              </button>
              <button
                onClick={onOpenAuth}
                className="px-4 py-3.5 rounded-xl bg-[#111827] hover:bg-gray-800 border border-gray-700 text-gray-300 text-sm font-medium transition-all"
              >
                Sign In / Sign Up
              </button>
            </div>
          ) : (
            <button
              onClick={onLaunch}
              className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-[#111827] border border-gray-700 text-gray-300 font-medium text-sm hover:border-gray-600 transition-all"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Signed in as {user.email?.split('@')[0]}</span>
            </button>
          )}
        </motion.div>

        {/* Interactive Assistant Preview Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-14 max-w-3xl w-full bg-[#111827]/80 border border-gray-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600" />
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400">
                Interactive Voice Orb
              </span>
              <h3 className="text-xl font-bold text-white">Tap to Test Voice & Speech</h3>
              <p className="text-xs text-gray-400 max-w-sm">
                Try saying: "Add a task to prepare presentation" or "What is your system status?".
              </p>
              <div className="pt-2 flex flex-wrap gap-2">
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#1F2937] text-gray-300 border border-gray-700">
                  🎙️ Web Speech API
                </span>
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#1F2937] text-gray-300 border border-gray-700">
                  ⚡ Real-Time MCP Tooling
                </span>
              </div>
            </div>

            <div className="shrink-0">
              <AlexaRing
                state="idle"
                onToggleMic={onLaunch}
                size="md"
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* 2. Bento Grid: Core Product Pillars */}
      <section className="py-16 px-4 max-w-6xl mx-auto w-full border-t border-gray-800/80">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2">
            Engineered For Authenticity
          </h2>
          <h3 className="text-2xl sm:text-3xl font-bold text-white">
            Real Infrastructure. Zero Placeholders.
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 mt-2">
            Every task, reminder, note, and conversation is securely stored in PostgreSQL with strict Row Level Security.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Supabase PostgreSQL */}
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 flex flex-col justify-between hover:border-cyan-500/40 transition-all shadow-lg group">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                <Database className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Supabase PostgreSQL</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Complete relational persistence with Row Level Security (RLS) policies. Profiles, tasks, reminders, notes, conversations, and audit events are strictly isolated per authenticated user identity.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-800/80 text-[11px] font-mono text-cyan-300 flex items-center justify-between">
              <span>Zero MongoDB</span>
              <span className="text-emerald-400">RLS Active</span>
            </div>
          </div>

          {/* Card 2: Model Context Protocol */}
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 flex flex-col justify-between hover:border-cyan-500/40 transition-all shadow-lg group">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                <Cpu className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Model Context Protocol (MCP)</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Official TypeScript MCP SDK implementation operating over Streamable HTTP at <code className="text-purple-300">/mcp</code>. Registered with 8 deterministic tools validating payloads via Zod schemas.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-800/80 text-[11px] font-mono text-purple-300 flex items-center justify-between">
              <span>JSON-RPC 2.0</span>
              <span className="text-emerald-400">Streamable HTTP</span>
            </div>
          </div>

          {/* Card 3: Google Gemini AI */}
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 flex flex-col justify-between hover:border-cyan-500/40 transition-all shadow-lg group">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                <Terminal className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Gemini AI Function Calling</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Contextual conversation processing backed by Google Gemini with server-side authorization and an intelligent deterministic fallback router to prevent rate limit interruptions.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-800/80 text-[11px] font-mono text-blue-300 flex items-center justify-between">
              <span>gemini-3.8-flash</span>
              <span className="text-emerald-400">Verified</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. How It Works (Workflow Flowchart) */}
      <section className="py-16 px-4 max-w-6xl mx-auto w-full border-t border-gray-800/80">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2">
            Execution Pipeline
          </h2>
          <h3 className="text-2xl font-bold text-white">How Alexa+ Processes Requests</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#111827] border border-gray-800 rounded-xl p-5 space-y-2 relative">
            <span className="text-xs font-mono text-cyan-400 font-bold">STEP 01</span>
            <h4 className="text-sm font-bold text-white">Voice / Text Prompt</h4>
            <p className="text-xs text-gray-400">
              User speaks or types natural language prompt into client interface.
            </p>
          </div>

          <div className="bg-[#111827] border border-gray-800 rounded-xl p-5 space-y-2 relative">
            <span className="text-xs font-mono text-cyan-400 font-bold">STEP 02</span>
            <h4 className="text-sm font-bold text-white">Gemini Tool Selection</h4>
            <p className="text-xs text-gray-400">
              AI parses context, selects registered MCP tool, and formats arguments.
            </p>
          </div>

          <div className="bg-[#111827] border border-gray-800 rounded-xl p-5 space-y-2 relative">
            <span className="text-xs font-mono text-cyan-400 font-bold">STEP 03</span>
            <h4 className="text-sm font-bold text-white">Supabase Execution</h4>
            <p className="text-xs text-gray-400">
              Server authenticates token, enforces RLS, and executes database queries.
            </p>
          </div>

          <div className="bg-[#111827] border border-gray-800 rounded-xl p-5 space-y-2 relative">
            <span className="text-xs font-mono text-cyan-400 font-bold">STEP 04</span>
            <h4 className="text-sm font-bold text-white">Vocal & Visual Result</h4>
            <p className="text-xs text-gray-400">
              Spoken synthesis announces outcome while dashboard updates in real time.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Alexa+ Toolkit Compatibility Banner */}
      <section className="py-12 px-4 max-w-6xl mx-auto w-full">
        <div className="bg-gradient-to-r from-blue-950/40 via-[#111827] to-cyan-950/40 border border-cyan-500/30 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Amazon Alexa+ Add-on Ready</span>
            </div>
            <h3 className="text-xl font-bold text-white">
              RFC 8414 & RFC 9470 OAuth 2.1 Protocol Compliance
            </h3>
            <p className="text-xs text-gray-400 max-w-xl">
              Configured with Authorization Server metadata (<code className="text-cyan-300">/.well-known/oauth-authorization-server</code>) and Protected Resource metadata (<code className="text-cyan-300">/.well-known/oauth-protected-resource</code>) for seamless account linking.
            </p>
          </div>

          <button
            onClick={onLaunch}
            className="shrink-0 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs transition-all shadow-md active:scale-95"
          >
            Open Developer Console
          </button>
        </div>
      </section>
    </div>
  );
};
