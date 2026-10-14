// Accès sûr au localStorage : ne plante jamais (navigation privée, stockage plein…).

export const STORAGE_KEYS = {
  apiKey: 'gemini_api_key',
  session: 'dnd_session',
  supabaseUrl: 'dnd_supabase_url',
  supabaseKey: 'dnd_supabase_key',
  quota: 'dnd_quota_state',
  settings: 'dnd_settings',
  history: 'dnd_history',
} as const;

export const readString = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const writeString = (key: string, value: string | null): boolean => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.warn(`[storage] Impossible d'écrire "${key}"`, e);
    return false;
  }
};

export const readJSON = <T>(key: string, fallback: T): T => {
  const raw = readString(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const writeJSON = (key: string, value: unknown): boolean => writeString(key, JSON.stringify(value));

export const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
    : Math.random().toString(36).slice(2, 11);
