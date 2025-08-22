# 🚀 FCM V1 API Setup Guide - HabitSyncer

## **Overview**
This guide will help you complete the Firebase Cloud Messaging (FCM) V1 API setup for your HabitSyncer app. The V1 API is more secure and future-proof than the legacy API.

## **✅ Current Firebase Project Status**

### **Existing Configuration:**
- **Project ID**: `habitsync-7b08f`
- **Project Number**: `364584922375`
- **Android Package**: `com.sabbir404.habitsyncerproductivity`
- **iOS Bundle ID**: `com.sabbir404.habitsyncer`
- **Storage Bucket**: `habitsync-7b08f.firebasestorage.app`
- **V1 API**: ✅ **Already Enabled**
- **Sender ID**: `641731906688`

### **Already Configured:**
- ✅ Firebase project exists in console
- ✅ `google-services.json` file is present
- ✅ Firebase plugins are configured in `app.json`
- ✅ Android permissions are set up
- ✅ FCM V1 API is enabled
- ✅ Firebase Admin SDK is installed
- ✅ V1 API services are implemented in code

## **🔧 Setup Steps for V1 API**

### **Step 1: Generate Service Account Key**

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `habitsync-7b08f`
3. **Navigate to**: Project Settings → **Service accounts** tab
4. **Click "Generate new private key"**
5. **Download the JSON file** (keep it secure!)
6. **Save as `firebase-service-account.json`** in your project root

### **Step 2: Verify Service Account File**

The downloaded file should look like this:
```json
{
  "type": "service_account",
  "project_id": "habitsync-7b08f",
  "private_key_id": "your_private_key_id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@habitsync-7b08f.iam.gserviceaccount.com",
  "client_id": "your_client_id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40habitsync-7b08f.iam.gserviceaccount.com"
}
```

### **Step 3: Test FCM V1 Integration**

1. **Get your device's FCM token** from your app logs
2. **Update the test script** with your token
3. **Run the test**:
   ```bash
   node test-fcm-v1.js
   ```

## **🚀 Benefits of V1 API**

### **✅ Security Improvements:**
- **OAuth 2.0 authentication** instead of Server Key
- **Service account credentials** are more secure
- **No exposed API keys** in client code

### **✅ Future-Proof:**
- **Official Firebase Admin SDK** support
- **Long-term compatibility** guaranteed
- **Better error handling** and debugging

### **✅ Enhanced Features:**
- **Better message delivery** tracking
- **Improved error reporting**
- **More reliable** notification delivery

## **📱 Testing Your Implementation**

### **Test Different Notification Types:**

1. **Habit Reminders**:
   ```javascript
   await fcmServiceV1.sendHabitReminder(token, "Exercise", "Time to work out! 💪");
   ```

2. **Motivational Messages**:
   ```javascript
   await fcmServiceV1.sendMotivationalMessage(token, "You're doing amazing! 🌟");
   ```

3. **Achievement Notifications**:
   ```javascript
   await fcmServiceV1.sendAchievementNotification(token, "7-day streak! 🎉");
   ```

4. **Mood Check-ins**:
   ```javascript
   await fcmServiceV1.sendMoodCheckIn(token, "How are you feeling? 😊");
   ```

## **🔒 Security Best Practices**

### **1. Service Account Protection:**
- **Never commit** `firebase-service-account.json` to version control
- **Add to `.gitignore`**:
  ```
  firebase-service-account.json
  ```
- **Use environment variables** in production

### **2. Token Management:**
- **Store FCM tokens** securely in Firestore
- **Update tokens** when they refresh
- **Clean up old tokens** regularly

### **3. Permission Handling:**
- **Request permissions** gracefully
- **Provide clear explanations** to users
- **Handle permission denials** gracefully

## **🐛 Troubleshooting**

### **Common Issues:**

#### **1. "Firebase Admin SDK not initialized"**
- **Solution**: Ensure `firebase-service-account.json` is in project root
- **Check**: File path and JSON format

#### **2. "Service account file not found"**
- **Solution**: Download service account key from Firebase Console
- **Location**: Project Settings → Service Accounts → Generate new private key

#### **3. "Notifications not showing when app is closed"**
- **Check**: Android notification channels are created
- **Verify**: Battery optimization is disabled
- **Ensure**: Background message handler is imported

#### **4. "FCM token not generating"**
- **Check**: Firebase project configuration
- **Verify**: App is properly registered in Firebase Console
- **Check**: Network connectivity

## **📈 Monitoring and Analytics**

### **1. Firebase Analytics:**
- Monitor notification delivery rates
- Track user engagement with notifications
- Analyze notification effectiveness

### **2. Error Tracking:**
- Monitor FCM errors in Firebase Console
- Track token refresh failures
- Monitor background message handling errors

## **🎯 Next Steps**

1. **✅ Download service account key** from Firebase Console
2. **✅ Save as `firebase-service-account.json`** in project root
3. **✅ Test with your device** using the test script
4. **✅ Build and deploy** your app with V1 API
5. **✅ Monitor notification delivery** and user engagement

## **📞 Support**

If you encounter issues:
1. Check Firebase Console for error messages
2. Review this setup guide
3. Check Firebase Admin SDK documentation
4. Verify all configuration files are in place

---

**🎉 Your HabitSyncer app is now using the secure FCM V1 API!**

The implementation includes:
- ✅ Secure OAuth 2.0 authentication
- ✅ Firebase Admin SDK integration
- ✅ Background message handling
- ✅ Server-side notification scheduling
- ✅ Proper token management
- ✅ Android notification channels
- ✅ Battery optimization handling

**Background notifications will work reliably with enhanced security!**
