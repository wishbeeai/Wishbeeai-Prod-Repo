-- Store contributor emails for gift collections so reminder emails can be sent.
-- Run in Supabase SQL Editor, then: Project Settings -> API -> Reload schema.

CREATE TABLE IF NOT EXISTS gift_contributor_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_id UUID NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  contributor_name TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(gift_id, email)
);

CREATE INDEX IF NOT EXISTS idx_gift_contributor_emails_gift_id ON gift_contributor_emails(gift_id);

ALTER TABLE gift_contributor_emails ENABLE ROW LEVEL SECURITY;

-- Service role / API can insert (guest contributions) and select (remind API)
CREATE POLICY "gift_contributor_emails_select_by_gift"
  ON gift_contributor_emails FOR SELECT
  USING (true);

CREATE POLICY "gift_contributor_emails_insert_service"
  ON gift_contributor_emails FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE gift_contributor_emails IS 'Contributor emails for gift collections; used for reminder emails.';
