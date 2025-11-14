#!/bin/bash
# AutoBlog Pro - Push to GitHub Script

echo "========================================="
echo "AutoBlog Pro - GitHub Setup"
echo "========================================="
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
  echo "Initializing git repository..."
  git init
  git branch -M main
fi

echo ""
echo "Before we continue, please create a GitHub repository:"
echo "1. Go to: https://github.com/new"
echo "2. Repository name: autoblog-pro-desktop"
echo "3. Set to PRIVATE (important!)"
echo "4. Click 'Create repository'"
echo ""
read -p "Have you created the repository? (y/n): " created

if [ "$created" != "y" ]; then
  echo "Please create the repository first, then run this script again."
  exit 1
fi

echo ""
read -p "Enter your GitHub username: " username
echo ""

# Set remote
REPO_URL="https://github.com/$username/autoblog-pro-desktop.git"
echo "Setting remote to: $REPO_URL"

# Remove old remote if exists
git remote remove origin 2>/dev/null

git remote add origin "$REPO_URL"

echo ""
echo "Adding files to git..."
git add .

echo ""
echo "Creating commit..."
git commit -m "Initial commit - AutoBlog Pro Desktop App"

echo ""
echo "Pushing to GitHub..."
git push -u origin main

echo ""
echo "========================================="
echo "✅ SUCCESS! Code pushed to GitHub!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Go to: https://github.com/$username/autoblog-pro-desktop/actions"
echo "2. Watch the build process (takes ~5-10 minutes)"
echo "3. Download your installers from the 'Artifacts' section"
echo ""
echo "Your Windows .exe will be ready to distribute!"
echo "========================================="
