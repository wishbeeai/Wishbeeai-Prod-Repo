'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resending, setResending] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { signIn, signUp, resendConfirmationEmail, resetPasswordForEmail } = useAuth();
  const router = useRouter();

  const isEmailNotConfirmedError = (msg: string) => {
    const m = (msg || '').toLowerCase();
    return m.includes('confirm') || m.includes('verified');
  };

  const handleResendConfirmation = async () => {
    if (!email?.trim()) return;
    setError('');
    setResending(true);
    try {
      await resendConfirmationEmail(email.trim().toLowerCase());
      setSuccessMessage('A new confirmation link was sent to your email. Check your inbox and spam folder.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend. Try again.');
    } finally {
      setResending(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email?.trim()) {
      setError('Enter your email to receive a password reset link.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPasswordForEmail(email.trim().toLowerCase());
      setResetSent(true);
      setSuccessMessage('Check your email (and spam folder) for a link to reset your password.');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setResetSent(false);
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (isSignUp) {
        const result = await signUp(normalizedEmail, password, name);
        if (result.needsEmailConfirmation) {
          setSuccessMessage('Account created! Please check your email (and spam folder) and click the verification link. You can sign in after confirming.');
          setPassword('');
          return;
        }
        router.push('/profile');
        onClose();
        setEmail('');
        setPassword('');
        setName('');
      } else {
        await signIn(normalizedEmail, password);
        router.push('/profile');
        onClose();
        setEmail('');
        setPassword('');
      }
    } catch (err: any) {
      const msg = err?.message || 'An error occurred';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <Dialog open={isOpen} onOpenChange={() => { setShowForgotPassword(false); setResetSent(false); setError(''); setSuccessMessage(''); onClose(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
          </DialogHeader>
          {resetSent ? (
            <div className="space-y-4">
              <div className="text-sm text-green-700 bg-green-50 border border-green-200 p-3 rounded">
                Check your email (and spam folder) for a link to reset your password. Then sign in with your new password.
              </div>
              <Button type="button" variant="outline" className="w-full" onClick={() => { setShowForgotPassword(false); setResetSent(false); }}>
                Back to Sign in
              </Button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="mt-1"
                />
              </div>
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded">{error}</div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending…' : 'Send reset link'}
              </Button>
              <button
                type="button"
                onClick={() => { setShowForgotPassword(false); setError(''); }}
                className="w-full text-center text-sm text-muted-foreground hover:underline"
              >
                Back to Sign in
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isSignUp ? 'Create Account' : 'Sign In'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your name"
              />
            </div>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!showForgotPassword}
              placeholder="••••••••"
              minLength={6}
            />
            {!isSignUp && (
              <button
                type="button"
                onClick={() => { setShowForgotPassword(true); setError(''); setSuccessMessage(''); }}
                className="mt-1 text-xs text-muted-foreground hover:underline"
              >
                Forgot password?
              </button>
            )}
          </div>

          {successMessage && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 p-3 rounded">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded">
              {error}
              {isEmailNotConfirmedError(error) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full border-amber-500 text-amber-700 hover:bg-amber-50"
                  onClick={handleResendConfirmation}
                  disabled={resending || !email?.trim()}
                >
                  {resending ? 'Sending…' : 'Resend confirmation email'}
                </Button>
              )}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </Button>

          <div className="text-center text-sm">
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="text-primary hover:underline"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className="text-primary hover:underline"
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
