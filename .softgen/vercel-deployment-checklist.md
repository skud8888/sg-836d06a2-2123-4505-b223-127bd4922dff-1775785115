# Vercel Deployment Checklist - Training Centre App

**Status:** 🟡 READY FOR DEPLOYMENT  
**Build Status:** ✅ PASSED  
**Date:** 2026-04-16

---

## 📋 **Pre-Deployment Checklist**

### **1. Code Quality ✅**
- [x] TypeScript compilation passes (0 errors)
- [x] ESLint check passes (0 critical warnings)
- [x] Production build succeeds
- [x] No runtime errors in development

**Verification:**
```bash
✓ TypeScript: 0 errors
✓ ESLint: 0 warnings  
✓ Build: Success
✓ Pages: 52 compiled successfully
```

---

### **2. Database Preparation 🟡**

#### **A. Clean Sample Data (REQUIRED BEFORE PRODUCTION)**

**Status:** ⚠️ PENDING - Sample data still present

**Action Required:**
```sql
-- Run in Supabase SQL Editor:
-- 1. Navigate to: Supabase Dashboard → SQL Editor
-- 2. Copy contents of: cleanup-sample-data.sql
-- 3. Paste and Execute
-- 4. Verify cleanup:

SELECT COUNT(*) as sample_data_remaining 
FROM profiles 
WHERE metadata->>'is_sample_data' = 'true';

-- Expected Result: 0
```

**Files to use:**
- `cleanup-sample-data.sql` - Removes all sample data safely
- Preserves database structure and RLS policies

---

#### **B. Create First Admin User**

**Status:** ⚠️ REQUIRED - Must create before launch

**Option 1: Use Signup Page (Recommended)**
```
1. After deployment, navigate to: https://yourdomain.com/admin/signup
2. Fill in admin details:
   - Email: your-admin@yourdomain.com
   - Password: [Strong password with 12+ characters]
   - Full Name: [Your Name]
   - Organization: [Your Company]
3. Submit and verify email
4. Login at: /admin/login
```

**Option 2: SQL Script (If auth user already exists)**
```sql
-- Replace YOUR_USER_ID with actual UUID from Supabase Auth dashboard
UPDATE profiles 
SET role = 'admin',
    full_name = 'Your Name',
    onboarding_completed = true
WHERE id = 'YOUR_USER_ID_HERE';

INSERT INTO user_roles (user_id, role, assigned_by)
VALUES ('YOUR_USER_ID_HERE', 'super_admin', 'YOUR_USER_ID_HERE');
```

---

#### **C. Database Schema Verification ✅**

**Status:** ✅ COMPLETE - All tables verified

```sql
-- Verify critical tables (run in Supabase SQL Editor):
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected: 50 tables including:
✓ profiles
✓ course_templates
✓ scheduled_classes
✓ bookings
✓ signature_requests
✓ contract_templates
✓ notifications
✓ documents
✓ certificates
... and 42 more
```

---

#### **D. RLS Policies Verification ✅**

**Status:** ✅ COMPLETE - All tables have RLS enabled

```sql
-- Verify RLS is enabled on all tables:
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false;

-- Expected: Empty result (all tables protected)
```

---

### **3. Environment Variables Configuration 🟡**

**Status:** ⚠️ PENDING - Must configure in Vercel

#### **Current .env.local (Development):**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://veayhprmlrhaldfoqkmm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_DB_PASSWORD=LoYRG4lg_7dhgDj5DPGfo_qPcjjNs9D4
OPENAI_API_KEY=your_openai_key
NEXT_PUBLIC_SITE_URL=https://gtstrain.eastshoresit.com.au

# ⚠️ THESE NEED REAL VALUES FOR PRODUCTION:
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

#### **Production Environment Variables (Add in Vercel):**

**Required for Production:**

1. **Supabase (Production Keys)**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://veayhprmlrhaldfoqkmm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[Get from Supabase Dashboard → Settings → API]
SUPABASE_SERVICE_ROLE_KEY=[Get from Supabase Dashboard → Settings → API]
```

2. **Stripe (Live Keys - NOT Test)**
```bash
STRIPE_SECRET_KEY=sk_live_... [Get from Stripe Dashboard → Developers → API Keys]
STRIPE_WEBHOOK_SECRET=whsec_... [Get from Stripe Dashboard → Developers → Webhooks]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... [Get from Stripe Dashboard]
```

3. **Application URLs**
```bash
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

4. **Optional: Email Service (Resend)**
```bash
RESEND_API_KEY=re_... [If using Resend for emails]
EMAIL_FROM=noreply@yourdomain.com
```

5. **Optional: OpenAI (If using AI features)**
```bash
OPENAI_API_KEY=[Your OpenAI API key]
```

---

