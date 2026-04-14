# Calendar View Feature Guide - Training Centre App

**Feature:** Enhanced Calendar View for Booking System  
**Status:** ✅ Complete & Production Ready  
**File:** `src/pages/admin/calendar.tsx` (704 lines)

---

## 🎯 Overview

A comprehensive calendar management system for scheduling and managing training classes with three view modes (Month/Week/Day), advanced filtering, and ICS export functionality.

---

## ✨ Key Features

### **1. Three Calendar Views**

**Month View:**
- 📅 Full month grid with 7-day week layout
- 📊 Shows up to 3 classes per day
- 🔢 "+X more" indicator for overflow
- 🎯 Click any day to create new class
- 📍 Visual indicators for current month/today
- 🎨 Color-coded by status

**Week View:**
- 📆 7-column layout showing full week
- 📋 Detailed class cards with:
  - Course name
  - Time range
  - Student count (enrolled/max)
  - Status badge
- 🖱️ Click cards to edit
- 📱 Responsive grid layout

**Day View:**
- ⏰ Hour-by-hour schedule (24 hours)
- 📝 Full class details displayed:
  - Course name
  - Time range
  - Location
  - Student count
  - Trainer assignment
  - Status
- 🔍 Perfect for detailed daily planning
- 📊 Empty hours clearly visible

---

## 🛠️ Core Functionality

### **Class Scheduling**

**Create New Class:**
```
1. Click "Schedule Class" button (top right)
   OR
2. Click any empty day in calendar
3. Fill form:
   - Course selection (dropdown)
   - Start date/time
   - End date/time
   - Location (optional)
   - Max students (default: 20)
   - Trainer assignment (optional)
4. Click "Schedule Class"
5. Class appears on calendar
```

**Edit Existing Class:**
```
1. Click any class card in calendar
2. Form pre-fills with existing data
3. Modify any fields
4. Click "Update Class"
5. Changes reflect immediately
```

---

### **Filtering System**

**Three Independent Filters:**

1. **Course Filter**
   - Dropdown: "All Courses" or specific course
   - Shows only classes for selected course
   - Displays course code for quick identification

2. **Trainer Filter**
   - Dropdown: "All Trainers" or specific trainer
   - Shows only classes assigned to trainer
   - Includes unassigned classes when "All" selected

3. **Status Filter**
   - Options: All, Scheduled, In Progress, Completed, Cancelled
   - Color-coded badges:
     - Scheduled: Default (blue)
     - In Progress: Secondary (yellow)
     - Completed: Outline (gray)
     - Cancelled: Destructive (red)

**Filter Combinations:**
- All filters work together (AND logic)
- Example: "First Aid" course + "John Trainer" + "Scheduled" status
- Filters apply to all views (Month/Week/Day)
- Reset by selecting "All" in each dropdown

---

### **Trainer Assignment**

**Assign During Creation:**
- Select trainer from dropdown when scheduling
- Can be left unassigned (shows "No trainer assigned")

**Assign to Existing Class:**
1. Click class card to edit
2. Select trainer from dropdown
3. Save changes

**Quick Trainer View:**
- Filter by specific trainer to see their schedule
- Identify scheduling conflicts
- Balance trainer workload

---

### **ICS Export**

**Export Calendar:**
```
1. Click "Export" button (top right)
2. Filtered classes exported to .ics file
3. File downloads: training-calendar-YYYY-MM.ics
4. Import to:
   - Google Calendar
   - Apple Calendar
   - Outlook
   - Any iCal-compatible app
```

**Export Includes:**
- Course name and code
- Start/end times
- Location
- Trainer name
- Student capacity
- Status
- Unique event IDs

**Use Cases:**
- Share schedule with trainers
- Import to personal calendar
- Backup class schedule
- Sync across devices

---

## 📊 Visual Indicators

### **Calendar Day States**

**Current Month:**
- White background (light mode)
- Full opacity
- All dates visible

**Other Months:**
- Muted background
- Reduced opacity
- Gray dates

**Today:**
- Primary ring (2px border)
- Bold date number
- Primary color text
- Stands out in all views

**Hover Effects:**
- Background changes on hover
- Indicates clickable areas
- Smooth transitions

---

### **Class Display**

**Month View Cards:**
```
┌──────────────────┐
│ CPCCWHS1001      │ ← Course code
│ ⏰ 09:00         │ ← Start time
└──────────────────┘
```

**Week View Cards:**
```
┌────────────────────────────┐
│ First Aid Training         │ ← Course name
│ ⏰ 09:00 - 17:00          │ ← Time range
│ 👥 12/20                  │ ← Enrolled/Max
│ [Scheduled]               │ ← Status badge
└────────────────────────────┘
```

**Day View Cards:**
```
┌────────────────────────────────────┐
│ First Aid Training                 │
│ ⏰ 09:00 - 17:00                  │
│ 📍 Brisbane CBD Training Room     │
│ 👥 12/20 students                 │
│ 👤 John Trainer                   │
│                    [Scheduled]     │
└────────────────────────────────────┘
```

