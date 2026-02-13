/**
 * Wishbee Credits — Playwright E2E tests
 *
 * Run: pnpm exec playwright test playwright/wishbee-credits.spec.ts
 *
 * 1. Issue Credits: Organizer goes to refund-credits, confirms distribution, sees success.
 * 2. Spend Credits: Contributor with balance sees "Use Wishbee Credits", checks it,
 *    sees Total Due / summary update, completes contribution, balance decreases in UI.
 *
 * Uses mocked APIs so tests run without a real backend. For full E2E with real auth
 * and DB, set env: TEST_ORGANIZER_EMAIL, TEST_ORGANIZER_PASSWORD, WISHBEE_CREDITS_GIFT_ID,
 * TEST_CONTRIBUTOR_EMAIL, TEST_CONTRIBUTOR_PASSWORD, TEST_CONTRIBUTE_GIFT_ID, TEST_CONTRIBUTE_TOKEN.
 */

import { test, expect } from "@playwright/test"

const CREDITS_GIFT_ID = process.env.WISHBEE_CREDITS_GIFT_ID || "wishbee-credits-test-gift-001"
const CONTRIBUTE_GIFT_ID = process.env.TEST_CONTRIBUTE_GIFT_ID || "wishbee-credits-contribute-001"
const CONTRIBUTE_TOKEN = process.env.TEST_CONTRIBUTE_TOKEN || "test-magic-token-credits"

const MOCK_REFUND_PREVIEW = {
  giftId: CREDITS_GIFT_ID,
  giftName: "Test Wishbee for Credits",
  totalGross: 100,
  totalFees: 6.2,
  netRefundablePool: 93.8,
  rows: [
    { contributorName: "Alice", originalAmount: 60, estimatedRefund: 56.28 },
    { contributorName: "Bob", originalAmount: 40, estimatedRefund: 37.52 },
  ],
}

const MOCK_GIFT_DETAILS = {
  id: CONTRIBUTE_GIFT_ID,
  collectionTitle: "Test Collection",
  giftName: "Test Gift",
  description: "Help make this gift possible!",
  targetAmount: 500,
  currentAmount: 0,
  contributors: 0,
  deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  recipientName: "Someone Special",
  occasion: "Birthday",
}

// -----------------------------------------------------------------------------
// Scenario 1: Issue Credits
// -----------------------------------------------------------------------------
test.describe("Wishbee Credits — Issue Credits", () => {
  test("refund-credits page loads with preview and Confirm button (no backend)", async ({
    page,
  }) => {
    await page.route(`**/api/gifts/${CREDITS_GIFT_ID}/refund-preview*`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_REFUND_PREVIEW),
      })
    )
    await page.goto(`/settle/refund-credits?id=${CREDITS_GIFT_ID}`)
    await expect(
      page.getByRole("heading", { name: /Wishbee Credits/i })
    ).toBeVisible({ timeout: 10000 })
    await expect(
      page.getByRole("heading", { name: "Proportional credit distribution" })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: /Confirm & distribute credits/i })
    ).toBeVisible()
  })

  test("Organizer: confirm distribution and see success (requires real backend)", async ({
    page,
  }) => {
    const useRealBackend = process.env.WISHBEE_CREDITS_REAL_BACKEND === "1"
    test.skip(!useRealBackend, "Set WISHBEE_CREDITS_REAL_BACKEND=1 and run backend for this test")

    await page.route(`**/api/gifts/${CREDITS_GIFT_ID}/refund-preview*`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_REFUND_PREVIEW),
      })
    )

    if (process.env.TEST_ORGANIZER_EMAIL && process.env.TEST_ORGANIZER_PASSWORD) {
      await page.goto("/")
      const loginBtn = page.getByRole("button", { name: /log in|sign in/i }).first()
      if (await loginBtn.isVisible().catch(() => false)) {
        await loginBtn.click()
        await page.getByPlaceholder(/email/i).fill(process.env.TEST_ORGANIZER_EMAIL)
        await page.getByPlaceholder(/password/i).fill(process.env.TEST_ORGANIZER_PASSWORD)
        await page.getByRole("button", { name: /sign in|log in/i }).click()
        await expect(page).toHaveURL(/\/(profile|dashboard|\?)/, { timeout: 15000 })
      }
    }

    await page.goto(`/settle/refund-credits?id=${CREDITS_GIFT_ID}`)
    await expect(
      page.getByRole("heading", { name: /Wishbee Credits/i })
    ).toBeVisible({ timeout: 10000 })
    await expect(
      page.getByRole("heading", { name: "Proportional credit distribution" })
    ).toBeVisible()

    const confirmBtn = page.getByRole("button", {
      name: /Confirm & distribute credits/i,
    })
    await expect(confirmBtn).toBeVisible()
    await confirmBtn.click()

    await expect(page.getByText("Processing…")).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole("heading", { name: "Success!" })).toBeVisible({ timeout: 25000 })
    await expect(
      page.getByText("Your friends just got a head start on their next Wishbee.")
    ).toBeVisible()
    await expect(page.getByText(/Credits distributed/i)).toBeVisible()
  })
})

