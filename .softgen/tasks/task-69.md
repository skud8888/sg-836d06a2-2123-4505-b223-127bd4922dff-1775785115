---
title: Add Rate Limiting to Public Forms
status: done
priority: high
type: security
tags: [security, rate-limiting, spam-protection]
created_by: agent
created_at: 2026-04-13
position: 69
---

## Notes
Rate limiting system implemented with IP tracking and database-backed storage. Protects public forms from spam and abuse.

## Checklist
- [x] Create rate limiting middleware/utility
- [x] Create rate_limit_log database table
- [x] Add rate limit to contact form API
- [x] Add rate limit to booking creation
- [x] Add rate limit to enquiry submission
- [x] Test rate limits work (max 5 requests per 15 min per IP)
- [x] Add user-friendly rate limit error messages
- [x] Document rate limit settings