"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Bell, Loader2, CheckCircle, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface EmailNotifyModalProps {
  isOpen: boolean
  onClose: () => void
  shareId: string
  wishlistTitle: string
}

export function EmailNotifyModal({
  isOpen,
  onClose,
  shareId,
  wishlistTitle,
}: EmailNotifyModalProps) {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      // TODO: Implement API endpoint for email notifications
      // For now, simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      setIsSuccess(true)
      toast({
        title: "🐝 You're subscribed!",
        description: "We'll notify you when items are added to this wishlist.",
        variant: "warm",
      })
      
      setTimeout(() => {
        onClose()
        setEmail("")
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
    setEmail("")
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
          <div className="mx-auto w-14 h-14 rounded-full bg-[#EBF5FB] flex items-center justify-center mb-3">
            {isSuccess ? (
              <CheckCircle className="w-7 h-7 text-[#27AE60]" />
            ) : (
              <Bell className="w-7 h-7 text-[#3498DB]" />
            )}
          </div>
          <DialogTitle className="text-xl font-semibold text-[#2C3E50]">
            {isSuccess ? "You're all set!" : "Get Notified"}
          </DialogTitle>
        </DialogHeader>

        {isSuccess ? (
          <div className="text-center py-4">
            <p className="text-[#7F8C8D]">
              We&apos;ll email you when items are added to{" "}
              <span className="font-medium text-[#2C3E50]">{wishlistTitle}</span>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-[#2C3E50]">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-lg border-[#BDC3C7] focus:border-[#3498DB] focus:ring-[#3498DB]"
                required
              />
            </div>
            
            <p className="text-xs text-[#95A5A6]">
              We&apos;ll only send you an email when items are added. No spam, ever.
            </p>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-lg bg-[#3498DB] hover:bg-[#2980B9] text-white font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Subscribing...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Notify Me
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
