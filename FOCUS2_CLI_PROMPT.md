# Focus2 CLI Prompt

## Pre-Steps (do these manually before pasting the prompt)

### 1. Create the folder
```bash
mkdir -p ~/OneDrive/Claude/Code/Focus2
cd ~/OneDrive/Claude/Code/Focus2
```

### 2. Copy the blueprint and seed data
```bash
cp ~/OneDrive/Claude/Code/ToDo/FOCUS2_REBUILD.md ./FOCUS2_REBUILD.md
cp ~/OneDrive/Claude/Code/ToDo/master_tasks_for_import.json ./seed_tasks.json
```

### 3. Create a new Supabase project
- Go to https://supabase.com/dashboard → New Project → name it `focus2`
- Copy the **Project URL** and **anon public key** from Settings → API
- Keep the SQL Editor tab open (you'll paste the schema there)

### 4. Start Claude Code
```bash
cd ~/OneDrive/Claude/Code/Focus2
claude
```

### 5. Paste this prompt:

---

## The Prompt (copy everything below this line)

```
Read FOCUS2_REBUILD.md — it's the complete spec for this project.

Build Focus2 from scratch. This is a personal task management dashboard (React + Supabase + Vercel + PWA). The spec has everything: schema, architecture, components, store shape, CSS, seed data.

Here's what I need you to do in order:

**Phase 1: Scaffold**
- Init the project: npm create vite@latest . -- --template react
- Install deps: @supabase/supabase-js zustand vite-plugin-pwa workbox-window
- Set up vite.config.js with React + VitePWA per the spec
- Set up vercel.json per the spec
- Create the folder structure from the spec
- Init git, create GitHub repo `ajeartisan/focus2`, push initial commit

**Phase 2: Supabase Layer**
- Create src/lib/supabase.js (I'll give you the URL and anon key)
- Create src/lib/db.js — the CRUD layer with camelCase↔snake_case transforms, sanitizeRow, batch upserts
- Create src/lib/offlineQueue.js — queue writes when offline, flush on reconnect
- Create src/lib/storage.js — localStorage cache helpers
- Create the schema.sql file from the spec (I'll run it in Supabase SQL Editor)

**Phase 3: Store + Auth**
- Create src/store/appStore.js with the full Zustand store per the spec
- Create src/App.jsx with the auth flow (Google OAuth → workspace → hydrate)
- Create src/components/auth/LoginScreen.jsx
- The SAFE CACHE rule is critical: never overwrite localStorage with empty Supabase data

**Phase 4: Dashboard UI**
- Create AppShell.jsx + Sidebar.jsx
- Create Dashboard.jsx (4-column layout)
- Create BigProjects.jsx, TodayAgenda.jsx, UpcomingPriority.jsx, BigBills.jsx
- Create WeekCalendar.jsx, ColNotesPad.jsx
- Implement drag-drop between TodayAgenda ↔ UpcomingPriority
- Use the CSS variables and color map from the spec
- Copy the working CSS from the old project's dashboard_6.css for the layout classes

**Phase 5: Deploy + Seed**
- Push to GitHub, connect Vercel
- I'll run the schema.sql in Supabase
- Build a one-time seed script to import seed_tasks.json (182 tasks) into Supabase
- Verify on desktop + mobile

Build each phase, verify it works with the dev server, then move to the next. Use plan mode for each phase. Commit after each phase.
```
