import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Wallet, Gift, Sparkles, ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getCreditBalance, getCreditTransactionsForUser } from "@/lib/user-credits"
import { WalletHistoryTable } from "./wallet-history-table"

export const metadata: Metadata = {
  title: "Wallet & Gift History | Wishbee.ai",
  description: "View your Wishbee Credits balance and gift contribution history.",
}

export default async function WalletPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.id) {
    redirect("/")
  }

  const [balance, transactions] = await Promise.all([
    getCreditBalance(user.id),
    getCreditTransactionsForUser(user.id),
  ])

  const hasHistory = transactions.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FEFCF8] via-[#FFF9F0] to-[#F5F1E8]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-[#8B5A3C] hover:text-[#654321] mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#654321] flex items-center gap-2">
            <Wallet className="w-8 h-8 text-[#DAA520]" aria-hidden />
            Wallet & Gift History
          </h1>
          <p className="text-[#8B5A3C]/90 mt-1 text-sm">
            Your Wishbee Credits and contribution activity.
          </p>
        </div>

        {/* Available Credits card */}
        <div className="rounded-2xl bg-white shadow-lg border border-[#DAA520]/20 p-6 mb-8">
          <p className="text-xs uppercase tracking-wider text-[#8B5A3C]/70 font-semibold mb-1">
            Available Credits
          </p>
          <p className="text-3xl sm:text-4xl font-bold text-[#654321] tabular-nums">
            ${balance.toFixed(2)}
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              href="/gifts/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-[#B8860B] via-[#DAA520] to-[#B8860B] hover:brightness-105 shadow-md transition-all"
            >
              <Gift className="w-4 h-4" />
              Start a New Wishbee
            </Link>
            <Link
              href="/settle/support-wishbee"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-[#654321] border-2 border-[#DAA520]/40 hover:border-[#DAA520] hover:bg-[#FFFBEB]/80 transition-all"
            >
              <Sparkles className="w-4 h-4 text-[#DAA520]" />
              Support Wishbee
            </Link>
          </div>
        </div>

        {/* Gift History table */}
        <div className="rounded-2xl bg-white shadow-lg border border-[#DAA520]/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-[#DAA520]/10">
            <h2 className="text-lg font-bold text-[#654321]">Gift History</h2>
            <p className="text-sm text-[#8B5A3C]/80 mt-0.5">
              Credits issued or spent and links to each Wishbee pool.
            </p>
          </div>

          {hasHistory ? (
            <WalletHistoryTable transactions={transactions} />
          ) : (
            <div className="px-6 py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-[#FEF3C7]/80 flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-[#B8860B]" aria-hidden />
              </div>
              <h3 className="text-lg font-semibold text-[#654321] mb-2">No history yet</h3>
              <p className="text-sm text-[#8B5A3C]/90 max-w-sm mx-auto mb-6">
                Join a gift pool as a contributor or create your own Wishbee to see your credits and
                activity here.
              </p>
              <Link
                href="/gifts/active"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-[#DAA520] to-[#F4C430] text-[#654321] hover:shadow-lg transition-all"
              >
                <Gift className="w-4 h-4" />
                Browse active gifts
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
