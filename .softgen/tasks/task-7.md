---
title: Invoice generation and document automation
status: in_progress
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
- [ ] Install PDF generation library (react-pdf or jsPDF)
- [ ] Create invoice template component with GST
- [ ] Add invoice generation to booking flow
- [ ] Store invoice PDFs in Supabase Storage
- [ ] Add download invoice feature to admin dashboard
- [ ] Create invoice numbering system