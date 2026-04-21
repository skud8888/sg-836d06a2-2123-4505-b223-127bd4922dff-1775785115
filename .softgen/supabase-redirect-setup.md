# Supabase Redirect URLs Configuration Guide
**Production Domain:** `https://gtstrain.eastshoresit.com.au`
**Date:** 2026-04-21

---

## 🎯 **What Are Redirect URLs?**

Redirect URLs tell Supabase where to send users after authentication events (login, signup, password reset, email confirmation). Without proper configuration, users will see errors after authentication attempts.

---

## 📋 **Required Redirect URLs**

Add these URLs to your Supabase project's authentication configuration:

### **1. Production URLs (REQUIRED)**
```
https://gtstrain.eastshoresit.com.au/**
https://gtstrain.eastshoresit.com.au/admin
https://gtstrain.eastshoresit.com.au/admin/**
https://gtstrain.eastshoresit.com.au/student/portal
https://gtstrain.eastshoresit.com.au/student/**
https://gtstrain.eastshoresit.com.au/trainer/**
https://gtstrain.eastshoresit.com.au/auth/confirm-email
https://gtstrain.eastshoresit.com.au/auth/reset-password
```

### **2. Vercel Preview URLs (OPTIONAL - for testing)**
```
https://*-gtstrain.vercel.app/**
```

### **3. Local Development (OPTIONAL - for local testing)**
```
http://localhost:3000/**
```

---

## 🚀 **Step-by-Step Configuration**

### **Step 1: Access Supabase Dashboard**

1. Go to: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project: `veayhprmlrhaldfoqkmm`

---

### **Step 2: Navigate to Authentication Settings**

1. Click **"Authentication"** in the left sidebar
2. Click **"URL Configuration"** (or "Redirect URLs")
3. You'll see two sections:
   - **Site URL** (your main application URL)
   - **Redirect URLs** (allowed redirect destinations)

---

### **Step 3: Set Site URL**

In the **"Site URL"** field, enter:
```
https://gtstrain.eastshoresit.com.au
```

**What it does:** This is your default redirect destination when no specific redirect is specified.

---

### **Step 4: Add Redirect URLs**

In the **"Redirect URLs"** section:

1. Click **"Add URL"** button
2. Paste this URL: `https://gtstrain.eastshoresit.com.au/**`
3. Click **"Add"** or **"Save"**

4. Repeat for EACH of these URLs:
   ```
   https://gtstrain.eastshoresit.com.au/admin
   https://gtstrain.eastshoresit.com.au/admin/**
   https://gtstrain.eastshoresit.com.au/student/portal
   https://gtstrain.eastshoresit.com.au/student/**
   https://gtstrain.eastshoresit.com.au/trainer/**
   https://gtstrain.eastshoresit.com.au/auth/confirm-email
   https://gtstrain.eastshoresit.com.au/auth/reset-password
   ```

**IMPORTANT:** The `/**` wildcard means "any path". This allows redirects to any page under that path.

---

### **Step 5: Save Configuration**

1. Click **"Save"** at the bottom of the page
2. Wait for the success message: "Configuration updated"

---

## ✅ **Verification Checklist**

After configuration, verify each URL was added correctly:

```
☐ Site URL is set to: https://gtstrain.eastshoresit.com.au
☐ Redirect URLs include: https://gtstrain.eastshoresit.com.au/**
☐ Redirect URLs include: https://gtstrain.eastshoresit.com.au/admin
☐ Redirect URLs include: https://gtstrain.eastshoresit.com.au/admin/**
☐ Redirect URLs include: https://gtstrain.eastshoresit.com.au/student/portal
☐ Redirect URLs include: https://gtstrain.eastshoresit.com.au/student/**
☐ Redirect URLs include: https://gtstrain.eastshoresit.com.au/trainer/**
☐ Redirect URLs include: https://gtstrain.eastshoresit.com.au/auth/confirm-email
☐ Redirect URLs include: https://gtstrain.eastshoresit.com.au/auth/reset-password
```

---

## 🧪 **Test Authentication Flow**

After configuration, test the complete authentication flow:

### **Test 1: Student Signup**
1. Go to: `https://gtstrain.eastshoresit.com.au/student/portal`
2. Click "Sign Up"
3. Enter email and password
4. Check email for confirmation link
5. Click link → should redirect to `/student/portal`
6. ✅ **Success:** You're logged in and see the student dashboard

### **Test 2: Admin Login**
1. Go to: `https://gtstrain.eastshoresit.com.au/admin/login`
2. Enter admin credentials
3. Click "Sign In"
4. ✅ **Success:** Redirected to `/admin` dashboard

### **Test 3: Password Reset**
1. Go to login page
2. Click "Forgot Password?"
3. Enter email address
4. Check email for reset link
5. Click link → should redirect to `/auth/reset-password`
6. Enter new password
7. ✅ **Success:** Password updated, logged in

