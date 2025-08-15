# Debugging App Crash on Launch

## Issue
The app crashes immediately after launching when built with EAS Build.

## Root Cause
The main issue was that Firebase environment variables were not available during the EAS build, causing the app to crash when trying to initialize Firebase.

## Fixes Applied

### 1. Firebase Configuration Robustness
- Added fallback Firebase configuration in `lib/firebase.ts`
- Added error handling for Firebase initialization
- Made environment variable imports more robust

### 2. EAS Configuration
- Added Firebase environment variables to all build profiles in `eas.json`
- Environment variables are now available during build time

### 3. App Initialization
- Added `react-native-gesture-handler` import at the top level
- Enhanced error handling in `app/_layout.tsx`
- Added error boundaries and fallback screens

## Testing Steps

### 1. Test Local Development
```bash
npx expo start --clear
```
- Check if the app starts without crashes
- Look for any console errors

### 2. Test EAS Build
```bash
eas build --platform android --profile preview
```
- Build a new APK with the fixes
- Install and test the new build

### 3. Debug Build Issues
If the app still crashes:

#### Android Debugging
1. Connect your device/emulator
2. Run: `adb logcat | grep -E "(FATAL|AndroidRuntime|ReactNativeJS)"`
3. Launch the app and check the logs

#### Common Issues to Check
1. **Missing Dependencies**: Ensure all required packages are installed
2. **Environment Variables**: Verify Firebase config is correct
3. **AsyncStorage Issues**: Check for corrupted data
4. **Memory Issues**: Large bundle size or memory leaks

## Environment Variables
Make sure these are set in your EAS build:
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_MEASUREMENT_ID`

## Next Steps
1. Test the local development build
2. If successful, create a new EAS build
3. Test the new APK
4. If issues persist, check the logs for specific error messages

## Additional Debugging
If the app still crashes, try:
1. Clear app data and cache
2. Uninstall and reinstall the app
3. Check device compatibility
4. Test on different devices/emulators
