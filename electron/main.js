const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let serverProcess;
let logFile = null;

// Setup logging to file
function setupLogging() {
  const logPath = path.join(app.getPath('userData'), 'autoblog-debug.log');
  logFile = fs.createWriteStream(logPath, { flags: 'w' });
  
  const originalLog = console.log;
  const originalError = console.error;
  
  console.log = function(...args) {
    const msg = args.join(' ');
    logFile.write(`[LOG] ${msg}\n`);
    originalLog.apply(console, args);
  };
  
  console.error = function(...args) {
    const msg = args.join(' ');
    logFile.write(`[ERROR] ${msg}\n`);
    originalError.apply(console, args);
  };
  
  console.log('=== LOG FILE LOCATION ===');
  console.log(logPath);
  console.log('=========================');
}

function sendLog(message) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('startup-log', message);
  }
  console.log(message);
}

function sendStatus(status) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('startup-status', status);
  }
  console.log('STATUS:', status);
}

function sendError(error) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('startup-error', error);
  }
  console.error('ERROR:', error);
}

function sendSuccess() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('startup-success');
  }
  console.log('SUCCESS: Server ready!');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
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
    console.log('Loading development URL: http://localhost:3000');
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // Load loading screen first
    const loadingPath = `file://${path.join(__dirname, 'loading.html')}`;
    console.log('Loading startup screen:', loadingPath);
    mainWindow.loadFile(path.join(__dirname, 'loading.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function startServer() {
  if (isDev) {
    sendLog('Development mode: Server should be running separately');
    return;
  }

  try {
    const { spawn } = require('child_process');
    const fs = require('fs');
    const http = require('http');
    
    sendStatus('Starting local application...');
    sendLog('Initializing AutoBlog Pro on your computer...');
    
    let serverPath = null;
    
    if (app.isPackaged) {
      // In packaged app, asarUnpack files go to resources/app.asar.unpacked
      const unpackedPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'dist-electron', 'server.js');
      sendLog('Packaged app detected');
      sendLog('Resources path: ' + process.resourcesPath);
      sendLog('Looking for server at: ' + unpackedPath);
      
      if (fs.existsSync(unpackedPath)) {
        serverPath = unpackedPath;
        sendLog('✅ Found server.js!');
      } else {
        const errorMsg = 'Server file not found at: ' + unpackedPath;
        sendLog('❌ ' + errorMsg);
        sendError(errorMsg);
        return;
      }
    } else {
      // Development mode
      serverPath = path.join(__dirname, '../dist-electron/server.js');
      sendLog('Non-packaged mode - using: ' + serverPath);
    }
    
    sendStatus('Loading components...');
    sendLog('Starting application engine...');
    
    serverProcess = spawn(process.execPath, [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { 
        ...process.env, 
        NODE_ENV: 'production', 
        PORT: '3001',
        ELECTRON_RUN_AS_NODE: '1',
        USER_DATA_PATH: app.getPath('userData')
      }
    });

    sendLog('✅ Server process started (PID: ' + serverProcess.pid + ')');

    // Capture server output
    serverProcess.stdout.on('data', (data) => {
      const msg = data.toString().trim();
      sendLog('[Server] ' + msg);
    });

    serverProcess.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      sendLog('[Server Error] ' + msg);
    });

    serverProcess.on('error', (err) => {
      sendLog('❌ Server process error: ' + err.message);
      sendError('Failed to start server process: ' + err.message);
    });

    serverProcess.on('exit', (code, signal) => {
      const msg = 'Server exited: code=' + code + ', signal=' + signal;
      sendLog(msg);
      if (code !== 0 && code !== null) {
        sendError('Server crashed with code ' + code);
      }
    });

    // Wait for server to become available
    sendStatus('Preparing your workspace...');
    sendLog('Checking http://localhost:3001...');
    
    const maxAttempts = 30; // 30 seconds
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        await new Promise((resolve, reject) => {
          const req = http.get('http://localhost:3001', (res) => {
            sendLog('Server responded with status: ' + res.statusCode);
            resolve();
          });
          req.on('error', reject);
          req.setTimeout(1000);
        });
        
        sendLog('✅ Server is responding!');
        sendSuccess();
        return;
      } catch (err) {
        sendLog('Attempt ' + (i + 1) + '/' + maxAttempts + ': Server not ready yet...');
      }
    }
    
    sendError('Server did not respond after 30 seconds. Check logs above for details.');
  } catch (error) {
    sendLog('❌ Failed to start server: ' + error.message);
    sendError('Failed to start server: ' + error.message);
  }
}

app.whenReady().then(async () => {
  setupLogging();
  console.log('=== AUTOBLOG PRO STARTING ===');
  console.log('Packaged:', app.isPackaged);
  console.log('User Data Path:', app.getPath('userData'));
  
  // Create window first so it can receive log messages
  createWindow();
  
  // Wait a moment for window to fully load
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Now start server (window is ready to receive logs)
  await startServer();

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
  if (logFile) {
    logFile.end();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (logFile) {
    logFile.end();
  }
});
