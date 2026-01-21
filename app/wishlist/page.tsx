import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MyWishlistDisplay } from "@/components/my-wishlist-display"

export const metadata = {
  title: "My Wishlist - Wishbee.ai",
  description: "View and manage your wishlist items",
}

export default function WishlistPage() {
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

      <div className="container mx-auto px-4 py-12">
        <MyWishlistDisplay />
      </div>

      <Footer />
    </main>
  )
}
