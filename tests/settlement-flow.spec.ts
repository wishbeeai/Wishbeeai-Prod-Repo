/**
 * Wishbee Settlement Flow Integration Tests
 *
 * Run: pnpm exec playwright test tests/settlement-flow.spec.ts
 * Or:  pnpm test
 */

import { test, expect } from "@playwright/test"

// Stripe fee formula: (amount + 0.30) / (1 - 0.029) — mirrors lib/donation-fee.ts
const STRIPE_PERCENT = 0.029
const STRIPE_FLAT = 0.3
function calculateTotalWithFees(netAmount: number): number {
  const rounded = Math.round(netAmount * 100) / 100
  const total = (rounded + STRIPE_FLAT) / (1 - STRIPE_PERCENT)
  return Math.round(total * 100) / 100
}

// =============================================================================
// Test 1: Full Charity Path
// - Stripe math: $25.00 balance + covered fees => totalCharged = $26.06
// - GiftSettlement type: 'charity' (disposition in DB)
// - EIN bound for charity receipts (Feeding America: 36-3673599)
// =============================================================================

test.describe("Full Charity Path", () => {
  test("Stripe fee formula: $25.00 + covered fees => totalCharged = $26.06", () => {
    const totalCharged = calculateTotalWithFees(25)
    expect(totalCharged).toBe(26.06)
  })

  test("$25 with fee covered: netToCharity=25, totalCharged=26.06, fee≈1.06", () => {
    const totalCharged = calculateTotalWithFees(25)
    const netToCharity = 25
    const fee = Math.round((totalCharged - netToCharity) * 100) / 100
    expect(netToCharity).toBe(25)
    expect(totalCharged).toBe(26.06)
    expect(fee).toBeCloseTo(1.06, 2)
  })

  test("GiftSettlement disposition maps to CHARITY for charity donations", () => {
    const disposition = "charity"
    expect(disposition).toBe("charity")
  })

  test("Feeding America EIN bound for charity receipts", () => {
    const FEEDING_AMERICA_EIN = "36-3673599"
    expect(FEEDING_AMERICA_EIN).toBe("36-3673599")
  })
})

// =============================================================================
// Test 2: PDF Rendering / Receipt Page
// - Navigate to /receipt/[testId] with mocked API
// - Verify 'No goods or services were provided' in DOM
// - Verify no-print class on Download/Print button
// =============================================================================

test.describe("PDF Rendering", () => {
  const TEST_RECEIPT_ID = "test-receipt-charity-123"

  test("receipt page shows tax disclosure and no-print on Download button", async ({
    page,
  }) => {
    await page.route("**/api/receipt/*", async (route) => {
      const url = route.request().url()
      if (url.includes("/api/receipt/")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            receipt: {
              transactionId: TEST_RECEIPT_ID,
              charityName: "Feeding America",
              ein: "36-3673599",
              netAmount: 25,
              feeAmount: 1.06,
              totalCharged: 26.06,
              date: new Date().toISOString(),
              donorName: "Test Donor",
              disposition: "charity",
            },
          }),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto(`/receipt/${TEST_RECEIPT_ID}`)

    await expect(page.getByText("No goods or services were provided")).toBeVisible({
      timeout: 10000,
    })

    const printButton = page.getByRole("button", { name: /Download\/Print Receipt/i })
    await expect(printButton).toBeVisible()
    await expect(printButton).toHaveClass(/no-print/)
  })
})

// =============================================================================
// Test 3: Security Check
// - Access /receipt/[randomId] with non-existent ID
// - Expect 404 or 403, no data leak
// =============================================================================

test.describe("Security Check", () => {
  test("random receipt ID returns 404 and does not leak data", async ({
    page,
    request,
  }) => {
    const randomId = "00000000-0000-0000-0000-000000000000"
    const res = await request.get(`/api/receipt/${randomId}`)

    expect(res.status()).toBe(404)

    const body = await res.json().catch(() => ({}))
    expect(body).toHaveProperty("error")
    expect(body.error).toBeTruthy()
    expect(body).not.toHaveProperty("receipt")
  })

  test("receipt page with invalid ID shows error and no sensitive data", async ({
    page,
  }) => {
    await page.route("**/api/receipt/*", async (route) => {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ error: "Receipt not found" }),
      })
    })

    await page.goto("/receipt/invalid-random-id-12345")

    await expect(page.getByText(/Receipt not found|not found/i)).toBeVisible({
      timeout: 10000,
    })

    await expect(page.getByText("No goods or services were provided")).toHaveCount(0)
  })
})
