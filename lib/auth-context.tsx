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
  needsMfaVerification: boolean;
  verifyMfa: (code: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, options?: { phone?: string; location?: string }) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  resendConfirmationEmail: (email: string) => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsMfaVerification, setNeedsMfaVerification] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
      if (session?.user) {
        const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (mounted && data?.nextLevel === 'aal2' && data?.currentLevel !== 'aal2') {
          setNeedsMfaVerification(true);
        }
      }
    };
    run();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data }) => {
          if (mounted && data?.nextLevel === 'aal2' && data?.currentLevel !== 'aal2') {
            setNeedsMfaVerification(true);
          } else if (mounted) {
            setNeedsMfaVerification(false);
          }
        });
      } else {
        setNeedsMfaVerification(false);
      }
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const verifyMfa = async (code: string) => {
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const totpFactor = factors?.totp?.[0];
    if (!totpFactor?.id) throw new Error('No authenticator found.');
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: totpFactor.id });
    if (challengeError) throw challengeError;
    const challengeId = challengeData?.id;
    if (!challengeId) throw new Error('Could not create challenge');
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: totpFactor.id,
      challengeId,
      code: code.trim(),
    });
    if (verifyError) throw verifyError;
    setNeedsMfaVerification(false);
  };

  const signIn = async (email: string, password: string) => {
    const normalized = normalizeEmail(email);
    const { error } = await supabase.auth.signInWithPassword({
      email: normalized,
      password,
    });
    if (error) {
      const code = (error as { code?: string }).code ?? '';
      const msg = error.message?.toLowerCase() ?? '';
      // Supabase returns email_not_confirmed when "Confirm email" is enabled and user hasn't verified
      if (code === 'email_not_confirmed' || (msg.includes('email') && (msg.includes('confirm') || msg.includes('verified')))) {
        throw new Error('Please confirm your email first. Check your inbox (and spam) for the verification link, or use "Resend confirmation" below.');
      }
      // invalid_credentials = wrong password, no user found, OR user signed up via OAuth (no password)
      if (code === 'invalid_credentials' || (msg.includes('invalid') && (msg.includes('credentials') || msg.includes('login')))) {
        throw new Error(
          'Invalid email or password. If you signed up with Google or another provider, use that to sign in. Otherwise try "Forgot password?" to reset.'
        );
      }
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string, options?: { phone?: string; location?: string }): Promise<SignUpResult> => {
    const normalized = normalizeEmail(email);
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : undefined;
    const { data, error } = await supabase.auth.signUp({
      email: normalized,
      password,
      options: {
        data: { name, phone: options?.phone, location: options?.location },
        emailRedirectTo: redirectTo,
      },
    });
    if (error) {
      const code = (error as { code?: string }).code ?? '';
      const msg = error.message ?? '';
      const status = (error as { status?: number }).status;
      if (code === 'email_address_not_authorized') {
        throw new Error(
          'This email cannot be used with the default email service. Configure custom SMTP in Supabase Dashboard (Auth → Settings) to allow signups, or use an email from your Supabase org.'
        );
      }
      if (code === 'email_exists' || code === 'user_already_exists') {
        throw new Error('An account with this email already exists. Try logging in or use "Forgot password" to reset.');
      }
      if (code === 'email_address_invalid') {
        throw new Error('Please enter a valid email address. Some domains (e.g. example.com) are not allowed.');
      }
      if (code === 'signup_disabled' || code === 'email_provider_disabled') {
        throw new Error('Sign ups are currently disabled. Contact support if this persists.');
      }
      if (code === 'weak_password') {
        throw new Error(msg || 'Password does not meet requirements. Use at least 8 characters with letters and numbers.');
      }
      if (code === 'over_email_send_rate_limit') {
        throw new Error('Too many signup attempts. Please wait a few minutes and try again.');
      }
      // 422: Supabase default SMTP only allows org member emails
      if (status === 422) {
        throw new Error(
          'Sign up failed. With Supabase default email, only org member addresses work. Set up Custom SMTP in Supabase Dashboard (Authentication → Settings → SMTP) to allow signups.'
        );
      }
      throw new Error(msg || 'Sign up failed. Try again.');
    }

    if (data.user) {
      try {
        await supabase.from('profiles').upsert(
          {
            id: data.user.id,
            email: data.user.email ?? normalized,
            name,
            phone: options?.phone?.trim() || null,
            location: options?.location?.trim() || null,
          },
          { onConflict: 'id' }
        );
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
    <AuthContext.Provider value={{ user, loading, needsMfaVerification, verifyMfa, signIn, signUp, signOut, resendConfirmationEmail, resetPasswordForEmail }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
