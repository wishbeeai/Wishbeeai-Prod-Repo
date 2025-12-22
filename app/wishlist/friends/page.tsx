import { Header } from "@/components/header"
import Footer from "@/components/footer"
import FriendsWishlistManager from "@/components/friends-wishlist-manager"
import { Users, Heart } from "lucide-react"

export const metadata = {
  title: "Friends' Wishlists - Wishbee.ai",
  description: "View and contribute to your friends' wishlists with AI-powered recommendations",
}

export default function FriendsWishlistPage() {
  return (
    <main
      className="min-h-screen"
      style={{
        backgroundColor: "#F5F1E8",
        backgroundImage: "radial-gradient(circle at 2px 2px, rgba(218, 165, 32, 0.08) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    >
      <Header />

      <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-12">
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Users className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-amber-600" />
            <Heart className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-rose-500 fill-rose-500" />
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
            Friends' Wishlists
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Discover what your friends want and contribute to their perfect gifts with AI insights
          </p>
        </div>

        <FriendsWishlistManager />
      </div>

      <Footer />
    </main>
  )
}
