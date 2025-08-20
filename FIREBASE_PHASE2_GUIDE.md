# 🔥 Firebase Phase 2: Authentication & Data Migration Guide

## 📋 Phase 2 Overview

**Goal**: Implement Firebase Authentication and migrate from offline mode to real Firebase-powered features.

**Key Objectives**:
1. ✅ Enable Firebase Authentication in Firebase Console
2. ✅ Test User Registration & Login with Firebase
3. ✅ Migrate from Offline Mode to Firebase
4. ✅ Implement Real-time Data Sync with Firestore
5. ✅ Set up Security Rules for data protection

---

## 🚀 Step 1: Enable Firebase Authentication

### 1.1 Enable Email/Password Authentication

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project**: `habitsyncer-7b08f`
3. **Navigate to Authentication**: Click "Authentication" in the left sidebar
4. **Go to Sign-in method**: Click the "Sign-in method" tab
5. **Enable Email/Password**:
   - Click on "Email/Password"
   - Toggle "Enable" to ON
   - Check "Email link (passwordless sign-in)" if you want passwordless auth
   - Click "Save"

### 1.2 (Optional) Enable Google Sign-In

1. **In the same Sign-in method page**:
   - Click on "Google"
   - Toggle "Enable" to ON
   - Add your support email
   - Click "Save"

### 1.3 (Optional) Enable Apple Sign-In

1. **In the same Sign-in method page**:
   - Click on "Apple"
   - Toggle "Enable" to ON
   - Add your Apple Developer Team ID and Key ID
   - Click "Save"

---

## 🗄️ Step 2: Set Up Firestore Database

### 2.1 Create Firestore Database

1. **Navigate to Firestore Database**: Click "Firestore Database" in the left sidebar
2. **Create Database**:
   - Click "Create database"
   - Choose "Start in test mode" (we'll add security rules later)
   - Select your preferred location (choose closest to your users)
   - Click "Done"

### 2.2 Initial Database Structure

Your Firestore will have these collections:
- `users` - User profiles and settings
- `habits` - User habits and tracking data
- `mood_entries` - Mood tracking data
- `analytics` - User analytics and insights

---

## 🔒 Step 3: Set Up Security Rules

### 3.1 Basic Security Rules

In Firestore Database → Rules, replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Habits belong to users
    match /habits/{habitId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Mood entries belong to users
    match /mood_entries/{entryId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Analytics belong to users
    match /analytics/{analyticsId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

---

## 🧪 Step 4: Test Firebase Integration

### 4.1 Test User Registration

1. **Start your development server**: `npx expo start`
2. **Open your app** and go to the registration screen
3. **Create a test account** with email and password
4. **Check Firebase Console** → Authentication → Users to see the new user

### 4.2 Test User Login

1. **Log out** of the app
2. **Log back in** with the test credentials
3. **Verify** that you're redirected to the main app

### 4.3 Test Data Persistence

1. **Create a habit** in the app
2. **Check Firestore Database** → Data to see the habit document
3. **Log out and log back in** to verify data persistence

---

## 🔄 Step 5: Migrate from Offline Mode

### 5.1 Update App Configuration

Once testing is successful, we'll:
1. **Disable offline mode** in `constants/api.ts`
2. **Enable real Firebase operations**
3. **Implement real-time data synchronization**

### 5.2 Data Migration Strategy

1. **Export existing offline data** from AsyncStorage
2. **Upload to Firestore** for each user
3. **Verify data integrity**
4. **Enable real-time sync**

---

## 📱 Step 6: Implement Real-time Features

### 6.1 Real-time Data Sync

- **Habit updates** sync across devices
- **Mood tracking** data syncs in real-time
- **Analytics** update automatically

### 6.2 Offline Support

- **Offline-first architecture** with local caching
- **Sync when online** automatically
- **Conflict resolution** for data conflicts

---

## 🎯 Success Criteria

Phase 2 is complete when:

✅ **Authentication works** - Users can register and login  
✅ **Data persists** - User data is stored in Firestore  
✅ **Real-time sync** - Data updates across devices  
✅ **Security rules** - Data is properly protected  
✅ **Offline mode disabled** - App uses Firebase by default  

---

## 🚨 Troubleshooting

### Common Issues:

1. **Authentication fails**:
   - Check Firebase Console → Authentication → Sign-in method
   - Verify email/password is enabled
   - Check your `.env` file configuration

2. **Database access denied**:
   - Check Firestore security rules
   - Verify user is authenticated
   - Check collection/document structure

3. **Data not syncing**:
   - Check network connectivity
   - Verify Firestore rules allow write access
   - Check console for error messages

---

## 📞 Next Steps

After completing Phase 2:

1. **Phase 3**: Advanced Features (Push Notifications, Analytics)
2. **Phase 4**: Performance Optimization
3. **Phase 5**: Production Deployment

---

**Ready to start Phase 2? Let's begin with enabling Firebase Authentication!** 🔥
