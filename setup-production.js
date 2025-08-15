#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Production Environment...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log('❌ .env file not found!');
  console.log('\n📝 Please create a .env file with the following content:\n');
  console.log('# Supabase Configuration');
  console.log('EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url_here');
  console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here');
  console.log('');
  console.log('# Google Pay Configuration (for payments)');
  console.log('EXPO_PUBLIC_GOOGLE_PAY_MERCHANT_ID=your_google_pay_merchant_id_here');
  console.log('');
  console.log('# App Configuration');
  console.log('EXPO_PUBLIC_APP_NAME=HabitSync');
  console.log('EXPO_PUBLIC_APP_VERSION=1.0.0');
  console.log('');
  console.log('# Feature Flags');
  console.log('EXPO_PUBLIC_OFFLINE_MODE=false');
  console.log('\n📖 See ENVIRONMENT_SETUP.md for detailed instructions');
} else {
  console.log('✅ .env file found!');
  
  // Read and check .env content
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasSupabaseUrl = envContent.includes('EXPO_PUBLIC_SUPABASE_URL=');
  const hasSupabaseKey = envContent.includes('EXPO_PUBLIC_SUPABASE_ANON_KEY=');
  const hasOfflineMode = envContent.includes('EXPO_PUBLIC_OFFLINE_MODE=false');
  
  console.log(`✅ Supabase URL configured: ${hasSupabaseUrl}`);
  console.log(`✅ Supabase Key configured: ${hasSupabaseKey}`);
  console.log(`✅ Offline mode disabled: ${hasOfflineMode}`);
  
  if (hasSupabaseUrl && hasSupabaseKey && hasOfflineMode) {
    console.log('\n🎉 Production environment is ready!');
    console.log('\n📋 Next steps:');
    console.log('1. Run the SQL schema in your Supabase SQL Editor');
    console.log('2. Test the connection: node test-production-setup.js');
    console.log('3. Start your app: npx expo start --clear');
    console.log('4. Try signing up with a real email!');
  } else {
    console.log('\n⚠️  Please update your .env file with the required values');
  }
}

console.log('\n📚 For detailed instructions, see:');
console.log('- ENVIRONMENT_SETUP.md');
console.log('- PRODUCTION_SETUP_GUIDE.md');
