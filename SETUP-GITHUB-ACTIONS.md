# Setting Up Automated Installer Builds with GitHub Actions

This guide will help you set up automated Windows and macOS installer builds using GitHub Actions.

## Prerequisites

1. A GitHub account
2. Git installed on your computer

## Step-by-Step Setup

### 1. Create a GitHub Repository

1. Go to https://github.com
2. Click "New repository" (green button)
3. Name it: `autoblog-pro-customer-software`
4. Make it **Private** (to protect your code)
5. Click "Create repository"

### 2. Push Your Code to GitHub

Open your terminal/PowerShell in the `customer-software` folder and run:

```bash
git init
git add .
git commit -m "Initial commit with GitHub Actions"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/autoblog-pro-customer-software.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your actual GitHub username.

### 3. GitHub Actions Will Run Automatically

Once you push, GitHub Actions will automatically:
- Build Windows installer (.exe) on a Windows server
- Build macOS installer (.dmg) on a Mac server
- Both builds happen in parallel (faster!)

### 4. Download Your Installers

1. Go to your GitHub repository page
2. Click the "Actions" tab at the top
3. Click on the latest workflow run (should show green checkmark when done)
4. Scroll down to "Artifacts" section
5. Download both:
   - `windows-installer` (contains .exe file)
   - `macos-installer` (contains .dmg file)

### 5. Extract and Use

- Unzip the downloaded files
- You'll get:
  - `AutoBlog Pro Setup 1.0.0.exe` for Windows
  - `AutoBlog Pro-1.0.0.dmg` for Mac

These are your **production-ready installers** to give to customers!

## Every Time You Update the Software

Just push to GitHub:

```bash
git add .
git commit -m "Updated features"
git push
```

GitHub Actions will automatically build fresh installers for you!

## Troubleshooting

**Build failed?**
- Check the "Actions" tab for error messages
- Make sure `package.json` has the correct version number
- Ensure all dependencies are listed

**Need to trigger a build manually?**
1. Go to "Actions" tab
2. Click "Build Installers" workflow
3. Click "Run workflow" button
4. Select "main" branch
5. Click green "Run workflow" button

## Cost

GitHub Actions is **100% FREE** for:
- 2,000 minutes/month for private repos
- Unlimited for public repos

Each build takes ~5-10 minutes, so you get plenty of builds per month!
