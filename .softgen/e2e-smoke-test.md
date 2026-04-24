# End-to-End Smoke Test Guide
**Status:** ✅ Ready for Testing
**Last Updated:** 2026-04-24

---

## 🎯 Test Objectives

Validate critical user journeys across all major features to ensure production readiness.

**Test Duration:** ~30 minutes
**Required:** Admin account + test data

---

## ✅ Pre-Test Checklist

- [ ] Production deployment successful
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Supabase redirect URLs added
- [ ] First admin user created
- [ ] Test student account created

---

## 🧪 Test Suites

### **1. Authentication & Authorization (5 min)**

#### Admin Login
```
URL: /admin/login
Test: Login with valid admin credentials
Expected: Redirects to /admin dashboard
Verify: User name displays in navigation
```

#### Student Portal Access
```
URL: /student/portal
Test: Login with student credentials
Expected: Displays student dashboard with enrollments
Verify: Course cards show correct status
```

#### Role-Based Access
```
Test: Access /admin as student user
Expected: Redirected or "Access Denied" message
Verify: Proper RBAC enforcement
```

**✅ Pass Criteria:** All login flows work, no unauthorized access

---

### **2. Admin Dashboard (5 min)**

#### Dashboard Load
```
URL: /admin
Test: View dashboard after login
Expected: Stats cards load with data
Verify: No console errors, all widgets render
```

#### Recent Activity
```
Test: Check activity feed
Expected: Shows recent system events
Verify: Timestamps are correct
```

#### Quick Actions
```
Test: Click "Create User" or "Add Course"
Expected: Opens relevant dialog/page
Verify: Form validation works
```

**✅ Pass Criteria:** Dashboard loads under 3s, all data displays correctly

---

### **3. Course Management (5 min)**

#### View Courses
```
URL: /admin/courses
Test: Browse course list
Expected: All courses display with correct info
Verify: Search and filter work
```

#### Create Course
```
Test: Create new test course
Fields: Name, description, duration, price
Expected: Course saves successfully
Verify: Appears in course list
```

#### Edit Course
```
Test: Edit test course details
Expected: Changes save and reflect immediately
Verify: No data loss
```

**✅ Pass Criteria:** CRUD operations work, validation prevents bad data

---

### **4. Booking Flow (5 min)**

#### Browse Classes
```
URL: /classes
Test: View available classes
Expected: List shows with dates/times/trainers
Verify: Filters work correctly
```

#### Make Booking
```
Test: Book a class as student
Steps: Select class → Fill form → Submit
Expected: Confirmation page displays
Verify: Booking appears in student portal
```

#### Admin View Booking
```
URL: /admin/bookings
Test: Find newly created booking
Expected: Appears with correct status
Verify: All booking details accurate
```

**✅ Pass Criteria:** End-to-end booking flow completes successfully

---

### **5. Document Management (3 min)**

#### Upload Document
```
Test: Upload file (PDF/image)
Max size: 10MB
Expected: Upload succeeds with progress indicator
Verify: File appears in document list
```

#### View Document
```
Test: Click to preview uploaded document
Expected: Document previewer opens
Verify: Can download file
```

#### Document Status
```
Test: Check document approval workflow
Expected: Admin can approve/reject
Verify: Status updates reflect correctly
```

**✅ Pass Criteria:** Upload, preview, download all work

---

### **6. E-Signature Workflow (3 min)**

#### Send Signature Request
```
URL: /admin/bookings → select booking → Signatures tab
Test: Send signature request to student
Expected: Email sent confirmation
Verify: Request appears in list
```

#### Sign Document
```
URL: /sign/[requestId]
Test: Open signature link
Methods: Draw, Type, Upload
Expected: Signature captures correctly
Verify: Document marked as signed
```

#### Verify Signed Document
```
Test: Check signed document in admin
Expected: Shows signature + timestamp + IP
Verify: Audit trail complete
```

**✅ Pass Criteria:** Complete signature cycle works

---

### **7. Student Portal (3 min)**

#### My Courses
```
URL: /student/portal
Test: View enrolled courses
Expected: Shows active + completed courses
Verify: Progress bars accurate
```

