# GTSTrain Production Deployment - Final Steps
**Status:** ✅ DATABASE READY - Auth Configuration Needed

---

## ✅ **What's Already Done**

```
✅ Supabase Project Created: yiqgncisrdbwogdkcnnn
✅ Database Schema: 78 tables created
✅ RLS Policies: All enforced
✅ Storage Buckets: 3 buckets configured
✅ Environment Variables: .env.local updated
✅ Application Code: Connected to new project
✅ Server: Restarted with new configuration
✅ Build: 0 errors, 0 warnings
```

---

## 🎯 **What You Need to Do Now**

### **1. Configure Authentication Redirect URLs** (2 minutes)

Your users need to be redirected properly after login/signup.

**Go to:** https://supabase.com/dashboard/project/yiqgncisrdbwogdkcnnn/auth/url-configuration

**Add Site URL:**
```
https://gtstrain.eastshoresit.com.au
```

**Add Redirect URLs** (click "Add URL" for each):
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

**Click:** "Save" at the bottom

---

### **2. Create Your First Admin User** (3 minutes)

**Option A: Using Supabase Dashboard** (Recommended)

1. **Go to:** https://supabase.com/dashboard/project/yiqgncisrdbwogdkcnnn/auth/users
2. **Click:** "Add User"
3. **Fill in:**
   - Email: your-email@example.com
   - Password: YourSecurePassword123!
   - Auto Confirm User: ✅ **ENABLE THIS**
4. **Click:** "Create User"

Then run this SQL to make them admin:

5. **Go to:** https://supabase.com/dashboard/project/yiqgncisrdbwogdkcnnn/sql/new
6. **Paste:**
```sql
INSERT INTO user_roles (user_id, role, assigned_by)
SELECT id, 'super_admin', id
FROM auth.users
WHERE email = 'your-email@example.com'; -- ← Your actual email
```
7. **Click:** "Run"

**Option B: Using Quick Setup Script**

See `setup-first-admin.md` for detailed instructions.

---

### **3. Deploy to Production** (5 minutes)

**Update Vercel Environment Variables:**

1. **Go to:** https://vercel.com/dashboard
2. **Select** your GTSTrain project
3. **Go to:** Settings → Environment Variables
4. **Update these values:**

```
NEXT_PUBLIC_SUPABASE_URL=https://yiqgncisrdbwogdkcnnn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpcWduY2lzcmRid29nZGtjbm5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NjAzMzcsImV4cCI6MjA5MjUzNjMzN30.eq8-VutlMItW14BeqgKpgaKa6iV49pb4A_WUrm6BfLU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpcWduY2lzcmRid29nZGtjbm5uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njk2MDMzNywiZXhwIjoyMDkyNTM2MzM3fQ.xLVYXVsjgh8i0F8ntO3IRdR-D-o1Bs0MwsarxraDmlQ
NEXT_PUBLIC_SITE_URL=https://gtstrain.eastshoresit.com.au
```

5. **Click:** "Save"
6. **Redeploy:** Click "Deployments" → "..." → "Redeploy"

---

## ✅ **Verification Checklist**

After deployment, test these:

### **Authentication**
- [ ] Visit: https://gtstrain.eastshoresit.com.au/admin/login
- [ ] Login with your admin credentials
- [ ] Verify redirect to admin dashboard works
- [ ] Try logging out and back in

### **Student Portal**
- [ ] Visit: https://gtstrain.eastshoresit.com.au/student/portal
- [ ] Click "Sign Up"
- [ ] Create a test student account
- [ ] Verify email confirmation works
- [ ] Login to student portal

### **Public Pages**
- [ ] Homepage: https://gtstrain.eastshoresit.com.au
- [ ] Courses: https://gtstrain.eastshoresit.com.au/courses
- [ ] Contact: https://gtstrain.eastshoresit.com.au/contact
- [ ] About: https://gtstrain.eastshoresit.com.au/about

### **Admin Features**
- [ ] Create a user in `/admin/users`
- [ ] Upload a document
- [ ] View analytics dashboard
- [ ] Check audit logs

---

## 📊 **Your New Production Setup**

```
Project Name:        GTSTrain Production
Project Ref:         yiqgncisrdbwogdkcnnn
Region:              Australia Southeast (Sydney)
Database Tables:     78 tables
Storage Buckets:     3 buckets (documents, evidence, certificates)
RLS Policies:        Enforced on all tables
Environment:         Production-ready
Status:              ✅ ACTIVE
```

**Dashboard:** https://supabase.com/dashboard/project/yiqgncisrdbwogdkcnnn

---

## 🎯 **Next Steps After Deployment**

### **Immediate (Today)**
1. Create your first admin user
2. Test login/signup flows
3. Upload a test document
4. Create a sample course

### **This Week**
1. Add real course content
2. Invite trainer users
3. Test booking flow end-to-end
4. Configure Stripe (if using payments)

### **This Month**
1. Add sample data for testing
2. Train your team on admin features
3. Set up email templates
4. Configure backup automation

---

## 🔧 **Troubleshooting**

### **"Invalid redirect URL" error**
- Make sure you added all 8 redirect URLs in Step 1
- Check Site URL is set correctly
- Verify no typos in URLs

### **Login not working**
- Check you created user with "Auto Confirm" enabled
- Verify user has super_admin role in user_roles table
- Try password reset flow

### **Database connection error**
- Verify environment variables in Vercel match your new project
- Check Supabase project is not paused
- Redeploy after updating environment variables

### **Build fails**
- Check all environment variables are set in Vercel
- Verify no syntax errors (build passed locally)
- Check deployment logs for specific error

---

## 📚 **Documentation Reference**

- **Quick Admin Setup:** `setup-first-admin.md`
- **Full Setup Guide:** `.softgen/production-supabase-setup.md`
- **Deployment Checklist:** `.softgen/deployment-checklist.md`
- **Redirect URLs:** `.softgen/supabase-redirect-setup.md`

---

## 🎉 **You're Almost There!**

**What's left:**
1. ⏳ Add redirect URLs (2 minutes)
2. ⏳ Create first admin (3 minutes)
3. ⏳ Deploy to Vercel (5 minutes)

**Total remaining time:** ~10 minutes

**Then you're LIVE!** 🚀

---

**Document Version:** 1.0
**Last Updated:** 2026-04-21
**Status:** ✅ READY FOR FINAL DEPLOYMENT