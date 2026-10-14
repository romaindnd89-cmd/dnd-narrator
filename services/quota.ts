// ==================================================================================
// Gestion du quota Gemini
//  - comprend les erreurs de Google (quota minute / quota jour / clé invalide…)
//  - met un modèle « en pause » quand son quota est épuisé, et passe au suivant
//  - se souvient des pauses même après un rechargement de la page
//  - compte les requêtes du jour (le quota gratuit se réinitialise à minuit, heure du Pacifique)
// ==================================================================================

import { readJSON, writeJSON, STORAGE_KEYS } from '../utils/storage';

export type ErrorKind =
  | 'rate_minute' // trop de requêtes en peu de temps → attendre quelques secondes
  | 'rate_day' // quota du jour épuisé → attendre la réinitialisation
  | 'invalid_key' // clé refusée par Google
  | 'model_unavailable' // modèle inexistant / retiré / non autorisé pour cette clé
  | 'overloaded' // serveurs Google saturés (503/500)
  | 'blocked' // contenu bloqué par les filtres de sécurité
  | 'network' // pas de connexion
  | 'no_key'
  | 'unknown';

export class NarratorError extends Error {
  kind: ErrorKind;
  /** Délai conseillé avant de réessayer, en secondes. */
  retryAfterSec?: number;
  constructor(kind: ErrorKind, message: string, retryAfterSec?: number) {
    super(message);
    this.kind = kind;
    this.retryAfterSec = retryAfterSec;
  }
}

// ---------- Heure du Pacifique (réinitialisation du quota gratuit) ----------

const pacificParts = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { y: get('year'), m: get('month'), d: get('day'), h: get('hour') % 24, min: get('minute'), s: get('second') };
};

