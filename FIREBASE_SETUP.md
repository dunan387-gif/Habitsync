# Firebase Setup Guide

## Environment Variables

Create a `.env` file in your project root with the following Firebase configuration:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Set offline mode to false to enable Firebase
EXPO_PUBLIC_OFFLINE_MODE=false
```

## Steps to Get Firebase Configuration:

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Create/Select Project**: Choose your project
3. **Add Android App**: 
   - Package name: `com.sabbir404.habitsyncerproductivity`
- App nickname: `HabitSyncer Android`
4. **Download google-services.json**: Place in project root
5. **Get Web Config**: 
   - Go to Project Settings → General → Your Apps
   - Click on the web app (</>) icon
   - Copy the config values to your `.env` file

## Firebase Services to Enable:

1. **Authentication**:
   - Email/Password
   - Google Sign-In
   - Apple Sign-In (for iOS)

2. **Firestore Database**:
   - Create database in test mode
   - Set up security rules

3. **Analytics**:
   - Enable Google Analytics
   - Configure events

## Security Rules for Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Habits are user-specific
    match /habits/{userId}/habits/{habitId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public community posts
    match /community/posts/{postId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```
