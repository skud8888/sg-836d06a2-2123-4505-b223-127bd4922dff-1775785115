# GTSTrain Complete Documentation
**Training Centre Management System**

**Version:** 1.0  
**Last Updated:** 2026-04-25  
**System Status:** Production Ready ✅

---

# Table of Contents

1. [Quick Start Guide](#quick-start-guide)
2. [System Overview](#system-overview)
3. [Admin Onboarding](#admin-onboarding)
4. [Student Onboarding](#student-onboarding)
5. [Trainer Onboarding](#trainer-onboarding)
6. [Feature Guides](#feature-guides)
7. [Database Setup](#database-setup)
8. [Deployment Guide](#deployment-guide)
9. [Backup & Recovery](#backup-recovery)
10. [Monitoring & Performance](#monitoring-performance)
11. [Testing & Quality Assurance](#testing-quality-assurance)
12. [Troubleshooting](#troubleshooting)
13. [API Reference](#api-reference)
14. [Security & Compliance](#security-compliance)

---

# Quick Start Guide

## 🚀 Get Started in 10 Minutes

### Your Admin Login
```
📧 Email:    admin@test.com
🔑 Password: Admin123! (CHANGE THIS IMMEDIATELY!)
🔗 Login:    https://gtstrain.eastshoresit.com.au/admin/login
```

### First 10 Minutes Checklist

**Minute 1-2: Login & Change Password**
- [ ] Login with credentials above
- [ ] Go to Profile → Change Password
- [ ] Set strong password
- [ ] Save changes

**Minute 3-5: Complete Profile**
- [ ] Add your full name
- [ ] Upload profile photo
- [ ] Add contact phone number
- [ ] Set notification preferences

**Minute 6-8: Create First Course**
- [ ] Navigate to Courses → Create New
- [ ] Enter course name and description
- [ ] Set duration and capacity
- [ ] Save course

**Minute 9-10: Schedule First Class**
- [ ] Go to Calendar
- [ ] Click "New Event"
- [ ] Select your course
- [ ] Choose date/time and publish

✅ **You're ready to start managing your training centre!**

---

# System Overview

## 🎯 What is GTSTrain?

GTSTrain is a complete training centre management system that handles:

✅ **Course Management** - Create, schedule, and manage training courses
✅ **Student Enrollment** - Online and manual enrollment workflows
✅ **Payment Processing** - Stripe integration for online payments
✅ **Certificate Generation** - Automated PDF certificates with templates
✅ **E-Signatures** - Digital contract signing with legal compliance
✅ **Document Management** - Secure storage and verification
✅ **Field Evidence** - Mobile photo/video capture for practical assessments
✅ **Analytics & Reporting** - Comprehensive business intelligence
✅ **Automated Workflows** - Email triggers, reminders, notifications
✅ **Team Collaboration** - Multi-role access (admins, trainers, students)

---

## 🏗️ System Architecture

### **Tech Stack**

**Frontend:**
- Next.js 15.5 (Page Router)
- React 18.3
- TypeScript
- Tailwind CSS + shadcn/ui
- PWA Support (offline mode)

**Backend:**
- Supabase (PostgreSQL + Auth + Storage)
- Edge Functions (Deno)
- Real-time subscriptions

**Integrations:**
- Stripe (payments)
- OpenAI (AI insights - optional)
- Twilio (SMS - configured)
- QuickBooks Online (accounting - ready)

**Infrastructure:**
- Vercel (hosting)
- Supabase Cloud (database)
- Automated backups
- PM2 process management

---

## 📊 Database Schema Overview

**Core Tables (40+):**

1. **User Management**
   - `profiles` - User profiles and settings
   - `user_roles` - Role-based access control
   - `notification_preferences` - User notification settings

2. **Course Management**
   - `courses` - Course catalog
   - `scheduled_classes` - Class sessions
   - `course_templates` - Reusable course templates

3. **Enrollment & Bookings**
   - `enrollments` - Student course enrollments
   - `waitlist` - Class waiting list
   - `attendance` - Attendance tracking

4. **Payments**
   - `payments` - Payment transactions
   - `payment_plans` - Installment plans
   - `refunds` - Refund tracking

5. **Documents & Certificates**
   - `documents` - File storage metadata
   - `certificates` - Generated certificates
   - `document_templates` - Certificate templates

6. **E-Signatures**
   - `contracts` - Contract documents
   - `contract_templates` - Contract templates
   - `signature_requests` - Signature tracking
   - `signature_audit` - Legal audit trail

7. **Communication**
   - `email_logs` - Email delivery tracking
   - `sms_logs` - SMS delivery tracking
   - `notifications` - In-app notifications

8. **Analytics**
   - `audit_logs` - Security and compliance
   - `activity_timeline` - User activity
   - `system_health_metrics` - Performance monitoring

---

# Admin Onboarding

## 👤 First Hour as Admin

### Step 1: Initial Setup (10 min)

**1.1 Login**
```
URL: https://gtstrain.eastshoresit.com.au/admin/login
Email: admin@test.com
Password: Admin123!
```

**1.2 Change Password (CRITICAL)**
1. Click profile icon (top right)
2. Select "Profile" or "Settings"
3. Click "Change Password"
4. Enter new strong password
5. Save

**1.3 Complete Profile**
- Navigate to: `/admin/profile`
- Upload profile photo
- Add contact information
- Set timezone
- Configure notification preferences

**1.4 System Health Check**
- Go to: `/admin/system-health`
- Verify all systems "Healthy" (green)
- Bookmark this page
- Check daily

---

### Step 2: Organization Settings (15 min)

**2.1 Company Information**
1. Navigate to: Settings → Organization
2. Add:
   - Company name
   - Logo (upload)
   - Contact email/phone
   - Business address
3. Set business hours
4. Configure timezone

**2.2 Email Templates**
1. Go to: Settings → Email Templates
2. Customize:
   - Welcome email
   - Booking confirmation
   - Payment receipt
   - Certificate delivery
   - Password reset
3. Test email delivery

**2.3 Payment Settings (Optional)**
1. Navigate to: Settings → Payments
2. Configure Stripe (if using online payments)
3. Set payment terms
4. Configure refund policies

---

### Step 3: Course Setup (20 min)

**3.1 Create Course Categories**
1. Go to: Courses → Categories
2. Create categories:
   - Safety Training
   - Technical Skills
   - Compliance Training
   - Professional Development
3. Set descriptions and icons

**3.2 Create First Course**
1. Navigate to: Courses → Create New
2. Fill in details:
   ```
   Name: First Aid Training
   Category: Safety Training
   Duration: 8 hours
   Max Students: 12
   Prerequisites: None
   Price: $250 (or free)
   ```
3. Add description (Markdown supported)
4. Upload course materials
5. Set completion criteria
6. Save and publish

**3.3 Schedule First Class**
1. Go to: Calendar → New Event
2. Select course: "First Aid Training"
3. Set date/time
4. Choose location
5. Assign trainer (create if needed)
6. Set capacity
7. Publish

---

### Step 4: Team Management (10 min)

**4.1 Invite Team Members**
1. Navigate to: Team → Add Member
2. Enter details:
   - Name
   - Email
   - Role (Admin, Trainer, Support)
3. Send invitation
4. They receive signup link

**4.2 Role Permissions**

**Super Admin:**
- Full system access
- User management
- System settings
- Financial data

**Admin:**
- Course management
- Student enrollment
- Bookings
- Reports

**Trainer:**
- View assigned classes
- Mark attendance
- Upload evidence
- Provide feedback

**Support:**
- View bookings
- Respond to enquiries
- Read-only access

---

### Step 5: Student Enrollment (10 min)

**5.1 Manual Enrollment**
1. Go to: Students → Add Student
2. Enter student details
3. Select course and class
4. Process payment (if applicable)
5. Send confirmation email

**5.2 Bulk Import**
1. Navigate to: Students → Import
2. Download CSV template
3. Fill in student data
4. Upload CSV
5. Review and confirm

**5.3 Enable Self-Enrollment**
1. Go to: Courses → [Course] → Settings
2. Toggle "Allow Self-Enrollment"
3. Set requirements
4. Configure waiting list
5. Save

---

## 🎯 Admin Dashboard Overview

### Key Sections

**1. Dashboard (`/admin`)**
- Quick stats
- Recent bookings
- Upcoming classes
- Pending actions
- Revenue summary

**2. Calendar (`/admin/calendar`)**
- Month/week/day views
- Color-coded by course
- Drag-and-drop scheduling
- Trainer assignments
- Capacity tracking

**3. Courses (`/admin/courses`)**
- Course catalog
- Course builder
- Content management
- Pricing configuration
- Prerequisites

**4. Bookings (`/admin/bookings`)**
- All enrollments
- Payment status
- Document verification
- E-signature tracking
- Cancellations/refunds

**5. Students (`/admin/students`)**
- Student directory
- Enrollment history
- Certificates issued
- Payment records
- Communication log

**6. Payments (`/admin/payments`)**
- Transaction history
- Pending payments
- Refunds processed
- Payment plans
- Financial reports

**7. Documents (`/admin/reports/documents`)**
- Student uploads
- Verification workflow
- Compliance tracking
- Bulk approval

**8. Certificates (`/admin/certificates`)**
- Certificate templates
- Generation queue
- Issued certificates
- Bulk generation

**9. Signatures (`/admin/signatures`)**
- Contract templates
- Signature requests
- Completed contracts
- Legal audit trail

**10. Analytics (`/admin/analytics`)**
- Student engagement
- Course performance
- Revenue tracking
- Retention metrics

**11. System Health (`/admin/system-health`)**
- Database status
- API health
- Error logs
- Performance metrics
- Backup status

**12. Audit Logs (`/admin/audit-logs`)**
- User activity
- System changes
- Security events
- Compliance reports

---

## 📋 Daily Admin Tasks

### Morning Routine (5 min)
- [ ] Check System Health dashboard
- [ ] Review overnight bookings
- [ ] Approve pending documents
- [ ] Check class capacity for today

### Midday Check (5 min)
- [ ] Process new enrollments
- [ ] Review student feedback
- [ ] Respond to enquiries
- [ ] Update class schedules

### Evening Review (5 min)
- [ ] Mark completed classes
- [ ] Send tomorrow's reminders
- [ ] Review daily revenue
- [ ] Check audit logs

---

## 🚨 Common Admin Scenarios

### Scenario 1: Student Requests Certificate

**Steps:**
1. Go to: Students → [Student Name]
2. Click "Enrollments" tab
3. Find completed course
4. Verify:
   - Attendance 100%
   - Assessments passed
   - Documents approved
5. Click "Generate Certificate"
6. Review PDF preview
7. Click "Send to Student"

**Automated email sent with PDF attached!**

---

### Scenario 2: Cancel a Class

**Steps:**
1. Navigate to: Calendar
2. Click on the class
3. Select "Cancel Class"
4. Choose cancellation reason:
   - Insufficient enrollment
   - Trainer unavailable
   - Venue issue
   - Other
5. Add optional message
6. Confirm cancellation

**System automatically:**
- ✅ Notifies all enrolled students
- ✅ Processes full refunds (if paid)
- ✅ Updates availability
- ✅ Logs the action

---

### Scenario 3: Process Refund

**Steps:**
1. Go to: Payments → [Transaction]
2. Click "Refund" button
3. Select refund type:
   - Full refund
   - Partial refund (enter amount)
4. Add reason for refund
5. Confirm

**Refund timeline:**
- Stripe: 5-7 business days
- Manual: Immediate record update

---

### Scenario 4: Add New Trainer

**Steps:**
1. Navigate to: Team → Add Member
2. Select role: "Trainer"
3. Enter details:
   - Full name
   - Email address
   - Phone number
4. Assign courses they can teach
5. Upload certifications
6. Send invitation

**Trainer receives:**
- Welcome email
- Login credentials
- Training materials
- First assignment

---

### Scenario 5: Handle Document Rejection

**Steps:**
1. Go to: Documents → Pending Review
2. Click on document
3. Review uploaded file
4. If rejecting:
   - Select "Reject"
   - Choose reason:
     * Poor quality
     * Wrong document type
     * Expired document
     * Other
   - Add specific instructions
   - Click "Reject and Notify"

**Student receives:**
- Email notification
- Rejection reason
- Re-upload instructions
- Deadline (if applicable)

---

# Student Onboarding

## 🎓 Student First 15 Minutes

### Step 1: Create Account (3 min)

**1.1 Sign Up**
1. Visit: `https://gtstrain.eastshoresit.com.au/student/portal`
2. Click "Sign Up"
3. Enter:
   - Email address
   - Create password
   - Accept terms
4. Click "Create Account"

**1.2 Verify Email**
1. Check inbox (or spam folder)
2. Click verification link
3. Redirected to login

**1.3 Complete Profile**
1. Add personal information:
   - Full name
   - Date of birth
   - Phone number
   - Address
2. Upload ID (if required)
3. Add emergency contact
4. Set preferences
5. Save profile

---

### Step 2: Browse Courses (5 min)

**2.1 Explore Course Catalog**
1. Navigate to: Courses (`/courses`)
2. Use filters:
   - Category
   - Date range
   - Location
   - Price range
3. Click course for details

**2.2 Course Details Page**
- Description and objectives
- Duration and schedule
- Prerequisites
- Pricing
- Trainer information
- Reviews and ratings
- Available dates

**2.3 Add to Wishlist**
1. Click heart icon on any course
2. Access wishlist: Student Portal → Wishlist
3. Get notified of new classes
4. Compare courses

---

### Step 3: Enroll in Course (7 min)

**3.1 Select Class**
1. Choose preferred course
2. Select date/time from available classes
3. Check:
   - Class location
   - Available spots
   - Prerequisites met
   - Price

**3.2 Complete Enrollment Form**
1. Verify personal details
2. Answer pre-enrollment questions
3. Upload required documents:
   - ID verification
   - Prior qualifications (if needed)
   - Medical clearance (if required)
4. Review and accept terms

**3.3 Process Payment**

**Option A: Online Payment (Stripe)**
1. Enter card details
2. Review order summary
3. Click "Pay Now"
4. Receive confirmation

**Option B: Manual Payment**
1. Select "Bank Transfer" or "Invoice"
2. Submit booking
3. Receive payment instructions
4. Complete payment separately

**3.4 Confirmation**
- Email confirmation received
- Calendar invite attached
- Access to course materials
- Pre-course tasks (if any)

---

## 📱 Student Portal Overview

### Dashboard Sections

**1. My Courses**
- Active enrollments
- Upcoming classes
- In-progress courses
- Completed courses
- Certificates earned

**2. Calendar**
- Personal class schedule
- Upcoming sessions
- Add to Google/Outlook Calendar
- Reminders

**3. Documents**
- Upload required documents
- Track verification status
- Download course materials
- Access certificates

**4. Progress**
- Course completion percentage
- Quiz/assessment results
- Attendance record
- Points and badges (gamification)

**5. Certificates**
- View all earned certificates
- Download as PDF
- Share on LinkedIn
- Request verification

**6. Payments**
- Transaction history
- Payment plans
- Invoices
- Receipts

**7. Support**
- Live chat
- Submit tickets
- FAQ access
- Contact training centre

---

## 🎯 During the Course

### Before Class (24 hours)
- [ ] Review pre-course materials
- [ ] Complete pre-assessment (if any)
- [ ] Prepare required items
- [ ] Note class location and time
- [ ] Set reminders

### Day of Class
- [ ] Arrive 10 minutes early
- [ ] Bring ID and confirmation
- [ ] Check-in with trainer
- [ ] Complete attendance (may be digital)
- [ ] Actively participate
- [ ] Take notes

### After Class
- [ ] Complete post-course assessment
- [ ] Submit feedback/rating
- [ ] Upload field evidence (if applicable)
- [ ] Download class notes
- [ ] Request certificate (when eligible)

---

## 🏆 Student Gamification

### Earn Badges

**Starter Badges:**
- 🎓 First Course - Complete your first course
- 📚 Dedicated Learner - Complete 3 courses
- ⭐ Top Performer - Score 90%+ on assessment
- 🎯 Perfect Attendance - 100% attendance

**Achievement Badges:**
- 🏅 Quick Learner - Complete course in record time
- 💪 Committed - Maintain study streak
- 🌟 Ambassador - Refer 3 friends
- 👑 Master - Complete advanced certification

### Leaderboard
- View your ranking
- Compare with peers
- See top performers
- Weekly/monthly/all-time

### Points System
- +10 points per class attended
- +50 points per course completed
- +100 points per certificate earned
- +25 points per referral
- +5 points per feedback submitted

### Rewards (Optional)
- Discount codes
- Free advanced courses
- Priority enrollment
- Special recognition

---

# Trainer Onboarding

## 👨‍🏫 Trainer First 30 Minutes

### Step 1: Access Trainer Portal (5 min)

**1.1 Receive Invitation**
- Email from admin
- Contains login link
- Temporary password

**1.2 First Login**
1. Click link in email
2. Enter temporary password
3. Set new secure password
4. Complete profile

**1.3 Profile Setup**
- Upload profile photo
- Add bio and qualifications
- Upload certifications
- List specializations
- Set availability

---

### Step 2: Review Assignments (10 min)

**2.1 Dashboard Overview**
1. Navigate to: Trainer Dashboard
2. View:
   - Upcoming classes
   - Student rosters
   - Course materials
   - Performance metrics

**2.2 First Assignment**
1. Click on upcoming class
2. Review:
   - Course content
   - Student list (names, experience levels)
   - Special requirements/accommodations
   - Venue details
   - Equipment checklist

**2.3 Prepare Materials**
- Download course materials
- Review lesson plan
- Prepare handouts
- Check equipment needs
- Contact admin if questions

---

### Step 3: Learn the Tools (15 min)

**3.1 Attendance System**
1. Mobile-friendly interface
2. Mark students present/absent
3. Add notes if needed
4. Submit at end of class

**3.2 Document Review**
1. Access student documents
2. Verify ID and qualifications
3. Approve or request re-submission
4. Add reviewer notes

**3.3 Field Assessment**
1. Mobile evidence capture
2. Take photos/videos
3. Tag students
4. Add assessment notes
5. Submit to admin

**3.4 Feedback System**
1. Session report template
2. Student performance notes
3. Incident reporting
4. Improvement suggestions

---

## 📋 Trainer Daily Workflow

### Pre-Class Checklist (30 min before)
- [ ] Arrive at venue
- [ ] Set up equipment
- [ ] Test A/V systems
- [ ] Arrange seating
- [ ] Print materials (if needed)
- [ ] Review student roster
- [ ] Mark attendance ready

### During Class
- [ ] Welcome students
- [ ] Mark attendance
- [ ] Deliver content
- [ ] Facilitate activities
- [ ] Monitor engagement
- [ ] Complete assessments
- [ ] Take field evidence photos
- [ ] Answer questions

### Post-Class (15 min after)
- [ ] Submit attendance
- [ ] Upload evidence photos
- [ ] Complete session report
- [ ] Provide student feedback
- [ ] Note any incidents
- [ ] Clean up venue
- [ ] Submit timesheet

---

## 🎯 Trainer Best Practices

### Engagement Techniques
- **Interactive delivery** - Ask questions, encourage discussion
- **Hands-on practice** - Learning by doing
- **Real-world examples** - Relate to actual scenarios
- **Visual aids** - Use slides, videos, demonstrations
- **Group activities** - Team-based learning
- **Regular breaks** - Keep energy levels high

### Assessment Methods
- **Practical demonstrations** - Hands-on skills testing
- **Written assessments** - Knowledge verification
- **Group projects** - Collaborative evaluation
- **Field evidence** - Photo/video documentation
- **Observation** - Continuous assessment

### Documentation
- **Clear notes** - Detailed and specific
- **Photo evidence** - Good lighting, clear subjects
- **Timely submission** - Within 24 hours
- **Incident reports** - Immediate reporting
- **Student feedback** - Constructive and actionable

### Communication
- **Prompt responses** - Reply to student queries within 24 hours
- **Professional tone** - Maintain boundaries
- **Clear instructions** - Avoid ambiguity
- **Regular updates** - Keep admin informed
- **Constructive feedback** - Focus on improvement

---

## 🔧 Trainer Tools & Resources

### Mobile App Features
- Offline mode for attendance
- Camera for evidence capture
- Student roster access
- Session notes
- Sync when online

### Training Materials
- Lesson plans
- Presentation slides
- Handouts (PDF)
- Videos
- Assessment templates

### Support Resources
- Admin contact
- Technical support
- Curriculum updates
- Best practice guides
- Trainer community forum

---

# Feature Guides

## 📅 Calendar & Scheduling

### Creating a Class

**Method 1: Quick Create**
1. Navigate to: Calendar
2. Click on desired date/time
3. Quick form appears:
   - Select course
   - Set duration
   - Add location
   - Assign trainer
4. Click "Create"

**Method 2: Detailed Create**
1. Calendar → "New Event" button
2. Complete full form:
   - Course selection
   - Date and time
   - Duration
   - Location/venue
   - Trainer assignment
   - Max capacity
   - Price override (if different from course default)
   - Special requirements
   - Notes for trainer
3. Click "Create and Publish"

### Recurring Classes

1. Create first class
2. Click "Make Recurring"
3. Set pattern:
   - Daily
   - Weekly (select days)
   - Monthly
   - Custom
4. Set end date or occurrence count
5. Review generated schedule
6. Click "Create All"

### Managing Capacity

- **Auto-waitlist**: When class is full, students auto-added to waitlist
- **Waitlist notifications**: Auto-notify when spot opens
- **Capacity increase**: Admin can increase capacity on-the-fly
- **Overbooking**: Optional setting to allow X% overbooking

---

## 💳 Payment Processing

### Stripe Integration

**Setup:**
1. Create Stripe account
2. Get API keys:
   - Publishable key
   - Secret key
   - Webhook secret
3. Add to `.env.local`
4. Configure webhook endpoint
5. Test in Stripe test mode

**Supported Payment Methods:**
- Credit/debit cards
- Apple Pay
- Google Pay
- Bank transfers (ACH)
- Payment plans

**Payment Flows:**

**One-Time Payment:**
1. Student selects course
2. Proceeds to checkout
3. Enters card details
4. Stripe processes payment
5. Confirmation email sent
6. Enrollment confirmed

**Payment Plans:**
1. Admin creates payment plan
2. Student opts for installments
3. First payment processed
4. Subsequent payments auto-charged
5. Enrollment confirmed after full payment

**Refunds:**
1. Admin initiates refund
2. Full or partial amount
3. Stripe processes
4. Funds returned in 5-7 days
5. Student notified

---

## 📜 Certificate Generation

### Certificate Templates

**Create Template:**
1. Navigate to: Certificates → Templates
2. Click "New Template"
3. Design certificate:
   - Background image
   - Logo placement
   - Merge fields:
     * `{{student_name}}`
     * `{{course_name}}`
     * `{{completion_date}}`
     * `{{certificate_number}}`
     * `{{instructor_name}}`
     * `{{instructor_signature}}`
4. Preview
5. Save template

### Manual Generation

1. Go to: Students → [Student]
2. Select completed enrollment
3. Click "Generate Certificate"
4. Select template
5. Preview PDF
6. Send to student or download

### Bulk Generation

1. Navigate to: Certificates → Bulk Generate
2. Select:
   - Course
   - Completion date range
   - Template
3. Review student list
4. Click "Generate All"
5. Certificates created and emailed

### Verification

Each certificate includes:
- Unique certificate number
- QR code for verification
- Verification URL
- Digital signature

**Public Verification:**
1. Anyone can verify at: `/verify-certificate`
2. Enter certificate number
3. View certificate details
4. Confirm authenticity

---

## ✍️ E-Signatures & Contracts

### Contract Templates

**Create Template:**
1. Navigate to: Signatures → Templates
2. Click "New Template"
3. Enter contract text with merge fields:
   ```
   ENROLLMENT AGREEMENT
   
   This agreement is made on {{date}} between:
   
   TRAINING CENTRE: {{company_name}}
   STUDENT: {{student_name}}
   
   For the following course:
   COURSE: {{course_name}}
   START DATE: {{start_date}}
   PRICE: {{price}}
   
   [Contract terms...]
   
   Student Signature: _______________
   Date: {{signature_date}}
   ```
4. Set expiry (default: 7 days)
5. Save template

### Sending Signature Request

**From Booking:**
1. Go to: Bookings → [Booking]
2. Click "Send Contract"
3. Select template
4. Review generated contract
5. Click "Send for Signature"

**Standalone Request:**
1. Navigate to: Signatures → New Request
2. Select:
   - Recipient (student)
   - Template
   - Related booking
3. Generate and send

### Signing Process

**Student Experience:**
1. Receives email with unique link
2. Clicks link to review contract
3. Reviews all terms
4. Agrees to terms (checkbox)
5. Signs using:
   - Draw signature
   - Type signature
   - Upload signature image
6. Submits

**System Records:**
- Signature image
- IP address
- Timestamp
- Browser/device info
- Legal audit trail

### Contract Management

**Admin View:**
1. All contracts in one place
2. Filter by:
   - Status (pending/signed/expired)
   - Student
   - Course
   - Date range
3. Download signed PDFs
4. Resend if expired
5. View audit trail

**Compliance:**
- All signatures legally binding
- Complete audit trail
- Tamper-proof storage
- IP and timestamp logging
- Export for legal purposes

---

## 📸 Field Evidence Capture

### Mobile Evidence Upload

**Trainer Workflow:**
1. Open class in mobile browser
2. Navigate to "Evidence" tab
3. Click "Capture Photo/Video"
4. Take evidence:
   - Photo of student performing task
   - Video of skill demonstration
   - Document scans
5. Add notes:
   - What skill is being demonstrated
   - Pass/fail/needs improvement
   - Specific feedback
6. Tag student(s) in photo
7. Submit

**Features:**
- Works offline (syncs when online)
- Multiple photos per assessment
- Video support (max 2 min)
- Geolocation tagging
- Timestamp verification

### Evidence Review

**Admin/Trainer View:**
1. Navigate to: Documents → Field Evidence
2. Filter by:
   - Class
   - Student
   - Date
   - Status
3. Click to view:
   - Full-size image/video
   - Metadata (location, time, device)
   - Linked student and assessment
   - Trainer notes
4. Approve or request retake

**Student View:**
1. Student Portal → My Evidence
2. View all evidence related to them
3. Download photos
4. See assessment results

---

## 📊 Analytics & Reporting

### Dashboard Analytics

**Key Metrics:**
- Total revenue (MTD, YTD)
- Active students
- Course completion rate
- Average class size
- Trainer utilization
- Student satisfaction score

**Visualizations:**
- Revenue trends (line chart)
- Enrollment by course (bar chart)
- Student demographics (pie charts)
- Geographic distribution (map)
- Completion rates over time

### Custom Reports

**Available Reports:**
1. **Financial Reports**
   - Revenue by course
   - Payment method breakdown
   - Outstanding payments
   - Refund summary

2. **Student Reports**
   - Enrollment trends
   - Completion rates
   - Attendance statistics
   - Certificate issuance

3. **Course Reports**
   - Course popularity
   - Trainer performance
   - Capacity utilization
   - Student feedback scores

4. **Compliance Reports**
   - Document verification status
   - Contract signing completion
   - Certification expirations
   - Audit log exports

**Export Options:**
- PDF
- Excel (CSV)
- Email scheduled reports
- API access for custom integrations

### AI-Powered Insights (Optional)

**Requires OpenAI API key**

**Features:**
- Predictive enrollment forecasting
- Student churn risk analysis
- Course recommendation engine
- Automated anomaly detection
- Natural language queries

**Example Insights:**
- "Students who complete Course A are 70% likely to enroll in Course B"
- "Class capacity utilization peaks on Tuesdays"
- "Student satisfaction highest with morning classes"
- "3 students at risk of dropping out this month"

---

## 🔔 Notification System

### Email Notifications

**Automated Triggers:**
1. **Enrollment Confirmed**
   - Welcome message
   - Course details
   - Calendar invite
   - Pre-course materials

2. **Payment Received**
   - Receipt
   - Invoice (PDF attached)
   - Payment confirmation

3. **Class Reminder**
   - 24 hours before class
   - 2 hours before class
   - Includes location and requirements

4. **Certificate Ready**
   - Congratulations message
   - PDF certificate attached
   - Share on social media links

5. **Document Status**
   - Approved
   - Rejected (with reason and instructions)
   - Re-upload requested

6. **Signature Request**
   - Contract link
   - Expiry warning
   - Deadline reminder

**Customization:**
- Edit email templates
- Add company branding
- Customize sender name
- A/B test subject lines

### SMS Notifications

**Configured with Twilio**

**Critical Alerts:**
- Class starting soon (2 hours)
- Last-minute class changes
- Payment reminders
- Document urgently needed
- Verification codes (2FA)

**User Preferences:**
- Opt-in/opt-out per category
- Set quiet hours
- Choose notification channels

### In-App Notifications

**Real-Time Updates:**
- New message from admin
- Booking status change
- Payment processed
- Certificate generated
- Course material uploaded

**Notification Center:**
- Unread count badge
- Mark as read/unread
- Archive old notifications
- Filter by type

---

## 🎮 Gamification System

### Achievement System

**Badge Categories:**

1. **Starter Badges**
   - First Login
   - Profile Complete
   - First Course Enrolled
   - First Class Attended

2. **Learning Badges**
   - Quick Learner (complete course fast)
   - Dedicated Student (maintain streak)
   - Perfect Score (100% on assessment)
   - Overachiever (bonus material completed)

3. **Engagement Badges**
   - Active Participant (ask questions)
   - Helpful Peer (assist classmates)
   - Feedback Champion (provide feedback)
   - Community Builder (forum activity)

4. **Milestone Badges**
   - 5 Courses Complete
   - 10 Courses Complete
   - 1 Year Anniversary
   - Master Certification

**Badge Display:**
- Student profile page
- Leaderboard
- Shareable on social media
- Print certificates with badges

### Points System

**Earn Points:**
- +10 per class attended
- +50 per course completed
- +100 per certificate earned
- +25 per friend referred
- +5 per feedback submitted
- +20 per forum helpful answer

**Spend Points (Optional):**
- Discount on next course
- Priority enrollment
- Free course upgrade
- Exclusive content access

### Leaderboards

**Types:**
- All-time top performers
- Monthly top learners
- Course-specific leaders
- Team/organization rankings

**Privacy:**
- Opt-in to public leaderboard
- Anonymous mode available
- Display name vs real name

### Social Features

**Profile Sharing:**
- Public profile with achievements
- Share on LinkedIn/Twitter
- QR code for easy sharing
- Verification link

**Course Reviews:**
- Rate courses (1-5 stars)
- Write detailed reviews
- Upload photos from class
- Helpful vote system

---

# Database Setup

## 🗄️ Database Schema

### Tables Overview (40+ Tables)

**Core Tables:**

```sql
-- User Management
profiles (id, email, full_name, avatar_url, role, created_at)
user_roles (id, user_id, role, assigned_by, assigned_at)
notification_preferences (user_id, email_enabled, sms_enabled, push_enabled)

-- Course Management
courses (id, name, description, duration, price, max_students, prerequisites)
scheduled_classes (id, course_id, start_date, end_date, location, trainer_id, capacity)
course_templates (id, template_name, content, category)

-- Enrollment
enrollments (id, student_id, course_id, scheduled_class_id, status, payment_status)
waitlist (id, student_id, scheduled_class_id, position, created_at)
attendance (id, enrollment_id, date, status, notes)

-- Payments
payments (id, enrollment_id, amount, payment_method, status, transaction_id)
payment_plans (id, enrollment_id, total_amount, installments, paid_installments)
refunds (id, payment_id, amount, reason, processed_at)

-- Documents
documents (id, student_id, booking_id, file_name, file_url, document_type, status)
certificates (id, student_id, course_id, certificate_number, issued_at)
document_templates (id, template_name, content, variables)

-- E-Signatures
contracts (id, template_id, booking_id, content, status, signed_at)
contract_templates (id, template_name, content, document_type, merge_fields)
signature_requests (id, contract_id, recipient_email, status, expires_at)
signature_audit (id, signature_request_id, ip_address, device_info, signed_at)

-- Communication
email_logs (id, recipient, subject, body, status, sent_at, opened_at)
sms_logs (id, recipient, message, status, sent_at)
notifications (id, user_id, title, message, type, read, created_at)

-- Analytics
audit_logs (id, user_id, action, resource, ip_address, created_at)
activity_timeline (id, user_id, activity_type, description, created_at)
system_health_metrics (id, metric_name, value, timestamp)
```

### Indexes (30+ Optimized Indexes)

**Performance Indexes:**
```sql
-- Enrollment lookups
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_class ON enrollments(scheduled_class_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);

-- Payment queries
CREATE INDEX idx_payments_enrollment ON payments(enrollment_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_date ON payments(created_at DESC);

-- Document search
CREATE INDEX idx_documents_student ON documents(student_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_type ON documents(document_type);

-- Full-text search
CREATE INDEX idx_courses_search ON courses USING gin(to_tsvector('english', name || ' ' || description));
CREATE INDEX idx_students_search ON profiles USING gin(to_tsvector('english', full_name || ' ' || email));

-- Composite indexes
CREATE INDEX idx_enrollments_student_status ON enrollments(student_id, status);
CREATE INDEX idx_classes_date_status ON scheduled_classes(start_date, status);
```

### Row-Level Security (RLS)

**Security Policies:**

```sql
-- Students can only see their own data
CREATE POLICY "Students see own enrollments" ON enrollments
  FOR SELECT
  USING (auth.uid() = student_id);

-- Students can only update their own profile
CREATE POLICY "Students update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Admins can see all data
CREATE POLICY "Admins see all enrollments" ON enrollments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- Trainers can see assigned classes
CREATE POLICY "Trainers see assigned classes" ON scheduled_classes
  FOR SELECT
  USING (
    trainer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- Public can view published courses
CREATE POLICY "Public can view courses" ON courses
  FOR SELECT
  USING (status = 'published');
```

### Functions & Triggers

**Automated Workflows:**

```sql
-- Auto-create profile on signup
CREATE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update timestamps
CREATE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_enrollments_updated_at
  BEFORE UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-generate certificate number
CREATE FUNCTION generate_certificate_number()
RETURNS trigger AS $$
BEGIN
  NEW.certificate_number = 'CERT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('cert_seq')::text, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Send email on booking confirmation
CREATE FUNCTION notify_booking_confirmed()
RETURNS trigger AS $$
BEGIN
  INSERT INTO email_queue (recipient, template, data)
  VALUES (
    NEW.student_email,
    'booking_confirmation',
    jsonb_build_object(
      'student_name', NEW.student_name,
      'course_name', NEW.course_name,
      'start_date', NEW.start_date
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔧 Database Maintenance

### Automated Backups

**Daily Backups via Edge Function:**

```typescript
// supabase/functions/backup-database/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  // Trigger daily backup
  const response = await fetch(
    `${SUPABASE_URL}/database/postgres/backups`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      }
    }
  );
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

**Cron Schedule:**
```sql
-- Run daily at 2 AM UTC
SELECT cron.schedule(
  'daily-backup',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url:='https://yiqgncisrdbwogdkcnnn.supabase.co/functions/v1/backup-database',
    headers:='{"Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb
  );
  $$
);
```

**Backup Retention:**
- Daily: Keep 7 days
- Weekly: Keep 4 weeks
- Monthly: Keep 12 months

### Performance Monitoring

**Slow Query Detection:**
```sql
-- Enable query logging
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1s

-- View slow queries
SELECT
  calls,
  total_time,
  mean_time,
  query
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC
LIMIT 20;
```

**Index Usage:**
```sql
-- Find unused indexes
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexname NOT LIKE 'pg_toast%'
ORDER BY schemaname, tablename;
```

**Table Bloat:**
```sql
-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Data Cleanup

**Archive Old Data:**
```sql
-- Archive completed enrollments older than 2 years
INSERT INTO enrollments_archive
SELECT * FROM enrollments
WHERE status = 'completed'
  AND updated_at < NOW() - INTERVAL '2 years';

DELETE FROM enrollments
WHERE status = 'completed'
  AND updated_at < NOW() - INTERVAL '2 years';
```

**Vacuum & Analyze:**
```sql
-- Regular maintenance
VACUUM ANALYZE enrollments;
VACUUM ANALYZE payments;
VACUUM ANALYZE documents;

-- Full vacuum (requires downtime)
VACUUM FULL ANALYZE;
```

---

# Deployment Guide

## 🚀 Vercel Deployment

### Prerequisites

1. **Vercel Account**
   - Sign up: https://vercel.com/signup
   - Install CLI: `npm i -g vercel`

2. **GitHub Repository**
   - Project already pushed
   - Main branch ready

3. **Environment Variables Ready**
   - Supabase keys
   - Stripe keys (optional)
   - OpenAI key (optional)

### Step-by-Step Deployment

**Step 1: Connect Repository**

1. Go to: https://vercel.com/new
2. Import your GitHub repository
3. Select "GTSTrain" repository
4. Click "Import"

**Step 2: Configure Project**

```
Framework Preset: Next.js
Root Directory: ./
Build Command: next build
Output Directory: .next
Install Command: npm install
```

**Step 3: Add Environment Variables**

Click "Environment Variables" and add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://yiqgncisrdbwogdkcnnn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app

# Optional - Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# Optional - OpenAI
OPENAI_API_KEY=sk-xxx
```

**Step 4: Deploy**

1. Click "Deploy"
2. Wait 2-3 minutes for build
3. Deployment successful!
4. Visit your site: `https://your-project.vercel.app`

**Step 5: Custom Domain (Optional)**

1. Go to: Project Settings → Domains
2. Add your domain: `gtstrain.eastshoresit.com.au`
3. Configure DNS:
   ```
   Type: CNAME
   Name: gtstrain
   Value: cname.vercel-dns.com
   ```
4. Wait for DNS propagation (5-30 min)
5. SSL certificate auto-generated

**Step 6: Configure Supabase Redirects**

1. Go to: Supabase Dashboard → Authentication → URL Configuration
2. Add redirect URLs:
   ```
   https://gtstrain.eastshoresit.com.au/**
   https://*.vercel.app/**
   ```
3. Set Site URL: `https://gtstrain.eastshoresit.com.au`

**Step 7: Configure Stripe Webhook (If Using)**

1. Go to: Stripe Dashboard → Webhooks
2. Add endpoint: `https://gtstrain.eastshoresit.com.au/api/stripe/webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook secret
5. Add to Vercel env vars as `STRIPE_WEBHOOK_SECRET`
6. Redeploy

---

## 🔐 Production Checklist

### Security

- [ ] All environment variables set
- [ ] Service role key kept secret
- [ ] HTTPS enabled (auto via Vercel)
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] SQL injection prevention (via Supabase)
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented

### Performance

- [ ] Images optimized (Next.js Image component)
- [ ] Static assets cached
- [ ] Database indexes created
- [ ] API routes optimized
- [ ] Code splitting enabled
- [ ] Lazy loading images
- [ ] Compression enabled

### Monitoring

- [ ] Error tracking enabled (Sentry/Vercel Analytics)
- [ ] Performance monitoring active
- [ ] Database backups automated
- [ ] Health checks configured
- [ ] Uptime monitoring (UptimeRobot)
- [ ] Log aggregation (Vercel Logs)

### Testing

- [ ] All features tested in production
- [ ] Payment flow tested (test mode first)
- [ ] Email delivery verified
- [ ] SMS delivery verified (if enabled)
- [ ] Certificate generation tested
- [ ] E-signature flow tested
- [ ] Mobile responsiveness checked
- [ ] Cross-browser compatibility

### Documentation

- [ ] User guides accessible
- [ ] API documentation updated
- [ ] Admin onboarding complete
- [ ] Support contact info correct
- [ ] Privacy policy updated
- [ ] Terms of service updated

---

## 🔄 Continuous Deployment

### Auto-Deploy on Git Push

Vercel automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "Add new feature"
git push origin main
```

Vercel detects push → builds → deploys automatically!

### Preview Deployments

Every branch gets a preview URL:

```bash
git checkout -b feature/new-feature
git push origin feature/new-feature
```

Vercel creates: `https://gtstrain-git-feature-new-feature.vercel.app`

### Rollback

If something breaks:

1. Go to: Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"
4. Instant rollback!

---

# Backup & Recovery

## 💾 Automated Backup System

### Daily Backups

**Backup Scheduling:**
```sql
-- Edge Function triggered daily at 2 AM UTC
SELECT cron.schedule(
  'daily-database-backup',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url:='https://yiqgncisrdbwogdkcnnn.supabase.co/functions/v1/backup-database',
    headers:='{"Authorization": "Bearer SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

**Backup Contents:**
- Full database dump
- All tables and indexes
- User data
- System configurations
- File storage metadata

**Backup Storage:**
- Supabase: 7 daily backups
- External S3: Weekly backups (optional)
- Local download: On-demand

### Backup Verification

**Daily Checks:**
```sql
-- Verify backup completed
SELECT
  backup_id,
  created_at,
  size_bytes,
  status
FROM backups
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

**Monthly Integrity Test:**
1. Download random backup
2. Restore to test database
3. Run data integrity checks
4. Verify all tables accessible
5. Test sample queries

### Manual Backup

**On-Demand Backup:**

**Method 1: Supabase Dashboard**
1. Go to: Database → Backups
2. Click "Create Backup"
3. Wait for completion
4. Download backup file

**Method 2: CLI Command**
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Create backup
supabase db dump -f backup-$(date +%Y%m%d).sql
```

**Method 3: API Call**
```bash
curl -X POST \
  https://yiqgncisrdbwogdkcnnn.supabase.co/functions/v1/backup-database \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

---

## 🔄 Disaster Recovery

### Recovery Time Objectives (RTO)

- **Critical Services**: < 1 hour
- **Database Restore**: < 2 hours
- **Full System Recovery**: < 4 hours

### Recovery Procedures

**Scenario 1: Data Corruption**

1. **Identify Issue**
   - Run data integrity checks
   - Identify affected tables
   - Determine time of corruption

2. **Select Backup**
   ```sql
   -- Find backup before corruption
   SELECT * FROM backups
   WHERE created_at < 'corruption_timestamp'
   ORDER BY created_at DESC
   LIMIT 1;
   ```

3. **Restore Data**
   ```bash
   # Download backup
   supabase db dump --db-url "backup_url" > restore.sql
   
   # Restore to production (CAREFUL!)
   psql $DATABASE_URL < restore.sql
   ```

4. **Verify**
   - Check affected tables
   - Run data integrity tests
   - Verify application functionality
   - Notify users of any data loss

**Scenario 2: Complete Database Loss**

1. **Emergency Response**
   - Activate incident response team
   - Put site in maintenance mode
   - Notify stakeholders

2. **Provision New Database**
   - Create new Supabase project
   - Configure security settings
   - Set up connection strings

3. **Restore Latest Backup**
   ```bash
   # Get latest backup
   latest_backup=$(supabase backups list | head -1)
   
   # Restore
   supabase db restore $latest_backup
   ```

4. **Rebuild Indexes**
   ```sql
   -- Rebuild all indexes
   REINDEX DATABASE gtstrain;
   
   -- Analyze tables
   ANALYZE;
   ```

5. **Update Environment**
   - Update `.env.local` with new DB URL
   - Deploy to Vercel
   - Test all functionality

6. **Resume Operations**
   - Remove maintenance mode
   - Monitor system closely
   - Send status update to users

**Scenario 3: Accidental Data Deletion**

1. **Stop Further Damage**
   ```sql
   -- Immediately revoke permissions
   REVOKE ALL ON affected_table FROM problematic_user;
   ```

2. **Assess Scope**
   ```sql
   -- Check audit logs
   SELECT * FROM audit_logs
   WHERE action = 'DELETE'
     AND resource = 'affected_table'
     AND created_at > 'deletion_start_time';
   ```

3. **Restore from Backup**
   ```sql
   -- Restore only affected table
   psql $DATABASE_URL << EOF
   BEGIN;
   DROP TABLE IF EXISTS affected_table_old;
   ALTER TABLE affected_table RENAME TO affected_table_old;
   -- Restore table from backup
   \i restore_affected_table.sql
   COMMIT;
   EOF
   ```

4. **Verify and Cleanup**
   - Compare old vs new table
   - Restore any new data created after backup
   - Drop old table once verified

---

## 📊 Backup Monitoring

### Health Dashboard

**Backup Metrics:**
- Last backup time
- Backup size trend
- Success/failure rate
- Storage usage
- Recovery time tests

**Alert Triggers:**
- Backup fails
- Backup size anomaly (too large/small)
- Backup not run in 25 hours
- Storage approaching limit
- Restoration test fails

**Alert Channels:**
- Email to admin
- SMS to on-call
- Slack/Discord webhook
- PagerDuty incident

---

# Monitoring & Performance

## 📈 System Health Monitoring

### Real-Time Dashboard

**URL:** `/admin/system-health`

**Monitored Metrics:**

**1. Database Health**
- Connection pool status
- Active connections
- Query performance
- Table sizes
- Index efficiency

**2. API Performance**
- Response times (p50, p95, p99)
- Error rates
- Request throughput
- Rate limit usage

**3. Application Health**
- Page load times
- Client-side errors
- Build status
- Deployment history

**4. External Services**
- Supabase status
- Stripe API health
- Email delivery rates
- SMS delivery rates

**5. Storage**
- Database size
- File storage usage
- Backup status
- Storage quota

---

## 🔍 Performance Optimization

### Database Optimization

**Query Performance:**
```sql
-- Identify slow queries
SELECT
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 20;
```

**Index Recommendations:**
```sql
-- Find missing indexes
SELECT
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 100
  AND correlation < 0.1;
```

**Connection Pooling:**
```typescript
// Optimal pool size
const pool = new Pool({
  max: 20, // Max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Application Performance

**Image Optimization:**
```typescript
// Use Next.js Image component
import Image from "next/image";

<Image
  src="/course-photo.jpg"
  alt="Course"
  width={800}
  height={600}
  loading="lazy"
  quality={85}
/>
```

**Code Splitting:**
```typescript
// Dynamic imports
const CertificateGenerator = dynamic(
  () => import("@/components/CertificateGenerator"),
  { loading: () => <SkeletonLoader /> }
);
```

**API Caching:**
```typescript
// Cache course data
export async function getCourses() {
  const { data } = await supabase
    .from("courses")
    .select("*")
    .eq("status", "published");

  return data;
}

// With cache
export const getStaticProps = async () => {
  const courses = await getCourses();
  return {
    props: { courses },
    revalidate: 3600, // 1 hour
  };
};
```

---

## 📊 Analytics & Insights

### Google Analytics (Optional)

**Setup:**
```typescript
// _app.tsx
import Script from "next/script";

<Script
  src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
  strategy="afterInteractive"
/>
```

**Track Events:**
```typescript
// Track enrollment
gtag("event", "enrollment", {
  course_id: courseId,
  course_name: courseName,
  value: price,
});

// Track certificate download
gtag("event", "certificate_download", {
  certificate_id: certId,
});
```

### Custom Analytics

**Track User Behavior:**
```sql
-- Most popular courses
SELECT
  c.name,
  COUNT(e.id) as enrollment_count,
  AVG(f.rating) as avg_rating
FROM courses c
JOIN enrollments e ON c.id = e.course_id
LEFT JOIN feedback f ON e.id = f.enrollment_id
GROUP BY c.id, c.name
ORDER BY enrollment_count DESC;

-- Student retention
SELECT
  DATE_TRUNC('month', e.created_at) as month,
  COUNT(DISTINCT e.student_id) as total_students,
  COUNT(DISTINCT e2.student_id) as returning_students
FROM enrollments e
LEFT JOIN enrollments e2 ON
  e.student_id = e2.student_id
  AND e2.created_at > e.created_at + INTERVAL '30 days'
GROUP BY month
ORDER BY month DESC;
```

---

# Testing & Quality Assurance

## 🧪 E2E Smoke Test (30 Minutes)

### Test Scenarios

**Test 1: Admin Login & Dashboard**
1. Navigate to `/admin/login`
2. Login with admin credentials
3. Verify dashboard loads
4. Check all widgets display data
5. Navigate to each admin section
   - ✅ Courses
   - ✅ Bookings
   - ✅ Students
   - ✅ Payments
   - ✅ Calendar
   - ✅ Documents
   - ✅ Analytics
6. All pages load without errors

**Test 2: Course Creation**
1. Go to `/admin/courses`
2. Click "Create New Course"
3. Fill in all fields
4. Upload course image
5. Add course materials
6. Save course
7. Verify course appears in catalog
8. Edit course and save
9. Verify changes persisted

**Test 3: Class Scheduling**
1. Navigate to `/admin/calendar`
2. Click "New Event"
3. Select course
4. Set date/time
5. Assign trainer
6. Set capacity
7. Publish
8. Verify class appears on calendar
9. Click class to view details
10. Edit and save changes

**Test 4: Student Enrollment (Manual)**
1. Go to `/admin/students`
2. Click "Add Student"
3. Enter student details
4. Save
5. Navigate to `/admin/bookings`
6. Click "New Booking"
7. Select student and class
8. Complete enrollment
9. Verify enrollment appears in list
10. Check student can see enrollment in portal

**Test 5: Student Portal**
1. Logout as admin
2. Go to `/student/portal`
3. Create new student account
4. Verify email received
5. Complete profile
6. Browse courses
7. Add course to wishlist
8. Enroll in free course
9. View enrollment details
10. Check course materials accessible

**Test 6: Payment Processing (If Stripe Enabled)**
1. Student enrolls in paid course
2. Proceeds to checkout
3. Enter test card: `4242 4242 4242 4242`
4. Complete payment
5. Verify payment successful
6. Check admin sees payment
7. Verify receipt email sent
8. Student sees enrollment confirmed

**Test 7: Document Upload**
1. Student uploads ID document
2. Admin receives notification
3. Admin reviews document
4. Admin approves/rejects
5. Student notified of status
6. If rejected, student re-uploads
7. Verify workflow completes

**Test 8: Certificate Generation**
1. Mark student attendance 100%
2. Mark course complete
3. Generate certificate
4. Preview PDF
5. Send to student
6. Student receives email
7. Student downloads certificate
8. Verify certificate contents correct

**Test 9: E-Signature Flow**
1. Admin sends contract to student
2. Student receives email
3. Student clicks signature link
4. Reviews contract
5. Signs digitally
6. Submits signature
7. Admin sees signed contract
8. Verify audit trail recorded

**Test 10: Notifications**
1. Verify enrollment confirmation email
2. Check booking reminder (24h before)
3. Test payment receipt
4. Verify certificate delivery
5. Check signature request email
6. Test SMS notifications (if enabled)

---

## 🎯 Test Checklist

### Functionality Tests

**Authentication:**
- [ ] Admin login
- [ ] Student login
- [ ] Trainer login
- [ ] Password reset
- [ ] Email verification
- [ ] 2FA (if enabled)

**Course Management:**
- [ ] Create course
- [ ] Edit course
- [ ] Delete course
- [ ] Upload materials
- [ ] Set prerequisites
- [ ] Publish/unpublish

**Scheduling:**
- [ ] Create class
- [ ] Edit class
- [ ] Cancel class
- [ ] Assign trainer
- [ ] Set capacity
- [ ] Recurring classes

**Enrollment:**
- [ ] Manual enrollment
- [ ] Self-enrollment
- [ ] Waitlist
- [ ] Bulk import
- [ ] Cancellation
- [ ] Refund

**Payments:**
- [ ] Online payment (Stripe)
- [ ] Manual payment entry
- [ ] Payment plans
- [ ] Refunds
- [ ] Receipt generation
- [ ] Invoice download

**Documents:**
- [ ] Upload document
- [ ] Review/approve
- [ ] Reject with reason
- [ ] Bulk approval
- [ ] Document search
- [ ] Download

**Certificates:**
- [ ] Create template
- [ ] Generate single
- [ ] Bulk generate
- [ ] Send to student
- [ ] Download PDF
- [ ] Verify certificate

**E-Signatures:**
- [ ] Create template
- [ ] Send request
- [ ] Student signs
- [ ] View signed contract
- [ ] Audit trail
- [ ] Expired contract handling

**Notifications:**
- [ ] Email delivery
- [ ] SMS delivery (if enabled)
- [ ] In-app notifications
- [ ] Notification preferences
- [ ] Template customization

**Reports:**
- [ ] Financial reports
- [ ] Student reports
- [ ] Course reports
- [ ] Compliance reports
- [ ] Export to PDF/CSV
- [ ] Scheduled reports

### Performance Tests

- [ ] Page load time < 3s
- [ ] API response time < 500ms
- [ ] Database queries < 100ms
- [ ] File uploads < 5s
- [ ] PDF generation < 3s
- [ ] Search results < 1s

### Mobile Tests

- [ ] Responsive design
- [ ] Touch interactions
- [ ] Camera access (evidence)
- [ ] Offline mode (PWA)
- [ ] Mobile navigation
- [ ] Forms usable on mobile

### Browser Tests

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari
- [ ] Mobile Chrome

---

# Troubleshooting

## 🚨 Common Issues & Solutions

### Issue: Can't Login

**Symptoms:**
- "Invalid credentials" error
- Redirect loop
- Session not persisting

**Possible Causes:**
1. Incorrect password
2. Account not activated
3. Browser cookies disabled
4. Supabase session expired

**Solutions:**

**Step 1: Reset Password**
```
1. Click "Forgot Password" on login page
2. Enter email address
3. Check inbox for reset link
4. Create new password
5. Try logging in again
```

**Step 2: Check Email Verification**
```sql
-- Check if email verified
SELECT
  id,
  email,
  email_confirmed_at
FROM auth.users
WHERE email = 'user@example.com';

-- If NULL, resend verification
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'user@example.com';
```

**Step 3: Clear Cookies**
```
1. Open browser settings
2. Clear browsing data
3. Select "Cookies and site data"
4. Clear last hour
5. Try login again
```

**Step 4: Check Supabase Status**
```
1. Visit: https://status.supabase.com
2. Check for incidents
3. If down, wait for resolution
4. Subscribe to status updates
```

---

### Issue: Payment Failed

**Symptoms:**
- Payment declined
- Error at checkout
- Charge not appearing

**Possible Causes:**
1. Insufficient funds
2. Card declined by bank
3. Stripe in test mode
4. Incorrect card details
5. 3D Secure required

**Solutions:**

**Step 1: Verify Card Details**
```
1. Check card number correct
2. Verify expiry date
3. Confirm CVV code
4. Ensure billing address matches
```

**Step 2: Test Card (Development)**
```
Test Card: 4242 4242 4242 4242
Expiry: Any future date
CVV: Any 3 digits
ZIP: Any valid ZIP

For 3D Secure test: 4000 0027 6000 3184
```

**Step 3: Check Stripe Dashboard**
```
1. Login to Stripe
2. View failed payments
3. Check decline reason
4. Contact customer's bank if needed
```

**Step 4: Manual Payment Entry**
```
1. Admin: Go to Bookings
2. Find enrollment
3. Click "Add Payment"
4. Select "Manual Entry"
5. Enter payment details
6. Save
```

---

### Issue: Certificate Not Generated

**Symptoms:**
- Generate button not working
- PDF not downloading
- Certificate marked "pending"

**Possible Causes:**
1. Course not marked complete
2. Attendance < 100%
3. Assessment not passed
4. Template missing

**Solutions:**

**Step 1: Verify Completion Criteria**
```sql
-- Check enrollment status
SELECT
  e.id,
  e.status,
  e.completion_percentage,
  a.attendance_rate
FROM enrollments e
LEFT JOIN (
  SELECT
    enrollment_id,
    (COUNT(CASE WHEN status = 'present' THEN 1 END)::float / COUNT(*)::float * 100) as attendance_rate
  FROM attendance
  GROUP BY enrollment_id
) a ON e.id = a.enrollment_id
WHERE e.student_id = 'student_id'
  AND e.course_id = 'course_id';
```

**Step 2: Manual Completion**
```
1. Admin: Go to Enrollments
2. Find enrollment
3. Click "Mark Complete"
4. Override if necessary
5. Generate certificate
```

**Step 3: Check Template**
```
1. Admin: Certificates → Templates
2. Verify template exists
3. Ensure template is active
4. Test template generation
5. Fix any template errors
```

**Step 4: Re-generate**
```
1. Delete failed certificate attempt
2. Wait 5 minutes
3. Try generation again
4. If fails, check error logs
```

---

### Issue: Emails Not Received

**Symptoms:**
- No confirmation email
- No password reset email
- No certificate email

**Possible Causes:**
1. Email in spam folder
2. Invalid email address
3. Supabase email quota exceeded
4. Email template error

**Solutions:**

**Step 1: Check Spam/Junk**
```
1. Check spam folder
2. Mark as "Not Spam"
3. Add sender to contacts
4. Check email filters
```

**Step 2: Verify Email Address**
```sql
-- Check email in database
SELECT email, email_confirmed_at
FROM auth.users
WHERE id = 'user_id';

-- Update if wrong
UPDATE auth.users
SET email = 'correct@email.com'
WHERE id = 'user_id';
```

**Step 3: Check Email Logs**
```sql
-- View recent emails
SELECT
  recipient,
  subject,
  status,
  error_message,
  created_at
FROM email_logs
WHERE recipient = 'user@example.com'
ORDER BY created_at DESC
LIMIT 10;
```

**Step 4: Resend Email**
```
1. Admin: Go to Email Logs
2. Find failed email
3. Click "Resend"
4. Verify delivery
```

**Step 5: Check Supabase Email Quota**
```
1. Supabase Dashboard → Settings → API
2. Check email quota usage
3. Upgrade plan if exceeded
4. Or configure custom SMTP
```

---

### Issue: Database Slow

**Symptoms:**
- Long page load times
- Timeouts
- Queries taking > 5s

**Solutions:**

**Step 1: Identify Slow Queries**
```sql
SELECT
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Step 2: Add Missing Indexes**
```sql
-- Example: Add index on enrollments
CREATE INDEX idx_enrollments_student_status
ON enrollments(student_id, status);

-- Re-analyze table
ANALYZE enrollments;
```

**Step 3: Optimize Queries**
```sql
-- Before (slow)
SELECT * FROM enrollments
WHERE student_id = 'xxx';

-- After (fast)
SELECT id, course_id, status
FROM enrollments
WHERE student_id = 'xxx'
  AND status = 'active';
```

**Step 4: Clear Cache**
```sql
-- Reset statistics
SELECT pg_stat_reset();

-- Vacuum tables
VACUUM ANALYZE;
```

---

### Issue: File Upload Failed

**Symptoms:**
- Upload button not working
- "File too large" error
- Upload progress stuck

**Possible Causes:**
1. File size > 10MB
2. Wrong file type
3. Storage quota exceeded
4. Network timeout

**Solutions:**

**Step 1: Check File Size**
```
Maximum file size: 10MB
Compress if larger:
- PDFs: Use online PDF compressor
- Images: Resize to 1920px max width
- Videos: Not supported in docs
```

**Step 2: Check File Type**
```
Allowed types:
- Documents: PDF, DOC, DOCX
- Images: JPG, PNG, GIF, WEBP
- Spreadsheets: XLS, XLSX, CSV

Convert if necessary
```

**Step 3: Check Storage Quota**
```sql
-- Check storage usage
SELECT
  SUM(pg_column_size(file_url)) / 1024 / 1024 as total_mb
FROM documents;
```

**Step 4: Retry Upload**
```
1. Refresh page
2. Try again
3. Use different browser if fails
4. Try mobile upload as alternative
```

---

# API Reference

## 🔌 REST API Endpoints

### Authentication

**POST /api/auth/login**
```json
Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "student"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

**POST /api/auth/signup**
```json
Request:
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe"
}

Response:
{
  "user": {
    "id": "uuid",
    "email": "newuser@example.com"
  },
  "message": "Verification email sent"
}
```

**POST /api/auth/reset-password**
```json
Request:
{
  "email": "user@example.com"
}

Response:
{
  "message": "Password reset email sent"
}
```

---

### Courses

**GET /api/courses**
```json
Response:
{
  "courses": [
    {
      "id": "uuid",
      "name": "First Aid Training",
      "description": "...",
      "duration": 8,
      "price": 250,
      "max_students": 12,
      "status": "published"
    }
  ]
}
```

**GET /api/courses/:id**
```json
Response:
{
  "id": "uuid",
  "name": "First Aid Training",
  "description": "...",
  "duration": 8,
  "price": 250,
  "scheduled_classes": [
    {
      "id": "uuid",
      "start_date": "2026-05-01T09:00:00Z",
      "location": "Training Room A",
      "available_spots": 8
    }
  ]
}
```

**POST /api/courses** (Admin only)
```json
Request:
{
  "name": "Advanced First Aid",
  "description": "...",
  "duration": 16,
  "price": 500,
  "max_students": 10,
  "prerequisites": ["basic-first-aid"]
}

Response:
{
  "id": "uuid",
  "name": "Advanced First Aid",
  "status": "draft"
}
```

---

### Enrollments

**POST /api/enrollments**
```json
Request:
{
  "student_id": "uuid",
  "scheduled_class_id": "uuid",
  "payment_method": "stripe"
}

Response:
{
  "enrollment": {
    "id": "uuid",
    "status": "pending_payment",
    "payment_url": "https://checkout.stripe.com/..."
  }
}
```

**GET /api/enrollments/:id**
```json
Response:
{
  "id": "uuid",
  "student": {
    "id": "uuid",
    "name": "John Doe"
  },
  "course": {
    "id": "uuid",
    "name": "First Aid Training"
  },
  "scheduled_class": {
    "start_date": "2026-05-01T09:00:00Z"
  },
  "status": "confirmed",
  "payment_status": "paid"
}
```

---

### Payments

**POST /api/stripe/create-checkout**
```json
Request:
{
  "enrollment_id": "uuid",
  "amount": 250,
  "currency": "usd"
}

Response:
{
  "checkout_url": "https://checkout.stripe.com/c/pay/..."
}
```

**POST /api/stripe/webhook**
```
Stripe sends events to this endpoint
Verifies webhook signature
Processes payment updates
```

---

### Certificates

**POST /api/certificates/generate**
```json
Request:
{
  "enrollment_id": "uuid",
  "template_id": "uuid"
}

Response:
{
  "certificate": {
    "id": "uuid",
    "certificate_number": "CERT-20260501-000123",
    "pdf_url": "https://storage.../certificate.pdf"
  }
}
```

**GET /api/certificates/verify/:number**
```json
Response:
{
  "valid": true,
  "certificate": {
    "number": "CERT-20260501-000123",
    "student_name": "John Doe",
    "course_name": "First Aid Training",
    "issued_date": "2026-05-01",
    "instructor": "Jane Smith"
  }
}
```

---

## 📡 Supabase Realtime

### Subscribe to Updates

```typescript
// Subscribe to new bookings
const subscription = supabase
  .channel('bookings')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'enrollments'
    },
    (payload) => {
      console.log('New booking:', payload.new);
      // Update UI
    }
  )
  .subscribe();

// Unsubscribe
subscription.unsubscribe();
```

### Presence (Who's Online)

```typescript
const channel = supabase.channel('admin-room');

channel
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState();
    console.log('Online users:', state);
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        user_id: currentUser.id,
        online_at: new Date().toISOString(),
      });
    }
  });
```

---

# Security & Compliance

## 🔒 Security Features

### Authentication Security

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

**Session Management:**
- JWT tokens with 1-hour expiry
- Refresh tokens for extended sessions
- Automatic logout after 30 days inactive
- Session revocation on password change

**Two-Factor Authentication (Optional):**
```typescript
// Enable 2FA
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp',
});

// Verify
const { data: verified } = await supabase.auth.mfa.verify({
  factorId: data.id,
  code: '123456',
});
```

---

### Data Protection

**Encryption:**
- All data encrypted at rest (AES-256)
- TLS 1.3 for data in transit
- Database credentials encrypted
- API keys stored securely

**Row-Level Security:**
```sql
-- Students can only see their own data
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students see own enrollments"
ON enrollments FOR SELECT
USING (auth.uid() = student_id);

-- Admins can see all data
CREATE POLICY "Admins see all enrollments"
ON enrollments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin')
  )
);
```

**Audit Logging:**
```sql
-- All sensitive actions logged
CREATE TRIGGER audit_enrollments
AFTER INSERT OR UPDATE OR DELETE ON enrollments
FOR EACH ROW EXECUTE FUNCTION log_audit();
```

---

### Compliance

**GDPR Compliance:**
- Right to access data
- Right to be forgotten
- Data portability
- Consent tracking
- Privacy policy
- Cookie consent

**Data Retention:**
- Active data: Indefinite
- Deleted users: 30 days
- Audit logs: 7 years
- Backups: 12 months

**PCI Compliance:**
- No card data stored locally
- Stripe handles all payment data
- PCI-compliant hosting (Vercel)
- Regular security audits

---

### Security Best Practices

**For Admins:**
1. Use strong, unique passwords
2. Enable 2FA
3. Don't share credentials
4. Review audit logs weekly
5. Limit admin access to necessary users
6. Revoke access for departed team members

**For Students:**
1. Don't share account access
2. Use secure password
3. Log out on shared devices
4. Report suspicious activity
5. Keep contact info updated

**For Developers:**
1. Never commit secrets to Git
2. Use environment variables
3. Keep dependencies updated
4. Run security audits
5. Follow OWASP top 10
6. Implement rate limiting

---

## 📋 Compliance Reports

**Generate Compliance Report:**
```sql
-- Data access report
SELECT
  u.email,
  COUNT(DISTINCT a.id) as total_actions,
  MAX(a.created_at) as last_activity
FROM profiles u
LEFT JOIN audit_logs a ON u.id = a.user_id
WHERE a.created_at > NOW() - INTERVAL '90 days'
GROUP BY u.id, u.email
ORDER BY total_actions DESC;

-- GDPR data export for user
SELECT
  'profiles' as table_name,
  row_to_json(p) as data
FROM profiles p
WHERE id = 'user_id'
UNION ALL
SELECT
  'enrollments',
  row_to_json(e)
FROM enrollments e
WHERE student_id = 'user_id'
-- ... repeat for all tables
```

---

## 🎉 Congratulations!

You've reached the end of the GTSTrain complete documentation. Your training centre management system is ready to use!

**Quick Links:**
- Login: https://gtstrain.eastshoresit.com.au/admin/login
- Support: support@gtstrain.eastshoresit.com.au
- Documentation: This file!

**Need Help?**
- Review this documentation
- Check troubleshooting section
- Contact support
- Submit feedback

**Happy Training! 🚀**

---

*GTSTrain - Complete Training Centre Management System*  
*Version 1.0 | © 2026 | All Rights Reserved*