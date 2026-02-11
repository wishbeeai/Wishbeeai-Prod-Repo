import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FAQSection } from "@/components/faq-section"
import { Shield, BadgeCheck, CreditCard, Heart } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "About Donations | Wishbee.ai",
  description:
    "Learn how Wishbee handles charity donations, tax receipts, Support Wishbee tips, and secure payments via Stripe.",
}

export default function AboutDonationsPage() {
  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] mb-6">
            <Heart className="w-8 h-8 text-[#654321]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#654321] mb-4">
            About Donations
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            When you settle a group gift, leftover balance can go to charity or
            support Wishbee. Here’s how it works.
          </p>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          <div className="flex items-center gap-4 bg-white rounded-lg shadow-md p-6 border border-[#E8E0D5]">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#635BFF]/10 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-[#635BFF]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#654321]">
                Secure Payments via Stripe
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                PCI-DSS compliant. We never store your full card details.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white rounded-lg shadow-md p-6 border border-[#E8E0D5]">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <BadgeCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-[#654321]">
                Verified 501(c)(3) Partners
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Tax-deductible donations to IRS-recognized nonprofits.
              </p>
            </div>
          </div>
        </div>

        {/* Support Wishbee Note */}
        <div className="bg-amber-50 border-2 border-[#DAA520]/40 rounded-lg p-6 mb-12">
          <div className="flex gap-3">
            <Shield className="w-6 h-6 text-[#DAA520] flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-[#654321] mb-2">
                Support Wishbee
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Tips to Support Wishbee are <strong>not tax-deductible</strong>{" "}
                charitable contributions—they go directly to the Wishbee
                platform. Your tips help us keep Wishbee free for everyone:
                maintaining our AI tools, servers, and features. Thank you for
                supporting us!
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <FAQSection />
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/gifts/active"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] px-6 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity"
          >
            View Active Gifts
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
