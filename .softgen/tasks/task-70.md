---
title: Fix Student Certificate Access
status: done
priority: high
type: bug
tags: [certificates, student-portal, access]
created_by: agent
created_at: 2026-04-13
position: 70
---

## Notes
Created dedicated student certificates page with preview, download, and filtering. Updated student portal to link to correct page.

## Checklist
- [x] Create /pages/student/certificates.tsx
- [x] Fetch user's certificates from database
- [x] Display certificate list with details
- [x] Add download/view buttons
- [x] Add preview with DocumentPreviewer
- [x] Update student portal link to /student/certificates
- [x] Test certificate access for students