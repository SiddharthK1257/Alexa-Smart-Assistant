import React, { useState } from 'react';
import { X, Lock, Mail, User, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, signUp, quickDemoLogin } = useAuth();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (tab === 'signin') {
        await login(email, password);
      } else {
        await signUp(email, password, displayName);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await quickDemoLogin();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-gray-700 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-100">
              {tab === 'signin' ? 'Sign In to Alexa+' : 'Create Your Account'}
            </h2>
          </div>
          <p className="text-xs text-gray-400">
            Powered by Supabase Auth with PostgreSQL Row Level Security
          </p>
        </div>

        {/* Instant Demo Login Button */}
        <div className="bg-[#1F2937]/50 border border-cyan-500/30 rounded-xl p-3 text-center space-y-2">
          <p className="text-xs text-gray-300">
            Evaluating the assistant? Use one-click verified access:
          </p>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-xs tracking-wide shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>⚡ Instant Demo Login (Pre-seeded Account)</span>
          </button>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-gray-800 w-full" />
          <span className="bg-[#111827] px-3 text-[11px] text-gray-500 uppercase tracking-wider">
            or continue with email
          </span>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-[#0B0F19] p-1 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => { setTab('signin'); setError(null); }}
            className={`py-1.5 rounded-lg font-medium transition-colors ${
              tab === 'signin' ? 'bg-[#1F2937] text-cyan-300 shadow' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab('signup'); setError(null); }}
            className={`py-1.5 rounded-lg font-medium transition-colors ${
              tab === 'signup' ? 'bg-[#1F2937] text-cyan-300 shadow' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-500/30 p-2.5 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {tab === 'signup' && (
            <div>
              <label className="block text-gray-400 mb-1">Full Name</label>
              <div className="flex items-center gap-2 bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-gray-100">
                <User className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                  className="bg-transparent border-none outline-none w-full text-xs text-gray-100"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-gray-400 mb-1">Email Address</label>
            <div className="flex items-center gap-2 bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-gray-100">
              <Mail className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="bg-transparent border-none outline-none w-full text-xs text-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-400 mb-1">Password</label>
            <div className="flex items-center gap-2 bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-gray-100">
              <Lock className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-transparent border-none outline-none w-full text-xs text-gray-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 mt-2"
          >
            {isSubmitting
              ? 'Authenticating...'
              : tab === 'signin'
              ? 'Sign In'
              : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};
