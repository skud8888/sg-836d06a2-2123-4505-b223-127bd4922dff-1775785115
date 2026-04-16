<![CDATA[
# Final Deployment Steps - Production Launch

**Status:** 🚀 READY TO DEPLOY  
**Last Check:** 2026-04-16T03:11:00Z  
**Build Status:** ✅ PASSED  
**Edge Functions:** ✅ DEPLOYED  

---

## ✅ **Pre-Deployment Verification Complete**

### Build & Code Quality
- ✅ TypeScript: 0 errors
- ✅ ESLint: 0 warnings  
- ✅ Production build: SUCCESS
- ✅ 52 pages compiled
- ✅ All features tested

### Database
- ✅ 56 tables with RLS
- ✅ 80+ foreign key constraints
- ✅ 120+ performance indexes
- ✅ Full-text search configured
- ✅ All audit logging enabled

### Edge Functions Deployed
- ✅ **backup-database** - Daily automated backups
- ✅ **notification-scheduler** - Automated reminders

---

## 🎯 **Deployment Workflow - Step by Step**

### **STEP 1: Clean Sample Data** (5 minutes)

**Action:** Remove all test/sample data from production database

```sql
-- Run this in Supabase SQL Editor
-- File: cleanup-sample-data.sql

-- Delete sample data from all tables
DELETE FROM class_attendance WHERE metadata->>'is_sample_data' = 'true';
DELETE FROM enrollments WHERE metadata->>'is_sample_data' = 'true';
DELETE FROM bookings WHERE metadata->>'is_sample_data' = 'true';
DELETE FROM enquiries WHERE metadata->>'is_sample_data' = 'true';
DELETE FROM scheduled_classes WHERE metadata->>'is_sample_data' = 'true';
DELETE FROM course_templates WHERE metadata->>'is_sample_data' = 'true';
DELETE FROM profiles WHERE metadata->>'is_sample_data' = 'true';

-- Verify cleanup (should return 0 for all)
SELECT 
  'bookings' as table_name, 
  COUNT(*) as remaining_sample_records 
FROM bookings 
WHERE metadata->>'is_sample_data' = 'true'
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles WHERE metadata->>'is_sample_data' = 'true'
UNION ALL
SELECT 'courses', COUNT(*) FROM course_templates WHERE metadata->>'is_sample_data' = 'true';

-- Expected result: All counts should be 0
```

**Verification:**
- [ ] Sample data deleted
- [ ] Verification query returns 0 for all tables
- [ ] Database is clean for production

---

### **STEP 2: Get Production API Keys** (10 minutes)

#### 2.1 Supabase Keys
**Location:** Supabase Dashboard → Settings → API

Required keys:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...  # Public anon key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...      # Service role key (KEEP SECRET!)
```

#### 2.2 Stripe Live Keys
**Location:** Stripe Dashboard → Switch to "Live Mode" → Developers → API Keys

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
# Webhook secret comes after Step 5
```

⚠️ **IMPORTANT:** Make sure you've switched Stripe to LIVE MODE before copying keys!

#### 2.3 Optional Services (if used)

**Twilio** (SMS notifications)
```bash
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
```

**Resend** (Email)
```bash
RESEND_API_KEY=re_...
```

**QuickBooks** (Accounting integration)
```bash
QBO_CLIENT_ID=...
QBO_CLIENT_SECRET=...
```

**Verification:**
- [ ] All required keys collected
- [ ] Stripe is in LIVE mode
- [ ] Keys are stored securely (password manager)

---

### **STEP 3: Deploy to Vercel** (5 minutes)

#### 3.1 Connect Repository
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Framework Preset: **Next.js** (auto-detected)

#### 3.2 Configure Environment Variables
Add all environment variables from Step 2:

**Required:**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
```

**Optional (if using):**
```
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
RESEND_API_KEY
QBO_CLIENT_ID
QBO_CLIENT_SECRET
```

#### 3.3 Build Settings
- Build Command: `npm run build` (default)
- Output Directory: `.next` (default)
- Install Command: `npm install` (default)
- Node Version: 18.x or higher

#### 3.4 Deploy
- Click "Deploy"
- Wait ~2-3 minutes for build
- Note your deployment URL: `https://your-project.vercel.app`

**Verification:**
- [ ] Build completed successfully
- [ ] Deployment URL accessible
- [ ] Home page loads correctly
- [ ] No console errors

---

### **STEP 4: Configure Stripe Webhook** (5 minutes)

#### 4.1 Create Webhook Endpoint
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://your-project.vercel.app/api/stripe/webhook`
4. Listen to events: Select "checkout.session.completed" and "payment_intent.succeeded"
5. Click "Add endpoint"

#### 4.2 Get Webhook Secret
1. Click on the newly created webhook
2. Copy "Signing secret" (starts with `whsec_`)
3. Add to Vercel environment variables:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `STRIPE_WEBHOOK_SECRET=whsec_...`
   - Click "Save"

#### 4.3 Redeploy
- Go to Vercel Dashboard → Deployments
- Click "..." on latest deployment → Redeploy
- This picks up the new webhook secret

**Verification:**
- [ ] Webhook endpoint created
- [ ] Webhook secret added to Vercel
- [ ] Application redeployed
- [ ] Test webhook in Stripe Dashboard (Send test event)

---

### **STEP 5: Configure Supabase Edge Functions** (10 minutes)

#### 5.1 Create Storage Bucket
1. Supabase Dashboard → Storage → New Bucket
2. Name: `backups`
3. Public: **No** (private)
4. File size limit: 50 MB
5. Allowed MIME types: `application/json`
6. Click "Create bucket"

#### 5.2 Set Up Cron Jobs
Run this in Supabase SQL Editor:

```sql
-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Daily database backup at 2 AM UTC
SELECT cron.schedule(
  'daily-database-backup',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/backup-database',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Notification scheduler every 6 hours
SELECT cron.schedule(
  'notification-scheduler',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/notification-scheduler',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Verify cron jobs created
SELECT * FROM cron.job;
```

Replace:
- `YOUR_PROJECT_REF` with your Supabase project reference
- `YOUR_SERVICE_ROLE_KEY` with your service role key from Step 2.1

**Verification:**
- [ ] Storage bucket created
- [ ] Cron jobs scheduled
- [ ] `SELECT * FROM cron.job;` shows 2 jobs

---

### **STEP 6: Create First Admin User** (2 minutes)

⚠️ **CRITICAL:** Do this immediately after deployment!

1. Visit: `https://your-project.vercel.app/admin/signup`
2. Create your super admin account:
   - Email: your-email@company.com
   - Password: Strong password (16+ chars, mixed case, numbers, symbols)
   - Full Name: Your Name
   - Role: Super Admin (selected by default)
3. Click "Create Account"
4. Check email for verification (if email is configured)
5. Log in at: `https://your-project.vercel.app/admin/login`

**Verification:**
- [ ] Admin account created
- [ ] Can log in to admin dashboard
- [ ] All admin features accessible

---

### **STEP 7: Test Critical User Flows** (15 minutes)

#### 7.1 Course Creation
- [ ] Create a test course template
- [ ] Schedule a test class
- [ ] Assign yourself as trainer

#### 7.2 Booking Flow
- [ ] Visit course page as student (incognito mode)
- [ ] Book a class
- [ ] Complete Stripe payment (use test card: 4242 4242 4242 4242)
- [ ] Verify payment confirmation email sent
- [ ] Check booking appears in admin dashboard
- [ ] Verify Stripe payment recorded

#### 7.3 E-Signature
- [ ] Create contract template (Admin → Templates)
- [ ] Generate contract from booking (Admin → Bookings → Select booking → Signatures → Send)
- [ ] Check email for signature request
- [ ] Sign contract (draw/type/upload signature)
- [ ] Verify signed contract appears in admin dashboard

#### 7.4 Certificate Generation
- [ ] Mark test booking as completed
- [ ] Generate certificate (Admin → Certificates)
- [ ] Verify PDF downloads
- [ ] Check certificate in student portal

#### 7.5 Field Operations (if applicable)
- [ ] Test attendance marking (Admin → Calendar → Class → Mark Attendance)
- [ ] Test evidence capture
- [ ] Verify offline mode works

**Verification:**
- [ ] All flows completed successfully
- [ ] No errors in browser console
- [ ] Emails delivered (if configured)
- [ ] Data appears correctly in admin dashboard

---

### **STEP 8: Configure Custom Domain** (Optional - 10 minutes)

#### 8.1 Add Domain in Vercel
1. Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain: `app.yourcompany.com`
3. Note the DNS records shown

#### 8.2 Update DNS Records
In your DNS provider (Cloudflare, GoDaddy, etc.):
- Add CNAME record: `app` → `cname.vercel-dns.com`
- Or A record to Vercel's IP (as shown in Vercel dashboard)

#### 8.3 Wait for Propagation
- Usually takes 5-30 minutes
- Vercel will auto-provision SSL certificate

#### 8.4 Update Stripe Webhook
- Update webhook URL to: `https://app.yourcompany.com/api/stripe/webhook`

**Verification:**
- [ ] Domain DNS configured
- [ ] SSL certificate issued (green padlock)
- [ ] Stripe webhook updated
- [ ] Application accessible via custom domain

---

### **STEP 9: Post-Deployment Configuration** (5 minutes)

#### 9.1 Update Auth Redirect URLs
Supabase Dashboard → Authentication → URL Configuration

Add production URLs:
```
Site URL: https://your-project.vercel.app (or custom domain)

Redirect URLs:
https://your-project.vercel.app/**
https://app.yourcompany.com/** (if using custom domain)
```

#### 9.2 Configure Email Templates (Optional)
Supabase Dashboard → Authentication → Email Templates

Customize:
- Confirmation email
- Password reset email
- Magic link email

#### 9.3 Enable Analytics (Optional)
Vercel Dashboard → Your Project → Analytics
- Enable Web Analytics
- Enable Speed Insights

**Verification:**
- [ ] Auth redirects work correctly
- [ ] Email templates customized (if applicable)
- [ ] Analytics enabled (if applicable)

---

### **STEP 10: Security & Monitoring** (5 minutes)

#### 10.1 Enable RLS Policies Verification
Run in Supabase SQL Editor:

```sql
-- Verify all tables have RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = false
  AND tablename NOT IN ('invoice_counter');
-- Should return 0 rows (except invoice_counter)
```

#### 10.2 Test Rate Limiting
- Make 10+ rapid requests to any API endpoint
- Verify rate limiting kicks in (429 status)

#### 10.3 Monitor Error Logs
Vercel Dashboard → Your Project → Logs → Runtime Logs
- Watch for any errors
- Check Supabase logs for database errors

**Verification:**
- [ ] All tables have RLS enabled
- [ ] Rate limiting works
- [ ] No critical errors in logs

---

## 🎉 **DEPLOYMENT COMPLETE!**

### Final Checklist
- [ ] Sample data cleaned
- [ ] Production keys configured
- [ ] Deployed to Vercel successfully
- [ ] Stripe webhook configured
- [ ] Edge Functions scheduled
- [ ] First admin user created
- [ ] All critical flows tested
- [ ] Custom domain configured (optional)
- [ ] Auth redirects updated
- [ ] Security verified
- [ ] Monitoring enabled

### Post-Launch Monitoring (First 24 Hours)

**Watch These Metrics:**
1. Error logs (Vercel + Supabase)
2. Payment success rate (Stripe Dashboard)
3. User signups and bookings
4. Email delivery rates
5. Page load times
6. Database query performance

**Support Checklist:**
- [ ] Monitor support email/chat
- [ ] Check for user-reported issues
- [ ] Review backup logs (after first automated backup)
- [ ] Verify cron jobs executed
- [ ] Check notification delivery

---

## 📊 **Success Metrics**

After 7 days, review:
- Total bookings made
- Payment success rate (>95% target)
- User satisfaction (feedback scores)
- System uptime (>99.5% target)
- Page load speed (<2s target)
- Error rate (<0.1% target)

---

## 🆘 **Troubleshooting**

### Common Issues & Fixes

**Issue:** Build fails on Vercel
- **Fix:** Check environment variables are set correctly
- **Fix:** Review build logs for specific error
- **Fix:** Ensure Node version is 18.x or higher

**Issue:** Stripe payments not working
- **Fix:** Verify you're using LIVE mode keys
- **Fix:** Check webhook endpoint URL is correct
- **Fix:** Test webhook in Stripe Dashboard

**Issue:** Emails not sending
- **Fix:** Check Resend API key (if using)
- **Fix:** Verify Supabase Auth email settings
- **Fix:** Check spam folder

**Issue:** Database connection errors
- **Fix:** Verify Supabase URL and keys
- **Fix:** Check Supabase project status
- **Fix:** Review RLS policies for access issues

**Issue:** Edge Functions not running
- **Fix:** Verify cron jobs exist: `SELECT * FROM cron.job;`
- **Fix:** Check function logs in Supabase Dashboard
- **Fix:** Test functions manually via API call

---

## 📞 **Support Resources**

- **Vercel Support:** https://vercel.com/support
- **Supabase Support:** https://supabase.com/support
- **Stripe Support:** https://support.stripe.com
- **Project Documentation:** `.softgen/` folder

---

**🚀 You're now LIVE in production! Welcome to the Training Centre App!**

**Time to Production:** ~45-60 minutes (with all optional steps)
</file_contents>
