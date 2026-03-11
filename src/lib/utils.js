// Category color map — Google Material colors
export const DEFAULT_COLOR_MAP = {
  'Admin': '#546E7A',
  'Medical': '#E53935',
  'Legal': '#8E24AA',
  'Social': '#D81B60',
  'Travel': '#00ACC1',
  'Tahoe': '#F9A825',
  'VA': '#1E88E5',
  'SF/Boat': '#0277BD',
  'Dad/Care': '#E64A19',
  'Finance': '#1565C0',
  'Taxes': '#C62828',
  'Wealth Management': '#2E7D32',
  'LC Equity': '#4527A0',
  'Walden/Tahoe': '#6D4C41',
  'Rental': '#EF6C00',
  'San Francisco': '#0288D1',
  'Privates': '#455A64',
  'Blank': '#9E9E9E',
  'Walden': '#5D4037',
  'Health Insurance': '#0288D1',
};

// Fallback palette for unknown categories (hash-based selection)
export const CATEGORY_PALETTE = [
  '#1E88E5', '#43A047', '#E53935', '#8E24AA', '#FB8C00',
  '#00ACC1', '#E64A19', '#00897B', '#3949AB', '#F9A825',
  '#6D4C41', '#546E7A', '#D81B60', '#C62828', '#2E7D32',
];

export function getCategoryColor(project) {
  if (!project) return DEFAULT_COLOR_MAP['Blank'];
  if (DEFAULT_COLOR_MAP[project]) return DEFAULT_COLOR_MAP[project];
  let hash = 0;
  for (let i = 0; i < project.length; i++) {
    hash = project.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CATEGORY_PALETTE[Math.abs(hash) % CATEGORY_PALETTE.length];
}

export function isOverdue(dueDate) {
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dueDate + 'T00:00:00') < today;
}

export function isToday(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  const d = new Date(dateStr + 'T00:00:00');
  return d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
}

export function formatUSD(amount) {
  if (amount == null) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function generateId() {
  return crypto.randomUUID();
}

export function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekDays(startDate, mode = 'week') {
  const monday = getMonday(startDate);
  const count = mode === 'workweek' ? 5 : 7;
  const days = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

// camelCase ↔ snake_case transforms
export function toCamel(obj) {
  if (Array.isArray(obj)) return obj.map(toCamel);
  if (obj === null || typeof obj !== 'object') return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = v;
  }
  return out;
}

export function toSnake(obj) {
  if (Array.isArray(obj)) return obj.map(toSnake);
  if (obj === null || typeof obj !== 'object') return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const snake = k.replace(/[A-Z]/g, c => '_' + c.toLowerCase());
    out[snake] = v;
  }
  return out;
}

// Sanitize row before sending to Supabase
export function sanitizeRow(row) {
  const cleaned = { ...row };
  // Remove undefined values
  for (const k of Object.keys(cleaned)) {
    if (cleaned[k] === undefined) delete cleaned[k];
  }
  return cleaned;
}
