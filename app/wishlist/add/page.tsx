"use client"

import UnifiedAddWishlist from "@/components/unified-add-wishlist"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function AddWishlistPage() {
  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#8B5A3C] hover:text-[#6B4423] mb-6 transition-colors text-xs sm:text-sm md:text-base"
        >
          <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
          Back to Home
        </Link>
        <UnifiedAddWishlist />
      </div>
    </div>
  )
}