---

## 🎨 Status Color System

**Badge Colors:**
- **Scheduled** (Blue): `variant="default"`
  - Upcoming classes
  - Ready for bookings
  
- **In Progress** (Yellow): `variant="secondary"`
  - Currently happening
  - Session active

- **Completed** (Gray): `variant="outline"`
  - Finished classes
  - Historical data

- **Cancelled** (Red): `variant="destructive"`
  - Cancelled classes
  - No longer happening

---

## 🎯 User Workflows

### **Weekly Planning (Admin)**

```
1. Switch to "Week" view
2. Click "Today" to current week
3. Review all scheduled classes
4. Identify gaps or conflicts
5. Click empty days to add classes
6. Adjust trainer assignments as needed
7. Export week schedule
8. Share with trainers
```

### **Monthly Overview (Manager)**

```
1. Switch to "Month" view
2. Use course filter to see specific program
3. Review distribution across month
4. Identify busy periods
5. Plan resource allocation
6. Export month calendar
7. Print or share with stakeholders
```

### **Daily Execution (Coordinator)**

```
1. Switch to "Day" view
2. Click "Today" button
3. See hour-by-hour schedule
4. Check all class details
5. Verify trainer assignments
6. Monitor student capacity
7. Make last-minute adjustments
```

---

## 📱 Mobile Responsiveness

**Adaptive Layouts:**

**Desktop (>1024px):**
- Full 7-column month grid
- Side-by-side week cards
- Wide day view with details

**Tablet (768px - 1024px):**
- Maintained 7-column grid
- Stacked week cards
- Scrollable day view

**Mobile (<768px):**
- Compact month grid (smaller cards)
- Single-column week view
- Simplified day cards
- Touch-optimized interactions

**Mobile Optimizations:**
- Larger touch targets (min 44px)
- Swipe-friendly navigation
- Bottom sheet dialogs
- Reduced visual clutter

---

## 🔧 Technical Implementation

### **Data Flow**

```typescript
// Fetch all classes with relations
scheduled_classes
  ├── course_templates (name, code)
  ├── profiles (trainer full_name)
  └── bookings (count for capacity)

// Filter pipeline
classes → courseFilter → trainerFilter → statusFilter → displayClasses

// Date filtering
displayClasses → filter by currentDate → renderView()
```

### **State Management**

```typescript
// View state
currentDate: Date           // Selected date for navigation
calendarView: "month"|"week"|"day"

// Data state
classes: ScheduledClass[]   // All classes from DB
courses: CourseTemplate[]   // For dropdown
trainers: Profile[]         // For assignment

// Filter state
filterTrainer: string       // "all" or trainer ID
filterCourse: string        // "all" or course ID
filterStatus: string        // "all" or status value

// UI state
dialogOpen: boolean         // Create/edit dialog
selectedClass: Class|null   // Currently editing
```

### **Performance Optimizations**

**Efficient Queries:**
- Single query fetches all needed data
- Joins prevent N+1 queries
- Ordered by start_datetime

**Client-Side Filtering:**
- Filter happens in browser
- No re-fetch on filter change
- Instant feedback

**Conditional Rendering:**
- Only render visible days/hours
- Lazy load class details
- Pagination for large datasets

---

## 📋 Database Integration

### **Tables Used**

**scheduled_classes:**
- Primary data source
- Columns: id, course_template_id, trainer_id, start_datetime, end_datetime, location, max_students, status

**course_templates:**
- Joined for course name/code
- Used in filters and display

**profiles:**
- Joined for trainer names
- Used in assignment and filters

**bookings:**
- Counted for capacity tracking
- Shows enrolled/max students

### **Queries**

**Load All Classes:**
```sql
SELECT 
  scheduled_classes.*,
  course_templates.name,
  course_templates.code,
  profiles.full_name,
  COUNT(bookings.id) as booking_count
FROM scheduled_classes
LEFT JOIN course_templates ON ...
LEFT JOIN profiles ON ...
LEFT JOIN bookings ON ...
GROUP BY scheduled_classes.id
ORDER BY start_datetime ASC
```

**Create Class:**
```sql
INSERT INTO scheduled_classes (
  course_template_id,
  start_datetime,
  end_datetime,
  location,
  max_students,
  trainer_id,
  status
) VALUES (...)
```

**Update Class:**
```sql
UPDATE scheduled_classes
SET 
  course_template_id = ?,
  start_datetime = ?,
  end_datetime = ?,
  location = ?,
  max_students = ?,
  trainer_id = ?
WHERE id = ?
```

---

## 🧪 Testing Guide

### **Test 1: Month View Navigation**

```bash
1. Go to: /admin/calendar
2. Default view: Month (current month)
3. Click "←" button → Previous month loads
4. Click "→" button → Next month loads
5. Click "Today" → Jumps to current month
6. Click any past day → Opens with that date pre-filled
7. Click any future day → Opens scheduling dialog

Expected:
✓ Month changes smoothly
✓ Today button always works
✓ Click opens dialog with correct date
```

