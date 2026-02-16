import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export const metadata = {
  title: "Privacy Policy - Wishbee.ai",
  description: "Wishbee.ai Privacy Policy - How we collect, use, and protect your data",
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#F5F1E8]">
      <Header />
      
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-[1.1] tracking-tight text-[#654321] mb-8">
          Privacy Policy
        </h1>
        
        <div className="prose prose-lg max-w-none space-y-6 text-xs sm:text-sm md:text-lg text-[#654321]">
          <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-6">
            Last Updated: January 3, 2025
          </p>

          <section>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#654321] mb-4">
              Introduction
            </h2>
            <p>
              Welcome to Wishbee.ai. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy explains how we collect, use, and safeguard your information when you use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#654321] mb-4">
              Information We Collect
            </h2>
            <p>
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account information (name, email address)</li>
              <li>Wishlist items and preferences</li>
              <li>Payment information (processed securely through Stripe)</li>
              <li>Usage data and analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#654321] mb-4">
              How We Use Your Information
            </h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and improve our services</li>
              <li>Process transactions and payments</li>
              <li>Send you updates and notifications</li>
              <li>Personalize your experience</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#654321] mb-4">
              Affiliate Tracking and Third-Party Cookies
            </h2>
            <p>
              To facilitate our group gifting services and earn commissions that support the platform, Wishbee uses third-party affiliate service providers, including Amazon, Sovrn, and Skimlinks. When you interact with a product link on our platform, these providers may place a cookie on your browser or use similar tracking technologies to collect technical information (such as your IP address and device identifier) to track successful transactions.
            </p>
            <p>
              You can manage your cookie preferences through your browser settings or opt-out of certain tracking by visiting the Network Advertising Initiative or the privacy portals of our respective partners.
            </p>
          </section>

          <section>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#654321] mb-4">
              Data Security
            </h2>
            <p>
              We implement industry-standard security measures to protect your data, including encryption, 
              secure servers, and regular security audits. However, no method of transmission over the internet 
              is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#654321] mb-4">
              Your Rights
            </h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#654321] mb-4">
              Contact Us
            </h2>
            <p>
              If you have questions about this privacy policy, please contact us at{" "}
              <a href="mailto:privacy@wishbee.ai" className="text-[#DAA520] hover:text-[#F4C430] underline">
                privacy@wishbee.ai
              </a>
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  )
}

