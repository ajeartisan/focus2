export const CACHE_KEYS = {
  tasks: 'focus2_tasks',
  bills: 'focus2_bills',
  dailyItems: 'focus2_dailyItems',
  contacts: 'focus2_contacts',
  keyDates: 'focus2_keyDates',
  personalListItems: 'focus2_personalListItems',
  goals: 'focus2_goals',
  timeBlocks: 'focus2_timeBlocks',
  colNotes: 'focus2_colNotes',
  settings: 'focus2_settings',
};

export function getCache(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCache(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage full or unavailable
  }
}

export function clearAllCaches() {
  for (const key of Object.values(CACHE_KEYS)) {
    localStorage.removeItem(key);
  }
}
