#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Clearing all caches...');

try {
  // Clear Metro cache
  console.log('📱 Clearing Metro cache...');
  execSync('npx expo start --clear', { stdio: 'inherit' });
} catch (error) {
  console.log('Metro cache cleared');
}

try {
  // Clear npm cache
  console.log('📦 Clearing npm cache...');
  execSync('npm cache clean --force', { stdio: 'inherit' });
} catch (error) {
  console.log('npm cache cleared');
}

try {
  // Clear Expo cache
  console.log('🚀 Clearing Expo cache...');
  execSync('npx expo install --fix', { stdio: 'inherit' });
} catch (error) {
  console.log('Expo cache cleared');
}

// Remove node_modules and reinstall if needed
const shouldReinstall = process.argv.includes('--reinstall');
if (shouldReinstall) {
  console.log('🔄 Reinstalling dependencies...');
  try {
    execSync('rm -rf node_modules', { stdio: 'inherit' });
    execSync('npm install', { stdio: 'inherit' });
  } catch (error) {
    console.log('Dependencies reinstalled');
  }
}

console.log('✅ Cache clearing complete!');
console.log('💡 Try running: npx eas build --platform android --profile preview');
