# User Creation Error - Troubleshooting Guide

**Error:** `"failed to execute json on response unexpected token <!doctype is not valid JSON"`

**Date:** 2026-04-14  
**Status:** 🔧 TROUBLESHOOTING IN PROGRESS

---

## 🔍 **What This Error Means**

This error occurs when the API endpoint returns **HTML** (an error page) instead of **JSON** (expected data).

**Why This Happens:**
1. **Missing environment variables** → API can't connect to Supabase
2. **Server-side error** → Next.js shows error page (HTML)
3. **API route not loaded** → Next.js 404 page (HTML)

---

## 🧪 **Diagnostic Steps (Do These First)**

### **Step 1: Check Environment Variables**

**Open Terminal:**
```bash
# Check if environment variables are set
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

**Expected:**
```bash
# Should show your Supabase URL
https://xxxxx.supabase.co

# Should show long key (NOT anon key)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M... (very long)
```

**If Either Is Empty:**
```bash
# Check .env.local file
cat .env.local

# Should contain:
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

### **Step 2: Test Diagnostic Endpoint**

**In Browser:**
```
URL: http://localhost:3000/api/admin/test-auth
```

**Expected Response (Good):**
```json
{
  "checks": {
    "supabase_url": true,
    "service_role_key": true,
    "service_role_key_length": 300+
  },
  "adminClientWorks": true,
  "adminClientError": null,
  "hasAuthHeader": false,
  "message": "✅ Environment setup looks good!"
}
```

**Bad Response (Problem Found):**
```json
{
  "checks": {
    "supabase_url": true,
    "service_role_key": false,  ← PROBLEM!
    "service_role_key_length": 0
  },
  "adminClientWorks": false,
  "adminClientError": "Invalid API key",
  "message": "❌ Environment setup has issues"
}
```

---

### **Step 3: Check Server Logs**

**In Terminal (where server is running):**
```bash
# Look for errors when creating user
# Should see detailed logs we added:

"Create user request received"
"User authenticated: [user-id]"
"Creating user with email: test@example.com"
"User created: [new-user-id]"
```

**If You See HTML in Response:**
```
<!DOCTYPE html>  ← This means error page returned
<html>
  <head>
    <title>500 - Internal Server Error</title>
```

This confirms the API is crashing and returning error page.

---

## 🔧 **Solutions (Based on Diagnostic Results)**

### **Solution 1: Missing SUPABASE_SERVICE_ROLE_KEY**

**Symptom:**
- Diagnostic shows `service_role_key: false`
- Service role key length is 0 or very small

**Fix:**

**1. Get Service Role Key from Supabase:**
```bash
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Settings → API
4. Copy "service_role" key (NOT anon key!)
5. Should be ~300+ characters long
```

**2. Add to .env.local:**
```bash
# Open .env.local
nano .env.local

# Add or update this line:
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...

# Save (Ctrl+O, Enter, Ctrl+X)
```

**3. Restart Server:**
```bash
pm2 restart all
```

**4. Test Again:**
```
Go to: /admin/users
Try creating user
Should work now ✅
```

---

### **Solution 2: Wrong Service Role Key (Anon Key Used)**

**Symptom:**
- Key exists but adminClientWorks: false
- Error: "Invalid API key" or "Insufficient permissions"

**Fix:**

**1. Verify You're Using Service Role Key:**
```bash
# In .env.local, check key starts with:
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...

# NOT:
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xl...
                                                                    ^^^^
                                                    (anon keys have "role" here)
```

**2. Double-Check in Supabase Dashboard:**
```
Settings → API
- anon / public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xl... (WRONG)
- service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M... (CORRECT ✅)
```

**3. Replace in .env.local:**
```bash
SUPABASE_SERVICE_ROLE_KEY=[paste service_role key here]
```

**4. Restart:**
```bash
pm2 restart all
```

---

### **Solution 3: API Route Not Loading**

**Symptom:**
- Browser shows 404 error
- Or HTML page instead of JSON

**Fix:**

**1. Check API File Exists:**
```bash
ls -la src/pages/api/admin/create-user.ts

# Should show:
-rw-r--r-- 1 user user 4500 Apr 14 10:00 src/pages/api/admin/create-user.ts
```

**2. Rebuild Next.js:**
```bash
# Stop server
pm2 stop all

# Clear Next.js cache
rm -rf .next

# Restart
pm2 restart all
```

