#!/bin/bash

# Pull latest changes
echo "🔄 Pulling latest changes from origin/main..."
git pull origin main

# Stage all changes
echo "📝 Staging all changes..."
git add .

# Commit with timestamp
COMMIT_MESSAGE="Snapshot update $(date '+%Y-%m-%d %H:%M:%S')"
git commit -m "$COMMIT_MESSAGE" --allow-empty

# Push to main
echo "🚀 Pushing to origin/main..."
git push origin main

echo "✅ Snapshot committed and pushed: $COMMIT_MESSAGE"

