# Fix: "Could not find the 'collection_title' (or any) column of 'gifts'" (PGRST204)

When creating a gift collection you get a 500 error with:

- **details:** `Could not find the 'collection_title' column of 'gifts' in the schema cache`
- **code:** `PGRST204`

The `gifts` table is missing columns or has the wrong schema. PostgREST (Supabase API) uses a schema cache; after fixing the table you **must reload that cache**.

---

## Fix (2 steps – both required)

### Step 1: Run the migration SQL

1. In your project root, open **`RUN-GIFTS-MIGRATION.sql`** (or `supabase/migrations/012_ensure_gifts_schema.sql`).
2. Copy **the entire file** (all lines – it’s SQL only).
3. In **Supabase Dashboard** go to **SQL Editor** → **New query**.
4. Paste the copied SQL and click **Run**.
5. You should see **Success. No rows returned**.

**Do not paste this .md file** into the SQL Editor – only the contents of **RUN-GIFTS-MIGRATION.sql** (or 012).

**Note:** This migration **drops and recreates** the `gifts` table. Any existing rows in `gifts` will be deleted.

### Step 2: Reload the schema cache (required)

If you skip this, the API will still return PGRST204.

1. In Supabase Dashboard go to **Project Settings** (gear icon).
2. Open **API** (or **General**).
3. Find **“Reload schema cache”** / **“Reload”** and click it, **or** use **Restart project** under **General**.
4. Wait until the project is ready again.

Then try creating a gift again in the app.

---

## If it still fails

- In **Table Editor** → **gifts**, confirm the table has columns like `collection_title`, `gift_name`, `banner_image`, etc.
- Reload the schema cache (or restart the project) again.
- If the trigger fails with a syntax error on `EXECUTE FUNCTION`, your Postgres may be older; you can remove the trigger block at the end of 012 and run the rest.
