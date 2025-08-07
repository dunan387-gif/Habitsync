# Firebase Setup Instructions

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "habit-tracker-app")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## 2. Add Web App to Firebase Project

1. In your Firebase project dashboard, click the web icon (</>) to add a web app
2. Enter an app nickname (e.g., "habit-tracker-web")
3. Check "Also set up Firebase Hosting" if you want hosting
4. Click "Register app"
5. Copy the Firebase configuration object

## 3. Update Environment Variables

Create or update your `.env` file with the Firebase configuration:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## 4. Enable Authentication

1. In Firebase Console, go to "Authentication" → "Sign-in method"
2. Enable "Email/Password" authentication
3. Optionally enable "Google" and "Apple" for social login

## 5. Set up Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" for development
4. Select a location close to your users
5. Click "Done"

## 6. Set up Firestore Security Rules

In the Firestore Database → Rules tab, add these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Habits can only be accessed by their owner
    match /habits/{habitId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Habit completions can only be accessed by their owner
    match /habit_completions/{completionId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

## 7. Test the Setup

1. Start your app
2. Try to register a new user
3. Try to log in with the registered user
4. Check that user data is created in Firestore

## 8. Optional: Enable Google Sign-In

If you want to enable Google Sign-In:

1. In Authentication → Sign-in method, enable Google
2. Add your app's SHA-1 fingerprint for Android
3. Update the AuthContext to include Google sign-in methods

## 9. Optional: Enable Apple Sign-In

If you want to enable Apple Sign-In:

1. In Authentication → Sign-in method, enable Apple
2. Configure Apple Developer account settings
3. Update the AuthContext to include Apple sign-in methods

## Troubleshooting

- **"Firebase App named '[DEFAULT]' already exists"**: This usually means Firebase is being initialized multiple times. Check that you're only calling `initializeApp` once.
- **"Permission denied"**: Check your Firestore security rules
- **"User not found"**: Make sure authentication is properly enabled in Firebase Console 