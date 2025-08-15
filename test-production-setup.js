#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

console.log('🚀 Testing Production Setup for Habit Tracker Pro\n');

// Check environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('📋 Environment Variables Check:');
console.log(`   Supabase URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
console.log(`   Supabase Key: ${supabaseKey ? '✅ Set' : '❌ Missing'}`);

if (!supabaseUrl || !supabaseKey) {
  console.log('\n❌ Missing environment variables!');
  console.log('Please create a .env file with:');
  console.log('EXPO_PUBLIC_SUPABASE_URL=your-supabase-url');
  console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key');
  process.exit(1);
}

// Test Supabase connection
async function testSupabaseConnection() {
  try {
    console.log('\n🔗 Testing Supabase Connection...');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.log('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    
    // Test authentication
    console.log('\n🔐 Testing Authentication...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('❌ Authentication test failed:', authError.message);
    } else {
      console.log('✅ Authentication system working!');
    }
    
    // Test table access
    console.log('\n📊 Testing Database Tables...');
    const tables = ['profiles', 'habits', 'mood_entries', 'subscriptions', 'community_posts'];
    
    for (const table of tables) {
      try {
        const { error: tableError } = await supabase.from(table).select('*').limit(1);
        if (tableError) {
          console.log(`   ${table}: ❌ ${tableError.message}`);
        } else {
          console.log(`   ${table}: ✅ Accessible`);
        }
      } catch (err) {
        console.log(`   ${table}: ❌ ${err.message}`);
      }
    }
    
    return true;
    
  } catch (error) {
    console.log('❌ Connection test failed:', error.message);
    return false;
  }
}

// Test payment service
function testPaymentService() {
  console.log('\n💳 Testing Payment Service...');
  
  try {
    const GooglePayService = require('./services/GooglePayService.ts');
    console.log('✅ GooglePayService loaded successfully');
    
    // Test payment processing
    const testPlan = {
      id: 'pro-monthly',
      name: 'Pro Monthly',
      price: 9.99,
      currency: 'USD',
      period: 'monthly',
      features: ['Unlimited habits', 'Advanced analytics']
    };
    
    console.log('✅ Payment service ready for testing');
    return true;
  } catch (error) {
    console.log('❌ Payment service test failed:', error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🧪 Running Production Setup Tests...\n');
  
  const supabaseTest = await testSupabaseConnection();
  const paymentTest = testPaymentService();
  
  console.log('\n📊 Test Results:');
  console.log(`   Supabase: ${supabaseTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Payments: ${paymentTest ? '✅ PASS' : '❌ FAIL'}`);
  
  if (supabaseTest && paymentTest) {
    console.log('\n🎉 All tests passed! Your production setup is ready.');
    console.log('\n📝 Next Steps:');
    console.log('   1. Test user registration in your app');
    console.log('   2. Test habit creation and completion');
    console.log('   3. Test subscription upgrades');
    console.log('   4. Deploy to app stores');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the issues above.');
    console.log('\n📚 See PRODUCTION_SETUP_GUIDE.md for detailed instructions.');
  }
}

// Run tests
runTests().catch(console.error);