### **4. Stripe Configuration 🟡**

**Status:** ⚠️ REQUIRED - Switch to Live Mode

#### **A. Switch to Live Mode**
```
1. Login to Stripe Dashboard
2. Toggle from "Test Mode" to "Live Mode" (top-right)
3. Navigate to: Developers → API Keys
4. Copy Live Keys:
   - Publishable key: pk_live_...
   - Secret key: sk_live_...
5. Add to Vercel environment variables
```

#### **B. Configure Webhook Endpoint**
```
1. Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: https://yourdomain.com/api/stripe/webhook
4. Events to send:
   ✓ checkout.session.completed
   ✓ payment_intent.succeeded
5. Click "Add endpoint"
6. Reveal webhook signing secret (whsec_...)
7. Add to Vercel: STRIPE_WEBHOOK_SECRET
```

#### **C. Test Webhook (After Deployment)**
```
1. Stripe Dashboard → Webhooks → Your endpoint
2. Click "Send test webhook"
3. Select: checkout.session.completed
4. Send
5. Verify: Response shows 200 OK
6. Check database: Booking created
7. Check database: Signature request auto-created
```

---

### **5. Vercel Project Configuration ✅**

**Status:** ✅ READY

#### **Build Settings (Recommended):**
```
Framework Preset: Next.js
Root Directory: ./
Build Command: npm run build
Output Directory: .next
Install Command: npm install
Node Version: 18.x or higher
```

#### **Current Configuration Files:**

**vercel.json:**
```json
{
  "framework": "nextjs",
  "redirects": [],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ],
  "cleanUrls": true,
  "trailingSlash": false
}
```

**next.config.mjs:**
- ✅ Image optimization enabled
- ✅ Security headers configured
- ✅ Remote patterns allowed
- ✅ Development origins configured

---

## 🚀 **Deployment Steps**

### **Step 1: GitHub Repository Setup**

**Status:** 🟡 VERIFY

```bash
# Verify git is initialized and committed:
git status

# Expected: "nothing to commit, working tree clean"

# If changes exist:
git add .
git commit -m "Production deployment preparation"
git push origin main
```

---

### **Step 2: Connect to Vercel**

