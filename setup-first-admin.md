# Create Your First GTSTrain Admin User

## 🎯 Quick Setup (5 minutes)

### Step 1: Create User in Supabase Dashboard

1. **Go to:** https://supabase.com/dashboard/project/yiqgncisrdbwogdkcnnn/auth/users
2. **Click:** "Add User" button (top right)
3. **Fill in:**
   - **Email:** your-email@example.com (use your real email)
   - **Password:** Create a secure password
   - **Auto Confirm User:** ✅ ENABLE THIS (very important!)
4. **Click:** "Create User"

---

### Step 2: Make User a Super Admin

1. **Go to:** https://supabase.com/dashboard/project/yiqgncisrdbwogdkcnnn/sql/new
2. **Copy and paste this SQL:**

```sql
-- Replace YOUR-EMAIL-HERE with your actual email from Step 1
DO $$
DECLARE
    v_user_id uuid;
    v_email text := 'YOUR-EMAIL-HERE@example.com'; -- ← CHANGE THIS!
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found! Check the email address.';
    END IF;
    
    INSERT INTO user_roles (user_id, role, assigned_by)
    VALUES (v_user_id, 'super_admin', v_user_id)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    INSERT INTO notification_preferences (
        user_id, email_new_booking, email_payment_received,
        email_new_enquiry, sms_new_booking, daily_digest, digest_time
    )
    VALUES (v_user_id, true, true, true, true, true, '09:00:00')
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE '✅ Super Admin created for: %', v_email;
END $$;
```

3. **Replace** `YOUR-EMAIL-HERE@example.com` with your actual email
4. **Click:** "Run" (or press F5)
5. **Verify** you see: `✅ Super Admin created for: your-email@example.com`

---

### Step 3: Login

1. **Go to:** https://gtstrain.eastshoresit.com.au/admin/login
2. **Enter:**
   - Email: (your email from Step 1)
   - Password: (password from Step 1)
3. **Click:** "Sign In"
4. **Success!** You're now logged in as Super Admin

---

## ✅ Verification

After login, you should have access to:
- Admin Dashboard
- User Management
- Course Management
- Booking System
- Analytics
- System Settings

---

## 🔧 Troubleshooting

**"Invalid login credentials"**
- Make sure you enabled "Auto Confirm User" in Step 1
- Check email/password are correct

**"Forbidden - Super Admin access required"**
- Make sure you ran the SQL in Step 2
- Check the email matches exactly
- Try logging out and back in

**"User not found" error in SQL**
- Double-check the email address
- Make sure user was created in Step 1
- Email is case-sensitive

---

## 📚 Alternative: Use Provided Script

You can also use the `quick-setup.sql` file:

1. Open `quick-setup.sql`
2. Replace `YOUR-EMAIL-HERE@example.com` (appears 3 times)
3. Copy entire file contents
4. Paste in Supabase SQL Editor
5. Run

---

**Need help?** Check the comprehensive guide in `.softgen/production-supabase-setup.md`