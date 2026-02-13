
import React, { useState, useEffect } from 'react';
import { Player, SessionState, Currency, VaultItem, PlayerCondition } from '../types';
import { Users, UserPlus, Trash2, Briefcase, Minus, ShieldX, User, Box, QrCode, CloudLightning, Sparkles, X, PlusCircle, Plus, ChevronDown, ChevronUp, AlertTriangle, Skull, ShieldCheck, Wand2 } from 'lucide-react';
import { initSupabase, saveSessionToCloud } from '../services/supabaseService';
import { generateCharacterImage } from '../services/geminiService';

const utoa = (str: string) => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode(parseInt(p1, 16))));

interface VirtualVaultProps {
  session: SessionState;
  onUpdateSession: (session: SessionState) => void;
  onReset: () => void;
}

const VirtualVault: React.FC<VirtualVaultProps> = ({ session, onUpdateSession, onReset }) => {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [showCloudConfig, setShowCloudConfig] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [expandedConditionId, setExpandedConditionId] = useState<string | null>(null);

  const [addingToPlayerId, setAddingToPlayerId] = useState<string | null>(null);
  const [manualItemName, setManualItemName] = useState('');
  const [manualItemQty, setManualItemQty] = useState(1);
  const [isPenaltyManual, setIsPenaltyManual] = useState(false);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);

  const [cloudUrl, setCloudUrl] = useState(() => localStorage.getItem('dnd_supabase_url') || '');
  const [cloudKey, setCloudKey] = useState(() => localStorage.getItem('dnd_supabase_key') || '');
  const [isCloudEnabled, setIsCloudEnabled] = useState(() => !!localStorage.getItem('dnd_supabase_url'));

  useEffect(() => {
    if (isCloudEnabled && cloudUrl && cloudKey) {
        initSupabase(cloudUrl, cloudKey);
        saveSessionToCloud(session);
    }
  }, [session, isCloudEnabled, cloudUrl, cloudKey]);

  const handleSaveCloudConfig = () => {
    if (cloudUrl && cloudKey) {
        localStorage.setItem('dnd_supabase_url', cloudUrl.trim());
        localStorage.setItem('dnd_supabase_key', cloudKey.trim());
        setIsCloudEnabled(true);
        setShowCloudConfig(false);
        initSupabase(cloudUrl.trim(), cloudKey.trim());
        saveSessionToCloud(session);
    }
  };

  const addManualItem = async () => {
    if (!addingToPlayerId || !manualItemName.trim()) return;
    setIsGeneratingImg(true);
    let imageUrl = undefined;
    try {
        imageUrl = await generateCharacterImage(manualItemName);
    } catch (e) { console.error(e); }

    const newItem: VaultItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: manualItemName.trim(),
        description: isPenaltyManual ? "EFFET NÉGATIF : Malédiction ou piège." : "Objet ou bénédiction forgé.",
        quantity: manualItemQty,
        imageUrl,
        isPenalty: isPenaltyManual,
        timestamp: Date.now()
    };

    onUpdateSession({
        ...session,
        players: session.players.map(p => 
            p.id === addingToPlayerId ? { ...p, inventory: [newItem, ...(p.inventory || [])] } : p
        )
    });

    setAddingToPlayerId(null);
    setManualItemName('');
    setManualItemQty(1);
    setIsPenaltyManual(false);
    setIsGeneratingImg(false);
  };

  const removeCondition = (playerId: string, conditionId: string) => {
    onUpdateSession({
        ...session,
        players: session.players.map(p => 
            p.id === playerId ? { ...p, conditions: (p.conditions || []).filter(c => c.id !== conditionId) } : p
        )
    });
  };

  const shareLink = (() => {
    const baseUrl = window.location.origin + window.location.pathname;
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    let dataToEncode = isCloudEnabled ? { id: session.id, isLiveOnly: true, cloudConfig: { url: cloudUrl, key: cloudKey } } : session;
    return `${cleanBaseUrl}#/view/${utoa(JSON.stringify(dataToEncode))}`;
  })();

  const handleCopy = async () => {
    try {
        await navigator.clipboard.writeText(shareLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    } catch (err) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    onUpdateSession({ ...session, players: [...session.players, { id: Math.random().toString(36).substr(2, 9), name: newPlayerName.trim(), currency: { copper: 0, silver: 0, gold: 0 }, inventory: [], conditions: [] }] });
    setNewPlayerName('');
  };

  const removePlayer = (id: string) => {
    if (confirm(`Bannir ce héros ?`)) {
      onUpdateSession({ ...session, players: session.players.filter(p => p.id !== id) });
    }
  };

  const updateCurrency = (playerId: string, type: keyof Currency, amount: number) => {
    onUpdateSession({ 
      ...session, 
      players: session.players.map(p => { 
        if (p.id !== playerId) return p; 
        let c = { ...p.currency };
        c[type] += amount;
        while (c.copper >= 10) { c.copper -= 10; c.silver += 1; }
        while (c.silver >= 10) { c.silver -= 10; c.gold += 1; }
        while (c.copper < 0 && c.silver > 0) { c.copper += 10; c.silver -= 1; }
        while (c.silver < 0 && c.gold > 0) { c.silver += 10; c.gold -= 1; }
        return { ...p, currency: { copper: Math.max(0, c.copper), silver: Math.max(0, c.silver), gold: Math.max(0, c.gold) } }; 
      }) 
    });
  };

  const updateItemQty = (playerId: string, itemId: string, delta: number) => {
    onUpdateSession({
        ...session,
        players: session.players.map(p => {
            if (p.id !== playerId) return p;
            return {
                ...p,
                inventory: (p.inventory || []).map(item => {
                    if (item.id !== itemId) return item;
                    return { ...item, quantity: Math.max(0, item.quantity + delta) };
                }).filter(item => item.quantity > 0)
            };
        })
    });
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(shareLink)}&bgcolor=ffffff&color=000000&margin=3`;

  if (!session.isActive) {
    return (
      <div className="h-full flex flex-col bg-darker-metal border-2 border-gold-dark/20 rounded-lg animate-fade-in overflow-hidden shadow-2xl min-h-[400px]">
        <div className="p-10 text-center flex-1 flex flex-col items-center justify-center space-y-8 bg-[radial-gradient(circle_at_center,_#1a1b1e_0%,_#0f1012_100%)]">
            <div className="relative"><Briefcase className="w-20 h-20 text-gold-antique relative z-10 drop-shadow-glow" /></div>
            <h3 className="font-header text-2xl text-gold-antique uppercase tracking-widest">Coffre Maître de Jeu</h3>
            <button onClick={() => onUpdateSession({ ...session, isActive: true })} className="w-full max-w-[280px] py-5 bg-blood-dark hover:bg-blood-red text-gold-antique font-header uppercase border border-gold-dark/50 rounded shadow-glow-red transition-all">
                Ouvrir le Coffre
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-darker-metal border-2 border-gold-dark/30 rounded-lg relative overflow-hidden shadow-2xl">
      <div className="px-5 py-4 border-b border-gold-dark/30 bg-black/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Briefcase className="w-4 h-4 text-gold-antique" />
          <h3 className="font-header text-xs text-gold-antique uppercase tracking-widest">Coffre MJ</h3>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setShowShare(!showShare)} className="p-2 text-gray-500 hover:text-white"><QrCode className="w-4 h-4" /></button>
          <button onClick={() => setShowCloudConfig(!showCloudConfig)} className="p-2 text-gray-500 hover:text-white"><CloudLightning className="w-4 h-4" /></button>
          <button onClick={onReset} className="p-2 text-gray-700 hover:text-red-500"><ShieldX className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar min-h-0">
        {session.players.map(player => {
            const hasConditions = player.conditions && player.conditions.length > 0;
            return (
                <div key={player.id} className={`bg-black/40 border rounded-xl overflow-hidden transition-all ${hasConditions ? 'border-gold-dark/20' : 'border-gold-dark/20'}`}>
                   <div className={`p-3 border-b flex items-center justify-between bg-gold-dark/5 border-gold-dark/10`}>
                      <div className="flex items-center gap-2">
                        <span className={`font-header text-xs uppercase tracking-wider text-gold-antique`}>{player.name}</span>
                        {hasConditions && <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setAddingToPlayerId(player.id)} className="p-1 text-gold-dark hover:text-gold-antique"><PlusCircle className="w-4 h-4" /></button>
                        <button onClick={() => removePlayer(player.id)} className="p-1 text-gray-700 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                      </div>
                   </div>

                   {/* ÉTATS ACTIFS (CONDITIONS) */}
                   {hasConditions && (
                       <div className="px-3 py-2 bg-black/40 border-b border-white/5 space-y-1">
                           <div className="flex items-center gap-1 opacity-60 mb-1">
                               <Sparkles className="w-2.5 h-2.5 text-gold-antique" />
                               <span className="text-[8px] font-bold uppercase text-gold-antique tracking-widest">États Affectés</span>
                           </div>
                           {player.conditions.map(c => (
                               <div key={c.id} className="flex flex-col">
                                   <div 
                                        onClick={() => setExpandedConditionId(expandedConditionId === c.id ? null : c.id)}
                                        className={`flex items-center justify-between border rounded px-2 py-1 cursor-pointer group transition-all ${c.isPenalty ? 'bg-blood-red/10 border-blood-red/30 hover:bg-blood-red/20' : 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20'}`}
                                    >
                                       <div className="flex items-center gap-2">
                                           {c.isPenalty ? <Skull className="w-2.5 h-2.5 text-blood-red" /> : <Wand2 className="w-2.5 h-2.5 text-emerald-400" />}
                                           <span className={`text-[9px] font-bold uppercase tracking-tighter ${c.isPenalty ? 'text-blood-red' : 'text-emerald-400'}`}>{c.name}</span>
                                       </div>
                                       <button onClick={(e) => { e.stopPropagation(); removeCondition(player.id, c.id); }} className="text-gray-500 hover:text-white">
                                           <ShieldCheck className="w-3 h-3" />
                                       </button>
                                   </div>
                                   {expandedConditionId === c.id && (
                                       <div className={`p-2 text-[8px] italic bg-black/40 border-x border-b rounded-b ${c.isPenalty ? 'text-blood-red/80 border-blood-red/20' : 'text-emerald-400/80 border-emerald-500/20'}`}>
                                           {c.description}
                                       </div>
                                   )}
                               </div>
                           ))}
                       </div>
                   )}

                   <div className="p-3 grid grid-cols-3 gap-2">
                        {[{ type: 'gold', color: 'text-yellow-500' }, { type: 'silver', color: 'text-gray-300' }, { type: 'copper', color: 'text-orange-600' }].map((coin) => (
                            <div key={coin.type} className="bg-black/40 rounded-lg p-2 border border-white/5 flex flex-col items-center">
                                <span className={`text-[11px] font-bold ${coin.color}`}>{(player.currency as any)[coin.type]}</span>
                                <div className="flex gap-2 mt-1 opacity-40 hover:opacity-100 transition-opacity">
                                    <button onClick={() => updateCurrency(player.id, coin.type as any, -1)} className="text-[8px] text-gray-500">-</button>
                                    <button onClick={() => updateCurrency(player.id, coin.type as any, 1)} className="text-[8px] text-gray-500">+</button>
                                </div>
                            </div>
                        ))}
                   </div>
                   {player.inventory && player.inventory.length > 0 && (
                       <div className="px-3 pb-3 space-y-1.5">
                           {player.inventory.map(item => (
                               <div key={item.id} className={`flex flex-col rounded-lg border overflow-hidden transition-all ${item.isPenalty ? 'border-blood-red bg-blood-red/5 shadow-[0_0_10px_rgba(138,3,3,0.3)]' : 'border-emerald-500/30 bg-emerald-500/5'}`}>
                                   <div 
                                        onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
                                        className="flex items-center gap-3 p-2 cursor-pointer hover:bg-white/5"
                                    >
                                       <div className={`w-8 h-8 rounded bg-black flex items-center justify-center shrink-0 border ${item.isPenalty ? 'border-blood-red shadow-[0_0_5px_rgba(138,3,3,0.5)]' : 'border-emerald-500/40'}`}>
                                           {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" alt="" /> : <Box className={`w-4 h-4 ${item.isPenalty ? 'text-blood-red' : 'text-emerald-500'}`} />}
                                       </div>
                                       <div className="flex-1 min-w-0 flex items-center justify-between">
                                           <span className={`text-[10px] font-bold truncate uppercase flex items-center gap-1 ${item.isPenalty ? 'text-blood-red' : 'text-emerald-400'}`}>
                                               {item.isPenalty && <AlertTriangle className="w-2 h-2" />}
                                               {item.name}
                                           </span>
                                           <div className="flex items-center gap-2">
                                               <span className={`text-[9px] font-header ${item.isPenalty ? 'text-blood-red' : 'text-emerald-400'}`}>x{item.quantity}</span>
                                               <button onClick={(e) => { e.stopPropagation(); updateItemQty(player.id, item.id, -1); }} className="text-gray-600 hover:text-red-400 p-1"><Minus className="w-3 h-3" /></button>
                                           </div>
                                       </div>
                                   </div>
                                   {expandedItemId === item.id && (
                                       <div className={`px-3 pb-3 pt-1 text-[9px] italic font-body border-t mt-1 ${item.isPenalty ? 'text-blood-red/80 border-blood-red/20 bg-blood-red/5' : 'text-emerald-400/80 border-emerald-500/10'}`}>
                                            {item.description}
                                       </div>
                                   )}
                               </div>
                           ))}
                       </div>
                   )}
                </div>
            );
        })}
      </div>

      <div className="p-4 border-t border-gold-dark/20 bg-black/60">
        <div className="flex gap-2 bg-darker-metal p-1 rounded-lg border border-gold-dark/30">
            <input type="text" placeholder="Nouveau héros..." value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} className="flex-1 bg-transparent px-3 py-2 text-xs text-parchment outline-none" onKeyDown={(e) => e.key === 'Enter' && addPlayer()} />
            <button onClick={addPlayer} className="bg-gold-dark/20 text-gold-antique p-2 rounded"><UserPlus className="w-4 h-4" /></button>
        </div>
      </div>

      {(showShare || showCloudConfig) && (
          <div className="absolute inset-0 z-[60] bg-black/95 p-6 flex flex-col items-center justify-center animate-fade-in">
              <button onClick={() => { setShowShare(false); setShowCloudConfig(false); }} className="absolute top-4 right-4 p-2 text-gold-dark hover:text-white transition-all"><X className="w-8 h-8" /></button>
              {showShare && (
                  <div className="flex flex-col items-center gap-6">
                      <h4 className="font-header text-gold-antique text-lg uppercase tracking-widest">Partager la Session</h4>
                      <div className="p-4 bg-white rounded-2xl shadow-glow-gold">
                        <img src={qrUrl} className="w-48 h-48" alt="QR Code Partage" />
                      </div>
                      <button onClick={handleCopy} className="py-3 px-8 bg-gold-dark/20 text-gold-antique border border-gold-dark/50 rounded uppercase text-[12px] tracking-widest font-bold hover:bg-gold-dark/40 transition-all">{copied ? 'Lien Copié !' : 'Copier le Lien Joueur'}</button>
                  </div>
              )}
              {showCloudConfig && (
                  <div className="w-full max-w-sm flex flex-col gap-6 text-center">
                    <CloudLightning className="w-12 h-12 text-gold-antique mx-auto" />
                    <h4 className="font-header text-gold-antique text-lg uppercase tracking-widest">Config Synchro Live</h4>
                    <p className="text-[10px] text-parchment/60 uppercase tracking-widest leading-relaxed">Connectez votre instance Supabase pour un coffre synchronisé en temps réel avec vos joueurs.</p>
                    <div className="space-y-4">
                        <input type="text" value={cloudUrl} onChange={e => setCloudUrl(e.target.value)} placeholder="URL Supabase..." className="w-full bg-black/40 border border-gold-dark/30 rounded p-3 text-xs text-parchment focus:border-gold-antique outline-none" />
                        <input type="password" value={cloudKey} onChange={e => setCloudKey(e.target.value)} placeholder="Clé API Supabase..." className="w-full bg-black/40 border border-gold-dark/30 rounded p-3 text-xs text-parchment focus:border-gold-antique outline-none" />
                    </div>
                    <button onClick={handleSaveCloudConfig} className="py-3 bg-gold-dark/40 text-gold-antique font-header text-xs uppercase border border-gold-dark/50 rounded hover:bg-gold-dark/60">Activer la Synchro</button>
                    {isCloudEnabled && <button onClick={() => { localStorage.removeItem('dnd_supabase_url'); localStorage.removeItem('dnd_supabase_key'); setIsCloudEnabled(false); setShowCloudConfig(false); }} className="text-red-500 text-[10px] uppercase font-bold tracking-widest">Désactiver le Cloud</button>}
                  </div>
              )}
          </div>
      )}

      {addingToPlayerId && (
          <div className="absolute inset-0 z-[60] bg-black/98 p-6 animate-fade-in flex flex-col items-center justify-center text-center">
              <div className="w-full max-w-xs space-y-4">
                  <h4 className="font-header text-gold-antique uppercase text-xs mb-4 border-b border-gold-dark/20 pb-2 tracking-[0.2em]">Ajout Manuel</h4>
                  <input type="text" value={manualItemName} onChange={e => setManualItemName(e.target.value)} placeholder="Nom de l'objet ou de l'effet..." className="w-full bg-black border border-gold-dark/30 rounded p-3 text-xs text-parchment" />
                  
                  <div className="flex items-center justify-between bg-black/40 p-3 rounded border border-white/5">
                      <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" checked={isPenaltyManual} onChange={e => setIsPenaltyManual(e.target.checked)} className="accent-blood-red w-4 h-4" />
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${isPenaltyManual ? 'text-blood-red' : 'text-emerald-500'}`}>Est un MALUS ?</span>
                      </label>
                      {!isPenaltyManual && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-600 font-bold uppercase">Qté</span>
                            <input type="number" value={manualItemQty} onChange={e => setManualItemQty(parseInt(e.target.value) || 1)} className="w-10 bg-black border border-white/10 text-xs text-center p-1 rounded" />
                          </div>
                      )}
                  </div>

                  <button onClick={addManualItem} disabled={isGeneratingImg} className={`w-full py-4 font-header text-[11px] uppercase border rounded shadow-lg transition-all ${isPenaltyManual ? 'bg-blood-dark border-blood-red/40 text-blood-red' : 'bg-emerald-900/20 border-emerald-500/40 text-emerald-400'}`}>
                      {isGeneratingImg ? 'Magie en cours...' : (isPenaltyManual ? 'Infliger le Malus' : 'Forger l\'Objet / Bonus')}
                  </button>
                  <button onClick={() => setAddingToPlayerId(null)} className="text-gray-600 uppercase text-[9px] mt-4 tracking-widest hover:text-white">Annuler</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default VirtualVault;