#### Upload Evidence
```
Test: Upload field evidence (if applicable)
Expected: Photo uploads with notes
Verify: Appears in evidence gallery
```

#### Certificates
```
URL: /student/certificates
Test: View earned certificates
Expected: Certificates display and download
Verify: Certificate data correct
```

**✅ Pass Criteria:** Student can access all their data

---

### **8. Analytics & Reporting (2 min)**

#### View Analytics
```
URL: /admin/analytics
Test: Check dashboard metrics
Expected: Charts render with data
Verify: No errors, data looks reasonable
```

#### Export Report
```
Test: Export data to CSV/PDF
Expected: File downloads successfully
Verify: Data matches what's shown
```

**✅ Pass Criteria:** Analytics load, exports work

---

### **9. System Health (2 min)**

#### Health Check
```
URL: /admin/system-health
Test: View system status
Expected: All services show as "healthy"
Verify: Response times reasonable
```

#### Error Logs
```
URL: /admin/audit-logs
Test: Check recent logs
Expected: Logs display with filters
Verify: Search works
```

**✅ Pass Criteria:** All systems operational, no critical errors

---

### **10. Mobile Responsiveness (2 min)**

#### Mobile Test
```
Browsers: Chrome, Safari, Firefox
Breakpoints: 375px, 768px, 1024px
Test: Navigate key pages on mobile
Expected: UI adapts properly
Verify: No horizontal scroll, buttons reachable
```

**✅ Pass Criteria:** Mobile experience is usable

---

## 🚨 Critical Failure Indicators

**STOP TESTING IF:**
- ❌ Cannot login (admin or student)
- ❌ Database connection fails
- ❌ 500 errors on core pages
- ❌ Payment processing broken (if enabled)
- ❌ Data loss occurs

**Immediate Actions:**
1. Roll back deployment
2. Check error logs: `/admin/audit-logs`
3. Verify environment variables
4. Contact support with error details

---

## 📊 Test Results Template

```
Date: ___________
Tester: ___________
Environment: Production / Staging

| Test Suite | Status | Notes |
|------------|--------|-------|
| Authentication | ⬜ Pass / ⬜ Fail | |
| Admin Dashboard | ⬜ Pass / ⬜ Fail | |
| Course Management | ⬜ Pass / ⬜ Fail | |
| Booking Flow | ⬜ Pass / ⬜ Fail | |
| Documents | ⬜ Pass / ⬜ Fail | |
| E-Signatures | ⬜ Pass / ⬜ Fail | |
| Student Portal | ⬜ Pass / ⬜ Fail | |
| Analytics | ⬜ Pass / ⬜ Fail | |
| System Health | ⬜ Pass / ⬜ Fail | |
| Mobile | ⬜ Pass / ⬜ Fail | |

Overall Result: ⬜ PASS ⬜ FAIL
```

---

## 🐛 Common Issues & Fixes

### "Invalid redirect URL"
- **Cause:** Missing redirect URLs in Supabase
- **Fix:** Add all URLs from `.softgen/deployment-guide.md` section 1

### "Profile not found"
- **Cause:** User created without profile trigger
- **Fix:** Run profile trigger SQL from `quick-setup.sql`

### "Permission denied"
- **Cause:** Missing RLS policies or wrong role
- **Fix:** Check user_roles table, verify RLS policies

### Documents won't upload
- **Cause:** Storage bucket not public or missing
- **Fix:** Check Supabase storage settings, verify bucket exists

### Emails not sending
- **Cause:** Email service not configured
- **Fix:** Currently mock emails - check console logs

---

## ✅ Sign-Off

**Tested By:** _______________  
**Date:** _______________  
**Approved For Production:** ⬜ Yes ⬜ No

**Deployment Notes:**
_______________________________________
_______________________________________
_______________________________________

---

**Next Steps After Successful Test:**
1. ✅ Mark deployment as stable
2. ✅ Enable production monitoring
3. ✅ Set up backup automation
4. ✅ Schedule first real training session
5. ✅ Monitor for 24 hours before full rollout