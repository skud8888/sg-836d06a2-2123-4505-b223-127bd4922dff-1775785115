---
title: Smart Search & Universal Search Bar
status: done
priority: medium
type: feature
tags: [search, cmd-k, full-text]
created_by: agent
created_at: 2026-04-10T03:00:00Z
position: 15
---

## Notes
Cmd+K universal search that finds anything - bookings, students, documents, courses, enquiries. Context-aware with relevance scoring. Natural language understanding. Quick navigation.

Implementation: PostgreSQL full-text search with GIN indexes, universal_search() function that queries all tables, CommandDialog UI component with keyboard shortcuts, relevance scoring via ts_rank.

## Checklist
- [x] Create full-text search indexes
- [x] Build universal search function
- [x] Create Cmd+K search dialog UI
- [x] Add search across all entity types
- [x] Implement relevance scoring
- [x] Add keyboard navigation
- [x] Create quick actions from search results
- [x] Add search result grouping by type
- [x] Track search analytics (what users search)
- [x] Create quick actions from search results
- [x] Add voice search support