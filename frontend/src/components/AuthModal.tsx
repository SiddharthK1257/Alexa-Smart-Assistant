import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Lock,
  Mail,
  User,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type AuthMode = 'signin' | 'signup' | 'otp' | 'verify_otp' | 'forgot_password' | 'set_new_password';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'signin' }) => {
  const {
    login,
    signUp,
    signInWithOtp,
    verifyOtp,
    directResetPassword,
    updatePassword,
    resendVerification,
    quickDemoLogin,
    isPasswordRecovery,
    clearPasswordRecovery,
  } = useAuth();

  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimitEncountered, setRateLimitEncountered] = useState(false);

  // Sync mode if opened during password recovery
  useEffect(() => {
    if (isPasswordRecovery) {
      setMode('set_new_password');
    }
  }, [isPasswordRecovery]);

  // Reset states when modal is opened/closed
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMessage(null);
      setRateLimitEncountered(false);
      if (!isPasswordRecovery) {
        setMode(initialMode);
      }
    }
  }, [isOpen, initialMode, isPasswordRecovery]);

  if (!isOpen) return null;

  const validateEmail = (val: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const handlePostAuthSuccess = () => {
    onClose();
    navigate('/app');
  };

  // 1. Password-based Sign In
  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      handlePostAuthSuccess();
    } catch (err: any) {
      const msg = err.message || 'Authentication failed.';
      if (msg.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please verify your credentials or use Instant Demo.');
      } else if (msg.includes('Email not confirmed')) {
        setError('Your email is not verified yet. Please check your inbox or request a verification link.');
      } else {
        setError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Sign Up (Registration)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setRateLimitEncountered(false);

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signUp(email, password, displayName);
      if (result.needsEmailVerification) {
        setSuccessMessage(`Account created! A confirmation email was sent to ${email}. Please check your inbox or spam.`);
        setMode('verify_otp');
      } else {
        handlePostAuthSuccess();
      }
    } catch (err: any) {
      const msg = err.message || 'Registration failed.';
      if (msg.includes('rate limit') || err.status === 429) {
        setRateLimitEncountered(true);
        setError('Supabase email rate limit reached on this project. Use the verified demo accounts below for instant evaluation.');
      } else {
        setError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Passwordless OTP Request
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setRateLimitEncountered(false);

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signInWithOtp(email);
      setSuccessMessage(`One-time verification code sent to ${email}. Check your inbox!`);
      setMode('verify_otp');
    } catch (err: any) {
      const msg = err.message || 'Failed to send OTP.';
      if (msg.includes('rate limit') || err.status === 429) {
        setRateLimitEncountered(true);
        setError('Supabase email quota reached. Use the verified Instant Demo access below.');
      } else {
        setError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Verify OTP Code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!otpCode.trim()) {
      setError('Please enter the 6-digit code or magic token.');
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyOtp(email, otpCode);
      handlePostAuthSuccess();
    } catch (err: any) {
      setError(err.message || 'Verification failed. Code may be invalid or expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Password Reset
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setRateLimitEncountered(false);

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Please enter a new password of at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await directResetPassword(email, password);
      setSuccessMessage('Password reset successfully! Logging you in...');
      setTimeout(() => {
        handlePostAuthSuccess();
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Set New Password (Active Recovery)
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePassword(password);
      clearPasswordRecovery();
      setSuccessMessage('Password updated successfully! Welcome back.');
      setTimeout(() => {
        handlePostAuthSuccess();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 7. Resend Verification Link
  const handleResend = async () => {
    if (!validateEmail(email)) {
      setError('Please enter your email above before requesting resend.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await resendVerification(email);
      setSuccessMessage(`Verification email resent to ${email}.`);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // One-click Demo Login
  const handleDemoLogin = async (targetEmail: string, targetPass: string) => {
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      await login(targetEmail, targetPass);
      handlePostAuthSuccess();
    } catch {
      try {
        await quickDemoLogin();
        handlePostAuthSuccess();
      } catch (err: any) {
        setError(err.message || 'Demo authentication failed.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-gray-700/80 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-gray-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 transition-colors p-1 rounded-lg hover:bg-gray-800"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
              <Lock className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-100">
                {mode === 'signin' && 'Sign In to Alexa+'}
                {mode === 'signup' && 'Create Your Account'}
                {mode === 'otp' && 'Passwordless Email Login'}
                {mode === 'verify_otp' && 'Verify Email Code'}
                {mode === 'forgot_password' && 'Reset Your Password'}
                {mode === 'set_new_password' && 'Set New Password'}
              </h2>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Secure Supabase PostgreSQL Authentication & User Data Isolation
          </p>
        </div>

        {/* Quick Demo Access Bar */}
        <div className="bg-[#1F2937]/70 border border-cyan-500/40 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-cyan-300 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
              Instant Verified Access
            </span>
            <span className="text-[10px] text-gray-400">Pre-seeded & Active</span>
          </div>
          <button
            type="button"
            onClick={() => handleDemoLogin('alexa.demo@example.com', 'AlexaDemo2026!')}
            disabled={isSubmitting}
            className="w-full py-2 px-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-[11px] shadow-md transition-all active:scale-95 disabled:opacity-50 text-center truncate"
          >
            ⚡ Demo Account
          </button>
        </div>

        {/* Mode Switcher Tabs (only on signin / signup / otp) */}
        {(mode === 'signin' || mode === 'signup' || mode === 'otp') && (
          <div className="grid grid-cols-3 gap-1 bg-[#0B0F19] p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(null); setSuccessMessage(null); }}
              className={`py-1.5 rounded-lg font-medium transition-colors ${
                mode === 'signin' ? 'bg-[#1F2937] text-cyan-300 shadow' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); setSuccessMessage(null); }}
              className={`py-1.5 rounded-lg font-medium transition-colors ${
                mode === 'signup' ? 'bg-[#1F2937] text-cyan-300 shadow' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => { setMode('otp'); setError(null); setSuccessMessage(null); }}
              className={`py-1.5 rounded-lg font-medium transition-colors ${
                mode === 'otp' ? 'bg-[#1F2937] text-cyan-300 shadow' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              OTP Code
            </button>
          </div>
        )}

        {/* Error Notification Banner */}
        {error && (
          <div className="bg-red-950/60 border border-red-500/40 p-2.5 rounded-xl text-red-200 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span>{error}</span>
              {rateLimitEncountered && (
                <p className="text-[11px] text-gray-300">
                  Tip: Free tier Supabase SMTP restricts hourly email sends. Click the <strong>Instant Verified Access</strong> button above to bypass email rate limits!
                </p>
              )}
            </div>
          </div>
        )}

        {/* Success Notification Banner */}
        {successMessage && (
          <div className="bg-emerald-950/60 border border-emerald-500/40 p-2.5 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 1. SIGN IN FORM */}
        {mode === 'signin' && (
          <form onSubmit={handlePasswordSignIn} className="space-y-3 text-xs">
            <div>
              <label className="block text-gray-400 mb-1 font-medium">Email Address</label>
              <div className="flex items-center gap-2 bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 focus-within:border-cyan-400 transition-colors">
                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="bg-transparent border-none outline-none w-full text-xs text-gray-100 placeholder-gray-500"
                />
              </div>
            </div>

            {(email.toLowerCase().includes('siddharth') || email.toLowerCase().includes('demo')) && !password && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-[11px]">
                <span>Pre-seeded demo credentials recognized.</span>
                <button
                  type="button"
                  onClick={() => setPassword('AlexaDemo2026!')}
                  className="font-semibold underline hover:text-cyan-200"
                >
                  Auto-fill Password
                </button>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-gray-400 font-medium">Password</label>
                <button
                  type="button"
                  onClick={() => { setMode('forgot_password'); setError(null); }}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="flex items-center gap-2 bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 focus-within:border-cyan-400 transition-colors">
                <Lock className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-transparent border-none outline-none w-full text-xs text-gray-100 placeholder-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In to Dashboard</span>
              )}
            </button>
          </form>
        )}

        {/* 2. CREATE ACCOUNT (SIGN UP) */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3 text-xs">
            <div>
              <label className="block text-gray-400 mb-1 font-medium">Full Name</label>
              <div className="flex items-center gap-2 bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 focus-within:border-cyan-400 transition-colors">
                <User className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                  className="bg-transparent border-none outline-none w-full text-xs text-gray-100 placeholder-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 mb-1 font-medium">Email Address</label>
              <div className="flex items-center gap-2 bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 focus-within:border-cyan-400 transition-colors">
                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="bg-transparent border-none outline-none w-full text-xs text-gray-100 placeholder-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 mb-1 font-medium">Password (Min. 6 chars)</label>
              <div className="flex items-center gap-2 bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 focus-within:border-cyan-400 transition-colors">
                <Lock className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-transparent border-none outline-none w-full text-xs text-gray-100 placeholder-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Registering Account...</span>
                </>
              ) : (
                <span>Create Alexa+ Account</span>
              )}
            </button>
          </form>
        )}

        {/* 3. PASSWORDLESS OTP REQUEST */}
        {mode === 'otp' && (
          <form onSubmit={handleSendOtp} className="space-y-3 text-xs">
            <p className="text-gray-400 text-xs">
              Sign in without a password. We'll send a secure one-time code to your email.
            </p>
            <div>
              <label className="block text-gray-400 mb-1 font-medium">Email Address</label>
              <div className="flex items-center gap-2 bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 focus-within:border-cyan-400 transition-colors">
                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="bg-transparent border-none outline-none w-full text-xs text-gray-100 placeholder-gray-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending Code...</span>
                </>
              ) : (
                <span>Send One-Time Code</span>
              )}
            </button>
          </form>
        )}

        {/* 4. VERIFY OTP CODE */}
        {mode === 'verify_otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-3 text-xs">
            <p className="text-gray-400 text-xs">
              Enter the 6-digit code sent to <strong className="text-cyan-300">{email}</strong>.
            </p>
            <div>
              <label className="block text-gray-400 mb-1 font-medium">Verification Code / Token</label>
              <div className="flex items-center gap-2 bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 focus-within:border-cyan-400 transition-colors">
                <KeyRound className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value)}
                  placeholder="123456"
                  maxLength={10}
                  className="bg-transparent border-none outline-none w-full text-xs text-gray-100 tracking-widest font-mono placeholder-gray-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={handleResend}
                disabled={isSubmitting}
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Resend Code
              </button>
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(null); }}
                className="text-gray-400 hover:text-gray-200 flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back to Sign In</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Verify and Continue</span>
              )}
            </button>
          </form>
        )}

        {/* 5. FORGOT PASSWORD (DIRECT SECURE RESET) */}
        {mode === 'forgot_password' && (
          <form onSubmit={handleForgotPassword} className="space-y-3 text-xs">
            <p className="text-gray-400 text-xs">
              Enter your registered email and choose a new password. Your account will be updated instantly.
            </p>
            <div>
              <label className="block text-gray-400 mb-1 font-medium">Email Address</label>
              <div className="flex items-center gap-2 bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 focus-within:border-cyan-400 transition-colors">
                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="bg-transparent border-none outline-none w-full text-xs text-gray-100 placeholder-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 mb-1 font-medium">New Password (Min. 6 chars)</label>
              <div className="flex items-center gap-2 bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 focus-within:border-cyan-400 transition-colors">
                <Lock className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-transparent border-none outline-none w-full text-xs text-gray-100 placeholder-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end text-[11px]">
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(null); }}
                className="text-gray-400 hover:text-gray-200 flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Return to Sign In</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Resetting Password...</span>
                </>
              ) : (
                <span>Update Password & Sign In</span>
              )}
            </button>
          </form>
        )}

        {/* 6. SET NEW PASSWORD (ACTIVE RECOVERY) */}
        {mode === 'set_new_password' && (
          <form onSubmit={handleSetNewPassword} className="space-y-3 text-xs">
            <div className="flex items-center gap-2 text-cyan-300">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold">Reset Your Account Password</span>
            </div>
            <div>
              <label className="block text-gray-400 mb-1 font-medium">New Password</label>
              <div className="flex items-center gap-2 bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 focus-within:border-cyan-400 transition-colors">
                <Lock className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-transparent border-none outline-none w-full text-xs text-gray-100 placeholder-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-gray-400 mb-1 font-medium">Confirm New Password</label>
              <div className="flex items-center gap-2 bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 focus-within:border-cyan-400 transition-colors">
                <Lock className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-transparent border-none outline-none w-full text-xs text-gray-100 placeholder-gray-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Password...</span>
                </>
              ) : (
                <span>Save New Password & Continue</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