### **Test 4: Email Confirmation**
1. Create new account
2. Check email for confirmation
3. Click confirmation link
4. ✅ **Success:** Email confirmed, redirected to appropriate dashboard

---

## 🔧 **Troubleshooting**

### **Error: "Invalid redirect URL"**
**Cause:** The redirect URL is not in your allowed list.
**Fix:** 
1. Check the exact URL in the browser address bar
2. Add that exact URL to your Redirect URLs in Supabase
3. Make sure you included the `/**` wildcard for path flexibility

---

### **Error: "redirect_uri_mismatch"**
**Cause:** The requested redirect doesn't match any allowed URL.
**Fix:**
1. Copy the exact URL from the error message
2. Add it to Supabase Redirect URLs
3. Wait 1-2 minutes for propagation
4. Try again

---

### **Users stuck on loading screen after login**
**Cause:** Site URL not set correctly.
**Fix:**
1. Verify Site URL is: `https://gtstrain.eastshoresit.com.au`
2. No trailing slash: ✅ Correct | ❌ `https://gtstrain.eastshoresit.com.au/`
3. Must use HTTPS (not HTTP)
4. Save and retry

---

### **Confirmation emails not working**
**Cause:** Email template redirect URL is wrong.
**Fix:**
1. Go to: Authentication → Email Templates
2. Check "Confirm signup" template
3. Verify redirect URL is: `{{ .SiteURL }}/auth/confirm-email`
4. Update if needed and save

---

## 📧 **Email Template Configuration**

Supabase email templates use these redirect patterns:

### **Signup Confirmation:**
```html
<a href="{{ .ConfirmationURL }}">Confirm Email</a>
```
Redirects to: `https://gtstrain.eastshoresit.com.au/auth/confirm-email?token=...`

### **Password Reset:**
```html
<a href="{{ .ConfirmationURL }}">Reset Password</a>
```
Redirects to: `https://gtstrain.eastshoresit.com.au/auth/reset-password?token=...`

### **Magic Link:**
```html
<a href="{{ .ConfirmationURL }}">Sign In</a>
```
Redirects to: `https://gtstrain.eastshoresit.com.au/admin` or `/student/portal`

---

## 🔒 **Security Best Practices**

### **1. Use HTTPS Only**
- ✅ **CORRECT:** `https://gtstrain.eastshoresit.com.au`
- ❌ **WRONG:** `http://gtstrain.eastshoresit.com.au`

### **2. Wildcard Safely**
- ✅ **SAFE:** `https://gtstrain.eastshoresit.com.au/**` (your domain only)
- ❌ **UNSAFE:** `https://**` (allows ANY domain - never do this!)

### **3. Specific Paths First**
Add specific paths before wildcards:
```
1. https://gtstrain.eastshoresit.com.au/admin
2. https://gtstrain.eastshoresit.com.au/student/portal
3. https://gtstrain.eastshoresit.com.au/** (catch-all)
```

### **4. Remove Local URLs in Production**
Once deployed, you can remove:
- `http://localhost:3000/**`
- Any `127.0.0.1` URLs
- Any development/staging URLs you don't use

---

## 🎯 **Quick Reference**

### **Where to Add URLs:**
**Supabase Dashboard** → **Authentication** → **URL Configuration**

### **Required Fields:**
1. **Site URL:** `https://gtstrain.eastshoresit.com.au`
2. **Redirect URLs:** See list above (8 URLs minimum)

### **Authentication Flow:**
```
User Action → Supabase Auth → Redirect URL Check → Allow/Deny
```

### **Common Patterns:**
```
Signup:   /auth/confirm-email
Reset:    /auth/reset-password
Login:    /admin or /student/portal
Magic:    /admin or /student/portal
```

---

## 📞 **Still Having Issues?**

If you've followed all steps and authentication still fails:

1. **Check browser console** for specific error messages
2. **Verify DNS** is pointing to Vercel correctly
3. **Clear browser cache** and try incognito mode
4. **Wait 5 minutes** after saving changes (propagation time)
5. **Check Supabase logs:**
   - Dashboard → Logs → Auth logs
   - Look for redirect errors

---

## ✅ **Configuration Complete!**

Once you've added all redirect URLs and tested the authentication flow, your Supabase authentication is production-ready!

**Expected Result:**
- ✅ Signups work and redirect correctly
- ✅ Logins work for all user types
- ✅ Email confirmations redirect properly
- ✅ Password resets function correctly
- ✅ No redirect errors in browser console

---

**Next Steps After Configuration:**
1. Test all authentication flows (signup, login, reset, confirm)
2. Verify email templates are sending correctly
3. Check that users land on correct dashboards
4. Monitor Supabase auth logs for any issues

---

**Document Version:** 1.0
**Last Updated:** 2026-04-21
**Status:** ✅ READY TO IMPLEMENT