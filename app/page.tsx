import Header from "@/components/header"
import Hero from "@/components/hero"
import Steps from "@/components/steps"
import AIGiftAssistant from "@/components/ai-gift-assistant"
import QuickStartCards from "@/components/quick-start-cards"
import TrendingGifts from "@/components/trending-gifts"
import TrackManage from "@/components/track-manage"
import ShareWidget from "@/components/share-widget"
import Footer from "@/components/footer"

export const metadata = {
  title: "Wishbee.ai - Gift Together. Give Better.",
  description: "The modern wishlist that pools money for the perfect group gift",
}

export default function Home() {
  console.log("[v0] Home page is rendering")

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
      <Hero />
      <Steps />
      <AIGiftAssistant />
      <QuickStartCards />
      <TrendingGifts />
      <ShareWidget />
      <TrackManage />
      <Footer />
    </main>
  )
}
