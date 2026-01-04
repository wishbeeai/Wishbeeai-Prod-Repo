import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HelpCircle, MessageCircle, BookOpen, Video, Mail, Search } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Help & Support | Wishbee.ai",
  description: "Get help with Wishbee.ai - FAQs, guides, and support resources",
}

export default function HelpPage() {
  const faqs = [
    {
      category: "Getting Started",
      questions: [
        {
          q: "How do I create a wishlist?",
          a: "Creating a wishlist is easy! Click on 'My Wishlist' in the header, then click 'Add Wishlist' to start adding items. You can also use our browser extension to clip items directly from any online store.",
        },
        {
          q: "How does group gifting work?",
          a: "Group gifting allows friends and family to contribute together for a special gift. Create a collection, set a goal amount, and share it with your group. Everyone can contribute their own amount, and you'll see real-time progress.",
        },
        {
          q: "How do I install the browser extension?",
          a: "Visit our homepage and click 'Install Extension'. Choose your browser (Chrome, Firefox, Safari, or Edge) and follow the installation instructions. Once installed, you can clip products from any website with one click.",
        },
      ],
    },
    {
      category: "Gifting & Collections",
      questions: [
        {
          q: "Can I create multiple gift collections?",
          a: "Yes! You can create unlimited gift collections for different occasions, people, or purposes. Each collection can have its own goal, timeline, and contributors.",
        },
        {
          q: "How do I share a gift collection?",
          a: "Open your gift collection and click the 'Share' button. You can share via email, social media, or copy a link to send through any messaging app. Contributors can join and contribute directly from the shared link.",
        },
        {
          q: "What happens when a collection reaches its goal?",
          a: "Once a collection reaches its goal, you'll receive a notification. You can then proceed to checkout and purchase the gift. The funds are securely processed, and you'll receive the item to give to the recipient.",
        },
      ],
    },
    {
      category: "Payments & Contributions",
      questions: [
        {
          q: "What payment methods do you accept?",
          a: "We accept all major credit cards, PayPal, Apple Pay, Google Pay, Venmo, and Cash App. All payments are processed securely through our payment partners.",
        },
        {
          q: "Is my payment information secure?",
          a: "Absolutely! We use industry-standard encryption and never store your full payment details. All transactions are processed through secure, PCI-compliant payment processors.",
        },
        {
          q: "Can I contribute anonymously?",
          a: "Yes, when contributing to a gift collection, you can choose to contribute anonymously. Your contribution amount will be visible, but your name won't be shown.",
        },
      ],
    },
    {
      category: "Account & Settings",
      questions: [
        {
          q: "How do I update my profile?",
          a: "Click on your profile icon in the header, then select 'Settings'. From there, you can update your profile information, preferences, and account settings.",
        },
        {
          q: "Can I delete my account?",
          a: "Yes, you can delete your account at any time from the Settings page. Please note that this action is permanent and will remove all your data, wishlists, and gift collections.",
        },
        {
          q: "How do I change my password?",
          a: "Go to Settings > Security, then click 'Change Password'. You'll need to enter your current password and create a new one.",
        },
      ],
    },
  ]

  const helpResources = [
    {
      icon: BookOpen,
      title: "Gifting Guides",
      description: "Learn best practices for group gifting",
      href: "/gifting-guides",
      color: "from-[#DAA520] to-[#F4C430]",
    },
    {
      icon: Video,
      title: "Video Tutorials",
      description: "Watch step-by-step guides",
      href: "/",
      color: "from-[#FF6B6B] to-[#FF8E53]",
    },
    {
      icon: MessageCircle,
      title: "Contact Support",
      description: "Get in touch with our team",
      href: "/contact",
      color: "from-[#14B8A6] to-[#2DD4BF]",
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "support@wishbee.ai",
      href: "mailto:support@wishbee.ai",
      color: "from-[#9333EA] to-[#A855F7]",
    },
  ]

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] mb-6">
            <HelpCircle className="w-8 h-8 text-[#654321]" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#654321] mb-4">
            How can we help you?
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions or get in touch with our support team
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for help..."
              className="w-full pl-12 pr-4 py-4 rounded-full border-2 border-[#DAA520]/20 focus:border-[#DAA520] focus:outline-none bg-white text-[#654321] text-lg"
            />
          </div>
        </div>

        {/* Help Resources */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {helpResources.map((resource, index) => (
            <Link
              key={index}
              href={resource.href}
              className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 border border-gray-200"
            >
              <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${resource.color} flex items-center justify-center mb-4`}>
                <resource.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-[#654321] mb-2">{resource.title}</h3>
              <p className="text-sm text-gray-600">{resource.description}</p>
            </Link>
          ))}
        </div>

        {/* FAQs */}
        <div className="space-y-8">
          {faqs.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-white rounded-lg shadow-md p-6 md:p-8">
              <h2 className="text-2xl font-bold text-[#654321] mb-6 pb-3 border-b-2 border-[#DAA520]/30">
                {category.category}
              </h2>
              <div className="space-y-6">
                {category.questions.map((faq, faqIndex) => (
                  <details
                    key={faqIndex}
                    className="group border-b border-gray-200 last:border-b-0 pb-4 last:pb-0"
                  >
                    <summary className="cursor-pointer text-lg font-semibold text-[#654321] hover:text-[#DAA520] transition-colors list-none flex items-center justify-between">
                      <span>{faq.q}</span>
                      <span className="text-[#DAA520] group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <p className="mt-3 text-gray-600 leading-relaxed pl-4">{faq.a}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Still Need Help Section */}
        <div className="mt-16 bg-gradient-to-r from-[#DAA520] to-[#F4C430] rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-[#654321] mb-4">Still need help?</h2>
          <p className="text-lg text-[#654321] mb-6">
            Our support team is here to assist you. Get in touch and we'll respond as soon as possible.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-[#654321] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#4A2F1A] transition-colors shadow-lg hover:shadow-xl"
          >
            Contact Support
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}

