"use client"

import { MessageCircle, Mail, Share2, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

export function ShareWidget() {
  const { toast } = useToast()
  const [shareUrl] = useState(typeof window !== "undefined" ? window.location.href : "")

  const sharingOptions = [
    {
      icon: MessageCircle,
      label: "Chat",
      action: "messaging",
      color: "from-yellow-400 to-yellow-500",
      glow: "rgba(250, 204, 21, 0.5)",
    },
    {
      icon: Mail,
      label: "Email",
      action: "email",
      color: "from-[#F4C430] to-yellow-500",
      glow: "rgba(244, 196, 48, 0.5)",
    },
    {
      icon: Share2,
      label: "Share",
      action: "social",
      color: "from-yellow-300 to-[#F4C430]",
      glow: "rgba(244, 196, 48, 0.5)",
    },
    {
      icon: Users,
      label: "Group",
      action: "group",
      color: "from-[#F4C430] to-yellow-600",
      glow: "rgba(244, 196, 48, 0.5)",
    },
  ]

  const handleShare = async (action: string, label: string) => {
    const giftTitle = "Premium Espresso Machine"
    const giftMessage = `Check out this amazing group gift on Wishbee! Join us in contributing: ${shareUrl}`

    try {
      switch (action) {
        case "messaging":
          // SMS/WhatsApp sharing
          if (navigator.share) {
            await navigator.share({
              title: `Group Gift: ${giftTitle}`,
              text: giftMessage,
            })
          } else {
            // Fallback: Copy to clipboard
            await navigator.clipboard.writeText(giftMessage)
            toast({
              title: "🐝 Link Copied!",
              description: "Share via your favorite messaging app",
              variant: "warm",
            })
          }
          break

        case "email":
          // Open email client with pre-filled content
          const emailSubject = encodeURIComponent(`Join our group gift: ${giftTitle}`)
          const emailBody = encodeURIComponent(
            `Hi!\n\nI'd love for you to join our group gift for ${giftTitle}.\n\nClick here to contribute: ${shareUrl}\n\nThanks!\n`,
          )
          window.open(`mailto:?subject=${emailSubject}&body=${emailBody}`, "_blank")

          toast({
            title: "Email Ready",
            description: "Email client opened with gift details",
          })
          break

        case "social":
          // Native Web Share API or copy link
          if (navigator.share) {
            await navigator.share({
              title: `Group Gift: ${giftTitle}`,
              text: "Join our group gift!",
              url: shareUrl,
            })
          } else {
            // Fallback: Copy to clipboard
            await navigator.clipboard.writeText(shareUrl)
            toast({
              title: "🐝 Link Copied!",
              description: "Paste on your favorite social platform",
              variant: "warm",
            })
          }
          break

        case "group":
          // Create shareable group invitation link
          await navigator.clipboard.writeText(giftMessage)
          toast({
            title: "🐝 Group Invitation Ready!",
            description: "Link copied - share with your group",
            variant: "warm",
          })
          break

        default:
          toast({
            title: `Share via ${label}`,
            description: "Sharing your gift...",
          })
      }

      // Track analytics
      if (typeof window !== "undefined" && (window as any).gtag) {
        ;(window as any).gtag("event", "share", {
          method: action,
          content_type: "group_gift",
          item_id: "espresso_machine",
        })
      }
    } catch (error) {
      // User cancelled or error occurred
      if ((error as Error).name !== "AbortError") {
        toast({
          title: "Share Error",
          description: "Unable to share. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <section className="relative bg-gradient-to-br from-[#F5F1E8] via-[#EDE6D6] to-[#F5F1E8] text-gray-900 py-6 sm:py-8 md:py-10 lg:py-12 overflow-hidden">
      {/* Animated background elements with honey colors */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-[#DAA520]/15 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-[#F4C430]/10 rounded-full blur-3xl animate-pulse delay-700"></div>

      <div className="max-w-6xl mx-auto text-center px-4 sm:px-6 md:px-8 lg:px-12 relative z-10">
        <div className="mb-12 sm:mb-16 space-y-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#654321]">
            Share Instantly. Gift Together
          </h2>

          <p className="text-xs sm:text-sm md:text-lg text-[#8B4513]/80 font-light max-w-xl mx-auto leading-relaxed text-balance">
            Seamless sharing with your favorite group chats and social media
          </p>
        </div>

        {/* Sharing Icons with enhanced design */}
        <div className="flex justify-center gap-8 sm:gap-10 md:gap-14 lg:gap-20 mb-8 flex-wrap">
          {sharingOptions.map((option, index) => (
            <div key={index} className="group flex flex-col items-center">
              <button
                onClick={() => handleShare(option.action, option.label)}
                className="relative rounded-3xl p-1 hover:scale-110 transition-all duration-500 active:scale-95"
                style={{
                  boxShadow: `0 10px 40px ${option.glow}`,
                }}
              >
                {/* Outer glow ring */}
                <div
                  className="absolute -inset-2 rounded-3xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(135deg, ${option.glow}, transparent)`,
                  }}
                ></div>

                {/* Main button with gradient */}
                <div
                  className={`relative bg-gradient-to-br ${option.color} rounded-3xl p-5 sm:p-6 md:p-7 shadow-2xl overflow-hidden group-hover:shadow-[0_20px_60px_rgba(139,69,19,0.4)] transition-all duration-500`}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-700"></div>

                  {/* Subtle inner glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl"></div>

                  {/* Animated pulse ring */}
                  <div className="absolute inset-0 rounded-3xl border-2 border-white/50 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"></div>

                  <option.icon
                    className="relative z-10 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 text-white drop-shadow-lg group-hover:rotate-12 transition-transform duration-500"
                    strokeWidth={2.5}
                  />
                </div>
              </button>

              <p className="text-xs sm:text-sm text-[#8B4513]/80 mt-4 sm:mt-5 font-semibold tracking-wide group-hover:text-[#654321] group-hover:scale-105 transition-all duration-300">
                {option.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
