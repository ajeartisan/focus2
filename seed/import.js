#!/usr/bin/env node
/**
 * One-time seed import: loads seed/tasks.json into Supabase.
 *
 * Usage:
 *   node seed/import.js <workspace_id>
 *
 * Requires VITE_SUPABASE_URL and VITE_SUPABASE_KEY in .env
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config(); // load .env

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_KEY;
const workspaceId = process.argv[2];

if (!workspaceId) {
  console.error('Usage: node seed/import.js <workspace_id>');
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Only keep columns that exist in the tasks table
const VALID_COLUMNS = new Set([
  'id', 'task_key', 'title', 'project', 'status', 'priority',
  'assigned_to', 'waiting_on', 'waiting_on_task_ids', 'today_flag',
  'created_at', 'completed_at', 'due_date', 'notes', 'subtask_ids',
  'parent_id', 'calendar_event_id', 'extra', 'sort_order',
]);

function toSnake(key) {
  return key.replace(/[A-Z]/g, c => '_' + c.toLowerCase());
}

function transformTask(task, idx) {
  const row = { workspace_id: workspaceId };
  for (const [k, v] of Object.entries(task)) {
    const snake = toSnake(k);
    if (VALID_COLUMNS.has(snake)) {
      // Sanitize: empty string dates → null
      if ((snake === 'due_date' || snake === 'completed_at') && v === '') {
        row[snake] = null;
      } else {
        row[snake] = v;
      }
    }
  }
  if (row.sort_order == null) row.sort_order = idx;
  return row;
}

async function main() {
  const raw = JSON.parse(readFileSync(new URL('./tasks.json', import.meta.url), 'utf-8'));
  const tasks = raw.tasks || raw;
  console.log(`Found ${tasks.length} tasks to import into workspace ${workspaceId}`);

  const rows = tasks.map(transformTask);

  // Batch in chunks of 50 (Supabase limit recommendation)
  const BATCH = 50;
  let imported = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error } = await supabase
      .from('tasks')
      .upsert(chunk, { onConflict: 'workspace_id,id' });

    if (error) {
      console.error(`Batch ${i}-${i + chunk.length} failed:`, error.message);
    } else {
      imported += chunk.length;
      console.log(`  Imported ${imported}/${rows.length}`);
    }
  }

  // Verify
  const { count, error: countErr } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId);

  if (countErr) {
    console.error('Count check failed:', countErr.message);
  } else {
    console.log(`\nDone. ${count} tasks now in Supabase for this workspace.`);
    if (count === tasks.length) {
      console.log('✓ Count matches seed data.');
    } else {
      console.log(`⚠ Expected ${tasks.length}, got ${count}`);
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
