# Wishbee.ai Production Deployment Script
# Run this from PowerShell OUTSIDE Cursor (e.g. Windows Terminal) to avoid Git lock conflicts.
# Tip: Close Cursor's Source Control panel first, or run from File Explorer by double-clicking deploy-production.bat

Write-Host "Starting production deployment..." -ForegroundColor Cyan

# Navigate to project directory
$projectPath = "c:\Users\segar\OneDrive\Desktop\Wishbeeai-Prod"
Set-Location $projectPath

# Remove Git lock if it exists
if (Test-Path ".git\index.lock") {
    Write-Host "Removing Git lock file..." -ForegroundColor Yellow
    Remove-Item ".git\index.lock" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

# Stage deployment files (app, components, lib, config, migrations)
Write-Host "Staging deployment files..." -ForegroundColor Cyan
git add app/
git add components/
git add lib/
git add hooks/
git add types/
git add middleware.ts
git add next.config.mjs
git add package.json
git add package-lock.json
git add scripts/
git add deploy-production.ps1
git add deploy-production.bat
git add supabase/migrations/
# Ignore errors from optional paths; check if we have anything staged
git diff --cached --quiet 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "No changes to commit (working tree clean or nothing staged). Run: git status" -ForegroundColor Yellow
    exit 0
}

# Check what's staged
Write-Host ""
Write-Host "Staged files:" -ForegroundColor Cyan
git status --short | Where-Object { $_ -match '^[AM]' }

# Ensure Git identity is set (required for commit)
$gitEmail = git config --get user.email
$gitName = git config --get user.name
if (-not $gitEmail -or -not $gitName) {
    Write-Host "Setting Git user for this repo (edit deploy-production.ps1 to use your email/name)..." -ForegroundColor Yellow
    if (-not $gitEmail) { git config user.email "deploy@wishbee.ai" }
    if (-not $gitName) { git config user.name "Wishbee Deploy" }
}

# Commit
Write-Host ""
Write-Host "Committing changes..." -ForegroundColor Cyan
$commitMessage = "Deploy: latest to production (remind emails, specs, extract-product, gifts)"
git commit -m $commitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to commit. Please check Git status." -ForegroundColor Red
    exit 1
}

# Push to production
Write-Host ""
Write-Host "Pushing to production (origin/main)..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Deployment successful! Changes pushed to production." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Check your deployment platform (Vercel/Netlify/etc.) for build status" -ForegroundColor White
    Write-Host "   2. Monitor logs for any deployment errors" -ForegroundColor White
    Write-Host "   3. Test the production site after deployment completes" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "Failed to push to production. Check your Git remote and network connection." -ForegroundColor Red
    exit 1
}
