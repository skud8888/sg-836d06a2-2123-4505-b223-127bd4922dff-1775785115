# Quick Supabase Redirect URLs Setup
**Copy-Paste Ready for GTSTrain**

---

## 🚀 **5-Minute Setup**

### **Step 1: Go to Supabase**
https://supabase.com/dashboard/project/veayhprmlrhaldfoqkmm/auth/url-configuration

### **Step 2: Set Site URL**
```
https://gtstrain.eastshoresit.com.au
```

### **Step 3: Add These Redirect URLs (Copy-Paste Each Line)**

```
https://gtstrain.eastshoresit.com.au/**
https://gtstrain.eastshoresit.com.au/admin
https://gtstrain.eastshoresit.com.au/admin/**
https://gtstrain.eastshoresit.com.au/student/portal
https://gtstrain.eastshoresit.com.au/student/**
https://gtstrain.eastshoresit.com.au/trainer/**
https://gtstrain.eastshoresit.com.au/auth/confirm-email
https://gtstrain.eastshoresit.com.au/auth/reset-password
```

### **Step 4: Click "Save"**

### **Step 5: Test**
Try logging in at: https://gtstrain.eastshoresit.com.au/admin/login

---

## ✅ **Done!**

Your authentication redirects are now configured for production.

**Troubleshooting:**
- If you get "Invalid redirect URL" errors, wait 2 minutes and try again
- Make sure you saved the changes in Supabase
- Clear browser cache if needed

---

**Full documentation:** See `.softgen/supabase-redirect-setup.md`