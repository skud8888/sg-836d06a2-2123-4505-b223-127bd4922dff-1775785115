# Production Supabase Setup Guide
**Current Status:** Using Softgen Template Project

---

## 🎯 **Your Two Options**

### **Option 1: Use Softgen Template Project** ⭐ EASIEST
Keep using `veayhprmlrhaldfoqkmm.supabase.co` and just configure it for production.

**Pros:**
- ✅ Already connected and working
- ✅ Database schema already created
- ✅ All tables and RLS policies set up
- ✅ Sample data available
- ✅ No migration needed

**Cons:**
- ⚠️ Shared with Softgen template (might reset during updates)
- ⚠️ Not fully isolated for production use

**Action Required:**
1. Add production URLs to THIS project's redirect configuration
2. Keep using the same environment variables
3. Deploy to production

---

### **Option 2: Create Your Own Supabase Project** 🔒 RECOMMENDED FOR PRODUCTION
Create a dedicated Supabase project for GTSTrain production.

**Pros:**
- ✅ Fully isolated and owned by you
- ✅ Complete control over all settings
- ✅ No conflicts with Softgen updates
- ✅ Better for production security
- ✅ Can customize as needed

**Cons:**
- ⏱️ Takes 15-20 minutes to set up
- 📋 Need to migrate database schema
- 🔧 Update environment variables

**Action Required:**
1. Create new Supabase project
2. Run migration scripts to set up database
3. Update `.env.local` with new project keys
4. Configure redirect URLs
5. Redeploy

---

## 📋 **Recommendation**

For **GTSTrain production deployment**, I recommend **Option 2** (your own project) because:
- You have full control
- No risk of template updates affecting your production
- Better isolation and security
- Professional production setup

---

## 🚀 **Option 1: Configure Softgen Template (Quick)**

If you want to go live quickly for testing/staging:

### Step 1: Add Production URLs

Go to: https://supabase.com/dashboard/project/veayhprmlrhaldfoqkmm/auth/url-configuration

**Site URL:**
```
https://gtstrain.eastshoresit.com.au
```

**Redirect URLs (add all 8):**
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

### Step 2: Deploy
Your `.env.local` already has the correct keys, so just deploy!

---

## 🔒 **Option 2: Create Your Own Project (Recommended)**

### Step 1: Create New Supabase Project

1. **Go to:** https://supabase.com/dashboard
2. **Click:** "New Project"
3. **Enter:**
   - Name: `GTSTrain Production`
   - Database Password: (create a strong password - save it!)
   - Region: `Australia Southeast (Sydney)` (closest to your users)
4. **Click:** "Create new project"
5. **Wait:** 2-3 minutes for provisioning

### Step 2: Get Your New Project Keys

1. **Go to:** Settings → API
2. **Copy these values:**
   - **Project URL:** `https://your-new-ref.supabase.co`
   - **Anon/Public Key:** `eyJhbGc...`
   - **Service Role Key:** `eyJhbGc...` (keep secret!)

### Step 3: Update Environment Variables

Update your `.env.local`:
```bash
# Replace with YOUR new project values
NEXT_PUBLIC_SUPABASE_URL=https://your-new-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 4: Run Database Migrations

You have all the migration scripts ready in `supabase/migrations/`

**Option A: Using Supabase CLI (Easiest)**
```bash
# Install Supabase CLI
npm install -g supabase

# Link to your new project
supabase link --project-ref your-new-ref

# Run all migrations
supabase db push
```

**Option B: Manual SQL (If CLI doesn't work)**

1. Go to: https://supabase.com/dashboard/project/your-new-ref/sql/new
2. Run each migration file in order:
   - Copy content from `supabase/migrations/20260410021402_migration_0c241437.sql`
   - Paste in SQL Editor
   - Click "Run"
   - Repeat for all 33 migration files in chronological order

**Option C: Use Quick Setup Script**
```bash
# Combines all essential tables into one script
# Go to Supabase SQL Editor and run:
cat quick-setup.sql
```

### Step 5: Configure Authentication

1. **Go to:** https://supabase.com/dashboard/project/your-new-ref/auth/url-configuration
2. **Site URL:**
   ```
   https://gtstrain.eastshoresit.com.au
   ```
3. **Redirect URLs:**
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

### Step 6: Enable Email Authentication

1. **Go to:** Authentication → Providers
2. **Email:** Make sure it's enabled
3. **Email Templates:** Customize if needed
4. **SMTP Settings (Optional):** Configure custom email provider

### Step 7: Set Up Storage Buckets

Run this SQL:
```sql
-- Create documents bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- Create evidence bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence', 'evidence', false);

