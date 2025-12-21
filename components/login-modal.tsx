"use client"

import type React from "react"

import { useState } from "react"
import { X, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onLoginSuccess?: () => void
  onSwitchToSignUp?: () => void
}

export default function LoginModal({ isOpen, onClose, onLoginSuccess, onSwitchToSignUp }: LoginModalProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please enter both email and password",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)

    if (onLoginSuccess) {
      onLoginSuccess()
    } else {
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in to Wishbee.ai",
      })
      onClose()
    }

    // Reset form
    setEmail("")
    setPassword("")
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-100">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Welcome Back</h2>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1">Log in to continue gifting together</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-xs sm:text-sm font-semibold text-gray-700">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:border-transparent transition-all text-xs sm:text-sm placeholder:text-xs sm:placeholder:text-sm"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-xs sm:text-sm font-semibold text-gray-700">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:border-transparent transition-all text-xs sm:text-sm placeholder:text-xs sm:placeholder:text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end">
            <button
              type="button"
              className="text-xs sm:text-sm text-[#F4C430] hover:text-[#FFD700] font-semibold transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-auto mx-auto block px-8 sm:px-8 md:px-10 py-2.5 sm:py-2 text-xs sm:text-sm bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#8B4513] font-bold rounded-full hover:shadow-lg hover:scale-[1.02] hover:from-[#F4C430] hover:to-[#DAA520] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isLoading ? "Logging in..." : "Log in"}
          </button>

          {/* Sign Up Link */}
          <p className="text-center text-xs sm:text-sm text-gray-600">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToSignUp}
              className="text-[#F4C430] hover:text-[#FFD700] font-semibold transition-colors"
            >
              Sign up
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
