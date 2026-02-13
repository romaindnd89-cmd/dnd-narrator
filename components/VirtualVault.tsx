
import React, { useState, useEffect } from 'react';
import { Player, SessionState, Currency } from '../types';
import { Users, UserPlus, Trash2, Coins, Briefcase, Minus, Share2, ShieldX, User, Box, QrCode, Info, AlertTriangle, Sparkles, X, Copy, CheckCircle2, CloudLightning, Settings, ShieldCheck, Database, Globe, ExternalLink, Terminal, HelpCircle, Share } from 'lucide-react';
import { initSupabase, saveSessionToCloud } from '../services/supabaseService';

// Helper pour le décodage/encodage compatible UTF-8
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
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [showInGameHelp, setShowInGameHelp] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const generateShareLink = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    
    let dataToEncode;
    if (isCloudEnabled) {
        dataToEncode = {
            id: session.id,
            isLiveOnly: true, 
            cloudConfig: { url: cloudUrl, key: cloudKey }
        };
    } else {
        dataToEncode = session;
    }
    
    const data = utoa(JSON.stringify(dataToEncode));
    return `${cleanBaseUrl}#/view/${data}`;
  };

  const shareLink = generateShareLink();
  const isUrlLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  const handleCopy = async () => {
    try {
        await navigator.clipboard.writeText(shareLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    } catch (err) { 
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Inventaire de Session D&D',
          text: 'Suis ton or et ton inventaire en temps réel ici !',
          url: shareLink,
        });
      } catch (err) {
        console.log('Share failed', err);
      }
    } else {
      handleCopy();
    }
  };

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    const newPlayer: Player = {
      id: Math.random().toString(36).substr(2, 9),
      name: newPlayerName.trim(),
      currency: { copper: 0, silver: 0, gold: 0 },
      inventory: []
    };
    onUpdateSession({ ...session, players: [...session.players, newPlayer] });
    setNewPlayerName('');
  };

  const removePlayer = (id: string) => {
    if (confirm(`Retirer ${session.players.find(p => p.id === id)?.name} ?`)) {
      onUpdateSession({ ...session, players: session.players.filter(p => p.id !== id) });
    }
  };

  const updateCurrency = (playerId: string, type: keyof Currency, amount: number) => {
    onUpdateSession({
      ...session,
      players: session.players.map(p => {
        if (p.id !== playerId) return p;
        const newCurrency = { ...p.currency };
        newCurrency[type] = Math.max(0, newCurrency[type] + amount);
        return { ...p, currency: newCurrency };
      })
    });
  };

  const removeItem = (playerId: string, itemId: string) => {
    onUpdateSession({
      ...session,
      players: session.players.map(p => p.id === playerId ? { ...p, inventory: p.inventory.filter(i => i.id !== itemId) } : p)
    });
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(shareLink)}&bgcolor=ffffff&color=000000&margin=3`;

  const sqlCode = `create table sessions (
  id text primary key,
  data jsonb not null,
  updated_at timestamp with time zone default now()
);
alter publication supabase_realtime add table sessions;
alter table sessions enable row level security;
create policy "Public Access" on sessions for all using (true);`;

  if (!session.isActive) {
    return (
      <div className="h-full flex flex-col bg-darker-metal border-2 border-gold-dark/20 rounded-lg animate-fade-in overflow-hidden shadow-2xl">
        <div className="p-10 text-center flex-1 flex flex-col items-center justify-center space-y-8 bg-[radial-gradient(circle_at_center,_#1a1b1e_0%,_#0f1012_100%)]">
            <div className="relative">
                <div className="absolute inset-0 bg-gold-antique/20 blur-2xl rounded-full scale-150"></div>
                <Briefcase className="w-20 h-20 text-gold-antique relative z-10 drop-shadow-[0_0_15px_rgba(197,160,89,0.5)]" />
            </div>
            
            <div className="space-y-4 max-w-sm">
                <h3 className="font-header text-2xl text-gold-antique uppercase tracking-[0.2em]">Le Coffre Virtuel</h3>
                <div className="h-1 w-20 bg-blood-red mx-auto"></div>
                <p className="text-sm text-parchment/70 leading-relaxed font-body italic px-4">
                    "Un lieu sacré pour l'or et les artefacts de vos compagnons d'armes. Partagez le lien, et ils verront leurs richesses croître en temps réel."
                </p>
            </div>

            <div className="grid grid-cols-1 gap-3 w-full max-w-[280px]">
                <button 
                    onClick={() => onUpdateSession({ ...session, isActive: true })} 
                    className="w-full py-5 bg-blood-dark hover:bg-blood-red text-gold-antique font-header uppercase tracking-widest border border-gold-dark/50 rounded shadow-glow-red transition-all active:scale-95 group"
                >
                    <span className="flex items-center justify-center gap-2">
                        Ouvrir le Coffre <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
                    </span>
                </button>
            </div>
            
            <div className="flex flex-col items-center gap-2 text-[10px] text-gray-600 uppercase font-bold tracking-widest opacity-50">
                <div className="flex items-center gap-2"><ShieldCheck className="w-3 h-3" /> Chiffrement Local</div>
                <div className="flex items-center gap-2"><Globe className="w-3 h-3" /> Prêt pour la Synchronisation</div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-darker-metal border-2 border-gold-dark/30 rounded-lg relative overflow-hidden shadow-2xl">
      
      <div className="px-5 py-4 border-b border-gold-dark/30 bg-black/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-blood-dark/20 border border-blood-red/30 rounded">
                <Briefcase className="w-4 h-4 text-gold-antique" />
            </div>
            <div className="flex flex-col">
                <h3 className="font-header text-xs text-gold-antique uppercase tracking-widest">Le Coffre de Romain.DnD</h3>
                {isCloudEnabled && (
                    <span className="text-[8px] text-green-500 font-bold uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_#22c55e]"></div> Synchro Magique
                    </span>
                )}
            </div>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={() => { setShowShare(!showShare); setShowCloudConfig(false); setShowInGameHelp(false); }} 
            className={`p-2 transition-all rounded-md ${showShare ? 'bg-gold-dark/30 text-gold-antique' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
            title="Partager"
          >
            <QrCode className="w-5 h-5" />
          </button>
          <button 
            onClick={() => { setShowCloudConfig(!showCloudConfig); setShowShare(false); setShowInGameHelp(false); }} 
            className={`p-2 transition-all rounded-md ${isCloudEnabled ? 'text-green-500 bg-green-950/20' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
            title="Cloud"
          >
            <CloudLightning className="w-5 h-5" />
          </button>
          <button 
            onClick={() => { setShowInGameHelp(!showInGameHelp); setShowShare(false); setShowCloudConfig(false); }}
            className={`p-2 transition-all rounded-md ${showInGameHelp ? 'text-blue-400 bg-blue-950/20' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
            title="Aide"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <button 
            onClick={onReset} 
            className="p-2 text-gray-700 hover:text-red-500 transition-colors"
            title="Clôturer la session"
          >
            <ShieldX className="w-5 h-5" />
          </button>
        </div>
      </div>

      {(showCloudConfig || showShare || showInGameHelp) && (
        <div className="absolute inset-x-0 top-[65px] bottom-0 z-50 p-6 bg-black/98 backdrop-blur-xl animate-fade-in flex flex-col overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-8">
                <h4 className="font-header text-sm text-gold-antique uppercase tracking-widest flex items-center gap-3">
                    {showCloudConfig && <><Database className="w-5 h-5 text-green-500" /> Paramètres Cloud</>}
                    {showShare && <><Share2 className="w-5 h-5 text-gold-antique" /> Partage de l'Inventaire</>}
                    {showInGameHelp && <><Info className="w-5 h-5 text-blue-400" /> Guide d'utilisation</>}
                </h4>
                <button onClick={() => { setShowCloudConfig(false); setShowShare(false); setShowInGameHelp(false); }} className="p-2 text-gray-500 hover:text-white transition-colors bg-white/5 rounded-full"><X className="w-5 h-5" /></button>
            </div>

            {showShare && (
                <div className="flex-1 flex flex-col items-center">
                    
                    {isUrlLocal && (
                        <div className="w-full bg-red-950/30 border border-red-900/50 p-3 rounded-lg flex gap-3 items-center mb-6">
                            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                            <p className="text-[10px] text-red-200 leading-tight">
                                <strong>Attention :</strong> Vous êtes sur une adresse locale (localhost). <br/>
                                Les QR Codes et liens de partage ne fonctionneront pas sur d'autres appareils.
                            </p>
                        </div>
                    )}

                    <div className="bg-white p-4 border-4 border-gold-dark/30 rounded-2xl mb-8 shadow-2xl">
                        <img src={qrUrl} alt="QR Code" className="w-56 h-56 md:w-64 md:h-64" />
                    </div>

                    <div className="w-full max-w-sm space-y-4">
                        <button onClick={handleNativeShare} className="w-full flex items-center justify-center gap-3 py-4 bg-blood-red text-white rounded-lg font-header uppercase text-xs transition-all shadow-lg hover:bg-blood-dark active:scale-95">
                            <Share className="w-5 h-5" /> Partager via mon téléphone
                        </button>

                        <button onClick={handleCopy} className={`w-full flex items-center justify-center gap-3 py-4 rounded-lg font-header uppercase text-xs transition-all border border-gold-dark/30 ${copied ? 'bg-green-600 text-white' : 'bg-gold-dark/10 text-gold-antique hover:bg-gold-dark/20'}`}>
                            {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />} {copied ? 'Lien Copié !' : 'Copier le lien direct'}
                        </button>
                        
                        {!isCloudEnabled && (
                            <p className="text-[10px] text-gold-dark/50 text-center italic mt-4">
                                "La Synchro Live (Cloud) est recommandée pour une expérience fluide sur mobile."
                            </p>
                        )}
                    </div>
                </div>
            )}

            {showCloudConfig && (
                <div className="flex-1 space-y-6">
                    <button onClick={() => setShowSqlGuide(!showSqlGuide)} className="w-full flex items-center justify-between px-4 py-3 bg-blue-900/10 border border-blue-800/30 rounded text-xs text-blue-400 font-bold uppercase">
                        <span className="flex items-center gap-3"><Terminal className="w-4 h-4" /> Script SQL Supabase</span>
                        {showSqlGuide ? <Minus className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                    </button>
                    {showSqlGuide && (
                        <div className="p-4 bg-gray-950 rounded border border-white/5 space-y-3">
                            <pre className="text-[9px] text-green-500 font-mono bg-black/50 p-3 rounded overflow-x-auto leading-tight">{sqlCode}</pre>
                        </div>
                    )}
                    <div className="space-y-5">
                        <input type="text" placeholder="URL Supabase" value={cloudUrl} onChange={(e) => setCloudUrl(e.target.value)} className="w-full bg-black border border-gold-dark/30 rounded px-4 py-3 text-xs text-parchment outline-none" />
                        <input type="password" placeholder="Clé Anon" value={cloudKey} onChange={(e) => setCloudKey(e.target.value)} className="w-full bg-black border border-gold-dark/30 rounded px-4 py-3 text-xs text-parchment outline-none" />
                        <button onClick={handleSaveCloudConfig} className="w-full bg-green-900/40 text-green-400 border border-green-700/50 rounded py-4 text-xs font-bold uppercase">Activer la Magie Cloud</button>
                    </div>
                </div>
            )}

            {showInGameHelp && (
                <div className="space-y-6 text-parchment/80 font-body text-sm leading-relaxed">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                        <span className="font-bold text-gold-antique block mb-1">Comment partager ?</span>
                        <p className="text-xs">Cliquez sur l'icône QR Code, puis scannez ou utilisez le bouton "Partager". Le lien contient l'inventaire en cours.</p>
                    </div>
                    <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                        <span className="font-bold text-gold-antique block mb-1">Synchro Cloud</span>
                        <p className="text-xs">Indispensable pour que vos joueurs voient leurs objets sans rafraîchir la page dès que vous les ajoutez.</p>
                    </div>
                </div>
            )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar pb-32">
        {session.players.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-700 space-y-6 py-24 border-2 border-dashed border-white/5 rounded-3xl m-4">
                <Users className="w-16 h-16 opacity-10" />
                <div className="text-center space-y-2">
                    <p className="text-xs uppercase font-bold tracking-[0.3em] italic">L'auberge est vide...</p>
                    <p className="text-[10px] text-gray-800 max-w-[200px] leading-relaxed">Ajoutez des aventuriers pour commencer la gestion du butin.</p>
                </div>
            </div>
        ) : (
            session.players.map(player => (
                <div key={player.id} className="bg-black/40 border border-gold-dark/20 rounded-2xl overflow-hidden shadow-2xl animate-fade-in group hover:border-gold-dark/50 transition-all">
                   <div className="p-4 bg-gold-dark/5 border-b border-gold-dark/10 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                          <span className="font-header text-sm text-gold-antique uppercase tracking-widest flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gold-dark/10 flex items-center justify-center border border-gold-dark/30">
                                <User className="w-4 h-4 opacity-50 text-gold-antique" />
                              </div>
                              {player.name}
                          </span>
                          <button onClick={() => removePlayer(player.id)} className="p-2 text-gray-800 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all">
                              <Trash2 className="w-4 h-4" />
                          </button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                          {[
                            { type: 'gold', color: 'text-yellow-500', label: 'Or' },
                            { type: 'silver', color: 'text-gray-300', label: 'Argent' },
                            { type: 'copper', color: 'text-orange-600', label: 'Cuivre' }
                          ].map((coin) => (
                              <div key={coin.type} className="bg-black/60 rounded-xl p-3 border border-gold-dark/10 flex flex-col items-center shadow-inner">
                                  <span className={`text-xs font-bold ${coin.color} mb-2 tracking-widest`}>
                                      {(player.currency as any)[coin.type]} <span className="text-[8px] uppercase opacity-50">{coin.label.charAt(0)}</span>
                                  </span>
                                  <div className="flex gap-4">
                                      <button onClick={() => updateCurrency(player.id, coin.type as any, -1)} className="text-gray-500 hover:text-white text-lg font-bold w-6 h-6 flex items-center justify-center transition-colors">-</button>
                                      <button onClick={() => updateCurrency(player.id, coin.type as any, 1)} className="text-gray-500 hover:text-white text-lg font-bold w-6 h-6 flex items-center justify-center transition-colors">+</button>
                                  </div>
                              </div>
                          ))}
                      </div>
                   </div>
                   <div className="p-4 space-y-2.5 min-h-[60px]">
                      {player.inventory.length === 0 ? (
                          <p className="text-[9px] text-gray-700 italic text-center py-4">Le sac est vide.</p>
                      ) : (
                          player.inventory.map(item => (
                            <div key={item.id} className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-transparent hover:border-gold-dark/20 group/item transition-all shadow-sm">
                               <div className="w-12 h-12 rounded-lg bg-black/60 flex items-center justify-center shrink-0 border border-white/5 overflow-hidden">
                                   {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} /> : <Box className="w-5 h-5 text-gray-700" />}
                               </div>
                               <div className="flex-1 min-w-0">
                                   <p className="text-xs font-bold text-parchment truncate leading-none mb-1 uppercase tracking-wider">{item.name}</p>
                                   <p className="text-[9px] text-gray-600 truncate italic">Artefact récupéré</p>
                               </div>
                               <button onClick={() => removeItem(player.id, item.id)} className="text-red-900/30 hover:text-red-600 p-2 opacity-0 group-hover/item:opacity-100 transition-all rounded-full hover:bg-red-600/10">
                                   <Minus className="w-4 h-4" />
                               </button>
                            </div>
                          ))
                      )}
                   </div>
                </div>
              ))
        )}
      </div>

      <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black via-black/95 to-transparent pt-16">
        <div className="flex gap-3 bg-darker-metal p-1.5 rounded-xl border border-gold-dark/40 shadow-[0_0_30px_rgba(0,0,0,1)]">
            <input 
                type="text" 
                placeholder="Nom du héros..." 
                value={newPlayerName} 
                onChange={(e) => setNewPlayerName(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                className="flex-1 bg-transparent border-none px-4 py-3 text-sm text-parchment focus:ring-0 outline-none placeholder-gray-800 font-body" 
            />
            <button 
                onClick={addPlayer} 
                className="bg-blood-dark/30 text-gold-antique border border-gold-dark/40 px-6 rounded-lg transition-all hover:bg-blood-dark hover:text-white active:scale-95 shadow-lg"
            >
                <UserPlus className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default VirtualVault;
