# Sample Data Injection - Complete Guide

## 🚀 Quick Start (30 Seconds)

1. **Open Supabase Dashboard** → SQL Editor
2. **Copy** the entire `inject-sample-data.sql` file (561 lines)
3. **Paste** into SQL Editor → Click **Run**
4. **Wait** ~30-40 seconds for completion
5. **Done!** Login and explore

---

## 📋 What Gets Created

### **Users (15 Total)**

**Admins (2):**
- `admin.demo@example.com` / `SamplePass123!`
- `manager.demo@example.com` / `SamplePass123!`

**Trainers (3):**
- `sarah.instructor@example.com` / `SamplePass123!`
- `mike.trainer@example.com` / `SamplePass123!`
- `lisa.coach@example.com` / `SamplePass123!`

**Students (10):**
- `alice.smith@example.com` / `SamplePass123!`
- `bob.jones@example.com` / `SamplePass123!`
- `carol.white@example.com` / `SamplePass123!`
- `david.brown@example.com` / `SamplePass123!`
- `emma.davis@example.com` / `SamplePass123!`
- (+ 5 more students with same password)

### **Course Data**

**Course Templates (15):**
- First Aid & CPR (3 courses)
- Heavy Machinery (4 courses)
- Safety Training (3 courses)
- Mining Operations (3 courses)
- Leadership (2 courses)

**Scheduled Classes (30):**
- 10 past classes (completed)
- 10 current classes (in progress)
- 10 future classes (upcoming)

### **Booking Data**

**Bookings (60+):**
- Various statuses: confirmed, pending, completed, cancelled
- Payment statuses: paid, pending, partial
- Spread across all students and classes

### **Additional Data**

**Enquiries (10):**
- Contact form submissions
- Various statuses: new, in_progress, resolved

**Certificates (15):**
- Auto-generated for completed courses
- Downloadable PDFs

**Discussion Forums (10 threads):**
- Questions and answers
- Multiple replies per thread

**Instructor Payouts (15+):**
- Payment records for trainers
- Various statuses: pending, paid, approved

**Audit Logs (30):**
- Activity tracking
- User actions recorded

---

## 🎯 Testing Workflows

### **1. Admin Dashboard Testing**

**Login:**
```
Email: admin.demo@example.com
Password: SamplePass123!
URL: /admin
```

**Test Features:**
- ✅ View dashboard stats (60+ bookings, 30 classes)
- ✅ Manage users (15 users visible)
- ✅ View bookings list with filters
- ✅ Check analytics charts
- ✅ Review audit logs
- ✅ Manage certificates
- ✅ View instructor payouts
- ✅ Test bulk actions
- ✅ Check notification center (🔔 icon)

### **2. Trainer Portal Testing**

**Login:**
```
Email: sarah.instructor@example.com
Password: SamplePass123!
URL: /field
```

**Test Features:**
- ✅ View teaching schedule
- ✅ See assigned students
- ✅ Take attendance (mobile view)
- ✅ Upload evidence photos
- ✅ Check payout history
- ✅ Answer forum questions
- ✅ Test offline mode

### **3. Student Portal Testing**

**Login:**
```
Email: alice.smith@example.com
Password: SamplePass123!
URL: /student/portal
```

**Test Features:**
- ✅ View enrolled courses
- ✅ Download certificates
- ✅ Participate in forums
- ✅ Submit feedback
- ✅ View booking history
- ✅ Check notifications

### **4. Public Features Testing**

**No Login Required:**
- ✅ Browse courses at `/courses`
- ✅ View pricing at `/pricing`
- ✅ Contact form at `/contact`
- ✅ Help center at `/help`
- ✅ About page at `/about`
- ✅ Features page at `/features`

---

## 🧹 Cleanup When Done

**Option 1: SQL Script (Recommended)**
1. Open Supabase → SQL Editor
2. Copy entire `cleanup-sample-data.sql` file
3. Paste and Run
4. Wait ~10 seconds
5. Database clean!

**Option 2: Manual Verification**
```sql
-- Check if cleanup was successful
SELECT COUNT(*) as remaining_sample_data 
FROM profiles 
WHERE metadata->>'is_sample_data' = 'true';
-- Expected result: 0
```

**Option 3: Fresh Start**
```sql
-- Nuclear option - removes ALL data (use with caution!)
TRUNCATE TABLE bookings CASCADE;
TRUNCATE TABLE scheduled_classes CASCADE;
TRUNCATE TABLE course_templates CASCADE;
-- etc... (see cleanup script for complete list)
```

---

## 🔧 Troubleshooting

