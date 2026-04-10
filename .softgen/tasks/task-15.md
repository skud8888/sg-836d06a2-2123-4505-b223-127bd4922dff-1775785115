---
title: Smart Search & Universal Search Bar
status: todo
priority: medium
type: feature
tags: [search, ai, ux]
created_by: agent
created_at: 2026-04-10T03:00:00Z
position: 15
---

## Notes
Single search bar that understands context and searches across all records and documents. Natural language queries with AI-powered results ranking.

**Key Improvements Over Competitors:**
- Context-aware (knows if you're on student page vs course page)
- Natural language ("show unsigned contracts from this month")
- Searches both metadata and document contents
- AI-powered result ranking and suggestions

**Search Scope:**
- Bookings (by student name, email, phone, USI, course)
- Courses (by name, code, trainer, location)
- Documents (by filename, content, type)
- Enquiries (by name, email, course interest)
- Trainers (by name, qualifications)

## Checklist
- [ ] Create global search component with keyboard shortcut (Cmd+K)
- [ ] Implement full-text search across all tables
- [ ] Add vector search for semantic document search
- [ ] Build search results page with filtering
- [ ] Add natural language query parsing
- [ ] Implement search analytics (track what users search)
- [ ] Create quick actions from search results
- [ ] Add voice search support