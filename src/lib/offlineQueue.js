import { supabase, isSupabaseConfigured, getWorkspaceId } from './supabase.js';

const QUEUE_KEY = 'focus2_offline_queue';

function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function setQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function enqueue(entry) {
  const queue = getQueue();
  queue.push(entry);
  setQueue(queue);
}

export async function flush() {
  if (!isSupabaseConfigured() || !navigator.onLine) return;
  const workspaceId = getWorkspaceId();
  if (!workspaceId) return;

  const queue = getQueue();
  if (!queue.length) return;

  const failures = [];
  for (const entry of queue) {
    try {
      if (entry.operation === 'upsert') {
        const { error } = await supabase
          .from(entry.table)
          .upsert(entry.row, { onConflict: 'workspace_id,id' });
        if (error) throw error;
      } else if (entry.operation === 'delete') {
        const { error } = await supabase
          .from(entry.table)
          .delete()
          .eq('workspace_id', entry.row.workspace_id)
          .eq('id', entry.row.id);
        if (error) throw error;
      }
    } catch (err) {
      console.error('Queue flush failed:', err);
      failures.push(entry);
    }
  }
  setQueue(failures);
}

export function startOnlineListener() {
  window.addEventListener('online', () => {
    flush();
  });
}
