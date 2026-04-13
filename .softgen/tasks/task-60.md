---
title: E-Signature & Booking System Integration Gaps
status: in_progress
priority: urgent
type: bug
tags: [signatures, bookings, workflow, integration]
created_by: agent
created_at: 2026-04-13
position: 60
---

## Notes
Critical gaps found in E-Signature and Booking workflows:
1. Signature requests not auto-created after booking confirmation
2. No admin UI to manually send signature requests from bookings page
3. Booking → Payment → Signature → Enrollment workflow incomplete
4. Bookings vs Enrollments table duplication/confusion
5. Missing signature status display in booking details
6. No integration between booking completion and signature request trigger

## Checklist
- [ ] Add signature request creation to booking confirmation workflow
- [ ] Add "Send Signature Request" button to booking details dialog
- [ ] Display signature status in booking details (pending/sent/signed)
- [ ] Add signature request link to booking confirmation email
- [ ] Create admin view of all signature requests per booking
- [ ] Add signature reminder functionality to admin UI
- [ ] Document Booking vs Enrollment table usage (clarify data model)
- [ ] Test complete flow: Book → Pay → Sign → Complete
- [ ] Add signature request status badges to bookings list
- [ ] Create signature request tracking dashboard