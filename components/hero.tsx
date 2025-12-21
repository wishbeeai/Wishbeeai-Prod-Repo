"use client"

import Image from "next/image"
import { useToast } from "@/hooks/use-toast"

export default function Hero() {
  const { toast } = useToast()

  const detectBrowser = (): string => {
    if (typeof window === "undefined") return "unknown"

    const userAgent = navigator.userAgent.toLowerCase()

    if (userAgent.includes("edg/")) {
      return "edge"
    } else if (userAgent.includes("firefox") || userAgent.includes("fxios")) {
      return "firefox"
    } else if (userAgent.includes("safari") && !userAgent.includes("chrome")) {
      return "safari"
    } else if (userAgent.includes("chrome") || userAgent.includes("crios")) {
      return "chrome"
    }

    return "chrome" // Default to Chrome if browser is unknown
  }

  const handleInstallExtension = () => {
    const browser = detectBrowser()

    // Map browsers to their extension store URLs
    const extensionUrls: Record<string, string> = {
      chrome: "https://chrome.google.com/webstore/detail/floeeaefopldadpfnefhnfaphphpglfo",
      firefox: "https://addons.mozilla.org/en-US/firefox/addon/wishbee/",
      safari: "https://apps.apple.com/us/app/wishbee-safari-extension/id1234567890",
      edge: "https://microsoftedge.microsoft.com/addons/detail/wishbee/abcdefghijklmnop",
    }

    const extensionUrl = extensionUrls[browser] || extensionUrls.chrome

    // Browser display names for toast messages
    const browserNames: Record<string, string> = {
      chrome: "Chrome Web Store",
      firefox: "Firefox Add-ons",
      safari: "App Store",
      edge: "Edge Add-ons",
    }

    const storeName = browserNames[browser] || "Extension Store"

    // Track the click for analytics
    if (typeof window !== "undefined" && (window as any).gtag) {
      ;(window as any).gtag("event", "install_extension_click", {
        browser: browser.charAt(0).toUpperCase() + browser.slice(1),
        source: "hero_cta",
      })
    }

    // Open extension in new tab
    window.open(extensionUrl, "_blank")

    // Show toast with browser-specific message
    toast({
      title: `Opening ${storeName}`,
      description: `Redirecting to install the Wishbee extension for ${browser.charAt(0).toUpperCase() + browser.slice(1)}.`,
    })
  }

  const handleSeeHowItWorks = () => {
    const videoUrl = "https://www.youtube.com/watch?v=bHpcbF2mc-I"

    // Track the click for analytics
    if (typeof window !== "undefined" && (window as any).gtag) {
      ;(window as any).gtag("event", "video_view", {
        source: "hero_see_how_it_works",
        video_platform: "youtube",
      })
    }

    // Open video in new tab
    window.open(videoUrl, "_blank")

    // Show toast
    toast({
      title: "Opening Video",
      description: "Redirecting to YouTube to watch how Wishbee works.",
    })
  }

  return (
    <section className="bg-gradient-to-br from-[#F5F1E8] via-[#EDE6D6] to-[#F5F1E8] py-12 sm:py-16 md:py-20 lg:py-28 xl:py-36 relative overflow-hidden">
      {/* Animated gradient orbs with honey colors */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#DAA520]/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#F4C430]/15 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(218,165,32,0.15),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(244,196,48,0.12),transparent_50%)]"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 md:gap-16 lg:gap-20 items-center">
          {/* Left: Image */}
          <div className="flex justify-center md:justify-start order-1 md:order-1">
            <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md group">
              {/* Honey glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-[#DAA520]/40 via-[#F4C430]/25 to-transparent rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700 animate-pulse"></div>

              <div className="relative transform perspective-1000 group-hover:scale-[1.02] transition-all duration-500">
                <Image
                  src="/images/group-gifting-mainimage.png"
                  alt="Group gifting - people holding a gift together"
                  width={500}
                  height={400}
                  className="w-full h-auto rounded-2xl shadow-[0_20px_60px_-15px_rgba(139,69,19,0.4)] group-hover:shadow-[0_25px_70px_-10px_rgba(218,165,32,0.5)] object-cover relative z-10 transition-all duration-500 border-4 border-[#DAA520]/30"
                />

                {/* Decorative corner accents with honey color */}
                <div className="absolute -top-3 -left-3 w-20 h-20 border-t-4 border-l-4 border-[#DAA520] rounded-tl-2xl opacity-60"></div>
                <div className="absolute -bottom-3 -right-3 w-20 h-20 border-b-4 border-r-4 border-[#F4C430] rounded-br-2xl opacity-60"></div>
              </div>
            </div>
          </div>

          {/* Right: Content with brown/honey text colors */}
          <div className="order-2 md:order-2 text-center md:text-left space-y-6">
            <div className="space-y-4">
              <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold mb-4 text-balance leading-[1.1] tracking-tight text-[#654321] drop-shadow-[0_2px_10px_rgba(218,165,32,0.4)]">
                Big Gifts Become Reality
              </h1>
              <p className="text-base sm:text-lg md:text-2xl lg:text-3xl text-[#8B4513] font-semibold tracking-wide">
                Gift Together. Give Better.
              </p>
            </div>

            <p className="text-xs sm:text-sm md:text-lg text-[#8B4513]/80 text-balance leading-relaxed max-w-xl font-light">
              Make gifting effortless with our smart group gifting platform
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start items-center pt-4">
              <button
                onClick={handleInstallExtension}
                className="group relative w-44 sm:w-48 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#8B4513] rounded-full font-bold overflow-hidden transition-all duration-300 shadow-[0_8px_30px_rgba(218,165,32,0.4)] hover:shadow-[0_12px_40px_rgba(218,165,32,0.6)] hover:scale-105 hover:from-[#F4C430] hover:to-[#DAA520] active:scale-95 text-xs sm:text-sm border-2 border-[#DAA520]/30"
              >
                <span className="relative z-10 flex items-center justify-center gap-1.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Install Extension
                </span>
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              </button>

              <button
                onClick={handleSeeHowItWorks}
                className="group relative w-44 sm:w-48 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#8B4513] rounded-full font-bold overflow-hidden transition-all duration-300 shadow-[0_8px_30px_rgba(218,165,32,0.4)] hover:shadow-[0_12px_40px_rgba(218,165,32,0.6)] hover:scale-105 hover:from-[#F4C430] hover:to-[#DAA520] active:scale-95 text-xs sm:text-sm border-2 border-[#DAA520]/30"
              >
                <span className="relative z-10 flex items-center justify-center gap-1.5">
                  See How it Works
                  <svg
                    className="w-3 h-3 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
