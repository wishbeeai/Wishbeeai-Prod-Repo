"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

/**
 * When the user is signed in but has MFA enrolled and has not verified this session (aal1 -> aal2),
 * shows the MFA code entry screen. Otherwise renders children.
 */
export function MfaGate({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, needsMfaVerification, verifyMfa } = useAuth()
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [verifying, setVerifying] = useState(false)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || code.replace(/\D/g, "").length !== 6) return
    setError("")
    setVerifying(true)
    try {
      await verifyMfa(code.trim())
      setCode("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code. Try again.")
    } finally {
      setVerifying(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F1E8]">
        <Loader2 className="h-8 w-8 animate-spin text-[#DAA520]" />
      </div>
    )
  }

  if (needsMfaVerification && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F1E8] p-4">
        <div className="w-full max-w-sm rounded-xl border-2 border-[#DAA520]/20 bg-white p-6 shadow-lg">
          <h1 className="text-lg font-bold text-[#654321] mb-1">Two-Factor Authentication</h1>
          <p className="text-sm text-[#8B4513]/80 mb-4">
            Enter the 6-digit code from your authenticator app to continue.
          </p>
          <form onSubmit={handleVerify} className="space-y-4">
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
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="mt-1 font-mono text-center text-lg tracking-widest"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600" role="alert">{error}</p>
            )}
            <Button
              type="submit"
              disabled={code.replace(/\D/g, "").length !== 6 || verifying}
              className="w-full bg-[#DAA520] text-[#3B2F0F] hover:bg-[#c49420]"
            >
              {verifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying…
                </>
              ) : (
                "Verify"
              )}
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
