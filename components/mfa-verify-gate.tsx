'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * When the user is signed in but has not yet verified their MFA factor (aal1 -> aal2),
 * this gate blocks the app and shows a single form to enter the 6-digit code.
 */
export function MfaVerifyGate({ children }: { children: React.ReactNode }) {
  const { user, loading, needsMfaVerification, verifyMfa } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  if (loading || !user || !needsMfaVerification) {
    return <>{children}</>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (code.replace(/\D/g, '').length !== 6) {
      setError('Enter the 6-digit code from your authenticator app.');
      return;
    }
    setVerifying(true);
    try {
      await verifyMfa(code.replace(/\D/g, ''));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code. Try again.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F1E8] p-4">
      <div className="w-full max-w-sm rounded-xl border-2 border-[#DAA520]/20 bg-white p-6 shadow-lg">
        <h1 className="text-lg font-bold text-[#654321] mb-1">Two-factor authentication</h1>
        <p className="text-sm text-[#8B4513]/80 mb-4">
          Enter the 6-digit code from your authenticator app to continue.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="mfa-code" className="text-[#654321]">Verification code</Label>
            <Input
              id="mfa-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="mt-1 font-mono text-center text-lg tracking-widest"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">{error}</p>
          )}
          <Button
            type="submit"
            disabled={code.replace(/\D/g, '').length !== 6 || verifying}
            className="w-full bg-[#DAA520] text-[#3B2F0F] hover:bg-[#c49420]"
          >
            {verifying ? 'Verifying…' : 'Continue'}
          </Button>
        </form>
      </div>
    </div>
  );
}
