"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Gift } from "lucide-react"

interface WishlistCTAProps {
  isLoggedIn: boolean
}

export function WishlistCTA({ isLoggedIn }: WishlistCTAProps) {
  return (
    <div className="py-8 sm:py-10">
      <div className="bg-gradient-to-br from-[#FFF8DC] to-[#FFEFD5] rounded-xl p-6 sm:p-8 text-center max-w-lg mx-auto border-2 border-[#DAA520]/20">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Gift className="w-6 h-6 text-[#DAA520]" />
          <h3 className="text-lg sm:text-xl font-semibold text-[#8B4513]">
            Want to create your own wishlist?
          </h3>
        </div>
        
        <p className="text-sm text-[#A0522D] mb-5">
          Start your wishlist today – it&apos;s free!
        </p>
        
        <Link href={isLoggedIn ? "/wishlist/add" : "/signup"}>
          <Button className="h-12 px-8 rounded-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] hover:from-[#F4C430] hover:to-[#DAA520] text-[#654321] font-semibold text-base shadow-md hover:shadow-lg transition-all hover:scale-105">
            {isLoggedIn ? "Create a New Wishlist" : "Create My Wishlist"}
          </Button>
        </Link>
      </div>
    </div>
  )
}
