"use client"

import type React from "react"

import { useState } from "react"
import { X, Mail, Lock, Eye, EyeOff, User, Phone, MapPin, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SignUpModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToLogin?: () => void
  onSignUpSuccess?: () => void
}

export function SignUpModal({ isOpen, onClose, onSwitchToLogin, onSignUpSuccess }: SignUpModalProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [location, setLocation] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      })
      return
    }

    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)

    toast({
      variant: "warm",
      title: (
        <span className="flex items-center gap-2 font-semibold">
          <CheckCircle className="h-4 w-4 shrink-0" />
          Account created!
        </span>
      ),
      description: "Welcome to Wishbee.ai — you're all set to start gifting together.",
    })

    if (onSignUpSuccess) {
      onSignUpSuccess()
    } else {
      onClose()
    }

    // Reset form
    setName("")
    setEmail("")
    setPhone("")
    setLocation("")
    setPassword("")
    setConfirmPassword("")
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header — same as Home page header (brown gradient) */}
        <div className="flex-shrink-0 w-full h-14 bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] px-4 border-b-2 border-[#4A2F1A] flex items-center justify-center relative">
          <h2 className="text-base font-bold text-[#F5DEB3]">Create Account</h2>
          <button
            onClick={onClose}
            className="absolute right-4 p-1.5 hover:bg-[#4A2F1A] rounded-full transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-[#F5DEB3]" />
          </button>
        </div>

        {/* Form — compact 2-column layout, no scroll */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col p-4 bg-gradient-to-br from-[#FEF7ED] via-[#FFF7ED] to-[#FFFBEB]">
          <p className="text-xs text-[#8B5A3C]/90 mb-3">Join Wishbee.ai and start gifting together</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 flex-1 min-h-0">
            {/* Full Name */}
            <div className="space-y-1">
              <label htmlFor="name" className="text-xs font-semibold text-[#654321]">Full Name</label>
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B5A3C]/70" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-8 pr-2 py-2 border-2 border-[#DAA520]/30 rounded-lg text-xs text-[#654321] bg-white focus:outline-none focus:ring-2 focus:ring-[#DAA520]/50 focus:border-[#DAA520] transition-all"
                />
              </div>
            </div>
            {/* Email Address */}
            <div className="space-y-1">
              <label htmlFor="signup-email" className="text-xs font-semibold text-[#654321]">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B5A3C]/70" />
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-8 pr-2 py-2 border-2 border-[#DAA520]/30 rounded-lg text-xs text-[#654321] bg-white focus:outline-none focus:ring-2 focus:ring-[#DAA520]/50 focus:border-[#DAA520] transition-all"
                />
              </div>
            </div>
            {/* Phone Number */}
            <div className="space-y-1">
              <label htmlFor="signup-phone" className="text-xs font-semibold text-[#654321]">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B5A3C]/70" />
                <input
                  id="signup-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-8 pr-2 py-2 border-2 border-[#DAA520]/30 rounded-lg text-xs text-[#654321] bg-white focus:outline-none focus:ring-2 focus:ring-[#DAA520]/50 focus:border-[#DAA520] transition-all"
                />
              </div>
            </div>
            {/* Location */}
            <div className="space-y-1">
              <label htmlFor="signup-location" className="text-xs font-semibold text-[#654321]">Location</label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B5A3C]/70" />
                <input
                  id="signup-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, State or Country"
                  className="w-full pl-8 pr-2 py-2 border-2 border-[#DAA520]/30 rounded-lg text-xs text-[#654321] bg-white focus:outline-none focus:ring-2 focus:ring-[#DAA520]/50 focus:border-[#DAA520] transition-all"
                />
              </div>
            </div>
            {/* Password */}
            <div className="space-y-1">
              <label htmlFor="signup-password" className="text-xs font-semibold text-[#654321]">Password</label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B5A3C]/70" />
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-8 pr-8 py-2 border-2 border-[#DAA520]/30 rounded-lg text-xs text-[#654321] bg-white focus:outline-none focus:ring-2 focus:ring-[#DAA520]/50 focus:border-[#DAA520] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-[#F5DEB3]/30 rounded text-[#8B5A3C]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {/* Confirm Password */}
            <div className="space-y-1">
              <label htmlFor="confirm-password" className="text-xs font-semibold text-[#654321]">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B5A3C]/70" />
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full pl-8 pr-8 py-2 border-2 border-[#DAA520]/30 rounded-lg text-xs text-[#654321] bg-white focus:outline-none focus:ring-2 focus:ring-[#DAA520]/50 focus:border-[#DAA520] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-[#F5DEB3]/30 rounded text-[#8B5A3C]"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="mt-3 space-y-2 flex-shrink-0">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 text-sm bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] font-bold rounded-lg hover:from-[#F4C430] hover:to-[#DAA520] hover:shadow-md transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed border-2 border-[#4A2F1A]/30"
            >
              {isLoading ? "Creating Account..." : "Sign Up"}
            </button>
            <p className="text-center text-xs text-[#8B5A3C]">
              Already have an account?{" "}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-[#6B4423] hover:text-[#4A2F1A] font-semibold underline underline-offset-2 transition-colors"
              >
                Log in
              </button>
            </p>
          </div>
        </form>

        {/* Footer — same as Home page footer (brown gradient) */}
        <div className="flex-shrink-0 w-full h-10 bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] border-t-2 border-[#4A2F1A]" />
      </div>
    </div>
  )
}
