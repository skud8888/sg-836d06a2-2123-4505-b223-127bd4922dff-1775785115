---
title: Fix Student Certificate Access
status: in_progress
priority: high
type: bug
tags: [certificates, student-portal, access]
created_by: agent
created_at: 2026-04-13
position: 70
---

## Notes
Student portal currently links to /admin/certificates which students can't access. Need dedicated student certificates page or update portal to show certificates inline.

## Checklist
- [ ] Create /pages/student/certificates.tsx
- [ ] Fetch user's certificates from database
- [ ] Display certificate list with details
- [ ] Add download/view buttons
- [ ] Add preview with DocumentPreviewer
- [ ] Update student portal link to /student/certificates
- [ ] Test certificate access for students