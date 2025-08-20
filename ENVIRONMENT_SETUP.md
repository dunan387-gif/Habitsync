# Environment Setup Guide

## Create Your `.env` File

Create a `.env` file in your project root with the following content:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google Pay Configuration (for payments)
EXPO_PUBLIC_GOOGLE_PAY_MERCHANT_ID=your_google_pay_merchant_id_here

# App Configuration
EXPO_PUBLIC_APP_NAME=HabitSyncer
EXPO_PUBLIC_APP_VERSION=1.0.0

# Feature Flags
EXPO_PUBLIC_OFFLINE_MODE=false
```

## How to Get Your Supabase Credentials

1. **Go to your Supabase project dashboard**
2. **Click on "Settings" in the left sidebar**
3. **Click on "API"**
4. **Copy the following values:**
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Steps to Enable Production Mode

1. **Create the `.env` file** with your real Supabase credentials
2. **Update `constants/api.ts`** to set `OFFLINE_MODE = false`
3. **Restart your Expo development server**
4. **Test real authentication**

## Testing Production Setup

After setting up your `.env` file, run:

```bash
node test-production-setup.js
```

This will verify your Supabase connection and authentication.
