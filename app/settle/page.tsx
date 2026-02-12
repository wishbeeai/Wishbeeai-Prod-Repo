import { redirect } from "next/navigation"
import { getReloadlyBalance } from "@/lib/reloadly"

const GIFT_CARD_MIN_BALANCE = 1.0

export default async function SettleIndexPage() {
  const balance = await getReloadlyBalance()
  if (balance < GIFT_CARD_MIN_BALANCE) {
    console.warn("[settle] Service Unavailable: Reloadly balance below $1.00, defaulting to Wishbee Credits", {
      balance,
      redirect: "/settle/refund-credits",
    })
    redirect("/settle/refund-credits")
  }
  redirect("/settle/balance")
}
