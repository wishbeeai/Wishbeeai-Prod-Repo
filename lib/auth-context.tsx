'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

function isInvalidRefreshTokenError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes('Refresh Token') ||
    msg.includes('refresh_token') ||
    msg.includes('refresh token not found') ||
    msg.includes('invalid refresh token')
  );
}

export type SignUpResult = { session: unknown; needsEmailConfirmation: boolean };

/** Normalize email for auth (trim + lowercase) so login works regardless of casing. */
function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  resendConfirmationEmail: (email: string) => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const normalized = normalizeEmail(email);
    const { error } = await supabase.auth.signInWithPassword({
      email: normalized,
      password,
    });
    if (error) {
      const msg = error.message?.toLowerCase() ?? '';
      if (msg.includes('email') && (msg.includes('confirm') || msg.includes('verified'))) {
        throw new Error('Please confirm your email first. Check your inbox (and spam) for the verification link, or use "Resend confirmation" below.');
      }
      if (msg.includes('invalid') && (msg.includes('credentials') || msg.includes('login'))) {
        throw new Error('Invalid email or password. Try "Forgot password?" to reset, or check your email is correct.');
      }
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<SignUpResult> => {
    const normalized = normalizeEmail(email);
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : undefined;
    const { data, error } = await supabase.auth.signUp({
      email: normalized,
      password,
      options: {
        data: { name },
        emailRedirectTo: redirectTo,
      },
    });
    if (error) throw error;

    if (data.user) {
      try {
        await supabase.from('profiles').insert([
          {
            id: data.user.id,
            email: data.user.email ?? normalized,
            name,
          },
        ]);
      } catch (e) {
        // Profile may already exist; allow login flow to continue
      }
    }

    const hasSession = !!data.session;
    return {
      session: data.session,
      needsEmailConfirmation: !hasSession,
    };
  };

  const resendConfirmationEmail = async (email: string) => {
    const normalized = normalizeEmail(email);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: normalized,
    });
    if (error) throw error;
  };

  const resetPasswordForEmail = async (email: string) => {
    const normalized = normalizeEmail(email);
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(normalized, {
      redirectTo,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error && !isInvalidRefreshTokenError(error)) throw error;
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, resendConfirmationEmail, resetPasswordForEmail }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
