# Quick Fix: Create Admin Account in Supabase Dashboard

Since email verification/reset isn't working, create the account directly in Supabase Dashboard.

## Steps:

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Users**
   - Click on **Authentication** in the left sidebar
   - Click on **Users**

3. **Create New User**
   - Click the **"Add user"** or **"Create user"** button (usually in the top right)
   - Fill in the form:
     - **Email**: `wishbeeai@gmail.com`
     - **Password**: Choose a strong password (at least 8 characters - remember this!)
     - Check **"Auto Confirm User"** or ensure the email is marked as confirmed
   - Click **"Create user"**

4. **Verify Settings**
   - Go to **Authentication** → **Settings**
   - Under **Email Auth**, make sure **"Confirm email"** is toggled OFF
   - Save if you made any changes

5. **Login to Your Site**
   - Go back to your website
   - Click "Sign In"
   - Enter:
     - Email: `wishbeeai@gmail.com`
     - Password: (the password you set in step 3)
   - You should now be able to log in!

6. **Access Admin Page**
   - Once logged in, navigate to: `/admin/affiliate-products`
   - You should now have access!

---

## If you still can't log in:

- Double-check the password is correct (case-sensitive)
- Make sure email confirmation is disabled
- Try clearing your browser cookies and trying again
- Check Supabase Dashboard → Authentication → Users to see if the user was created successfully



