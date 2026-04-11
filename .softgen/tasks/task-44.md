---
title: Admin Signup Flow
status: done
priority: urgent
type: feature
tags: [auth, admin, signup]
created_by: agent
created_at: 2026-04-10
position: 44
---

## Notes
Create dedicated admin signup page with automatic super_admin role assignment for first user. Include validation, email confirmation, and secure onboarding.

## Checklist
- [x] Create /admin/signup page
- [x] Check if any admins exist (first user = super_admin)
- [x] Email/password validation
- [x] Create user in Supabase Auth
- [x] Create profile record
- [x] Assign appropriate role
- [x] Send welcome email
- [x] Redirect to onboarding
- [x] Add link from login page
- [x] Test signup flow