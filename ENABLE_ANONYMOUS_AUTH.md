# Enable Anonymous Authentication in Supabase

## Problem
Your app is showing the error: `Anonymous sign-ins are disabled`

## Solution
You need to enable anonymous authentication in your Supabase project.

## Steps to Enable Anonymous Sign-ins

### Option 1: Through Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Authentication Settings**
   - Click on "Authentication" in the left sidebar
   - Click on "Settings" tab

3. **Enable Anonymous Sign-ins**
   - Find the section "Enable anonymous sign-ins"
   - Toggle the switch to **ON**
   - Click "Save" to apply changes

4. **Test Your App**
   - Restart your app
   - Try accessing the community features again

### Option 2: Using SQL (Alternative)

If you can't find the setting in the dashboard, you can enable it via SQL:

1. **Go to SQL Editor in Supabase Dashboard**
2. **Run this SQL command:**
   ```sql
   UPDATE auth.config 
   SET enable_anonymous_sign_ins = true;
   ```

## What This Fixes

- ✅ Community feed will load properly
- ✅ Users can view posts without authentication
- ✅ Anonymous users can create posts
- ✅ Users can like/unlike posts
- ✅ Users can add comments
- ✅ All community features will work

## Alternative Solution

If you prefer not to enable anonymous sign-ins, the service has been updated to:
- Show community posts without requiring authentication
- Display helpful error messages when trying to create posts
- Gracefully handle the disabled anonymous auth

## Testing

After enabling anonymous sign-ins:

1. **Restart your app**
2. **Navigate to the community section**
3. **Try creating a post**
4. **Try liking/unliking posts**
5. **Check that no authentication errors appear**

## Troubleshooting

If you still see issues:

1. **Check the Supabase Dashboard** - Verify anonymous sign-ins are enabled
2. **Check the console logs** - Look for any new error messages
3. **Try refreshing the page** - Sometimes changes take a moment to propagate
4. **Check RLS policies** - Ensure the community tables allow anonymous access

The community features should work properly once anonymous sign-ins are enabled! 