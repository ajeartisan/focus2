import { supabase, isSupabaseConfigured, getWorkspaceId } from './supabase.js';
import { toCamel, toSnake, sanitizeRow } from './utils.js';
import { enqueue } from './offlineQueue.js';

export async function fetchAll(table) {
  if (!isSupabaseConfigured()) return [];
  const workspaceId = getWorkspaceId();
  if (!workspaceId) return [];

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('workspace_id', workspaceId);

  if (error) {
    console.error(`fetchAll(${table}):`, error);
    return [];
  }
  return (data || []).map(toCamel);
}

export async function fetchAllTables() {
  if (!isSupabaseConfigured()) return null;

  const [tasks, bills, dailyItems, contacts, keyDates, personalListItems, goals, timeBlocks, colNotesRaw, settingsRaw] =
    await Promise.all([
      fetchAll('tasks'),
      fetchAll('bills'),
      fetchAll('daily_items'),
      fetchAll('contacts'),
      fetchAll('key_dates'),
      fetchAll('personal_list_items'),
      fetchAll('goals'),
      fetchAll('time_blocks'),
      fetchAll('col_notes'),
      fetchAll('settings'),
    ]);

  // Group col_notes by columnKey
  const colNotes = {};
  for (const note of colNotesRaw) {
    const key = note.columnKey || 'default';
    if (!colNotes[key]) colNotes[key] = [];
    colNotes[key].push(note);
  }

  // Convert settings array to object
  const settings = {};
  for (const s of settingsRaw) {
    settings[s.key] = s.value;
  }

  return { tasks, bills, dailyItems, contacts, keyDates, personalListItems, goals, timeBlocks, colNotes, settings };
}

export async function upsert(table, row) {
  if (!isSupabaseConfigured()) return;
  const workspaceId = getWorkspaceId();
  if (!workspaceId) return;

  const snakeRow = toSnake(sanitizeRow({ ...row, workspaceId }));
  const { error } = await supabase
    .from(table)
    .upsert(snakeRow, { onConflict: 'workspace_id,id' });

  if (error) {
    console.error(`upsert(${table}):`, error);
    enqueue({ table, row: snakeRow, operation: 'upsert', timestamp: Date.now() });
  }
}

export async function upsertBatch(table, rows) {
  if (!isSupabaseConfigured() || !rows.length) return;
  const workspaceId = getWorkspaceId();
  if (!workspaceId) return;

  const snakeRows = rows.map(r => toSnake(sanitizeRow({ ...r, workspaceId })));
  const { error } = await supabase
    .from(table)
    .upsert(snakeRows, { onConflict: 'workspace_id,id' });

  if (error) {
    console.error(`upsertBatch(${table}):`, error);
    for (const row of snakeRows) {
      enqueue({ table, row, operation: 'upsert', timestamp: Date.now() });
    }
  }
}

export async function remove(table, id) {
  if (!isSupabaseConfigured()) return;
  const workspaceId = getWorkspaceId();
  if (!workspaceId) return;

  const { error } = await supabase
    .from(table)
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('id', id);

  if (error) {
    console.error(`remove(${table}):`, error);
    enqueue({ table, row: { id, workspace_id: workspaceId }, operation: 'delete', timestamp: Date.now() });
  }
}
