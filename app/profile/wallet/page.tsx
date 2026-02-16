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
          className="inline-flex items-center gap-2 text-[#8B5A3C] hover:text-[#654321] mb-8 transition-colors text-[16px] font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </Link>

        <header className="mb-10 text-center">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
            <Wallet className="w-5 h-5 sm:w-8 sm:h-8 text-[#654321]" aria-hidden />
            <h1 className="text-[30px] font-bold text-[#654321]">
              Wallet & Gift History
            </h1>
          </div>
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
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-semibold text-[#3B2F0F] bg-gradient-to-r from-[#DAA520] via-[#F4C430] to-[#DAA520] hover:brightness-110 shadow-md transition-all"
                  style={{ width: 155.30, height: 35.95 }}
                >
                  <Gift className="w-4 h-4" />
                  Start a New Gift
                </Link>
                <Link
                  href="/settle/support-wishbee"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-semibold text-[#654321] border-2 border-[#DAA520]/50 bg-[#FFFBEB]/50 hover:border-[#DAA520] hover:bg-[#FFFBEB] transition-all"
                  style={{ width: 155.30, height: 35.95 }}
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
                <div className="flex items-center justify-center mx-auto mb-6">
                  <Wallet className="w-16 h-16 text-[#DAA520]/60" aria-hidden />
                </div>
                <h3 className="text-xl font-semibold text-[#654321] mb-2">
                  {balance > 0 ? "No transaction history yet" : "No history yet"}
                </h3>
                <p className="text-sm text-[#8B5A3C]/90 max-w-sm mx-auto mb-8 leading-relaxed">
                  {balance > 0
                    ? "You have credits available above. When you receive or use credits from gift pools (refunds, contributions, or bonuses), those transactions will appear here."
                    : "Join a gift pool as a contributor or create your own Gift to see your credits and activity here."}
                </p>
                <Link
                  href="/gifts/active"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-[#3B2F0F] bg-gradient-to-r from-[#DAA520] to-[#F4C430] hover:shadow-lg transition-all"
                >
                  <Gift className="w-4 h-4" />
                  Browse Active Gifts
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
