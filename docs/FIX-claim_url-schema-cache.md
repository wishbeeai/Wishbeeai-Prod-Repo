# Fix: "Could not find the 'claim_url' column of 'gift_settlements' in the schema cache"

This error means the `claim_url` (and usually `order_id`) columns were never added to `gift_settlements` — i.e. migration **027** was not applied to your database.

## Quick fix (recommended)

1. Open **Supabase Dashboard** → your project → **SQL Editor** → New query.
2. Copy the contents of **`docs/RUN-ADD-claim_url-gift_settlements.sql`** (or the SQL below) and run it.
3. In Supabase: **Settings** → **API** → click **Reload schema cache** (if the error persists).

```sql
ALTER TABLE gift_settlements
ADD COLUMN IF NOT EXISTS claim_url TEXT;

ALTER TABLE gift_settlements
ADD COLUMN IF NOT EXISTS order_id TEXT;

CREATE INDEX IF NOT EXISTS idx_gift_settlements_order_id ON gift_settlements(order_id) WHERE order_id IS NOT NULL;

COMMENT ON COLUMN gift_settlements.claim_url IS 'Tremendous reward claim URL (delivery.link).';
COMMENT ON COLUMN gift_settlements.order_id IS 'Tremendous order ID for bonus gift card settlements.';
```

## Option 2: Run migration 027 via CLI

From the project root:

```bash
npx supabase db push
```

Or:

```bash
supabase migration up
```

Then reload the schema cache in Dashboard → Settings → API if needed.
