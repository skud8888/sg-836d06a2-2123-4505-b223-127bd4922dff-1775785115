---
title: Add Rate Limiting to Public Forms
status: in_progress
priority: high
type: security
tags: [security, rate-limiting, spam-protection]
created_by: agent
created_at: 2026-04-13
position: 69
---

## Notes
Public forms (contact, booking, enquiry) need rate limiting to prevent spam and abuse. Implement server-side rate limiting with IP tracking.

## Checklist
- [ ] Create rate limiting middleware/utility
- [ ] Add rate limit to contact form API
- [ ] Add rate limit to booking creation
- [ ] Add rate limit to enquiry submission
- [ ] Test rate limits work (max 5 requests per 15 min per IP)
- [ ] Add user-friendly rate limit error messages
- [ ] Document rate limit settings