# How to Build AutoBlog Pro Installers

This guide shows you how to create the Windows .exe and Mac .dmg installers that give customers a one-click installation experience.

## Overview

You need to build installers on **two different machines**:
- **Windows PC** → Creates `AutoBlog Pro Setup 1.0.0.exe` (Windows installer)
- **Mac computer** → Creates `AutoBlog Pro-1.0.0.dmg` (Mac installer)

Once built, customers get a true plug-and-play experience: download → double-click → install → start using.

---

## Part 1: Build Windows Installer (.exe)

### Requirements:
- Windows 10 or Windows 11 PC
- Node.js installed (download from nodejs.org)
- Internet connection

### Steps:

**1. Download the Project**
```bash
# Download the entire AutoBlog Pro project to your Windows PC
# You can use git clone or download ZIP from your repository
```

**2. Open Command Prompt or PowerShell**
```bash
# Navigate to the customer-software folder
cd path\to\AutoBlog-Pro\customer-software
```

**3. Install Dependencies**
```bash
npm install
```
This will take 2-5 minutes. It downloads all required packages.

**4. Build the Windows Installer**
```bash
npm run build:electron
```

This process:
- Builds the React frontend (1-2 minutes)
- Bundles the Express backend
- Packages everything with Electron
- Creates the Windows installer
- **Total time: 5-10 minutes**

**5. Find Your Installer**

The installer will be created at:
```
customer-software/release/AutoBlog Pro Setup 1.0.0.exe
```

**Size:** Approximately 150-200 MB

**6. Test the Installer (Important!)**

Before giving to customers, test it:
1. Double-click `AutoBlog Pro Setup 1.0.0.exe`
2. You should see the installation wizard with:
   - Welcome screen
   - License agreement (click "I Agree")
   - Installation location selector
   - Desktop shortcut option (should be checked)
3. Click "Install"
4. Wait for installation to complete
5. A desktop shortcut should appear
6. Launch AutoBlog Pro from the shortcut
7. Complete first-time setup

**If it works perfectly:** You're done with Windows! ✅

---

## Part 2: Build Mac Installer (.dmg)

### Requirements:
- macOS computer (macOS 10.13 or later)
- Node.js installed (download from nodejs.org)
- Internet connection
- Xcode Command Line Tools (will be prompted if needed)

### Steps:

**1. Download the Project**
```bash
# Download the entire AutoBlog Pro project to your Mac
# You can use git clone or download ZIP from your repository
```

**2. Open Terminal**
```bash
# Navigate to the customer-software folder
cd ~/path/to/AutoBlog-Pro/customer-software
```

**3. Install Dependencies**
```bash
npm install
```
This will take 2-5 minutes. It downloads all required packages.

**4. Build the Mac Installer**
```bash
npm run build:electron
```

This process:
- Builds the React frontend (1-2 minutes)
- Bundles the Express backend
- Packages everything with Electron
- Creates the macOS .dmg file
- **Total time: 5-10 minutes**

**5. Find Your Installer**

The installer will be created at:
```
customer-software/release/AutoBlog Pro-1.0.0.dmg
```

**Size:** Approximately 150-200 MB

**6. Test the Installer (Important!)**

Before giving to customers, test it:
1. Double-click `AutoBlog Pro-1.0.0.dmg`
2. A window opens showing AutoBlog Pro icon
3. Drag the app to the Applications folder
4. Open Applications folder
5. Double-click AutoBlog Pro
6. macOS might ask for permission (click "Open")
7. Complete first-time setup

**If it works perfectly:** You're done with Mac! ✅

---

## Part 3: Deploy to Your Sales Platform

Once you have BOTH installers (or even just one):

**1. Locate the Installers Folder**

In your sales platform project root, there's an `installers/` folder.

**2. Copy the Installer Files**

Copy these files:
```
FROM: customer-software/release/AutoBlog Pro Setup 1.0.0.exe
TO:   installers/AutoBlog Pro Setup 1.0.0.exe

FROM: customer-software/release/AutoBlog Pro-1.0.0.dmg
TO:   installers/AutoBlog Pro-1.0.0.dmg
```

**3. Verify Files Are in Place**

