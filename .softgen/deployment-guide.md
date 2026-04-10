# Training Centre App - Deployment Guide

## 🚀 Deployment to Vercel (Recommended)

Your Training Centre App is built with Next.js and is optimized for Vercel deployment.

---

## **Pre-Deployment Checklist**

Before deploying, ensure:

### **1. Environment Variables**
✅ All required environment variables are set in `.env.local`:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Stripe Configuration (if using payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Email Configuration (optional)
RESEND_API_KEY=re_xxx
```

### **2. Database Setup**
✅ Supabase project is connected and configured
✅ All tables and RLS policies are created
✅ First Super Admin user is created
✅ Backup system is configured
✅ Storage buckets are set up

### **3. Code Quality**
✅ No TypeScript errors (run `npm run build` locally)
✅ No ESLint errors (warnings are okay)
✅ All tests pass (if you have tests)
✅ No console errors in browser

### **4. Configuration Files**
✅ `vercel.json` is configured correctly
✅ `next.config.mjs` has correct settings
✅ `package.json` dependencies are up to date

---

## **Deployment Methods**

### **Method 1: 1-Click Deploy via Softgen (Recommended)**

**Steps:**

1. **Click "Publish" Button**
   - Located in top-right of Softgen interface
   - Opens deployment wizard

2. **Connect Vercel Account**
   - Sign in to Vercel (create account if needed)
   - Authorize Softgen to access Vercel
   - Select your team/organization

3. **Configure Deployment**
   - Project Name: `training-centre-app`
   - Framework: Next.js (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

4. **Add Environment Variables**
   - Copy all variables from `.env.local`
   - Paste into Vercel environment variables
   - Mark sensitive variables as "Secret"

5. **Deploy!**
   - Click "Deploy" button
   - Wait 2-3 minutes for build
   - Get your production URL: `https://your-app.vercel.app`

**That's it!** Your app is now live in production! 🎉

---

### **Method 2: Manual Vercel Deployment**

If you prefer manual control:

**Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

**Step 2: Login to Vercel**
```bash
vercel login
```

**Step 3: Deploy**
```bash
# First deployment (creates project)
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your team/personal account
# - Link to existing project? No
# - What's your project's name? training-centre-app
# - In which directory is your code located? ./
# - Want to override settings? No

# Production deployment
vercel --prod
```

**Step 4: Add Environment Variables**
```bash
# Via CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
# ... etc

# Or via Vercel Dashboard:
# https://vercel.com/your-team/training-centre-app/settings/environment-variables
```

---

### **Method 3: GitHub Integration (Continuous Deployment)**

**Step 1: Push to GitHub**
```bash
git add .
git commit -m "Ready for production deployment"
git push origin main
```

**Step 2: Import to Vercel**
1. Go to: https://vercel.com/new
2. Click "Import Git Repository"
3. Select your repository
4. Configure project settings
5. Add environment variables
6. Click "Deploy"

**Step 3: Enable Auto-Deploy**
- Every push to `main` branch auto-deploys
- Preview deployments for pull requests
- Instant rollbacks if needed

---

## **Post-Deployment Steps**

### **1. Update Supabase Configuration**

**Add Production URL to Supabase:**
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel URL to "Site URL":
   ```
   https://your-app.vercel.app
   ```
3. Add to "Redirect URLs":
   ```
   https://your-app.vercel.app/**
   https://your-app.vercel.app/admin/login
   ```

**Update Storage CORS:**
1. Go to Supabase Dashboard → Storage → Policies
2. Add your Vercel domain to allowed origins
3. Enable CORS for your storage buckets

---

### **2. Configure Custom Domain (Optional)**

**Add Custom Domain in Vercel:**
1. Go to: Project Settings → Domains
2. Click "Add Domain"
3. Enter your domain: `app.yourcompany.com`
4. Follow DNS configuration instructions
5. Wait for DNS propagation (5-30 minutes)

**Update DNS Records:**
```
Type: CNAME
Name: app (or @)
Value: cname.vercel-dns.com
TTL: 3600
```

**Update Environment Variables:**
```bash
# Update in Vercel Dashboard
NEXT_PUBLIC_SITE_URL=https://app.yourcompany.com
```

---

### **3. Configure Stripe Webhooks (If Using Payments)**

**Add Production Webhook:**
1. Go to: Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://your-app.vercel.app/api/stripe/webhook`
4. Events to send:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy webhook secret
6. Add to Vercel environment variables:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   ```

---

### **4. Test Production Deployment**

**Functional Testing:**
- ✅ Homepage loads correctly
- ✅ Login/logout works
- ✅ Admin dashboard accessible
- ✅ Database queries work
- ✅ File uploads work
- ✅ Stripe payments work (test mode)
- ✅ Email notifications send
- ✅ PWA installs on mobile
- ✅ Dark mode toggles
- ✅ Search works (Cmd+K)

**Performance Testing:**
- ✅ Lighthouse score >90
- ✅ Core Web Vitals pass
- ✅ Page load <3 seconds
- ✅ Time to Interactive <5 seconds

**Security Testing:**
- ✅ HTTPS enabled (automatic)
- ✅ RLS policies enforce correctly
- ✅ API keys are not exposed
- ✅ Admin routes require authentication
- ✅ CORS configured properly

---

### **5. Set Up Monitoring**

**Vercel Analytics:**
1. Go to: Project Settings → Analytics
2. Enable Web Analytics
3. Monitor Core Web Vitals

**Error Tracking (Optional):**
Consider adding:
- **Sentry** for error tracking
- **LogRocket** for session replay
- **Datadog** for APM monitoring

---

### **6. Configure Automated Backups**

**Set Up Production Backup Automation:**

**Option 1: Vercel Cron Jobs**
```typescript
// api/cron/backup.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify cron secret
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Trigger backup Edge Function
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/backup-database`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ backup_type: 'full' })
    }
  );

  const data = await response.json();
  return res.status(200).json(data);
}
```

**vercel.json cron configuration:**
```json
{
  "crons": [{
    "path": "/api/cron/backup",
    "schedule": "0 2 * * *"
  }]
}
```

**Option 2: GitHub Actions**
See `.github/workflows/backup.yml` in deployment guide

---

## **Deployment Configuration Files**

### **vercel.json**
```json
{
  "version": 2,
  "regions": ["iad1"],
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next",
  "crons": [{
    "path": "/api/cron/backup",
    "schedule": "0 2 * * *"
  }]
}
```

### **next.config.mjs**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'images.unsplash.com',
      'your-project.supabase.co'
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

---

## **Environment Variables Reference**

### **Required Variables:**
```bash
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# Site Configuration (REQUIRED)
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app

# Stripe (REQUIRED for payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### **Optional Variables:**
```bash
# Email Service
RESEND_API_KEY=re_xxx

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Backup Automation
CRON_SECRET=your-secret-key
```

---

## **Troubleshooting Deployment Issues**

### **Build Errors**

**TypeScript Errors:**
```bash
# Check locally first
npm run build

# Fix errors, then redeploy
vercel --prod
```

**Dependency Errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### **Runtime Errors**

**Environment Variables Not Working:**
- Check Vercel Dashboard → Settings → Environment Variables
- Ensure variables are set for "Production" environment
- Redeploy after adding variables

**Database Connection Fails:**
- Verify Supabase URL and keys
- Check Supabase project is not paused
- Verify RLS policies allow access

**API Routes Return 404:**
- Check `vercel.json` routing configuration
- Ensure API routes are in `pages/api/` directory
- Verify build includes API routes

### **Performance Issues**

**Slow Page Loads:**
- Enable Vercel Edge Caching
- Optimize images (use next/image)
- Enable ISR (Incremental Static Regeneration)
- Review Lighthouse report

**High Database Latency:**
- Add database indexes
- Optimize complex queries
- Consider edge caching for static data
- Use Supabase connection pooling

---

## **Production Checklist**

### **Before Going Live:**
- [ ] All environment variables configured
- [ ] Custom domain configured (if using)
- [ ] SSL/HTTPS working
- [ ] First Super Admin user created
- [ ] Stripe production keys configured
- [ ] Email service configured
- [ ] Backup automation set up
- [ ] Error tracking configured
- [ ] Analytics configured
- [ ] Performance optimized (Lighthouse >90)
- [ ] Security headers configured
- [ ] CORS configured
- [ ] Supabase redirect URLs updated
- [ ] All features tested in production

### **After Deployment:**
- [ ] Monitor error rates (first 24 hours)
- [ ] Check Core Web Vitals
- [ ] Verify backup execution
- [ ] Test all critical user flows
- [ ] Monitor database performance
- [ ] Check email delivery
- [ ] Review logs for issues

---

## **Ongoing Maintenance**

### **Daily:**
- Monitor error rates in Vercel Dashboard
- Check backup execution in `/admin/backups`
- Review user feedback in `/admin/feedback`

### **Weekly:**
- Review system health in `/admin/system-health`
- Check storage usage
- Review audit logs
- Monitor performance metrics

### **Monthly:**
- Test backup restoration
- Review and optimize slow queries
- Update dependencies
- Security audit
- Performance optimization

---

## **Scaling Considerations**

### **When to Scale:**

**Database:**
- Upgrade Supabase plan if queries slow down
- Add read replicas for high traffic
- Enable connection pooling

**Serverless Functions:**
- Upgrade Vercel plan for higher limits
- Optimize function execution time
- Consider edge functions for low latency

**Storage:**
- Monitor storage usage
- Implement CDN for static assets
- Compress and optimize uploads

**Traffic:**
- Enable Vercel Edge Network
- Implement caching strategies
- Use ISR for dynamic pages

---

## **Support Resources**

**Vercel:**
- Documentation: https://vercel.com/docs
- Support: https://vercel.com/support
- Status: https://www.vercel-status.com

**Supabase:**
- Documentation: https://supabase.com/docs
- Support: https://supabase.com/support
- Status: https://status.supabase.com

**Next.js:**
- Documentation: https://nextjs.org/docs
- Support: https://github.com/vercel/next.js/discussions

---

## **Success!** 🎉

Your Training Centre App is now live in production!

**Your Production URLs:**
- Application: https://your-app.vercel.app
- Admin Dashboard: https://your-app.vercel.app/admin
- Student Portal: https://your-app.vercel.app/student/portal

**Next Steps:**
1. Share the URL with your team
2. Create additional admin users
3. Start adding courses and trainers
4. Configure notification preferences
5. Test all features with real data

**Congratulations on launching your Training Centre Platform!** 🚀