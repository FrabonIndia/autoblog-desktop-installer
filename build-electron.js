#!/usr/bin/env node

const { build } = require('vite');
const { build: esbuild } = require('esbuild');
const react = require('@vitejs/plugin-react');
const path = require('path');
const fs = require('fs');

async function buildElectron() {
  console.log('Building Electron app...\n');

  // Step 1: Build React frontend for Electron
  console.log('📦 Building React frontend...');
  
  await build({
    root: path.join(__dirname, 'client'),
    base: './',
    mode: 'production',
    plugins: [react.default()],
    resolve: {
      alias: {
        '@': path.join(__dirname, 'client/src'),
        '@shared': path.join(__dirname, 'shared'),
      },
    },
    build: {
      outDir: path.join(__dirname, 'dist-electron'),
      emptyOutDir: true,
      rollupOptions: {
        input: path.join(__dirname, 'client/index.html'),
      },
    },
  });
  console.log('✅ Frontend built\n');

  // Step 2: Build server with esbuild
  console.log('📦 Building Express server...');
  
  // Ensure dist-electron directory exists
  if (!fs.existsSync('dist-electron')) {
    fs.mkdirSync('dist-electron', { recursive: true });
  }

  await esbuild({
    entryPoints: ['server/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    outfile: 'dist-electron/server.js',
    external: ['electron', 'better-sqlite3', 'sql.js'], // Only exclude native modules
    format: 'cjs',
    sourcemap: true,
    minify: false,
  });
  console.log('✅ Server built\n');

  // Step 3: Copy shared schema
  console.log('📦 Copying shared files...');
  const sharedDir = path.join(__dirname, 'dist-electron', 'shared');
  if (!fs.existsSync(sharedDir)) {
    fs.mkdirSync(sharedDir, { recursive: true });
  }
  
  // Copy schema file
  fs.copyFileSync(
    path.join(__dirname, 'shared', 'schema.ts'),
    path.join(sharedDir, 'schema.ts')
  );
  console.log('✅ Shared files copied\n');

  console.log('🎉 Electron build complete!');
  console.log('\nNext steps:');
  console.log('  1. Test: npm run dev:electron');
  console.log('  2. Package: npm run dist');
}

buildElectron().catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
