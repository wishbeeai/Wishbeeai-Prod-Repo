# Fix: Profile updates not persisting

**Symptom:** After editing profile and saving, changes (name, phone, location, bio) disappear on refresh, or you get a 500 / "update is not happening".

**Cause:** The `profiles` table may not exist or may be missing columns/RLS policies.

**Fix (run once in Supabase):**

1. Open **Supabase Dashboard** → your project → **SQL Editor** → **New query**.
2. Run the full contents of **`supabase/migrations/032_profiles_table_create.sql`**.
   - This creates the `profiles` table if it doesn’t exist (with `id`, `email`, `name`, `phone`, `location`, `bio`, `birthday`, `profile_image`, `updated_at`).
   - Adds any missing columns if the table already exists.
   - Enables RLS and policies so users can read/insert/update their own row.
3. Save and run the query.

**If the table already existed but was missing columns only:**  
You can instead run **`017_profiles_phone_location_bio.sql`** and **`018_profiles_rls_policies.sql`**.

After this, profile updates will persist after refresh.
