# Focus2 — Clean Rebuild Blueprint

> **Purpose**: Rebuild the Focus Dashboard from scratch with a clean Supabase-first architecture.
> No migration code, no legacy files, no workspace_data blobs. Single source of truth.

---

## 1. Project Setup

### Stack
- **React 18** + **Zustand 4** (state management)
- **Vite 5** (build tool)
- **Supabase JS v2** (auth + database + realtime)
- **VitePWA** + **Workbox** (offline PWA for iOS home screen)
- **Vercel** (hosting, auto-deploy from `main`)

### Folder Structure
```
Focus2/
├── CLAUDE.md              # Claude Code instructions
├── .claude/settings.local.json
├── package.json
├── vite.config.js
├── vercel.json
├── index.html             # Vite entry point
├── public/
│   └── manifest.json      # PWA manifest
├── supabase/
│   └── schema.sql         # Full database schema (run once)
├── seed/
│   └── tasks.json         # 182 legacy tasks for initial import
├── src/
│   ├── main.jsx
│   ├── App.jsx            # Auth gate + hydration
│   ├── lib/
│   │   ├── supabase.js    # createClient singleton (URL + anon key)
│   │   ├── db.js          # CRUD: fetchAll, upsert, upsertBatch, remove
│   │   ├── offlineQueue.js # Queue writes when offline, flush on reconnect
│   │   ├── storage.js     # localStorage get/set helpers (cache only)
│   │   └── utils.js       # ensureTaskDefaults, formatCurrency, colorMap
│   ├── store/
│   │   └── appStore.js    # Zustand store: all state + actions
│   ├── components/
│   │   ├── auth/
│   │   │   └── LoginScreen.jsx
│   │   ├── layout/
│   │   │   ├── AppShell.jsx    # Sidebar + view router
│   │   │   └── Sidebar.jsx     # Nav: Dashboard, Kanban, Projects, Schedule, Household
│   │   └── dashboard/
│   │       ├── Dashboard.jsx       # 4-column layout + week calendar
│   │       ├── BigProjects.jsx     # "Doing" tasks grouped by project
│   │       ├── TodayAgenda.jsx     # Today-flagged + due-today tasks
│   │       ├── UpcomingPriority.jsx # High-priority + upcoming due tasks
│   │       ├── BigBills.jsx        # Bills tracker
│   │       ├── ColNotesPad.jsx     # Column-specific scratch notes
│   │       └── WeekCalendar.jsx    # Week/workweek/month calendar strip
│   └── styles/
│       └── app.css         # Fresh CSS (copy from dashboard_6.css, clean up)
```

### New Infrastructure (create these fresh)
| Service | Name | Notes |
|---------|------|-------|
| **GitHub repo** | `ajeartisan/focus2` | Branch: `dev` → PR to `main` |
| **Supabase project** | `focus2` | New project, run schema.sql |
| **Vercel project** | `focus2` | Connect to GitHub repo, root=`.`, build=`npm run build`, output=`dist` |

---

## 2. Supabase Schema

### Prerequisite Tables (Supabase creates these, but ensure they exist)
- `workspaces` — created by Supabase workspace pattern
- `workspace_members` — maps user_id → workspace_id

### Helper Function
```sql
CREATE OR REPLACE FUNCTION user_workspace_ids()
RETURNS SETOF uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
$$;
```

### Application Tables (10 tables, all with RLS)

**All tables share**: composite PK `(workspace_id, id)`, `updated_at` with moddatetime trigger, RLS policy using `user_workspace_ids()`.

