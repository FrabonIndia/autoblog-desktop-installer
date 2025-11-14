# Building Desktop Installers

This guide explains how to build the Windows (.exe) and macOS (.dmg) installers for AutoBlog Pro.

## Prerequisites

### For Windows Installer (.exe):
- **Windows machine** OR Linux with Wine
- Node.js 18+ installed
- All dependencies: `npm install`

### For macOS Installer (.dmg):
- **macOS machine** (required - cannot cross-compile)
- Node.js 18+ installed
- Xcode Command Line Tools
- All dependencies: `npm install`

---

## Build Process

### Step 1: Install Dependencies
```bash
cd customer-software
npm install
```

### Step 2: Build the App
```bash
npm run build:electron
```

This command does:
1. Builds React frontend with Vite (→ `dist-electron/`)
2. Bundles Express server with esbuild (→ `dist-electron/server.js`)
3. Copies necessary files
4. Runs electron-builder to create installers

### Step 3: Find Your Installers

After successful build, installers will be in:
```
customer-software/release/
├── AutoBlog Pro Setup 1.0.0.exe    (Windows - ~150MB)
└── AutoBlog Pro-1.0.0.dmg          (macOS - ~180MB)
```

---

## Platform-Specific Instructions

### 🪟 **Building on Windows**

```bash
# Install dependencies
npm install

# Build Windows installer
npm run build:electron

# Output: customer-software/release/AutoBlog Pro Setup 1.0.0.exe
```

**Testing the installer:**
1. Double-click the .exe file
2. Follow installation wizard
3. Launch from desktop shortcut
4. Test full application workflow

### 🍎 **Building on macOS**

```bash
# Install dependencies
npm install

# Build macOS installer
npm run build:electron

# Output: customer-software/release/AutoBlog Pro-1.0.0.dmg
```

**Testing the installer:**
1. Open the .dmg file
2. Drag app to Applications folder
3. Launch from Applications
4. Test full application workflow

### 🐧 **Building on Linux (for Windows)**

You can build Windows installers on Linux using Wine:

```bash
# Install Wine (Ubuntu/Debian)
sudo dpkg --add-architecture i386
sudo apt update
sudo apt install wine wine32 wine64

# Build
npm install
npm run build:electron
```

**Note:** macOS .dmg files **cannot** be built on Linux.

---

## Continuous Integration (CI/CD)

### Using GitHub Actions

Create `.github/workflows/build-installers.yml`:

```yaml
name: Build Installers

on:
  push:
    tags:
      - 'v*'

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: cd customer-software && npm install
      - run: cd customer-software && npm run build:electron
      - uses: actions/upload-artifact@v3
        with:
          name: windows-installer
          path: customer-software/release/*.exe

  build-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: cd customer-software && npm install
      - run: cd customer-software && npm run build:electron
      - uses: actions/upload-artifact@v3
        with:
          name: macos-installer
          path: customer-software/release/*.dmg
```

---

## Deploying to Sales Platform

After building installers:

1. **Upload to sales platform:**
   ```bash
   # Copy installers to the main project's installers directory
   mkdir -p ../installers
   cp release/*.exe ../installers/
   cp release/*.dmg ../installers/
   ```

2. **The sales platform will automatically serve:**
   - `GET /api/download/:purchaseId/windows` → .exe file
   - `GET /api/download/:purchaseId/mac` → .dmg file
   - `GET /api/download/:purchaseId` → Detects OS and serves correct file

3. **Email contains both download links**

---

## Troubleshooting

### Build fails with "Cannot find module"
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build:electron
```

### Windows installer not signed
- Add code signing certificate to `package.json`:
  ```json
  "build": {
    "win": {
      "certificateFile": "path/to/cert.pfx",
      "certificatePassword": "password"
    }
  }
  ```

### macOS app not notarized
- For distribution outside App Store, notarize with:
  ```bash
  xcrun notarytool submit "AutoBlog Pro.dmg" \
    --apple-id "your-apple-id" \
    --password "app-specific-password" \
    --team-id "TEAM_ID"
  ```

### Large installer size
- Current size: ~150-200MB (includes Node.js, Chromium, SQLite)
- This is normal for Electron apps
- Consider compression for faster downloads

---

## Version Updates

To release a new version:

1. Update version in `customer-software/package.json`
2. Rebuild installers: `npm run build:electron`
3. Upload new installers to server
4. Update download links in sales platform

---

## Security Notes

- ✅ Installers are code-signed (when configured)
- ✅ Customer data stays local (SQLite in app data)
- ✅ No server-side data collection
- ✅ OpenAI API key stored locally only
