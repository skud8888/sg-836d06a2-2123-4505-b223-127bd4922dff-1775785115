# Supabase Storage Bucket Setup Guide

## Document Management Storage Buckets

The Training Centre app uses four storage buckets for document management and evidence capture. All buckets must be created in your Supabase project dashboard.

### Quick Setup (Supabase Dashboard)

1. **Navigate to Storage**
   - Go to your Supabase project dashboard
   - Click "Storage" in the left sidebar
   - Click "New bucket" for each bucket below

---

## 1. User Avatars Bucket

**Bucket name:** `user-avatars`  
**Public bucket:** ✅ YES  
**File size limit:** 2MB  
**Allowed types:** image/*

### Policies:
- **SELECT (Read):** `true` - Anyone can view avatars
- **INSERT (Upload):** `(auth.uid() IS NOT NULL)` - Logged-in users can upload
- **UPDATE:** `(auth.uid() IS NOT NULL)` - Users can replace their avatar
- **DELETE:** `(auth.uid() IS NOT NULL)` - Users can remove their avatar

---

## 2. IDs Bucket (ID Verification)

**Bucket name:** `ids`  
**Public bucket:** ✅ YES (for viewing verified IDs)  
**File size limit:** 5MB  
**Allowed types:** image/jpeg, image/png, image/webp, application/pdf

### Policies:
- **SELECT (Read):** `true` - Public read access
- **INSERT (Upload):** `(auth.uid() IS NOT NULL)` - Authenticated users can upload
- **DELETE:** `(EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))` - Admin only

### Usage:
- Student ID verification photos
- Trainer signature captures
- Proof of identity documents

---

## 3. Evidence Bucket (Photos/Videos)

**Bucket name:** `evidence`  
**Public bucket:** ✅ YES  
**File size limit:** 50MB  
**Allowed types:** image/jpeg, image/png, image/webp, video/mp4, video/quicktime

### Policies:
- **SELECT (Read):** `true` - Public read access
- **INSERT (Upload):** `(auth.uid() IS NOT NULL)` - Authenticated users can upload
- **DELETE:** `(EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))` - Admin only

### Usage:
- Attendance photos
- Practical assessment videos
- Completed work documentation
- Safety compliance evidence

---

## 4. Certificates Bucket

**Bucket name:** `certificates`  
**Public bucket:** ✅ YES  
**File size limit:** 10MB  
**Allowed types:** application/pdf, image/png, image/jpeg

### Policies:
- **SELECT (Read):** `true` - Public read access for verification
- **INSERT (Upload):** `(auth.uid() IS NOT NULL)` - System can generate certificates

### Usage:
- Generated course completion certificates
- Certificate PDFs

---

## 5. Class Documents Bucket (Private)

**Bucket name:** `class-docs`  
**Public bucket:** ❌ NO (private)  
**File size limit:** 10MB  
**Allowed types:** application/pdf, image/jpeg, image/png, application/vnd.openxmlformats-officedocument.wordprocessingml.document

### Policies:
- **SELECT (Read):** `(auth.uid() IS NOT NULL)` - Authenticated users only
- **INSERT (Upload):** `(EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer')))` - Trainers/Admin only
- **DELETE:** `(EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer')))` - Trainers/Admin only

### Usage:
- Class handouts
- Internal documentation
- Training materials
- Sign-in sheets

---

## Policy SQL Helper (Optional)

If you need to set policies via SQL, use these queries in the Supabase SQL Editor:

```sql
-- Note: Storage policies may need to be created via Dashboard
-- These are reference queries only

-- Example for 'ids' bucket policies:
CREATE POLICY "Public read IDs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'ids');

CREATE POLICY "Authenticated upload IDs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ids' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admin delete IDs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'ids' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

---

## Verification Checklist

After creating all buckets, verify:

1. ✅ `user-avatars` bucket exists and is public
2. ✅ `ids` bucket exists and is public
3. ✅ `evidence` bucket exists and is public
4. ✅ `certificates` bucket exists and is public
5. ✅ `class-docs` bucket exists and is private
6. ✅ All policies are configured correctly
7. ✅ Test upload in each bucket from the app

---

## Component Usage Examples

### ID Verification Upload
```tsx
import { IDVerificationUpload } from "@/components/IDVerificationUpload";

<IDVerificationUpload
  bookingId={booking.id}
  studentName={student.full_name}
  onVerificationComplete={(documentId) => {
    console.log("ID verified:", documentId);
  }}
/>
```

### Evidence Capture
```tsx
import { EvidenceCapture } from "@/components/EvidenceCapture";

<EvidenceCapture
  bookingId={booking.id}
  scheduledClassId={classId}
  onCaptureComplete={() => {
    console.log("Evidence captured");
  }}
/>
```

### Document Viewer
```tsx
import { DocumentViewer } from "@/components/DocumentViewer";

<DocumentViewer
  bookingId={booking.id}
  showUploadButton={true}
  onUploadClick={() => setShowUploadModal(true)}
/>
```

---

## Troubleshooting

**Upload fails:**
- Check bucket exists with exact name
- Verify bucket is public (for public buckets)
- Check file size limits
- Verify MIME type is allowed

**Can't view documents:**
- For public buckets: verify "Public bucket" checkbox is enabled
- For private buckets: verify user is authenticated
- Check policies are correctly set

**Permission denied:**
- Verify user has correct role (for admin/trainer operations)
- Check RLS policies on documents table
- Verify storage bucket policies match requirements
