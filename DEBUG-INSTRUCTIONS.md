# 🐛 DEBUG VERSION - Find Out What's Wrong

I've added debugging code that will show us EXACTLY what's happening when the app starts.

## What to Do:

### Step 1: Push These Debug Files to GitHub

Update these 2 files on GitHub (same as before, but now with debug logging):

1. **`customer-software/electron/main.js`** - Has debug logging now
2. **`customer-software/server/index.ts`** - Has debug logging now

### Step 2: Wait for GitHub Actions to Build

- Go to your GitHub repo → Actions tab
- Wait for build to complete (~10 minutes)
- Download the NEW installer from Artifacts

### Step 3: Run the Installer and Check the Console

**On Windows:**

1. Install the new debug version
2. **DON'T double-click the icon!** Instead:
   - Press `Windows Key + R`
   - Type: `cmd`
   - Press Enter
   - In the command window, type:
   ```
   "C:\Program Files\AutoBlog Pro\AutoBlog Pro.exe"
   ```
   - Press Enter

3. **Copy ALL the text from the console window** and send it to me

The console will show debug messages like:
```
=== AUTOBLOG PRO DEBUG INFO ===
__dirname: C:\...
serverPath: C:\...
Server file exists: true/false
Files in dist-electron: [list of files]
=== AUTOBLOG PRO SERVER DEBUG ===
NODE_ENV: production
__dirname: C:\...
Static path: C:\...
Files in static path: [list of files]
index.html exists: true/false
```

### Step 4: Send Me the Output

Copy and paste EVERYTHING from the console window and send it to me. This will tell us:

✅ Where the app is looking for files
✅ What files actually exist
✅ If index.html is found
✅ What's going wrong

---

## This Will Help Us Fix It!

Once I see the debug output, I'll know exactly what's wrong and can fix it permanently.
