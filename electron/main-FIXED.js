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

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL('http://localhost:3001');
    // Keep DevTools open to debug
    mainWindow.webContents.openDevTools();
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
    
    // In production, files unpacked from .asar are in .asar.unpacked directory
    const appPath = app.getAppPath();
    const resourcesPath = process.resourcesPath;
    
    // When using asarUnpack, files are extracted to app.asar.unpacked
    let serverPath = null;
    const possiblePaths = [
      // Unpacked location (this is where it should be with asarUnpack)
      path.join(appPath + '.unpacked', 'dist-electron', 'server.js'),
      path.join(resourcesPath, 'app.asar.unpacked', 'dist-electron', 'server.js'),
      // Fallback locations
      path.join(appPath, 'dist-electron', 'server.js'),
      path.join(resourcesPath, 'dist-electron', 'server.js'),
    ];
    
    console.log('=== AUTOBLOG PRO SERVER STARTUP ===');
    console.log('appPath:', appPath);
    console.log('resourcesPath:', resourcesPath);
    
    for (const testPath of possiblePaths) {
      console.log('Testing:', testPath);
      if (fs.existsSync(testPath)) {
        serverPath = testPath;
        console.log('✅ Found server at:', serverPath);
        break;
      }
    }
    
    if (!serverPath) {
      console.error('❌ Could not find server.js!');
      console.log('Files in appPath:', fs.existsSync(appPath) ? fs.readdirSync(appPath).join(', ') : 'N/A');
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

    console.log('✅ Server process started with PID:', serverProcess.pid);

    serverProcess.on('error', (err) => {
      console.error('❌ Server process error:', err);
    });

    serverProcess.on('exit', (code, signal) => {
      console.log(`Server process exited: code=${code}, signal=${signal}`);
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('✅ Waiting complete, loading UI...');
  } catch (error) {
    console.error('❌ Failed to start server:', error);
  }
}

app.whenReady().then(async () => {
  console.log('Electron app ready, starting server...');
  await startServer();
  console.log('Creating window...');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    console.log('Killing server process...');
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    console.log('Killing server process before quit...');
    serverProcess.kill();
  }
});
