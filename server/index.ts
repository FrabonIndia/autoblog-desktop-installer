import express from "express";
import { registerRoutes } from "./routes";
import path from "path";
import fs from "fs";

// TypeScript doesn't know about __dirname in ESM, but esbuild with format:'cjs' injects it
// Declare it as a global to make TypeScript happy
declare const __dirname: string;

const app = express();
const PORT = process.env.PORT || 3001;

console.log('=== AUTOBLOG PRO SERVER DEBUG ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('__dirname:', __dirname);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
registerRoutes(app);

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  // Detect if running in packaged Electron app (Electron adds resourcesPath property)
  const electronProcess = process as { resourcesPath?: string };
  const isPackaged = process.env.ELECTRON_RUN_AS_NODE || electronProcess.resourcesPath;
  
  let staticPath;
  if (isPackaged && electronProcess.resourcesPath) {
    // In packaged app, static files are in app.asar.unpacked/dist-electron
    staticPath = path.join(electronProcess.resourcesPath, 'app.asar.unpacked', 'dist-electron');
    console.log('Running in PACKAGED mode');
  } else {
    // In development mode or non-packaged build
    staticPath = path.join(__dirname);
    console.log('Running in NON-PACKAGED mode');
  }
  
  console.log('=== STATIC FILE SERVING ===');
  console.log('Static path:', staticPath);
  console.log('Path exists:', fs.existsSync(staticPath));
  
  if (fs.existsSync(staticPath)) {
    const files = fs.readdirSync(staticPath);
    console.log('Files in directory:', files.slice(0, 30));
    console.log('index.html exists:', files.includes('index.html'));
  } else {
    console.error('ERROR: Static path does not exist!');
    console.log('Trying alternative path...');
    
    // Try alternative: maybe files are in app.asar/dist-electron
    const altPath = path.join(__dirname);
    console.log('Alternative path:', altPath);
    if (fs.existsSync(altPath)) {
      staticPath = altPath;
      console.log('Using alternative path');
    }
  }
  console.log('===========================\n');
  
  app.use(express.static(staticPath));
  
  app.get("*", (_req, res) => {
    const indexPath = path.join(staticPath, "index.html");
    const electronProcess = process as { resourcesPath?: string };
    
    if (!fs.existsSync(indexPath)) {
      console.error('ERROR: index.html not found at:', indexPath);
      console.log('Searching for index.html...');
      
      // Try to find index.html recursively
      const tryPaths = [
        path.join(__dirname, 'index.html'),
        path.join(electronProcess.resourcesPath || '', 'app.asar.unpacked', 'dist-electron', 'index.html'),
        path.join(process.cwd(), 'dist-electron', 'index.html'),
      ];
      
      for (const tryPath of tryPaths) {
        console.log('Trying:', tryPath, '- exists:', fs.existsSync(tryPath));
      }
      
      res.status(404).send('<h1>Error: Frontend not found</h1><p>Check logs for details</p>');
      return;
    }
    
    res.sendFile(indexPath);
  });
}

app.listen(PORT, () => {
  console.log(`✅ AutoBlog Pro server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} to get started`);
});