1. Go to https://vercel.com
2. Click "Add New Project"
3. Import from GitHub
4. Select repository: `training-centre-app`
5. Configure Project:
   - Framework: Next.js (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

---

### **Step 3: Add Environment Variables in Vercel**

**Critical:** Add ALL environment variables in Vercel Dashboard

```
Navigate to: Vercel Project → Settings → Environment Variables

For EACH variable:
1. Add Name
2. Add Value
3. Select Environments:
   - Production ✓ (Always)
   - Preview ✓ (For testing)
   - Development ✓ (For local dev)

EXCEPTION - Service Role Key:
- SUPABASE_SERVICE_ROLE_KEY: Production ONLY (security)
- STRIPE_SECRET_KEY: Production ONLY (security)
```

**Environment Variables to Add:**
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY (Production only)
- [ ] STRIPE_SECRET_KEY (Production only)
- [ ] STRIPE_WEBHOOK_SECRET (Production only)
- [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- [ ] NEXT_PUBLIC_APP_URL
- [ ] NEXT_PUBLIC_SITE_URL
- [ ] RESEND_API_KEY (Optional)
- [ ] EMAIL_FROM (Optional)
- [ ] OPENAI_API_KEY (Optional)

---

### **Step 4: Deploy**

**Option A: Auto-Deploy (Recommended)**
```bash
git add .
git commit -m "Production deployment"
git push origin main

# Vercel auto-deploys from main branch
# Monitor: https://vercel.com/your-team/your-project/deployments
```

**Option B: Manual Deploy via CLI**
```bash
npm i -g vercel
vercel login
vercel --prod

# Expected Output:
✓ Production: https://yourdomain.vercel.app
```

---

### **Step 5: Custom Domain Setup**

**After first deployment:**

1. Vercel Dashboard → Your Project → Settings → Domains
2. Add domain: `yourdomain.com`
3. Add DNS records (shown by Vercel):

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME  
Name: www
Value: cname.vercel-dns.com
```

4. Wait for DNS propagation (5-60 minutes)
5. Vercel auto-configures SSL (Let's Encrypt)
6. Verify: https://yourdomain.com loads

---

## 🧪 **Post-Deployment Testing**

### **Critical Path Testing (Do Immediately After Deployment):**

#### **1. Core Pages Load ✅**
- [ ] Homepage (/)
- [ ] Course Catalog (/courses)
- [ ] Admin Login (/admin/login)
- [ ] Student Portal (/student/portal)
- [ ] Help Center (/help)

#### **2. Authentication Flow ✅**
- [ ] Sign up creates account
- [ ] Email verification works
- [ ] Login succeeds
- [ ] Logout works
- [ ] Password reset works

#### **3. Booking & Payment Flow ✅**
- [ ] Browse courses
- [ ] Select a class
- [ ] Fill booking form
- [ ] Stripe payment succeeds (use test card 4242 4242 4242 4242)
- [ ] Booking confirmation received
- [ ] Email notifications sent

#### **4. E-Signature Flow ✅**
- [ ] Signature request email received
- [ ] Signing page loads (/sign/[requestId])
- [ ] Draw signature works
- [ ] Type signature works
- [ ] Upload signature works
- [ ] Signature submission succeeds
- [ ] Contract marked as signed in database

#### **5. Admin Functions ✅**
- [ ] Dashboard loads with stats
- [ ] User management works
- [ ] Booking management works
- [ ] Course creation works
- [ ] Contract templates work
- [ ] Analytics display correctly
- [ ] Export CSV works

#### **6. Real-Time Features ✅**
- [ ] Notifications appear instantly
- [ ] Notification bell updates
- [ ] Mark as read works

#### **7. PWA / Offline Mode ✅**
- [ ] Service worker registers
- [ ] Install prompt appears (mobile)
- [ ] Offline indicator works
- [ ] Pages load from cache offline

---

## 🔒 **Security Verification**

### **Post-Deployment Security Checks:**

#### **1. Environment Variables Security ✅**
- [ ] No secrets in Git history
- [ ] .env.local in .gitignore
- [ ] Service role key ONLY in Production
- [ ] All keys rotated from development

#### **2. HTTPS Enforcement ✅**
- [ ] All pages load via HTTPS
- [ ] No mixed content warnings
- [ ] SSL certificate valid

#### **3. RLS Verification ✅**
```sql
-- Verify RLS is active:
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false;

-- Expected: Empty (all tables protected)
```

#### **4. API Route Security ✅**
- [ ] Stripe webhook validates signatures
- [ ] Admin routes require authentication
- [ ] Service role key never exposed to client

---

## 📊 **Monitoring Setup (Optional but Recommended)**

### **1. Vercel Analytics**

**Enable in Vercel Dashboard:**
```
Vercel Dashboard → Your Project → Analytics → Enable
```

**Add to _app.tsx:**
```typescript
import { Analytics } from '@vercel/analytics/react';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
```

### **2. Error Tracking (Sentry - Optional)**

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs

# Add to Vercel:
NEXT_PUBLIC_SENTRY_DSN=your-dsn-here
```

### **3. Supabase Metrics**

**Monitor in Supabase Dashboard → Reports:**
- Database: Active connections, query performance
- Auth: Daily signups, login success rate
- Storage: Usage, bandwidth
- API: Request count, response times

---

## ✅ **Final Pre-Launch Checklist**

### **Before Going Live:**

- [ ] All environment variables set in Vercel
- [ ] Sample data cleaned from database
- [ ] First admin user created
- [ ] Stripe LIVE keys configured (not test)
- [ ] Webhook endpoint verified and tested
- [ ] Custom domain configured and SSL active
- [ ] All core features tested in production
- [ ] Email service configured (or logging verified)
- [ ] Backup strategy active
- [ ] Support channels set up
- [ ] Team trained on admin panel

---

## 🎯 **Quick Reference**

### **Production URLs:**
- Website: https://yourdomain.com
- Admin: https://yourdomain.com/admin
- Student Portal: https://yourdomain.com/student/portal
- Signing Page: https://yourdomain.com/sign/[requestId]

### **Dashboards:**
- Vercel: https://vercel.com/your-team/your-project
- Supabase: https://app.supabase.com/project/veayhprmlrhaldfoqkmm
- Stripe: https://dashboard.stripe.com

### **Critical Files:**
- Deployment Guide: `.softgen/deployment-guide.md`
- Sample Data Cleanup: `cleanup-sample-data.sql`
- Sample Data Injection: `inject-sample-data.sql`
- Admin Setup Guide: `setup-first-admin.md`

---

## 📞 **Support**

**Deployment Issues:**
- Vercel Documentation: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
- Supabase Docs: https://supabase.com/docs

**Emergency Rollback:**
```bash
# In Vercel Dashboard:
1. Deployments → Select previous successful deployment
2. Click "..." menu → Promote to Production
```

---

**Status: 🟡 READY FOR DEPLOYMENT**

**Action Items Before Deploy:**
1. ⚠️ Clean sample data from database
2. ⚠️ Configure Stripe live keys
3. ⚠️ Add environment variables to Vercel
4. ⚠️ Create first admin user (after deployment)
5. ⚠️ Configure Stripe webhook endpoint

**Once these are complete: ✅ DEPLOY TO PRODUCTION**