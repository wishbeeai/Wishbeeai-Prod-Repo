"use client"
import Link from "next/link"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"

export function Footer() {
  const { toast } = useToast()

  const handleNavigationClick = (section: string) => {
    const routes: Record<string, string> = {
      "Help": "/help",
      "About": "/about",
      "About Donations": "/about-donations",
      "Gifting Guides": "/gifting-guides",
      "Refer a Friend": "/tell-a-friend",
      "Privacy Policy": "/privacy",
      "Terms of Service": "/terms",
      "/privacy": "/privacy",
      "/terms": "/terms",
    }
    
    const route = routes[section]
    if (route) {
      window.location.href = route
    } else {
      toast({
        title: `Navigating to ${section}`,
        description: `You clicked on the ${section} link`,
      })
    }
  }

  const handleAppDownload = async (platform: "ios" | "android") => {
    try {
      // Import the app download utilities
      const { handleAppDownload: trackAndDownload, isAppAvailable } = await import("@/lib/app-downloads")
      
      const isAvailable = isAppAvailable(platform)
      
      // Track and open app store or coming soon page
      await trackAndDownload(platform, "footer")
      
      if (isAvailable) {
        toast({
          title: `Opening ${platform === "ios" ? "App Store" : "Google Play"}`,
          description: `Redirecting to download Wishbee app...`,
        })
      } else {
        toast({
          title: "Coming Soon!",
          description: `The ${platform === "ios" ? "iOS" : "Android"} app is coming soon. Stay tuned!`,
        })
      }
    } catch (error) {
      console.error("Error handling app download:", error)
      // Fallback: navigate to app download page
      window.location.href = `/app-download?platform=${platform}`
    }
  }

  const handleBrowserExtension = (browser: string) => {
    toast({
      title: `Install ${browser} Extension`,
      description: `Opening ${browser} extension store...`,
    })
    // In production, these would navigate to actual extension URLs
    const extensionUrls: Record<string, string> = {
      Safari: "https://apps.apple.com/app/wishbee-extension",
      Chrome: "https://chrome.google.com/webstore/detail/wishbee",
      Firefox: "https://addons.mozilla.org/firefox/addon/wishbee",
      Edge: "https://microsoftedge.microsoft.com/addons/detail/wishbee",
    }
    window.open(extensionUrls[browser], "_blank")
  }

  const handleSocialClick = (platform: string) => {
    toast({
      title: `Opening ${platform}`,
      description: `Redirecting to Wishbee's ${platform} page...`,
    })
    // In production, these would navigate to actual social media URLs
    const socialUrls: Record<string, string> = {
      Facebook: "https://facebook.com/wishbee",
      Instagram: "https://instagram.com/wishbee",
      X: "https://x.com/wishbee",
      TikTok: "https://tiktok.com/@wishbee",
      Pinterest: "https://pinterest.com/wishbee",
    }
    window.open(socialUrls[platform], "_blank")
  }

  return (
    <footer className="relative bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] text-white overflow-hidden">
      {/* Honey drip decoration at top */}
      <div className="absolute top-0 left-0 right-0 h-12 pointer-events-none">
        <svg
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1200 100"
        >
          <path
            d="M0,0 Q50,30 100,0 T200,0 T300,0 T400,0 T500,0 T600,0 T700,0 T800,0 T900,0 T1000,0 T1100,0 T1200,0 L1200,100 L0,100 Z"
            fill="url(#drip-gradient)"
          />
          <defs>
            <linearGradient id="drip-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F4C430" stopOpacity="0.3" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Top Section with decorative border */}
        <div className="bg-gradient-to-br from-[#8B5A3C]/50 to-[#6B4423]/50 backdrop-blur-sm rounded-2xl border-2 border-[#F5DEB3]/30 shadow-xl p-6 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            {/* Left: Navigation Links */}
            <nav className="w-full sm:w-auto">
              {/* Mobile Dropdown */}
              <select
                onChange={(e) => {
                  const value = e.target.value
                  if (value) {
                    if (value.startsWith("mailto:")) {
                      window.location.href = value
                    } else {
                      handleNavigationClick(value)
                    }
                    e.target.value = ""
                  }
                }}
                className="sm:hidden w-full bg-[#6B4423] text-[#F5DEB3] border-2 border-[#DAA520] rounded-lg px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F4C430] appearance-none cursor-pointer shadow-lg"
                defaultValue=""
              >
                <option value="" disabled>
                  Quick Links
                </option>
                <option value="Help">Help</option>
                <option value="About">About</option>
                <option value="About Donations">About Donations</option>
                <option value="Gifting Guides">Gifting guides</option>
                <option value="Refer a Friend">Refer a friend</option>
                <option value="/privacy">Privacy Policy</option>
                <option value="/terms">Terms of Service</option>
              </select>

              {/* Tablet/Desktop Horizontal Links */}
              <div className="hidden sm:flex flex-wrap gap-4 lg:gap-6 text-sm font-medium">
                <Link
                  href="/help"
                  className="text-[#F5DEB3] hover:text-[#F4C430] transition-all duration-300 cursor-pointer whitespace-nowrap border-b-2 border-transparent hover:border-[#F4C430]"
                >
                  Help
                </Link>
                <Link
                  href="/about"
                  className="text-[#F5DEB3] hover:text-[#F4C430] transition-all duration-300 cursor-pointer whitespace-nowrap border-b-2 border-transparent hover:border-[#F4C430]"
                >
                  About
                </Link>
                <Link
                  href="/about-donations"
                  className="text-[#F5DEB3] hover:text-[#F4C430] transition-all duration-300 cursor-pointer whitespace-nowrap border-b-2 border-transparent hover:border-[#F4C430]"
                >
                  About Donations
                </Link>
                <Link
                  href="/gifting-guides"
                  className="text-[#F5DEB3] hover:text-[#F4C430] transition-all duration-300 cursor-pointer whitespace-nowrap border-b-2 border-transparent hover:border-[#F4C430]"
                >
                  Gifting guides
                </Link>
                <Link
                  href="/tell-a-friend"
                  className="text-[#F5DEB3] hover:text-[#F4C430] transition-all duration-300 cursor-pointer whitespace-nowrap border-b-2 border-transparent hover:border-[#F4C430]"
                >
                  Refer a friend
                </Link>
              </div>
            </nav>

            {/* Center: App Downloads */}
            <div className="flex flex-col items-start gap-3">
              <span className="text-sm font-semibold text-[#F5DEB3] whitespace-nowrap">Get the Wishbee app</span>
              <div className="flex gap-3">
                <button
                  onClick={() => handleAppDownload("ios")}
                  className="hover:scale-105 hover:shadow-lg transition-all duration-300 cursor-pointer rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:ring-offset-2 focus:ring-offset-[#6B4423]"
                  aria-label="Download on the App Store"
                >
                  <Image
                    src="/images/ios-app-store-badge.png"
                    alt="Download on the App Store"
                    width={120}
                    height={40}
                    className="h-10 w-auto"
                  />
                </button>
                <button
                  onClick={() => handleAppDownload("android")}
                  className="hover:scale-105 hover:shadow-lg transition-all duration-300 cursor-pointer rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#F4C430] focus:ring-offset-2 focus:ring-offset-[#6B4423]"
                  aria-label="Get it on Google Play"
                >
                  <Image
                    src="/images/google-play-store-badge.png"
                    alt="Get it on Google Play"
                    width={135}
                    height={40}
                    className="h-10 w-auto"
                  />
                </button>
              </div>
            </div>

            {/* Right: Browser Extensions */}
            <div className="flex flex-col items-start gap-3">
              <span className="text-sm font-semibold text-[#F5DEB3] whitespace-nowrap">
                Add with browser extensions
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => handleBrowserExtension("Safari")}
                  className="hover:scale-110 hover:shadow-lg transition-all duration-300 cursor-pointer rounded-lg p-1 bg-[#6B4423] border-2 border-[#F5DEB3] hover:border-[#F4C430]"
                  aria-label="Safari Extension"
                >
                  <Image src="/images/safari-btn-black.png" alt="Safari" width={40} height={40} className="w-9 h-9" />
                </button>
                <button
                  onClick={() => handleBrowserExtension("Chrome")}
                  className="hover:scale-110 hover:shadow-lg transition-all duration-300 cursor-pointer rounded-lg p-1 bg-[#6B4423] border-2 border-[#F5DEB3] hover:border-[#F4C430]"
                  aria-label="Chrome Extension"
                >
                  <Image src="/images/chrome-btn-black.png" alt="Chrome" width={40} height={40} className="w-9 h-9" />
                </button>
                <button
                  onClick={() => handleBrowserExtension("Firefox")}
                  className="hover:scale-110 hover:shadow-lg transition-all duration-300 cursor-pointer rounded-lg p-1 bg-[#6B4423] border-2 border-[#F5DEB3] hover:border-[#F4C430]"
                  aria-label="Firefox Extension"
                >
                  <Image src="/images/firefox-btn-black.png" alt="Firefox" width={40} height={40} className="w-9 h-9" />
                </button>
                <button
                  onClick={() => handleBrowserExtension("Edge")}
                  className="hover:scale-110 hover:shadow-lg transition-all duration-300 cursor-pointer rounded-lg p-1 bg-[#6B4423] border-2 border-[#F5DEB3] hover:border-[#F4C430]"
                  aria-label="Edge Extension"
                >
                  <Image src="/images/edge-btn-black.png" alt="Edge" width={40} height={40} className="w-9 h-9" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section with enhanced styling */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pt-6 border-t-2 border-[#DAA520]">
          {/* Left: Social Media Icons */}
          <div className="flex gap-3">
            <button
              onClick={() => handleSocialClick("Facebook")}
              className="w-10 h-10 rounded-full border-2 border-[#F5DEB3] bg-[#6B4423] hover:bg-[#8B5A3C] hover:scale-110 hover:shadow-lg hover:border-[#F4C430] transition-all duration-300 flex items-center justify-center cursor-pointer"
              aria-label="Facebook"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path
                  d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                  fill="#1877F2"
                />
              </svg>
            </button>
            <button
              onClick={() => handleSocialClick("Instagram")}
              className="w-10 h-10 rounded-full border-2 border-[#F5DEB3] bg-[#6B4423] hover:bg-[#8B5A3C] hover:scale-110 hover:shadow-lg hover:border-[#F4C430] transition-all duration-300 flex items-center justify-center cursor-pointer"
              aria-label="Instagram"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: "#FD5949", stopOpacity: 1 }} />
                    <stop offset="50%" style={{ stopColor: "#D6249F", stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: "#285AEB", stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <path
                  d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-4.354-.2-6.782-2.618-6.979-6.98-.059-1.28-.073-1.689-.073-4.948 0-3.204.012-3.584.072-4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.645.07 4.85.07 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.204-.012-3.584-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.205.013 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.645.07 4.85.07 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.204-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
                  fill="url(#instagram-gradient)"
                />
              </svg>
            </button>
            <button
              onClick={() => handleSocialClick("X")}
              className="w-10 h-10 rounded-full border-2 border-[#F5DEB3] bg-[#6B4423] hover:bg-[#8B5A3C] hover:scale-110 hover:shadow-lg hover:border-[#F4C430] transition-all duration-300 flex items-center justify-center cursor-pointer"
              aria-label="X (formerly Twitter)"
            >
              <svg className="w-5 h-5" viewBox="0 0 31 31" fill="none">
                <path
                  d="M19.8,8.6h2.3l-5,5.7,5.9,7.8h-4.6l-3.6-4.7-4.1,4.7h-2.3l5.4-6.1-5.7-7.4h4.7l3.3,4.3,3.8-4.3ZM19,20.8h1.3l-8.2-10.9h-1.4l8.3,10.9Z"
                  fill="#FFFFFF"
                />
              </svg>
            </button>
            <button
              onClick={() => handleSocialClick("TikTok")}
              className="w-10 h-10 rounded-full border-2 border-[#F5DEB3] bg-[#6B4423] hover:bg-[#8B5A3C] hover:scale-110 hover:shadow-lg hover:border-[#F4C430] transition-all duration-300 flex items-center justify-center cursor-pointer"
              aria-label="TikTok"
            >
              <svg className="w-5 h-5" viewBox="0 0 31 31" fill="none">
                <defs>
                  <linearGradient id="tiktok-gradient-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: "#00F2EA", stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: "#00F2EA", stopOpacity: 1 }} />
                  </linearGradient>
                  <linearGradient id="tiktok-gradient-red" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: "#FF0050", stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: "#FF0050", stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <path
                  d="M19,7.3h-2.8v11.1c0,1.3-1.1,2.4-2.4,2.4s-2.4-1.1-2.4-2.4,1-2.4,2.3-2.4v-2.8c-2.8,0-5.1,2.3-5.1,5.2s2.3,5.2,5.2,5.2,5.2-2.3,5.2-5.2v-5.7c1,.8,2.3,1.2,3.7,1.2v-2.8c-2.1,0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                  fill="url(#tiktok-gradient-cyan)"
                />
                <path
                  d="M19,7.3h-2.8v11.1c0,1.3-1.1,2.4-2.4,2.4s-2.4-1.1-2.4-2.4,1-2.4,2.3-2.4v-2.8c-2.8,0-5.1,2.3-5.1,5.2s2.3,5.2,5.2,5.2,5.2-2.3,5.2-5.2v-5.7c1,.8,2.3,1.2,3.7,1.2v-2.8c-2.1,0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                  fill="url(#tiktok-gradient-red)"
                  opacity="0.7"
                  transform="translate(0.5, 0.5)"
                />
              </svg>
            </button>
            <button
              onClick={() => handleSocialClick("Pinterest")}
              className="w-10 h-10 rounded-full border-2 border-[#F5DEB3] bg-[#6B4423] hover:bg-[#8B5A3C] hover:scale-110 hover:shadow-lg hover:border-[#F4C430] transition-all duration-300 flex items-center justify-center cursor-pointer"
              aria-label="Pinterest"
            >
              <svg className="w-5 h-5" viewBox="0 0 31 31" fill="none">
                <path
                  d="M7.3,15.5c0,3.4,2,6.2,4.9,7.5,0-.6,0-1.3.1-1.9.2-.7,1.1-4.5,1.1-4.5,0,0-.3-.5-.3-1.3,0-1.2.7-2.1,1.6-2.1s1.1.6,1.1,1.2-.5,1.9-.7,2.9c-.2.9.4,1.6,1.3,1.6,1.5,0,2.6-2,2.6-4.3s-1.2-3.1-3.4-3.1-4,1.9-4,3.9.2,1.2.5,1.6c.2.2.2.3.1.5,0,.1-.1.5-.2.7,0,.2-.2.3-.4.2-1.1-.5-1.7-1.7-1.7-3.1,0-2.3,2-5.1,5.8-5.1s5.2,2.3,5.2,4.7-1.8,5.6-4.4,5.6-1.7-.5-2-1c0,0-.5,1.9-.6,2.2-.2.6-.5,1.3-.8,1.8.7.2,1.5.3,2.3.3,4.5,0,8.2-3.7,8.2-8.2s-3.7-8.2-8.2-8.2-8.2,3.7-8.2,8.2Z"
                  fill="#E60023"
                  fillRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Center: Affiliate Disclaimer + Trust Badges */}
          <div className="text-sm flex-1 text-center">
            <p className="mb-3 text-[10px] sm:text-xs lg:text-sm text-[#F5DEB3]">
              We keep the lights on with affiliate link fees. As an Amazon Associate we earn from qualifying purchases.{" "}
              <Link
                href="/learn-more"
                className="text-[#DAA520] underline hover:text-[#F4C430] transition-colors font-medium"
              >
                Learn more
              </Link>
            </p>
            <p className="text-[9px] sm:text-xs text-[#F5DEB3]">
              © 2026 Wishbee.ai | Operated by Complete AI IT Services{" "}
              <Link
                href="/privacy"
                className="text-[#DAA520] underline hover:text-[#F4C430] transition-colors ml-3 font-medium"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-[#DAA520] underline hover:text-[#F4C430] transition-colors ml-3 font-medium"
              >
                Terms
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Decorative honey drops at bottom corners */}
      <div className="absolute bottom-0 left-4 w-3 h-3 bg-[#F4C430] rounded-full opacity-30 animate-pulse" />
      <div
        className="absolute bottom-6 left-12 w-2 h-2 bg-[#DAA520] rounded-full opacity-40 animate-pulse"
        style={{ animationDelay: "0.5s" }}
      />
      <div
        className="absolute bottom-0 right-4 w-3 h-3 bg-[#F4C430] rounded-full opacity-30 animate-pulse"
        style={{ animationDelay: "0.3s" }}
      />
      <div
        className="absolute bottom-6 right-12 w-2 h-2 bg-[#DAA520] rounded-full opacity-40 animate-pulse"
        style={{ animationDelay: "0.8s" }}
      />
    </footer>
  )
}
