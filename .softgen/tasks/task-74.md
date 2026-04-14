---
title: Add SMS Notification Integration
status: in_progress
priority: high
type: feature
tags: [sms, notifications, twilio]
created_by: agent
created_at: 2026-04-14
position: 74
---

## Notes
Integrate SMS notifications using Twilio for booking confirmations, class reminders, and important updates.

## Checklist
- [ ] Create sms_notifications database table
- [ ] Install Twilio SDK
- [ ] Create SMS service in src/services/smsService.ts
- [ ] Create API endpoint /api/sms/send
- [ ] Add SMS templates for common notifications
- [ ] Send SMS on booking confirmation
- [ ] Send SMS class reminders (24h before)
- [ ] Add SMS preference to user profiles
- [ ] Add SMS log viewer for admins
- [ ] Test SMS delivery
- [ ] Document Twilio setup instructions