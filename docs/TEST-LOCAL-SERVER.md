# How to test on the local server

## 1. Start the dev server

From the project root:

```bash
npm install
npm run dev
```

When you see **Ready on http://127.0.0.1:3001**, open:

**http://127.0.0.1:3001**

(or http://localhost:3001)

---

## 2. Environment variables (for local testing)

Use a **`.env.local`** file in the project root. At minimum for the app (and refund flow) you need:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Required for refund action (bypasses RLS) |
| `STRIPE_SECRET_KEY` | Use a **test** key (`sk_test_...`) so refunds don’t charge real cards |
| `NEXT_PUBLIC_BASE_URL` | Set to `http://127.0.0.1:3001` for local |

Get Supabase values from: **Supabase Dashboard → Project Settings → API**.  
Get Stripe test key from: **Stripe Dashboard → Developers → API keys** (use **Test mode**).

Restart the dev server after changing `.env.local`.

---

## 3. Database: run migrations first

Migrations **029** and **030** must be applied to the database you’re using (see [RUN-MIGRATIONS-029-030.md](./RUN-MIGRATIONS-029-030.md)).

- If you use **hosted Supabase**: run 029 and 030 in the SQL Editor (or `supabase db push` if linked).
- If you use **Supabase local**: run migrations with `supabase db reset` or `supabase migration up`.

---

## 4. Test the Cash Refund flow

1. **Sign in** (or create an account) so you have a user and can see Active Gifts.
2. **Have a gift with contributions**  
   The refund flow needs:
   - A **gift** in `gifts` (e.g. from creating a gift and marking it completed).
   - Rows in **`gift_payment_contributions`** for that gift with `status = 'completed'` and **`stripe_payment_intent_id`** set (and optionally **`user_id`** for store-credit fallback).
3. **Open the refund page**  
   - Go to **Active Gifts** and note a gift ID, or use a known one.  
   - Visit: **http://127.0.0.1:3001/settle/refund-direct?id=YOUR_GIFT_ID**
4. You should see:
   - Fee breakdown (Total gross, Stripe fees, Net refundable pool)
   - Table of contributors and estimated refunds
   - Warning banner and **Confirm & Process**
5. **Click Confirm & Process**  
   - The server action will run (Stripe and Supabase must be configured).  
   - You’ll be redirected to the summary page with bank refund and/or credits issued counts.

**If you have no real payment data:** the table will be empty until `gift_payment_contributions` has completed rows with `stripe_payment_intent_id`. You can insert test rows in Supabase (Table Editor → `gift_payment_contributions`) with fake `stripe_payment_intent_id` (e.g. `pi_test_...`) only for **dry-run / UI testing**; actual Stripe refunds will fail unless the payment intent is real in your Stripe test account.

---

## 5. Other useful local URLs

| Page | URL |
|------|-----|
| Home | http://127.0.0.1:3001 |
| Active Gifts | http://127.0.0.1:3001/gifts/active |
| Settle (rewards) | http://127.0.0.1:3001/settle/rewards |
| Cash Refunds | http://127.0.0.1:3001/settle/refund-direct |
| Settlement History | http://127.0.0.1:3001/settle/history |

Use **`?id=<gift_id>`** on refund-direct and history when testing a specific gift.

---

## 6. Troubleshooting

- **Blank or “No refundable contributions”**  
  - Migrations 029/030 applied?  
  - For that gift, does `gift_payment_contributions` have rows with `status = 'completed'` and non-null `stripe_payment_intent_id`?

- **“Server configuration error” or “admin client unavailable”**  
  - `SUPABASE_SERVICE_ROLE_KEY` must be set in `.env.local`.

- **Stripe refund errors**  
  - Use **Stripe test mode** and a **test** secret key (`sk_test_...`).  
  - Real refunds only work for real payment intents in the same Stripe account.

- **Port in use**  
  - Change port in `package.json`, e.g. `"dev": "next dev --hostname 127.0.0.1 -p 3002"`, then open http://127.0.0.1:3002.
