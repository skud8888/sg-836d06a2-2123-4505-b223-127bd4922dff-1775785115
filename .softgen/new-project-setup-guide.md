<![CDATA[
# GTSTrain Production Supabase Setup
**Step-by-Step Guide**

---

## 🎯 **STEP 1: Create Your Supabase Project** (3 minutes)

**Action Required:**

1. **Open:** https://supabase.com/dashboard
2. **Click:** "New Project" (green button)
3. **Fill in:**
   - **Name:** `GTSTrain Production`
   - **Database Password:** Create a strong password (SAVE IT!)
     - Example: `GTSTrain2024!Secure#Pass`
     - **IMPORTANT:** Write this down - you'll need it later
   - **Region:** `Australia Southeast (Sydney)`
     - This is closest to your users for best performance
   - **Pricing Plan:** Free (or Pro if you prefer)

4. **Click:** "Create new project"
5. **Wait:** 2-3 minutes while Supabase provisions your project

**You'll see:**
```
Setting up project...
Creating database...
Initializing storage...
Setting up authentication...
```

**When complete:** You'll see your project dashboard

---

## 🔑 **STEP 2: Get Your API Keys** (2 minutes)

**Your project is now ready! Let's get the keys.**

1. **In your new project dashboard:**
   - Click **"Settings"** (gear icon in sidebar)
   - Click **"API"** in the settings menu

2. **You'll see these important values:**

   **Copy these THREE values (one at a time):**

   📌 **Project URL:**
   ```
   https://YOUR-NEW-PROJECT-REF.supabase.co
   ```
   
   📌 **Anon/Public Key (anon key):**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
   ```
   
   📌 **Service Role Key (service_role):**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
   ```

3. **Save these somewhere safe!** You'll paste them in the next step.

**⚠️ IMPORTANT:** Never commit the Service Role Key to git - it has admin access!

---

## 📝 **STEP 3: Paste Your Keys Here**

**When you have the keys, paste them as a reply in this format:**

```
URL: https://xxxxxxxxxx.supabase.co
ANON: eyJhbGc...
SERVICE: eyJhbGc...
```

**I'll then:**
1. Update your `.env.local` file with the new keys
2. Update `src/integrations/supabase/client.ts`
3. Prepare migration commands for you

**Don't worry - this chat is private and I'll help you secure everything properly!**

---

## 🗄️ **STEP 4: Run Database Migrations** (5 minutes)

**After you provide keys, I'll give you TWO migration options:**

### **Option A: Quick Setup Script (EASIEST)** ✅
- Run ONE SQL script that creates all essential tables
- File: `quick-setup.sql` (86 lines)
- Takes 30 seconds

### **Option B: Full Migration History (RECOMMENDED)**
- Run all 33 migration files in order
- Complete database with all features
- Takes 5 minutes using Supabase SQL Editor

**I'll provide exact copy-paste commands when you're ready!**

---

## 🔐 **STEP 5: Configure Authentication URLs** (2 minutes)

**After migrations, I'll give you the exact URL configuration:**

You'll add these to your new project:
```
Site URL: https://gtstrain.eastshoresit.com.au

Redirect URLs:
- https://gtstrain.eastshoresit.com.au/**
- https://gtstrain.eastshoresit.com.au/admin
- https://gtstrain.eastshoresit.com.au/admin/**
- (+ 5 more)
```

---

## 🚀 **STEP 6: Deploy to Production** (5 minutes)

**Final steps:**
1. Update Vercel environment variables with new keys
2. Redeploy your application
3. Test authentication flows
4. Create first super admin user

---

## ✅ **What to Do Right Now**

**Complete Steps 1 & 2 above, then reply with:**

```
URL: [paste your project URL]
ANON: [paste your anon key]
SERVICE: [paste your service role key]
```

**I'll handle the rest!** 🚀

---

**Estimated time remaining:** 15 minutes after you provide keys
</file_contents>
