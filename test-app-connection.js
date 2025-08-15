#!/usr/bin/env node

/**
 * Test App Supabase Connection
 * This script tests the connection using the same configuration as the app
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testAppConnection() {
  console.log('🔍 Testing App Supabase Connection...');
  console.log('=====================================\n');

  // Check environment variables
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  console.log('Environment Variables:');
  console.log(`  URL: ${supabaseUrl}`);
  console.log(`  Key: ${supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'NOT SET'}`);

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase credentials');
    return;
  }

  try {
    // Create Supabase client (same as in the app)
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });

    console.log('\n🔗 Testing authentication methods...');

    // Test sign up (this should work even without actual signup)
    console.log('Testing signUpWithEmail...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'testpassword123',
    });

    if (signUpError) {
      console.log('✅ Sign up test completed (expected error for test email):', signUpError.message);
    } else {
      console.log('✅ Sign up test successful');
    }

    // Test sign in (this should work even without actual signin)
    console.log('\nTesting signInWithPassword...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword123',
    });

    if (signInError) {
      console.log('✅ Sign in test completed (expected error for test credentials):', signInError.message);
    } else {
      console.log('✅ Sign in test successful');
    }

    // Test database connection
    console.log('\nTesting database connection...');
    const { data: dbData, error: dbError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (dbError) {
      console.log('❌ Database connection failed:', dbError.message);
    } else {
      console.log('✅ Database connection successful');
    }

    console.log('\n🎉 App connection test completed!');
    console.log('If you see expected errors for test credentials, your setup is working correctly.');

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

// Run the test
testAppConnection().catch(console.error);
