# Wishbee Credits — Setup Steps

## 1. Run migration 031

Migration file: `supabase/migrations/031_wishbee_credits_schema.sql`  
It adds: `profiles.credit_balance`, `credit_transactions` table, `spend_credits()` function, and gift status `settled_credits`.

### Option A: Supabase Dashboard (SQL Editor)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **SQL Editor**.
3. Open `supabase/migrations/031_wishbee_credits_schema.sql` in your repo and copy its full contents.
4. Paste into the SQL Editor and click **Run**.
5. Confirm no errors. You should see messages for `ALTER TABLE`, `CREATE TABLE`, `CREATE FUNCTION`, etc.

### Option B: Supabase CLI (`supabase db push`)

1. Install [Supabase CLI](https://supabase.com/docs/guides/cli) if needed.
2. In the project root (where `supabase/` lives), run:
   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   ```
   This applies all pending migrations, including 031.  
   To run only this migration on an already-linked project:
   ```bash
   supabase db push
   ```

### Verify migration

In Supabase **Table Editor** or SQL:

- **profiles**: column `credit_balance` (decimal, default 0).
- **credit_transactions**: table exists with `user_id`, `amount`, `type`, `wishbee_id`, `created_at`.
- **SQL**: `SELECT * FROM spend_credits('00000000-0000-0000-0000-000000000000'::uuid, 0);` should return one row (e.g. `success = false`) without error.

---

## 2. Contribute flow and credits

The only checkout that posts to the contribute API is:

- **Route:** `app/gifts/contribute/[id]/page.tsx`
- **URL:** `/gifts/contribute/[giftId]` with optional `?token=...` (magic link).
- **API:** `POST /api/gifts/[id]/guest-contribute` (with optional `useCredits: true`).

There is **no** `app/wishbee/[id]/contribute` route in this repo; gift contribution is only at `/gifts/contribute/[id]`.

### What’s already implemented

- The contribute page calls `GET /api/credits/balance` on load.
- If the user is logged in and has `balance > 0`, it shows **“Use my Wishbee Credits ($X.XX)”**.
- If they choose credits and `balance >= amount`, step 2 shows **“Use Wishbee Credits — $amount”** and submits with `useCredits: true` (no card).
- The API spends credits via `spend_credits()` and records the contribution.

### If you add another checkout route later

Reuse the same pattern:

1. **Fetch balance:** `GET /api/credits/balance` (with cookies so the user is logged in).
2. **UI:** If `balance > 0`, show a “Use my Wishbee Credits ($X.XX)” option.
3. **Submit:** When paying fully with credits, send `useCredits: true` in the body of the request to the same contribute/checkout API (or an API that calls `spendCredits(userId, amount, giftId)` then records the contribution).
4. **Success:** Use the `paidWithCredits` flag from the response for messaging.

No code changes are required for the current repo beyond running migration 031; the contribute flow is already wired at `app/gifts/contribute/[id]`.
