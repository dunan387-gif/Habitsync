# 🚀 Production Setup Guide - Habit Tracker Pro

## Step 1: Set Up Supabase Project

### 1.1 Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up/Login and create a new project
3. Choose a project name (e.g., "habit-tracker-pro")
4. Set a database password (save this!)
5. Choose your region (closest to your users)

### 1.2 Get Your Credentials
1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **anon public key** (starts with `eyJ...`)

### 1.3 Set Up Database Schema
1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the entire content from `supabase-schema.sql` file
3. Paste and run the SQL commands
4. Verify all tables are created in **Table Editor**

## Step 2: Configure Environment Variables

### 2.1 Create .env File
Create a `.env` file in your project root with:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Google Pay Configuration (for payments)
EXPO_PUBLIC_GOOGLE_PAY_MERCHANT_ID=your-google-pay-merchant-id

# App Configuration
EXPO_PUBLIC_APP_NAME=HabitSyncer Productivity
EXPO_PUBLIC_APP_VERSION=1.0.0

# Feature Flags
EXPO_PUBLIC_OFFLINE_MODE=false
```

### 2.2 Update App Configuration
1. Open `constants/api.ts`
2. Change `OFFLINE_MODE` to `false`:
   ```typescript
   export const OFFLINE_MODE = false; // Enable Supabase
   ```

## Step 3: Set Up Payment Processing

### 3.1 Google Pay Setup
1. Go to [Google Pay API Console](https://pay.google.com/business/console/)
2. Create a new project
3. Enable Google Pay API
4. Get your Merchant ID
5. Add it to your `.env` file

### 3.2 Alternative: Stripe Integration
If you prefer Stripe over Google Pay:

1. Create a [Stripe account](https://stripe.com)
2. Get your publishable key
3. Update the payment service in your app

## Step 4: Test Your Setup

### 4.1 Test Authentication
1. Run your app: `npx expo start`
2. Try to register a new user
3. Check if the user appears in Supabase **Authentication** → **Users**
4. Verify the profile is created in **Table Editor** → **profiles**

### 4.2 Test Database Operations
1. Create a habit in your app
2. Check if it appears in **Table Editor** → **habits**
3. Complete a habit and verify it's in **habit_completions**

### 4.3 Test Payments
1. Try to upgrade to Pro
2. Verify the subscription is created in **subscriptions** table

## Step 5: Production Deployment

### 5.1 App Store Preparation
1. Update `app.json` with your production settings
2. Configure app signing certificates
3. Set up app store connect

### 5.2 Environment Variables
Make sure your production build includes the correct environment variables.

## Troubleshooting

### Common Issues:

1. **"Network request failed" errors**
   - Check your Supabase URL and key
   - Verify RLS policies are set up correctly
   - Check if your IP is allowed in Supabase

2. **Authentication not working**
   - Verify email confirmation is set up in Supabase
   - Check if the `handle_new_user` trigger is working
   - Look at Supabase logs for errors

3. **Payment processing errors**
   - Verify Google Pay/Stripe credentials
   - Check if webhook endpoints are configured
   - Test with sandbox credentials first

### Debug Commands:
```bash
# Test Supabase connection
node test-supabase-connection.js

# Verify database schema
node test-complete-schema.js

# Check mobile connection
node test-mobile-connection.js
```

## Security Checklist

- [ ] RLS policies are enabled on all tables
- [ ] Environment variables are not committed to git
- [ ] API keys are restricted to your app's domain
- [ ] Database backups are configured
- [ ] Monitoring and logging are set up

## Next Steps

1. **Analytics Setup**: Configure user analytics tracking
2. **Push Notifications**: Set up Firebase/Expo notifications
3. **Error Monitoring**: Add Sentry or similar error tracking
4. **Performance Monitoring**: Set up performance tracking
5. **User Support**: Add in-app support system

## Support

If you encounter issues:
1. Check the Supabase logs in your dashboard
2. Review the troubleshooting section above
3. Check the app console for error messages
4. Verify all environment variables are set correctly

---

**🎉 Congratulations!** Your app is now ready for production with real authentication and payment processing!
