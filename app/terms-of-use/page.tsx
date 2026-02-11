import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FileText, CheckCircle, Settings, User, CreditCard, Copyright, AlertTriangle, Mail } from "lucide-react"

export const metadata = {
  title: "Terms of Use - Wishbee.ai",
  description: "Wishbee.ai Terms of Use - Terms and conditions for using our service",
}

const SECTIONS = [
  {
    icon: CheckCircle,
    title: "Acceptance of Terms",
    body: "By accessing and using Wishbee.ai, you accept and agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use our service.",
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
    icon: CreditCard,
    title: "Payments and Refunds",
    body: "All payments are processed securely through Stripe. Refund policies are determined on a case-by-case basis. Please contact support for refund requests.",
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
