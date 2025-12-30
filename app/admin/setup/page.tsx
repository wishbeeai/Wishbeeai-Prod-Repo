"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Mail, ExternalLink } from "lucide-react"
import Link from "next/link"

export default function AdminSetupPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-[#654321]">
            Admin Account Setup Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Email Verification Required</AlertTitle>
            <AlertDescription>
              Supabase requires email verification by default. To log in as admin, you need to verify your email address first.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-[#654321]">Option 1: Verify via Email (Recommended)</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Sign up with <strong>wishbeeai@gmail.com</strong></li>
              <li>Check your email inbox for a verification email from Supabase</li>
              <li>Click the verification link in the email</li>
              <li>Return to the site and log in</li>
            </ol>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-[#654321]">Option 2: Disable Email Confirmation (Development Only)</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Go to your Supabase Dashboard</li>
              <li>Navigate to <strong>Authentication</strong> → <strong>Settings</strong></li>
              <li>Find the <strong>Email Auth</strong> section</li>
              <li>Toggle off <strong>&quot;Confirm email&quot;</strong></li>
              <li>Save the changes</li>
              <li>Now you can sign up and log in immediately without email verification</li>
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

          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-[#654321]">Option 3: Manually Confirm in Supabase Dashboard</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Go to your Supabase Dashboard</li>
              <li>Navigate to <strong>Authentication</strong> → <strong>Users</strong></li>
              <li>Find the user with email: <strong>wishbeeai@gmail.com</strong></li>
              <li>Click on the user</li>
              <li>Look for the email confirmation status</li>
              <li>If unconfirmed, you can manually confirm it (this option may require admin privileges)</li>
            </ol>
          </div>

          <div className="pt-4 border-t">
            <Link href="/">
              <Button className="w-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:from-[#F4C430] hover:to-[#DAA520]">
                Go to Home Page
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



