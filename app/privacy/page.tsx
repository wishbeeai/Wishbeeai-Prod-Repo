import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Shield, Database, Building2, Lock, Heart, Mail } from "lucide-react"

export const metadata = {
  title: "2025 Wishbee.ai Privacy Policy",
  description: "2025 Wishbee.ai Privacy Policy - How we collect, use, and protect your data",
}

const SECTIONS = [
  {
    icon: Database,
    title: "Data Collection",
    body: "We collect names and email addresses for the purpose of organizing gift pools and delivering receipts. This information is used to coordinate group gifts, notify contributors, and send transaction and tax receipts when applicable.",
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
    icon: Lock,
    title: "Non-Disclosure",
    body: "We do not sell or trade user data to third parties for marketing purposes. Your information is used only to operate the Wishbee service, fulfill gifts, process donations, and communicate with you about your account and transactions.",
  },
  {
    icon: Heart,
    title: "Donation Transparency",
    body: "When you choose to donate a remaining balance to a charity, recipient names may be shared with the selected charity solely for the purpose of the \"In Honor Of\" donation. This allows the charity to acknowledge the gift appropriately. We do not permit charities to use this information for their own marketing unless you have opted in separately with that organization.",
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
                  .
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