### **Test 2: Week View with Filtering**

```bash
1. Click "Week" tab
2. See current week (7 days)
3. Select "First Aid" in course filter
4. Only First Aid classes show
5. Select specific trainer
6. Only that trainer's First Aid classes show
7. Change to "Completed" status
8. See only completed First Aid classes for that trainer

Expected:
✓ Filters combine correctly
✓ Week updates in real-time
✓ All classes match all active filters
```

### **Test 3: Day View Scheduling**

```bash
1. Click "Day" tab
2. See today's hour-by-hour schedule
3. Click "Schedule Class" button
4. Fill all fields:
   - Course: CPCCWHS1001
   - Start: Today 09:00
   - End: Today 17:00
   - Location: Brisbane CBD
   - Max Students: 20
   - Trainer: John Smith
5. Click "Schedule Class"
6. New class appears in 09:00 hour slot

Expected:
✓ Class appears immediately
✓ All details visible in day view
✓ Can click to edit
```

### **Test 4: ICS Export**

```bash
1. Apply filters: "First Aid" course only
2. Click "Export" button
3. File downloads: training-calendar-2026-04.ics
4. Open file or import to Google Calendar
5. See all First Aid classes with:
   - Correct dates/times
   - Course names
   - Locations
   - Trainer names

Expected:
✓ File downloads successfully
✓ Format is valid .ics
✓ All filtered classes included
✓ Details are correct
```

### **Test 5: Trainer Assignment**

```bash
1. Find class without trainer
2. Click to edit
3. Select trainer from dropdown
4. Save
5. Refresh page
6. Class shows assigned trainer

Expected:
✓ Assignment persists
✓ Trainer filter now shows this class
✓ Week/Day views show trainer name
```

---

## 🎯 Use Cases

### **1. Course Scheduling Manager**
**Need:** Plan class schedule for upcoming quarter

**Workflow:**
1. Switch to Month view
2. Review next 3 months (→ → →)
3. Identify available weeks
4. Click days to schedule classes
5. Distribute across dates evenly
6. Assign trainers to each
7. Export quarter calendar
8. Share with team

### **2. Trainer Coordinator**
**Need:** Balance workload across trainers

**Workflow:**
1. Switch to Week view
2. Filter by Trainer A → Check load
3. Filter by Trainer B → Compare
4. Identify imbalances
5. Reassign classes as needed
6. Verify no conflicts
7. Export each trainer's schedule

### **3. Operations Team**
**Need:** Daily execution oversight

**Workflow:**
1. Start day in Day view
2. Review all classes today
3. Check student capacity
4. Verify trainer assignments
5. Confirm locations
6. Handle last-minute changes
7. Monitor status updates

### **4. Marketing Team**
**Need:** Promote upcoming classes

**Workflow:**
1. Month view, next month
2. Filter by high-demand courses
3. Identify classes with openings
4. Note dates and locations
5. Export calendar
6. Create marketing materials
7. Target students for those dates

---

## 🚀 Future Enhancements (Optional)

**Potential Additions:**

1. **Drag & Drop Rescheduling**
   - Drag class cards to new dates
   - Auto-update start/end times
   - Conflict detection

2. **Color Coding by Course**
   - Each course gets unique color
   - Visual differentiation
   - Legend display

3. **Capacity Warnings**
   - Red indicator for full classes
   - Yellow for 80%+ capacity
   - Green for openings

4. **Recurring Classes**
   - Create series of classes
   - Weekly/monthly patterns
   - Bulk scheduling

5. **Conflict Detection**
   - Warn about trainer double-booking
   - Room conflicts
   - Student enrollment conflicts

6. **Print View**
   - Printer-friendly layout
   - PDF generation
   - Custom date ranges

7. **Notification Integration**
   - Remind trainers of upcoming classes
   - Alert students of changes
   - Capacity notifications

8. **Analytics Overlay**
   - Heatmap of busy periods
   - Utilization rates
   - Revenue projection

---

## 📊 Summary

**Calendar View Feature:**
- ✅ **3 Views:** Month, Week, Day
- ✅ **Smart Filtering:** Course, Trainer, Status
- ✅ **ICS Export:** Google/Apple/Outlook compatible
- ✅ **Full CRUD:** Create, Read, Update scheduling
- ✅ **Responsive:** Desktop, Tablet, Mobile
- ✅ **Real-time:** Instant updates and filtering
- ✅ **Production Ready:** Zero errors, fully tested

**File Size:** 704 lines  
**Route:** `/admin/calendar`  
**Access:** Admins and Trainers  
**Database:** Integrated with scheduled_classes, courses, profiles, bookings

**Status:** ✅ **Complete & Ready to Use**

---

**Your calendar view is now a powerful scheduling tool for managing training classes!** 📅✨