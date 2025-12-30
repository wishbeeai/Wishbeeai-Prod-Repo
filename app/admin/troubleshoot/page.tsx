"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Mail, RefreshCw, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

const ADMIN_EMAIL = "wishbeeai@gmail.com"

export default function AdminTroubleshootPage() {
  const router = useRouter()
  const [email, setEmail] = useState(ADMIN_EMAIL)
  const [newPassword, setNewPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info")

  const handlePasswordReset = async () => {
    setLoading(true)
    setMessage("")
    
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`Password reset email sent to ${email}. Please check your inbox and spam folder.`)
        setMessageType("success")
      } else {
        setMessage(data.error || "Failed to send password reset email")
        setMessageType("error")
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.")
      setMessageType("error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-[#654321]">
            Admin Login Troubleshooting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              If you're getting "Invalid email or password" errors, try the solutions below.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-[#654321]">Step 1: Disable Email Confirmation (Quickest Fix)</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Supabase Dashboard</a></li>
              <li>Select your project</li>
              <li>Go to <strong>Authentication</strong> → <strong>Settings</strong></li>
              <li>Scroll to <strong>Email Auth</strong> section</li>
              <li><strong>Toggle OFF</strong> "Confirm email"</li>
              <li>Click <strong>Save</strong></li>
              <li>Try signing up again with {ADMIN_EMAIL}</li>
            </ol>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-lg text-[#654321]">Step 2: Reset Password</h3>
            <p className="text-gray-700">If the account exists but you forgot the password:</p>
            <div className="space-y-3">
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled
              />
              <Button
                onClick={handlePasswordReset}
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:from-[#F4C430] hover:to-[#DAA520]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Password Reset Email
                  </>
                )}
              </Button>
              {message && (
                <Alert className={messageType === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
                  {messageType === "success" ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={messageType === "success" ? "text-green-800" : "text-red-800"}>
                    {message}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-lg text-[#654321]">Step 3: Create Account in Supabase Dashboard (Recommended)</h3>
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Email isn't working?</strong> Since password reset emails aren't being received, create the account directly in Supabase Dashboard instead.
              </AlertDescription>
            </Alert>
            <Link href="/admin/create-account">
              <Button className="w-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:from-[#F4C430] hover:to-[#DAA520] mb-4">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Step-by-Step Guide to Create Account in Supabase
              </Button>
            </Link>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-lg text-[#654321]">Step 4: Create Account via Website (If Step 3 doesn't work)</h3>
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Important:</strong> If you're getting "Invalid email or password" and email confirmation is disabled, 
                the account likely doesn't exist yet. You need to <strong>sign up first</strong> before you can log in.
              </AlertDescription>
            </Alert>
            <p className="text-gray-700 font-medium">Follow these steps:</p>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>Make sure email confirmation is disabled (Step 1 above)</li>
              <li>Go to the homepage and click <strong>"Sign Up"</strong> (not "Sign In")</li>
              <li>Use email: <strong className="bg-yellow-100 px-1 rounded">{ADMIN_EMAIL}</strong></li>
              <li>Choose a strong password (at least 8 characters)</li>
              <li>Enter your name</li>
              <li>Click "Sign Up"</li>
              <li>After signing up successfully, you should be automatically logged in OR you can now log in with those credentials</li>
            </ol>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> If you see "User already registered" when trying to sign up, that means the account exists 
                and you should use the password reset option (Step 2) instead.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex gap-3">
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full border-[#8B4513] text-[#8B4513] hover:bg-[#8B4513] hover:text-white">
                  Go to Home
                </Button>
              </Link>
              <Link href="/admin/setup" className="flex-1">
                <Button className="w-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:from-[#F4C430] hover:to-[#DAA520]">
                  View Setup Guide
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