**3. Test:**
```
URL: http://localhost:3000/api/admin/create-user
Method: GET (should return 405 Method Not Allowed - this is GOOD!)
```

---

### **Solution 4: Vercel/Production Environment**

**If Running on Vercel:**

**1. Add Environment Variables in Vercel:**
```
1. Go to: https://vercel.com/dashboard
2. Select project
3. Settings → Environment Variables
4. Add:
   Name: SUPABASE_SERVICE_ROLE_KEY
   Value: [paste service role key]
5. Redeploy
```

**2. Verify Deployment:**
```bash
# Check production URL
curl https://your-app.vercel.app/api/admin/test-auth

# Should return JSON with "adminClientWorks": true
```

---

## 🧪 **Complete Test Procedure**

### **After Applying Fix:**

**1. Restart Everything:**
```bash
pm2 restart all
```

**2. Run Diagnostic:**
```
Browser: http://localhost:3000/api/admin/test-auth
Expected: "✅ Environment setup looks good!"
```

**3. Test User Creation:**
```bash
# 1. Login
URL: /admin/login
Email: admin.demo@example.com
Password: SamplePass123!

# 2. Go to users
URL: /admin/users

# 3. Create user
Click: "Create User"
Email: test@example.com
Password: TestPass123!
Full Name: Test User
Role: Student

# 4. Submit
Click: "Create User"

# EXPECTED:
✅ Success message
✅ Modal closes
✅ User appears in list
✅ NO HTML/JSON errors

# IF STILL ERROR:
Check browser console (F12)
Check server logs
Share error message
```

---

## 📋 **Error Message Reference**

### **Error: "unexpected token <!doctype"**
**Cause:** API returning HTML error page  
**Fix:** Apply Solution 1, 2, or 3 above

### **Error: "Invalid API key"**
**Cause:** Wrong key (anon instead of service_role)  
**Fix:** Apply Solution 2

### **Error: "Failed to fetch"**
**Cause:** API route doesn't exist or server down  
**Fix:** Apply Solution 3

### **Error: "Unauthorized - Invalid token"**
**Cause:** Your login session expired  
**Fix:** Logout and login again

### **Error: "Forbidden - Super Admin access required"**
**Cause:** Logged-in user is not super_admin  
**Fix:** Login with super_admin account

---

## 🔍 **Advanced Debugging**

### **Check API Response Manually:**

**Using curl:**
```bash
# 1. Get your session token
# (Login to /admin/login, open DevTools → Application → Local Storage → find token)

# 2. Test API
curl -X POST http://localhost:3000/api/admin/create-user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "fullName": "Test User",
    "role": "student"
  }'

# Expected: JSON response
# {"success":true,"user":{"id":"...","email":"test@example.com"}}

# If HTML: Environment issue
# If JSON error: Check error message
```

---

## ✅ **Verification Checklist**

**Before Testing User Creation:**

- [ ] `.env.local` file exists in project root
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set (300+ chars)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set
- [ ] Server restarted after adding keys
- [ ] Diagnostic endpoint returns "✅ Environment setup looks good!"
- [ ] Logged in as super_admin user
- [ ] Browser console clear of errors (F12)

**If All Checked:**
✅ User creation should work!

---

## 🆘 **Still Not Working?**

### **Collect This Information:**

1. **Diagnostic endpoint response:**
   ```
   Copy full JSON from: /api/admin/test-auth
   ```

2. **Browser console error:**
   ```
   F12 → Console → Copy full error
   ```

3. **Server logs:**
   ```
   Check terminal where server is running
   Copy any error messages
   ```

4. **Environment check:**
   ```bash
   cat .env.local | grep SUPABASE
   # (Redact actual keys, just show format)
   ```

5. **API file exists:**
   ```bash
   ls -la src/pages/api/admin/create-user.ts
   ```

**Share These 5 Items for Further Help**

---

## 📖 **Quick Reference**

**Diagnostic URL:**
```
http://localhost:3000/api/admin/test-auth
```

**Environment File:**
```
.env.local (project root)
```

**Restart Command:**
```bash
pm2 restart all
```

**Get Service Role Key:**
```
Supabase Dashboard → Settings → API → service_role
```

---

**Common Cause (90% of cases):**
❌ Missing or wrong `SUPABASE_SERVICE_ROLE_KEY`

**Quick Fix:**
1. Get service_role key from Supabase
2. Add to .env.local
3. Restart server
4. Test again

---

**🎯 Follow this guide step-by-step and user creation will work!** ✅