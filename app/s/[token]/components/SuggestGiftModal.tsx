"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThumbsUp, Loader2, CheckCircle, X, Link2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SuggestGiftModalProps {
  isOpen: boolean
  onClose: () => void
  shareId: string
}

export function SuggestGiftModal({
  isOpen,
  onClose,
  shareId,
}: SuggestGiftModalProps) {
  const [giftName, setGiftName] = useState("")
  const [giftUrl, setGiftUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!giftName.trim()) {
      toast({
        title: "Gift name required",
        description: "Please enter a name for your gift suggestion.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      // TODO: Implement API endpoint for gift suggestions
      // For now, simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      setIsSuccess(true)
      toast({
        title: "🐝 Suggestion sent!",
        description: "The wishlist owner will see your suggestion.",
        variant: "warm",
      })
      
      setTimeout(() => {
        onClose()
        setGiftName("")
        setGiftUrl("")
        setIsSuccess(false)
      }, 2000)
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setGiftName("")
    setGiftUrl("")
    setIsSuccess(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white rounded-xl border-0 shadow-2xl">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto w-14 h-14 rounded-full bg-[#E8F8F5] flex items-center justify-center mb-3">
            {isSuccess ? (
              <CheckCircle className="w-7 h-7 text-[#27AE60]" />
            ) : (
              <ThumbsUp className="w-7 h-7 text-[#27AE60]" />
            )}
          </div>
          <DialogTitle className="text-xl font-semibold text-[#2C3E50]">
            {isSuccess ? "Thanks for your suggestion!" : "Suggest a Gift"}
          </DialogTitle>
        </DialogHeader>

        {isSuccess ? (
          <div className="text-center py-4">
            <p className="text-[#7F8C8D]">
              Your gift idea has been shared with the wishlist owner.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="giftName" className="text-sm font-medium text-[#2C3E50]">
                Gift name <span className="text-[#E74C3C]">*</span>
              </Label>
              <Input
                id="giftName"
                type="text"
                placeholder="e.g., Wireless Headphones"
                value={giftName}
                onChange={(e) => setGiftName(e.target.value)}
                className="h-11 rounded-lg border-[#BDC3C7] focus:border-[#3498DB] focus:ring-[#3498DB]"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="giftUrl" className="text-sm font-medium text-[#2C3E50]">
                Product URL <span className="text-[#95A5A6]">(optional)</span>
              </Label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#95A5A6]" />
                <Input
                  id="giftUrl"
                  type="url"
                  placeholder="https://..."
                  value={giftUrl}
                  onChange={(e) => setGiftUrl(e.target.value)}
                  className="h-11 pl-10 rounded-lg border-[#BDC3C7] focus:border-[#3498DB] focus:ring-[#3498DB]"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-lg bg-[#27AE60] hover:bg-[#219A52] text-white font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Send Suggestion
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
