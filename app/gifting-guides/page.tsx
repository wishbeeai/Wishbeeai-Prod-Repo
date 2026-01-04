import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BookOpen, Users, Gift, Calendar, DollarSign, Share2, CheckCircle } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Gifting Guides | Wishbee.ai",
  description: "Learn how to create perfect group gifts with our comprehensive guides",
}

export default function GiftingGuidesPage() {
  const guides = [
    {
      icon: BookOpen,
      title: "Getting Started with Group Gifting",
      description: "Learn the basics of creating your first group gift collection",
      steps: [
        "Create a new gift collection",
        "Add products from any online store",
        "Set your goal amount and timeline",
        "Share with friends and family",
        "Watch contributions come in",
      ],
      color: "from-[#DAA520] to-[#F4C430]",
    },
    {
      icon: Users,
      title: "Organizing Group Contributions",
      description: "Best practices for coordinating group gifts",
      steps: [
        "Set clear contribution goals",
        "Communicate deadlines clearly",
        "Use our progress tracking features",
        "Send friendly reminders when needed",
        "Celebrate when you reach your goal",
      ],
      color: "from-[#FF6B6B] to-[#FF8E53]",
    },
    {
      icon: Gift,
      title: "Choosing the Perfect Gift",
      description: "Tips for selecting gifts that recipients will love",
      steps: [
        "Consider the recipient's interests",
        "Check their wishlist if available",
        "Think about practical vs. sentimental",
        "Consider group preferences",
        "Use AI recommendations for ideas",
      ],
      color: "from-[#14B8A6] to-[#2DD4BF]",
    },
    {
      icon: Calendar,
      title: "Planning for Special Occasions",
      description: "How to organize gifts for birthdays, weddings, and more",
      steps: [
        "Start planning early",
        "Set appropriate deadlines",
        "Coordinate with other gift-givers",
        "Plan for delivery timing",
        "Include a personal message",
      ],
      color: "from-[#9333EA] to-[#A855F7]",
    },
    {
      icon: DollarSign,
      title: "Setting Contribution Goals",
      description: "How to determine the right goal amount",
      steps: [
        "Research product prices",
        "Consider shipping and taxes",
        "Set a realistic timeline",
        "Allow for flexibility",
        "Communicate clearly with contributors",
      ],
      color: "from-[#0EA5E9] to-[#38BDF8]",
    },
    {
      icon: Share2,
      title: "Sharing Your Gift Collection",
      description: "Effective ways to share and promote your collection",
      steps: [
        "Use our share buttons",
        "Post on social media",
        "Send personalized emails",
        "Share in group chats",
        "Follow up with reminders",
      ],
      color: "from-[#EC4899] to-[#F472B6]",
    },
  ]

  const tips = [
    {
      title: "Start Early",
      description: "Give your group plenty of time to contribute. Starting 2-3 weeks before the occasion is ideal.",
    },
    {
      title: "Be Clear About Goals",
      description: "Set a specific goal amount and explain what the gift is for. Transparency builds trust.",
    },
    {
      title: "Send Friendly Reminders",
      description: "Use our reminder feature to gently nudge contributors without being pushy.",
    },
    {
      title: "Celebrate Milestones",
      description: "Acknowledge when you hit 25%, 50%, and 75% of your goal to keep momentum going.",
    },
    {
      title: "Add Personal Touches",
      description: "Include a group message or video to make the gift more meaningful.",
    },
    {
      title: "Thank Your Contributors",
      description: "Always thank everyone who contributed, regardless of the amount.",
    },
  ]

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] mb-6">
            <BookOpen className="w-8 h-8 text-[#654321]" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#654321] mb-4">
            Gifting Guides
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Learn how to create perfect group gifts with our comprehensive guides and tips
          </p>
        </div>

        {/* Guides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {guides.map((guide, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className={`w-14 h-14 rounded-full bg-gradient-to-r ${guide.color} flex items-center justify-center mb-4`}>
                <guide.icon className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-[#654321] mb-2">{guide.title}</h2>
              <p className="text-gray-600 mb-4">{guide.description}</p>
              <ul className="space-y-2">
                {guide.steps.map((step, stepIndex) => (
                  <li key={stepIndex} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-[#DAA520] flex-shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Tips Section */}
        <div className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] rounded-lg p-8 md:p-12 mb-16">
          <h2 className="text-3xl font-bold text-[#654321] text-center mb-8">Pro Tips for Successful Group Gifting</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tips.map((tip, index) => (
              <div key={index} className="bg-white/90 rounded-lg p-6">
                <h3 className="text-lg font-bold text-[#654321] mb-2">{tip.title}</h3>
                <p className="text-gray-700">{tip.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-lg shadow-md p-8">
          <h2 className="text-3xl font-bold text-[#654321] mb-4">Ready to Create Your First Group Gift?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Put these guides into practice and start gifting together today
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/gifts/create"
              className="inline-block bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] px-8 py-4 rounded-full font-semibold hover:from-[#F4C430] hover:to-[#DAA520] transition-all shadow-lg hover:shadow-xl"
            >
              Create a Gift Collection
            </Link>
            <Link
              href="/help"
              className="inline-block border-2 border-[#8B4513] text-[#8B4513] px-8 py-4 rounded-full font-semibold hover:bg-[#8B4513] hover:text-white transition-all"
            >
              Get More Help
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

