@echo off
REM Run deploy from outside Cursor to avoid Git lock. Double-click this file.
cd /d "c:\Users\segar\OneDrive\Desktop\Wishbeeai-Prod"
powershell -ExecutionPolicy Bypass -File ".\deploy-production.ps1"
pause
