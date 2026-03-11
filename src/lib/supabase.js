import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

// Only create client if credentials are provided
export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export function isSupabaseConfigured() {
  return supabase !== null;
}

export async function signInWithGoogle() {
  if (!supabase) return { error: { message: 'Supabase not configured' } };
  return supabase.auth.signInWithOAuth({ provider: 'google' });
}

export async function signOut() {
  if (!supabase) return;
  return supabase.auth.signOut();
}

export async function getSession() {
  if (!supabase) return { data: { session: null } };
  return supabase.auth.getSession();
}

export function getWorkspaceId() {
  return localStorage.getItem('focus2_workspace_id');
}

export function setWorkspaceId(id) {
  localStorage.setItem('focus2_workspace_id', id);
}

export async function createOrGetWorkspace(userId) {
  if (!supabase) return null;

  // Check if user already has a workspace
  const { data: members } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .limit(1);

  if (members && members.length > 0) {
    const wsId = members[0].workspace_id;
    setWorkspaceId(wsId);
    return wsId;
  }

  // Create new workspace
  const { data: ws, error: wsErr } = await supabase
    .from('workspaces')
    .insert({ name: 'My Workspace' })
    .select('id')
    .single();

  if (wsErr) {
    console.error('Failed to create workspace:', wsErr);
    return null;
  }

  // Add user as member
  await supabase
    .from('workspace_members')
    .insert({ workspace_id: ws.id, user_id: userId });

  setWorkspaceId(ws.id);
  return ws.id;
}
