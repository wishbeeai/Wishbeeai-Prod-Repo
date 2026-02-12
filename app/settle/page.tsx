import { redirect } from "next/navigation"
import { getReloadlyBalance } from "@/lib/reloadly"

export const dynamic = "force-dynamic"

const GIFT_CARD_MIN_BALANCE = 1.0

export default async function SettleIndexPage() {
  let balance: number
  try {
    balance = await getReloadlyBalance()
  } catch (e) {
    console.warn("[settle] Reloadly unavailable, defaulting to balance page", e)
    redirect("/settle/balance")
  }
  if (balance < GIFT_CARD_MIN_BALANCE) {
    console.warn("[settle] Service Unavailable: Reloadly balance below $1.00, defaulting to Wishbee Credits", {
      balance,
      redirect: "/settle/refund-credits",
    })
    redirect("/settle/refund-credits")
  }
  redirect("/settle/balance")
}
