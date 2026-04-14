<![CDATA[
# Supabase Storage Bucket Setup Guide

## User Avatars Storage

The profile settings page includes avatar upload functionality. To enable this feature, you need to create a storage bucket in Supabase.

### Quick Setup (Supabase Dashboard)

1. **Navigate to Storage**
   - Go to your Supabase project dashboard
   - Click "Storage" in the left sidebar
   - Click "New bucket"

2. **Create the Bucket**
   - Bucket name: `user-avatars`
   - Public bucket: ✅ **YES** (Enable public access)
   - Click "Create bucket"

3. **Configure Access Policies**
   The bucket needs these policies (automatically set when creating as public):
   
   **SELECT (Read):**
   - Policy name: `Public read access`
   - Target roles: `public`
   - Policy definition: `true`
   - Allows: Anyone can view avatars

   **INSERT (Upload):**
   - Policy name: `Authenticated users can upload`
   - Target roles: `authenticated`
   - Policy definition: `true`
   - Allows: Logged-in users can upload their avatar

   **UPDATE (Replace):**
   - Policy name: `Users can update own avatar`
   - Target roles: `authenticated`
   - Policy definition: `(bucket_id = 'user-avatars')`
   - Allows: Users can replace their avatar

   **DELETE (Remove):**
   - Policy name: `Users can delete own avatar`
   - Target roles: `authenticated`
   - Policy definition: `(bucket_id = 'user-avatars')`
   - Allows: Users can remove their avatar

### Verify Setup

1. Go to Admin → Profile
2. Click "Change Avatar"
3. Select an image (JPG, PNG, GIF under 2MB)
4. Upload should succeed and display new avatar immediately

### File Structure

Uploaded files are stored as:
```
user-avatars/
  avatars/
    {user_id}-{timestamp}.{ext}
```

Example: `user-avatars/avatars/abc123-1704067200000.jpg`

### Features Enabled

✅ Avatar upload with validation (2MB max, image files only)
✅ Public URL generation for display
✅ User metadata update in Supabase Auth
✅ Loading states during upload
✅ Error handling with user-friendly messages
✅ Automatic cache headers (1 hour)
✅ File replacement (upsert: true)

### Troubleshooting

**Upload fails with "Failed to upload":**
- Check bucket exists and is named exactly `user-avatars`
- Verify bucket is set to public
- Check that authenticated users have INSERT policy

**Avatar doesn't display after upload:**
- Verify bucket is public
- Check browser console for CORS errors
- Ensure public URL generation is working

**Storage path errors:**
- Confirm files are uploading to `avatars/` subdirectory
- Check file naming pattern matches expected format

### Security Notes

- File size limit: 2MB (enforced client-side and should be enforced in storage policies)
- Allowed types: image/* only
- Files are publicly accessible by URL
- Each upload creates a unique filename to prevent conflicts
- Old avatars are replaced (not deleted) using upsert
</file_contents>
