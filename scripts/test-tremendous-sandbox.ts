#!/usr/bin/env tsx
/**
 * Tremendous Sandbox Connection Test
 *
 * Attempts to create a $1.00 gift card and prints the Reward Link.
 * Run with: npx tsx scripts/test-tremendous-sandbox.ts
 *
 * Ensure .env.local has:
 *   TREMENDOUS_API_KEY=...
 *   TREMENDOUS_CAMPAIGN_ID=...
 *   TREMENDOUS_FUNDING_SOURCE_ID=balance  (or BALANCE for sandbox)
 */

import { existsSync, readFileSync } from "fs"
import { join } from "path"
import { createTremendousReward } from "../lib/tremendous"

function loadEnvLocal() {
  const envPath = join(process.cwd(), ".env.local")
  if (!existsSync(envPath)) return
  const content = readFileSync(envPath, "utf-8")
  for (const line of content.split("\n")) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith("#")) {
      const eq = trimmed.indexOf("=")
      if (eq > 0) {
        const key = trimmed.slice(0, eq).trim()
        const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "")
        if (!process.env[key]) process.env[key] = value
      }
    }
  }
}

loadEnvLocal()

async function main() {
  console.log("\n🐝 Tremendous Sandbox Connection Test\n")
  console.log("Attempting to buy a $1.00 gift card...\n")

  const result = await createTremendousReward({
    amount: 1,
    recipientEmail: "test@example.com",
    recipientName: "Test Recipient",
    externalId: `test-sandbox-${Date.now()}`,
  })

  if (result.success) {
    console.log("✅ Success!\n")
    console.log("Order ID:", result.orderId)
    if (result.rewardId) console.log("Reward ID:", result.rewardId)
    console.log("\n📎 Reward Link (claim URL):")
    console.log(result.claimUrl)
    console.log("\nOpen the link above to verify the gift card was created.\n")
  } else {
    console.error("❌ Failed:", result.error)
    if (result.code) console.error("Code:", result.code)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
