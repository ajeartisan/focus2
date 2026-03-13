-- Focus Dashboard: Supabase-First Schema
-- Run this in Supabase SQL Editor

-- 0. PREREQUISITE TABLES
CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'My Workspace',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workspace_members (
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'owner',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY workspace_members_access ON workspace_members
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- HELPER
CREATE EXTENSION IF NOT EXISTS moddatetime;

CREATE OR REPLACE FUNCTION user_workspace_ids()
RETURNS SETOF uuid
LANGUAGE sql SECURITY DEFINER STABLE
AS $BODY$
  SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
$BODY$;

-- 1. TASKS
CREATE TABLE IF NOT EXISTS tasks (
  id text NOT NULL,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  task_key text,
  title text NOT NULL DEFAULT '',
  project text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'ready',
  priority text NOT NULL DEFAULT 'none',
  assigned_to text,
  waiting_on text,
  waiting_on_task_ids text[] DEFAULT '{}',
  today_flag boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  due_date date,
  notes text,
  subtask_ids text[] DEFAULT '{}',
  parent_id text,
  calendar_event_id text,
  extra jsonb DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, id)
);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace ON tasks(workspace_id);
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY tasks_access ON tasks USING (workspace_id IN (SELECT user_workspace_ids())) WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

-- 2. CONTACTS
CREATE TABLE IF NOT EXISTS contacts (
  id uuid DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  initials text,
  email text,
  freq integer NOT NULL DEFAULT 0,
  aliases text[] DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, id)
);
CREATE INDEX IF NOT EXISTS idx_contacts_workspace ON contacts(workspace_id);
CREATE TRIGGER contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY contacts_access ON contacts USING (workspace_id IN (SELECT user_workspace_ids())) WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

-- 3. PERSONAL_LIST_ITEMS
CREATE TABLE IF NOT EXISTS personal_list_items (
  id uuid DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  list_type text NOT NULL,
  text text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  price integer,
  rating numeric,
  neighborhood text,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, id)
);
CREATE INDEX IF NOT EXISTS idx_pli_workspace ON personal_list_items(workspace_id);
CREATE INDEX IF NOT EXISTS idx_pli_type ON personal_list_items(workspace_id, list_type);
CREATE TRIGGER personal_list_items_updated_at BEFORE UPDATE ON personal_list_items FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
ALTER TABLE personal_list_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY personal_list_items_access ON personal_list_items USING (workspace_id IN (SELECT user_workspace_ids())) WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

-- 4. GOALS
CREATE TABLE IF NOT EXISTS goals (
  id uuid DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  goal_type text NOT NULL,
  text text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, id)
);
CREATE INDEX IF NOT EXISTS idx_goals_workspace ON goals(workspace_id);
CREATE TRIGGER goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY goals_access ON goals USING (workspace_id IN (SELECT user_workspace_ids())) WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

-- 5. TIME_BLOCKS
CREATE TABLE IF NOT EXISTS time_blocks (
  id uuid DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  type text,
  date date NOT NULL,
  start_time text,
  end_time text,
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, id)
);
CREATE INDEX IF NOT EXISTS idx_time_blocks_workspace ON time_blocks(workspace_id);
CREATE TRIGGER time_blocks_updated_at BEFORE UPDATE ON time_blocks FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
ALTER TABLE time_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY time_blocks_access ON time_blocks USING (workspace_id IN (SELECT user_workspace_ids())) WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

-- 6. KEY_DATES
CREATE TABLE IF NOT EXISTS key_dates (
  id uuid DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  date date NOT NULL,
  recurrence text NOT NULL DEFAULT 'none',
  category text NOT NULL DEFAULT 'other',
  notes text,
  person text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, id)
);
CREATE INDEX IF NOT EXISTS idx_key_dates_workspace ON key_dates(workspace_id);
CREATE TRIGGER key_dates_updated_at BEFORE UPDATE ON key_dates FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
ALTER TABLE key_dates ENABLE ROW LEVEL SECURITY;
CREATE POLICY key_dates_access ON key_dates USING (workspace_id IN (SELECT user_workspace_ids())) WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

-- 7. BILLS
CREATE TABLE IF NOT EXISTS bills (
  id text NOT NULL,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount numeric,
  due_date date,
  account text DEFAULT '',
  recurring boolean NOT NULL DEFAULT false,
  recurring_period text,
  category text DEFAULT '',
  paid boolean NOT NULL DEFAULT false,
  paid_date timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, id)
);
CREATE INDEX IF NOT EXISTS idx_bills_workspace ON bills(workspace_id);
CREATE TRIGGER bills_updated_at BEFORE UPDATE ON bills FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY bills_access ON bills USING (workspace_id IN (SELECT user_workspace_ids())) WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

-- 8. DAILY_ITEMS
CREATE TABLE IF NOT EXISTS daily_items (
  id uuid DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  text text NOT NULL DEFAULT '',
  done boolean NOT NULL DEFAULT false,
  date date,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, id)
);
CREATE INDEX IF NOT EXISTS idx_daily_items_workspace ON daily_items(workspace_id);
CREATE TRIGGER daily_items_updated_at BEFORE UPDATE ON daily_items FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
ALTER TABLE daily_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY daily_items_access ON daily_items USING (workspace_id IN (SELECT user_workspace_ids())) WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

-- 9. COL_NOTES
CREATE TABLE IF NOT EXISTS col_notes (
  id uuid DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  column_key text NOT NULL,
  text text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, id)
);
CREATE INDEX IF NOT EXISTS idx_col_notes_workspace ON col_notes(workspace_id);
CREATE TRIGGER col_notes_updated_at BEFORE UPDATE ON col_notes FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
ALTER TABLE col_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY col_notes_access ON col_notes USING (workspace_id IN (SELECT user_workspace_ids())) WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

-- 10. SETTINGS
CREATE TABLE IF NOT EXISTS settings (
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, key)
);
CREATE INDEX IF NOT EXISTS idx_settings_workspace ON settings(workspace_id);
CREATE TRIGGER settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY settings_access ON settings USING (workspace_id IN (SELECT user_workspace_ids())) WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));
