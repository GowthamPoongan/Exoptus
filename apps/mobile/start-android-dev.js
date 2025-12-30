#!/usr/bin/env node

const { spawn } = require('child_process');
const http = require('http');

console.log('🚀 Starting Metro Bundler and Android Development Build...\n');

// Start Metro bundler
console.log('📦 Starting Metro bundler...');

// Start Metro in background (non-blocking)
const metroProcess = spawn(
  'npx',
  ['expo', 'start', '--dev-client'],
  {
    stdio: 'inherit',
    shell: true,
    detached: false
  }
);

metroProcess.on('error', (err) => {
  console.error('❌ Failed to start Metro:', err.message);
  process.exit(1);
});

// Wait for Metro to be ready
console.log('⏳ Waiting for Metro bundler to start...');

function checkMetroReady() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:8081/status', { timeout: 2000 }, (res) => {
      resolve(true);
    });
    req.on('error', () => {
      resolve(false);
    });
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitAndBuild() {
  let attempts = 0;
  const maxAttempts = 30;
  
  while (attempts < maxAttempts) {
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const ready = await checkMetroReady();
    if (ready) {
      console.log('✅ Metro bundler is ready!\n');
      console.log('🤖 Building and installing Android app...\n');
      
      // Run Android build
      const androidProcess = spawn(
        'npx',
        ['expo', 'run:android'],
        {
          stdio: 'inherit',
          shell: true
        }
      );
      
      androidProcess.on('close', (code) => {
        console.log('\n✅ Android build completed! Metro bundler is still running.');
        console.log('   Press Ctrl+C to stop Metro.');
      });
      
      androidProcess.on('error', (err) => {
        console.error('❌ Failed to run Android build:', err.message);
        metroProcess.kill();
        process.exit(1);
      });
      
      return;
    }
  }
  
  console.log('⚠️  Metro might still be starting, proceeding with build anyway...\n');
  console.log('🤖 Building and installing Android app...\n');
  
  const androidProcess = spawn(
    'npx',
    ['expo', 'run:android'],
    {
      stdio: 'inherit',
      shell: true
    }
  );
  
  androidProcess.on('close', (code) => {
    console.log('\n✅ Android build completed! Metro bundler is still running.');
  });
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down...');
  metroProcess.kill();
  process.exit(0);
});

waitAndBuild();
