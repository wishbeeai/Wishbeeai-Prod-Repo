/**
 * Reloadly Cron Check-Balance — Playwright API test
 *
 * Verifies GET /api/cron/check-balance:
 * - With valid CRON_SECRET: returns 200 and JSON (balance, tier, thresholds).
 * - Without or wrong secret: returns 401 Unauthorized.
 *
 * Run (local dev server must be running or use webServer in config):
 *   pnpm exec playwright test playwright/cron-check-balance.spec.ts
 *
 * Set CRON_SECRET in env (or .env.test) to test authenticated response.
 * Without CRON_SECRET, only the 401 case runs.
 */

import { test, expect } from "@playwright/test"

const CRON_SECRET = process.env.CRON_SECRET?.trim()

test.describe("GET /api/cron/check-balance", () => {
  test("returns 401 when Authorization header is missing", async ({ request }) => {
    const res = await request.get("/api/cron/check-balance")
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body).toHaveProperty("error", "Unauthorized")
  })

  test("returns 401 when Authorization header is wrong", async ({ request }) => {
    const res = await request.get("/api/cron/check-balance", {
      headers: { Authorization: "Bearer wrong-secret" },
    })
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body).toHaveProperty("error", "Unauthorized")
  })

  test("returns 200 with balance, tier, thresholds when CRON_SECRET is valid", async ({
    request,
  }) => {
    test.skip(!CRON_SECRET, "CRON_SECRET not set — skip authenticated test")

    const res = await request.get("/api/cron/check-balance", {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    })

    expect(res.status()).toBe(200)
    expect(res.headers()["content-type"]).toContain("application/json")

    const body = await res.json()
    expect(body).toHaveProperty("balance")
    expect(body).toHaveProperty("tier")
    expect(body).toHaveProperty("thresholds")
    expect(body.thresholds).toEqual({ low: 50, critical: 10 })
    expect(["OK", "LOW", "CRITICAL"]).toContain(body.tier)
    expect(typeof body.balance).toBe("number")
  })
})