// -----------------------------------------------------------------------------
// Scenario 2: Spend Credits
// -----------------------------------------------------------------------------
test.describe("Wishbee Credits — Spend Credits", () => {
  test("Contributor with credits: checkbox appears, Total Due updates, complete contribution, balance decreased", async ({
    page,
  }) => {
    const initialBalance = 50
    const contributionAmount = 25

    await page.route("**/api/credits/balance*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ balance: initialBalance }),
      })
    )

    await page.route(
      `**/api/gifts/${CONTRIBUTE_GIFT_ID}/magic-link*`,
      (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            valid: true,
            giftDetails: MOCK_GIFT_DETAILS,
            settings: { colorTheme: "gold", invitationMessage: "" },
          }),
        })
    )

    let contributeCalls = 0
    await page.route(`**/api/gifts/${CONTRIBUTE_GIFT_ID}/guest-contribute`, async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue()
        return
      }
      contributeCalls++
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          paidWithCredits: true,
          contribution: {
            id: "test-contrib-1",
            amount: contributionAmount,
            contributorName: "Test Contributor",
            createdAt: new Date().toISOString(),
          },
          giftProgress: {
            totalContributions: contributionAmount,
            contributorCount: 1,
          },
          message: "Thank you! Your contribution was applied using Wishbee Credits.",
        }),
      })
    })

    await page.goto(`/gifts/contribute/${CONTRIBUTE_GIFT_ID}?token=${CONTRIBUTE_TOKEN}`)
    await expect(page.getByText(/Loading gift details|Make a Contribution/i)).toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByText("Make a Contribution")).toBeVisible({ timeout: 15000 })

    const useCreditsLabel = page.getByText(new RegExp(`Use my Wishbee Credits \\(\\$${initialBalance.toFixed(2)}\\)`))
    await expect(useCreditsLabel).toBeVisible({ timeout: 5000 })

    await page.getByPlaceholder(/Custom amount/i).fill(contributionAmount.toString())
    await page.getByPlaceholder(/your@email\.com/i).fill("contributor@test.wishbee.ai")

    await useCreditsLabel.click()

    await page.getByRole("button", { name: /Continue to Payment/i }).click()

    await expect(
      page.getByText(new RegExp(`Paying with Wishbee Credits \\(\\$${contributionAmount}\\)`))
    ).toBeVisible({ timeout: 5000 })
    const totalDueSummary = page.getByText(new RegExp(`\\$${contributionAmount}`)).first()
    await expect(totalDueSummary).toBeVisible()

    const payWithCreditsBtn = page.getByRole("button", {
      name: new RegExp(`Use Wishbee Credits — \\$${contributionAmount}`),
    })
    await expect(payWithCreditsBtn).toBeVisible()
    await payWithCreditsBtn.click()

    await expect(
      page.getByRole("heading", { name: "Thank You!" })
    ).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("Paid with Wishbee Credits")).toBeVisible()
    expect(contributeCalls).toBe(1)

    const newBalance = initialBalance - contributionAmount
    await page.route("**/api/credits/balance*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ balance: newBalance }),
      })
    )
    await page.goto(`/gifts/contribute/${CONTRIBUTE_GIFT_ID}?token=${CONTRIBUTE_TOKEN}`)
    await expect(page.getByText("Make a Contribution")).toBeVisible({ timeout: 15000 })
    await expect(
      page.getByText(new RegExp(`Use my Wishbee Credits \\(\\$${newBalance.toFixed(2)}\\)`))
    ).toBeVisible({ timeout: 5000 })
  })
})
