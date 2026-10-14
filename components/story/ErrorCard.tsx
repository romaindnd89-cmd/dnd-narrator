import React from 'react';
import { AlertTriangle, Hourglass, KeyRound, RefreshCw, Settings, Skull, WifiOff } from 'lucide-react';
import { ErrorKind, formatResetTime } from '../../services/quota';
import { formatDuration, useCountdown } from '../../hooks/useQuota';
import { cx, IconButton } from '../ui';

export interface DisplayError {
  kind: ErrorKind;
  message: string;
  /** Timestamp (ms) à partir duquel on peut réessayer. */
  retryAt?: number;
}

const COPY: Partial<Record<ErrorKind, { title: string; text: string }>> = {
  rate_minute: {
    title: 'Le mana se recharge',
    text: "Google limite le nombre de requêtes par minute. L'application a déjà essayé les autres modèles disponibles : il suffit d'attendre un peu.",
  },
  rate_day: {
    title: 'Mana du jour épuisé',
    text: "Le quota gratuit de la journée est consommé sur tous les modèles. Il se recharge chaque jour à minuit, heure de Californie.",
  },
  invalid_key: {
    title: 'Clé runique refusée',
    text: 'Google refuse cette clé API. Vérifiez qu’elle est complète (elle commence par « AIza ») ou créez-en une nouvelle.',
  },
  no_key: { title: 'Aucune clé API', text: 'Ajoutez votre clé Gemini dans Configuration pour invoquer le narrateur.' },
  network: { title: 'Liaison rompue', text: 'Impossible de joindre Google. Vérifiez votre connexion internet.' },
  overloaded: { title: 'Les esprits sont débordés', text: 'Les serveurs de Google sont surchargés. Réessayez dans quelques instants.' },
};

export const ErrorCard: React.FC<{
  error: DisplayError;
  onRetry: () => void;
  onOpenSettings: () => void;
  onClose: () => void;
}> = ({ error, onRetry, onOpenSettings, onClose }) => {
  const left = useCountdown(error.retryAt ?? null);
  const isQuota = error.kind === 'rate_minute' || error.kind === 'rate_day';
  const isKey = error.kind === 'invalid_key' || error.kind === 'no_key';
  const copy = COPY[error.kind] ?? { title: "L'invocation a échoué", text: error.message };
  const Icon = isQuota ? Hourglass : isKey ? KeyRound : error.kind === 'network' ? WifiOff : Skull;
  const waiting = left > 0;

  return (
    <article
      className={cx(
        'w-full bg-darker-metal border-2 rounded-2xl overflow-hidden animate-fade-in',
        isQuota ? 'border-amber-600/50' : 'border-blood-red/50'
      )}
      role="alert"
    >
      <header className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/80">
        <span className={cx('font-header text-xs uppercase tracking-[0.25em] flex items-center gap-2', isQuota ? 'text-amber-500' : 'text-red-400')}>
          <AlertTriangle className="w-4 h-4" aria-hidden /> {isQuota ? 'Quota' : 'Erreur'}
        </span>
        <IconButton label="Fermer" onClick={onClose}>
          <span aria-hidden className="text-xl leading-none">×</span>
        </IconButton>
      </header>

      <div className="p-6 md:p-12 flex flex-col items-center text-center gap-5">
        <Icon className={cx('w-14 h-14', isQuota ? 'text-amber-500' : 'text-blood-red')} aria-hidden />
        <h3 className={cx('text-xl md:text-2xl font-header', isQuota ? 'text-amber-400' : 'text-red-400')}>{copy.title}</h3>
        <p className="text-parchment/85 text-base max-w-lg leading-relaxed">{copy.text}</p>

        {error.kind === 'unknown' || error.kind === 'blocked' || error.kind === 'model_unavailable' ? (
          <p className="text-xs text-gray-400 max-w-lg bg-black/40 rounded p-3 break-words">{error.message}</p>
        ) : null}

        {isQuota && error.retryAt && (
          <div className="bg-amber-900/20 border border-amber-600/30 rounded-xl px-5 py-3 text-amber-300">
            {waiting ? (
              <>
                <span className="block text-[11px] uppercase tracking-widest text-amber-500 mb-1">Disponible dans</span>
                <span className="font-header text-2xl" aria-live="polite">
                  {formatDuration(left)}
                </span>
                {error.kind === 'rate_day' && (
                  <span className="block text-xs mt-1 text-amber-500/80">vers {formatResetTime(new Date(error.retryAt))} (heure locale)</span>
                )}
              </>
            ) : (
              <span className="font-header">Le mana est rechargé !</span>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          {!isKey && (
            <button
              type="button"
              onClick={onRetry}
              disabled={waiting && error.kind === 'rate_day'}
              className="flex-1 min-h-[48px] rounded-lg bg-blood-dark hover:bg-blood-red disabled:opacity-40 disabled:hover:bg-blood-dark text-gold-antique font-header text-xs uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" aria-hidden /> Réessayer
            </button>
          )}
          {(isKey || isQuota || error.kind === 'model_unavailable') && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex-1 min-h-[48px] rounded-lg border border-gold-dark/50 text-gold-antique hover:bg-gold-dark/10 font-header text-xs uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4" aria-hidden /> {isKey ? 'Changer la clé' : 'État du quota'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
