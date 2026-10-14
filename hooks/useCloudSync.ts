import { useEffect, useRef, useState } from 'react';
import { SessionState } from '../types';
import { initSupabase, saveSessionToCloud } from '../services/supabaseService';
import { readString, writeString, STORAGE_KEYS } from '../utils/storage';

export interface CloudConfig {
  url: string;
  key: string;
}

/**
 * Synchronise la session vers Supabase (si configuré).
 * Avant, ce code vivait dans le Coffre MJ, monté deux fois sur mobile → double envoi.
 * Les envois sont regroupés (500 ms) pour ne pas spammer la base à chaque clic.
 */
export const useCloudSync = (session: SessionState) => {
  const [config, setConfig] = useState<CloudConfig | null>(() => {
    const url = readString(STORAGE_KEYS.supabaseUrl);
    const key = readString(STORAGE_KEYS.supabaseKey);
    return url && key ? { url, key } : null;
  });
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!config) return;
    initSupabase(config.url, config.key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => saveSessionToCloud(session), 500);
    return () => window.clearTimeout(timer.current);
  }, [session, config]);

  const connect = (c: CloudConfig) => {
    writeString(STORAGE_KEYS.supabaseUrl, c.url.trim());
    writeString(STORAGE_KEYS.supabaseKey, c.key.trim());
    setConfig({ url: c.url.trim(), key: c.key.trim() });
  };

  const disconnect = () => {
    writeString(STORAGE_KEYS.supabaseUrl, null);
    writeString(STORAGE_KEYS.supabaseKey, null);
    setConfig(null);
  };

  return { config, connect, disconnect };
};
