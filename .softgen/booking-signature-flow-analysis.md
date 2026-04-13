# Booking & E-Signature Flow Analysis

## Current Status: ⚠️ INCOMPLETE INTEGRATION

---

## 🔍 Database Schema Review

### Tables Involved:
1. **`bookings`** - Course enrollment bookings (student info, payment, status)
2. **`enrollments`** - Course enrollments (similar to bookings, causes confusion)
3. **`signature_requests`** - E-signature requests for contracts
4. **`stripe_payments`** - Payment tracking
5. **`scheduled_classes`** - Class schedule

### 🚨 Problem: Bookings vs Enrollments Duplication

**Current Setup:**
- `bookings` table: Has student_id, scheduled_class_id, payment_status
- `enrollments` table: Has student_id, course_template_id, payment_status

**Issue:** Both tables serve similar purposes but reference different entities:
- Bookings → Scheduled Classes (specific date/time instance)
- Enrollments → Course Templates (general course, no specific date)

**Recommended Approach:**
- **Use `bookings`** for scheduled class registrations (what you currently have)
- **Use `enrollments`** for self-paced online courses (if you add them later)
- Current booking flow should ONLY use `bookings` table

---

## 📊 Current E-Signature Flow

### ✅ What Exists:

1. **Database Setup** ✅
   - `signature_requests` table created
   - RLS policies configured
   - Foreign key to bookings

2. **Signature Page** ✅
   - `/sign/[requestId]` displays document
   - SignatureCapture component works
   - Canvas-based signature drawing
   - IP address capture on signing

3. **Signature Service** ✅
   - Create signature requests
   - Send signature emails
   - Complete signatures
   - Get signature status

### ❌ What's Missing:

1. **Auto-Trigger** ❌
   - No automatic signature request creation after booking confirmation
   - Admin must manually create signature requests

2. **Admin Integration** ❌
   - No "Send Signature Request" button in bookings UI
   - No signature status display in booking details
   - Can't view/track signature requests per booking

3. **Workflow Integration** ❌
   - Booking confirmation doesn't include signature link
   - No reminder system for pending signatures
   - No signature status in bookings list

4. **Student Experience** ❌
   - Students don't receive signature request automatically
   - No signature status in student portal
   - No visibility into pending signatures

---

## 📋 Complete Booking Flow (How It Should Work)

### Ideal Workflow:

```
1. Student browses courses → /courses
   ↓
2. Student clicks "Book" on scheduled class → /booking/[classId]
   ↓
3. Student fills form (name, email, phone, USI)
   ↓
4. Booking created (status: pending, payment_status: unpaid)
   ↓
5. Student completes payment → Stripe Checkout
   ↓
6. Payment success webhook updates booking (payment_status: paid)
   ↓
7. AUTO-TRIGGER: Create signature request (enrollment contract)
   ↓
8. Email sent to student with signature link: /sign/[requestId]
   ↓
9. Student signs document
   ↓
10. Signature completed, booking updated (status: confirmed)
    ↓
11. Confirmation email sent with course details
    ↓
12. Student can access course materials in Student Portal
```

### Current Implementation (Partial):

```
1. Student browses courses ✅
   ↓
2. Student books class ✅
   ↓
3. Form submission creates booking ✅
   ↓
4. Payment via Stripe ✅
   ↓
5. Payment success updates booking ✅
   ↓
6. ❌ NO signature request created
   ↓
7. ❌ Student doesn't receive signature link
   ↓
8. ❌ Booking stays in limbo
   ↓
9. ❌ Admin must manually intervene
```

---

## 🛠️ Required Fixes

### 1. Auto-Create Signature Request After Payment

**File:** `src/pages/api/stripe/webhook.ts`

Add after payment success:
```typescript
// After updating booking payment status
if (booking.payment_status === 'paid') {
  // Auto-create signature request
  await signatureService.createSignatureRequest({
    bookingId: booking.id,
    documentType: 'enrollment_contract',
    recipientName: booking.student_name,
    recipientEmail: booking.student_email,
    expiresInDays: 7
  });
}
```

### 2. Add Signature UI to Bookings Page

**File:** `src/pages/admin/bookings.tsx`

