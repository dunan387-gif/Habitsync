# Supabase Setup Guide

## 🔧 **Environment Variables**

You need to set up your Supabase credentials. Create a `.env` file in your project root with:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📋 **How to Get Your Supabase Credentials**

1. **Go to your Supabase Dashboard**
2. **Select your project**
3. **Go to Settings → API**
4. **Copy the following:**
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## 🔐 **Enable Anonymous Sign-ins**

1. **Go to Authentication → Settings**
2. **Find "Enable anonymous sign-ins"**
3. **Toggle it ON**
4. **Save changes**

## 🧪 **Testing**

After setting up:

1. **Restart your app**
2. **Try registering a new account**
3. **Try logging in**
4. **Test community features:**
   - Create posts
   - Like/unlike posts
   - Add comments

## 🚨 **Troubleshooting**

If you see errors:

1. **Check your environment variables** are set correctly
2. **Verify anonymous sign-ins are enabled**
3. **Check the console for error messages**
4. **Make sure your Supabase project is active**

## ✅ **What Should Work Now**

- ✅ User registration and login
- ✅ Community post creation
- ✅ Liking/unliking posts
- ✅ Adding comments
- ✅ Anonymous users can participate (if enabled)
- ✅ All community features integrated with authentication 