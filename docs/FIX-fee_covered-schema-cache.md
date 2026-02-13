# Fix: fee_covered column missing on gift_settlements

**Error:** `Could not find the 'fee_covered' column of 'gift_settlements' in the schema cache`

**Cause:** Migration `023_gift_settlements_immediate.sql` has not been applied to your Supabase project (or the schema cache is stale).

**Fix:**

1. Open **Supabase Dashboard** → your project → **SQL Editor** → **New query**.
2. Paste and run the contents of **`docs/RUN-ADD-fee_covered-gift_settlements.sql`** (or run that migration via CLI).
3. Reload or redeploy so the schema cache picks up the new columns.

That adds:

- `fee_covered` (BOOLEAN, default true) — used by instant donation and process-immediate-donation.
- `transaction_fee` (DECIMAL) — used for receipt display and audit.
- Status constraint update so `status` can be `'failed'` for immediate donation error handling.

After running, the insert in `/api/donations/process-instant` and `/api/gifts/[id]/process-immediate-donation` will succeed.
