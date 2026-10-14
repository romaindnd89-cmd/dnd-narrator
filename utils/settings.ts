import { readJSON, writeJSON, STORAGE_KEYS } from './storage';

export interface AppSettings {
  /** Génération d'images IA (payant chez Google : aucun quota gratuit). */
  aiImages: boolean;
  /** Bruitage automatique quand une narration de combat apparaît. */
  combatSounds: boolean;
}

const DEFAULTS: AppSettings = { aiImages: false, combatSounds: true };

export const getSettings = (): AppSettings => ({ ...DEFAULTS, ...readJSON<Partial<AppSettings>>(STORAGE_KEYS.settings, {}) });

export const saveSettings = (s: AppSettings) => writeJSON(STORAGE_KEYS.settings, s);