#### tasks
| Column | Type | Notes |
|--------|------|-------|
| id | text NOT NULL | Client-generated UUID |
| workspace_id | uuid NOT NULL | FK → workspaces |
| task_key | text | Optional human-readable key |
| title | text NOT NULL DEFAULT '' | |
| project | text NOT NULL DEFAULT '' | Category/project name |
| status | text NOT NULL DEFAULT 'ready' | ready, doing, done, archived, cancelled |
| priority | text NOT NULL DEFAULT 'none' | none, medium, high |
| assigned_to | text | |
| waiting_on | text | |
| waiting_on_task_ids | text[] DEFAULT '{}' | |
| today_flag | boolean NOT NULL DEFAULT false | **NEVER changed by kanban moves or due date changes** |
| created_at | timestamptz NOT NULL DEFAULT now() | |
| completed_at | timestamptz | |
| due_date | date | |
| notes | text | |
| subtask_ids | text[] DEFAULT '{}' | |
| parent_id | text | |
| calendar_event_id | text | |
| extra | jsonb DEFAULT '{}' | |
| sort_order | integer NOT NULL DEFAULT 0 | |

#### contacts
| Column | Type | Notes |
|--------|------|-------|
| id | uuid DEFAULT gen_random_uuid() | |
| name | text NOT NULL | |
| initials | text | |
| email | text | |
| freq | integer NOT NULL DEFAULT 0 | |
| aliases | text[] DEFAULT '{}' | |

#### personal_list_items
| Column | Type | Notes |
|--------|------|-------|
| id | uuid DEFAULT gen_random_uuid() | |
| list_type | text NOT NULL | |
| text | text NOT NULL | |
| done | boolean NOT NULL DEFAULT false | |
| price | integer | |
| rating | numeric | |
| neighborhood | text | |
| sort_order | integer NOT NULL DEFAULT 0 | |

#### goals
| Column | Type | Notes |
|--------|------|-------|
| id | uuid DEFAULT gen_random_uuid() | |
| goal_type | text NOT NULL | |
| text | text NOT NULL | |
| done | boolean NOT NULL DEFAULT false | |
| sort_order | integer NOT NULL DEFAULT 0 | |

#### time_blocks
| Column | Type | Notes |
|--------|------|-------|
| id | uuid DEFAULT gen_random_uuid() | |
| title | text NOT NULL DEFAULT '' | |
| type | text | |
| date | date **NOT NULL** | Must never be null/empty |
| start_time | text | |
| end_time | text | |
| notes | text | |
| sort_order | integer NOT NULL DEFAULT 0 | |

#### key_dates
| Column | Type | Notes |
|--------|------|-------|
| id | uuid DEFAULT gen_random_uuid() | |
| title | text NOT NULL | |
| date | date **NOT NULL** | Must never be null/empty |
| recurrence | text NOT NULL DEFAULT 'none' | |
| category | text NOT NULL DEFAULT 'other' | |
| notes | text | |
| person | text | |
| created_at | timestamptz NOT NULL DEFAULT now() | |

#### bills
| Column | Type | Notes |
|--------|------|-------|
| id | text NOT NULL | Client-generated |
| name | text NOT NULL | |
| amount | numeric | |
| due_date | date | |
| account | text DEFAULT '' | |
| recurring | boolean NOT NULL DEFAULT false | |
| recurring_period | text | |
| category | text DEFAULT '' | |
| paid | boolean NOT NULL DEFAULT false | |
| paid_date | timestamptz | |

#### daily_items
| Column | Type | Notes |
|--------|------|-------|
| id | uuid DEFAULT gen_random_uuid() | |
| text | text NOT NULL DEFAULT '' | |
| done | boolean NOT NULL DEFAULT false | |
| date | date | |
| sort_order | integer NOT NULL DEFAULT 0 | |

#### col_notes
| Column | Type | Notes |
|--------|------|-------|
| id | uuid DEFAULT gen_random_uuid() | |
| column_key | text NOT NULL | e.g. 'focus_notes_projects' |
| text | text NOT NULL DEFAULT '' | |
| sort_order | integer NOT NULL DEFAULT 0 | |

#### settings
| Column | Type | Notes |
|--------|------|-------|
| key | text NOT NULL | PK is (workspace_id, key) |
| value | jsonb NOT NULL DEFAULT '{}' | |

