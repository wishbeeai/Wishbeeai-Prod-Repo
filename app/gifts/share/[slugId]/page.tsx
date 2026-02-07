"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Extract gift ID from share path segment (e.g. "cloud-s-birthday-007e687a-ccc7-457f-9b10-e455e665ca0c" -> UUID) */
function extractGiftId(slugId: string): string | null {
  const match = slugId.match(UUID_REGEX)
  return match ? match[0] : null
}

export default function GiftSharePage() {
  const params = useParams()
  const router = useRouter()
  const slugId = typeof params.slugId === "string" ? params.slugId : ""

  useEffect(() => {
    const giftId = extractGiftId(slugId)
    if (giftId) {
      router.replace(`/gifts/${giftId}`)
    } else {
      router.replace("/gifts/active")
    }
  }, [slugId, router])

  return (
    <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-[#654321]">
        <Loader2 className="h-10 w-10 animate-spin text-[#DAA520]" />
        <p className="font-medium">Opening gift...</p>
      </div>
    </div>
  )
}
