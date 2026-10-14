import { useEffect, useState } from 'react';
import { getQuotaSnapshot, subscribeQuota } from '../services/quota';

/** État du quota, rafraîchi à chaque requête et toutes les 30 s. */
export const useQuota = () => {
  const [snap, setSnap] = useState(getQuotaSnapshot);
  useEffect(() => {
    const refresh = () => setSnap(getQuotaSnapshot());
    const unsub = subscribeQuota(refresh);
    const id = window.setInterval(refresh, 30_000);
    return () => {
      unsub();
      window.clearInterval(id);
    };
  }, []);
  return snap;
};

/** Compte à rebours en secondes jusqu'à une date. */
export const useCountdown = (until: number | null) => {
  const [left, setLeft] = useState(() => (until ? Math.max(0, Math.ceil((until - Date.now()) / 1000)) : 0));
  useEffect(() => {
    if (!until) return setLeft(0);
    const tick = () => setLeft(Math.max(0, Math.ceil((until - Date.now()) / 1000)));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [until]);
  return left;
};

export const formatDuration = (secs: number) => {
  if (secs >= 3600) return `${Math.floor(secs / 3600)} h ${String(Math.floor((secs % 3600) / 60)).padStart(2, '0')}`;
  if (secs >= 60) return `${Math.floor(secs / 60)} min ${String(secs % 60).padStart(2, '0')}`;
  return `${secs} s`;
};
