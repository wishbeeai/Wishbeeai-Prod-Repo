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
    <div className="min-h-screen bg-gradient-to-b from-[#F5F1E8] via-[#FEFCF8] to-[#F5F1E8]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-[#8B5A3C] hover:text-[#654321] mb-8 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </Link>

        <header className="mb-10 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#654321] flex items-center justify-center gap-3">
            <span className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#DAA520] to-[#B8860B] text-white shadow-lg">
              <Wallet className="w-6 h-6 sm:w-7 sm:h-7" aria-hidden />
            </span>
            Wallet & Gift History
          </h1>
          <p className="text-[#8B5A3C]/90 mt-2 text-sm sm:text-base max-w-lg mx-auto">
            Your Wishbee Credits balance and contribution activity across gift pools.
          </p>
        </header>

        {/* Available Credits card */}
        <section className="mb-10">
          <div className="relative rounded-2xl overflow-hidden bg-white shadow-xl border-2 border-[#E8E0D5]">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FFFBEB] via-transparent to-[#FEF3C7]/30 pointer-events-none" />
            <div className="relative px-6 sm:px-8 py-8 text-center">
              <p className="text-xs uppercase tracking-widest text-[#8B5A3C]/80 font-semibold mb-2">
                Available Credits
              </p>
              <p className="text-4xl sm:text-5xl font-bold text-[#654321] tabular-nums tracking-tight">
                ${balance.toFixed(2)}
              </p>
              <p className="text-sm text-[#8B5A3C]/70 mt-1">Use at checkout when contributing to gifts.</p>
              <div className="flex flex-wrap gap-2 mt-6 justify-center">
                <Link
                  href="/gifts/create"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-[#3B2F0F] bg-gradient-to-r from-[#DAA520] via-[#F4C430] to-[#DAA520] hover:brightness-110 shadow-md transition-all"
                >
                  <Gift className="w-4 h-4" />
                  Start a New Wishbee
                </Link>
                <Link
                  href="/settle/support-wishbee"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-[#654321] border-2 border-[#DAA520]/50 bg-[#FFFBEB]/50 hover:border-[#DAA520] hover:bg-[#FFFBEB] transition-all"
                >
                  <Sparkles className="w-4 h-4 text-[#B8860B]" />
                  Support Wishbee
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Gift History */}
        <section>
          <div className="rounded-2xl bg-white shadow-xl border-2 border-[#E8E0D5] overflow-hidden">
            <div className="px-6 sm:px-8 py-5 border-b border-[#E8E0D5] bg-[#FAF8F5] text-center">
              <h2 className="text-lg sm:text-xl font-bold text-[#654321]">Gift History</h2>
              <p className="text-sm text-[#8B5A3C]/80 mt-1">
                Credits issued or spent and links to each Wishbee pool.
              </p>
            </div>

            {hasHistory ? (
              <WalletHistoryTable transactions={transactions} />
            ) : (
              <div className="px-6 sm:px-8 py-16 sm:py-20 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] flex items-center justify-center mx-auto mb-6 shadow-inner border border-[#DAA520]/20">
                  <Wallet className="w-10 h-10 text-[#B8860B]" aria-hidden />
                </div>
                <h3 className="text-xl font-semibold text-[#654321] mb-2">No history yet</h3>
                <p className="text-sm text-[#8B5A3C]/90 max-w-sm mx-auto mb-8 leading-relaxed">
                  Join a gift pool as a contributor or create your own Wishbee to see your credits and
                  activity here.
                </p>
                <Link
                  href="/gifts/active"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-[#3B2F0F] bg-gradient-to-r from-[#DAA520] to-[#F4C430] hover:shadow-lg transition-all"
                >
                  <Gift className="w-4 h-4" />
                  Browse active gifts
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
