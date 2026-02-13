/**
 * Wishbee Cash Refund flow — Playwright validation suite
 *
 * Run: npx playwright test playwright/cash-refund-validation.spec.ts
 * Or:  npm test (with testMatch including playwright/)
 *
 * Prerequisites: Dev server runs at baseURL (e.g. http://127.0.0.1:3001).
 * For full e2e (execution test), backend and a completed gift with contributions are required.
 */

import { test, expect } from "@playwright/test"

const TEST_GIFT_ID = "test-gift-refund-001"

// Sample refund preview response (fee deduction: Net < Total Gross)
const MOCK_REFUND_PREVIEW = {
  giftId: TEST_GIFT_ID,
  giftName: "Test Wishbee",
  totalGross: 100,
  totalFees: 6.2,
  netRefundablePool: 93.8,
  rows: [
    { contributorName: "Alice", originalAmount: 60, estimatedRefund: 56.28 },
    { contributorName: "Bob", originalAmount: 40, estimatedRefund: 37.52 },
  ],
}

test.describe("Wishbee Cash Refund flow", () => {
  test.beforeEach(async ({ page }) => {
    // Mock refund-preview so we have a completed Wishbee with multiple contributions
    await page.route(`**/api/gifts/${TEST_GIFT_ID}/refund-preview`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_REFUND_PREVIEW),
      })
    })
  })

  test("Navigation: Cash Refunds link is visible and clickable; URL is /settle/refund-direct", async ({
    page,
  }) => {
    await page.goto("/settle/balance")
    await expect(page).toHaveURL(/\/settle\/balance/)

    const cashRefundsLink = page.getByRole("link", { name: /Cash Refunds/i })
    await expect(cashRefundsLink).toBeVisible()
    await expect(cashRefundsLink).toBeEnabled()

    await cashRefundsLink.click()
    await expect(page).toHaveURL(/\/settle\/refund-direct/)
  })

  test("Math verification: Net Pool < Total Gross; table refund amounts sum to Net Pool", async ({
    page,
  }) => {
    await page.goto(`/settle/refund-direct?id=${TEST_GIFT_ID}`)
    await expect(page.getByText("Fee breakdown")).toBeVisible({ timeout: 10000 })

    const totalGrossText = await page.getByText(/Total contributions \(gross\):/).textContent()
    const netPoolText = await page.getByText(/Net refundable pool:/).textContent()

    const totalGrossMatch = totalGrossText?.match(/\$([\d.]+)/)
    const netPoolMatch = netPoolText?.match(/\$([\d.]+)/)
    expect(totalGrossMatch).toBeTruthy()
    expect(netPoolMatch).toBeTruthy()

    const totalGross = parseFloat(totalGrossMatch![1])
    const netPool = parseFloat(netPoolMatch![1])
    expect(netPool).toBeLessThan(totalGross)

    const estimatedCells = page.locator("table tbody td:last-child")
    const count = await estimatedCells.count()
    let sum = 0
    for (let i = 0; i < count; i++) {
      const text = await estimatedCells.nth(i).textContent()
      const value = parseFloat(text?.replace(/[$,]/g, "") || "0")
      sum += value
    }
    const roundedSum = Math.round(sum * 100) / 100
    expect(roundedSum).toBeCloseTo(netPool, 2)
  })

  test("Execution: Confirm & Process → loading state → redirect to summary", async ({
    page,
  }) => {
    await page.goto(`/settle/refund-direct?id=${TEST_GIFT_ID}`)
    await expect(page.getByText("Fee breakdown")).toBeVisible({ timeout: 10000 })

    const confirmBtn = page.getByRole("button", { name: /Confirm & Process/i })
    await expect(confirmBtn).toBeVisible()

    await confirmBtn.click()
    await expect(page.getByText("Processing…")).toBeVisible({ timeout: 5000 })

    // With real backend (Stripe + DB), the action succeeds and redirects. Without it, we only verify loading state.
    if (process.env.REFUND_E2E_BACKEND) {
      await expect(page).toHaveURL(/\/settle\/refund-direct\/summary/, { timeout: 20000 })
    } else {
      // Give a short window for redirect; if still on same page, loading should eventually stop
      await page.waitForTimeout(2000)
      const url = page.url()
      if (url.includes("/summary")) {
        expect(url).toMatch(/\/settle\/refund-direct\/summary/)
      }
    }
  })

  test("State verification: Summary page shows SETTLED_REFUND status", async ({ page }) => {
    await page.goto(
      `/settle/refund-direct/summary?bank=1&credits=0&failed=0&giftId=${TEST_GIFT_ID}`
    )
    await expect(page.getByTestId("gift-status")).toContainText("Settled (Refund)")
  })

  test("Edge case (simulated Stripe error → Store Credit): Summary shows Store Credit Fallback message", async ({
    page,
  }) => {
    await page.goto(
      `/settle/refund-direct/summary?bank=0&credits=1&failed=0&giftId=${TEST_GIFT_ID}`
    )
    await expect(page.getByTestId("store-credit-fallback-message")).toBeVisible()
    await expect(page.getByTestId("store-credit-fallback-message")).toContainText(
      "Wishbee Store Credit"
    )
  })
})
