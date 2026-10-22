import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session, EmailOtpType } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { BACKEND_URL } from '../services/api';

export interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  avatar_url?: string | null;
  preferences?: {
    voice_muted: boolean;
    speech_rate: number;
    theme: string;
  };
  created_at?: string;
  updated_at?: string;
}

interface SignUpResult {
  needsEmailVerification: boolean;
  user: User | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  token: string | null;
  profile: UserProfile | null;
  isLoading: boolean;
  authError: string | null;
  isPasswordRecovery: boolean;
  clearError: () => void;
  clearPasswordRecovery: () => void;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<SignUpResult>;
  signInWithOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, token: string, type?: EmailOtpType) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  directResetPassword: (email: string, newPassword: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  quickDemoLogin: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  const clearPasswordRecovery = useCallback(() => {
    setIsPasswordRecovery(false);
  }, []);

  // Load profile helper with auto-fallback to user metadata
  const loadProfile = useCallback(async (userId: string, userRecord?: User | null) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data as UserProfile);
        return;
      }

      // If profile record isn't found in table, synthesize from user record
      if (userRecord) {
        const synthesized: UserProfile = {
          id: userRecord.id,
          email: userRecord.email || '',
          display_name:
            userRecord.user_metadata?.full_name ||
            userRecord.user_metadata?.display_name ||
            userRecord.email?.split('@')[0] ||
            'Alexa+ User',
          preferences: {
            voice_muted: false,
            speech_rate: 1.0,
            theme: 'alexa_dark',
          },
        };
        setProfile(synthesized);
      }
    } catch {
      // Non-fatal
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await loadProfile(user.id, user);
    }
  }, [user?.id, loadProfile]);

  useEffect(() => {
    // Check if URL hash indicates password recovery or auth callback
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash;
      if (hash.includes('type=recovery')) {
        setIsPasswordRecovery(true);
      }
    }

    // 1. Initial session check
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn('Initial session lookup warning:', error.message);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setToken(session?.access_token ?? null);
      if (session?.user) {
        loadProfile(session.user.id, session.user);
      }
      setIsLoading(false);
    });

    // 2. Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setToken(session?.access_token ?? null);

      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }

      if (session?.user) {
        await loadProfile(session.user.id, session.user);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Standard Email + Password Sign In
  const login = async (email: string, password: string) => {
    setAuthError(null);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      setAuthError(error.message);
      throw error;
    }

    if (data.session) {
      setSession(data.session);
      setUser(data.user);
      setToken(data.session.access_token);
      if (data.user) {
        await loadProfile(data.user.id, data.user);
      }
    }
  };

  // Sign Up with Email and Password (uses backend registration to ensure verified status, then signs in)
  const signUp = async (
    email: string,
    password: string,
    displayName?: string
  ): Promise<SignUpResult> => {
    setAuthError(null);
    const sanitizedEmail = email.trim().toLowerCase();
    const cleanName = displayName?.trim() || sanitizedEmail.split('@')[0];

    try {
      // First try reliable backend registration to guarantee verified status without SMTP rate limits
      const regRes = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: sanitizedEmail,
          password,
          displayName: cleanName,
        }),
      });

      const regData = await regRes.json().catch(() => ({}));

      if (!regRes.ok) {
        throw new Error(regData.message || regData.error || 'Registration failed');
      }

      // Immediately sign in with the created credentials to establish Supabase session
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });

      if (loginError) {
        throw loginError;
      }

      if (loginData.session) {
        setSession(loginData.session);
        setUser(loginData.user);
        setToken(loginData.session.access_token);
        if (loginData.user) {
          await loadProfile(loginData.user.id, loginData.user);
        }
      }

      return {
        needsEmailVerification: false,
        user: loginData.user,
      };
    } catch (backendErr: any) {
      // If error was that user already exists, bubble it up
      if (backendErr.message?.includes('already exists')) {
        setAuthError(backendErr.message);
        throw backendErr;
      }

      // Fallback to standard Supabase signUp if backend route is unavailable
      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            display_name: cleanName,
          },
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/app` : undefined,
        },
      });

      if (error) {
        setAuthError(error.message);
        throw error;
      }

      const needsEmailVerification = !data.session && !!data.user;

      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        setToken(data.session.access_token);
        if (data.user) {
          await loadProfile(data.user.id, data.user);
        }
      }

      return {
        needsEmailVerification,
        user: data.user,
      };
    }
  };

  // Direct Password Reset (bypasses SMTP rate limits)
  const directResetPassword = async (email: string, newPassword: string) => {
    setAuthError(null);
    const sanitizedEmail = email.trim().toLowerCase();

    const res = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: sanitizedEmail,
        newPassword,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data.message || data.error || 'Failed to reset password';
      setAuthError(msg);
      throw new Error(msg);
    }

    // Automatically sign in with the new password
    await login(sanitizedEmail, newPassword);
  };

  // Passwordless Email OTP / Magic Link Request
  const signInWithOtp = async (email: string) => {
    setAuthError(null);
    const sanitizedEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.signInWithOtp({
      email: sanitizedEmail,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/app` : undefined,
        shouldCreateUser: true,
      },
    });

    if (error) {
      setAuthError(error.message);
      throw error;
    }
  };

  // Verify OTP Token (6-digit code or magic token)
  const verifyOtp = async (email: string, tokenStr: string, type: EmailOtpType = 'email') => {
    setAuthError(null);
    const sanitizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.verifyOtp({
      email: sanitizedEmail,
      token: tokenStr.trim(),
      type,
    });

    if (error) {
      setAuthError(error.message);
      throw error;
    }

    if (data.session) {
      setSession(data.session);
      setUser(data.user);
      setToken(data.session.access_token);
      if (data.user) {
        await loadProfile(data.user.id, data.user);
      }
    }
  };

  // Forgot Password / Password Recovery Request
  const resetPassword = async (email: string) => {
    setAuthError(null);
    const sanitizedEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/app#type=recovery` : undefined,
    });

    if (error) {
      setAuthError(error.message);
      throw error;
    }
  };

  // Update Password after Recovery or in Settings
  const updatePassword = async (newPassword: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setAuthError(error.message);
      throw error;
    }

    setIsPasswordRecovery(false);
  };

  // Resend Email Verification Token
  const resendVerification = async (email: string) => {
    setAuthError(null);
    const sanitizedEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: sanitizedEmail,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/app` : undefined,
      },
    });

    if (error) {
      setAuthError(error.message);
      throw error;
    }
  };

  // Sign Out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Local clean-up even if network fails
    }
    setUser(null);
    setSession(null);
    setToken(null);
    setProfile(null);
    setAuthError(null);
    setIsPasswordRecovery(false);
  };

  // Instant Verified Demo Login for rapid zero-friction evaluation
  const quickDemoLogin = async () => {
    setAuthError(null);
    try {
      await login('alexa.demo@example.com', 'AlexaDemo2026!');
    } catch (err: any) {
      // Fallback to secondary test account
      try {
        await login('siddharthtiwary012@gmail.com', 'AlexaDemo2026!');
      } catch {
        throw err;
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        token,
        profile,
        isLoading,
        authError,
        isPasswordRecovery,
        clearError,
        clearPasswordRecovery,
        login,
        signUp,
        signInWithOtp,
        verifyOtp,
        resetPassword,
        directResetPassword,
        updatePassword,
        resendVerification,
        signOut,
        quickDemoLogin,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
