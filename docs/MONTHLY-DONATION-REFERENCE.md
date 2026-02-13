# Monthly Donation to Charity — Reference Notes

Reference for the pooled charity donation flow, impact emails, and Support Wishbee (tips).

---

## Overview

- **Charity donations**: Leftover balances are pooled per charity and donated monthly. Organizers receive impact emails after the batch is completed.
- **Support Wishbee (tips)**: Tips are **not** pooled. Receipt is sent immediately; no batch processing.

---

## DONATION_CHARITIES (IDs)

| ID | Name |
|----|------|
| `feeding-america` | Feeding America |
| `unicef` | UNICEF |
| `edf` | Environmental Defense Fund |
| `red-cross` | American Red Cross |

Source: `app/gifts/active/page.tsx` (DONATION_CHARITIES), `app/api/gifts/complete-donation-batch/route.ts`

---

## Database: gift_settlements

**Table**: `gift_settlements`  
**Migrations**: 019, 020, 021

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| gift_id | UUID | FK to gifts(id) |
| amount | DECIMAL(12,2) | Settlement amount |
| disposition | TEXT | `'charity'` \| `'tip'` \| `'bonus'` |
| charity_id | TEXT | e.g. `feeding-america` (charity only) |
| charity_name | TEXT | Display name (charity only) |
| dedication | TEXT | e.g. "On behalf of the [Event] group via Wishbee.ai" |
| recipient_name | TEXT | Gift recipient |
| gift_name | TEXT | Event/collection name |
| total_funds_collected | DECIMAL(12,2) | Optional |
| final_gift_price | DECIMAL(12,2) | Optional |
| status | TEXT | `'pending_pool'` \| `'sent_to_charity'` \| `'completed'` |
| batch_id | UUID | Set when batch is completed |
| created_at | TIMESTAMPTZ | |

**Status logic**:
- Charity: default `pending_pool` → `completed` after batch
- Tip: set `completed` on insert (no pooling)

---

## Service: MonthlyDonationService

**File**: `lib/monthly-donation-service.ts`

### selectPendingBatchByCharity(charityId: string)

Returns all `gift_settlements` where:
- `status = 'pending_pool'`
- `disposition = 'charity'`
- `charity_id = charityId`

Ordered by `created_at` ASC.

### completeBatchAndSendImpactEmails(charityId, charityName, collectiveReceiptUrl?)

1. Select pending batch via `selectPendingBatchByCharity`
2. Generate `batch_id` (UUID)
3. Update all records: `status = 'completed'`, `batch_id = batchId`
4. For each record, resolve organizer (via `gifts.user_id` → Supabase Auth) and send impact email
5. Returns: `{ batchId, updated, emailsSent, errors }`

**collectiveReceiptUrl** (optional): Defaults to `${BASE_URL}/receipts/collective/${charityId}/${batchId}`

---

## Impact Email

**File**: `lib/impact-email.ts`

**Subject**: `🐝 Impact Update: Your Wishbee donation to [Charity Name] is complete!`

**Body excerpt**:  
> Hi [Organizer Name], we are excited to share that your leftover balance of **$[Amount]** has been officially donated to **[Charity Name]** as part of our monthly collective gift on behalf of the **[Event Name]** group gift.

**CTA**: Button "View Collective Receipt" → links to collective receipt URL.

**Requires**: `RESEND_API_KEY` in env. Uses `TRANSPARENCY_EMAIL_FROM` or fallback `Wishbee <onboarding@resend.dev>`.

---

## APIs

### POST /api/gifts/[id]/settlement

Creates a settlement record.

**Body** (for charity):
```json
{
  "amount": 12.50,
  "disposition": "charity",
  "charityId": "feeding-america",
  "charityName": "Feeding America",
  "dedication": "On behalf of the Birthday group via Wishbee.ai",
  "recipientName": "Jane",
  "giftName": "Birthday",
  "totalFundsCollected": 150,
  "finalGiftPrice": 137.50
}
```

- Charity: `status` defaults to `pending_pool`
- Tip: `status` set to `completed` on insert

### GET /api/gifts/complete-donation-batch?charityId=feeding-america

Returns pending batch summary:
```json
{
  "success": true,
  "charityId": "feeding-america",
  "pendingCount": 5,
  "totalAmount": 47.23
}
```

### POST /api/gifts/complete-donation-batch

Completes a batch and sends impact emails.

**Body**:
```json
{
  "charityId": "feeding-america",
  "collectiveReceiptUrl": "https://yourdomain.com/receipts/collective/feeding-america/abc-123"
}
```

`collectiveReceiptUrl` is optional; defaults to `${NEXT_PUBLIC_BASE_URL}/receipts/collective/${charityId}/${batchId}`

**Response**:
```json
{
  "success": true,
  "batchId": "uuid",
  "updated": 5,
  "emailsSent": 5,
  "errors": []
}
```

---

## Pages & Routes

| Route | Purpose |
|-------|---------|
| `/gifts/[id]/receipt/[settlementId]` | Individual donation/tip receipt |
| `/receipts/collective/[charityId]/[batchId]` | Collective receipt (batch-level) — stub; can show charity acknowledgment |

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Required for impact emails and transparency emails |
| `TRANSPARENCY_EMAIL_FROM` | From address (e.g. `Wishbee <notifications@wishbee.ai>`) |
| `NEXT_PUBLIC_BASE_URL` | Base URL for collective receipt links (default: `http://localhost:3001`) |

---

## Support Wishbee (Tips) — No Batch

- Disposition: `tip`
- `status`: `completed` on insert
- No pooling; receipt link shown immediately
- Transparency email sent when user clicks "Done" on tip confirmation modal
- Receipt page: `/gifts/[id]/receipt/[settlementId]`

---

## Monthly Batch Workflow (Summary)

1. Organizers choose charity and confirm donation → settlement saved with `status = 'pending_pool'`
2. Admin/external process performs actual donation to charity (manual or via payment API)
3. Admin calls `POST /api/gifts/complete-donation-batch` with `charityId`
4. Service updates records to `completed`, sets `batch_id`, sends impact emails
5. Organizers receive email with "View Collective Receipt" link
