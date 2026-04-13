# Sample Data Management

This folder contains scripts to inject and remove realistic sample data for testing and demonstration purposes.

## 🎯 Purpose

Sample data helps you:
- **Test features** without manually creating records
- **Demo the platform** to stakeholders with realistic data
- **Develop new features** with pre-populated database
- **Train staff** on a populated system
- **Screenshot/video** capture with real-looking content

## 📁 Files

### `inject-sample-data.sql`
**Populates database with sample data**

Creates:
- **15 Users** (10 students, 3 trainers, 2 admins)
- **15 Course Templates** (various categories)
- **30 Scheduled Classes** (past, present, future)
- **60+ Bookings** (confirmed, pending, cancelled)
- **10 Enquiries** (open, responded, closed)
- **15 Certificates** (completed courses)
- **10 Discussion Threads** (with replies)
- **15+ Instructor Payouts** (paid, pending)
- **30 Audit Log Entries** (system activity)

All data is tagged with `"is_sample_data": true` in metadata for easy identification and removal.

### `cleanup-sample-data.sql`
**Removes ALL sample data**

Safely deletes all records tagged as sample data in correct order to respect foreign key constraints.

---

## 🚀 Quick Start

### Step 1: Inject Sample Data

1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Click **"New query"**
4. Copy entire contents of `inject-sample-data.sql`
5. Paste into editor
6. Click **"Run"**
7. Wait ~30 seconds for completion

**Expected Output:**
```
========================================
SAMPLE DATA INJECTION COMPLETE!
========================================
Created:
  - 15 users (10 students, 3 trainers, 2 admins)
  - 15 course templates
  - 30 scheduled classes
  - 60+ bookings
  - 10 enquiries
  - 15 certificates
  - 10 discussion threads
  - 15+ instructor payouts
  - 30 audit log entries

Sample Login Credentials:
  Student: alice.smith@example.com / SamplePass123!
  Trainer: sarah.instructor@example.com / SamplePass123!
  Admin: admin.demo@example.com / SamplePass123!

To remove all sample data, run: cleanup-sample-data.sql
========================================
```

### Step 2: Explore Sample Data

**Sample Login Credentials:**

| Role | Email | Password |
|------|-------|----------|
| **Student** | alice.smith@example.com | SamplePass123! |
| **Trainer** | sarah.instructor@example.com | SamplePass123! |
| **Admin** | admin.demo@example.com | SamplePass123! |

**Test with 10 students:**
- alice.smith@example.com
- bob.jones@example.com
- carol.white@example.com
- david.brown@example.com
- emma.davis@example.com
- frank.wilson@example.com
- grace.taylor@example.com
- henry.moore@example.com
- iris.anderson@example.com
- jack.thomas@example.com

All use password: `SamplePass123!`

### Step 3: Clean Up (When Done)

1. Open **Supabase Dashboard → SQL Editor**
2. Click **"New query"**
3. Copy entire contents of `cleanup-sample-data.sql`
4. Paste and click **"Run"**
5. All sample data deleted in ~10 seconds

---

## 🔍 What Gets Created

### Users & Roles

**10 Students:**
- Pre-enrolled in various courses
- Some with completed certifications
- Various booking statuses

**3 Trainers:**
- Sarah Johnson (sarah.instructor@example.com)
- Mike Rodriguez (mike.trainer@example.com)
- Lisa Chen (lisa.coach@example.com)

**2 Admins:**
- Demo Admin (admin.demo@example.com)
- Demo Manager (manager.demo@example.com)

### Courses

**15 Course Templates covering:**
- Health & Safety (First Aid, Confined Space, Manual Handling)
- Equipment Operation (Forklift)
- Business Skills (Excel, Project Management, Accounting)
- Soft Skills (Customer Service, Leadership, Time Management)
- Technology (Computer Skills)
- Food Service (Food Safety)
- Logistics (Warehouse Management)

### Classes & Bookings

**30 Scheduled Classes:**
- 10 completed (in the past)
- 15 currently scheduled
- 5 upcoming

**60+ Student Bookings:**
- Confirmed bookings (most)
- Pending bookings (~10%)
- Cancelled bookings (~10%)
- Various payment statuses

### Other Data

**Enquiries:** 10 contact form submissions with various statuses

**Certificates:** 15 automatically generated for completed courses

**Discussion Forums:** 10 threads with instructor replies

**Instructor Payouts:** 15+ payout records across trainers

**Audit Logs:** 30 system activity entries

---

## 🔒 Safety Features

### Sample Data Tagging

All sample data includes `"is_sample_data": true` in the metadata field:

```json
{
  "is_sample_data": true,
  "created_by": "sample_data_script"
}
```

This allows:
- ✅ Easy identification of sample vs real data
- ✅ Safe filtering in queries
- ✅ Bulk deletion without affecting real records
- ✅ Data integrity in production

### Safe Deletion

The cleanup script:
- ✅ Only deletes records tagged as sample data
- ✅ Respects foreign key constraints (correct deletion order)
- ✅ Provides detailed deletion summary
- ✅ Handles errors gracefully
- ✅ Never touches real user data

---

## 📊 Sample Data Statistics

| Category | Count | Details |
|----------|-------|---------|
| **Users** | 15 | 10 students, 3 trainers, 2 admins |
| **Courses** | 15 | 5 categories, various durations |
| **Classes** | 30 | Past, present, future sessions |
| **Bookings** | 60+ | Multiple statuses and payments |
| **Enquiries** | 10 | Open, responded, closed |
| **Certificates** | 15 | Auto-generated for completed courses |
| **Discussions** | 10 | Threads with instructor replies |
| **Payouts** | 15+ | Paid, pending, processing |
| **Audit Logs** | 30 | Various system activities |

