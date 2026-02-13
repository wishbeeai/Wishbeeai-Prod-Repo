"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

type SettlementContextValue = {
  /** Reloadly wallet balance (USD). null while loading or on error. */
  reloadlyBalance: number | null
  /** Current gift surplus (remaining balance) when on balance page with a gift. */
  currentSurplus: number
  setCurrentSurplus: (value: number) => void
  /** True when balance is loaded and reloadlyBalance >= currentSurplus. */
  showGiftCardTab: boolean
  /** Admin-only notices (e.g. why gift card is hidden). */
  isAdmin: boolean
}

const SettlementContext = createContext<SettlementContextValue | null>(null)

const BALANCE_CACHE_MS = 60_000

export function SettlementProvider({
  children,
}: {
  children: ReactNode
}) {
  const [reloadlyBalance, setReloadlyBalance] = useState<number | null>(null)
  const [currentSurplus, setCurrentSurplusState] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)
  const [balanceFetchedAt, setBalanceFetchedAt] = useState(0)

  const setCurrentSurplus = useCallback((value: number) => {
    setCurrentSurplusState(value)
  }, [])

  useEffect(() => {
    const now = Date.now()
    if (balanceFetchedAt && now - balanceFetchedAt < BALANCE_CACHE_MS) return
    let cancelled = false
    fetch("/api/reloadly/balance")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        setReloadlyBalance(typeof data.balance === "number" ? data.balance : 0)
        setIsAdmin(!!data.isAdmin)
        setBalanceFetchedAt(Date.now())
      })
      .catch(() => {
        if (!cancelled) setReloadlyBalance(0)
      })
    return () => {
      cancelled = true
    }
  }, [balanceFetchedAt])

  // Show Gift Card tab while loading (optimistic), or when balance is sufficient. Only hide when we know balance < surplus.
  const showGiftCardTab =
    reloadlyBalance === null || reloadlyBalance >= currentSurplus

  const value: SettlementContextValue = {
    reloadlyBalance,
    currentSurplus,
    setCurrentSurplus,
    showGiftCardTab,
    isAdmin,
  }

  return (
    <SettlementContext.Provider value={value}>
      {children}
    </SettlementContext.Provider>
  )
}

export function useSettlement() {
  const ctx = useContext(SettlementContext)
  return ctx
}
