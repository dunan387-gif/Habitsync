// Test FCM Notification Script
// Run this with: node test-fcm-notification.js

const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY || 'YOUR_FCM_SERVER_KEY_HERE';
const DEVICE_TOKEN = 'YOUR_DEVICE_FCM_TOKEN_HERE'; // Get this from your app logs

async function testFCMNotification() {
  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${FCM_SERVER_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: DEVICE_TOKEN,
        notification: {
          title: 'HabitSyncer Build Better',
          body: 'Time to complete your daily habits! 💪',
          tag: 'test_notification'
        },
        data: {
          type: 'test',
          timestamp: new Date().toISOString()
        },
        android: {
          priority: 'high',
          notification: {
            channel_id: 'habit-reminders',
            priority: 'high',
            default_sound: true,
            default_vibrate_timings: true,
            tag: 'test_notification'
          }
        }
      }),
    });

    const result = await response.json();
    console.log('FCM Response:', result);
    
    if (response.ok && result.success > 0) {
      console.log('✅ Test notification sent successfully!');
    } else {
      console.log('❌ Test notification failed:', result);
    }
  } catch (error) {
    console.error('❌ Error sending test notification:', error);
  }
}

// Instructions
console.log('🚀 FCM Test Notification Script');
console.log('');
console.log('To use this script:');
console.log('1. Set your FCM_SERVER_KEY environment variable');
console.log('2. Replace DEVICE_TOKEN with your actual FCM token');
console.log('3. Run: node test-fcm-notification.js');
console.log('');
console.log('To get your FCM token, check your app logs for:');
console.log('"FCM Token generated:" or "FCM token updated for user:"');
console.log('');

// Run the test if FCM_SERVER_KEY is set
if (FCM_SERVER_KEY && FCM_SERVER_KEY !== 'YOUR_FCM_SERVER_KEY_HERE') {
  testFCMNotification();
} else {
  console.log('❌ Please set FCM_SERVER_KEY environment variable first');
}