/** Clé du jour du quota, ex. "2026-10-14" (jour Pacifique). */
export const quotaDayKey = (date = new Date()): string => {
  const p = pacificParts(date);
  return `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
};

/** Date/heure de la prochaine réinitialisation du quota journalier. */
export const nextQuotaReset = (now = new Date()): Date => {
  const p = pacificParts(now);
  const secondsLeft = 24 * 3600 - (p.h * 3600 + p.min * 60 + p.s);
  return new Date(now.getTime() + secondsLeft * 1000);
};

export const formatResetTime = (date: Date): string =>
  date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

// ---------- État persistant ----------

interface QuotaState {
  day: string;
  requestsToday: number;
  /** modèle → timestamp (ms) jusqu'auquel on ne l'utilise plus */
  pausedUntil: Record<string, number>;
  /** modèle → raison de la pause (pour l'affichage) */
  pauseReason: Record<string, ErrorKind>;
  lastGoodModel: Record<string, string>; // famille (text/tts/image) → dernier modèle qui a marché
}

const emptyState = (): QuotaState => ({
  day: quotaDayKey(),
  requestsToday: 0,
  pausedUntil: {},
  pauseReason: {},
  lastGoodModel: {},
});

const load = (): QuotaState => {
  const s = readJSON<QuotaState>(STORAGE_KEYS.quota, emptyState());
  const fresh = { ...emptyState(), ...s };
  if (fresh.day !== quotaDayKey()) {
    // Nouveau jour : compteur à zéro, on oublie les pauses "jour".
    fresh.day = quotaDayKey();
    fresh.requestsToday = 0;
    for (const [model, reason] of Object.entries(fresh.pauseReason)) {
      if (reason === 'rate_day') {
        delete fresh.pausedUntil[model];
        delete fresh.pauseReason[model];
      }
    }
  }
  return fresh;
};

const save = (s: QuotaState) => {
  writeJSON(STORAGE_KEYS.quota, s);
  listeners.forEach((l) => l());
};

const listeners = new Set<() => void>();
export const subscribeQuota = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

export const getQuotaSnapshot = () => {
  const s = load();
  const now = Date.now();
  return {
    requestsToday: s.requestsToday,
    resetAt: nextQuotaReset(),
    paused: Object.entries(s.pausedUntil)
      .filter(([, until]) => until > now)
      .map(([model, until]) => ({ model, until: new Date(until), reason: s.pauseReason[model] })),
    lastGoodModel: s.lastGoodModel,
  };
};

export const resetQuotaPauses = () => {
  const s = load();
  s.pausedUntil = {};
  s.pauseReason = {};
  save(s);
};

const pauseModel = (model: string, kind: ErrorKind, seconds: number) => {
  const s = load();
  s.pausedUntil[model] = Date.now() + seconds * 1000;
  s.pauseReason[model] = kind;
  save(s);
};

const recordSuccess = (family: string, model: string) => {
  const s = load();
  s.requestsToday += 1;
  s.lastGoodModel[family] = model;
  delete s.pausedUntil[model];
  delete s.pauseReason[model];
  save(s);
};

// ---------- Lecture des erreurs Google ----------

const errorText = (err: unknown): string => {
  if (!err) return '';
  if (typeof err === 'string') return err;
  const e = err as { message?: string; status?: number };
  return `${e.status ?? ''} ${e.message ?? ''} ${(() => {
    try {
      return JSON.stringify(err);
    } catch {
      return '';
    }
  })()}`;
};

export const classifyError = (err: unknown): NarratorError => {
  if (err instanceof NarratorError) return err;
  const text = errorText(err);
  const lower = text.toLowerCase();
  const status = (err as { status?: number })?.status;

  // Délai conseillé par Google : "retryDelay": "36s" ou "Please retry in 36.2s"
  const delayMatch = text.match(/retryDelay\\?"?\s*:\s*\\?"(\d+(?:\.\d+)?)s/) || text.match(/retry in (\d+(?:\.\d+)?)\s*s/i);
  const retryAfter = delayMatch ? Math.ceil(Number(delayMatch[1])) : undefined;

  if (status === 429 || lower.includes('resource_exhausted') || lower.includes('quota') || /\b429\b/.test(text)) {
    const isDaily = /perday|per_day|requests per day|daily/i.test(text);
    if (isDaily) {
      const secs = Math.max(60, Math.round((nextQuotaReset().getTime() - Date.now()) / 1000));
      return new NarratorError('rate_day', 'Quota du jour épuisé pour ce modèle.', secs);
    }
    return new NarratorError('rate_minute', 'Trop de requêtes en peu de temps.', retryAfter ?? 30);
  }
  if (lower.includes('api_key_invalid') || lower.includes('api key not valid') || lower.includes('api key expired')) {
    return new NarratorError('invalid_key', 'Clé API refusée par Google.');
  }
  if (status === 404 || lower.includes('not_found') || lower.includes('is not found') || lower.includes('not supported for generatecontent')) {
    return new NarratorError('model_unavailable', 'Modèle indisponible.');
  }
  if (status === 403 || lower.includes('permission_denied')) {
    // Souvent : modèle réservé aux comptes payants, ou API non activée pour la clé.
    if (lower.includes('api has not been used') || lower.includes('disabled')) {
      return new NarratorError('invalid_key', "L'API Gemini n'est pas activée pour cette clé.");
    }
    return new NarratorError('model_unavailable', 'Modèle non autorisé pour cette clé.');
  }
  if (status === 400 && (lower.includes('free tier') || lower.includes('billing'))) {
    return new NarratorError('model_unavailable', 'Modèle réservé aux comptes payants.');
  }
  if (status === 503 || status === 500 || lower.includes('overloaded') || lower.includes('unavailable')) {
    return new NarratorError('overloaded', 'Les serveurs de Google sont surchargés.', 10);
  }
  if (lower.includes('safety') || lower.includes('blocked')) {
    return new NarratorError('blocked', 'Le contenu a été bloqué par les filtres de Google. Reformulez la demande.');
  }
  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('network')) {
    return new NarratorError('network', 'Connexion impossible. Vérifiez votre accès internet.');
  }
  return new NarratorError('unknown', (err as Error)?.message?.slice(0, 300) || "L'invocation a échoué.");
};

// ---------- Appel avec bascule automatique de modèle ----------

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Essaie chaque modèle de la liste jusqu'à ce qu'un réponde.
 * Les modèles en pause (quota épuisé) sont sautés.
 */
export async function callWithFallback<T>(
  family: 'text' | 'tts' | 'image',
  models: readonly string[],
  call: (model: string) => Promise<T>
): Promise<{ result: T; model: string }> {
  const state = load();
  const now = Date.now();

  // On commence par le dernier modèle qui a marché (souvent le plus rapide à répondre OK).
  const ordered = [...models];
  const last = state.lastGoodModel[family];
  if (last && ordered.includes(last)) {
    ordered.splice(ordered.indexOf(last), 1);
    ordered.unshift(last);
  }
  const available = ordered.filter((m) => !(state.pausedUntil[m] > now));

  if (available.length === 0) {
    // Tous en pause : on indique quand le premier redevient disponible.
    const soonest = Math.min(...ordered.map((m) => state.pausedUntil[m]));
    const secs = Math.max(1, Math.ceil((soonest - now) / 1000));
    const allDaily = ordered.every((m) => state.pauseReason[m] === 'rate_day' || state.pauseReason[m] === 'model_unavailable');
    throw new NarratorError(allDaily ? 'rate_day' : 'rate_minute', 'Tous les modèles sont en pause.', secs);
  }

  let lastError: NarratorError | null = null;
  let minRetry = Infinity;

  for (const model of available) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await call(model);
        recordSuccess(family, model);
        return { result, model };
      } catch (raw) {
        const err = classifyError(raw);
        lastError = err;
        if (err.kind === 'invalid_key' || err.kind === 'blocked' || err.kind === 'network') throw err;

        if (err.kind === 'overloaded' && attempt === 0) {
          await sleep(1200); // une seconde chance sur le même modèle
          continue;
        }
        if (err.kind === 'rate_minute') pauseModel(model, err.kind, err.retryAfterSec ?? 30);
        else if (err.kind === 'rate_day') pauseModel(model, err.kind, err.retryAfterSec ?? 3600);
        else if (err.kind === 'model_unavailable') pauseModel(model, err.kind, 24 * 3600);
        else if (err.kind === 'overloaded') pauseModel(model, err.kind, 60);
        if (err.retryAfterSec) minRetry = Math.min(minRetry, err.retryAfterSec);
        break; // modèle suivant
      }
    }
  }

  // Aucun modèle n'a répondu.
  if (lastError && (lastError.kind === 'rate_minute' || lastError.kind === 'rate_day')) {
    const snap = load();
    const allDaily = models.every((m) => snap.pauseReason[m] === 'rate_day' || snap.pauseReason[m] === 'model_unavailable');
    if (allDaily) {
      const secs = Math.round((nextQuotaReset().getTime() - Date.now()) / 1000);
      throw new NarratorError('rate_day', 'Quota du jour épuisé sur tous les modèles.', secs);
    }
    throw new NarratorError('rate_minute', 'Quota temporairement épuisé.', Number.isFinite(minRetry) ? minRetry : 30);
  }
  if (lastError?.kind === 'model_unavailable') {
    throw new NarratorError(
      'model_unavailable',
      "Aucun modèle Gemini n'est accessible avec cette clé. Vérifiez la clé ou mettez à jour la liste dans config/models.ts."
    );
  }
  throw lastError ?? new NarratorError('unknown', "L'invocation a échoué.");
}
