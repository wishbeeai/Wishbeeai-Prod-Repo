import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Shield, Database, Building2, Lock, Heart, Mail, Cookie, BarChart3, Cpu, MailPlus, Clock, Users, RefreshCw } from "lucide-react"

export const metadata = {
  title: "2025 Wishbee.ai Privacy Policy",
  description: "2025 Wishbee.ai Privacy Policy - How we collect, use, and protect your data",
}

const SECTIONS = [
  {
    icon: Database,
    title: "Data Collection",
    body: (
      <>
        We collect information you provide directly, including: account information (name, email, phone, location, bio, birthday, profile image), wishlist items and product preferences, payment information (processed by Stripe—we do not store full card numbers), and information you submit when creating or contributing to group gifts. We use this data to coordinate gift pools, notify contributors, deliver receipts, and operate the service.
      </>
    ),
  },
  {
    icon: BarChart3,
    title: "Analytics & Performance",
    body: "We use analytics services (e.g. Vercel Analytics, Google Analytics) and error monitoring (e.g. Sentry) to understand site usage, improve our services, and fix technical issues. These tools may collect anonymized or pseudonymized data such as pages visited, referral sources, device information, and error logs.",
  },
  {
    icon: Cpu,
    title: "AI Processing",
    body: "Our AI-powered features (product extraction from URLs, banner generation, description enhancement) may process product links and content you provide through third-party AI providers. This processing helps deliver convenience features such as auto-tagging and suggestions. We do not use your data to train AI models for purposes unrelated to providing our service.",
  },
  {
    icon: MailPlus,
    title: "Email Communications",
    body: "We use Resend and similar email services to send transactional emails such as contribution confirmations, settlement receipts, gift reminders, and account-related notifications. We do not share your email with third parties for marketing purposes.",
  },
  {
    icon: Building2,
    title: "Third-Party Partners",
    body: (
      <>
        Payment data is handled by <strong>Stripe</strong>. Wishbee does not store full credit card numbers. Card
        details are processed directly by our payment partner and are not retained on our systems.
      </>
    ),
  },
  {
    icon: Cookie,
    title: "Affiliate Tracking and Third-Party Cookies",
    body: (
      <>
        To facilitate our group gifting services and earn commissions that support the platform, Wishbee uses third-party affiliate service providers, including Amazon, Sovrn, and Skimlinks. When you interact with a product link on our platform, these providers may place a cookie on your browser or use similar tracking technologies to collect technical information (such as your IP address and device identifier) to track successful transactions.
        <br /><br />
        You can manage your cookie preferences through your browser settings or opt-out of certain tracking by visiting the Network Advertising Initiative or the privacy portals of our respective partners.
      </>
    ),
  },
  {
    icon: Lock,
    title: "Non-Disclosure",
    body: "We do not sell or trade user data to third parties for marketing purposes. Your information is used only to operate the Wishbee service, fulfill gifts, process donations, and communicate with you about your account and transactions.",
  },
  {
    icon: Heart,
    title: "Donation Transparency",
    body: "When you choose to donate a remaining balance to a charity, recipient names may be shared with the selected charity solely for the purpose of the \"In Honor Of\" donation. This allows the charity to acknowledge the gift appropriately. We do not permit charities to use this information for their own marketing unless you have opted in separately with that organization.",
  },
  {
    icon: Clock,
    title: "Data Retention",
    body: "We retain your data for as long as your account is active and as needed to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. You may request deletion of your account and associated data at any time.",
  },
  {
    icon: Users,
    title: "Children's Privacy",
    body: "Wishbee is not intended for users under the age of 13 (or the applicable age of digital consent in your jurisdiction). We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us so we can delete it.",
  },
  {
    icon: RefreshCw,
    title: "Policy Updates",
    body: "We may update this privacy policy from time to time. We will notify you of material changes by posting the updated policy on this page and updating the \"Last updated\" date. Your continued use of Wishbee after changes take effect constitutes acceptance of the revised policy.",
  },
]

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F5F1E8]">
      <Header />

      <div className="container mx-auto px-4 py-12 sm:py-16 max-w-4xl">
        <div className="rounded-2xl border-2 border-[#DAA520]/25 bg-gradient-to-b from-[#FFFBF0] to-[#FEF7ED] shadow-lg shadow-[#654321]/5 overflow-hidden">
          <div className="p-6 sm:p-8 md:p-10">
            <div className="flex flex-col items-center text-center mb-10">
              <div className="flex items-center justify-center gap-3">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#DAA520]/20 border-2 border-[#DAA520]/30 flex-shrink-0" aria-hidden>
                  <Shield className="w-7 h-7 text-[#B8860B]" />
                </div>
                <h1 className="font-sans text-2xl sm:text-3xl md:text-4xl font-bold leading-tight tracking-tight text-[#654321]">
                  Privacy Policy
                </h1>
              </div>
              <p className="mt-2 text-sm text-[#8B5A3C]/80">How we collect, use, and protect your data</p>
              <p className="mt-1 text-xs text-[#8B5A3C]/60">Last updated: February 14, 2025</p>
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
                  <p className="text-sm sm:text-base text-[#654321]/95 leading-relaxed">
                    {body}
                  </p>
                </section>
              ))}

              <section className="rounded-xl border border-[#DAA520]/20 bg-white/60 p-5 sm:p-6">
                <h2 className="flex items-center gap-2 text-base sm:text-lg font-bold text-[#654321] mb-3">
                  <Mail className="w-5 h-5 text-[#B8860B] flex-shrink-0" aria-hidden />
                  Contact
                </h2>
                <p className="text-sm sm:text-base text-[#654321]/95 leading-relaxed">
                  Questions about this privacy policy? Contact us at{" "}
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