### **"Function already exists" Error**
```sql
-- Run this first, then retry injection:
DROP FUNCTION IF EXISTS create_sample_user(TEXT, TEXT, TEXT);
```

### **Injection Fails Midway**
```sql
-- Clean up partial data, then retry:
-- 1. Run cleanup-sample-data.sql
-- 2. Run inject-sample-data.sql again
```

### **No Users Appear After Injection**
```sql
-- Verify users were created:
SELECT email FROM profiles WHERE metadata->>'is_sample_data' = 'true';
-- Should return 15 rows
```

### **Can't Login with Sample Credentials**
**Check:**
1. Password: `SamplePass123!` (capital S, ends with !)
2. Email: Must match exactly (e.g., `admin.demo@example.com`)
3. Clear browser cache and retry
4. Check Supabase Auth → Users section to verify accounts exist

### **Data Appears but No Relationships**
```sql
-- Verify foreign keys:
SELECT 
  COUNT(*) FILTER (WHERE student_email IS NOT NULL) as bookings_with_email,
  COUNT(*) FILTER (WHERE class_id IS NOT NULL) as bookings_with_class
FROM bookings;
-- Both should be > 0
```

---

## 📊 Data Statistics

**After Successful Injection:**
- Users: 15
- Course Templates: 15
- Scheduled Classes: 30
- Bookings: 60+
- Enquiries: 10
- Certificates: 15
- Discussion Threads: 10
- Forum Replies: 15+
- Instructor Payouts: 15+
- Audit Logs: 30

**Database Size:** ~2-3 MB (sample data only)

---

## 🎓 Use Cases

### **For Development:**
- Test all features without manual data entry
- Verify UI components with realistic data
- Test search and filter functionality
- Check pagination and sorting
- Validate data relationships

### **For Demos:**
- Show clients a fully populated system
- Demonstrate workflows end-to-end
- Highlight key features with real examples
- Test user permissions and roles

### **For Training:**
- Teach staff how to use the system
- Practice common workflows
- Test edge cases and error handling
- Familiarize with UI/UX

---

## 🔐 Security Notes

**Sample Data is Safe:**
- ✅ All tagged with `is_sample_data: true` flag
- ✅ Easily removable with cleanup script
- ✅ No real user data or PII
- ✅ Test emails only (@example.com)
- ✅ Generic names (Alice, Bob, Carol, etc.)

**Password Security:**
- ⚠️ Sample password is intentionally weak: `SamplePass123!`
- ⚠️ Never use sample accounts in production
- ✅ Clean up before deploying to production
- ✅ Change all passwords before going live

---

## ✅ Verification Checklist

After injection, verify:

- [ ] Can login as admin (`admin.demo@example.com`)
- [ ] Dashboard shows 60+ bookings
- [ ] User management shows 15 users
- [ ] Bookings page loads with data
- [ ] Courses page shows 15 templates
- [ ] Calendar shows 30 classes
- [ ] Analytics charts display data
- [ ] Can login as trainer (`sarah.instructor@example.com`)
- [ ] Field worker view shows classes
- [ ] Can login as student (`alice.smith@example.com`)
- [ ] Student portal shows enrolled courses
- [ ] Discussion forums have threads
- [ ] Certificates are downloadable

---

## 🚀 Next Steps After Injection

1. **Test Key Workflows:**
   - Book a class
   - Take attendance
   - Upload evidence
   - Generate certificate
   - Process payment

2. **Explore All Features:**
   - Notification center
   - Global search
   - Document management
   - Real-time updates

3. **Test Admin Functions:**
   - User management
   - Bulk actions
   - Export data
   - Analytics

4. **Mobile Testing:**
   - Field worker view
   - Offline mode
   - PWA installation

5. **Clean Up:**
   - Run cleanup script
   - Verify database is clean
   - Ready for production data!

---

## 📚 Additional Resources

**Documentation Files:**
- `inject-sample-data.sql` - Main injection script (561 lines)
- `cleanup-sample-data.sql` - Cleanup script (135 lines)
- `sample-data-readme.md` - Detailed documentation (450 lines)

**Related Guides:**
- `.softgen/deployment-guide.md` - Production deployment
- `.softgen/test-report.md` - Feature testing
- `.softgen/e-signature-booking-test-guide.md` - E-signature workflow

---

**Status:** ✅ Ready to use - Zero errors - Production quality data

**Injection Time:** ~30-40 seconds
**Cleanup Time:** ~10 seconds
**Total Users:** 15 with varied roles and permissions
**Total Records:** ~200+ across all tables

**Happy Testing!** 🎉