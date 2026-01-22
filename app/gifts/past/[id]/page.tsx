"use client"

import { ArrowLeft, CheckCircle, Calendar, Users, DollarSign, Share2, Download, Eye } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

export default function PastGiftDetailsPage() {
  const params = useParams()
  const giftId = params.id
  const { toast } = useToast()
  const [showAllContributors, setShowAllContributors] = useState(false)

  const giftDetails = {
    1: {
      name: "Mom's Anniversary Gift",
      image: "/assorted-jewelry-display.png",
      totalAmount: 800,
      contributors: 15,
      completedDate: "2024-11-15",
      description: "A beautiful jewelry set to celebrate Mom's 25th anniversary",
      contributions: [
        { name: "John D.", amount: 100, date: "2024-11-10" },
        { name: "Sarah M.", amount: 75, date: "2024-11-11" },
        { name: "Mike R.", amount: 50, date: "2024-11-12" },
        { name: "Emily K.", amount: 60, date: "2024-11-13" },
        { name: "David L.", amount: 80, date: "2024-11-14" },
        { name: "Lisa P.", amount: 45, date: "2024-11-14" },
        { name: "Tom S.", amount: 90, date: "2024-11-15" },
      ],
    },
    2: {
      name: "John's Graduation Gift",
      image: "/modern-laptop-workspace.png",
      totalAmount: 1200,
      contributors: 20,
      completedDate: "2024-10-20",
      description: "High-performance laptop for John's college graduation",
      contributions: [
        { name: "David L.", amount: 150, date: "2024-10-15" },
        { name: "Lisa P.", amount: 100, date: "2024-10-16" },
        { name: "Tom S.", amount: 80, date: "2024-10-17" },
        { name: "Anna B.", amount: 90, date: "2024-10-18" },
        { name: "Mark C.", amount: 120, date: "2024-10-19" },
        { name: "Rachel D.", amount: 85, date: "2024-10-19" },
      ],
    },
  }

  const gift = giftDetails[giftId as keyof typeof giftDetails]

  const handleShare = async () => {
    console.log("[v0] Share button clicked")

    const shareUrl = window.location.href
    const shareText = `Check out the ${gift.name} we completed together! Total: $${gift.totalAmount} from ${gift.contributors} contributors.`

    console.log("[v0] Share data:", { shareUrl, shareText })

    if (navigator.share) {
      console.log("[v0] Using Web Share API")
      try {
        await navigator.share({
          title: gift.name,
          text: shareText,
          url: shareUrl,
        })
        toast({
          title: "Shared successfully!",
          description: "Gift memory shared with others.",
        })
      } catch (error: any) {
        console.log("[v0] Share error:", error)
        if (error.name !== "AbortError") {
          // Fallback to clipboard if share fails (but not if user cancelled)
          try {
            await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`)
            toast({
              title: "🐝 Link Copied!",
              description: "Share content ready to paste",
              variant: "warm",
            })
          } catch (clipError) {
            console.error("[v0] Clipboard error:", clipError)
            toast({
              title: "Share failed",
              description: "Unable to share at this time.",
              variant: "destructive",
            })
          }
        }
      }
    } else {
      console.log("[v0] Using clipboard fallback")
      try {
        await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`)
        toast({
          title: "🐝 Link Copied!",
          description: "Share content ready - paste to share with others",
          variant: "warm",
        })
      } catch (error) {
        console.error("[v0] Clipboard error:", error)
        toast({
          title: "Copy failed",
          description: "Please manually copy the URL from your browser.",
          variant: "destructive",
        })
      }
    }
  }

  const handleDownloadReceipt = () => {
    toast({
      title: "Generating receipt",
      description: "Your gift receipt is being prepared...",
    })

    // Generate receipt data
    setTimeout(() => {
      const receiptData = generateReceiptData(gift, giftId as string)
      downloadReceipt(receiptData, gift.name)

      toast({
        title: "Receipt downloaded!",
        description: "Check your downloads folder.",
      })
    }, 1500)
  }

  const generateReceiptData = (gift: any, id: string) => {
    const receiptContent = `
WISHBEE.AI - GIFT RECEIPT
${"=".repeat(50)}

Gift Name: ${gift.name}
Gift ID: #${id}
Description: ${gift.description}

SUMMARY
${"=".repeat(50)}
Total Amount Raised: $${gift.totalAmount}
Number of Contributors: ${gift.contributors}
Completion Date: ${new Date(gift.completedDate).toLocaleDateString()}

CONTRIBUTIONS
${"=".repeat(50)}
${gift.contributions.map((c: any) => `${c.name.padEnd(20)} $${c.amount.toString().padStart(6)}  ${new Date(c.date).toLocaleDateString()}`).join("\n")}

${"=".repeat(50)}
Thank you for using Wishbee.ai for group gifting!
Generated on: ${new Date().toLocaleString()}
    `.trim()

    return receiptContent
  }

  const downloadReceipt = (content: string, giftName: string) => {
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${giftName.replace(/\s+/g, "_")}_Receipt.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (!gift) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#654321] mb-4">Gift Not Found</h1>
          <Link
            href="/gifts/past"
            className="inline-flex items-center gap-2 text-[#8B5A3C] hover:text-[#6B4423] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Past Gifts
          </Link>
        </div>
      </div>
    )
  }

  const displayedContributions = showAllContributors ? gift.contributions : gift.contributions.slice(0, 4)

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/gifts/past"
          className="inline-flex items-center gap-2 text-[#8B5A3C] hover:text-[#6B4423] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Past Gifts
        </Link>

        <div className="bg-white rounded-xl shadow-lg border-2 border-[#DAA520]/20 overflow-hidden">
          <div className="relative">
            <img src={gift.image || "/placeholder.svg"} alt={gift.name} className="w-full h-64 md:h-96 object-cover" />
            <div className="absolute top-4 right-4 bg-gradient-to-r from-[#DAA520] to-[#B8860B] text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg">
              <CheckCircle className="w-5 h-5" />
              Completed
            </div>
          </div>

          <div className="p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl font-bold text-[#654321] mb-4">{gift.name}</h1>
            <p className="text-[#8B4513]/80 mb-6">{gift.description}</p>

            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={handleShare}
                type="button"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] rounded-lg font-semibold hover:shadow-lg transition-all hover:scale-105"
              >
                <Share2 className="w-4 h-4" />
                Share Gift Memory
              </button>

              <button
                onClick={handleDownloadReceipt}
                type="button"
                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#DAA520] text-[#8B5A3C] rounded-lg font-semibold hover:bg-[#F5F1E8] transition-all hover:scale-105"
              >
                <Download className="w-4 h-4" />
                Download Receipt
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-[#F5F1E8] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-[#DAA520]" />
                  <span className="text-sm text-[#8B4513]/70">Total Amount</span>
                </div>
                <p className="text-2xl font-bold text-[#654321]">${gift.totalAmount}</p>
              </div>

              <div className="bg-[#F5F1E8] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-[#DAA520]" />
                  <span className="text-sm text-[#8B4513]/70">Contributors</span>
                </div>
                <p className="text-2xl font-bold text-[#654321]">{gift.contributors}</p>
              </div>

              <div className="bg-[#F5F1E8] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-[#DAA520]" />
                  <span className="text-sm text-[#8B4513]/70">Completed Date</span>
                </div>
                <p className="text-lg font-bold text-[#654321]">{new Date(gift.completedDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="border-t-2 border-[#DAA520]/20 pt-6">
              <h2 className="text-[18px] font-bold text-[#654321] mb-4">Recent Contributions</h2>
              <div className="space-y-3">
                {displayedContributions.map((contribution, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-[#F5F1E8] rounded-lg">
                    <div>
                      <p className="font-semibold text-[#654321]">{contribution.name}</p>
                      <p className="text-sm text-[#8B4513]/70">{new Date(contribution.date).toLocaleDateString()}</p>
                    </div>
                    <p className="text-sm font-semibold text-[#DAA520]">${contribution.amount}</p>
                  </div>
                ))}
              </div>

              {gift.contributions.length > 4 && (
                <button
                  onClick={() => setShowAllContributors(!showAllContributors)}
                  className="mt-4 w-full px-4 py-2 bg-white border-2 border-[#DAA520] text-[#8B5A3C] rounded-lg font-semibold hover:bg-[#F5F1E8] transition-all flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  {showAllContributors ? "Show Less" : `Show All ${gift.contributors} Contributors`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
