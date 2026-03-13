# Focus2 — Phase 2: Additional Views

## Status: Implementation complete, awaiting testing

## What was built

### Step 1: Routing Infrastructure ✅
- [x] `Sidebar.jsx` — removed "Coming soon" gate, `handleNav` calls `setCurrentView(id)` for all 5 nav items
- [x] `AppShell.jsx` — added `ViewSwitch` component that renders correct view based on `currentView` state
- [x] WeekCalendar only renders on Dashboard view
- [x] Created 4 new component directories + files
- [x] All nav items switch views, active state highlights correctly

### Step 2: KanbanBoard ✅
- [x] `src/components/kanban/KanbanBoard.jsx` created
- [x] 3-lane grid: ready / doing / done
- [x] HTML5 drag-drop between lanes changes `task.status` only (NEVER todayFlag)
- [x] Task cards show: project dot, title, priority badge, due date
- [x] Project filter dropdown
- [x] Filters: `!t.parentId`, excludes archived/cancelled
- [x] Overdue tasks get red left border
- [x] Lane drag-over highlight with accent color

### Step 3: ProjectsView ✅
- [x] `src/components/projects/ProjectsView.jsx` created
- [x] Tasks grouped by `t.project`, sorted alphabetically
- [x] Expand/collapse per project (local state)
- [x] Color-coded headers via `getCategoryColor()`
- [x] Within each project: sorted doing → ready → done
- [x] Checkbox to mark tasks done
- [x] Status badges with color coding (doing=blue, done=green)

### Step 4: HouseholdView ✅
- [x] `src/components/household/HouseholdView.jsx` created
- [x] Full-width table: title, project, status, priority, dueDate, assignedTo
- [x] Sortable columns (click header to toggle asc/desc)
- [x] Filter dropdowns: project, status, priority
- [x] Inline `<select>` editing for status and priority
- [x] Add-task form row at top with title, project, dueDate, assignedTo fields
- [x] Overdue styling, done row opacity

### Step 5: ScheduleView ✅
- [x] `src/components/schedule/ScheduleView.jsx` created
- [x] Month grid with prev/next/today navigation
- [x] Monday-first calendar with outside-month padding
- [x] Task dots per day colored by project
- [x] Click date → detail panel below showing that day's tasks
- [x] Right sidebar: tasks with no dueDate (capped at 30)
- [x] Helper: `getMonthDays(year, month)` for calendar grid

### Step 6: Responsive Polish ✅
- [x] Kanban: 3-col → 1-col at 768px
- [x] Schedule: 2-col → 1-col at 768px
- [x] Household: table scrolls horizontally at 768px (min-width: 600px)

## Files Modified
- `src/components/layout/Sidebar.jsx` — removed coming-soon gate
- `src/components/layout/AppShell.jsx` — view switching + new imports
- `src/styles/app.css` — ~250 lines added for all 4 views + responsive

## Files Created
- `src/components/kanban/KanbanBoard.jsx`
- `src/components/projects/ProjectsView.jsx`
- `src/components/schedule/ScheduleView.jsx`
- `src/components/household/HouseholdView.jsx`

## Key Patterns Used
- All mutations: `mutateTasks(prev => ({ updated, changed }))`
- Subtask filter: `!t.parentId`
- CSS variables only, no hardcoded colors
- CSS scoped with prefixes: `.kanban-*`, `.projects-*`, `.schedule-*`, `.household-*`
- Kanban drag NEVER touches `todayFlag`

## Build
- `npm run build` passes cleanly (1.19s, 358KB JS, 15KB CSS)
- Dev server: `http://localhost:5173/`
- Production: `https://focus2.vercel.app` (not yet deployed — on dev branch)

## Next Steps
- [ ] Test all 5 views locally
- [ ] Verify shared state consistency (change task in one view, check another)
- [ ] Commit, PR to main, merge to trigger Vercel deploy
