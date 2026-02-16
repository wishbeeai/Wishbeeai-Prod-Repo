"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sparkles, ArrowRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { LoginModal } from "./login-modal"
import { SignUpModal } from "./signup-modal"

export function AIGiftAssistant() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [collectionTitle, setCollectionTitle] = useState("")
  const [productUrl, setProductUrl] = useState("")
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<"banner" | "extract" | null>(null)

  const { toast } = useToast()
  const router = useRouter()
  const { isAuthenticated, login } = useAuth()

  const isUrl = (text: string): boolean => {
    try {
      new URL(text)
      return true
    } catch {
      return text.includes("http://") || text.includes("https://") || text.includes("www.")
    }
  }

  const handleGenerateBanner = () => {
    if (!collectionTitle.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a collection title to continue.",
        variant: "destructive",
      })
      return
    }

    if (isUrl(collectionTitle)) {
      toast({
        title: "Invalid Input",
        description: "Please enter a title, not a URL. URLs are not allowed here.",
        variant: "destructive",
      })
      return
    }

    if (!isAuthenticated) {
      sessionStorage.setItem("pendingCollectionTitle", collectionTitle)
      setPendingAction("banner")
      setIsLoginModalOpen(true)

      toast({
        title: "Login Required",
        description: "Please log in or sign up to create a gift collection with an AI banner.",
      })
      return
    }

    sessionStorage.setItem("pendingCollectionTitle", collectionTitle)
    toast({
      title: "Redirecting...",
      description: "Taking you to create your gift collection with an AI banner.",
    })
    router.push("/gifts/create")
  }

  const handleExtractProduct = () => {
    if (!productUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a product URL or gift idea to continue.",
        variant: "destructive",
      })
      return
    }

    if (!isAuthenticated) {
      sessionStorage.setItem("pendingProductUrl", productUrl)
      setPendingAction("extract")
      setIsLoginModalOpen(true)

      toast({
        title: "Login Required",
        description: "Please log in or sign up to extract product details and add to your wishlist.",
      })
      return
    }

    sessionStorage.setItem("pendingProductUrl", productUrl)
    toast({
      title: "Redirecting...",
      description: "Taking you to extract and add products to your wishlist.",
    })
    router.push("/wishlist/add")
  }

  const handleLoginSuccess = () => {
    login()
    setIsLoginModalOpen(false)

    toast({
      title: "Welcome!",
      description: "Successfully logged in. Redirecting...",
    })

    setTimeout(() => {
      if (pendingAction === "banner") {
        router.push("/gifts/create")
      } else if (pendingAction === "extract") {
        router.push("/wishlist/add")
      }
      setPendingAction(null)
    }, 500)
  }

  return (
    <>
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onSwitchToSignUp={() => {
          setIsLoginModalOpen(false)
          setIsSignUpModalOpen(true)
        }}
      />
      <SignUpModal isOpen={isSignUpModalOpen} onClose={() => setIsSignUpModalOpen(false)} />

      <section className="py-16 px-4 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-6 py-2 rounded-full text-sm font-bold mb-4 shadow-md">
              <Sparkles className="w-4 h-4" />
              AI-Powered Magic
            </div>
            <h2 className="text-[30px] font-bold text-[#654321] mb-4">
              Smart Gift Creation Tools
            </h2>
            <p className="text-xs sm:text-sm md:text-lg text-[#8B4513]/80 font-light max-w-2xl mx-auto leading-relaxed">
              Start creating with AI - generate stunning banners and extract product details
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 border-2 border-amber-200">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-[#654321]">Generate Custom Banner</h3>
              </div>

              <p className="text-sm sm:text-base text-[#8B4513]/80 mb-4">
                Create stunning AI-generated banners for your gift collections
              </p>

              <div className="space-y-4">
                <Input
                  placeholder="Enter collection title (e.g., Sarah's Dream Camera)"
                  value={collectionTitle}
                  onChange={(e) => setCollectionTitle(e.target.value)}
                  className="text-sm sm:text-base md:text-lg py-3 sm:py-4 md:py-6 border-2 border-amber-200 focus:border-amber-400"
                />

                <Button
                  onClick={handleGenerateBanner}
                  disabled={!collectionTitle.trim()}
                  className="w-full mt-6 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 text-white py-2.5 sm:py-3 text-sm sm:text-base font-semibold border-2 border-amber-400/30 shadow-[0_8px_30px_rgba(251,146,60,0.4)] hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-full"
                >
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                  Generate Banner with AI
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5 sm:ml-2" />
                </Button>

                <p className="text-xs text-[#8B4513]/80 text-center">
                  You'll be taken to create your gift collection with a custom AI banner
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 border-2 border-orange-200">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-[#654321]">Extract Product Details</h3>
              </div>

              <p className="text-sm sm:text-base text-[#8B4513]/80 mb-4">
                Instantly extract product information from any URL using AI
              </p>

              <div className="space-y-4">
                <Input
                  placeholder="Paste product URL or describe gift idea"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  className="text-sm sm:text-base md:text-lg py-3 sm:py-4 md:py-6 border-2 border-orange-200 focus:border-orange-400"
                />

                <Button
                  onClick={handleExtractProduct}
                  disabled={!productUrl.trim()}
                  className="w-full mt-6 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 text-white py-2.5 sm:py-3 text-sm sm:text-base font-semibold border-2 border-amber-400/30 shadow-[0_8px_30px_rgba(251,146,60,0.4)] hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-full"
                >
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                  Extract with AI
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5 sm:ml-2" />
                </Button>

                <p className="text-xs text-[#8B4513]/80 text-center">
                  You'll be taken to add the extracted product to your wishlist
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
