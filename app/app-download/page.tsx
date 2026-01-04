"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { useState, useEffect } from "react"
import { Smartphone, Download, CheckCircle, ArrowRight, Clock } from "lucide-react"
import { detectPlatform, handleAppDownload, isAppAvailable, type Platform } from "@/lib/app-downloads"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"

export default function AppDownloadPage() {
  const searchParams = useSearchParams()
  const [platform, setPlatform] = useState<Platform>("unknown")
  const [isDetecting, setIsDetecting] = useState(true)
  const [iosAvailable, setIosAvailable] = useState(false)
  const [androidAvailable, setAndroidAvailable] = useState(false)

  useEffect(() => {
    const detected = detectPlatform()
    setPlatform(detected)
    
    // Check app availability
    setIosAvailable(isAppAvailable("ios"))
    setAndroidAvailable(isAppAvailable("android"))
    
    setIsDetecting(false)
    
    // Show message if platform parameter is in URL
    const platformParam = searchParams?.get("platform")
    if (platformParam === "ios" || platformParam === "android") {
      toast.info("The app is coming soon! We'll notify you when it's available.")
    }
  }, [searchParams])

  const handleDownload = async (targetPlatform: Platform) => {
    const available = isAppAvailable(targetPlatform)
    if (!available) {
      toast.info("Coming soon! We're working hard to bring you the Wishbee app.")
    }
    await handleAppDownload(targetPlatform, "app-download-page")
  }

  const features = [
    {
      title: "Clip Products Anywhere",
      description: "Save gift ideas from any website with one tap",
      icon: "📎",
    },
    {
      title: "Create Collections",
      description: "Organize gifts for any occasion",
      icon: "🎁",
    },
    {
      title: "Group Contributions",
      description: "Pool funds with friends and family",
      icon: "👥",
    },
    {
      title: "AI-Powered Insights",
      description: "Get smart gift recommendations",
      icon: "🤖",
    },
    {
      title: "Real-Time Tracking",
      description: "See contribution progress in real-time",
      icon: "📊",
    },
    {
      title: "Secure Payments",
      description: "Multiple payment options, bank-level security",
      icon: "🔒",
    },
  ]

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] mb-6">
            <Smartphone className="w-10 h-10 text-[#654321]" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#654321] mb-6">
            Get the Wishbee App
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto mb-8">
            Take group gifting with you wherever you go. Available on iOS and Android.
          </p>

          {/* Download Buttons */}
          {!isDetecting && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <div className="relative">
                <button
                  onClick={() => handleDownload("ios")}
                  className="hover:scale-105 hover:shadow-lg transition-all duration-300 cursor-pointer rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#F4C430] disabled:opacity-75 disabled:cursor-not-allowed"
                  aria-label={iosAvailable ? "Download on the App Store" : "iOS app coming soon"}
                  disabled={!iosAvailable}
                >
                  <Image
                    src="/images/ios-app-store-badge.png"
                    alt={iosAvailable ? "Download on the App Store" : "iOS app coming soon"}
                    width={180}
                    height={60}
                    className="h-14 w-auto"
                  />
                </button>
                {!iosAvailable && (
                  <div className="absolute -top-2 -right-2 bg-[#DAA520] text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <Clock className="w-3 h-3" />
                    Soon
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => handleDownload("android")}
                  className="hover:scale-105 hover:shadow-lg transition-all duration-300 cursor-pointer rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#F4C430] disabled:opacity-75 disabled:cursor-not-allowed"
                  aria-label={androidAvailable ? "Get it on Google Play" : "Android app coming soon"}
                  disabled={!androidAvailable}
                >
                  <Image
                    src="/images/google-play-store-badge.png"
                    alt={androidAvailable ? "Get it on Google Play" : "Android app coming soon"}
                    width={200}
                    height={60}
                    className="h-14 w-auto"
                  />
                </button>
                {!androidAvailable && (
                  <div className="absolute -top-2 -right-2 bg-[#DAA520] text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <Clock className="w-3 h-3" />
                    Soon
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Coming Soon Message */}
          {!isDetecting && !iosAvailable && !androidAvailable && (
            <div className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] rounded-lg p-6 max-w-2xl mx-auto mb-8">
              <div className="flex items-center gap-3 justify-center mb-2">
                <Clock className="w-6 h-6 text-[#654321]" />
                <h2 className="text-2xl font-bold text-[#654321]">Apps Coming Soon!</h2>
              </div>
              <p className="text-center text-[#654321]">
                We're working hard to bring you native iOS and Android apps. 
                In the meantime, you can use Wishbee in your browser or install our browser extension.
              </p>
            </div>
          )}

          {/* Platform Detection Message */}
          {!isDetecting && platform !== "unknown" && (
            <div className="bg-white rounded-lg shadow-md p-4 max-w-md mx-auto mb-8">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <p className="text-gray-700">
                  We detected you're on {platform === "ios" ? "iOS" : "Android"}. 
                  Click the button above to download!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-[#654321] mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Why Download Section */}
        <div className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] rounded-lg p-8 md:p-12 mb-16">
          <h2 className="text-3xl font-bold text-[#654321] text-center mb-8">Why Download the App?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/90 rounded-lg p-6">
              <h3 className="text-xl font-bold text-[#654321] mb-3">📱 Mobile-First Experience</h3>
              <p className="text-gray-700">
                Optimized for mobile devices with a native feel. Create and manage gifts on the go.
              </p>
            </div>
            <div className="bg-white/90 rounded-lg p-6">
              <h3 className="text-xl font-bold text-[#654321] mb-3">🔔 Push Notifications</h3>
              <p className="text-gray-700">
                Get instant updates when friends contribute or when your gift goals are reached.
              </p>
            </div>
            <div className="bg-white/90 rounded-lg p-6">
              <h3 className="text-xl font-bold text-[#654321] mb-3">⚡ Faster Performance</h3>
              <p className="text-gray-700">
                Native app performance means faster loading and smoother interactions.
              </p>
            </div>
            <div className="bg-white/90 rounded-lg p-6">
              <h3 className="text-xl font-bold text-[#654321] mb-3">📸 Easy Photo Sharing</h3>
              <p className="text-gray-700">
                Share gift photos and updates directly from your camera roll.
              </p>
            </div>
          </div>
        </div>

        {/* Alternative Download Options */}
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-[#654321] mb-4">Prefer to Use on Desktop?</h2>
          <p className="text-gray-600 mb-6">
            Wishbee works great in your browser too! Or install our browser extension for quick access.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] px-6 py-3 rounded-full font-semibold hover:from-[#F4C430] hover:to-[#DAA520] transition-all shadow-lg hover:shadow-xl"
            >
              Use Web App
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 border-2 border-[#8B4513] text-[#8B4513] px-6 py-3 rounded-full font-semibold hover:bg-[#8B4513] hover:text-white transition-all"
            >
              Install Extension
              <Download className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

