-- One-time fix: kavitha.segar@gmail.com contributed $700 to this gift but it wasn't saved.
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query), then run it.
-- After running, reload the gift page: http://127.0.0.1:3001/gifts/5df825b8-5dec-48ae-abda-b3700af076b3

UPDATE gifts
SET
  current_amount = 700,
  contributors = 1,
  updated_at = NOW()
WHERE id = '5df825b8-5dec-48ae-abda-b3700af076b3';

-- Verify (optional): run this to confirm the row was updated
-- SELECT id, collection_title, current_amount, contributors, updated_at
-- FROM gifts WHERE id = '5df825b8-5dec-48ae-abda-b3700af076b3';
