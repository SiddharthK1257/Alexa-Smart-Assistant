import React, { useState } from 'react';
import { Lock, Sparkles, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallbackTitle = 'Authentication Required',
  fallbackDescription = 'This section connects directly to your private Supabase PostgreSQL records with Row Level Security (RLS). Please sign in to access your data.',
}) => {
  const { user, isLoading, quickDemoLogin } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
        <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mb-4" />
        <p className="text-xs text-gray-400 font-mono">Verifying Supabase user session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <div className="max-w-md w-full bg-[#111827]/80 border border-gray-800 rounded-2xl p-8 space-y-6 shadow-2xl backdrop-blur-sm">
          {/* Lock Icon Emblem */}
          <div className="mx-auto w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Lock className="w-7 h-7 text-cyan-400" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white tracking-tight">{fallbackTitle}</h3>
            <p className="text-xs text-gray-400 leading-relaxed">{fallbackDescription}</p>
          </div>

          {/* Quick Demo Access Bar */}
          <div className="space-y-3 pt-2">
            <button
              onClick={async () => {
                setIsSubmitting(true);
                try {
                  await quickDemoLogin();
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs tracking-wide shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 fill-black" />
              <span>⚡ One-Click Verified Demo Login</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full py-3 rounded-xl bg-[#1F2937] hover:bg-gray-800 border border-gray-700 text-gray-200 text-xs font-semibold transition-all flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4 text-cyan-400" />
              <span>Sign In with Email / Register</span>
            </button>
          </div>

          <div className="pt-2 border-t border-gray-800/80 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Protected by PostgreSQL Row Level Security (RLS)</span>
          </div>
        </div>

        <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    );
  }

  return <>{children}</>;
};
