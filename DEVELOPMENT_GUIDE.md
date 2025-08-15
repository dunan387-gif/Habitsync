# Development Guide - Hot Reload Troubleshooting

## Quick Fixes for Hot Reload Issues

### 1. **Use the correct development command:**
```bash
# For web development with hot reload
npm run dev

# For mobile development
npm run start
# Then press 'w' for web, 'a' for Android, 'i' for iOS
```

### 2. **Clear cache and restart:**
```bash
# Clear Expo cache
npx expo start --clear

# Clear Metro cache
npx expo start --reset-cache

# Clear all caches
npx expo start --clear --reset-cache
```

### 3. **Browser-specific fixes:**
- **Chrome/Edge**: Disable cache in DevTools (F12 → Network → Disable cache)
- **Firefox**: Disable cache in DevTools (F12 → Network → Disable cache)
- **Safari**: Disable cache in Develop menu

### 4. **Common issues and solutions:**

#### Issue: Changes not reflecting
**Solution:**
- Press `Ctrl+R` (Windows) or `Cmd+R` (Mac) to force refresh
- Check browser console for errors
- Ensure you're not in production mode

#### Issue: Hot reload stops working
**Solution:**
- Restart the development server
- Clear browser cache
- Check for syntax errors in your code

#### Issue: Slow hot reload
**Solution:**
- Use `npm run dev` instead of `npm run web`
- Close unnecessary browser tabs
- Disable browser extensions that might interfere

### 5. **Development best practices:**
- Always use `npm run dev` for web development
- Keep the browser DevTools open to see errors
- Use the browser's "Disable cache" option
- Restart the server if hot reload stops working

### 6. **Troubleshooting commands:**
```bash
# Check if Expo CLI is up to date
npx expo install --fix

# Check for dependency issues
npm audit fix

# Reinstall node_modules if needed
rm -rf node_modules package-lock.json
npm install
```

### 7. **Environment variables for development:**
Add these to your `.env` file (if not already present):
```
EXPO_FAST_REFRESH=true
EXPO_USE_FAST_REFRESH=true
EXPO_DEBUG=true
EXPO_NO_MINIFY=true
```

## Mobile Development
For mobile development with better hot reload:
1. Use `npm run start`
2. Press `a` for Android or `i` for iOS
3. Use Expo Go app or run on simulator/emulator
4. Shake device or press `Cmd+D` (iOS) / `Ctrl+M` (Android) for developer menu
5. Enable "Fast Refresh" in developer menu
