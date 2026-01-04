import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export const metadata = {
  title: "Terms of Use - Wishbee.ai",
  description: "Wishbee.ai Terms of Use - Terms and conditions for using our service",
}

export default function TermsOfUsePage() {
  return (
    <main className="min-h-screen bg-[#F5F1E8]">
      <Header />
      
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-[1.1] tracking-tight text-[#654321] mb-8">
          Terms of Use
        </h1>
        
        <div className="prose prose-lg max-w-none space-y-6 text-xs sm:text-sm md:text-lg text-[#654321]">
          <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-6">
            Last Updated: January 3, 2025
          </p>

          <section>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#654321] mb-4">
              Acceptance of Terms
            </h2>
            <p>
              By accessing and using Wishbee.ai, you accept and agree to be bound by these Terms of Use. 
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#654321] mb-4">
              Use of Service
            </h2>
            <p>You agree to use Wishbee.ai only for lawful purposes and in accordance with these terms. You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on the rights of others</li>
              <li>Transmit any harmful or malicious code</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Use the service for any fraudulent or deceptive purpose</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#654321] mb-4">
              User Accounts
            </h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all 
              activities that occur under your account. You agree to notify us immediately of any unauthorized use.
            </p>
          </section>

          <section>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#654321] mb-4">
              Payments and Refunds
            </h2>
            <p>
              All payments are processed securely through Stripe. Refund policies are determined on a case-by-case basis. 
              Please contact support for refund requests.
            </p>
          </section>

          <section>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#654321] mb-4">
              Intellectual Property
            </h2>
            <p>
              All content on Wishbee.ai, including text, graphics, logos, and software, is the property of Wishbee.ai 
              or its licensors and is protected by copyright and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#654321] mb-4">
              Limitation of Liability
            </h2>
            <p>
              Wishbee.ai is provided "as is" without warranties of any kind. We are not liable for any indirect, 
              incidental, or consequential damages arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#654321] mb-4">
              Contact Us
            </h2>
            <p>
              If you have questions about these terms, please contact us at{" "}
              <a href="mailto:legal@wishbee.ai" className="text-[#DAA520] hover:text-[#F4C430] underline">
                legal@wishbee.ai
              </a>
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  )
}

