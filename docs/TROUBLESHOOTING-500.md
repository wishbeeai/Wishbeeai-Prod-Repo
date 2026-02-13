# Understanding 500 Internal Server Error

When you see **"Failed to load resource: the server responded with a status of 500"** in the browser:

## 1. Find which request failed

1. Open **Developer Tools** (F12 or right‑click → Inspect).
2. Go to the **Network** tab.
3. Reproduce the error (e.g. load the page or click the button).
4. In the list, find the request that shows **Status: 500** (often in red).
5. Click that request and check:
   - **Request URL** – which API or page returned 500 (e.g. `/api/gifts`, `/api/trending-gifts`, `/api/gifts/collections`).
   - **Response** (or **Preview**) – the body usually includes an `error` and a `details` field with the real error message.

## 2. Common causes and fixes

| URL / action | Possible cause | Fix |
|--------------|----------------|-----|
| **POST /api/gifts** | `gifts` table missing or wrong schema | Run migrations: `supabase db push` or apply `supabase/migrations/008_create_gifts.sql`. |
| **POST /api/gifts** | RLS or auth | Ensure you’re signed in; check Supabase RLS policies on `gifts`. |
| **GET /api/trending-gifts** | `trending_gifts` table missing | Run migration `007_create_trending_gifts.sql`. |
| **GET /api/gifts/collections** | `gifts` table missing | Same as POST /api/gifts – run migration 008. |
| **POST /api/ai/extract-product** | Missing env (e.g. OPENAI_API_KEY) or external API failure | Check `.env.local` and server logs for the `details` message. |

## 3. Server logs

- **Next.js dev:** The terminal where you run `npm run dev` (or `pnpm dev`) prints the same errors and stack traces.
- **Production:** Check your host’s logs (Vercel, etc.); the API now returns a `details` field in the JSON body so the client can show or log the message.

## 4. Response shape

500 responses from our APIs look like:

```json
{
  "error": "Failed to create gift collection",
  "details": "Actual error message from database or code"
}
```

Use the **details** value to see the underlying cause (e.g. missing column, RLS denial, or thrown exception).
