import React, { useState } from 'react';
import { Check, CloudLightning, Copy, Database, HelpCircle, Key, X } from 'lucide-react';
import { CloudConfig } from '../../hooks/useCloudSync';

const SQL = `-- 1. Crée la table si elle n'existe pas
create table if not exists sessions (
  id text primary key,
  data jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Désactive la sécurité RLS
-- (corrige l'erreur 42501 « violates row-level security policy »)
alter table sessions disable row level security;

-- 3. Active le temps réel (ignorez l'erreur si c'est déjà fait)
alter publication supabase_realtime add table sessions;`;

interface Props {
  config: CloudConfig | null;
  onConnect: (c: CloudConfig) => void;
  onDisconnect: () => void;
  onClose: () => void;
}

const inputCls = 'w-full bg-black border border-gold-dark/30 rounded-lg p-3 text-parchment outline-none focus:border-gold-antique font-mono';

const CloudPanel: React.FC<Props> = ({ config, onConnect, onDisconnect, onClose }) => {
  const [url, setUrl] = useState(config?.url ?? '');
  const [key, setKey] = useState(config?.key ?? '');
  const [tuto, setTuto] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const urlOk = /^https:\/\/.+\.supabase\.co\/?$/.test(url.trim());

  const copySql = async () => {
    try {
      await navigator.clipboard.writeText(SQL);
      setSqlCopied(true);
      setTimeout(() => setSqlCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="absolute inset-0 bg-darker-metal z-50 flex flex-col animate-fade-in">
      <div className="flex items-center justify-between pl-5 pr-2 py-1 border-b border-gold-dark/20 shrink-0">
        <h4 className="text-gold-antique font-header text-sm uppercase tracking-widest flex items-center gap-2">
          <CloudLightning className="w-4 h-4" aria-hidden /> Synchro en direct
        </h4>
        <button type="button" onClick={onClose} aria-label="Fermer" className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {!tuto ? (
          <>
            <p className="text-sm text-gray-300 leading-relaxed bg-blue-900/15 border border-blue-500/25 p-3 rounded-lg">
              Avec Supabase (gratuit), les joueurs voient en direct leur inventaire et leur or sur leur téléphone.
            </p>
            <div>
              <label htmlFor="sbUrl" className="text-xs uppercase font-bold text-gray-400 flex items-center gap-2 mb-1.5">
                <Database className="w-3.5 h-3.5" /> URL du projet
              </label>
              <input id="sbUrl" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://xyz.supabase.co" className={inputCls} />
              {url && !urlOk && <p className="text-xs text-amber-400 mt-1">L'URL ressemble à https://xxxx.supabase.co</p>}
            </div>
            <div>
              <label htmlFor="sbKey" className="text-xs uppercase font-bold text-gray-400 flex items-center gap-2 mb-1.5">
                <Key className="w-3.5 h-3.5" /> Clé publique (anon)
              </label>
              <input id="sbKey" type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="eyJhbGciOi…" className={inputCls} />
            </div>
            <button
              type="button"
              disabled={!urlOk || key.trim().length < 20}
              onClick={() => {
                onConnect({ url, key });
                onClose();
              }}
              className="w-full min-h-[48px] bg-emerald-900/30 border border-emerald-500/50 text-emerald-300 font-header text-xs rounded-lg uppercase tracking-widest hover:bg-emerald-900/50 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <CloudLightning className="w-4 h-4" /> Activer la synchro
            </button>
            {config && (
              <button
                type="button"
                onClick={() => {
                  onDisconnect();
                  onClose();
                }}
                className="w-full min-h-[44px] bg-red-900/20 text-red-300 font-header text-xs rounded-lg uppercase tracking-widest hover:bg-red-900/40"
              >
                Déconnecter
              </button>
            )}
            <button type="button" onClick={() => setTuto(true)} className="w-full min-h-[44px] flex items-center justify-center gap-2 text-gold-antique text-xs uppercase font-bold tracking-widest">
              <HelpCircle className="w-4 h-4" /> Comment obtenir ces clés ?
            </button>
          </>
        ) : (
          <>
            <ol className="space-y-5 text-sm text-gray-300">
              <li>
                <strong className="text-white block mb-1">1. Créer un projet</strong>
                Sur{' '}
                <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-blue-400 underline">
                  supabase.com
                </a>
                , créez un compte et un projet gratuit.
              </li>
              <li>
                <strong className="text-white block mb-1">2. Créer la table</strong>
                Onglet <strong>SQL Editor</strong>, collez ce code puis cliquez sur <strong>Run</strong>.
                <div className="mt-2 bg-black border border-gray-700 rounded-lg p-3 relative">
                  <pre className="text-[11px] font-mono text-green-400 whitespace-pre-wrap pr-10">{SQL}</pre>
                  <button type="button" onClick={copySql} aria-label="Copier le SQL" className="absolute top-1 right-1 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded text-white">
                    {sqlCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </li>
              <li>
                <strong className="text-white block mb-1">3. Récupérer les clés</strong>
                <strong>Project Settings › API</strong> : copiez l'<strong>URL</strong> et la clé <strong>anon public</strong>.
              </li>
            </ol>
            <p className="text-xs text-amber-400/90 leading-relaxed">
              Bon à savoir : sans RLS, toute personne qui a le lien de partage peut lire la session. N'y mettez rien de privé.
            </p>
            <button type="button" onClick={() => setTuto(false)} className="w-full min-h-[48px] bg-gold-dark/20 border border-gold-dark/50 text-gold-antique font-header text-xs rounded-lg uppercase tracking-widest">
              J'ai compris, retour
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CloudPanel;
