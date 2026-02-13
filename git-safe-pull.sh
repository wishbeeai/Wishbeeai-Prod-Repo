#!/bin/bash

# ===============================
# Safe Pull Script with Backup
# Project: Wishbeeai-Prod
# ===============================

PROJECT_DIR="/Users/segar/Desktop/Wishbeeai-Prod"
BACKUP_DIR="/Users/segar/Desktop/Wishbeeai-Prod-Backup"
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')

echo "📁 Moving to project directory..."
cd "$PROJECT_DIR" || { echo "❌ Project directory not found"; exit 1; }

echo "📦 Creating backup..."
mkdir -p "$BACKUP_DIR"
cp -R "$PROJECT_DIR" "$BACKUP_DIR/Wishbeeai-Prod_$TIMESTAMP"

if [ $? -ne 0 ]; then
  echo "❌ Backup failed. Aborting pull."
  exit 1
fi

echo "✅ Backup created at:"
echo "$BACKUP_DIR/Wishbeeai-Prod_$TIMESTAMP"

echo "🔄 Pulling latest code from origin/main..."
git pull origin main

if [ $? -ne 0 ]; then
  echo "❌ Git pull failed. Your backup is safe."
  exit 1
fi

echo "✅ Pull successful!"

echo "🧾 Latest commits:"
git log -5 --oneline

echo "🎉 Done! Code is up-to-date and backup is safe."

