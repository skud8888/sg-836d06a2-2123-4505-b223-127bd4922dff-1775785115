---
title: Role-Based Access Control (RBAC)
status: done
priority: urgent
type: feature
tags: [security, rbac, permissions, roles]
created_by: agent
created_at: 2026-04-10T03:30:00Z
position: 18
---

## Notes
Implement granular role-based access control beyond basic admin/student split. Support roles: Super Admin, Admin, Trainer, Receptionist, Student. Each role has specific permissions for viewing/editing/deleting records. Critical for multi-user training centers.

Roles:
- **Super Admin**: Full access, manage users, delete records
- **Admin**: Manage bookings, courses, view analytics, no user management
- **Trainer**: View assigned classes, update attendance, no financial data
- **Receptionist**: Create bookings, accept payments, no course management
- **Student**: View own bookings/documents only

## Checklist
- [x] Create user_roles and role_permissions tables
- [x] Build role assignment UI for admin
- [x] Implement permission checks in RLS policies
- [x] Add role-based navigation and UI visibility
- [x] Create permission middleware for sensitive actions
- [x] Build user management dashboard
- [x] Add role-based data filtering
- [x] Test permission boundaries