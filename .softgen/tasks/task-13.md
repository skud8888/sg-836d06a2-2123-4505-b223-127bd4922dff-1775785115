---
title: Document Management System (DMS) - Storage & Versioning
status: todo
priority: high
type: feature
tags: [dms, documents, storage, versioning]
created_by: agent
created_at: 2026-04-10T03:00:00Z
position: 13
---

## Notes
Build unified document hub where every booking/student/course has attached documents with version control, audit logs, and smart search. Replace scattered PDF generation with centralized storage.

**Key Improvements Over Competitors:**
- Documents contextually linked to CRM records (not separate silos)
- Automatic versioning with full audit trail
- AI extracts metadata from documents into CRM fields
- One-click access to all related docs from any record

**Tech Stack:**
- Supabase Storage for files
- Database tables for document metadata/versions
- PDF.js for in-browser viewing
- AI extraction for contract/invoice data

## Checklist
- [ ] Create documents table with metadata (type, related_to, version, created_by)
- [ ] Set up Supabase Storage buckets (invoices, contracts, certificates, uploads)
- [ ] Build document upload component with drag-and-drop
- [ ] Add version control system (track changes, who/when)
- [ ] Create document viewer with download/share
- [ ] Link documents to bookings/students/courses
- [ ] Add document audit logs
- [ ] Build document search and filtering