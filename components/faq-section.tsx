"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export type FAQItem = {
  question: string
  answer: string
}

export const DEFAULT_DONATION_FAQS: FAQItem[] = [
  {
    question: "What happens to leftover balance when a gift collection is settled?",
    answer:
      "When you settle a group gift, any leftover balance (contributions beyond the gift cost) can go to charity or to support Wishbee. You choose a 501(c)(3) charity partner—such as Feeding America, Red Cross, St. Jude, or UNICEF—or Support Wishbee. Charity donations are pooled monthly and sent to the selected organizations; tips to Wishbee help us keep the platform free.",
  },
  {
    question: "Are charity donations tax-deductible?",
    answer:
      "Yes. Donations to our charity partners (e.g., Feeding America, Red Cross, UNICEF) are made to verified 501(c)(3) organizations. You'll receive a receipt with the charity's name and EIN for your tax records. We use the IRS-standard language: 'No goods or services were provided in exchange for this contribution.' Please retain your receipt for tax purposes.",
  },
  {
    question: "What is Support Wishbee and is it tax-deductible?",
    answer:
      "Support Wishbee is an option to send your leftover balance as a tip to the Wishbee platform. These tips are not tax-deductible charitable contributions—they help us maintain our AI tools, servers, and keep the platform free for users. We're grateful for your support!",
  },
  {
    question: "How are payments processed?",
    answer:
      "All payments are processed securely through Stripe. We never store your full card details. Stripe is PCI-DSS Level 1 compliant and used by millions of businesses worldwide for secure payment processing.",
  },
  {
    question: "Who are the charity partners?",
    answer:
      "We partner with verified 501(c)(3) tax-exempt organizations, including Feeding America, American Red Cross, St. Jude Children's Research Hospital, World Wildlife Fund, Habitat for Humanity, UNICEF, and Environmental Defense Fund. Each organization has a verified EIN for tax receipts.",
  },
  {
    question: "How does the monthly donation batch work?",
    answer:
      "Charity donations are pooled by charity and processed monthly. When the batch is completed, you'll receive an impact email with a receipt link. Tips to Support Wishbee are processed immediately—no pooling.",
  },
]

type FAQSectionProps = {
  faqs?: FAQItem[]
  title?: string
  className?: string
}

export function FAQSection({
  faqs = DEFAULT_DONATION_FAQS,
  title = "Frequently Asked Questions",
  className = "",
}: FAQSectionProps) {
  return (
    <div className={className}>
      <h2 className="text-2xl font-bold text-[#654321] mb-6 pb-3 border-b-2 border-[#DAA520]/30">
        {title}
      </h2>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left text-[#654321] hover:text-[#DAA520] hover:no-underline">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-gray-600">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
