import React, { useEffect, useMemo, useState } from 'react';
import { Briefcase, CloudLightning, CloudOff, Loader2, QrCode, RotateCcw, UserPlus, X } from 'lucide-react';
import { Currency, SessionState } from '../types';
import { CloudConfig } from '../hooks/useCloudSync';
import { generateItemImage } from '../services/geminiService';
import { changeCurrency, createItem, createPlayer, giveItem, updatePlayer } from '../utils/session';
import PlayerCard from './vault/PlayerCard';
import CloudPanel from './vault/CloudPanel';
import { cx } from './ui';

/** Encodage base64 « URL-safe » compatible avec les accents. */
const utoa = (str: string) =>
  btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

interface VirtualVaultProps {
  session: SessionState;
  onUpdateSession: (session: SessionState) => void;
  onReset: () => void;
  cloud: { config: CloudConfig | null; connect: (c: CloudConfig) => void; disconnect: () => void };
  aiImages: boolean;
}

const VirtualVault: React.FC<VirtualVaultProps> = ({ session, onUpdateSession, onReset, cloud, aiImages }) => {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [panel, setPanel] = useState<'share' | 'cloud' | null>(null);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemPenalty, setItemPenalty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const shareLink = useMemo(() => {
    const base = window.location.origin + window.location.pathname.replace(/\/?$/, '/');
    const data = cloud.config
      ? { id: session.id, name: session.name, cloudConfig: cloud.config }
      : { ...session, players: session.players.map((p) => ({ ...p, inventory: p.inventory?.map((i) => ({ ...i, imageUrl: undefined })) })) };
    return `${base}#/view/${utoa(JSON.stringify(data))}`;
  }, [session, cloud.config]);

  useEffect(() => {
    if (panel !== 'share') return;
    let cancelled = false;
    // qrcode n'est chargé que si on ouvre le partage (allège le démarrage).
    import('qrcode')
      .then((QR) => QR.toDataURL(shareLink, { width: 280, margin: 2 }))
      .then((url) => !cancelled && setQr(url))
      .catch(() => !cancelled && setQr(null));
    return () => {
      cancelled = true;
    };
  }, [panel, shareLink]);

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    onUpdateSession({ ...session, players: [...session.players, createPlayer(newPlayerName)] });
    setNewPlayerName('');
  };

  const addItem = async () => {
    if (!addingTo || !itemName.trim()) return;
    setBusy(true);
    const imageUrl = aiImages ? await generateItemImage(itemName, itemDesc) : undefined;
    const desc = itemDesc.trim() || (itemPenalty ? 'Effet négatif ou objet maudit.' : "Objet d'inventaire.");
    onUpdateSession(giveItem(session, addingTo, createItem(itemName, desc, { imageUrl, isPenalty: itemPenalty })));
    setAddingTo(null);
    setItemName('');
    setItemDesc('');
    setItemPenalty(false);
    setBusy(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  if (!session.isActive) {
    return (
      <div className="h-full min-h-[240px] flex flex-col bg-darker-metal border-2 border-gold-dark/20 rounded-2xl p-8 text-center items-center justify-center gap-4">
        <Briefcase className="w-14 h-14 text-gold-antique" aria-hidden />
        <p className="text-sm text-gray-400">Gérez l'or, l'inventaire et les états de vos joueurs.</p>
        <button
          type="button"
          onClick={() => onUpdateSession({ ...session, isActive: true })}
          className="w-full min-h-[52px] bg-blood-dark text-gold-antique font-header uppercase tracking-widest border border-gold-dark/50 rounded-xl shadow-glow-red"
        >
          Ouvrir le coffre
        </button>
      </div>
    );
  }

  const target = session.players.find((p) => p.id === addingTo);

  return (
    <div className="h-full flex flex-col bg-darker-metal border-2 border-gold-dark/30 rounded-2xl overflow-hidden shadow-2xl relative">
      <div className="pl-4 pr-1 py-1 border-b border-gold-dark/30 bg-black/60 flex items-center justify-between">
        <h3 className="font-header text-sm text-gold-antique uppercase flex items-center gap-2">
          <Briefcase className="w-4 h-4" aria-hidden /> Coffre MJ
        </h3>
        <div className="flex">
          <button
            type="button"
            onClick={() => setPanel('cloud')}
            aria-label={cloud.config ? 'Synchro activée' : 'Activer la synchro'}
            className={cx('w-11 h-11 flex items-center justify-center', cloud.config ? 'text-emerald-400' : 'text-gray-500 hover:text-white')}
          >
            {cloud.config ? <CloudLightning className="w-5 h-5" /> : <CloudOff className="w-5 h-5" />}
          </button>
          <button type="button" onClick={() => setPanel('share')} aria-label="Partager aux joueurs" className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-white">
            <QrCode className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirmReset) {
                onReset();
                setConfirmReset(false);
              } else {
                setConfirmReset(true);
                setTimeout(() => setConfirmReset(false), 3000);
              }
            }}
            aria-label={confirmReset ? 'Confirmer : vider le coffre' : 'Vider le coffre'}
            className={cx('h-11 px-2 flex items-center justify-center gap-1 text-xs', confirmReset ? 'text-red-400 font-bold' : 'text-gray-500 hover:text-red-400')}
          >
            <RotateCcw className="w-4 h-4" />
            {confirmReset && 'Tout vider ?'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar">
        {session.players.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">Ajoutez vos héros ci-dessous pour leur distribuer butin et pièces.</p>
        )}
        {session.players.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            onAddItem={() => setAddingTo(player.id)}
            onDelete={() => onUpdateSession({ ...session, players: session.players.filter((p) => p.id !== player.id) })}
            onCurrency={(type: keyof Currency, amount) =>
              onUpdateSession(updatePlayer(session, player.id, (p) => ({ ...p, currency: changeCurrency(p.currency, type, amount) })))
            }
            onItemQty={(itemId, delta) =>
              onUpdateSession(
                updatePlayer(session, player.id, (p) => ({
                  ...p,
                  inventory: (p.inventory ?? [])
                    .map((it) => (it.id === itemId ? { ...it, quantity: Math.max(0, it.quantity + delta) } : it))
                    .filter((it) => it.quantity > 0),
                }))
              )
            }
            onRemoveCondition={(cid) =>
              onUpdateSession(updatePlayer(session, player.id, (p) => ({ ...p, conditions: (p.conditions ?? []).filter((c) => c.id !== cid) })))
            }
          />
        ))}
      </div>

      <form
        className="p-3 border-t border-gold-dark/20 bg-black/60 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          addPlayer();
        }}
      >
        <input
          type="text"
          placeholder="Nom du héros…"
          aria-label="Nom du héros"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          className="flex-1 min-w-0 bg-black/40 border border-gold-dark/30 rounded-lg px-3 py-2 text-parchment outline-none focus:border-gold-antique"
        />
        <button type="submit" aria-label="Ajouter le héros" className="w-12 min-h-[44px] bg-gold-dark/20 text-gold-antique rounded-lg hover:bg-gold-dark/40 flex items-center justify-center">
          <UserPlus className="w-5 h-5" />
        </button>
      </form>

      {panel === 'cloud' && <CloudPanel config={cloud.config} onConnect={cloud.connect} onDisconnect={cloud.disconnect} onClose={() => setPanel(null)} />}

      {panel === 'share' && (
        <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-6 z-50 animate-fade-in overflow-y-auto">
          <h4 className="font-header text-gold-antique mb-1 uppercase tracking-widest text-sm">Lien joueurs</h4>
          <p className="text-xs text-gray-400 mb-4 text-center">
            {cloud.config ? 'En direct : les joueurs voient chaque changement.' : 'Instantané : à repartager après chaque changement.'}
          </p>
          <div className="bg-white p-2 rounded-lg mb-4 w-52 h-52 flex items-center justify-center">
            {qr ? <img src={qr} alt="QR code du lien joueurs" className="w-full h-full" /> : <Loader2 className="w-10 h-10 text-black animate-spin" />}
          </div>
          <button
            type="button"
            onClick={copyLink}
            className={cx(
              'min-h-[48px] w-full max-w-xs border rounded-lg uppercase text-xs tracking-widest mb-2',
              cloud.config ? 'bg-emerald-900/20 text-emerald-300 border-emerald-500/50' : 'bg-gold-dark/20 text-gold-antique border-gold-dark/50'
            )}
          >
            {copied ? 'Lien copié !' : 'Copier le lien'}
          </button>
          <button type="button" onClick={() => setPanel(null)} className="min-h-[44px] px-6 text-gray-400 text-xs uppercase font-bold">
            Fermer
          </button>
        </div>
      )}

      {target && (
        <div className="absolute inset-0 bg-black/97 flex flex-col items-center justify-center p-6 z-50 animate-fade-in">
          <form
            className="w-full max-w-xs space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              addItem();
            }}
          >
            <div className="flex items-center justify-between border-b border-gold-dark/20 pb-2">
              <h4 className="text-gold-antique font-header text-sm uppercase tracking-widest">Objet pour {target.name}</h4>
              <button type="button" onClick={() => setAddingTo(null)} aria-label="Annuler" className="w-10 h-10 flex items-center justify-center text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              autoFocus
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Nom de l'objet…"
              aria-label="Nom de l'objet"
              className="w-full bg-black border border-gold-dark/30 rounded-lg p-3 text-parchment outline-none focus:border-gold-antique"
            />
            <textarea
              value={itemDesc}
              onChange={(e) => setItemDesc(e.target.value)}
              placeholder="Description (facultatif)"
              aria-label="Description"
              rows={2}
              className="w-full bg-black border border-gold-dark/30 rounded-lg p-3 text-parchment outline-none focus:border-gold-antique resize-none"
            />
            <label className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer min-h-[44px]">
              <input type="checkbox" checked={itemPenalty} onChange={(e) => setItemPenalty(e.target.checked)} className="w-5 h-5 accent-blood-red" />
              Objet maudit / malus
            </label>
            <button
              type="submit"
              disabled={busy || !itemName.trim()}
              className="w-full min-h-[52px] bg-gold-dark/20 border border-gold-antique text-gold-antique font-header text-xs uppercase tracking-widest rounded-lg disabled:opacity-40"
            >
              {busy ? 'Création magique…' : 'Ajouter au sac'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default VirtualVault;
