---
title: Notification Preferences System
status: in_progress
priority: high
type: feature
tags: [notifications, settings, email, sms]
created_by: agent
created_at: 2026-04-10T05:20:00Z
position: 31
---

## Notes
Build comprehensive notification preferences allowing users to control what notifications they receive via email and SMS. Support per-event type configuration, quiet hours, digest options, and notification channels.

Features:
- Per-event notification toggles (bookings, payments, enquiries, etc.)
- Email vs SMS channel selection
- Quiet hours configuration
- Daily digest option
- Notification frequency controls
- Test notification button
- Notification history view
- Unsubscribe options

## Checklist
- [ ] Create notification_preferences table
- [ ] Build preferences UI component
- [ ] Add email notification toggles
- [ ] Add SMS notification toggles
- [ ] Implement quiet hours picker
- [ ] Create digest scheduling options
- [ ] Add test notification functionality
- [ ] Build notification history view
- [ ] Integrate with emailService
- [ ] Add preference sync across devices