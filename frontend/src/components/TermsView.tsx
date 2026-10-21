import React from 'react';
import { FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TermsView: React.FC = () => {
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
          <FileText className="w-3.5 h-3.5" />
          <span>Terms of Use</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Terms of Use</h1>
        <p className="text-xs text-gray-400 mt-1">
          Effective Date: October 21, 2026 | Alexa+ Smart Assistant (Supabase Edition)
        </p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-gray-300">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">1. Permitted Use & Prototype License</h2>
          <p>
            This application is provided solely for software development evaluation, hackathon judging, and Model Context Protocol (MCP) tool integration testing. You agree to use the software in accordance with applicable laws and acceptable use guidelines.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">2. Intellectual Property Disclaimer</h2>
          <p>
            "Alexa" is a registered trademark of Amazon.com, Inc. The Alexa+ Smart Assistant prototype is an independent development exercise utilizing standard open protocols and has not been vetted, endorsed, or authorized by Amazon.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">3. Warranty Disclaimer</h2>
          <p>
            THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">4. API & External Service Quotas</h2>
          <p>
            Usage of external AI models (including Google Gemini) is subject to rate limiting and upstream API availability. The software includes built-in fallback intent routers to guarantee continuity of task and reminder operations.
          </p>
        </section>
      </div>
    </div>
  );
};
