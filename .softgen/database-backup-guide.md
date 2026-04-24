# Database Backup System Guide
**Version:** 1.0
**Last Updated:** 2026-04-24
**Status:** ✅ Automated Backups Enabled

---

## 📋 Overview

GTSTrain now has a comprehensive automated backup system to protect your data.

---

## 🔄 **Automated Backup Schedule**

### **What Gets Backed Up:**
✅ All critical tables (13 tables total):
- profiles, user_roles
- course_templates, scheduled_classes
- bookings, enrollments
- payments, documents
- certificates, contracts
- signature_requests
- course_feedback, audit_logs

### **Backup Frequency:**
- **Recommended:** Daily at 2 AM UTC
- **Retention:** 30 days (configurable)
- **Storage:** Supabase Storage (`backups` bucket)

---

## 🚀 **Setup Instructions**

### **1. Configure Cron Schedule (Vercel/GitHub Actions)**

**Option A: Vercel Cron (Recommended)**

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/backup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Then create `/src/pages/api/cron/backup.ts`:
```typescript
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  if (req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Call Supabase Edge Function
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/backup-database`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    const result = await response.json();
    return res.status(200).json(result);
  } catch (error) {
    console.error("Backup cron error:", error);
    return res.status(500).json({ error: "Backup failed" });
  }
}
```

**Option B: GitHub Actions**

Create `.github/workflows/backup.yml`:
```yaml
name: Daily Database Backup
on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC daily
  workflow_dispatch:  # Allow manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger backup
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            ${{ secrets.SUPABASE_URL }}/functions/v1/backup-database
```

---

## 🔧 **Manual Backup**

### **Trigger Backup via Dashboard:**

1. Navigate to: `/admin/backups`
2. Click: "Run Backup Now"
3. Wait for confirmation
4. Download backup file (optional)

### **Trigger via API:**

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/backup-database
```

---

## 📊 **Backup Monitoring**

### **View Backup History:**

**Admin Dashboard:**
- Go to: `/admin/backups`
- View recent backups
- Check backup sizes
- Download specific backups

**Database Query:**
```sql
SELECT 
  backup_timestamp,
  backup_type,
  status,
  backup_size_kb,
  array_length(tables_backed_up, 1) as tables_count
FROM backup_metadata
ORDER BY backup_timestamp DESC
LIMIT 10;
```

### **Check Last Backup:**
```sql
SELECT 
  backup_timestamp,
  status,
  backup_size_kb
FROM backup_metadata
WHERE status = 'completed'
ORDER BY backup_timestamp DESC
LIMIT 1;
```

---

## 🔐 **Security & Access**

### **Who Can Access Backups:**
- ✅ Super Admins only
- ✅ RLS policies enforce access control
- ✅ Storage bucket is private

### **Backup Encryption:**
- At rest: Supabase default encryption
- In transit: HTTPS/TLS
- Download: Service role key required

---

## 📁 **Backup Storage**

### **Storage Location:**
```
Supabase Storage Bucket: backups/
Format: backup_YYYY-MM-DDTHH-MM-SS-MMMZ.json
Example: backup_2026-04-24T02-00-00-000Z.json
```

### **Storage Cleanup Policy:**

**Automatic Cleanup (Recommended):**
```sql
-- Delete backups older than 30 days
DELETE FROM backup_metadata
WHERE backup_timestamp < NOW() - INTERVAL '30 days';

-- Delete corresponding storage files
-- (Implement in Edge Function or cron job)
```

---

## 🔄 **Restore Procedure**

### **Steps to Restore from Backup:**

1. **Download Backup:**
   ```bash
   # Via Supabase Dashboard
   Storage → backups → Download file
   
   # Or via API
   curl -H "Authorization: Bearer SERVICE_KEY" \
     https://PROJECT.supabase.co/storage/v1/object/backups/backup_file.json
   ```

2. **Review Backup Data:**
   ```bash
   # Check backup contents
   jq '.profiles | length' backup_file.json
   jq 'keys' backup_file.json
   ```

3. **Restore Tables:**
   ```sql
   -- Example: Restore profiles table
   -- CAUTION: This will replace current data
   TRUNCATE TABLE profiles CASCADE;
   
   -- Then insert backup data via API or SQL
   ```

4. **Verify Restoration:**
   ```sql
   -- Check record counts
   SELECT COUNT(*) FROM profiles;
   SELECT COUNT(*) FROM bookings;
   ```

---

## ⚠️ **Important Notes**

### **Before Restoration:**
1. ✅ **Create a backup** of current state
2. ✅ **Notify all users** of maintenance
3. ✅ **Stop all background jobs**
4. ✅ **Test restore on staging** first

### **Limitations:**
- Max backup size: ~50 MB per table
- Large tables may need chunked backups
- Auth users table not backed up (managed by Supabase)

---

## 🔔 **Alerts & Notifications**

### **Backup Success Notification:**
Sent to super admins when backup completes successfully.

### **Backup Failure Alert:**
Critical alert sent if backup fails.

### **Configure Alerts:**
```sql
-- Enable notifications for your user
UPDATE notification_preferences
SET email_system_alerts = true
WHERE user_id = 'YOUR_USER_ID';
```

---

## 📈 **Backup Metrics**

### **Success Rate Target:** >99%
### **Backup Duration:** <5 minutes
### **Storage Usage:** Monitor monthly

**Query Backup Stats:**
```sql
SELECT 
  DATE(backup_timestamp) as date,
  COUNT(*) as total_backups,
  COUNT(*) FILTER (WHERE status = 'completed') as successful,
  AVG(backup_size_kb) as avg_size_kb
FROM backup_metadata
WHERE backup_timestamp > NOW() - INTERVAL '7 days'
GROUP BY DATE(backup_timestamp)
ORDER BY date DESC;
```

---

## 🛠️ **Troubleshooting**

### **Backup Failed:**
1. Check Edge Function logs
2. Verify service role key
3. Check storage bucket permissions
4. Ensure backup_metadata table exists

### **Backup Too Large:**
1. Implement table chunking
2. Increase Edge Function timeout
3. Use incremental backups
4. Archive old data

### **Missing Backup:**
1. Check cron schedule
2. Verify Edge Function deployment
3. Review backup_metadata table
4. Check storage bucket

---

## ✅ **Verification Checklist**

- [ ] Edge Function deployed: `backup-database`
- [ ] backup_metadata table created
- [ ] backups storage bucket created
- [ ] RLS policies applied
- [ ] Cron job configured (Vercel/GitHub Actions)
- [ ] Test manual backup works
- [ ] Verify backup appears in storage
- [ ] Check backup_metadata record created
- [ ] Test backup download
- [ ] Configure retention policy

---

## 📞 **Support**

**Questions about backups?**
- Check Edge Function logs in Supabase Dashboard
- Review backup_metadata table
- Contact system administrator

---

**Backup System Status:** 🟢 ACTIVE
**Last Updated:** 2026-04-24
**Next Review:** Monthly