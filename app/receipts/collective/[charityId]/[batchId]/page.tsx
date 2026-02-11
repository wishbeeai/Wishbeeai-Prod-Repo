"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Heart } from "lucide-react"
import { getCharityById } from "@/lib/charity-data"

/**
 * Public page for collective donation receipts.
 * Hosts the charity's official acknowledgment for a completed batch.
 * TODO: Fetch batch details from API and display charity acknowledgment when available.
 */
export default function CollectiveReceiptPage({
  params,
}: {
  params: Promise<{ charityId: string; batchId: string }>
}) {
  const [resolved, setResolved] = useState<{ charityId: string; batchId: string } | null>(null)
  useEffect(() => {
    params.then(setResolved)
  }, [params])

  if (!resolved) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FEF7ED] via-[#FFF7ED] to-[#FFFBEB] flex items-center justify-center p-6">
        <div className="animate-spin w-10 h-10 border-2 border-[#DAA520] border-t-transparent rounded-full" />
      </div>
    )
  }

  const { charityId, batchId } = resolved
  const charityName = getCharityById(charityId)?.name ?? charityId

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEF7ED] via-[#FFF7ED] to-[#FFFBEB] py-8 px-4">
      <div className="max-w-lg mx-auto">
        <Link
          href="/gifts/active"
          className="inline-flex items-center gap-2 text-[#8B5A3C] hover:text-[#6B4423] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Active Gifts
        </Link>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-[#DAA520]/20">
          <div className="bg-gradient-to-r from-[#6B4423] via-[#8B5A3C] to-[#6B4423] px-6 py-5 border-b-2 border-[#4A2F1A]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Heart className="w-6 h-6 text-[#F5DEB3]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#F5DEB3]">Collective Donation Receipt</h1>
                <p className="text-[#F5DEB3]/80 text-sm">{charityName}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-base text-[#654321] leading-relaxed">
              Thank you for your generosity! This batch of donations has been officially contributed to{" "}
              <strong>{charityName}</strong> as part of the Wishbee monthly collective gift.
            </p>
            <p className="text-xs text-[#8B5A3C]/80">
              Batch ID: {batchId}
            </p>
            <p className="text-sm text-[#8B5A3C]/90">
              This page will display the charity&apos;s official acknowledgment when available.
            </p>
          </div>

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
