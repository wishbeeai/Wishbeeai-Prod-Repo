-- Allow UPDATE on gift_contributor_emails so upsert (same email contributes again) works.
-- Run in Supabase SQL Editor.

CREATE POLICY "gift_contributor_emails_update"
  ON gift_contributor_emails FOR UPDATE
  USING (true)
  WITH CHECK (true);