---

## 3. Architecture — Single Source of Truth

### Data Flow (simple, no migration)
```
User Action
  → mutate Zustand store (instant UI update)
  → save to localStorage (offline cache)
  → upsert to Supabase (source of truth)
    → on error: enqueue to offlineQueue
```

### Hydration (on app load / tab focus)
```
1. Fetch all tables from Supabase in parallel
2. SAFE CACHE rule: if Supabase returns 0 rows but localStorage has data → keep localStorage
3. Update Zustand store
4. Save to localStorage (cache)
```

### Offline Queue
```
- On write failure: push { table, row, operation } to localStorage queue
- On reconnect (online event): flush queue → upsert all pending rows
- On flush success: clear queue
- Always transform camelCase → snake_case before Supabase upsert
```

### camelCase ↔ snake_case
- JS objects use **camelCase** (createdAt, dueDate, todayFlag)
- Supabase columns use **snake_case** (created_at, due_date, today_flag)
- `toSnake(obj)` and `toCamel(obj)` transforms at the DB boundary
- **sanitizeRow(obj)**: convert empty string dates → null, undefined → null

### Auth Flow
```
1. Show login screen
2. User signs in with Google OAuth
3. createOrGetWorkspace(userId) → returns workspace_id
4. hydrate() → fetch all data from Supabase
5. Show app
```

### Key Rules
- **todayFlag is sacred**: NEVER changed by kanban moves or due date changes
- **Done lane always marks done**: Never nests as child
- **syncParentDueDate(parentId)**: Call whenever subtask status/dueDate changes
- **Subtasks hidden**: All Tasks grid hides subtasks by default
- **No workspace_data table**: Individual rows in individual tables only
- **No migration code**: Fresh Supabase, no blob-to-row migration needed

---

## 4. UI Features to Implement

### Phase 1: Dashboard (MVP — ship this first)
- [x] **Login Screen**: Google OAuth + "Skip" option
- [x] **Sidebar**: 5 nav items (Dashboard active, rest show "Coming soon")
- [x] **Dashboard 4-Column Layout**:
  - **BigProjects**: "Doing" tasks grouped by project category, color-coded
  - **TodayAgenda**: Today-flagged tasks + daily items checklist
  - **UpcomingPriority**: High-priority + upcoming due-date tasks, overdue highlighting
  - **BigBills**: Bill tracker with add/edit/paid/delete
- [x] **WeekCalendar**: Collapsible, week/workweek/month views, task dots per day
- [x] **ColNotesPad**: Scratch notes per column
- [x] **Drag-drop**: Between TodayAgenda ↔ UpcomingPriority (toggle todayFlag)
- [x] **Offline support**: localStorage cache + offline queue + PWA

### Phase 2: Additional Views (build after Phase 1 works)
- [ ] **Kanban Board**: Lanes for ready/doing/done with drag-drop
- [ ] **Projects View**: Tasks grouped by project with expand/collapse
- [ ] **Schedule View**: Calendar/timeline view
- [ ] **Household View**: Shared household admin table

### Category Color Map (20 predefined + hash fallback)
```javascript
const DEFAULT_COLOR_MAP = {
  'Admin': '#546E7A', 'Medical': '#E53935', 'Legal': '#8E24AA',
  'Social': '#D81B60', 'Travel': '#00ACC1', 'Tahoe': '#F9A825',
  'VA': '#1E88E5', 'SF/Boat': '#0277BD', 'Dad/Care': '#E64A19',
  'Finance': '#1565C0', 'Taxes': '#C62828', 'Wealth Management': '#2E7D32',
  'LC Equity': '#4527A0', 'Walden/Tahoe': '#6D4C41', 'Rental': '#EF6C00',
  'San Francisco': '#0288D1', 'Privates': '#455A64', 'Blank': '#9E9E9E',
  'Walden': '#5D4037', 'Health Insurance': '#0288D1'
};
// 15-color hash fallback palette for new categories
const CATEGORY_PALETTE = [
  '#1E88E5','#43A047','#E53935','#8E24AA','#FB8C00',
  '#00ACC1','#E64A19','#00897B','#3949AB','#F9A825',
  '#6D4C41','#546E7A','#D81B60','#C62828','#2E7D32'
];
```

