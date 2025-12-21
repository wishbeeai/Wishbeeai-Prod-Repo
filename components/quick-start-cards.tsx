"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Users, Heart, CreditCard } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import LoginModal from "./login-modal"
import SignUpModal from "./signup-modal"

export default function QuickStartCards() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false)
  const router = useRouter()
  const { isAuthenticated, login } = useAuth()
  const { toast } = useToast()

  const handleCreateGroupGifting = () => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true)
      toast({
        title: "Login Required",
        description: "Please log in or sign up to create a group gift collection.",
      })
      return
    }

    router.push("/gifts/create")
  }

  const handleLoginSuccess = () => {
    login()
    setIsLoginModalOpen(false)

    toast({
      title: "Welcome!",
      description: "Successfully logged in. Redirecting...",
    })

    setTimeout(() => {
      router.push("/gifts/create")
    }, 500)
  }

  return (
    <>
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onSwitchToSignUp={() => {
          setIsLoginModalOpen(false)
          setIsSignUpModalOpen(true)
        }}
      />
      <SignUpModal isOpen={isSignUpModalOpen} onClose={() => setIsSignUpModalOpen(false)} />

      {/* Group Gifting */}
      <section className="px-4 bg-white">
        <div className="container mx-auto max-w-7xl py-20">
          <div className="text-center mb-12">
            <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-4">
              Two Ways to Give Better
            </h2>
            <p className="text-xs sm:text-sm md:text-lg text-gray-600 max-w-2xl mx-auto">
              Whether pooling together or giving solo, Wishbee makes it easy
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-3xl p-4 sm:p-6 md:p-8 lg:p-10 border-2 border-amber-200 hover:border-amber-400 transition-all hover:shadow-2xl">
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-5 md:mb-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-[#DAA520] to-[#FFD700] flex items-center justify-center shadow-lg flex-shrink-0">
                  <Users className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Group Gifting</h3>
              </div>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-600 mb-4 sm:mb-5 md:mb-6">
                Pool group contributions from friends and family to give something truly special together.
              </p>
              <ul className="space-y-2 sm:space-y-2.5 md:space-y-3 mb-6 sm:mb-7 md:mb-8">
                <li className="flex items-start gap-2 sm:gap-2.5 md:gap-3 text-gray-700 text-xs sm:text-sm md:text-base">
                  <span className="text-amber-600 font-bold flex-shrink-0">✓</span>
                  <span>Create collections with AI-generated banners</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-2.5 md:gap-3 text-gray-700 text-xs sm:text-sm md:text-base">
                  <span className="text-amber-600 font-bold flex-shrink-0">✓</span>
                  <span>Share via email or social media</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-2.5 md:gap-3 text-gray-700 text-xs sm:text-sm md:text-base">
                  <span className="text-amber-600 font-bold flex-shrink-0">✓</span>
                  <span>Everyone contributes their own amount</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-2.5 md:gap-3 text-gray-700 text-xs sm:text-sm md:text-base">
                  <span className="text-amber-600 font-bold flex-shrink-0">✓</span>
                  <span>Track real-time progress with AI insights</span>
                </li>
              </ul>
              <Button
                onClick={handleCreateGroupGifting}
                className="w-full lg:w-auto bg-gradient-to-r from-[#DAA520] to-[#FFD700] hover:from-[#B8860B] hover:to-[#DAA520] text-white py-1.5 sm:py-3 md:py-4 lg:py-3 px-2 sm:px-6 text-xs sm:text-sm md:text-base lg:text-base font-bold transition-all duration-200 border border-[#DAA520]/30 shadow-md hover:shadow-xl"
              >
                Create Group Gifting
              </Button>
            </div>

            {/* Solo Gifting */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-4 sm:p-6 md:p-8 lg:p-10 border-2 border-orange-200 hover:border-orange-400 transition-all hover:shadow-2xl">
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-5 md:mb-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-[#DAA520] to-[#FFD700] flex items-center justify-center shadow-lg flex-shrink-0">
                  <Heart className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Solo Gifting</h3>
              </div>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-600 mb-4 sm:mb-5 md:mb-6">
                Fund the entire gift yourself for any special occasion and give something truly meaningful.
              </p>
              <ul className="space-y-2 sm:space-y-2.5 md:space-y-3 mb-6 sm:mb-7 md:mb-8">
                <li className="flex items-start gap-2 sm:gap-2.5 md:gap-3 text-gray-700 text-xs sm:text-sm md:text-base">
                  <span className="text-orange-600 font-bold flex-shrink-0">✓</span>
                  <span>Personalized AI gift recommendations</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-2.5 md:gap-3 text-gray-700 text-xs sm:text-sm md:text-base">
                  <span className="text-orange-600 font-bold flex-shrink-0">✓</span>
                  <span>Auto-extract details from any retailer URL</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-2.5 md:gap-3 text-gray-700 text-xs sm:text-sm md:text-base">
                  <span className="text-orange-600 font-bold flex-shrink-0">✓</span>
                  <span>AI insights and savings tips</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-2.5 md:gap-3 text-gray-700 text-xs sm:text-sm md:text-base">
                  <span className="text-orange-600 font-bold flex-shrink-0">✓</span>
                  <span>Smart organization with filters and sorting</span>
                </li>
              </ul>
              <Link href="/wishlist/add">
                <Button className="w-full bg-gradient-to-r from-[#DAA520] to-[#FFD700] hover:from-[#B8860B] hover:to-[#DAA520] text-white py-1.5 sm:py-3 md:py-4 lg:py-5 text-xs sm:text-sm md:text-base lg:text-lg font-bold transition-all duration-200 border border-[#DAA520]/30 shadow-md hover:shadow-xl">
                  Start Gifting
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Wishbee section now full page width outside container */}
      <section className="bg-white">
        <div className="relative bg-gradient-to-b from-[#FFF8E7] via-[#F4E4C1] to-[#FFE4B5] rounded-none overflow-hidden py-12 md:py-16">
          {/* Top decorative accent */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#DAA520] to-transparent"></div>

          {/* Animated falling honey drops - decorative elements */}
          <div
            className="absolute top-8 left-[15%] w-2.5 h-3.5 bg-gradient-to-b from-[#FFD700] to-[#DAA520] rounded-full animate-bounce opacity-60"
            style={{ animationDuration: "2.5s", animationDelay: "0s" }}
          ></div>
          <div
            className="absolute top-12 left-[35%] w-2 h-3 bg-gradient-to-b from-[#F4C430] to-[#DAA520] rounded-full animate-bounce opacity-50"
            style={{ animationDuration: "3s", animationDelay: "0.8s" }}
          ></div>
          <div
            className="absolute top-10 right-[25%] w-2.5 h-3.5 bg-gradient-to-b from-[#FFD700] to-[#DAA520] rounded-full animate-bounce opacity-55"
            style={{ animationDuration: "2.7s", animationDelay: "0.4s" }}
          ></div>
          <div
            className="absolute top-16 right-[10%] w-2 h-3 bg-gradient-to-b from-[#DAA520] to-[#B8860B] rounded-full animate-bounce opacity-65"
            style={{ animationDuration: "2.3s", animationDelay: "1.2s" }}
          ></div>

          {/* Bottom decorative honey drops */}
          <div
            className="absolute bottom-12 left-[20%] w-2 h-3 bg-gradient-to-b from-[#FFD700] to-[#DAA520] rounded-full animate-bounce opacity-60"
            style={{ animationDuration: "2.6s", animationDelay: "0.6s" }}
          ></div>
          <div
            className="absolute bottom-14 right-[30%] w-2.5 h-3.5 bg-gradient-to-b from-[#F4C430] to-[#DAA520] rounded-full animate-bounce opacity-55"
            style={{ animationDuration: "2.8s", animationDelay: "1s" }}
          ></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative z-10">
              <div className="text-center mb-10">
                <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#8B4513] mb-4 relative inline-block">
                  Why Choose Wishbee?
                  <span
                    className="absolute -right-8 sm:-right-10 top-0 text-2xl sm:text-3xl animate-bounce"
                    style={{ animationDuration: "3s" }}
                  >
                    🐝
                  </span>
                </h3>
                {/* Decorative curved arrow */}
                <div className="relative inline-block">
                  <svg
                    className="absolute -top-2 left-1/2 -translate-x-1/2 w-48 h-12 opacity-40"
                    viewBox="0 0 200 50"
                    fill="none"
                  >
                    <path
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 00-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      stroke="#8B4513"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray="4 4"
                    />
                  </svg>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Benefit 1 */}
                <div className="text-center group">
                  <div className="relative mb-6 transition-transform duration-300 group-hover:scale-105">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#DAA520] to-[#FFD700] flex items-center justify-center shadow-lg">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 00-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                    </div>
                  </div>
                  <h4 className="text-base sm:text-lg md:text-xl font-bold text-[#8B4513] mb-3">
                    AI-Powered Smart Gifting
                  </h4>
                  <p className="text-xs sm:text-sm md:text-base text-[#8B4513]/80 leading-relaxed font-light">
                    Get personalized gift suggestions and automated product extraction from any retailer
                  </p>
                </div>

                {/* Benefit 2 */}
                <div className="text-center group">
                  <div className="relative mb-6 transition-transform duration-300 group-hover:scale-105">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#DAA520] to-[#FFD700] flex items-center justify-center shadow-lg">
                      <CreditCard className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <h4 className="text-base sm:text-lg md:text-xl font-bold text-[#8B4513] mb-3">
                    Flexible Payment Options
                  </h4>
                  <p className="text-xs sm:text-sm md:text-base text-[#8B4513]/80 leading-relaxed font-light">
                    Multiple payment methods (Card, PayPal, Apple Pay, Google Pay, Venmo, Cash App)
                  </p>
                </div>

                {/* Benefit 3 */}
                <div className="text-center group">
                  <div className="relative mb-6 transition-transform duration-300 group-hover:scale-105">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#DAA520] to-[#FFD700] flex items-center justify-center shadow-lg">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                  </div>
                  <h4 className="text-base sm:text-lg md:text-xl font-bold text-[#8B4513] mb-3">Fast & Easy Setup</h4>
                  <p className="text-xs sm:text-sm md:text-base text-[#8B4513]/80 leading-relaxed font-light">
                    Create gift collections in minutes with no complicated forms or setup required
                  </p>
                </div>
              </div>

              {/* Decorative bottom accent */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent rounded-full"></div>
            </div>
          </div>

          {/* Bottom decorative accent */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#DAA520] to-transparent"></div>
        </div>
      </section>
    </>
  )
}
