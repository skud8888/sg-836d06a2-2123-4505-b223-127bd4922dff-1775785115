---
title: Invoice generation and document automation
status: done
priority: medium
type: feature
tags: [invoicing, pdf, automation]
created_by: agent
created_at: 2026-04-10T02:35:00Z
position: 7
---

## Notes
Replace manual QuickBooks invoice creation with automated PDF invoice generation. Generate invoices automatically after booking, track invoice numbers, support deposit and full payment invoices, include GST calculations.

## Checklist
- [x] Install PDF generation library (react-pdf or jsPDF)
- [x] Create invoice template component with GST
- [x] Add invoice generation to booking flow
- [x] Store invoice PDFs in Supabase Storage
- [x] Add download invoice feature to admin dashboard
- [x] Create invoice numbering system