"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Heart, FileText } from "lucide-react"
import { getCharityById } from "@/lib/charity-data"

type ReceiptData = {
  id: string
  giftId: string
  amount: number
  disposition: "charity" | "tip" | "bonus"
  charityName?: string | null
  charityId?: string | null
  dedication?: string | null
  recipientName?: string | null
  giftName?: string | null
  totalFundsCollected?: number | null
  finalGiftPrice?: number | null
  createdAt: string
}

export default function DonationReceiptPage() {
  const params = useParams()
  const giftId = params.id as string
  const settlementId = params.settlementId as string
  const [receipt, setReceipt] = useState<ReceiptData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!giftId || !settlementId) return
    const fetchReceipt = async () => {
      try {
        const res = await fetch(`/api/gifts/${giftId}/settlement/${settlementId}`)
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || "Receipt not found")
        }
        const data = await res.json()
        setReceipt(data.receipt)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load receipt")
      } finally {
        setLoading(false)
      }
    }
    fetchReceipt()
  }, [giftId, settlementId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FEF7ED] via-[#FFF7ED] to-[#FFFBEB] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-2 border-[#DAA520] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-[#8B5A3C] font-medium">Loading receipt...</p>
        </div>
      </div>
    )
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FEF7ED] via-[#FFF7ED] to-[#FFFBEB] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <p className="text-[#8B5A3C] mb-4">{error || "Receipt not found"}</p>
          <Link
            href={`/gifts/${giftId}`}
            className="inline-flex items-center gap-2 text-[#DAA520] font-semibold hover:text-[#B8860B]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to gift details
          </Link>
        </div>
      </div>
    )
  }

  const dateStr = receipt.createdAt
    ? new Date(receipt.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : ""

  const isCharity = receipt.disposition === "charity"
  const isTip = receipt.disposition === "tip"

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEF7ED] via-[#FFF7ED] to-[#FFFBEB] py-8 px-4">
      <div className="max-w-lg mx-auto">
        <Link
          href={`/gifts/${giftId}`}
          className="inline-flex items-center gap-2 text-[#8B5A3C] hover:text-[#6B4423] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to gift details
        </Link>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-[#DAA520]/20">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] px-6 py-5 border-b-2 border-[#4A2F1A]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                {isCharity ? (
                  <Heart className="w-6 h-6 text-[#F5DEB3]" />
                ) : (
                  <FileText className="w-6 h-6 text-[#F5DEB3]" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#F5DEB3]">
                  {isCharity ? "Donation Receipt" : isTip ? "Tip Receipt" : "Settlement Receipt"}
                </h1>
                <p className="text-[#F5DEB3]/80 text-sm">via Wishbee.ai</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <p className="text-base text-[#654321] leading-relaxed">
              {isCharity && receipt.charityName && (
                <>
                  <span className="font-bold tabular-nums text-[#654321]">${receipt.amount.toFixed(2)}</span>
                  {" "}is scheduled to be donated to{" "}
                  <span className="font-semibold">{receipt.charityName}</span>
                  {" "}as part of the monthly Wishbee gift 🎁
                </>
              )}
              {isTip && (
                <>
                  Your tip of{" "}
                  <span className="font-bold tabular-nums text-[#654321]">${receipt.amount.toFixed(2)}</span>
                  {" "}has been added to the Wishbee development fund to help keep our AI free.
                </>
              )}
              {!isCharity && !isTip && (
                <>
                  <span className="font-bold tabular-nums text-[#654321]">${receipt.amount.toFixed(2)}</span>
                  {" "}was settled for this gift.
                </>
              )}
              </p>
            </div>

            {receipt.dedication && (
              <p className="text-sm text-[#8B5A3C]/90 italic">"{receipt.dedication}"</p>
            )}

            <div className="rounded-lg border border-[#DAA520]/30 bg-[#FFFBEB]/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#8B5A3C]">Amount</span>
                <span className="font-bold text-[#654321]">${receipt.amount.toFixed(2)}</span>
              </div>
              {receipt.giftName && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#8B5A3C]">Gift / Event</span>
                  <span className="font-medium text-[#654321]">{receipt.giftName}</span>
                </div>
              )}
              {receipt.recipientName && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#8B5A3C]">Recipient</span>
                  <span className="font-medium text-[#654321]">{receipt.recipientName}</span>
                </div>
              )}
              {receipt.totalFundsCollected != null && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#8B5A3C]">Total funds collected</span>
                  <span className="font-medium text-[#654321]">${receipt.totalFundsCollected.toFixed(2)}</span>
                </div>
              )}
              {receipt.finalGiftPrice != null && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#8B5A3C]">Final gift price</span>
                  <span className="font-medium text-[#654321]">${receipt.finalGiftPrice.toFixed(2)}</span>
                </div>
              )}
              {isCharity && receipt.charityName && (() => {
                const ein = receipt.charityId ? getCharityById(receipt.charityId)?.ein ?? null : null
                const einDisplay = ein ?? "N/A"
                return (
                  <div className="flex justify-between text-sm pt-2 border-t border-[#DAA520]/20">
                    <span className="text-[#8B5A3C]">Tax ID for {receipt.charityName}</span>
                    <span className="font-medium text-[#654321]">{einDisplay}</span>
                  </div>
                )
              })()}
              <div className="flex justify-between text-sm pt-2 border-t border-[#DAA520]/20">
                <span className="text-[#8B5A3C]">Date</span>
                <span className="font-medium text-[#654321]">{dateStr}</span>
              </div>
            </div>

            <Link
              href={`/gifts/${giftId}`}
              className="block w-full py-2.5 px-4 rounded-lg text-center text-sm font-semibold bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#3B2F0F] hover:brightness-105 transition-all"
            >
              View gift details
            </Link>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-[#F5F1E8] border-t border-[#DAA520]/20 text-center">
            <p className="text-xs text-[#8B5A3C]">
              Thanks for celebrating with Wishbee — your Operating System for Celebrations. 🐝
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
