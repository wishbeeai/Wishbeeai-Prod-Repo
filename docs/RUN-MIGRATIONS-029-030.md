# How to run migrations 029 and 030

Use **one** of the two methods below.

---

## Option A: Supabase SQL Editor (simplest, no CLI)

1. Open your project in the [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** in the left sidebar.
3. Run **029** first:
   - Click **New query**.
   - Open `supabase/migrations/029_cash_refunds_refund_errors.sql` in your repo, copy its full contents, and paste into the editor.
   - Click **Run** (or press Ctrl+Enter). Wait until it finishes without errors.
4. Run **030** next:
   - New query again.
   - Open `supabase/migrations/030_refund_direct_credits.sql`, copy its full contents, and paste into the editor.
   - Click **Run**. Wait until it finishes.
5. Done. Migrations 029 and 030 are now applied.

---

## Option B: Supabase CLI (`supabase db push`)

Use this if your project is linked to Supabase via the CLI and you want to apply all pending migrations (including 029 and 030).

1. **Install Supabase CLI** (if needed):
   - [Install guide](https://supabase.com/docs/guides/cli)
   - Windows (scoop): `scoop install supabase`
   - Or: `npm install -g supabase`

2. **Log in and link the project** (one-time):
   ```bash
   supabase login
   cd c:\Users\segar\OneDrive\Desktop\Wishbeeai-Prod
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   Get `YOUR_PROJECT_REF` from the dashboard: Project Settings → General → Reference ID.

3. **Push migrations** (applies any that haven’t been applied yet):
   ```bash
   supabase db push
   ```
   This runs 029 and 030 (and any other new migrations) in order.

4. If you prefer to run only these two migrations remotely without a full link, you can use:
   ```bash
   supabase db push --include-all
   ```
   (Exact behavior depends on your CLI version; `supabase db push` is the standard command.)

---

## Verifying

After running both migrations:

- **029**: `gifts` allows status `refunding` and `settled_refund`; `gift_settlements` allows disposition `refund`; tables `refund_errors` and `gift_payment_contributions` exist.
- **030**: `gift_settlements` allows disposition `credit`; `gift_payment_contributions` has columns `user_id` and `stripe_refund_id`; table `user_credit_ledger` exists.

In the SQL Editor you can run:

```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'gift_payment_contributions' AND column_name IN ('user_id', 'stripe_refund_id');
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_credit_ledger');
```

You should see two rows for the columns and `true` for the ledger table.