---

## 🧪 Testing Scenarios

### User Management Testing
```
Login as: admin.demo@example.com
- View all 15 users
- Edit student profiles
- Assign/remove roles
- Bulk operations
- Check audit logs
```

### Booking Management Testing
```
Login as: admin.demo@example.com
- View 60+ bookings across 30 classes
- Filter by status (confirmed, pending, cancelled)
- Process payments
- Cancel bookings
- Export reports
```

### Student Portal Testing
```
Login as: alice.smith@example.com
- View enrolled courses
- Access certificates
- Participate in discussions
- Submit feedback
```

### Trainer Dashboard Testing
```
Login as: sarah.instructor@example.com
- View assigned classes
- Manage students
- Answer forum questions
- Track payouts
```

---

## 🔧 Customization

### Modify Sample Data Quantities

Edit these variables in `inject-sample-data.sql`:

```sql
-- Line ~45: Number of students (default: 10)
FOR i IN 1..10 LOOP

-- Line ~75: Number of trainers (default: 3)
FOR i IN 1..3 LOOP

-- Line ~105: Number of courses (default: 15)
-- Add/remove course entries

-- Line ~200: Number of classes (default: 30)
FOR i IN 1..30 LOOP

-- Line ~250: Bookings per class (default: 3-8)
FOR j IN 1..(3 + FLOOR(RANDOM() * 6)) LOOP
```

### Add Custom Sample Data

Add your own records following the same pattern:

```sql
INSERT INTO your_table (field1, field2, metadata)
VALUES (
  'value1',
  'value2',
  '{"is_sample_data": true}'  -- Critical!
);
```

**Always include the `is_sample_data` metadata flag!**

---

## ⚠️ Important Notes

### Production Warning

**NEVER run sample data injection in production!**

These scripts are for:
- ✅ Local development
- ✅ Staging environments
- ✅ Testing environments
- ✅ Demo instances

### Cleanup Before Production

Before deploying to production:

1. Run `cleanup-sample-data.sql` to remove all sample data
2. Verify with: `SELECT COUNT(*) FROM profiles WHERE metadata->>'is_sample_data' = 'true';`
3. Result should be `0`
4. Then deploy

### Password Security

Sample passwords are intentionally simple (`SamplePass123!`) for testing.

**In production:**
- Real users set their own passwords
- Enforce strong password requirements
- Never use sample passwords

---

## 🐛 Troubleshooting

### "Function create_sample_user does not exist"

**Cause:** Script interrupted before completion

**Fix:** 
```sql
-- Run this first, then re-run injection script
DROP FUNCTION IF EXISTS create_sample_user(TEXT, TEXT, TEXT);
```

### "Foreign key violation"

**Cause:** Cleanup script run in wrong order

**Fix:**
- Re-run `cleanup-sample-data.sql` (it handles order correctly)
- Or manually delete in reverse order shown in cleanup script

### "Permission denied on auth.users"

**Cause:** Insufficient permissions for auth table

**Fix:**
- Run scripts with service role key
- Or delete auth.users manually in Supabase Dashboard

### Sample data still shows after cleanup

**Check:**
```sql
SELECT COUNT(*) FROM profiles WHERE metadata->>'is_sample_data' = 'true';
SELECT COUNT(*) FROM bookings WHERE metadata->>'is_sample_data' = 'true';
SELECT COUNT(*) FROM classes WHERE metadata->>'is_sample_data' = 'true';
```

If any return > 0, re-run cleanup script.

---

## 📝 Best Practices

### Development Workflow

1. **Start fresh:** Run cleanup if needed
2. **Inject data:** Run injection script
3. **Develop features:** Test with sample data
4. **Clean up:** Run cleanup before committing
5. **Repeat:** Re-inject as needed

### Testing Workflow

1. Inject sample data
2. Run your tests
3. Clean up immediately after tests
4. Verify cleanup succeeded

### Demo Workflow

1. Inject sample data day before demo
2. Customize any specific records needed
3. Practice demo walkthrough
4. Clean up after demo
5. Document any issues found

---

## 🎓 Sample Data Walkthrough

### Admin Dashboard Tour

```
1. Login: admin.demo@example.com / SamplePass123!
2. Dashboard shows: 60 bookings, 30 classes, 10 enquiries
3. User Management: 15 users with various roles
4. Bookings: Filter by status, view details
5. Analytics: Revenue charts, enrollment trends
6. Audit Logs: 30 recent system activities
7. Certificates: 15 issued certificates
```

### Student Portal Tour

```
1. Login: alice.smith@example.com / SamplePass123!
2. Dashboard shows: Enrolled courses, progress
3. Certificates: Download earned certificates
4. Discussions: View/reply to course forums
5. Feedback: Submit feedback on courses
```

### Trainer Dashboard Tour

```
1. Login: sarah.instructor@example.com / SamplePass123!
2. Calendar: View assigned classes
3. Students: Manage enrolled students
4. Discussions: Answer student questions
5. Payouts: View earning history
```

---

## 📄 License

These sample data scripts are provided as-is for testing and development purposes only.

---

## 🤝 Support

If you encounter issues with sample data scripts:

1. Check the troubleshooting section above
2. Verify you're running scripts in correct order
3. Check Supabase SQL editor for error messages
4. Try running cleanup and re-injection

---

**Happy Testing!** 🚀
```

Need help? Check the main project documentation or create an issue.
```