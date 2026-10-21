import { createClient } from '@supabase/supabase-js';

// Supabase URL & Publishable Key (Safe for client-side use)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://qlwzprsqudhzqzxyzmyf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_Kt2zjmH9zSjU13qS8nqn6Q_SLcOuob8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
