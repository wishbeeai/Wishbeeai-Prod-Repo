"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, UserPlus, ExternalLink } from "lucide-react"
import Link from "next/link"

const ADMIN_EMAIL = "wishbeeai@gmail.com"

export default function CreateAccountPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-[#654321] flex items-center gap-2">
            <UserPlus className="w-6 h-6" />
            Create Admin Account Directly in Supabase
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Since email verification/reset emails aren't working, create the account directly in Supabase Dashboard.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-[#654321]">Method 1: Create User in Supabase Dashboard (Easiest)</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>Go to your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">Supabase Dashboard</a></li>
              <li>Select your project</li>
              <li>Navigate to <strong>Authentication</strong> → <strong>Users</strong></li>
              <li>Click the <strong>"Add user"</strong> or <strong>"Create user"</strong> button</li>
              <li>Enter the following:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>Email: <strong className="bg-yellow-100 px-1 rounded">{ADMIN_EMAIL}</strong></li>
                  <li>Password: (choose a strong password, at least 8 characters)</li>
                  <li>Check <strong>"Auto Confirm User"</strong> or ensure email is marked as confirmed</li>
                </ul>
              </li>
              <li>Click <strong>"Create user"</strong></li>
              <li>Now go back to your site and log in with those credentials</li>
            </ol>
            <Button
              variant="outline"
              className="mt-2"
              onClick={() => window.open("https://supabase.com/dashboard", "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Supabase Dashboard
            </Button>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-lg text-[#654321]">Method 2: Use SQL Editor (Alternative)</h3>
            <p className="text-gray-700">If Method 1 doesn't work, you can create the user via SQL:</p>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>Go to <strong>SQL Editor</strong> in Supabase Dashboard</li>
              <li>Run this SQL (replace YOUR_PASSWORD_HASH with a bcrypt hash):
                <div className="bg-gray-100 p-3 rounded mt-2 font-mono text-xs overflow-x-auto">
                  <pre>{`-- This will create the user (you'll need to hash the password first)
-- Or use Supabase's built-in user creation in Authentication > Users instead
SELECT auth.users`}</pre>
                </div>
              </li>
              <li>Actually, just use Method 1 - it's much easier!</li>
            </ol>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-lg text-[#654321]">After Creating the Account</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>Make sure email confirmation is disabled (Authentication → Settings → Email Auth → Toggle OFF "Confirm email")</li>
              <li>Go back to your website</li>
              <li>Click "Sign In"</li>
              <li>Enter email: <strong>{ADMIN_EMAIL}</strong></li>
              <li>Enter the password you set in Supabase Dashboard</li>
              <li>You should now be able to log in!</li>
            </ol>
          </div>

          <div className="pt-4 border-t">
            <div className="flex gap-3">
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full border-[#8B4513] text-[#8B4513] hover:bg-[#8B4513] hover:text-white">
                  Go to Home
                </Button>
              </Link>
              <Link href="/admin/troubleshoot" className="flex-1">
                <Button variant="outline" className="w-full border-[#8B4513] text-[#8B4513] hover:bg-[#8B4513] hover:text-white">
                  Back to Troubleshoot
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



