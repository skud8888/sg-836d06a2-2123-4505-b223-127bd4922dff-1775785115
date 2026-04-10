---
title: Admin Signup Flow
status: in_progress
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
- [ ] Create /admin/signup page
- [ ] Check if any admins exist (first user = super_admin)
- [ ] Email/password validation
- [ ] Create user in Supabase Auth
- [ ] Create profile record
- [ ] Assign appropriate role
- [ ] Send welcome email
- [ ] Redirect to onboarding
- [ ] Add link from login page
- [ ] Test signup flow