Your `installers/` folder should now contain:
```
installers/
├── AutoBlog Pro Setup 1.0.0.exe    (Windows installer)
├── AutoBlog Pro-1.0.0.dmg          (Mac installer)
└── README.md
```

**4. Restart Your Sales Platform**

If your sales platform is running, restart it so it detects the new installers.

**5. Test the Download System**

Visit your demo download link:
```
http://localhost:5000/api/download/demo-test-123
```

You should now see:
- "Download for Windows" button (if .exe exists)
- "Download for Mac" button (if .dmg exists)
- Platform-specific installation instructions

---

## Part 4: What Customers Experience (Final Result)

### Windows Customers:

1. **Receive email** with "Download for Windows" button
2. **Click download** → Gets `AutoBlog Pro Setup 1.0.0.exe`
3. **Double-click .exe** → Installation wizard opens
4. **Click "I Agree"** → Accept license terms
5. **Click "Install"** → Software installs automatically
6. **Desktop shortcut appears** → AutoBlog Pro icon on desktop
7. **Double-click shortcut** → App launches
8. **5-minute setup** → Create username, add OpenAI API key
9. **Start blogging!** → Generate first blog post

**Total time from email to first blog post: ~7 minutes**

### Mac Customers:

1. **Receive email** with "Download for Mac" button
2. **Click download** → Gets `AutoBlog Pro-1.0.0.dmg`
3. **Double-click .dmg** → Disk image opens
4. **Drag to Applications** → Copy app to Applications folder
5. **Launch from Applications** → App opens
6. **5-minute setup** → Create username, add OpenAI API key
7. **Start blogging!** → Generate first blog post

**Total time from email to first blog post: ~7 minutes**

---

## Troubleshooting

### Windows Build Issues:

**Error: "node-gyp" errors**
```bash
npm install --global windows-build-tools
```

**Error: "EACCES permission denied"**
- Run Command Prompt as Administrator
- Try again

### Mac Build Issues:

**Error: "Xcode Command Line Tools required"**
```bash
xcode-select --install
```

**Error: "Code signing failed"**
- For testing: This is okay, installer still works
- For distribution: You need an Apple Developer account ($99/year)

**Error: "Cannot verify developer"**
- Users can right-click → Open to bypass
- Or get Apple Developer certificate for production

---

## File Sizes & Distribution

**Installer Sizes:**
- Windows .exe: ~150-200 MB
- Mac .dmg: ~150-200 MB

**Why so large?**
- Includes entire Node.js runtime
- Includes all npm dependencies
- Includes SQLite database engine
- No internet connection needed after download

**Delivery:**
- Email with download links (current system)
- CDN hosting (for faster downloads)
- Direct download from website

---

## Updating the Software

When you release version 1.1.0:

1. Update version in `customer-software/package.json`
2. Rebuild both installers (repeat Parts 1 & 2)
3. Copy new installers to `installers/` folder
4. Customers with v1.0.0 continue working
5. New customers get v1.1.0 automatically

**Future:** Add auto-update feature to notify users of new versions

---

## Security & Code Signing

### Windows Code Signing:
- **Without:** Windows shows "Unknown publisher" warning (users can still install)
- **With:** Professional appearance, no warnings
- **Cost:** ~$100-400/year for certificate
- **Provider:** DigiCert, Sectigo, etc.

### Mac Code Signing:
- **Without:** macOS shows "Cannot verify developer" (users can right-click → Open)
- **With:** Smooth installation, no warnings
- **Cost:** $99/year Apple Developer Program
- **Required for:** Mac App Store distribution

**For now:** Installers work fine without signing for testing and initial sales. Add code signing later for professional polish.

---

## Next Steps

1. ✅ Build Windows installer (Part 1)
2. ✅ Build Mac installer (Part 2)
3. ✅ Test both installers thoroughly
4. ✅ Copy to `installers/` folder (Part 3)
5. ✅ Test download system
6. ✅ Make your first sale!
7. 🎉 Customer downloads → installs → starts blogging in 7 minutes!

---

## Support

If you encounter any issues during the build process:
- Check Node.js version: `node --version` (should be 18.x or 20.x)
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check BUILD_INSTALLERS.md for additional technical details

**You're giving customers the absolute best experience possible!** 🚀
