"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Users } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const trendingGifts = [
  {
    id: 1,
    name: "Premium Espresso Machine",
    category: "Home & Kitchen",
    price: 899,
    contributors: 24,
    progress: 85,
    image: "/professional-espresso-setup.png",
  },
  {
    id: 2,
    name: "Designer Handbag",
    category: "Fashion",
    price: 1250,
    contributors: 18,
    progress: 72,
    image: "/luxury-quilted-handbag.png",
  },
  {
    id: 3,
    name: "Smart Home Hub Package",
    category: "Tech",
    price: 650,
    contributors: 31,
    progress: 95,
    image: "/smart-home-devices.jpg",
  },
  {
    id: 4,
    name: "Professional Camera Kit",
    category: "Photography",
    price: 1899,
    contributors: 15,
    progress: 60,
    image: "/camera-kit-professional.jpg",
  },
]

export default function TrendingGifts() {
  return (
    <section className="relative py-12 px-4 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 overflow-hidden">
      <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-br from-amber-300/20 to-yellow-300/20 rounded-full blur-2xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-32 h-32 bg-gradient-to-br from-orange-300/20 to-amber-300/20 rounded-full blur-3xl animate-pulse delay-700" />
      <div className="absolute top-1/2 left-1/4 text-6xl opacity-10 animate-bounce">🎁</div>
      <div className="absolute top-1/3 right-1/4 text-5xl opacity-10 animate-bounce delay-500">✨</div>

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-black mb-1">
            Popular Gifts
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-black font-medium mb-3">See what others are giving</p>

          <Link href="/gifts/browse" className="inline-block">
            <Button className="bg-gradient-to-r from-[#DAA520] to-[#FFD700] hover:from-[#B8860B] hover:to-[#DAA520] text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 border-2 border-amber-400 hover:border-amber-400 hover:-translate-y-2">
              View All Gifts
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingGifts.map((gift, index) => (
            <div
              key={gift.id}
              className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group border-2 border-amber-200 hover:border-amber-400 hover:-translate-y-2"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                <Image
                  src={gift.image || "/placeholder.svg"}
                  alt={gift.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-3 right-3 bg-gradient-to-r from-[#DAA520] to-[#FFD700] text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold shadow-lg border-2 border-white">
                  {gift.progress}%
                </div>
              </div>

              <div className="p-6">
                <div className="text-xs text-amber-600 uppercase tracking-wider font-bold mb-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                  {gift.category}
                </div>
                <h3 className="font-bold text-gray-900 mb-3 text-lg line-clamp-2 group-hover:text-amber-700 transition-colors">
                  {gift.name}
                </h3>

                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent text-base sm:text-lg md:text-xl">
                    ${gift.price}
                  </span>
                  <span className="text-amber-600 flex items-center gap-1.5 text-xs sm:text-sm font-semibold bg-amber-50 px-2 sm:px-3 py-1 rounded-full">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                    {gift.contributors}
                  </span>
                </div>

                <div className="w-full bg-amber-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#DAA520] to-[#FFD700] h-2.5 rounded-full transition-all duration-500 shadow-inner"
                    style={{ width: `${gift.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
