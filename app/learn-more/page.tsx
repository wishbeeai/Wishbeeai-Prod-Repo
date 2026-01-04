import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export const metadata = {
  title: "Learn More - Wishbee.ai",
  description: "Learn more about how Wishbee.ai uses affiliate links and supports our platform",
}

export default function LearnMorePage() {
  return (
    <main className="min-h-screen bg-[#F5F1E8]">
      <Header />
      
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-[1.1] tracking-tight text-[#654321] mb-8">
          Learn More About Affiliate Links
        </h1>
        
        <div className="prose prose-lg max-w-none space-y-6 text-xs sm:text-sm md:text-lg text-[#654321]">
          <section>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#654321] mb-4">
              How We Keep Wishbee.ai Free
            </h2>
            <p>
              Wishbee.ai is free to use, and we keep it that way through affiliate partnerships. When you purchase 
              items through links on our platform, we may earn a small commission at no extra cost to you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#654321] mb-4">
              What Are Affiliate Links?
            </h2>
            <p>
              Affiliate links are special URLs that allow us to earn a commission when you make a purchase. 
              The price you pay remains exactly the same - we simply receive a small percentage from the retailer 
              for referring you to their site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#654321] mb-4">
              Your Privacy Matters
            </h2>
            <p>
              We are transparent about our use of affiliate links. These partnerships help us maintain and improve 
              Wishbee.ai without charging you subscription fees. Your shopping experience and prices remain unchanged.
            </p>
          </section>

          <section>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#654321] mb-4">
              Our Commitment
            </h2>
            <p>
              We only partner with trusted retailers and never compromise on user experience. All affiliate links 
              are clearly marked, and we always prioritize your privacy and security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#654321] mb-4">
              Questions?
            </h2>
            <p>
              If you have questions about our affiliate program, please contact us at{" "}
              <a href="mailto:support@wishbee.ai" className="text-[#DAA520] hover:text-[#F4C430] underline">
                support@wishbee.ai
              </a>
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  )
}