---

## 5. Zustand Store Shape

```javascript
{
  // Navigation
  currentView: 'dashboard',  // dashboard | kanban | projects | schedule | household

  // Data (arrays of camelCase objects)
  tasks: [],
  bills: [],
  dailyItems: [],
  contacts: [],
  keyDates: [],
  personalListItems: [],
  goals: [],
  settings: {},
  colNotes: { 'focus_notes_projects': [], 'focus_notes_upcoming': [] },

  // Mutations (update store + localStorage + Supabase)
  mutateTasks: (updater) => void,
  mutateBills: (updater) => void,
  mutateDailyItems: (updater) => void,
  mutateColNotes: (storageKey, updater) => void,

  // Sync
  hydrate: () => Promise<void>,  // fetch from Supabase, safe-cache to localStorage
  syncStatus: 'offline' | 'syncing' | 'synced' | 'error',

  // Calendar
  weekStartDate: Date,
  calendarViewMode: 'week' | 'workweek' | 'month',
  calendarOpen: boolean,

  // UI
  sidebarHidden: boolean,
  editingTaskId: null | string,

  // Auth
  currentUser: null | { email, id },
}
```

---

## 6. Seed Data Import

File: `seed/tasks.json` — 182 tasks exported Feb 26, 2026.

**Categories**: Finance(79), SF/Boat(53), Tahoe(18), Admin(9), Travel(8), Social(6), Medical(5), Legal(4)

**Import strategy**: After app is built and Supabase is set up:
1. Sign in → get workspace_id
2. Run one-time seed script (or build an import button in Settings)
3. Read `seed/tasks.json`, transform each task to snake_case, batch upsert to `tasks` table
4. Verify count matches (182)

**Task shape in seed file**:
```json
{
  "id": "uuid-string",
  "title": "Task title",
  "project": "Finance",
  "status": "ready",
  "priority": "none",
  "assignedTo": "Andrew",
  "waitingOn": null,
  "todayFlag": false,
  "createdAt": "2026-02-25T22:58:03.302025",
  "completedAt": null,
  "dueDate": "2026-02-15",
  "notes": "Details here",
  "subtaskIds": [],
  "parentId": null,
  "waitingOnTaskIds": []
}
```

---

## 7. Vercel Configuration

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**Key**: Root directory is the project root. Vite outputs to `dist/`. No subdirectory nesting.

---

## 8. PWA Configuration (vite.config.js)

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Focus2',
        short_name: 'Focus2',
        start_url: '/',
        display: 'standalone',
        background_color: '#f5f6fa',
        theme_color: '#4A6FA5',
      }
    })
  ]
});
```

---

## 9. CSS Variables (from existing working theme)

```css
:root {
  --text: #1a1a1a;
  --text-muted: rgba(26,26,26,0.6);
  --accent: #4A6FA5;
  --overdue: rgba(192,57,43,0.8);
  --bg: #fff;
  --surface: #f5f5f5;
  --high: #e74c3c;
  --medium: #f1c40f;
}
```

---

## 10. What NOT To Do

- **No workspace_data table** — that was the old JSON blob approach
- **No dataMigration.js** — no blobs to migrate from
- **No legacy dashboard_6.js/html** — pure React from day 1
- **No localStorage-first** — Supabase is source of truth, localStorage is cache only
- **No MIGRATION_VERSION tracking** — no migration needed
- **No Google Calendar API** — that was from the old dashboard, not needed
- **No `app/` subdirectory** — Vite project IS the root (simpler Vercel config)
