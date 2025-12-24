# Wishbee-AI Setup Checklist

Follow these steps to complete your security and payment integration setup.

## ✅ Quick Setup Steps

### 1. Install Dependencies

```bash
# Install tsx for running TypeScript scripts
npm install -D tsx

# Verify installation
npm run verify:setup
```

### 2. Environment Variables Setup

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Add your keys to `.env.local`:
   - **Supabase Service Role Key**: 
     - Go to: Supabase Dashboard → Project Settings → API
     - Copy the `service_role` key (NOT the anon key)
     - Add: `SUPABASE_SERVICE_ROLE_KEY=your_key_here`
   
   - **Stripe Keys**:
     - Go to: Stripe Dashboard → Developers → API keys
     - Add: `STRIPE_SECRET_KEY=sk_test_...`
     - Add: `STRIPE_PUBLISHABLE_KEY=pk_test_...` (optional for frontend)
   
   - **Stripe Webhook Secret**:
     - First, set up the webhook endpoint in Stripe (see step 4)
     - Then copy the signing secret
     - Add: `STRIPE_WEBHOOK_SECRET=whsec_...`

### 3. Run Security Check

```bash
# Verify service role key is not exposed in client files
npm run check:security
```

### 4. Apply Database Migration

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open `supabase/migrations/001_contributions_security.sql`
3. Copy the entire SQL file
4. Paste into SQL Editor
5. Click **Run**
6. Verify tables, constraints, and triggers are created

**What this migration does:**
- ✅ Creates `contributions` table with check constraint (prevents negative amounts)
- ✅ Enables Row Level Security (RLS)
- ✅ Creates RLS policies for invite-only wishlists
- ✅ Creates database trigger to auto-update wishlist totals
- ✅ Adds performance indexes

### 5. Set Up Stripe Webhook

#### For Local Development:

1. Install Stripe CLI:
   ```bash
   brew install stripe/stripe-cli/stripe
   # or download from: https://stripe.com/docs/stripe-cli
   ```

2. Login to Stripe:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. Copy the webhook secret (starts with `whsec_`) and add to `.env.local`

5. In another terminal, trigger test events:
   ```bash
   stripe trigger payment_intent.succeeded
   ```

#### For Production:

1. Deploy your app to production
2. In Stripe Dashboard → **Developers** → **Webhooks**
3. Click **Add endpoint**
4. Endpoint URL: `https://your-domain.com/api/webhooks/stripe`
5. Select events to listen to:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `payment_intent.canceled`
6. Copy the **Signing secret** and add to production environment variables

### 6. Verify Everything Works

```bash
# Run the verification script
npm run verify:setup
```

This will check:
- ✅ All environment variables are set
- ✅ All required files exist
- ✅ Dependencies are installed
- ✅ Security checks pass

## 🧪 Testing

### Test Database Constraints

Run in Supabase SQL Editor:
```sql
-- This should FAIL (negative amount not allowed)
INSERT INTO contributions (user_id, wishlist_id, amount, status)
VALUES ('user-id', 'wishlist-id', -100, 'pending');
```

### Test Stripe Webhook (Local)

1. Start your dev server: `npm run dev`
2. In another terminal: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3. Trigger a test event: `stripe trigger payment_intent.succeeded`
4. Check your server logs for webhook processing

### Test Payment Flow

1. Create a test contribution via your app
2. Use Stripe test card: `4242 4242 4242 4242`
3. Verify webhook is received and database is updated

## 📋 Pre-Production Checklist

Before deploying to production:

- [ ] All environment variables set in production
- [ ] Database migration applied
- [ ] RLS policies active
- [ ] Security check passes: `npm run check:security`
- [ ] Stripe webhook configured in production
- [ ] Test payment flow works end-to-end
- [ ] Error handling tested
- [ ] Logging configured

## 🆘 Troubleshooting

### "SUPABASE_SERVICE_ROLE_KEY not configured"
- Make sure you added it to `.env.local`
- Restart your dev server after adding env vars
- Verify the key starts with `eyJ...`

### "Webhook signature verification failed"
- Make sure `STRIPE_WEBHOOK_SECRET` is correct
- For local dev, use the secret from `stripe listen` output
- For production, use the secret from Stripe Dashboard

### "Cannot find module 'tsx'"
- Run: `npm install -D tsx`
- Or use: `npx tsx scripts/verify-setup.ts`

### Database migration fails
- Check if tables already exist (may need to drop and recreate)
- Verify you have admin access to Supabase
- Check SQL syntax errors in the migration file

## 📚 Additional Resources

- [SECURITY_SETUP.md](./SECURITY_SETUP.md) - Detailed security documentation
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

