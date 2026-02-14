"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface TwoFactorEnrollDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function TwoFactorEnrollDialog({ open, onOpenChange, onSuccess }: TwoFactorEnrollDialogProps) {
  const [step, setStep] = useState<"loading" | "qr" | "verify" | "error">("loading")
  const [qrDataUrl, setQrDataUrl] = useState("")
  const [secret, setSecret] = useState("")
  const [factorId, setFactorId] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    if (!open) return
    setStep("loading")
    setError("")
    setCode("")
    setQrDataUrl("")
    setSecret("")
    setFactorId("")
    const supabase = createClient()
    supabase.auth.mfa
      .enroll({
        factorType: "totp",
        issuer: "Wishbee",
        friendlyName: "Wishbee Authenticator",
      })
      .then(({ data, error: enrollError }) => {
        if (enrollError) {
          setError(enrollError.message)
          setStep("error")
          return
        }
        if (data?.totp?.qr_code) {
          const svg = data.totp.qr_code
          setQrDataUrl("data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg))))
        }
        if (data?.totp?.secret) setSecret(data.totp.secret)
        if (data?.id) setFactorId(data.id)
        setStep("qr")
      })
      .catch((err) => {
        setError(err?.message ?? "Failed to start enrollment")
        setStep("error")
      })
  }, [open])

  const handleVerify = async () => {
    if (!factorId || !code.trim()) return
    setVerifying(true)
    setError("")
    const supabase = createClient()
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    })
    if (challengeError) {
      setError(challengeError.message)
      setVerifying(false)
      return
    }
    const challengeId = challengeData?.id
    if (!challengeId) {
      setError("Could not create challenge")
      setVerifying(false)
      return
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code: code.trim(),
    })
    setVerifying(false)
    if (verifyError) {
      setError(verifyError.message)
      return
    }
    onSuccess()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Two-Factor Authentication</DialogTitle>
          <DialogDescription>
            {step === "loading" && "Preparing your authenticator setup…"}
            {step === "qr" && "Scan the QR code with your authenticator app, then enter the 6-digit code below."}
            {step === "verify" && "Enter the 6-digit code from your app."}
            {step === "error" && "Something went wrong. You can try again or cancel."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {step === "loading" && (
            <div className="flex justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-[#DAA520]" />
            </div>
          )}
          {step === "qr" && (
            <>
              {qrDataUrl && (
                <div className="flex justify-center">
                  <img src={qrDataUrl} alt="QR code" className="h-44 w-44 rounded border border-[#DAA520]/30" />
                </div>
              )}
              {secret && (
                <p className="text-center text-xs text-[#8B4513]/80">
                  Or enter this secret manually: <code className="break-all font-mono text-[10px]">{secret}</code>
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="mfa-code">Verification code</Label>
                <Input
                  id="mfa-code"
                  placeholder="000000"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="font-mono text-center text-lg tracking-widest"
                />
              </div>
            </>
          )}
          {step === "error" && (
            <p className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>
          )}
          {(step === "qr" || step === "verify") && error && (
            <p className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {step === "qr" && (
            <Button
              type="button"
              onClick={handleVerify}
              disabled={code.length !== 6 || verifying}
              className="bg-[#DAA520] text-[#3B2F0F] hover:bg-[#c49420]"
            >
              {verifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying…
                </>
              ) : (
                "Enable 2FA"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export async function unenrollTwoFactor(): Promise<{ error?: string }> {
  const supabase = createClient()
  const { data: factors } = await supabase.auth.mfa.listFactors()
  const totpFactor = factors?.totp?.[0]
  if (!totpFactor?.id) {
    return { error: "No authenticator found to remove." }
  }
  const { error } = await supabase.auth.mfa.unenroll({ factorId: totpFactor.id })
  return error ? { error: error.message } : {}
}
