// Petits composants réutilisés partout : évitent de recopier les mêmes classes 20 fois.

import React, { useEffect, useState } from 'react';
import { Check, ChevronDown, ChevronRight, LucideIcon, UserPlus } from 'lucide-react';
import { Player } from '../types';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

// ---------- Bouton icône (zone tactile 44px) ----------

export const IconButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; active?: boolean; tone?: 'gold' | 'red' | 'muted' }
> = ({ label, active, tone = 'muted', className, children, ...rest }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    className={cx(
      'inline-flex items-center justify-center w-11 h-11 rounded-full border transition-colors active:scale-95 disabled:opacity-40',
      active
        ? 'bg-blood-red text-white border-blood-red'
        : tone === 'gold'
          ? 'text-gold-antique border-gold-dark/40 hover:bg-gold-dark/15'
          : tone === 'red'
            ? 'text-blood-red border-blood-red/40 hover:bg-blood-red/10'
            : 'text-gray-400 border-white/10 hover:text-white hover:bg-white/5',
      className
    )}
    {...rest}
  >
    {children}
  </button>
);

// ---------- Libellé de champ ----------

export const FieldLabel: React.FC<{ icon?: LucideIcon; children: React.ReactNode; htmlFor?: string }> = ({ icon: Icon, children, htmlFor }) => (
  <label htmlFor={htmlFor} className="flex items-center gap-2 text-gold-antique font-header text-[11px] uppercase tracking-widest mb-1.5">
    {Icon && <Icon className="w-3.5 h-3.5 text-blood-red" aria-hidden />}
    {children}
  </label>
);

// ---------- Liste déroulante ----------

export function SelectField<T extends string>({
  id,
  label,
  icon,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  icon?: LucideIcon;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="animate-fade-in">
      <FieldLabel icon={icon} htmlFor={id}>
        {label}
      </FieldLabel>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="w-full bg-dark-metal text-parchment font-body border border-gold-dark/30 rounded-lg pl-3 pr-9 py-2.5 outline-none appearance-none cursor-pointer focus:border-gold-antique transition-colors"
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-dark pointer-events-none" aria-hidden />
      </div>
    </div>
  );
}

// ---------- Section titrée dans une carte ----------

export const SectionTitle: React.FC<{ icon?: LucideIcon; children: React.ReactNode; tone?: string }> = ({
  icon: Icon,
  children,
  tone = 'text-gold-antique',
}) => (
  <h3 className={cx('flex items-center gap-2 font-header text-xs uppercase tracking-[0.2em] mb-2', tone)}>
    {Icon && <Icon className="w-4 h-4" aria-hidden />}
    {children}
  </h3>
);

/** Encadré « À lire aux joueurs ». */
export const ReadAloud: React.FC<{ children: React.ReactNode; label?: string }> = ({ children, label = 'À lire aux joueurs' }) => (
  <div className="relative bg-gold-antique/5 border border-gold-antique/30 rounded-2xl px-5 pt-6 pb-5">
    <span className="absolute -top-3 left-4 px-3 py-0.5 bg-gold-antique text-black font-header text-[10px] font-bold uppercase tracking-widest rounded-full">
      {label}
    </span>
    <div className="text-parchment text-lg md:text-xl font-body italic leading-relaxed whitespace-pre-line">{children}</div>
  </div>
);

// ---------- Choix du joueur qui reçoit un objet ----------

export const PlayerPicker: React.FC<{
  players: Player[];
  label: string;
  icon: LucideIcon;
  tone?: 'gold' | 'red' | 'cyan';
  onPick: (playerId: string) => void;
}> = ({ players, label, icon: Icon, tone = 'gold', onPick }) => {
  const [open, setOpen] = useState(false);
  const [given, setGiven] = useState<string | null>(null);

  const btn = {
    gold: 'bg-gold-dark hover:bg-gold-antique text-black',
    red: 'bg-blood-dark hover:bg-blood-red text-white',
    cyan: 'bg-cyan-900 hover:bg-cyan-700 text-white',
  }[tone];

  if (given) {
    return (
      <p className="flex items-center justify-center gap-2 text-emerald-400 font-header text-xs uppercase tracking-widest py-3" role="status">
        <Check className="w-4 h-4" /> Donné à {given}
      </p>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={cx('w-full min-h-[48px] px-6 rounded-lg font-header text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 shadow-lg transition-colors', btn)}
      >
        <Icon className="w-4 h-4" aria-hidden /> {label}
      </button>
      {open && (
        <div className="mt-2 bg-black border border-gold-dark/40 rounded-xl overflow-hidden animate-fade-in">
          {players.length === 0 ? (
            <p className="p-4 text-sm text-gray-400 text-center flex flex-col items-center gap-2">
              <UserPlus className="w-5 h-5 text-gold-dark" />
              Aucun joueur. Ajoutez des héros dans le Coffre MJ.
            </p>
          ) : (
            players.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onPick(p.id);
                  setGiven(p.name);
                  setOpen(false);
                }}
                className="w-full min-h-[48px] px-4 flex items-center justify-between text-parchment hover:bg-gold-antique/10 border-b border-white/5 last:border-0 text-left"
              >
                <span className="font-header text-sm">{p.name}</span>
                <ChevronRight className="w-4 h-4 text-gold-dark" aria-hidden />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ---------- Modale plein écran sur mobile, centrée sur ordinateur ----------

export const Modal: React.FC<{ onClose: () => void; title: React.ReactNode; children: React.ReactNode; wide?: boolean }> = ({ onClose, title, children, wide }) => {
  // Échap ferme la fenêtre, où que soit le focus ; on bloque aussi le défilement de la page derrière.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
  <div
    className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-sm flex md:items-center md:justify-center md:p-4 animate-fade-in"
    role="dialog"
    aria-modal="true"
    onClick={onClose}
  >
    <div
      className={cx(
        'w-full h-full md:h-auto md:max-h-[90vh] bg-darker-metal md:border-2 border-gold-dark/50 md:rounded-2xl shadow-2xl flex flex-col',
        wide ? 'md:max-w-4xl' : 'md:max-w-md'
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="flex items-center justify-between gap-4 px-5 py-3 border-b border-gold-dark/30 bg-black/60 shrink-0"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <h2 className="font-header text-base md:text-lg text-gold-antique uppercase tracking-widest flex items-center gap-2">{title}</h2>
        <IconButton label="Fermer" onClick={onClose} autoFocus>
          <span aria-hidden className="text-xl leading-none">×</span>
        </IconButton>
      </div>
      <div className="flex-1 overflow-y-auto p-5 md:p-6 pb-safe">{children}</div>
    </div>
  </div>
  );
};

export const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; hint?: React.ReactNode }> = ({
  checked,
  onChange,
  label,
  hint,
}) => (
  <label className="flex items-start gap-3 cursor-pointer py-2">
    <span className="relative inline-flex shrink-0 mt-0.5">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="w-11 h-6 rounded-full bg-gray-700 peer-checked:bg-gold-dark transition-colors" />
      <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-parchment transition-transform peer-checked:translate-x-5" />
    </span>
    <span>
      <span className="block text-sm text-parchment">{label}</span>
      {hint && <span className="block text-xs text-gray-400 mt-0.5 leading-relaxed">{hint}</span>}
    </span>
  </label>
);
