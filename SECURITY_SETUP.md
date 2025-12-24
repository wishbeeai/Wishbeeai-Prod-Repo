# Wishbee-AI Security Setup Guide

## ✅ Implemented Security Features

### 1. Admin Client (`lib/supabase/admin.ts`)
- ✅ Secure server-side Supabase client using service role key
- ✅ Helper functions for payment transactions and contributions
- ✅ User ownership verification functions
- ⚠️ **Never use this in client-side code!**

### 2. Stripe Webhook Handler (`app/api/webhooks/stripe/route.ts`)
- ✅ Secure webhook endpoint that verifies Stripe signatures
- ✅ Processes payment events (succeeded, failed, canceled)
- ✅ Updates database using admin client
- ✅ Records payment transactions securely

### 3. Service Role Key Safety Scanner (`scripts/check-service-role-key-safety.ts`)
- ✅ Scans codebase to ensure service role key is never used in client files
- ✅ Prevents security vulnerabilities

### 4. Database Security (SQL Migrations)
- ✅ Check constraint to prevent negative contributions
- ✅ RLS policies for invite-only wishlists
- ✅ Database trigger for automated wishlist totals

## 🔧 Setup Instructions

### Environment Variables

Add these to your `.env.local` file:

```bash
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Required for secure server-side operations
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# ⚠️ Get this from: Supabase Dashboard → Project Settings → API → service_role key
# ⚠️ NEVER expose this key to the client!

# Stripe (required for payments)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
# ⚠️ Get webhook secret from: Stripe Dashboard → Developers → Webhooks → Your endpoint → Signing secret
```

### Running the Safety Scanner

```bash
# Install tsx if not already installed
npm install -D tsx

# Run the scanner
npx tsx scripts/check-service-role-key-safety.ts
```

Add this to your `package.json` scripts:
```json
{
  "scripts": {
    "check:security": "tsx scripts/check-service-role-key-safety.ts"
  }
}
```

### Applying Database Migrations

1. Connect to your Supabase project
2. Go to SQL Editor
3. Copy the contents of `supabase/migrations/001_contributions_security.sql`
4. Run the migration
5. Verify tables, constraints, and triggers are created

### Setting Up Stripe Webhooks

1. In Stripe Dashboard, go to **Developers → Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
5. Copy the **Signing secret** and add it to `.env.local` as `STRIPE_WEBHOOK_SECRET`

## 🛡️ Security Best Practices

### ✅ DO:
- ✅ Use `lib/supabase/admin.ts` only in API routes (server-side)
- ✅ Always verify Stripe webhook signatures
- ✅ Use RLS policies for user data access
- ✅ Validate all user input
- ✅ Run the safety scanner before deploying

### ❌ DON'T:
- ❌ Never use `SUPABASE_SERVICE_ROLE_KEY` in "use client" files
- ❌ Never expose the service role key to the frontend
- ❌ Never skip webhook signature verification
- ❌ Never trust client-side data without validation

## 📋 Checklist for Production

Before deploying to production, ensure:

- [ ] All environment variables are set in production
- [ ] Stripe webhook endpoint is configured and tested
- [ ] Database migrations have been applied
- [ ] RLS policies are active on all tables
- [ ] Safety scanner passes (`npm run check:security`)
- [ ] All API routes have proper authentication
- [ ] Error messages don't leak sensitive information

## 🔍 Testing

### Test Stripe Webhook Locally

1. Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
4. Copy the webhook secret and add to `.env.local`
5. Trigger test events: `stripe trigger payment_intent.succeeded`

### Test Database Constraints

```sql
-- This should fail (negative amount)
INSERT INTO contributions (user_id, wishlist_id, amount, status)
VALUES ('user-id', 'wishlist-id', -100, 'pending');
```

### Test RLS Policies

- Try accessing contributions from different users
- Verify only authorized users can see wishlist contributions

## 📚 Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

