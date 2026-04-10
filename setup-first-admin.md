# Setup First Admin User

This guide will help you create your first Super Admin user for the Training Centre platform.

## Step 1: Create User in Supabase Dashboard

1. Open your Supabase project dashboard
2. Navigate to: **Authentication → Users**
3. Click the **"Add user"** button
4. Select: **"Create new user"**
5. Fill in the form:
   - **Email:** `admin@yourcompany.com` (change to your email)
   - **Password:** `YourSecurePassword123!` (change to a secure password)
   - **Auto Confirm User:** Toggle to **ON** ✅
6. Click **"Create user"**
7. **IMPORTANT:** Copy the User ID from the users list (looks like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

## Step 2: Assign Super Admin Role

### Option A: Via Supabase SQL Editor (Recommended)

1. Go to: **SQL Editor** in your Supabase dashboard
2. Click **"New query"**
3. Copy and paste the SQL below
4. Replace `YOUR-USER-EMAIL-HERE` with the email you just created
5. Click **"Run"**

```sql
-- This script will:
-- 1. Find your user by email
-- 2. Assign super_admin role
-- 3. Verify the role was assigned correctly

-- Step 1: Find user (check this first)
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'YOUR-USER-EMAIL-HERE';

-- Step 2: Assign Super Admin role (replace email in next line)
DO $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Get the user ID
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'YOUR-USER-EMAIL-HERE';
    
    -- Check if user exists
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found with that email';
    END IF;
    
    -- Assign super_admin role
    INSERT INTO user_roles (user_id, role, assigned_by)
    VALUES (v_user_id, 'super_admin', v_user_id)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Create notification preferences
    INSERT INTO notification_preferences (user_id)
    VALUES (v_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'Super Admin role assigned successfully!';
END $$;

-- Step 3: Verify the role was assigned
SELECT 
    u.email,
    u.created_at,
    ur.role,
    ur.assigned_at
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'YOUR-USER-EMAIL-HERE';
```

### Option B: Manual SQL (if you know the User ID)

If you already have the User ID, run this simpler version:

```sql
-- Replace YOUR-USER-UUID-HERE with the actual UUID
INSERT INTO user_roles (user_id, role, assigned_by)
VALUES (
  'YOUR-USER-UUID-HERE',
  'super_admin',
  'YOUR-USER-UUID-HERE'
);

-- Create notification preferences
INSERT INTO notification_preferences (user_id)
VALUES ('YOUR-USER-UUID-HERE')
ON CONFLICT (user_id) DO NOTHING;

-- Verify
SELECT u.email, ur.role 
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE u.id = 'YOUR-USER-UUID-HERE';
```

## Step 3: Test Login

1. Open your training centre app: `http://localhost:3000/admin/login`
2. Enter the email and password you created in Step 1
3. Click **"Sign In"**
4. You should be redirected to the admin dashboard

**Success!** 🎉 You're now logged in as Super Admin.

## Step 4: Verify Full Access

Once logged in, verify you can access:

- ✅ Admin Dashboard (should see "Welcome back" message)
- ✅ User Management (click the "User Management" card)
- ✅ All 11+ admin sections
- ✅ Profile page (click "Profile" button)
- ✅ Notification preferences (Profile → Notifications tab)
- ✅ Activity feed (right sidebar on dashboard)

## Step 5: Create Additional Admin Users (Optional)

Now that you're a Super Admin, you can create other admin users through the UI:

1. In Supabase Dashboard: Authentication → Users → Add user
2. Create the user (email + password, auto-confirm ON)
3. Login to your app as Super Admin
4. Go to: Admin Dashboard → User Management
5. Find the new user in the list
6. Click **"Manage Roles"**
7. Select role: Super Admin, Admin, Trainer, or Receptionist
8. Click **"Assign"**

## Troubleshooting

**Problem:** "Access denied" error after login
- **Solution:** Role wasn't assigned correctly. Run Step 2 again and verify with the SELECT query.

**Problem:** "Invalid login credentials"
- **Solution:** Double-check email and password. Make sure "Auto Confirm User" was toggled ON.

**Problem:** Can't find User ID in Supabase Dashboard
- **Solution:** In Authentication → Users, the ID column shows the UUID. Click to copy it.

**Problem:** SQL query fails with "user not found"
- **Solution:** Check the email spelling in both the Supabase UI and SQL query - they must match exactly.

**Problem:** Role assigned but still can't access admin pages
- **Solution:** Sign out completely and sign in again. Roles are loaded during authentication.

## Quick Reference

**Login URL:** `/admin/login`

**Default Roles:**
- `super_admin` - Full system access
- `admin` - Manage operations (no user management)
- `trainer` - View classes, mark attendance
- `receptionist` - Create bookings, accept payments

**RLS Policies:**
- User can only see/edit their own notification preferences
- Super Admin can see all users and assign roles
- Activity feed shows events relevant to user's role

## Security Notes

⚠️ **Important Security Practices:**

1. **Change Default Password:** After first login, go to Profile → Security → Change Password
2. **Use Strong Passwords:** Minimum 8 characters, mix of upper/lower/numbers/symbols
3. **Don't Share Credentials:** Each person should have their own account
4. **Review User Roles Regularly:** Remove access for departed staff
5. **Enable 2FA (when available):** Extra security layer

## Next Steps

After setting up your first admin user:

1. ✅ Change your password to something secure
2. ✅ Update your profile information (Profile → Profile tab)
3. ✅ Configure notification preferences (Profile → Notifications tab)
4. ✅ Explore the admin dashboard features
5. ✅ Create additional admin users for your team
6. ✅ Set up email service for notifications (if not already done)
7. ✅ Configure Stripe for payments (if not already done)

---

**You're all set!** Your first Super Admin user is ready to go. 🚀

If you encounter any issues, refer to the Troubleshooting section above or contact support.