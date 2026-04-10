---
title: Dashboard Activity Feed
status: done
priority: high
type: feature
tags: [dashboard, activity, real-time, feed]
created_by: agent
created_at: 2026-04-10T05:20:00Z
position: 32
---

## Notes
Add a real-time activity feed to the admin dashboard showing recent system events: new bookings, payments, enquiries, course completions, and user actions. Support filtering by event type, real-time updates, and click-to-view details.

Features:
- Real-time activity stream
- Event type filtering (bookings, payments, enquiries, etc.)
- Avatar/icon for each event type
- Relative timestamps (2 minutes ago)
- Click to view full details
- Load more pagination
- Event grouping by day
- Activity notifications badge

## Checklist
- [x] Create activity_feed view from audit_logs
- [x] Build ActivityFeed component
- [x] Add real-time subscriptions
- [x] Implement event type filters
- [x] Create event card templates
- [x] Add relative time formatting
- [x] Build click-to-detail navigation
- [x] Implement load more pagination
- [x] Add activity badge counter
- [x] Create activity notifications dropdown