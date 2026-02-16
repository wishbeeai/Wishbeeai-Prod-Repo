import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FileText, CheckCircle, Settings, User, CreditCard, Copyright, AlertTriangle, Mail, Link2, Calendar, Edit3, Ban, RefreshCw } from "lucide-react"

export const metadata = {
  title: "Terms of Use - Wishbee.ai",
  description: "Wishbee.ai Terms of Use - Terms and conditions for using our service",
}

const SECTIONS = [
  {
    icon: CheckCircle,
    title: "Ownership and Agreement",
    body: "This website and the Wishbee.ai platform (the \"Service\") are owned and operated by Complete AI IT Services, a trade name (DBA) of Complete Attire LLC (\"Company,\" \"we,\" \"us,\" or \"our\"). By accessing or using Wishbee.ai, you agree to be bound by these Terms of Service.",
  },
  {
    icon: Settings,
    title: "Use of Service",
    body: (
      <>
        You agree to use Wishbee.ai only for lawful purposes and in accordance with these terms. You agree not to:
        <ul className="list-disc pl-6 mt-3 space-y-2">
          <li>Violate any applicable laws or regulations</li>
          <li>Infringe on the rights of others</li>
          <li>Transmit any harmful or malicious code</li>
          <li>Attempt to gain unauthorized access to our systems</li>
          <li>Use the service for any fraudulent or deceptive purpose</li>
        </ul>
      </>
    ),
  },
  {
    icon: User,
    title: "User Accounts",
    body: "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use.",
  },
  {
    icon: Calendar,
    title: "Age Requirement",
    body: "You must be at least 13 years of age (or the age of digital consent in your jurisdiction) to use Wishbee. If you are under 18, you must have parental or guardian consent to use our service.",
  },
  {
    icon: Edit3,
    title: "User-Generated Content",
    body: "When you create wishlists, share gift collections, or post content on Wishbee, you grant us a license to use, display, and distribute that content in connection with operating the service. You represent that you have the right to share any content you post and that it does not violate the rights of others.",
  },
  {
    icon: CreditCard,
    title: "Payments and Refunds",
    body: "All payments are processed securely through Stripe. Refund policies are determined on a case-by-case basis. Please contact support for refund requests.",
  },
  {
    icon: CreditCard,
    title: "Financial Transactions",
    body: "All financial settlements, including \"Settle Balance\" payouts, refunds, and Wishbee Credits, are processed and managed by Complete Attire LLC.",
  },
  {
    icon: Link2,
    title: "Affiliate Disclosure & Commercial Relationship",
    body: (
      <>
        Wishbee is a shopping and group gifting platform. We want to be transparent about how we keep the lights on. Wishbee participates in various affiliate marketing programs. This means that when you click on a product link or &quot;clip&quot; an item to your wishlist and a purchase is later made, we may receive a commission from the retailer at no additional cost to you.
        <br /><br />
        Our AI-powered tools (including our product extraction and tagging features) are designed to provide convenience and suggestions. However, the presence of a product on Wishbee does not constitute an endorsement, and we are not responsible for the fulfillment, shipping, or quality of items purchased from third-party retailers.
      </>
    ),
  },
  {
    icon: Copyright,
    title: "Intellectual Property",
    body: "All content on Wishbee.ai, including text, graphics, logos, and software, is the property of Wishbee.ai or its licensors and is protected by copyright and other intellectual property laws.",
  },
  {
    icon: AlertTriangle,
    title: "Limitation of Liability",
    body: "Wishbee.ai is provided \"as is\" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service.",
  },
  {
    icon: Ban,
    title: "Termination",
    body: "We may suspend or terminate your account and access to the service at any time, with or without cause or notice. You may also close your account at any time. Upon termination, your right to use the service ceases immediately.",
  },
  {
    icon: RefreshCw,
    title: "Modifications",
    body: "We may update these Terms of Use from time to time. We will notify you of material changes by posting the updated terms on our site and updating the effective date. Continued use of the service after changes constitutes acceptance of the new terms.",
  },
]

export default function TermsOfUsePage() {
  return (
    <main className="min-h-screen bg-[#F5F1E8]">
      <Header />

      <div className="container mx-auto px-4 py-12 sm:py-16 max-w-4xl">
        <div className="rounded-2xl border-2 border-[#DAA520]/25 bg-gradient-to-b from-[#FFFBF0] to-[#FEF7ED] shadow-lg shadow-[#654321]/5 overflow-hidden">
          <div className="p-6 sm:p-8 md:p-10">
            <div className="flex flex-col items-center text-center mb-10">
              <div className="flex items-center justify-center gap-3">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#DAA520]/20 border-2 border-[#DAA520]/30 flex-shrink-0" aria-hidden>
                  <FileText className="w-7 h-7 text-[#B8860B]" />
                </div>
                <h1 className="font-sans text-2xl sm:text-3xl md:text-4xl font-bold leading-tight tracking-tight text-[#654321]">
                  Terms of Use
                </h1>
              </div>
              <p className="mt-2 text-sm text-[#8B5A3C]/80">Terms and conditions for using our service</p>
            </div>

            <div className="space-y-6">
              {SECTIONS.map(({ icon: Icon, title, body }) => (
                <section
                  key={title}
                  className="rounded-xl border border-[#DAA520]/20 bg-white/60 p-5 sm:p-6"
                >
                  <h2 className="flex items-center gap-2 text-base sm:text-lg font-bold text-[#654321] mb-3">
                    <Icon className="w-5 h-5 text-[#B8860B] flex-shrink-0" aria-hidden />
                    {title}
                  </h2>
                  <div className="text-sm sm:text-base text-[#654321]/95 leading-relaxed">
                    {body}
                  </div>
                </section>
              ))}

              <section className="rounded-xl border border-[#DAA520]/20 bg-white/60 p-5 sm:p-6">
                <h2 className="flex items-center gap-2 text-base sm:text-lg font-bold text-[#654321] mb-3">
                  <Mail className="w-5 h-5 text-[#B8860B] flex-shrink-0" aria-hidden />
                  Contact Us
                </h2>
                <p className="text-sm sm:text-base text-[#654321]/95 leading-relaxed">
                  If you have questions about these terms, please contact us at{" "}
                  <a
                    href="mailto:email@wishbee.ai"
                    className="text-[#B8860B] hover:text-[#DAA520] underline font-medium transition-colors"
                  >
                    email@wishbee.ai
                  </a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
