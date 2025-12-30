# Admin Account Setup Guide

## Problem
When signing up with `wishbeeai@gmail.com`, Supabase requires email verification before you can log in. If you didn't receive the verification email, you'll get "Invalid credentials" when trying to log in.

## Solutions

### Option 1: Disable Email Confirmation (Easiest for Development)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Settings**
4. Scroll to the **Email Auth** section
5. Toggle OFF **"Confirm email"**
6. Click **Save**
7. Now you can sign up and immediately log in without email verification

⚠️ **Note:** This is fine for development, but keep email confirmation enabled in production for security.

### Option 2: Verify via Email

1. Sign up with `wishbeeai@gmail.com`
2. Check your email inbox (and spam folder) for an email from Supabase
3. Click the verification link in the email
4. Return to the site and log in

### Option 3: Manually Confirm in Supabase Dashboard

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication** → **Users**
3. Find the user with email: `wishbeeai@gmail.com`
4. Click on the user to view details
5. Check if "Email Confirmed" shows as "No"
6. If available, click to manually confirm the email (this may require admin privileges in Supabase)

## After Setup

Once your email is verified or confirmation is disabled:
1. Go to the login page
2. Enter email: `wishbeeai@gmail.com`
3. Enter your password
4. Click "Sign In"
5. You should now be able to access `/admin/affiliate-products`

## Troubleshooting

- **"Invalid credentials"** - Usually means email isn't verified. Try Option 1 or 2 above.
- **No verification email** - Check spam folder, or disable email confirmation (Option 1)
- **Can't find user in dashboard** - Make sure you're looking in the correct Supabase project



