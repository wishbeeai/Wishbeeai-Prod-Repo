import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Mail } from "lucide-react"

export const metadata = {
  title: "Contact - Wishbee.ai",
  description: "Get in touch with the Wishbee team. We're here to help.",
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#F5F1E8]">
      <Header />

      <div className="container mx-auto px-4 py-16 sm:py-24 max-w-2xl">
        <div className="rounded-2xl border-2 border-[#DAA520]/25 bg-gradient-to-b from-[#FFFBF0] to-[#FEF7ED] shadow-lg shadow-[#654321]/5 overflow-hidden">
          <div className="p-8 sm:p-10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#DAA520]/20 border-2 border-[#DAA520]/30 mb-6" aria-hidden>
              <Mail className="w-7 h-7 text-[#B8860B]" />
            </div>

            <h1 className="font-[family-name:var(--font-shadows)] text-2xl sm:text-3xl md:text-4xl font-bold text-[#654321] mb-4">
              We&apos;re here to help.
            </h1>

            <p className="text-sm sm:text-base text-[#8B5A3C]/90 leading-relaxed mb-8 max-w-lg mx-auto">
              Have questions about a Wishbee gift? Drop us a line and our team will get back to you within 24 hours.
            </p>

            <a
              href="mailto:email@wishbee.ai"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#B8860B] via-[#DAA520] to-[#B8860B] shadow-md hover:shadow-lg hover:brightness-105 border border-[#654321]/20 transition-all focus:outline-none focus:ring-2 focus:ring-[#DAA520] focus:ring-offset-2 focus:ring-offset-[#F5F1E8]"
            >
              <Mail className="w-4 h-4" aria-hidden />
              email@wishbee.ai
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
