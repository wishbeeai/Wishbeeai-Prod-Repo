# Fix gift "raised" and "contributors" not updating

## If a contribution didn't save (e.g. $700 not showing)

This can happen if the contribution was made when **SUPABASE_SERVICE_ROLE_KEY** was not set (the update is then blocked by RLS). To fix one gift in the DB, run in **Supabase SQL Editor** (Dashboard → SQL Editor → New query). Replace the gift id and amounts as needed:

```sql
-- Example: gift 5df825b8-5dec-48ae-abda-b3700af076b3, $700 from 1 contributor
UPDATE gifts
SET current_amount = 700, contributors = 1, updated_at = NOW()
WHERE id = '5df825b8-5dec-48ae-abda-b3700af076b3';
```

Then reload the gift detail page (or refocus the tab); it will show the updated raised amount and contributor count.

**Quick fix for this specific gift:** Run the file `FIX-GIFT-5df825b8-CONTRIBUTION.sql` in the project root in Supabase SQL Editor.

## New contributions not updating

1. **Set `SUPABASE_SERVICE_ROLE_KEY`** in your env (Vercel/local `.env`). Guest contributions need the admin client to update the gift row; without it you may see 503 or "Server configuration error".
2. **Refocus the tab** – The gift detail page refetches when you return to the tab, so after contributing in another tab, switch back to the detail tab to see updated amounts (or refresh the page).
