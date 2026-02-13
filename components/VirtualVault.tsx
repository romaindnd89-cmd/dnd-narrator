
import React, { useState, useEffect } from 'react';
import { Player, SessionState, Currency, VaultItem } from '../types';
import { Users, UserPlus, Trash2, Briefcase, Minus, ShieldX, User, Box, QrCode, CloudLightning, Sparkles, X, PlusCircle, Plus, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [dmLinkCopied, setDmLinkCopied] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const [addingToPlayerId, setAddingToPlayerId] = useState<string | null>(null);
  const [manualItemName, setManualItemName] = useState('');
  const [manualItemQty, setManualItemQty] = useState(1);
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

  const handleGenerateDMLink = async () => {
    if (!cloudUrl || !cloudKey) return;
    const baseUrl = window.location.origin + window.location.pathname;
    const config = { url: cloudUrl.trim(), key: cloudKey.trim() };
    const dmLink = `${baseUrl}#/dm/${utoa(JSON.stringify(config))}`;
    try {
        await navigator.clipboard.writeText(dmLink);
        setDmLinkCopied(true);
        setTimeout(() => setDmLinkCopied(false), 3000);
    } catch(e) { console.error(e); }
  };

  const addManualItem = async () => {
    if (!addingToPlayerId || !manualItemName.trim()) return;
    setIsGeneratingImg(true);
    let imageUrl = undefined;
    try {
        const prompt = `A single RPG item icon: ${manualItemName}. Dark fantasy style, detailed, on black background.`;
        imageUrl = await generateCharacterImage(prompt);
    } catch (e) { console.error(e); }

    const newItem: VaultItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: manualItemName.trim(),
        description: "Objet forgé manuellement.",
        quantity: manualItemQty,
        imageUrl,
        timestamp: Date.now()
    };

    onUpdateSession({
        ...session,
        players: session.players.map(p => 
            p.id === addingToPlayerId ? { ...p, inventory: [newItem, ...p.inventory] } : p
        )
    });

    setAddingToPlayerId(null);
    setManualItemName('');
    setManualItemQty(1);
    setIsGeneratingImg(false);
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
    onUpdateSession({ ...session, players: [...session.players, { id: Math.random().toString(36).substr(2, 9), name: newPlayerName.trim(), currency: { copper: 0, silver: 0, gold: 0 }, inventory: [] }] });
    setNewPlayerName('');
  };

  const removePlayer = (id: string) => {
    if (confirm(`Retirer ${session.players.find(p => p.id === id)?.name} ?`)) {
      onUpdateSession({ ...session, players: session.players.filter(p => p.id !== id) });
    }
  };

  const updateCurrency = (playerId: string, type: keyof Currency, amount: number) => {
    onUpdateSession({ ...session, players: session.players.map(p => { if (p.id !== playerId) return p; const newCurrency = { ...p.currency }; newCurrency[type] = Math.max(0, newCurrency[type] + amount); return { ...p, currency: newCurrency }; }) });
  };

  const updateItemQty = (playerId: string, itemId: string, delta: number) => {
    onUpdateSession({
        ...session,
        players: session.players.map(p => {
            if (p.id !== playerId) return p;
            return {
                ...p,
                inventory: p.inventory.map(item => {
                    if (item.id !== itemId) return item;
                    const newQty = Math.max(0, item.quantity + delta);
                    return { ...item, quantity: newQty };
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
            <div className="relative"><div className="absolute inset-0 bg-gold-antique/20 blur-2xl rounded-full scale-150"></div><Briefcase className="w-20 h-20 text-gold-antique relative z-10 drop-shadow-[0_0_15px_rgba(197,160,89,0.5)]" /></div>
            <div className="space-y-4 max-w-sm">
                <h3 className="font-header text-2xl text-gold-antique uppercase tracking-[0.2em]">Le Coffre du MJ</h3>
                <div className="h-0.5 w-20 bg-blood-red mx-auto"></div>
                <p className="text-sm text-parchment/70 leading-relaxed font-body italic px-4">Gérez les richesses et l'inventaire de vos joueurs en temps réel.</p>
            </div>
            <button onClick={() => onUpdateSession({ ...session, isActive: true })} className="w-full max-w-[280px] py-5 bg-blood-dark hover:bg-blood-red text-gold-antique font-header uppercase tracking-widest border border-gold-dark/50 rounded shadow-glow-red transition-all active:scale-95 group flex items-center justify-center gap-2">
                Ouvrir le Coffre <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-darker-metal border-2 border-gold-dark/30 rounded-lg relative overflow-hidden shadow-2xl">
      <div className="px-5 py-4 border-b border-gold-dark/30 bg-black/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blood-dark/30 border border-gold-dark/40 rounded shadow-glow-gold">
            <Briefcase className="w-4 h-4 text-gold-antique" />
          </div>
          <div className="flex flex-col">
            <h3 className="font-header text-[10px] md:text-xs text-gold-antique uppercase tracking-widest leading-none">Coffre Maître de Jeu</h3>
            {isCloudEnabled && <span className="text-[7px] text-green-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-1"><div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div> Synchro Live</span>}
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setShowShare(!showShare)} className={`p-2 rounded ${showShare ? 'bg-gold-dark/30 text-gold-antique' : 'text-gray-500 hover:text-white'}`}><QrCode className="w-4 h-4" /></button>
          <button onClick={() => setShowCloudConfig(!showCloudConfig)} className={`p-2 rounded ${isCloudEnabled ? 'text-green-500' : 'text-gray-500'}`}><CloudLightning className="w-4 h-4" /></button>
          <button onClick={onReset} className="p-2 text-gray-700 hover:text-red-500"><ShieldX className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar min-h-0">
        {session.players.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-700 space-y-4 py-16 border-2 border-dashed border-white/5 rounded-2xl">
                <Users className="w-12 h-12 opacity-10" />
                <p className="text-[10px] uppercase font-bold tracking-widest italic opacity-40">Aucun héros à l'auberge...</p>
            </div>
        ) : (
            session.players.map(player => (
                <div key={player.id} className="bg-black/40 border border-gold-dark/20 rounded-xl overflow-hidden group hover:border-gold-dark/40 transition-all">
                   <div className="p-3 bg-gold-dark/5 border-b border-gold-dark/10 flex items-center justify-between">
                      <span className="font-header text-xs text-gold-antique uppercase tracking-wider flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-gold-dark/10 flex items-center justify-center border border-gold-dark/20"><User className="w-3 h-3 text-gold-antique" /></div>{player.name}</span>
                      <div className="flex items-center gap-1">
                          <button onClick={() => setAddingToPlayerId(player.id)} className="p-1.5 text-gold-dark hover:text-gold-antique transition-colors"><PlusCircle className="w-4 h-4" /></button>
                          <button onClick={() => removePlayer(player.id)} className="p-1.5 text-gray-800 hover:text-red-500 transition-colors"><Trash2 className="w-3 h-3" /></button>
                      </div>
                   </div>
                   <div className="p-3 grid grid-cols-3 gap-2">
                        {[{ type: 'gold', color: 'text-yellow-500' }, { type: 'silver', color: 'text-gray-300' }, { type: 'copper', color: 'text-orange-600' }].map((coin) => (
                            <div key={coin.type} className="bg-black/40 rounded-lg p-2 border border-white/5 flex flex-col items-center">
                                <span className={`text-[11px] font-bold ${coin.color}`}>{(player.currency as any)[coin.type]}</span>
                                <div className="flex gap-3 mt-1 opacity-40 group-hover:opacity-100 transition-all">
                                    <button onClick={() => updateCurrency(player.id, coin.type as any, -1)} className="hover:text-white text-xs">-</button>
                                    <button onClick={() => updateCurrency(player.id, coin.type as any, 1)} className="hover:text-white text-xs">+</button>
                                </div>
                            </div>
                        ))}
                   </div>
                   {player.inventory.length > 0 && (
                       <div className="px-3 pb-3 space-y-1.5">
                           {player.inventory.map(item => (
                               <div key={item.id} className="flex flex-col bg-white/5 rounded-lg border border-white/5 overflow-hidden">
                                   <div 
                                        onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
                                        className="flex items-center gap-3 p-2 cursor-pointer hover:bg-white/10 transition-colors"
                                    >
                                       <div className="w-8 h-8 rounded bg-black flex items-center justify-center shrink-0 overflow-hidden border border-white/5">
                                           {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" alt="" /> : <Box className="w-4 h-4 text-gray-700" />}
                                       </div>
                                       <div className="flex-1 min-w-0 flex items-center justify-between">
                                           <span className="text-[10px] font-bold text-parchment truncate uppercase">{item.name}</span>
                                           <div className="flex items-center gap-2">
                                               <span className="text-[9px] font-header text-gold-antique">x{item.quantity}</span>
                                               <button onClick={(e) => { e.stopPropagation(); updateItemQty(player.id, item.id, -1); }} className="text-gray-600 hover:text-red-400 p-1"><Minus className="w-3 h-3" /></button>
                                           </div>
                                       </div>
                                       {expandedItemId === item.id ? <ChevronUp className="w-3 h-3 text-gold-dark" /> : <ChevronDown className="w-3 h-3 text-gold-dark" />}
                                   </div>
                                   {expandedItemId === item.id && (
                                       <div className="px-3 pb-3 pt-1 text-[9px] text-parchment/60 italic font-body animate-fade-in border-t border-white/5 mt-1 bg-black/20">
                                            {item.description}
                                       </div>
                                   )}
                               </div>
                           ))}
                       </div>
                   )}
                </div>
            ))
        )}
      </div>

      <div className="shrink-0 p-4 border-t border-gold-dark/20 bg-black/60 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
        <div className="flex gap-2 bg-darker-metal p-1 rounded-lg border border-gold-dark/30">
            <input 
                type="text" 
                placeholder="Nouveau héros..." 
                value={newPlayerName} 
                onChange={(e) => setNewPlayerName(e.target.value)} 
                className="flex-1 bg-transparent border-none px-3 py-2 text-xs text-parchment outline-none placeholder-gray-800"
                onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
            />
            <button onClick={addPlayer} className="bg-gold-dark/20 text-gold-antique p-2 rounded hover:bg-gold-dark/40 transition-all">
                <UserPlus className="w-4 h-4" />
            </button>
        </div>
      </div>

      {(showShare || showCloudConfig) && (
          <div className="absolute inset-0 z-[60] bg-black/95 p-6 animate-fade-in flex flex-col">
              <div className="flex justify-between items-center mb-6">
                  <h4 className="font-header text-xs text-gold-antique uppercase tracking-widest">{showShare ? 'Partager l\'Inventaire' : 'Configuration Cloud'}</h4>
                  <button onClick={() => { setShowShare(false); setShowCloudConfig(false); }} className="p-2 bg-white/5 rounded-full"><X className="w-4 h-4" /></button>
              </div>
              {showShare && (
                  <div className="flex flex-col items-center gap-6">
                      <div className="bg-white p-3 rounded-xl border-4 border-gold-dark/40"><img src={qrUrl} className="w-48 h-48" alt="QR" /></div>
                      <button onClick={handleCopy} className={`w-full py-3 rounded font-header text-[10px] uppercase tracking-widest ${copied ? 'bg-green-600 text-white' : 'bg-gold-dark/20 text-gold-antique'}`}>{copied ? 'Lien Copié !' : 'Copier le lien direct'}</button>
                  </div>
              )}
              {showCloudConfig && (
                  <div className="space-y-4">
                      <input type="text" placeholder="Supabase URL" value={cloudUrl} onChange={e => setCloudUrl(e.target.value)} className="w-full bg-black border border-gold-dark/30 rounded p-3 text-xs text-parchment outline-none" />
                      <input type="password" placeholder="Supabase Key" value={cloudKey} onChange={e => setCloudKey(e.target.value)} className="w-full bg-black border border-gold-dark/30 rounded p-3 text-xs text-parchment outline-none" />
                      <button onClick={handleSaveCloudConfig} className="w-full py-3 bg-green-900/40 text-green-400 font-header text-[10px] uppercase border border-green-500/30 rounded">Activer Synchro</button>
                      <button onClick={handleGenerateDMLink} className={`w-full py-3 border rounded font-header text-[10px] uppercase transition-all ${dmLinkCopied ? 'bg-gold-antique text-black border-gold-antique' : 'border-gold-dark/30 text-gold-antique'}`}>{dmLinkCopied ? 'Lien MJ Copié !' : 'Générer Lien MJ'}</button>
                  </div>
              )}
          </div>
      )}

      {addingToPlayerId && (
          <div className="absolute inset-0 z-[60] bg-black/95 p-6 animate-fade-in flex flex-col items-center justify-center">
              <div className="w-full space-y-4">
                  <h4 className="font-header text-xs text-gold-antique uppercase tracking-widest text-center mb-4">Forge d'objet manuel</h4>
                  <input type="text" value={manualItemName} onChange={e => setManualItemName(e.target.value)} placeholder="Nom de l'objet..." className="w-full bg-black border border-gold-dark/30 rounded p-3 text-xs text-parchment outline-none" />
                  <div className="flex items-center justify-center gap-4">
                      <button onClick={() => setManualItemQty(Math.max(1, manualItemQty - 1))} className="w-8 h-8 rounded bg-gold-dark/20 text-gold-antique">-</button>
                      <span className="font-header text-gold-antique">x{manualItemQty}</span>
                      <button onClick={() => setManualItemQty(manualItemQty + 1)} className="w-8 h-8 rounded bg-gold-dark/20 text-gold-antique">+</button>
                  </div>
                  <button onClick={addManualItem} disabled={!manualItemName.trim() || isGeneratingImg} className="w-full py-3 bg-blood-dark text-gold-antique font-header text-[10px] uppercase border border-gold-dark/40 rounded flex items-center justify-center gap-2">
                      {isGeneratingImg ? <Sparkles className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                      Forger l'objet
                  </button>
                  <button onClick={() => setAddingToPlayerId(null)} className="w-full py-3 text-gray-500 font-header text-[9px] uppercase transition-colors">Annuler</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default VirtualVault;
