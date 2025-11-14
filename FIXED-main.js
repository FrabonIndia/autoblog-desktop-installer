const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../build/icon.png'),
    title: 'AutoBlog Pro',
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools to see errors
  mainWindow.webContents.openDevTools();

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadURL('http://localhost:3001');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function startServer() {
  if (isDev) {
    console.log('Development mode: Server should be running separately');
    return;
  }

  try {
    const { spawn } = require('child_process');
    const fs = require('fs');
    
    // In production, files are in the app.asar or resources directory
    // Use app.getAppPath() to get the correct base path
    const appPath = app.getAppPath();
    const resourcesPath = process.resourcesPath;
    
    // Try multiple possible locations for server.js
    const possiblePaths = [
      path.join(appPath, 'dist-electron', 'server.js'),
      path.join(resourcesPath, 'app.asar', 'dist-electron', 'server.js'),
      path.join(resourcesPath, 'dist-electron', 'server.js'),
    ];
    
    console.log('=== AUTOBLOG PRO DEBUG ===');
    console.log('appPath:', appPath);
    console.log('resourcesPath:', resourcesPath);
    console.log('__dirname:', __dirname);
    
    let serverPath = null;
    for (const testPath of possiblePaths) {
      console.log('Testing path:', testPath);
      if (fs.existsSync(testPath)) {
        serverPath = testPath;
        console.log('✅ Found server at:', serverPath);
        break;
      }
    }
    
    if (!serverPath) {
      console.error('❌ Could not find server.js in any expected location');
      console.log('Listing files in appPath:', fs.readdirSync(appPath));
      return;
    }
    
    serverProcess = spawn(process.execPath, [serverPath], {
      stdio: 'inherit',
      env: { 
        ...process.env, 
        NODE_ENV: 'production', 
        PORT: '3001',
        ELECTRON_RUN_AS_NODE: '1'
      }
    });

    console.log('✅ Server process started');

    serverProcess.on('error', (err) => {
      console.error('❌ Server error:', err);
    });

    serverProcess.on('exit', (code) => {
      console.log('Server exited with code:', code);
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 3000));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
  }
}

app.whenReady().then(async () => {
  await startServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
