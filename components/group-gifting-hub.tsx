"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DollarSign,
  CreditCard,
  Lock,
  Heart,
  Users,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Palette,
  CheckCircle,
  Upload,
  X,
  ChevronLeft,
  Sparkles,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import LoginModal from "./login-modal" // Assuming LoginModal is in this path
import SignUpModal from "./signup-modal" // Assuming SignUpModal is in this path
import { useAuth } from "@/lib/auth-context"

interface ProductData {
  name: string
  image: string
  category: string
  fundedPercentage: number
}

const DEFAULT_PRODUCT: ProductData = {
  name: "Espresso Machine",
  image: "/images/expressomachine.webp",
  category: "",
  fundedPercentage: 60,
}

export function GroupGiftingHub() {
  const [product, setProduct] = useState<ProductData>(DEFAULT_PRODUCT)
  const [isLoadingProduct, setIsLoadingProduct] = useState(true)

  const [currentStep, setCurrentStep] = useState<"customize" | "amount" | "message" | "addProduct">("customize")

  const [collectionTitle, setCollectionTitle] = useState("")
  const [collectionDescription, setCollectionDescription] = useState("")
  const [collectionBanner, setCollectionBanner] = useState<string | null>(null)
  const [isAIGeneratedBanner, setIsAIGeneratedBanner] = useState(false)
  const [fundraisingGoal, setFundraisingGoal] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isExtractingBanner, setIsExtractingBanner] = useState(false) // Declare isExtractingBanner

  const [productLink, setProductLink] = useState("")
  const [isExtractingProduct, setIsExtractingProduct] = useState(false)
  const [extractedProduct, setExtractedProduct] = useState<any>(null)

  const { isAuthenticated, login } = useAuth()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false)
  // const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [contributions, setContributions] = useState<Array<{ amount: number; contributor: string }>>([])
  const [totalRaised, setTotalRaised] = useState(0)

  const [paymentMethod, setPaymentMethod] = useState<
    "card" | "paypal" | "applepay" | "googlepay" | "venmo" | "cashapp"
  >("card")

  // Payment fields
  const [amount, setAmount] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvc, setCvc] = useState("")
  const [cardName, setCardName] = useState("")

  const [paypalEmail, setPaypalEmail] = useState("")
  const [venmoPhone, setVenmoPhone] = useState("")
  const [cashappTag, setCashappTag] = useState("")

  const [errors, setErrors] = useState({
    amount: "",
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvc: "",
  })

  const [greetingMessage, setGreetingMessage] = useState("")
  const [greetingAuthor, setGreetingAuthor] = useState("")

  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const presetAmounts = [10, 25, 50, 100]

  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  const isStartFundingComplete = collectionTitle && collectionBanner && fundraisingGoal

  useEffect(() => {
    setIsLoadingProduct(false)
  }, [])

  const handlePresetClick = (value: number) => {
    setAmount(value.toString())
    setErrors({ ...errors, amount: "" })
  }

  const isPaymentComplete = Boolean(
    amount &&
      ((paymentMethod === "card" &&
        cardNumber &&
        cardNumber.replace(/\s/g, "").length === 16 &&
        cardName &&
        expiry &&
        expiry.length === 5 &&
        cvc &&
        cvc.length >= 3) ||
        (paymentMethod === "paypal" && paypalEmail && paypalEmail.includes("@") && paypalEmail.includes(".")) ||
        (paymentMethod === "applepay" && amount) || // Apple Pay requires amount only, payment handled by Apple
        (paymentMethod === "googlepay" && amount) || // Google Pay requires amount only, payment handled by Google
        (paymentMethod === "venmo" && venmoPhone && venmoPhone.trim().length > 0) ||
        (paymentMethod === "cashapp" && cashappTag && cashappTag.trim().length > 0)),
  )

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "")
    const chunks = cleaned.match(/.{1,4}/g)
    return chunks ? chunks.join(" ") : cleaned
  }

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, "")
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4)
    }
    return cleaned
  }

  const validateAmount = (value: string) => {
    if (!value) {
      return "Amount is required"
    }
    const numValue = Number.parseFloat(value)
    if (isNaN(numValue) || numValue <= 0) {
      return "Please enter a valid amount greater than 0"
    }
    if (numValue > 10000) {
      return "Amount cannot exceed $10,000"
    }
    return ""
  }

  const validateCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "")
    if (!cleaned) {
      return "Card number is required"
    }
    if (!/^\d+$/.test(cleaned)) {
      return "Card number must contain only digits"
    }
    if (cleaned.length !== 16) {
      return "Card number must be 16 digits"
    }
    // Luhn algorithm check
    let sum = 0
    let isEven = false
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = Number.parseInt(cleaned[i])
      if (isEven) {
        digit *= 2
        if (digit > 9) digit -= 9
      }
      sum += digit
      isEven = !isEven
    }
    if (sum % 10 !== 0) {
      return "Invalid card number"
    }
    return ""
  }

  const validateCardName = (value: string) => {
    if (!value.trim()) {
      return "Cardholder name is required"
    }
    if (value.trim().length < 3) {
      return "Name must be at least 3 characters"
    }
    if (!/^[a-zA-Z\s]+$/.test(value)) {
      return "Name can only contain letters and spaces"
    }
    return ""
  }

  const validateExpiry = (value: string) => {
    if (!value) {
      return "Expiry date is required"
    }
    if (value.length !== 5) {
      return "Expiry must be in MM/YY format"
    }
    const [month, year] = value.split("/")
    const monthNum = Number.parseInt(month)
    const yearNum = Number.parseInt(year)

    if (isNaN(monthNum) || isNaN(yearNum)) {
      return "Invalid expiry date"
    }
    if (monthNum < 1 || monthNum > 12) {
      return "Month must be between 01 and 12"
    }

    // Check if card is expired
    const now = new Date()
    const currentYear = now.getFullYear() % 100
    const currentMonth = now.getMonth() + 1

    if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
      return "Card has expired"
    }

    return ""
  }

  const validateCVC = (value: string) => {
    if (!value) {
      return "CVC is required"
    }
    if (!/^\d+$/.test(value)) {
      return "CVC must contain only digits"
    }
    if (value.length < 3 || value.length > 4) {
      return "CVC must be 3 or 4 digits"
    }
    return ""
  }

  const handleContinueToMessage = () => {
    const newErrors = {
      amount: validateAmount(amount),
      cardNumber: paymentMethod === "card" ? validateCardNumber(cardNumber) : "",
      cardName: paymentMethod === "card" ? validateCardName(cardName) : "",
      expiry: paymentMethod === "card" ? validateExpiry(expiry) : "",
      cvc: paymentMethod === "card" ? validateCVC(cvc) : "",
    }

    setErrors(newErrors)

    // Check if there are any errors
    const hasErrors = Object.values(newErrors).some((error) => error !== "")

    if (hasErrors) {
      toast({
        title: "Validation Error",
        description: "Please fix all errors before continuing",
        variant: "destructive",
      })
      return
    }

    // Move to message step
    setCurrentStep("message")
    toast({
      title: "Payment details verified",
      description: "Now add a personal greeting to your gift",
    })
  }

  const handleCompleteContribution = async () => {
    // Greeting message is optional but author required if message provided
    if (greetingMessage.trim() && !greetingAuthor.trim()) {
      toast({
        title: "Author name required",
        description: "Please add your name to the greeting",
        variant: "destructive",
      })
      return
    }

    // Add validation for payment method specific fields
    if (paymentMethod === "paypal" && (!paypalEmail.includes("@") || !paypalEmail.includes("."))) {
      toast({
        title: "Invalid PayPal Email",
        description: "Please enter a valid PayPal email address",
        variant: "destructive",
      })
      return
    }
    if (paymentMethod === "venmo" && !venmoPhone.trim()) {
      toast({
        title: "Venmo Info Required",
        description: "Please enter your Venmo phone number or username",
        variant: "destructive",
      })
      return
    }
    if (paymentMethod === "cashapp" && !cashappTag.trim()) {
      toast({
        title: "Cash App Tag Required",
        description: "Please enter your Cash App tag",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const contributionAmount = Number.parseFloat(amount)
    const contributorName = greetingAuthor.trim() || "Anonymous"

    setContributions((prev) => [...prev, { amount: contributionAmount, contributor: contributorName }])
    setTotalRaised((prev) => prev + contributionAmount)

    setIsProcessing(false)

    const hasGreeting = greetingMessage.trim() && greetingAuthor.trim()

    const paymentMethodNames = {
      card: "card",
      paypal: "PayPal",
      applepay: "Apple Pay",
      googlepay: "Google Pay",
      venmo: "Venmo",
      cashapp: "Cash App",
    }

    toast({
      title: "Contribution successful!",
      description: hasGreeting
        ? `You've contributed $${amount} via ${paymentMethodNames[paymentMethod]} and added a greeting to the ${product.name} gift`
        : `You've contributed $${amount} via ${paymentMethodNames[paymentMethod]} to the ${product.name} gift`,
    })

    // Reset form
    setAmount("")
    setCardNumber("")
    setExpiry("")
    setCvc("")
    setCardName("")
    setPaypalEmail("")
    setVenmoPhone("")
    setCashappTag("")
    setGreetingMessage("")
    setGreetingAuthor("")
    setCurrentStep("customize") // Reset to customize step
    setPaymentMethod("card") // Reset payment method
    setErrors({
      // Reset errors after successful contribution
      amount: "",
      cardNumber: "",
      cardName: "",
      expiry: "",
      cvc: "",
    })
  }

  const applyFormatting = (command: string) => {
    document.execCommand(command, false)
    if (editorRef.current) {
      setGreetingMessage(editorRef.current.innerText)
    }
  }

  const insertGreetingIcon = (icon: string) => {
    if (editorRef.current) {
      editorRef.current.focus()
      document.execCommand("insertText", false, icon + " ")
      setGreetingMessage(editorRef.current.innerText)
    }
  }

  const applyAlignment = (alignment: string) => {
    document.execCommand(alignment, false)
  }

  const applyTextColor = (color: string) => {
    document.execCommand("foreColor", false, color)
    setShowColorPicker(false)
  }

  const applyFontSize = (size: string) => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const span = document.createElement("span")
      span.style.fontSize = size
      range.surroundContents(span)
    }
  }

  const applyList = (type: string) => {
    if (type === "bullet") {
      document.execCommand("insertUnorderedList", false)
    } else {
      document.execCommand("insertOrderedList", false)
    }
  }

  // Renamed and updated handleImageUpload to handleBannerUpload
  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setCollectionBanner(reader.result as string)
        toast({
          title: "Banner Uploaded",
          description: "Your collection banner has been updated",
        })
      }
      reader.readAsDataURL(file)
    }
  }

  // Updated handleAIExtractBannerFromTitle
  const handleAIExtractBannerFromTitle = async () => {
    if (!collectionTitle.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a collection title first to generate a banner.",
        variant: "destructive",
      })
      return
    }

    setIsExtractingBanner(true)
    console.log("[v0] Starting banner generation for title:", collectionTitle)

    try {
      const response = await fetch("/api/ai/generate-banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: collectionTitle }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Banner API error:", errorText)
        throw new Error(`Failed to generate banner: ${errorText}`)
      }

      const data = await response.json()
      console.log("[v0] Banner generated:", data.bannerUrl)

      if (!data || !data.bannerUrl) {
        throw new Error("No banner URL received from API")
      }

      setCollectionBanner(data.bannerUrl)
      setIsAIGeneratedBanner(true)

      toast({
        title: "Banner Generated!",
        description: `AI created a custom banner with "${collectionTitle}".`,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error("[v0] Error generating banner:", errorMessage)
      toast({
        title: "Banner Generation Failed",
        description: errorMessage || "Failed to generate AI banner. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExtractingBanner(false)
    }
  }

  const handleExtractProduct = async () => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true)
      toast({
        title: "Login Required",
        description: "Please log in to add products to your collection",
        variant: "destructive",
      })
      return
    }

    if (!productLink.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter a product link or gift idea",
        variant: "destructive",
      })
      return
    }

    setIsExtractingProduct(true)
    try {
      const isUrl = productLink.startsWith("http://") || productLink.startsWith("https://")
      const endpoint = isUrl ? "/api/ai/extract-product" : "/api/ai/extract-gift-idea"

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isUrl ? { url: productLink } : { giftIdea: productLink }),
      })

      if (!response.ok) throw new Error("Failed to extract product")

      const data = await response.json()
      setExtractedProduct(data)

      toast({
        title: "Product Extracted!",
        description: "AI has successfully extracted the product details",
      })
    } catch (error) {
      toast({
        title: "Extraction Failed",
        description: "Unable to extract product details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExtractingProduct(false)
    }
  }

  const handleStartFunding = () => {
    if (isStartFundingComplete) {
      setCurrentStep("addProduct") // Changed from "amount" to "addProduct"
      toast({
        title: "Funding Started!",
        description: "Now add a product to your collection.",
      })
    } else {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in Collection Title, Banner, and Fundraising Goal",
        variant: "destructive",
      })
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setCollectionBanner(reader.result as string)
        setIsAIGeneratedBanner(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeBanner = () => {
    setCollectionBanner(null)
    setIsAIGeneratedBanner(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = "" // Reset the input value
    }
    toast({
      title: "Banner Removed",
      description: "The collection banner has been cleared",
    })
  }

  const calculateGoalProgress = () => {
    const goal = Number.parseFloat(fundraisingGoal) || 0
    if (goal === 0) {
      return 0
    }
    return Math.min((totalRaised / goal) * 100, 100)
  }

  const handleBackToCustomize = () => {
    setCurrentStep("customize")
  }

  const handleBackToContribute = () => {
    setCurrentStep("amount")
  }

  const handleLoginSuccess = () => {
    login()
    setIsLoginModalOpen(false)
    toast({
      title: "Welcome back!",
      description: "You can now add products to your collection",
    })
  }

  const handleSignUpSuccess = () => {
    login()
    setIsSignUpModalOpen(false)
    toast({
      title: "Account created!",
      description: "Welcome to Wishbee! You can now add products to your collection",
    })
  }

  const handleSwitchToSignUp = () => {
    setIsLoginModalOpen(false)
    setIsSignUpModalOpen(true)
  }

  const handleSwitchToLogin = () => {
    setIsSignUpModalOpen(false)
    setIsLoginModalOpen(true)
  }

  return (
    <section
      id="your-group-gifting-center"
      className="relative bg-gradient-to-br from-[#F5F1E8] via-[#EDE6D6] to-[#F5F1E8] text-gray-900 py-10 sm:py-12 md:py-16 lg:py-20 overflow-hidden"
    >
      {/* Animated background elements */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-[#DAA520]/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-[#F4C430]/10 rounded-full blur-3xl animate-pulse delay-700"></div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 rounded-2xl shadow-lg">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#654321] via-[#8B4513] to-[#654321] bg-clip-text text-transparent">
              Your Group Gifting Center
            </h2>
          </div>
          <p className="text-sm sm:text-base md:text-lg text-[#8B4513]/70 max-w-2xl mx-auto">
            Create, fund, and celebrate together with seamless group gifting
          </p>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl max-w-5xl mx-auto border-2 border-[#F4C430]/20">
          <CardContent className="p-0">
            {/* Tab Navigation with enhanced styling */}
            <div className="flex border-b-2 border-gray-100 bg-gradient-to-r from-[#F5F1E8]/50 to-white/50">
              {/* Tab 1: Create Funding */}
              <Button
                onClick={() => setCurrentStep("customize")}
                className={`flex-1 py-4 sm:py-5 px-3 sm:px-6 font-semibold text-xs sm:text-sm md:text-base transition-all relative group ${
                  currentStep === "customize"
                    ? "text-transparent bg-gradient-to-r from-[#DAA520] to-[#F4C430] bg-clip-text"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                variant="ghost"
              >
                <div className="flex items-center justify-center gap-2">
                  <DollarSign
                    className={`w-4 h-4 sm:w-5 sm:h-5 transition-all ${
                      currentStep === "customize"
                        ? "scale-110 text-[#F4C430]"
                        : "text-gray-400 group-hover:text-[#F4C430]"
                    }`}
                  />
                  <span className="whitespace-nowrap">1. Create Funding</span>
                  {(collectionTitle || collectionBanner || fundraisingGoal) && (
                    <CheckCircle className="w-4 h-4 text-green-500 animate-pulse" />
                  )}
                </div>
                {currentStep === "customize" && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#DAA520] via-[#F4C430] to-[#DAA520] animate-pulse shadow-lg"></div>
                )}
              </Button>

              {/* Tab 2: Add Product */}
              <Button
                onClick={() => setCurrentStep("addProduct")}
                className={`flex-1 py-4 sm:py-5 px-3 sm:px-6 font-semibold text-xs sm:text-sm md:text-base transition-all relative group ${
                  currentStep === "addProduct"
                    ? "text-transparent bg-gradient-to-r from-[#DAA520] to-[#F4C430] bg-clip-text"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                variant="ghost"
              >
                <div className="flex items-center justify-center gap-2">
                  <Sparkles
                    className={`w-4 h-4 sm:w-5 sm:h-5 transition-all ${
                      currentStep === "addProduct"
                        ? "scale-110 text-[#F4C430]"
                        : "text-gray-400 group-hover:text-[#F4C430]"
                    }`}
                  />
                  <span className="whitespace-nowrap">2. Add Product</span>
                  {extractedProduct && <CheckCircle className="w-4 h-4 text-green-500 animate-pulse" />}
                </div>
                {currentStep === "addProduct" && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#DAA520] via-[#F4C430] to-[#DAA520] animate-pulse shadow-lg"></div>
                )}
              </Button>

              {/* Tab 3: Contribute */}
              <Button
                onClick={() => setCurrentStep("amount")}
                className={`flex-1 py-4 sm:py-5 px-3 sm:px-6 font-semibold text-xs sm:text-sm md:text-base transition-all relative group ${
                  currentStep === "amount"
                    ? "text-transparent bg-gradient-to-r from-[#DAA520] to-[#F4C430] bg-clip-text"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                variant="ghost"
              >
                <div className="flex items-center justify-center gap-2">
                  <CreditCard
                    className={`w-4 h-4 sm:w-5 sm:h-5 transition-all ${
                      currentStep === "amount" ? "scale-110 text-[#F4C430]" : "text-gray-400 group-hover:text-[#F4C430]"
                    }`}
                  />
                  <span className="whitespace-nowrap">3. Contribute</span>
                  {contributions.length > 0 && <CheckCircle className="w-4 h-4 text-green-500 animate-pulse" />}
                </div>
                {currentStep === "amount" && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#DAA520] via-[#F4C430] to-[#DAA520] animate-pulse shadow-lg"></div>
                )}
              </Button>

              {/* Tab 4: Greeting */}
              <Button
                onClick={() => setCurrentStep("message")}
                className={`flex-1 py-4 sm:py-5 px-3 sm:px-6 font-semibold text-xs sm:text-sm md:text-base transition-all relative group ${
                  currentStep === "message"
                    ? "text-transparent bg-gradient-to-r from-[#DAA520] to-[#F4C430] bg-clip-text"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                variant="ghost"
              >
                <div className="flex items-center justify-center gap-2">
                  <Heart
                    className={`w-4 h-4 sm:w-5 sm:h-5 transition-all ${
                      currentStep === "message"
                        ? "scale-110 text-[#F4C430]"
                        : "text-gray-400 group-hover:text-[#F4C430]"
                    }`}
                  />
                  <span className="whitespace-nowrap">4. Greeting</span>
                  {greetingMessage && <CheckCircle className="w-4 h-4 text-green-500 animate-pulse" />}
                </div>
                {currentStep === "message" && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#DAA520] via-[#F4C430] to-[#DAA520] animate-pulse shadow-lg"></div>
                )}
              </Button>
            </div>

            {/* Tab Content with enhanced padding */}
            <div className="p-6 sm:p-8 md:p-10 lg:p-12 bg-gradient-to-br from-white to-[#F5F1E8]/20">
              {/* Tab 1: Start Funding */}
              {currentStep === "customize" && (
                <div className="animate-in fade-in-50 slide-in-from-left-5 duration-300">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                        Collection Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={collectionTitle}
                        onChange={(e) => setCollectionTitle(e.target.value)}
                        placeholder="Birthday Gift for Sarah"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#F4C430] focus:ring-2 focus:ring-[#F4C430]/20 transition-all text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">Customize the title for your gift collection</p>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                        Collection Banner <span className="text-red-500">*</span>
                      </label>

                      <div className="mb-3">
                        <Button
                          onClick={handleAIExtractBannerFromTitle}
                          disabled={isExtractingBanner || !!collectionBanner || !collectionTitle.trim()}
                          variant="outline"
                          className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white border-2 border-amber-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 hover:border-amber-600 transition-all text-xs sm:text-sm px-2 sm:px-4 shadow-lg hover:shadow-xl"
                        >
                          {isExtractingBanner ? (
                            <>
                              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin flex-shrink-0" />
                              <span className="truncate">AI Extracting...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                              <span className="truncate">AI Auto-Extract Banner (1600x900px)</span>
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="relative">
                        {collectionBanner ? (
                          <div className="relative w-full h-64 sm:h-80 lg:h-96 rounded-2xl overflow-hidden border-4 border-gradient-to-r from-[#DAA520] via-[#F4C430] to-[#DAA520] shadow-2xl mb-2">
                            <Image
                              src={collectionBanner || "/placeholder.svg"}
                              alt="Collection banner"
                              fill
                              className="object-cover bg-gradient-to-br from-gray-50 to-gray-100"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />
                            {isAIGeneratedBanner && collectionTitle && (
                              <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 lg:p-8">
                                <div className="relative text-center max-w-[90%]">
                                  <h2
                                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black uppercase tracking-tight leading-tight break-words"
                                    style={{
                                      color: "#FFFFFF",
                                      textShadow: `
                                        -3px -3px 0 #FFD700,
                                        3px -3px 0 #FFD700,
                                        -3px 3px 0 #FFD700,
                                        3px 3px 0 #FFD700,
                                        -3px 0 0 #FFD700,
                                        3px 0 0 #FFD700,
                                        0 -3px 0 #FFD700,
                                        0 3px 0 #FFD700,
                                        4px 4px 8px rgba(0, 0, 0, 0.8),
                                        6px 6px 12px rgba(0, 0, 0, 0.6),
                                        8px 8px 16px rgba(0, 0, 0, 0.4)
                                      `,
                                      WebkitTextStroke: "2px #FFD700",
                                      paintOrder: "stroke fill",
                                      filter: "drop-shadow(0 8px 16px rgba(0, 0, 0, 0.5))",
                                    }}
                                  >
                                    {collectionTitle}
                                  </h2>
                                  {/* Background darkening behind text for better readability */}
                                  <div className="absolute inset-0 -z-10 bg-black/30 blur-2xl scale-110" />
                                </div>
                              </div>
                            )}
                            {!isAIGeneratedBanner && (
                              <Button
                                onClick={removeBanner}
                                className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-xl hover:shadow-2xl transition-all"
                                size="sm"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                            {isAIGeneratedBanner && (
                              <div className="absolute bottom-3 left-3 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                AI Generated
                              </div>
                            )}
                          </div>
                        ) : (
                          <Button
                            onClick={() => fileInputRef.current?.click()}
                            variant="outline"
                            className="w-full h-64 sm:h-80 lg:h-96 border-2 border-dashed border-gray-300 hover:border-[#F4C430] rounded-2xl flex flex-col items-center justify-center gap-3 transition-all hover:shadow-lg"
                          >
                            <Upload className="w-8 h-8 text-gray-400" />
                            <span className="text-sm text-gray-500">Or Upload Manually</span>
                          </Button>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange} // Changed from handleBannerUpload to handleImageChange
                          className="hidden"
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-2 flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#F4C430]" />
                        AI creates a modern, stylish banner with your collection title beautifully integrated
                      </p>
                    </div>

                    {/* Fundraising Goal */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                        Fundraising Goal <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          value={fundraisingGoal}
                          onChange={(e) => setFundraisingGoal(e.target.value)}
                          placeholder="500"
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#F4C430] focus:ring-2 focus:ring-[#F4C430]/20 transition-all text-sm"
                          min="0"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Set a target amount to encourage contributions</p>
                    </div>

                    <div className="flex justify-start md:justify-center">
                      <Button
                        onClick={handleStartFunding}
                        disabled={!isStartFundingComplete}
                        className={`w-44 sm:w-48 mx-auto px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold transition-all duration-300 shadow-[0_8px_30px_rgba(218,165,32,0.4)] hover:shadow-[0_12px_40px_rgba(218,165,32,0.6)] hover:scale-105 active:scale-95 text-xs sm:text-sm border-2 border-[#DAA520]/30 ${
                          isStartFundingComplete
                            ? "bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#8B4513] hover:from-[#F4C430] hover:to-[#DAA520]"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50"
                        }`}
                      >
                        {isStartFundingComplete ? "Add Product" : "Create Funding"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Contribute (existing payment form) */}
              {currentStep === "amount" && (
                <div className="animate-in fade-in-50 slide-in-from-left-5 duration-300">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="w-5 h-5 text-[#F4C430]" />
                      <h3 className="text-base sm:text-lg font-bold text-gray-900">Your Contribution</h3>
                    </div>

                    {/* Preset Amount Buttons */}
                    <div>
                      <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-2">
                        Quick Select
                      </label>
                      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                        {presetAmounts.map((preset) => (
                          <Button
                            key={preset}
                            onClick={() => handlePresetClick(preset)}
                            className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all ${
                              amount === preset.toString()
                                ? "bg-[#F4C430] text-gray-900 shadow-lg scale-105"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                            variant={amount === preset.toString() ? "default" : "outline"}
                          >
                            ${preset}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Amount Input */}
                    <div>
                      <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-2">
                        Custom Amount
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => {
                            setAmount(e.target.value)
                            if (errors.amount) {
                              setErrors({ ...errors, amount: validateAmount(e.target.value) })
                            }
                          }}
                          onBlur={() => setErrors({ ...errors, amount: validateAmount(amount) })}
                          placeholder="Enter amount"
                          className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 transition-colors font-mono text-sm sm:text-base ${
                            errors.amount
                              ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                              : "border-gray-200 focus:border-[#F4C430] focus:ring-[#F4C430]/20"
                          }`}
                        />
                      </div>
                      {errors.amount && (
                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                          <span>⚠</span> {errors.amount}
                        </p>
                      )}
                    </div>

                    {/* Payment Details */}
                    <div className="pt-4 space-y-3">
                      {/* Credit Card Input */}
                      <div className="space-y-2">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900">Card Details</h3>
                        {/* Card Number */}
                        <div>
                          <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-2">
                            Card Number
                          </label>
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => {
                              const formatted = formatCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))
                              setCardNumber(formatted)
                              if (errors.cardNumber) {
                                setErrors({ ...errors, cardNumber: validateCardNumber(formatted) })
                              }
                            }}
                            onBlur={() => setErrors({ ...errors, cardNumber: validateCardNumber(cardNumber) })}
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                            className={`w-full pl-3 sm:pl-4 pr-3 sm:pr-4 py-2 sm:py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 transition-colors font-mono text-sm sm:text-base ${
                              errors.cardNumber
                                ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                                : "border-gray-200 focus:border-[#F4C430] focus:ring-[#F4C430]/20"
                            }`}
                          />
                          {errors.cardNumber && (
                            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                              <span>⚠</span> {errors.cardNumber}
                            </p>
                          )}
                        </div>

                        {/* Cardholder Name */}
                        <div>
                          <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-2">
                            Cardholder Name
                          </label>
                          <input
                            type="text"
                            value={cardName}
                            onChange={(e) => {
                              setCardName(e.target.value)
                              if (errors.cardName) {
                                setErrors({ ...errors, cardName: validateCardName(e.target.value) })
                              }
                            }}
                            onBlur={() => setErrors({ ...errors, cardName: validateCardName(cardName) })}
                            placeholder="John Smith"
                            className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 transition-colors text-sm sm:text-base ${
                              errors.cardName
                                ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                                : "border-gray-200 focus:border-[#F4C430] focus:ring-[#F4C430]/20"
                            }`}
                          />
                          {errors.cardName && (
                            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                              <span>⚠</span> {errors.cardName}
                            </p>
                          )}
                        </div>

                        {/* Expiry and CVC */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                          <div>
                            <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-2">
                              Expiry Date
                            </label>
                            <input
                              type="text"
                              value={expiry}
                              onChange={(e) => {
                                const formatted = formatExpiry(e.target.value)
                                setExpiry(formatted)
                                if (errors.expiry) {
                                  setErrors({ ...errors, expiry: validateExpiry(formatted) })
                                }
                              }}
                              onBlur={() => setErrors({ ...errors, expiry: validateExpiry(expiry) })}
                              placeholder="MM/YY"
                              maxLength={5}
                              className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 transition-colors font-mono text-sm sm:text-base ${
                                errors.expiry
                                  ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                                  : "border-gray-200 focus:border-[#F4C430] focus:ring-[#F4C430]/20"
                              }`}
                            />
                            {errors.expiry && (
                              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                                <span>⚠</span> {errors.expiry}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-2">CVC</label>
                            <input
                              type="text"
                              value={cvc}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, "").slice(0, 4)
                                setCvc(value)
                                if (errors.cvc) {
                                  setErrors({ ...errors, cvc: validateCVC(value) })
                                }
                              }}
                              onBlur={() => setErrors({ ...errors, cvc: validateCVC(cvc) })}
                              placeholder="123"
                              maxLength={4}
                              className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 border-2 rounded-xl focus:outline-none focus:ring-2 transition-colors font-mono text-sm sm:text-base ${
                                errors.cvc
                                  ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                                  : "border-gray-200 focus:border-[#F4C430] focus:ring-[#F4C430]/20"
                              }`}
                            />
                            {errors.cvc && (
                              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                                <span>⚠</span> {errors.cvc}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Other Payment Methods (PayPal, Apple Pay, Google Pay, Venmo, Cash App) */}
                      <div className="space-y-2">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900">
                          Choose Your Preferred Options
                        </h3>
                        <div className="flex flex-nowrap gap-2 mb-4 overflow-x-auto pb-2 -mx-1 px-1 md:border md:border-gray-200 md:rounded-lg md:p-3 md:mx-0 scrollbar-hide">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod("paypal")}
                            className={`flex flex-col items-center justify-center gap-1 p-3 rounded-lg border-2 transition-all min-w-[80px] flex-shrink-0 ${
                              paymentMethod === "paypal"
                                ? "border-[#F4C430] bg-[#FFF9E6]"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                              <path
                                d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"
                                fill="#003087"
                              />
                              <path
                                d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z"
                                fill="#0070E0"
                                opacity="0.7"
                              />
                            </svg>
                            <span className="text-[10px] font-semibold">PayPal</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPaymentMethod("applepay")}
                            className={`flex flex-col items-center justify-center gap-1 p-3 rounded-lg border-2 transition-all min-w-[80px] flex-shrink-0 ${
                              paymentMethod === "applepay"
                                ? "border-[#F4C430] bg-[#FFF9E6]"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                              <path
                                d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
                                fill="#000000"
                              />
                            </svg>
                            <span className="text-[10px] font-semibold">Apple Pay</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPaymentMethod("googlepay")}
                            className={`flex flex-col items-center justify-center gap-1 p-3 rounded-lg border-2 transition-all min-w-[80px] flex-shrink-0 ${
                              paymentMethod === "googlepay"
                                ? "border-[#F4C430] bg-[#FFF9E6]"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <svg className="w-6 h-6" viewBox="0 0 48 48" fill="none">
                              <path
                                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                                fill="#EA4335"
                              />
                              <path
                                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                                fill="#4285F4"
                              />
                              <path
                                d="M10.53 28.59c-.58-1.73-.92-3.57-.92-5.59s.34-3.86.92-5.59L2.56 11.22C.92 14.46 0 18.13 0 22s.92 7.54 2.56 10.78l7.97-4.19z"
                                fill="#FBBC05"
                              />
                              <path
                                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                                fill="#34A853"
                              />
                            </svg>
                            <span className="text-[10px] font-semibold">Google Pay</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPaymentMethod("venmo")}
                            className={`flex flex-col items-center justify-center gap-1 p-3 rounded-lg border-2 transition-all min-w-[80px] flex-shrink-0 ${
                              paymentMethod === "venmo"
                                ? "border-[#F4C430] bg-[#FFF9E6]"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                              <path
                                d="M16.835 3.026c.56 1.072.793 2.1.793 3.48 0 4.34-3.713 9.98-6.756 14.494H4.24L.5 3.056l6.086-.53 2.216 13.908c1.375-2.388 3.365-6.21 3.365-9.103 0-1.288-.188-2.144-.534-2.976l5.202-.33z"
                                fill="#3D95CE"
                              />
                            </svg>
                            <span className="text-[10px] font-semibold">Venmo</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPaymentMethod("cashapp")}
                            className={`flex flex-col items-center justify-center gap-1 p-3 rounded-lg border-2 transition-all min-w-[80px] flex-shrink-0 ${
                              paymentMethod === "cashapp"
                                ? "border-[#F4C430] bg-[#FFF9E6]"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <svg className="w-6 h-6" viewBox="0 0 48 48" fill="none">
                              <rect width="48" height="48" rx="8" fill="#00D632" />
                              <path
                                d="M28.5 18.5c-1-1.2-2.8-2-5.2-2h-1.8l.5-3h-4.2l-.5 3h-2.8l-.7 4h2.8l-1 5.8c-.2 1.2-.5 2-.8 2.4-.3.4-.8.6-1.5.6-.4 0-.8-.1-1.2-.2l-.8 4c.6.2 1.4.3 2.2.3 1.2 0 2.3-.3 3.2-.8.9-.5 1.6-1.3 2.1-2.3.5-1 .9-2.3 1.2-3.8l1-5.8h1.8c1.2 0 2 .2 2.5.6.5.4.7.9.7 1.6 0 .4-.1.8-.2 1.2l4-.8c.2-.6.3-1.2.3-1.8 0-1.5-.5-2.8-1.6-4z"
                                fill="white"
                              />
                            </svg>
                            <span className="text-[10px] font-semibold">Cash App</span>
                          </button>
                        </div>

                        {paymentMethod === "paypal" && (
                          <div>
                            <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-2">
                              PayPal Email
                            </label>
                            <input
                              type="email"
                              value={paypalEmail}
                              onChange={(e) => setPaypalEmail(e.target.value)}
                              placeholder="your.email@example.com"
                              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-[#F4C430] focus:ring-[#F4C430]/20 transition-colors text-sm sm:text-base"
                            />
                          </div>
                        )}

                        {paymentMethod === "applepay" && (
                          <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                            <div className="flex items-center justify-center gap-3 mb-3">
                              <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none">
                                <path
                                  d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
                                  fill="#000000"
                                />
                              </svg>
                            </div>
                            <p className="text-sm text-gray-700 text-center font-medium mb-2">Apple Pay Ready</p>
                            <p className="text-xs text-gray-500 text-center">
                              Your payment will be processed securely through Apple Pay when you complete the
                              contribution
                            </p>
                          </div>
                        )}

                        {paymentMethod === "googlepay" && (
                          <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                            <div className="flex items-center justify-center gap-3 mb-3">
                              <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none">
                                <path
                                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                                  fill="#EA4335"
                                />
                                <path
                                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                                  fill="#4285F4"
                                />
                                <path
                                  d="M10.53 28.59c-.58-1.73-.92-3.57-.92-5.59s.34-3.86.92-5.59L2.56 11.22C.92 14.46 0 18.13 0 22s.92 7.54 2.56 10.78l7.97-4.19z"
                                  fill="#FBBC05"
                                />
                                <path
                                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                                  fill="#34A853"
                                />
                              </svg>
                            </div>
                            <p className="text-sm text-gray-700 text-center font-medium mb-2">Google Pay Ready</p>
                            <p className="text-xs text-gray-500 text-center">
                              Your payment will be processed securely through Google Pay when you complete the
                              contribution
                            </p>
                          </div>
                        )}

                        {paymentMethod === "venmo" && (
                          <div>
                            <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-2">
                              Venmo Phone or Username
                            </label>
                            <input
                              type="text"
                              value={venmoPhone}
                              onChange={(e) => setVenmoPhone(e.target.value)}
                              placeholder="@username or phone"
                              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-[#F4C430] focus:ring-[#F4C430]/20 transition-colors text-sm sm:text-base"
                            />
                          </div>
                        )}

                        {paymentMethod === "cashapp" && (
                          <div>
                            <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-2">
                              Cash App Tag
                            </label>
                            <input
                              type="text"
                              value={cashappTag}
                              onChange={(e) => setCashappTag(e.target.value)}
                              placeholder="$cashtag"
                              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-[#F4C430] focus:ring-[#F4C430]/20 transition-colors text-sm sm:text-base"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={handleContinueToMessage}
                      className="group relative w-44 sm:w-56 md:w-64 mx-auto px-3 sm:px-4 md:px-5 py-1.5 sm:py-2.5 md:py-3 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#8B4513] rounded-full font-bold overflow-hidden transition-all duration-300 shadow-[0_8px_30px_rgba(218,165,32,0.4)] hover:shadow-[0_12px_40px_rgba(218,165,32,0.6)] hover:scale-105 active:scale-95 text-xs sm:text-sm md:text-base flex"
                      variant="default"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-1.5">
                        {isPaymentComplete ? (
                          <>
                            Continue to Add Greeting
                            <Heart className="w-4 h-4" />
                          </>
                        ) : (
                          "Add Your Share"
                        )}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                    </Button>

                    <p className="text-xs text-gray-500 text-center">Your payment is secure and encrypted</p>
                  </div>
                </div>
              )}

              {/* Tab 3: Add Greeting (existing greeting form) */}
              {currentStep === "message" && (
                <div className="animate-in fade-in-50 slide-in-from-right-5 duration-300">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Heart className="w-5 h-5 text-[#F4C430]" />
                      <h3 className="text-base sm:text-lg font-bold text-gray-900">Add Your Greeting</h3>
                    </div>

                    {/* Contribution Summary */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 mb-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-800">Payment Details Confirmed</span>
                      </div>
                      <p className="text-sm text-green-700">
                        ${amount} contribution to <span className="font-semibold">{product.name}</span>
                      </p>
                    </div>

                    {/* Greeting Message Tab Content */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                          Your Message <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        {greetingMessage && (
                          <span className="text-xs text-gray-500">{greetingMessage.length} characters</span>
                        )}
                      </div>

                      <div className="border-2 border-gray-300 rounded-xl overflow-hidden focus-within:border-[#F4C430] focus-within:ring-2 focus-within:ring-[#F4C430]/20 transition-all shadow-md">
                        {/* Formatting Toolbar */}
                        <div className="bg-gray-200 border-b-2 border-gray-300 px-4 py-3 flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1 border-r-2 border-gray-400 pr-3">
                            <Button
                              type="button"
                              onClick={() => {
                                applyFormatting("bold")
                                setIsBold(!isBold)
                              }}
                              className={`p-2.5 rounded-lg transition-all ${
                                isBold
                                  ? "bg-gray-400 text-gray-600 shadow-md"
                                  : "bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-600 shadow-sm"
                              }`}
                              title="Bold (Ctrl+B)"
                            >
                              <Bold className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              onClick={() => {
                                applyFormatting("italic")
                                setIsItalic(!isItalic)
                              }}
                              className={`p-2.5 rounded-lg transition-all ${
                                isItalic
                                  ? "bg-gray-400 text-gray-600 shadow-md"
                                  : "bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-600 shadow-sm"
                              }`}
                              title="Italic (Ctrl+I)"
                            >
                              <Italic className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              onClick={() => {
                                applyFormatting("underline")
                                setIsUnderline(!isUnderline)
                              }}
                              className={`p-2.5 rounded-lg transition-all ${
                                isUnderline
                                  ? "bg-gray-400 text-gray-600 shadow-md"
                                  : "bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-600 shadow-sm"
                              }`}
                              title="Underline (Ctrl+U)"
                            >
                              <Underline className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-1 border-r-2 border-gray-400 pr-3">
                            <Button
                              type="button"
                              onClick={() => applyAlignment("justifyLeft")}
                              className="p-2.5 rounded-lg bg-white text-slate-600 hover:bg-slate-500 hover:text-white transition-all shadow-sm"
                              title="Align Left"
                            >
                              <AlignLeft className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              onClick={() => applyAlignment("justifyCenter")}
                              className="p-2.5 rounded-lg bg-white text-slate-600 hover:bg-slate-500 hover:text-white transition-all shadow-sm"
                              title="Align Center"
                            >
                              <AlignCenter className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              onClick={() => applyAlignment("justifyRight")}
                              className="p-2.5 rounded-lg bg-white text-slate-600 hover:bg-slate-500 hover:text-white transition-all shadow-sm"
                              title="Align Right"
                            >
                              <AlignRight className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-1 border-r-2 border-gray-400 pr-3">
                            <Button
                              type="button"
                              onClick={() => applyList("bullet")}
                              className="p-2.5 rounded-lg bg-white text-slate-600 hover:bg-slate-500 hover:text-white transition-all shadow-sm"
                              title="Bullet List"
                            >
                              <List className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              onClick={() => applyList("numbered")}
                              className="p-2.5 rounded-lg bg-white text-slate-600 hover:bg-slate-500 hover:text-white transition-all shadow-sm"
                              title="Numbered List"
                            >
                              <ListOrdered className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-1 border-r-2 border-gray-400 pr-3 relative">
                            <Button
                              type="button"
                              onClick={() => setShowColorPicker(!showColorPicker)}
                              className="p-2.5 rounded-lg bg-white text-slate-600 hover:bg-slate-500 hover:text-white transition-all shadow-sm"
                              title="Text Color"
                            >
                              <Palette className="w-4 h-4" />
                            </Button>
                            {showColorPicker && (
                              <div className="absolute top-full left-0 mt-1 bg-white border-2 border-gray-400 rounded-lg shadow-xl p-3 z-10 grid grid-cols-5 gap-2">
                                {[
                                  "#000000",
                                  "#FF0000",
                                  "#00FF00",
                                  "#0000FF",
                                  "#FFFF00",
                                  "#FF00FF",
                                  "#00FFFF",
                                  "#F4C430",
                                  "#FFA500",
                                  "#800080",
                                ].map((color) => (
                                  <Button
                                    key={color}
                                    type="button"
                                    onClick={() => applyTextColor(color)}
                                    className="w-7 h-7 rounded-md border-2 border-gray-400 hover:scale-125 transition-transform shadow-md"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                  />
                                ))}
                              </div>
                            )}
                            <select
                              onChange={(e) => applyFontSize(e.target.value)}
                              className="px-2 py-1.5 text-sm rounded-lg bg-white text-slate-600 hover:bg-slate-100 transition-all border-2 border-gray-300 shadow-sm"
                              title="Font Size"
                              defaultValue=""
                            >
                              <option value="" disabled>
                                Size
                              </option>
                              <option value="12px">Small</option>
                              <option value="16px">Normal</option>
                              <option value="20px">Large</option>
                              <option value="24px">Extra Large</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <Button
                              type="button"
                              onClick={() => insertGreetingIcon("🎉")}
                              className="p-2 rounded-lg bg-white hover:bg-gradient-to-br hover:from-pink-400 hover:to-purple-500 hover:scale-110 transition-all text-xl shadow-sm"
                              title="Party popper"
                            >
                              🎉
                            </Button>
                            <Button
                              type="button"
                              onClick={() => insertGreetingIcon("🎂")}
                              className="p-2 rounded-lg bg-white hover:bg-gradient-to-br hover:from-pink-300 hover:to-yellow-300 hover:scale-110 transition-all text-xl shadow-sm"
                              title="Birthday cake"
                            >
                              🎂
                            </Button>
                            <Button
                              type="button"
                              onClick={() => insertGreetingIcon("🎁")}
                              className="p-2 rounded-lg bg-white hover:bg-gradient-to-br hover:from-red-400 hover:to-pink-400 hover:scale-110 transition-all text-xl shadow-sm"
                              title="Gift"
                            >
                              🎁
                            </Button>
                            <Button
                              type="button"
                              onClick={() => insertGreetingIcon("❤️")}
                              className="p-2 rounded-lg bg-white hover:bg-gradient-to-br hover:from-red-500 hover:to-pink-500 hover:scale-110 transition-all text-xl shadow-sm"
                              title="Heart"
                            >
                              ❤️
                            </Button>
                            <Button
                              type="button"
                              onClick={() => insertGreetingIcon("🎈")}
                              className="p-2 rounded-lg bg-white hover:bg-gradient-to-br hover:from-blue-400 hover:to-cyan-400 hover:scale-110 transition-all text-xl shadow-sm"
                              title="Balloon"
                            >
                              🎈
                            </Button>
                            <Button
                              type="button"
                              onClick={() => insertGreetingIcon("⭐")}
                              className="p-2 rounded-lg bg-white hover:bg-gradient-to-br hover:from-yellow-400 hover:to-orange-400 hover:scale-110 transition-all text-xl shadow-sm"
                              title="Star"
                            >
                              ⭐
                            </Button>
                            <Button
                              type="button"
                              onClick={() => insertGreetingIcon("🌹")}
                              className="p-2 rounded-lg bg-white hover:bg-gradient-to-br hover:from-red-500 hover:to-rose-500 hover:scale-110 transition-all text-xl shadow-sm"
                              title="Rose"
                            >
                              🌹
                            </Button>
                            <Button
                              type="button"
                              onClick={() => insertGreetingIcon("🥳")}
                              className="p-2 rounded-lg bg-white hover:bg-gradient-to-br hover:from-purple-400 hover:to-pink-400 hover:scale-110 transition-all text-xl shadow-sm"
                              title="Party face"
                            >
                              🥳
                            </Button>
                            <Button
                              type="button"
                              onClick={() => insertGreetingIcon("🎊")}
                              className="p-2 rounded-lg bg-white hover:bg-gradient-to-br hover:from-pink-400 hover:to-purple-500 hover:scale-110 transition-all text-xl shadow-sm"
                              title="Confetti ball"
                            >
                              🎊
                            </Button>
                            <Button
                              type="button"
                              onClick={() => insertGreetingIcon("🌟")}
                              className="p-2 rounded-lg bg-white hover:bg-gradient-to-br hover:from-yellow-300 hover:to-yellow-500 hover:scale-110 transition-all text-xl shadow-sm"
                              title="Glowing star"
                            >
                              🌟
                            </Button>
                            <Button
                              type="button"
                              onClick={() => insertGreetingIcon("💝")}
                              className="p-2 rounded-lg bg-white hover:bg-gradient-to-br hover:from-pink-400 hover:to-red-400 hover:scale-110 transition-all text-xl shadow-sm"
                              title="Gift with heart"
                            >
                              💝
                            </Button>
                            <Button
                              type="button"
                              onClick={() => insertGreetingIcon("🤗")}
                              className="p-2 rounded-lg bg-white hover:bg-gradient-to-br hover:from-yellow-300 hover:to-orange-300 hover:scale-110 transition-all text-xl shadow-sm"
                              title="Hugging face"
                            >
                              🤗
                            </Button>
                          </div>
                        </div>

                        <div
                          ref={editorRef}
                          contentEditable
                          className="min-h-[200px] p-4 bg-gray-100 text-gray-900 focus:outline-none text-base leading-relaxed relative"
                          onInput={(e) => setGreetingMessage(e.currentTarget.innerText)}
                          placeholder="Write your heartfelt greeting message here..."
                        />

                        <style jsx>{`
                          [contentEditable][placeholder]:empty:before {
                            content: attr(placeholder);
                            color: #9ca3af;
                            pointer-events: none;
                            position: absolute;
                            white-space: normal;
                            word-wrap: break-word;
                            max-width: calc(100% - 2rem);
                            left: 1rem;
                            top: 1rem;
                          }
                        `}</style>
                      </div>

                      <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Add a personal touch to make your gift more meaningful
                      </p>
                    </div>

                    {/* Your Name */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                        Your Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={greetingAuthor}
                        onChange={(e) => setGreetingAuthor(e.target.value)}
                        placeholder="How should we sign your message?"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#F4C430] focus:ring-2 focus:ring-[#F4C430]/20 transition-all text-sm"
                        required
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2 justify-center">
                      <Button
                        onClick={handleBackToContribute}
                        className="group relative w-28 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#8B4513] rounded-full font-bold overflow-hidden transition-all duration-300 shadow-[0_8px_30px_rgba(218,165,32,0.4)] hover:shadow-[0_12px_40px_rgba(218,165,32,0.6)] hover:scale-105 hover:from-[#F4C430] hover:to-[#DAA520] active:scale-95 text-xs sm:text-sm"
                        variant="outline"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          <ChevronLeft className="w-3.5 h-3.5" />
                          Back
                        </span>
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                      </Button>
                      <Button
                        onClick={handleCompleteContribution}
                        disabled={isProcessing}
                        className="group relative w-48 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#8B4513] rounded-full font-bold overflow-hidden transition-all duration-300 shadow-[0_8px_30px_rgba(218,165,32,0.4)] hover:shadow-[0_12px_40px_rgba(218,165,32,0.6)] hover:scale-105 hover:from-[#F4C430] hover:to-[#DAA520] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                        variant="default"
                      >
                        {isProcessing ? (
                          <>
                            <Lock className="w-3.5 h-3.5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <span className="relative z-10 flex items-center gap-1.5">
                              Complete Contribution
                              <CheckCircle className="w-3.5 h-3.5" />
                            </span>
                            {/* Shimmer effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                          </>
                        )}
                      </Button>
                    </div>

                    {greetingMessage ? (
                      <p className="text-xs text-gray-500 text-center">
                        Your contribution and greeting will be added to the gift
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 text-center">
                        Skip the greeting and contribute now, or add a personal message
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 4: Add Product */}
              {currentStep === "addProduct" && (
                <div className="animate-in fade-in-50 slide-in-from-left-5 duration-300">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      <h3 className="text-base sm:text-lg font-bold text-gray-900">AI Product Extraction</h3>
                    </div>

                    {!isAuthenticated && (
                      <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl mb-4">
                        <div className="flex items-start gap-3">
                          <Lock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-amber-900 text-sm mb-1">Login Required</h4>
                            <p className="text-xs text-amber-700 mb-3">
                              Please log in or create an account to add products to your collection
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setIsLoginModalOpen(true)}
                                className="px-4 py-2 bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#8B4513] text-xs font-bold rounded-full hover:from-[#F4C430] hover:to-[#DAA520] transition-all"
                              >
                                Log In
                              </button>
                              <button
                                onClick={() => setIsSignUpModalOpen(true)}
                                className="px-4 py-2 bg-white text-[#8B4513] text-xs font-bold rounded-full border-2 border-[#DAA520] hover:bg-amber-50 transition-all"
                              >
                                Sign Up
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Product Link or Gift Idea Input */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                        Product Link or Gift Idea <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={productLink}
                        onChange={(e) => setProductLink(e.target.value)}
                        placeholder="Paste product URL or describe gift idea (e.g., 'Nike running shoes')"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#F4C430] focus:ring-2 focus:ring-[#F4C430]/20 transition-all text-sm"
                        disabled={!isAuthenticated}
                      />
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        AI extracts all details automatically (image, price, description, store, stock)
                      </p>
                    </div>

                    {/* Extract with AI Button */}
                    <Button
                      onClick={handleExtractProduct}
                      disabled={!productLink.trim() || isExtractingProduct || !isAuthenticated}
                      className={`w-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white border-2 border-amber-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 hover:border-amber-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
                        !productLink.trim() || !isAuthenticated ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {isExtractingProduct ? (
                        <>
                          <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                          Extracting Product...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Extract with AI
                        </>
                      )}
                    </Button>

                    {/* Display Extracted Product */}
                    {extractedProduct && (
                      <div className="mt-6 p-4 border-2 border-[#F4C430] rounded-xl bg-gradient-to-br from-amber-50 to-orange-50">
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          Extracted Product
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Product Image */}
                          {extractedProduct.image && (
                            <div className="relative w-full h-48 rounded-lg overflow-hidden">
                              <Image
                                src={extractedProduct.image || "/placeholder.svg"}
                                alt={extractedProduct.name || "Product"}
                                fill
                                className="object-contain p-2"
                              />
                            </div>
                          )}

                          {/* Product Details */}
                          <div className="space-y-2">
                            <h5 className="font-bold text-lg text-gray-900">{extractedProduct.name}</h5>
                            {extractedProduct.price && (
                              <p className="text-2xl font-bold text-[#DAA520]">${extractedProduct.price}</p>
                            )}
                            {extractedProduct.description && (
                              <p className="text-sm text-gray-600 line-clamp-3">{extractedProduct.description}</p>
                            )}
                            {extractedProduct.store && (
                              <p className="text-xs text-gray-500">Store: {extractedProduct.store}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onSwitchToSignUp={handleSwitchToSignUp}
      />

      <SignUpModal
        isOpen={isSignUpModalOpen}
        onClose={() => setIsSignUpModalOpen(false)}
        onSignUpSuccess={handleSignUpSuccess}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </section>
  )
}
