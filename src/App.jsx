import React, { useEffect, useState } from 'react';
import LoginScreen from './components/auth/LoginScreen.jsx';
import AppShell from './components/layout/AppShell.jsx';
import useAppStore from './store/appStore.js';
import { supabase, isSupabaseConfigured, createOrGetWorkspace } from './lib/supabase.js';
import { startOnlineListener, flush } from './lib/offlineQueue.js';
import { CACHE_KEYS, setCache, getCache } from './lib/storage.js';

export default function App() {
  const [appState, setAppState] = useState('loading'); // loading | login | app
  const setCurrentUser = useAppStore(s => s.setCurrentUser);
  const hydrate = useAppStore(s => s.hydrate);

  useEffect(() => {
    startOnlineListener();
    flush();

    if (!isSupabaseConfigured()) {
      setAppState('login');
      return;
    }

    // Check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser({ email: session.user.email, id: session.user.id });
        await createOrGetWorkspace(session.user.id);
        await hydrate();
        setAppState('app');
      } else {
        setAppState('login');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setCurrentUser({ email: session.user.email, id: session.user.id });
        await createOrGetWorkspace(session.user.id);
        await hydrate();
        setAppState('app');
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setAppState('login');
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const handleSkipLogin = async () => {
    setCurrentUser({ email: 'local', id: 'local' });

    // Load seed data on first skip-login if no tasks in cache
    const cachedTasks = getCache(CACHE_KEYS.tasks);
    if (!cachedTasks || cachedTasks.length === 0) {
      try {
        const res = await fetch('/seed/tasks.json');
        const data = await res.json();
        const tasks = data.tasks || data;
        setCache(CACHE_KEYS.tasks, tasks);
      } catch (err) {
        console.error('Failed to load seed data:', err);
      }
    }

    await hydrate();
    setAppState('app');
  };

  if (appState === 'loading') {
    return <div className="loading-screen">Loading...</div>;
  }

  if (appState === 'login') {
    return <LoginScreen onSkip={handleSkipLogin} />;
  }

  return <AppShell />;
}
