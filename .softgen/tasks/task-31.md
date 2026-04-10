---
title: Notification Preferences System
status: done
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
- [x] Create notification_preferences table
- [x] Build preferences UI component
- [x] Add email notification toggles
- [x] Add SMS notification toggles
- [x] Implement quiet hours picker
- [x] Create digest scheduling options
- [x] Add test notification functionality
- [x] Build notification history view
- [x] Integrate with emailService
- [x] Add preference sync across devices