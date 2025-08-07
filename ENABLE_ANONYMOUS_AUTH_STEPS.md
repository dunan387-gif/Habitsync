# Step-by-Step Guide: Enable Anonymous Authentication

## 🎯 **Goal**
Enable anonymous sign-ins so users can create posts and like posts in your community.

## 📋 **Step-by-Step Instructions**

### **Step 1: Access Your Supabase Dashboard**
1. Go to: https://supabase.com/dashboard
2. Sign in to your account
3. Select your project (the one with your productivity app)

### **Step 2: Navigate to Authentication Settings**
1. In the left sidebar, click on **"Authentication"**
2. Click on the **"Settings"** tab
3. Scroll down to find **"Enable anonymous sign-ins"**

### **Step 3: Enable Anonymous Sign-ins**
1. Find the toggle switch for **"Enable anonymous sign-ins"**
2. Click the toggle to turn it **ON** (it should show as enabled)
3. Click **"Save"** to apply the changes

### **Step 4: Test Your App**
1. Restart your app
2. Navigate to the community section
3. Try creating a post - should work now!
4. Try liking a post - should work now!

## 🔍 **Alternative Method (If Dashboard Option Not Available)**

If you can't find the setting in the dashboard, use the SQL Editor:

### **Step 1: Open SQL Editor**
1. In your Supabase Dashboard
2. Click on **"SQL Editor"** in the left sidebar
3. Click **"New query"**

### **Step 2: Run the SQL Command**
Copy and paste this SQL command:

```sql
UPDATE auth.config 
SET enable_anonymous_sign_ins = true;
```

### **Step 3: Execute**
1. Click the **"Run"** button
2. You should see a success message

## ✅ **What This Will Fix**

After enabling anonymous sign-ins:
- ✅ Users can create posts without signing up
- ✅ Users can like/unlike posts
- ✅ Users can add comments
- ✅ All community features will work properly
- ✅ No more "Anonymous sign-ins are disabled" errors

## 🧪 **Testing Checklist**

After enabling anonymous sign-ins:

- [ ] Community feed loads without errors
- [ ] Can create a new post
- [ ] Can like a post
- [ ] Can unlike a post
- [ ] Can add a comment
- [ ] No authentication errors in console

## 🚨 **If You Still Have Issues**

1. **Check the console logs** - Look for any new error messages
2. **Refresh the page** - Sometimes changes take a moment to propagate
3. **Restart your app** - Make sure the new settings are loaded
4. **Check RLS policies** - Ensure community tables allow anonymous access

## 📞 **Need Help?**

If you're still having trouble:
1. Check the Supabase documentation: https://supabase.com/docs/guides/auth/anonymous-auth
2. Make sure you're in the correct project in your dashboard
3. Try the SQL method if the dashboard option doesn't work

The key is enabling anonymous sign-ins - once that's done, all the community features should work perfectly! 