-- Create certificates bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', false);

-- Set up RLS policies for documents bucket
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

-- Set up RLS policies for evidence bucket
CREATE POLICY "Authenticated users can upload evidence"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'evidence');

CREATE POLICY "Users can view own evidence"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'evidence');

-- Set up RLS policies for certificates bucket
CREATE POLICY "Authenticated users can view certificates"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'certificates');
```

### Step 8: Create First Admin User

1. **Sign up at:** `https://gtstrain.eastshoresit.com.au/admin/signup`
2. **Run SQL:**
   ```sql
   -- Replace with your email
   INSERT INTO user_roles (user_id, role)
   SELECT id, 'super_admin'
   FROM auth.users
   WHERE email = 'your-admin-email@example.com';
   ```

### Step 9: Deploy to Production

Update Vercel environment variables with your new Supabase credentials:

```bash
# Via Vercel Dashboard:
# 1. Go to your project → Settings → Environment Variables
# 2. Update these values:

NEXT_PUBLIC_SUPABASE_URL=https://your-new-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-new-service-role-key

# 3. Redeploy to apply changes
```

Or via CLI:
```bash
vercel env rm NEXT_PUBLIC_SUPABASE_URL
vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env rm SUPABASE_SERVICE_ROLE_KEY

vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production

vercel --prod
```

### Step 10: Verify Everything Works

**Test Checklist:**
- [ ] Homepage loads
- [ ] Admin login works
- [ ] Student signup works
- [ ] Database queries work
- [ ] File uploads work
- [ ] Email confirmations arrive
- [ ] Password reset works

---

## 🎯 **My Recommendation for You**

**For GTSTrain Production:**

1. **Short-term (This Week):**
   - Use Option 1 (Softgen template) to deploy and test
   - Add your production URLs to the existing project
   - Verify everything works end-to-end

2. **Medium-term (Within 2 Weeks):**
   - Create your own dedicated Supabase project (Option 2)
   - Migrate the database schema
   - Update environment variables
   - Redeploy to production

**Why this approach?**
- ✅ Get to production quickly
- ✅ Test with real users immediately
- ✅ Migrate to isolated project at your own pace
- ✅ No downtime during migration

---

## 📊 **Current Status**

```
Current Project:       veayhprmlrhaldfoqkmm (Softgen Template)
Production Domain:     gtstrain.eastshoresit.com.au
Environment:           .env.local configured
Database Schema:       ✅ Ready (33 migrations applied)
Redirect URLs:         ⏳ PENDING - Need to be added

Next Action:           Choose Option 1 or Option 2
```

---

## ❓ **Which Option Should You Choose?**

**Choose Option 1 (Softgen Template) if:**
- Want to deploy today/this week
- Need to test with users immediately
- Plan to migrate later
- Comfortable with shared template project

**Choose Option 2 (Own Project) if:**
- Can wait 15-20 minutes for setup
- Want full production isolation
- Ready to commit to this project long-term
- Want complete control from day 1

---

## 🚀 **Quick Decision Matrix**

| Factor | Option 1 (Template) | Option 2 (Own Project) |
|--------|-------------------|----------------------|
| **Time to Deploy** | 5 minutes | 20 minutes |
| **Isolation** | Shared | Dedicated |
| **Control** | Limited | Full |
| **Production Ready** | Yes (with caveats) | Yes (fully) |
| **Migration Later** | Possible | Not needed |
| **Best For** | Quick testing | Long-term production |

---

## 💡 **My Specific Recommendation**

Based on your production URL (`gtstrain.eastshoresit.com.au`), this appears to be a real business application. Therefore:

**🔒 Go with Option 2 (Create Your Own Project)**

The 15 extra minutes of setup will give you:
- Complete control and ownership
- Better security isolation
- No surprise changes from template updates
- Professional production setup
- Peace of mind

**Ready to proceed?** Let me know which option you choose and I'll guide you through the exact steps! 🚀

---

**Document Version:** 1.0
**Last Updated:** 2026-04-21
**Status:** ✅ AWAITING YOUR DECISION