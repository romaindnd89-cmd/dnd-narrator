import React, { useState } from 'react';
import { CheckCircle, ExternalLink, Gauge, KeyRound, LogOut, RotateCcw, Save, Settings, SlidersHorizontal } from 'lucide-react';
import { DEMO_KEY, isPlausibleApiKey, looksLikeGoogleKey } from '../services/geminiService';
import { formatResetTime, resetQuotaPauses } from '../services/quota';
import { useQuota } from '../hooks/useQuota';
import { TEXT_MODELS } from '../config/models';
import { AppSettings } from '../utils/settings';
import { cx, Modal, SectionTitle, Toggle } from './ui';

interface Props {
  apiKey: string;
  onSaveKey: (key: string) => void;
  onLogout: () => void;
  settings: AppSettings;
  onSettingsChange: (s: AppSettings) => void;
  onClose: () => void;
}

const REASON_LABEL: Record<string, string> = {
  rate_minute: 'limite/minute',
  rate_day: 'quota du jour épuisé',
  model_unavailable: 'indisponible',
  overloaded: 'surchargé',
};

const SettingsModal: React.FC<Props> = ({ apiKey, onSaveKey, onLogout, settings, onSettingsChange, onClose }) => {
  const [tempKey, setTempKey] = useState('');
  const [saved, setSaved] = useState(false);
  const quota = useQuota();
  const isDemo = apiKey === DEMO_KEY;
  const keyOk = isPlausibleApiKey(tempKey);

  const save = () => {
    if (!keyOk) return;
    onSaveKey(tempKey.trim());
    setTempKey('');
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const pausedText = new Map<string, (typeof quota.paused)[number]>(quota.paused.map((p) => [p.model, p]));

  return (
    <Modal
      onClose={onClose}
      title={
        <>
          <Settings className="w-5 h-5" aria-hidden /> Configuration
        </>
      }
    >
      <div className="space-y-8">
        {/* ---- Clé ---- */}
        <section className="space-y-3">
          <SectionTitle icon={KeyRound}>Clé API Gemini</SectionTitle>
          <div className="bg-black/40 border border-gold-dark/20 p-3 rounded-lg flex items-center justify-between gap-2">
            <code className={cx('text-sm font-mono', isDemo ? 'text-amber-400' : 'text-emerald-400')}>
              {isDemo ? 'Mode démo (sans IA)' : `${apiKey.slice(0, 6)}…${apiKey.slice(-4)}`}
            </code>
            {!isDemo && <CheckCircle className="w-4 h-4 text-emerald-500" aria-label="Clé enregistrée" />}
          </div>
          <label htmlFor="newKey" className="block text-xs text-gray-400">
            {isDemo ? 'Ajouter ma clé' : 'Remplacer la clé'}
          </label>
          <input
            id="newKey"
            type="password"
            value={tempKey}
            onChange={(e) => setTempKey(e.target.value)}
            placeholder="AIza…"
            autoComplete="off"
            className="w-full bg-black border border-gold-dark/30 rounded-lg p-3 text-parchment font-mono outline-none focus:border-gold-antique"
          />
          {tempKey && (!keyOk || !looksLikeGoogleKey(tempKey)) && (
            <p className="text-xs text-amber-400">
              {keyOk ? 'Attention : une clé Gemini commence normalement par « AIza ».' : 'Clé trop courte ou avec des espaces.'}
            </p>
          )}
          <button
            type="button"
            onClick={save}
            disabled={!keyOk}
            className={cx(
              'w-full min-h-[48px] rounded-lg uppercase font-header font-bold text-xs tracking-widest flex items-center justify-center gap-2 transition-colors',
              keyOk ? 'bg-gold-dark text-black hover:bg-gold-antique' : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            )}
          >
            {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Clé enregistrée !' : 'Enregistrer'}
          </button>
          <p className="text-xs text-gray-400 leading-relaxed flex gap-2">
            <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden />
            <span>
              Clé gratuite sur{' '}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-400 underline">
                Google AI Studio
              </a>{' '}
              → « Create API key ». Elle reste dans ce navigateur uniquement.
            </span>
          </p>
        </section>

        {/* ---- Quota ---- */}
        {!isDemo && (
          <section className="space-y-3">
            <SectionTitle icon={Gauge}>Quota du jour</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-black/40 border border-gold-dark/20 rounded-lg p-3 text-center">
                <span className="block text-2xl font-header text-gold-antique">{quota.requestsToday}</span>
                <span className="text-[11px] text-gray-400 uppercase tracking-wider">requêtes aujourd'hui</span>
              </div>
              <div className="bg-black/40 border border-gold-dark/20 rounded-lg p-3 text-center">
                <span className="block text-2xl font-header text-gold-antique">{formatResetTime(quota.resetAt)}</span>
                <span className="text-[11px] text-gray-400 uppercase tracking-wider">recharge (heure locale)</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Chaque modèle a son propre quota gratuit. Quand l'un est épuisé, l'application passe au suivant automatiquement.
            </p>
            <ul className="space-y-1">
              {TEXT_MODELS.map((m) => {
                const p = pausedText.get(m);
                return (
                  <li key={m} className="flex items-center justify-between gap-2 text-xs bg-black/30 rounded px-3 py-2">
                    <code className="text-parchment/80 truncate">{m}</code>
                    {p ? (
                      <span className="text-amber-400 shrink-0">
                        {REASON_LABEL[p.reason] ?? 'en pause'} · {formatResetTime(p.until)}
                      </span>
                    ) : (
                      <span className="text-emerald-400 shrink-0">{quota.lastGoodModel.text === m ? 'actif' : 'prêt'}</span>
                    )}
                  </li>
                );
              })}
            </ul>
            {quota.paused.length > 0 && (
              <button
                type="button"
                onClick={resetQuotaPauses}
                className="w-full min-h-[44px] rounded-lg border border-gold-dark/40 text-gold-antique text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gold-dark/10"
              >
                <RotateCcw className="w-4 h-4" aria-hidden /> Réessayer tous les modèles
              </button>
            )}
          </section>
        )}

        {/* ---- Options ---- */}
        <section className="space-y-1">
          <SectionTitle icon={SlidersHorizontal}>Options</SectionTitle>
          <Toggle
            checked={settings.combatSounds}
            onChange={(v) => onSettingsChange({ ...settings, combatSounds: v })}
            label="Bruitage automatique des combats"
            hint="Joue un son d'arme quand une narration de combat apparaît."
          />
          <Toggle
            checked={settings.aiImages}
            onChange={(v) => onSettingsChange({ ...settings, aiImages: v })}
            label="Images IA pour les objets du coffre"
            hint={
              <>
                <strong className="text-amber-400">Payant :</strong> Google ne propose pas d'images dans le quota gratuit. À n'activer qu'avec un compte
                facturé.
              </>
            }
          />
        </section>

        <section className="border-t border-white/10 pt-6">
          <button
            type="button"
            onClick={onLogout}
            className="w-full min-h-[48px] border border-blood-red/40 text-red-400 hover:bg-blood-red/10 rounded-lg uppercase font-header font-bold text-xs tracking-widest flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" aria-hidden /> {isDemo ? 'Quitter le mode démo' : 'Oublier la clé'}
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">La clé sera effacée de ce navigateur.</p>
        </section>
      </div>
    </Modal>
  );
};

export default SettingsModal;
