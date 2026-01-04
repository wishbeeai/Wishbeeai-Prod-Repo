import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Heart, Users, Gift, Sparkles, Target, Zap } from "lucide-react"

export const metadata = {
  title: "About Us | Wishbee.ai",
  description: "Learn about Wishbee.ai - Making group gifting effortless and meaningful",
}

export default function AboutPage() {
  const values = [
    {
      icon: Heart,
      title: "Meaningful Connections",
      description: "We believe gifts are about bringing people together and creating lasting memories.",
      color: "from-[#EC4899] to-[#F472B6]",
    },
    {
      icon: Users,
      title: "Community First",
      description: "Gifting is better when shared. We make it easy for groups to contribute together.",
      color: "from-[#0EA5E9] to-[#38BDF8]",
    },
    {
      icon: Gift,
      title: "Thoughtful Gifting",
      description: "Every gift should be meaningful. Our platform helps you give something truly special.",
      color: "from-[#DAA520] to-[#F4C430]",
    },
    {
      icon: Sparkles,
      title: "Innovation",
      description: "We use AI and modern technology to make gifting effortless and enjoyable.",
      color: "from-[#9333EA] to-[#A855F7]",
    },
  ]

  const features = [
    {
      icon: Target,
      title: "Our Mission",
      description: "To make group gifting effortless, meaningful, and accessible to everyone. We believe that the best gifts come from the heart and are even better when shared.",
    },
    {
      icon: Zap,
      title: "Our Vision",
      description: "To become the leading platform for collaborative gifting, where friends and families can easily come together to give something truly special.",
    },
  ]

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] mb-6 text-4xl">
            🐝
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#654321] mb-6">
            About Wishbee.ai
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Making group gifting effortless, meaningful, and accessible to everyone
          </p>
        </div>

        {/* Story Section */}
        <div className="bg-white rounded-lg shadow-md p-8 md:p-12 mb-16">
          <h2 className="text-3xl font-bold text-[#654321] mb-6">Our Story</h2>
          <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
            <p>
              Wishbee.ai was born from a simple observation: group gifting should be easy, but it often isn't. 
              Coordinating contributions, tracking progress, and ensuring everyone can participate has traditionally 
              been a hassle. We set out to change that.
            </p>
            <p>
              Our platform combines the power of modern technology with the warmth of human connection. 
              Whether you're pooling funds for a friend's birthday, organizing a wedding gift, or planning a 
              group surprise, Wishbee.ai makes it seamless.
            </p>
            <p>
              With AI-powered features, intuitive design, and a focus on meaningful experiences, we're 
              redefining how people give gifts together. Every feature we build is designed with one goal 
              in mind: making gifting effortless so you can focus on what matters most—the people you care about.
            </p>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] flex items-center justify-center mb-6">
                <feature.icon className="w-8 h-8 text-[#654321]" />
              </div>
              <h3 className="text-2xl font-bold text-[#654321] mb-4">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-[#654321] text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className={`w-14 h-14 rounded-full bg-gradient-to-r ${value.color} flex items-center justify-center mb-4`}>
                  <value.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-[#654321] mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What Makes Us Different */}
        <div className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] rounded-lg p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold text-[#654321] mb-6">What Makes Us Different</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div>
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-bold text-[#654321] mb-2">AI-Powered</h3>
              <p className="text-[#654321]">
                Smart product extraction, personalized recommendations, and automated insights
              </p>
            </div>
            <div>
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-[#654321] mb-2">Lightning Fast</h3>
              <p className="text-[#654321]">
                Create collections in minutes, not hours. No complicated setup required
              </p>
            </div>
            <div>
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-[#654321] mb-2">Secure & Trusted</h3>
              <p className="text-[#654321]">
                Bank-level security for all transactions. Your data and payments are safe
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-[#654321] mb-4">Ready to Start Gifting?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of people who are making gifting easier and more meaningful
          </p>
          <a
            href="/"
            className="inline-block bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] px-8 py-4 rounded-full font-semibold hover:from-[#F4C430] hover:to-[#DAA520] transition-all shadow-lg hover:shadow-xl"
          >
            Get Started
          </a>
        </div>
      </main>
      <Footer />
    </div>
  )
}

