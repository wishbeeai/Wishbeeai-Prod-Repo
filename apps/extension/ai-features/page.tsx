import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AIClipExtension } from "@/components/ai-clip-extension"
import { AITitleSuggestions } from "@/components/ai-title-suggestions"
import { AIGoalOptimizer } from "@/components/ai-goal-optimizer"
import { AIContributionSuggestions } from "@/components/ai-contribution-suggestions"
import { AIGreetingGenerator } from "@/components/ai-greeting-generator"
import { AITrackDashboard } from "@/components/ai-track-dashboard"

export const metadata = {
  title: "AI Features - Wishbee.ai",
  description: "Experience the power of AI in group gifting",
}

export default function AIFeaturesPage() {
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
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">AI-Powered Group Gifting</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience intelligent features that make group gifting smarter, faster, and more personalized
          </p>
        </div>

        {/* Clip & Auto-Tag Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Clip & Auto-Tag</h2>
          <div className="flex justify-center">
            <AIClipExtension />
          </div>
        </section>

        {/* Start Funding Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Start Funding with AI</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <AITitleSuggestions />
            <AIGoalOptimizer />
          </div>
        </section>

        {/* Contribute & Greeting Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Contribute & Greet</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <AIContributionSuggestions />
            <AIGreetingGenerator />
          </div>
        </section>

        {/* Track & Manage Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Track & Manage Dashboard</h2>
          <AITrackDashboard />
        </section>
      </div>

      <Footer />
    </main>
  )
}
