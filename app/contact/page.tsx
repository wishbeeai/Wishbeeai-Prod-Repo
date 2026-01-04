"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { useState } from "react"
import { Mail, MessageSquare, Send, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setIsSubmitted(true)
        setFormData({ name: "", email: "", subject: "", message: "" })
        toast.success("Message sent successfully! We'll get back to you soon.")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to send message. Please try again.")
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#F5F1E8]">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-[#654321] mb-4">Message Sent!</h1>
            <p className="text-lg text-gray-600 mb-8">
              Thank you for contacting us. We've received your message and will get back to you as soon as possible.
            </p>
            <Button
              onClick={() => setIsSubmitted(false)}
              className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:from-[#F4C430] hover:to-[#DAA520]"
            >
              Send Another Message
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] mb-6">
            <MessageSquare className="w-8 h-8 text-[#654321]" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#654321] mb-4">
            Get in Touch
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Have a question or feedback? We'd love to hear from you!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-[#654321] mb-6">Send us a message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-[#654321] mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="border-gray-300 focus:border-[#DAA520]"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-[#654321] mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="border-gray-300 focus:border-[#DAA520]"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-[#654321] mb-2">
                    Subject
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    value={formData.subject}
                    onChange={handleChange}
                    className="border-gray-300 focus:border-[#DAA520]"
                    placeholder="What's this about?"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-[#654321] mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    required
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    className="border-gray-300 focus:border-[#DAA520] resize-none"
                    placeholder="Tell us what's on your mind..."
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:from-[#F4C430] hover:to-[#DAA520] h-12 text-lg font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-[#654321] border-t-transparent rounded-full animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-[#654321] mb-4">Other Ways to Reach Us</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#DAA520] to-[#F4C430] flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-[#654321]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#654321]">Email</p>
                    <a
                      href="mailto:support@wishbee.ai"
                      className="text-gray-600 hover:text-[#DAA520] transition-colors"
                    >
                      support@wishbee.ai
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#DAA520] to-[#F4C430] rounded-lg p-6">
              <h3 className="text-xl font-bold text-[#654321] mb-3">Response Time</h3>
              <p className="text-[#654321]">
                We typically respond within 24-48 hours during business days. For urgent matters, 
                please mention it in your message.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-[#654321] mb-3">Common Questions?</h3>
              <p className="text-gray-600 mb-4">
                Check out our help center for answers to frequently asked questions.
              </p>
              <a
                href="/help"
                className="text-[#DAA520] hover:text-[#F4C430] font-semibold transition-colors"
              >
                Visit Help Center →
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

