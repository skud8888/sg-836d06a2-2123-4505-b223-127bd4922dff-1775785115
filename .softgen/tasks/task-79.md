---
title: Add Password Recovery Flow
status: in_progress
priority: high
type: feature
tags: [auth, password, recovery, reset]
created_by: agent
created_at: 2026-04-14
position: 79
---

## Notes
Complete password recovery system with email-based reset links, secure token validation, and password update. Supports both admin and student users.

## Checklist
- [ ] Create forgot password page (/admin/reset-password)
- [ ] Create update password page (/admin/update-password)
- [ ] Send password reset email via Supabase Auth
- [ ] Validate reset tokens
- [ ] Update password securely
- [ ] Add password strength indicator
- [ ] Add success/error messages
- [ ] Test full recovery flow
- [ ] Add rate limiting