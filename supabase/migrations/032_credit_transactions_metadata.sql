-- Optional metadata for credit_transactions (e.g. pool_total for REFUND "source of funds" tooltip)
ALTER TABLE credit_transactions
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

COMMENT ON COLUMN credit_transactions.metadata IS 'Optional: e.g. { "pool_total": 93.80 } for REFUND tooltip.';
