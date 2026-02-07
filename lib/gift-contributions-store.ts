/**
 * In-memory store for gift contributions (used until/alongside gift_contributor_emails DB).
 * Shared by guest-contribute API and gifts/[id] API so "Recent Contributions" shows all donors.
 */

export type StoredContribution = {
  id: string
  giftId: string
  amount: number
  contributorName: string
  contributorEmail: string
  message?: string
  isGuest: boolean
  createdAt: Date
}

const contributionsStore = new Map<string, StoredContribution[]>()

export function getContributionsForGift(giftId: string): StoredContribution[] {
  return contributionsStore.get(giftId) || []
}

export function addContribution(giftId: string, contribution: StoredContribution): void {
  const existing = contributionsStore.get(giftId) || []
  existing.push(contribution)
  contributionsStore.set(giftId, existing)
}

export { contributionsStore }
