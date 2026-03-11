import { create } from 'zustand';
import { CACHE_KEYS, getCache, setCache } from '../lib/storage.js';
import { fetchAllTables, upsert, remove as dbRemove } from '../lib/db.js';
import { isSupabaseConfigured } from '../lib/supabase.js';
import { getMonday } from '../lib/utils.js';

const useAppStore = create((set, get) => ({
  // Auth
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),

  // Sync
  syncStatus: 'offline', // offline | syncing | synced | error
  setSyncStatus: (s) => set({ syncStatus: s }),

  // Navigation
  currentView: 'dashboard',
  setCurrentView: (v) => set({ currentView: v }),

  // Data
  tasks: [],
  bills: [],
  dailyItems: [],
  contacts: [],
  keyDates: [],
  personalListItems: [],
  goals: [],
  timeBlocks: [],
  colNotes: {}, // { [columnKey]: Note[] }
  settings: {},

  // Calendar
  weekStartDate: getMonday(new Date()),
  calendarViewMode: 'week',
  calendarOpen: true,
  setWeekStartDate: (d) => set({ weekStartDate: d }),
  setCalendarViewMode: (m) => set({ calendarViewMode: m }),
  setCalendarOpen: (v) => set({ calendarOpen: v }),

  // UI
  sidebarHidden: false,
  setSidebarHidden: (v) => set({ sidebarHidden: v }),
  editingTaskId: null,
  setEditingTaskId: (id) => set({ editingTaskId: id }),

  // --- Mutators ---

  mutateTasks: (updater) => {
    const { tasks } = get();
    const { updated, changed } = updater(tasks);
    set({ tasks: updated });
    setCache(CACHE_KEYS.tasks, updated);
    // Fire-and-forget upserts
    for (const row of changed) {
      upsert('tasks', row);
    }
  },

  mutateBills: (updater) => {
    const { bills } = get();
    const { updated, changed } = updater(bills);
    set({ bills: updated });
    setCache(CACHE_KEYS.bills, updated);
    for (const row of changed) {
      upsert('bills', row);
    }
  },

  mutateDailyItems: (updater) => {
    const { dailyItems } = get();
    const { updated, changed } = updater(dailyItems);
    set({ dailyItems: updated });
    setCache(CACHE_KEYS.dailyItems, updated);
    for (const row of changed) {
      upsert('daily_items', row);
    }
  },

  mutateColNotes: (storageKey, updater) => {
    const { colNotes } = get();
    const current = colNotes[storageKey] || [];
    const { updated, changed } = updater(current);
    const newColNotes = { ...colNotes, [storageKey]: updated };
    set({ colNotes: newColNotes });
    setCache(CACHE_KEYS.colNotes, newColNotes);
    for (const row of changed) {
      upsert('col_notes', { ...row, columnKey: storageKey });
    }
  },

  // --- Remove helpers ---

  removeTask: (id) => {
    const { tasks } = get();
    set({ tasks: tasks.filter(t => t.id !== id) });
    setCache(CACHE_KEYS.tasks, get().tasks);
    dbRemove('tasks', id);
  },

  removeBill: (id) => {
    const { bills } = get();
    set({ bills: bills.filter(b => b.id !== id) });
    setCache(CACHE_KEYS.bills, get().bills);
    dbRemove('bills', id);
  },

  removeDailyItem: (id) => {
    const { dailyItems } = get();
    set({ dailyItems: dailyItems.filter(d => d.id !== id) });
    setCache(CACHE_KEYS.dailyItems, get().dailyItems);
    dbRemove('daily_items', id);
  },

  removeColNote: (storageKey, id) => {
    const { colNotes } = get();
    const current = colNotes[storageKey] || [];
    const newColNotes = { ...colNotes, [storageKey]: current.filter(n => n.id !== id) };
    set({ colNotes: newColNotes });
    setCache(CACHE_KEYS.colNotes, newColNotes);
    dbRemove('col_notes', id);
  },

  // --- Hydrate ---

  hydrate: async () => {
    if (!isSupabaseConfigured()) {
      // Load from localStorage only
      set({
        tasks: getCache(CACHE_KEYS.tasks) || [],
        bills: getCache(CACHE_KEYS.bills) || [],
        dailyItems: getCache(CACHE_KEYS.dailyItems) || [],
        contacts: getCache(CACHE_KEYS.contacts) || [],
        keyDates: getCache(CACHE_KEYS.keyDates) || [],
        personalListItems: getCache(CACHE_KEYS.personalListItems) || [],
        goals: getCache(CACHE_KEYS.goals) || [],
        timeBlocks: getCache(CACHE_KEYS.timeBlocks) || [],
        colNotes: getCache(CACHE_KEYS.colNotes) || {},
        settings: getCache(CACHE_KEYS.settings) || {},
        syncStatus: 'offline',
      });
      return;
    }

    set({ syncStatus: 'syncing' });
    try {
      const data = await fetchAllTables();
      if (!data) {
        set({ syncStatus: 'error' });
        return;
      }

      // SAFE CACHE: keep localStorage if Supabase returns 0 rows but cache has data
      const safeMerge = (key, remoteData) => {
        const cached = getCache(key);
        if ((!remoteData || remoteData.length === 0) && cached && cached.length > 0) {
          return cached;
        }
        return remoteData;
      };

      const merged = {
        tasks: safeMerge(CACHE_KEYS.tasks, data.tasks),
        bills: safeMerge(CACHE_KEYS.bills, data.bills),
        dailyItems: safeMerge(CACHE_KEYS.dailyItems, data.dailyItems),
        contacts: safeMerge(CACHE_KEYS.contacts, data.contacts),
        keyDates: safeMerge(CACHE_KEYS.keyDates, data.keyDates),
        personalListItems: safeMerge(CACHE_KEYS.personalListItems, data.personalListItems),
        goals: safeMerge(CACHE_KEYS.goals, data.goals),
        timeBlocks: safeMerge(CACHE_KEYS.timeBlocks, data.timeBlocks),
        colNotes: (Object.keys(data.colNotes).length === 0 && getCache(CACHE_KEYS.colNotes))
          ? getCache(CACHE_KEYS.colNotes) : data.colNotes,
        settings: (Object.keys(data.settings).length === 0 && getCache(CACHE_KEYS.settings))
          ? getCache(CACHE_KEYS.settings) : data.settings,
      };

      set({ ...merged, syncStatus: 'synced' });

      // Cache all
      setCache(CACHE_KEYS.tasks, merged.tasks);
      setCache(CACHE_KEYS.bills, merged.bills);
      setCache(CACHE_KEYS.dailyItems, merged.dailyItems);
      setCache(CACHE_KEYS.contacts, merged.contacts);
      setCache(CACHE_KEYS.keyDates, merged.keyDates);
      setCache(CACHE_KEYS.personalListItems, merged.personalListItems);
      setCache(CACHE_KEYS.goals, merged.goals);
      setCache(CACHE_KEYS.timeBlocks, merged.timeBlocks);
      setCache(CACHE_KEYS.colNotes, merged.colNotes);
      setCache(CACHE_KEYS.settings, merged.settings);
    } catch (err) {
      console.error('Hydrate failed:', err);
      set({ syncStatus: 'error' });
      // Fall back to cache
      set({
        tasks: getCache(CACHE_KEYS.tasks) || [],
        bills: getCache(CACHE_KEYS.bills) || [],
        dailyItems: getCache(CACHE_KEYS.dailyItems) || [],
        colNotes: getCache(CACHE_KEYS.colNotes) || {},
      });
    }
  },
}));

export default useAppStore;
