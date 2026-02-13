# Fix Tailwind CSS Build Error

## Error
```
Can't resolve 'tailwindcss' in 'C:\Users\segar\OneDrive\Desktop'
```

## Solution: Reinstall Dependencies

The `node_modules` folder is likely corrupted (common with OneDrive). You need to reinstall dependencies.

### Step 1: Delete node_modules and package-lock.json

**Option A: Using File Explorer**
1. Go to: `C:\Users\segar\OneDrive\Desktop\Wishbeeai-Prod`
2. Delete the `node_modules` folder (if it exists)
3. Delete `package-lock.json` (if it exists)

**Option B: Using Command Prompt**
```cmd
cd "C:\Users\segar\OneDrive\Desktop\Wishbeeai-Prod"
rmdir /s /q node_modules
del package-lock.json
```

### Step 2: Reinstall Dependencies

Open **Windows Terminal** or **Command Prompt** (NOT Cursor's terminal):

```cmd
cd "C:\Users\segar\OneDrive\Desktop\Wishbeeai-Prod"
npm install
```

Wait for installation to complete (this may take a few minutes).

### Step 3: Restart Dev Server

After installation completes:

```cmd
npm run dev
```

## If npm install fails

If you get errors during `npm install`, try:

1. **Clear npm cache:**
   ```cmd
   npm cache clean --force
   ```

2. **Then reinstall:**
   ```cmd
   npm install
   ```

## Alternative: Move Project Out of OneDrive

If OneDrive continues to cause issues:

1. **Move project to a non-synced folder:**
   - Copy entire project to: `C:\dev\Wishbeeai-Prod`
   - Then run `npm install` and `npm run dev` from there

2. **Or pause OneDrive sync temporarily:**
   - Right-click OneDrive icon in system tray
   - Pause syncing
   - Run `npm install`
   - Resume syncing after

## Verify Installation

After reinstalling, check that Tailwind is installed:

```cmd
npm list tailwindcss
```

You should see: `tailwindcss@4.1.9`
