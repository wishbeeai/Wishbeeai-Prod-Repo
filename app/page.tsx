import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Steps } from "@/components/steps"
import dynamic from "next/dynamic"

// Lazy load below-the-fold components for better initial load performance
const AIGiftAssistant = dynamic(() => import("@/components/ai-gift-assistant").then(mod => ({ default: mod.AIGiftAssistant })), {
  loading: () => <div className="min-h-[400px]" />,
})

const QuickStartCards = dynamic(() => import("@/components/quick-start-cards").then(mod => ({ default: mod.QuickStartCards })), {
  loading: () => <div className="min-h-[300px]" />,
})

const TrendingGifts = dynamic(() => import("@/components/trending-gifts").then(mod => ({ default: mod.TrendingGifts })), {
  loading: () => <div className="min-h-[500px]" />,
})

const TrackManage = dynamic(() => import("@/components/track-manage").then(mod => ({ default: mod.TrackManage })), {
  loading: () => <div className="min-h-[400px]" />,
})

const ShareWidget = dynamic(() => import("@/components/share-widget").then(mod => ({ default: mod.ShareWidget })), {
  loading: () => <div className="min-h-[300px]" />,
})

const Footer = dynamic(() => import("@/components/footer").then(mod => ({ default: mod.Footer })), {
  loading: () => <div className="min-h-[200px]" />,
})

export const metadata = {
  title: "Wishbee.ai - Gift Together. Give Better.",
  description: "The modern wishlist that pools money for the perfect group gift",
}

export default function Home() {
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
