// Test script to check anonymous authentication
const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAnonymousAuth() {
  console.log('Testing anonymous authentication...');
  
  try {
    // Try to sign in anonymously
    const { data, error } = await supabase.auth.signInAnonymously();
    
    if (error) {
      console.error('❌ Anonymous sign-in failed:', error.message);
      console.log('💡 You need to enable anonymous sign-ins in your Supabase dashboard');
      return false;
    }
    
    if (data.user) {
      console.log('✅ Anonymous sign-in successful!');
      console.log('User ID:', data.user.id);
      return true;
    }
    
  } catch (error) {
    console.error('❌ Error testing anonymous auth:', error);
    return false;
  }
}

// Run the test
testAnonymousAuth(); 