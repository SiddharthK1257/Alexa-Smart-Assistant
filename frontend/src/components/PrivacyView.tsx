import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PrivacyView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-10 space-y-8 text-gray-200">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Home</span>
      </Link>

      <div className="border-b border-gray-800 pb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-3">
          <Shield className="w-3.5 h-3.5" />
          <span>Privacy & Security Specification</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
        <p className="text-xs text-gray-400 mt-1">
          Effective Date: October 21, 2026 | Alexa+ Smart Assistant (Supabase Edition)
        </p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-gray-300">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">1. Independent Prototype Notice</h2>
          <p>
            Alexa+ Smart Assistant is an independent developer prototype designed to demonstrate Model Context Protocol (MCP) tool integration with Supabase PostgreSQL and Google Gemini AI. It is <strong>not</strong> an official Amazon product, service, or application, and has no official sponsorship from Amazon.com, Inc.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">2. Information Collected</h2>
          <p>
            When utilizing this application, the following information is securely stored in your personal Supabase database instance:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-400 pl-2">
            <li>User profile metadata (email address, optional display name).</li>
            <li>User tasks, reminders, and notes created via voice or text input.</li>
            <li>Conversation message history and tool execution audit events.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">3. Data Isolation & Row Level Security (RLS)</h2>
          <p>
            All application tables are protected by PostgreSQL Row Level Security (RLS). Ordinary users can only query, insert, or modify records matching their authenticated identity (JWT). Model-supplied identities are never trusted as proof of authorization.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">4. Voice & Speech Processing</h2>
          <p>
            Speech recognition and speech synthesis occur locally within your browser using the standard Web Speech API. Audio streams are not recorded or transmitted to third-party ad networks. Text prompts are sent via HTTPS to Google Gemini solely to process tool calling and conversation response synthesis.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">5. Account Linking & OAuth 2.1</h2>
          <p>
            For Amazon Alexa+ Add-on evaluation, OAuth 2.1 authorization code flow with PKCE (RFC 7636) is supported. Tokens are strictly scoped to the personal assistant capability.
          </p>
        </section>
      </div>
    </div>
  );
};