Add to booking details dialog:
- Display signature request status
- "Send Signature Request" button
- "Send Reminder" button
- Signature request history list

### 3. Add Signature Status to Bookings List

**File:** `src/pages/admin/bookings.tsx`

Add column to table:
- Signature Status badge (Pending/Sent/Signed)
- Click to view signature details

### 4. Update Booking Confirmation Email

**File:** `src/services/emailService.ts`

Add signature link to booking confirmation:
```
"Please sign your enrollment contract: [Link]"
```

---

## 🎯 Testing Checklist

### E-Signature Flow:
- [ ] Create signature request manually (via service)
- [ ] Receive signature request email
- [ ] Open signature link `/sign/[requestId]`
- [ ] View document preview (currently placeholder)
- [ ] Draw signature on canvas
- [ ] Submit signature
- [ ] Verify signature data saved
- [ ] Verify IP address captured
- [ ] Verify signed document created
- [ ] Receive completion email

### Booking Flow:
- [ ] Browse courses at `/courses`
- [ ] Click book on scheduled class
- [ ] Fill booking form (name, email, phone, USI)
- [ ] Click "Continue to Payment"
- [ ] Complete Stripe payment
- [ ] Verify booking created (status: pending)
- [ ] Verify payment recorded
- [ ] Verify booking updated (payment_status: paid)
- [ ] Verify confirmation email sent
- [ ] Check admin bookings dashboard shows new booking

### Integrated Flow (What Should Happen):
- [ ] Complete booking + payment
- [ ] Signature request auto-created
- [ ] Signature email received
- [ ] Sign document
- [ ] Booking status updated to confirmed
- [ ] Access granted to course materials

### Admin Management:
- [ ] View all bookings in admin dashboard
- [ ] Filter bookings by status
- [ ] View booking details
- [ ] See signature request status
- [ ] Send manual signature request
- [ ] Send signature reminder
- [ ] View signature history
- [ ] Export bookings with signature status

---

## 🔧 Recommended Implementation Order

1. **Fix Auto-Trigger** (HIGH PRIORITY)
   - Add signature request creation to payment webhook
   - Test booking → payment → signature flow

2. **Admin UI** (HIGH PRIORITY)
   - Add signature status to booking details
   - Add "Send Signature Request" button
   - Add signature request list per booking

3. **Email Templates** (MEDIUM PRIORITY)
   - Update booking confirmation with signature link
   - Add reminder email template

4. **Student Portal** (MEDIUM PRIORITY)
   - Show pending signatures
   - Link to signature page
   - Track signed documents

5. **Signature Dashboard** (LOW PRIORITY)
   - Dedicated signature tracking page
   - Filter by status
   - Bulk reminder sending

---

## 📊 Data Model Clarification

### Use Cases:

**`bookings` table → For scheduled class registrations**
- Student registers for specific class on specific date
- Links to `scheduled_classes` table
- Includes payment tracking
- Includes signature requests
- Example: "John books First Aid course on Jan 15, 2026"

**`enrollments` table → For self-paced online courses (future)**
- Student enrolls in course template (no specific date)
- Links to `course_templates` table
- For online learning platform
- Tracks progress, completion
- Example: "Jane enrolls in Excel Basics (online, self-paced)"

**Current Status:**
- Only using `bookings` for scheduled classes ✅
- `enrollments` exists but not actively used in main flow
- Payment success page references enrollments (BUG - should use bookings)

---

## 🚨 Critical Issues to Fix

1. **Payment Success Page Bug**
   - Currently references `enrollments` table
   - Should reference `bookings` table
   - Causes confusion and potential data issues

2. **Missing Signature Integration**
   - No auto-trigger after payment
   - No admin UI for signature management
   - No student visibility into signature status

3. **Incomplete Workflow**
   - Booking → Payment works
   - Payment → Signature broken
   - Signature → Confirmation broken

---

## ✅ Quick Wins

These can be implemented in <1 hour:

1. Add signature status badge to bookings list
2. Add "Send Signature Request" button to booking details
3. Display signature requests in booking details dialog
4. Fix payment success page to use bookings instead of enrollments
5. Add signature link to booking confirmation email

---

**Status: Ready for implementation. All gaps identified. Solutions documented.**