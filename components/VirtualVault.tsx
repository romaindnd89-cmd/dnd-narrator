
import React, { useState, useEffect } from 'react';
import { Player, SessionState, Currency, VaultItem, PlayerCondition } from '../types';
import { Users, UserPlus, Trash2, Briefcase, Minus, ShieldX, User, Box, QrCode, CloudLightning, Sparkles, X, PlusCircle, Plus, ChevronDown, ChevronUp, AlertTriangle, Skull, ShieldCheck, Wand2, CloudOff, HelpCircle, Database, Copy, ExternalLink, Check, Loader2, Key, Play, CircleDot } from 'lucide-react';
import { initSupabase, saveSessionToCloud } from '../services/supabaseService';
import { generateCharacterImage } from '../services/geminiService';
import QRCode from 'qrcode';

const utoa = (str: string) => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode(parseInt(p1, 16))));

interface VirtualVaultProps {
  session: SessionState;
  onUpdateSession: (session: SessionState) => void;
  onReset: () => void;
}

const VirtualVault: React.FC<VirtualVaultProps> = ({ session, onUpdateSession, onReset }) => {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false); // État pour le tuto Supabase
  const [copied, setCopied] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  
  const [addingToPlayerId, setAddingToPlayerId] = useState<string | null>(null);
  const [manualItemName, setManualItemName] = useState('');
  const [isPenaltyManual, setIsPenaltyManual] = useState(false);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);

  // Supabase Config State
  const [supabaseUrl, setSupabaseUrl] = useState(localStorage.getItem('dnd_supabase_url') || '');
  const [supabaseKey, setSupabaseKey] = useState(localStorage.getItem('dnd_supabase_key') || '');
  const [isCloudConnected, setIsCloudConnected] = useState(!!localStorage.getItem('dnd_supabase_url'));

  useEffect(() => {
    const cloudUrl = localStorage.getItem('dnd_supabase_url');
    const cloudKey = localStorage.getItem('dnd_supabase_key');
    if (cloudUrl && cloudKey) {
        initSupabase(cloudUrl, cloudKey);
        saveSessionToCloud(session);
        setIsCloudConnected(true);
    }
  }, [session]);

  const shareLink = (() => {
    const baseUrl = window.location.origin + window.location.pathname;
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    // Si connecté au cloud, on passe les infos de connexion pour que le joueur se connecte en live
    const sessionData = isCloudConnected ? {
        id: session.id,
        name: session.name,
        cloudConfig: { url: supabaseUrl, key: supabaseKey }
    } : session;

    return `${cleanBaseUrl}#/view/${utoa(JSON.stringify(sessionData))}`;
  })();

  useEffect(() => {
      if (showShare && shareLink) {
          QRCode.toDataURL(shareLink, { 
              width: 250, 
              margin: 2, 
              color: { dark: '#000000', light: '#ffffff' } // Noir sur Blanc standard
          })
          .then(url => setQrCodeData(url))
          .catch(err => console.error(err));
      }
  }, [showShare, shareLink]);

  const handleCloudConnect = () => {
    if (supabaseUrl && supabaseKey) {
        localStorage.setItem('dnd_supabase_url', supabaseUrl);
        localStorage.setItem('dnd_supabase_key', supabaseKey);
        initSupabase(supabaseUrl, supabaseKey);
        saveSessionToCloud(session);
        setIsCloudConnected(true);
        setShowConfig(false);
    }
  };

  const handleCloudDisconnect = () => {
      localStorage.removeItem('dnd_supabase_url');
      localStorage.removeItem('dnd_supabase_key');
      setSupabaseUrl('');
      setSupabaseKey('');
      setIsCloudConnected(false);
      setShowConfig(false);
  };

  const addManualItem = async () => {
    if (!addingToPlayerId || !manualItemName.trim()) return;
    setIsGeneratingImg(true);
    let imageUrl = undefined;
    try { imageUrl = await generateCharacterImage(manualItemName); } catch (e) {}

    const newItem: VaultItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: manualItemName.trim(),
        description: isPenaltyManual ? "Effet négatif ou objet maudit." : "Objet d'inventaire.",
        quantity: 1,
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

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopySql = async () => {
    const sql = `-- 1. Crée la table\ncreate table if not exists sessions (\n  id text primary key,\n  data jsonb,\n  updated_at timestamp with time zone default timezone('utc'::text, now())\n);\n\n-- 2. Autorise l'accès (Désactive RLS)\nalter table sessions disable row level security;\n\n-- 3. Active le Temps Réel (Live)\nalter publication supabase_realtime add table sessions;`;
    await navigator.clipboard.writeText(sql);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    onUpdateSession({ ...session, players: [...session.players, { id: Math.random().toString(36).substr(2, 9), name: newPlayerName.trim(), currency: { copper: 0, silver: 0, gold: 0 }, inventory: [], conditions: [] }] });
    setNewPlayerName('');
  };

  const updateCurrency = (playerId: string, type: keyof Currency, amount: number) => {
    onUpdateSession({ 
      ...session, 
      players: session.players.map(p => { 
        if (p.id !== playerId) return p; 
        
        let copper = p.currency.copper || 0;
        let silver = p.currency.silver || 0;
        let gold = p.currency.gold || 0;

        if (type === 'copper') copper += amount;
        else if (type === 'silver') silver += amount;
        else if (type === 'gold') gold += amount;

        // Conversion vers le haut
        while (copper >= 10) {
            copper -= 10;
            silver += 1;
        }
        while (silver >= 10) {
            silver -= 10;
            gold += 1;
        }

        // Conversion vers le bas
        while (copper < 0 && (silver > 0 || gold > 0)) {
            if (silver > 0) {
                silver -= 1;
                copper += 10;
            } else if (gold > 0) {
                gold -= 1;
                silver += 9;
                copper += 10;
            }
        }
        while (silver < 0 && gold > 0) {
            gold -= 1;
            silver += 10;
        }

        // Plancher à 0
        if (copper < 0) copper = 0;
        if (silver < 0) silver = 0;
        if (gold < 0) gold = 0;

        return { ...p, currency: { copper, silver, gold } }; 
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

  if (!session.isActive) {
    return (
      <div className="h-full flex flex-col bg-darker-metal border-2 border-gold-dark/20 rounded-lg p-10 text-center items-center justify-center">
        <Briefcase className="w-16 h-16 text-gold-antique mb-6" />
        <button onClick={() => onUpdateSession({ ...session, isActive: true })} className="w-full py-4 bg-blood-dark text-gold-antique font-header border border-gold-dark/50 rounded shadow-glow-red">Ouvrir le Coffre</button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-darker-metal border-2 border-gold-dark/30 rounded-lg overflow-hidden shadow-2xl relative">
      <div className="px-5 py-3 border-b border-gold-dark/30 bg-black/60 flex items-center justify-between">
        <h3 className="font-header text-xs text-gold-antique uppercase flex items-center gap-2"><Briefcase className="w-4 h-4" /> Coffre MJ</h3>
        <div className="flex gap-2">
            <button onClick={() => setShowConfig(true)} className={`p-2 transition-colors ${isCloudConnected ? 'text-emerald-400 hover:text-emerald-300' : 'text-gray-600 hover:text-white'}`}>
                {isCloudConnected ? <CloudLightning className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
            </button>
            <button onClick={() => setShowShare(!showShare)} className="p-2 text-gray-500 hover:text-white"><QrCode className="w-4 h-4" /></button>
            <button onClick={onReset} className="p-2 text-gray-700 hover:text-red-500"><ShieldX className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {session.players.map(player => (
            <div key={player.id} className="bg-black/40 border border-gold-dark/20 rounded-xl overflow-hidden">
                <div className="p-3 border-b border-gold-dark/10 flex justify-between items-center bg-gold-dark/5">
                    <span className="font-header text-[11px] uppercase text-gold-antique">{player.name}</span>
                    <div className="flex gap-2">
                        <button onClick={() => setAddingToPlayerId(player.id)} className="p-1 text-gold-dark hover:text-gold-antique"><PlusCircle className="w-4 h-4" /></button>
                        <button onClick={() => onUpdateSession({ ...session, players: session.players.filter(p => p.id !== player.id) })} className="p-1 text-gray-700 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                    </div>
                </div>

                {/* CONDITIONS */}
                {player.conditions?.length > 0 && (
                    <div className="p-2 space-y-1">
                        {player.conditions.map(c => (
                            <div key={c.id} className={`p-2 rounded border text-[9px] flex justify-between items-center ${c.isPenalty ? 'bg-blood-red/10 text-blood-red animate-neon-heartbeat' : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.4)]'}`}>
                                <span className="font-bold uppercase flex items-center gap-1">
                                    {c.isPenalty ? <Skull className="w-2 h-2"/> : <Wand2 className="w-2 h-2"/>}
                                    {c.name}
                                </span>
                                <button onClick={() => removeCondition(player.id, c.id)}><X className="w-3 h-3"/></button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="p-3 grid grid-cols-3 gap-1">
                    {['gold', 'silver', 'copper'].map(coin => {
                        const colorClass = coin === 'gold' ? 'text-yellow-400 drop-shadow-[0_0_2px_rgba(250,204,21,0.8)]' : 
                                           coin === 'silver' ? 'text-gray-300 drop-shadow-[0_0_2px_rgba(209,213,219,0.8)]' : 
                                           'text-orange-400 drop-shadow-[0_0_2px_rgba(251,146,60,0.8)]';
                        return (
                            <div key={coin} className="bg-black/40 p-1.5 rounded text-center border border-white/5 flex flex-col items-center justify-center">
                                <div className="flex items-center justify-center gap-1.5 mb-1">
                                    <CircleDot className={`w-3 h-3 ${colorClass}`} />
                                    <span className={`text-[11px] font-bold ${colorClass}`}>{(player.currency as any)[coin]}</span>
                                </div>
                                <div className="flex justify-center gap-3 w-full bg-black/20 rounded">
                                    <button onClick={() => updateCurrency(player.id, coin as any, -1)} className="text-[10px] text-gray-500 hover:text-red-400 px-2 py-0.5 font-bold">-</button>
                                    <button onClick={() => updateCurrency(player.id, coin as any, 1)} className="text-[10px] text-gray-500 hover:text-green-400 px-2 py-0.5 font-bold">+</button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* INVENTAIRE */}
                <div className="px-3 pb-3 space-y-1">
                    {player.inventory?.map(item => (
                        <div key={item.id} className={`flex flex-col rounded border ${item.isPenalty ? 'bg-blood-red/5 animate-neon-heartbeat' : 'border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_10px_rgba(52,211,153,0.3)]'}`}>
                            <div className="flex items-center gap-2 p-2 cursor-pointer" onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}>
                                <div className="w-6 h-6 rounded bg-black/60 shrink-0 border border-white/10 overflow-hidden">
                                    {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <Box className={`w-3 h-3 mx-auto mt-1.5 ${item.isPenalty ? 'text-blood-red' : 'text-emerald-400'}`} />}
                                </div>
                                <span className={`text-[9px] font-bold uppercase flex-1 truncate ${item.isPenalty ? 'text-blood-red' : 'text-emerald-400'}`}>
                                    {item.isPenalty && <AlertTriangle className="w-2 h-2 inline mr-1" />}
                                    {item.name} x{item.quantity}
                                </span>
                                <button onClick={(e) => { e.stopPropagation(); updateItemQty(player.id, item.id, -1); }} className="text-gray-600 hover:text-red-500"><Minus className="w-3 h-3"/></button>
                            </div>
                            
                            {expandedItemId === item.id && (
                                <div className="px-2 pb-2 text-[9px] text-parchment/70 italic border-t border-white/5 pt-1 mx-2 max-h-24 overflow-y-auto">
                                    {item.description || "Aucune description disponible."}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        ))}
      </div>

      <div className="p-4 border-t border-gold-dark/20 bg-black/60">
        <div className="flex gap-2">
            <input type="text" placeholder="Héros..." value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} className="flex-1 bg-black/40 border border-gold-dark/30 rounded px-3 py-2 text-xs text-parchment outline-none" />
            <button onClick={addPlayer} className="bg-gold-dark/20 text-gold-antique p-2 rounded hover:bg-gold-dark/40"><UserPlus className="w-4 h-4" /></button>
        </div>
      </div>

      {showShare && (
          <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-6 z-50 animate-fade-in">
              <h4 className="font-header text-gold-antique mb-4 uppercase tracking-widest text-xs">Lien Joueurs {isCloudConnected ? '(LIVE)' : '(STATIQUE)'}</h4>
              <div className="bg-white p-2 rounded-lg mb-4">
                  {qrCodeData ? <img src={qrCodeData} alt="QR Code" className="w-48 h-48" /> : <Loader2 className="w-10 h-10 text-black animate-spin" />}
              </div>
              <button onClick={handleCopy} className={`py-3 px-8 border rounded uppercase text-[10px] tracking-widest mb-2 ${isCloudConnected ? 'bg-emerald-900/20 text-emerald-400 border-emerald-500/50' : 'bg-gold-dark/20 text-gold-antique border-gold-dark/50'}`}>{copied ? 'Lien Copié !' : 'Copier le Lien'}</button>
              <button onClick={() => setShowShare(false)} className="mt-2 text-gray-500 text-[10px] uppercase font-bold">Fermer</button>
          </div>
      )}

      {showConfig && (
        <div className="absolute inset-0 bg-black/95 flex flex-col z-50 animate-fade-in overflow-y-auto no-scrollbar">
            <div className="p-6 flex flex-col min-h-full">
                
                {/* Header Config */}
                <div className="flex items-center justify-between mb-6 border-b border-gold-dark/20 pb-4 shrink-0">
                    <h4 className="text-gold-antique font-header text-sm uppercase tracking-widest flex items-center gap-2">
                        <CloudLightning className="w-4 h-4" /> Cloud Sync
                    </h4>
                    <button onClick={() => setShowConfig(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5"/></button>
                </div>
                
                {!showTutorial ? (
                    /* FORMULAIRE DE CONNEXION */
                    <div className="space-y-5 animate-fade-in">
                        <p className="text-[10px] text-gray-400 leading-relaxed bg-blue-900/10 border border-blue-500/20 p-3 rounded">
                            Synchronisez votre session en temps réel avec Supabase. Les joueurs verront les changements instantanément (inventaire, PV, or).
                        </p>

                        <div className="space-y-2">
                            <label className="text-[9px] uppercase font-bold text-gray-500 flex items-center gap-2">
                                <Database className="w-3 h-3"/> URL du Projet
                            </label>
                            <input 
                                type="text" 
                                value={supabaseUrl} 
                                onChange={e => setSupabaseUrl(e.target.value)} 
                                placeholder="https://xyz.supabase.co" 
                                className="w-full bg-black border border-gold-dark/30 rounded p-3 text-xs text-parchment outline-none focus:border-gold-antique font-mono" 
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] uppercase font-bold text-gray-500 flex items-center gap-2">
                                <Key className="w-3 h-3"/> Clé API Publique (Anon)
                            </label>
                            <input 
                                type="password" 
                                value={supabaseKey} 
                                onChange={e => setSupabaseKey(e.target.value)} 
                                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..." 
                                className="w-full bg-black border border-gold-dark/30 rounded p-3 text-xs text-parchment outline-none focus:border-gold-antique font-mono" 
                            />
                        </div>

                        <div className="pt-2 flex flex-col gap-3">
                            <button onClick={handleCloudConnect} className="w-full py-3 bg-emerald-900/30 border border-emerald-500/50 text-emerald-400 font-header text-xs rounded shadow-lg uppercase tracking-widest hover:bg-emerald-900/50 transition-all flex items-center justify-center gap-2">
                                <CloudLightning className="w-4 h-4" /> Activer le Nuage
                            </button>
                            
                            {isCloudConnected && (
                                <button onClick={handleCloudDisconnect} className="w-full py-2 bg-red-900/20 text-red-400 font-header text-[9px] rounded uppercase tracking-widest hover:bg-red-900/40 transition-all">
                                    Déconnecter
                                </button>
                            )}

                            <div className="w-full h-px bg-white/10 my-1"></div>

                            <button onClick={() => setShowTutorial(true)} className="flex items-center justify-center gap-2 text-gold-dark hover:text-gold-antique text-[10px] uppercase font-bold tracking-widest transition-colors py-2">
                                <HelpCircle className="w-4 h-4" /> Comment obtenir ces clés ?
                            </button>
                        </div>
                    </div>
                ) : (
                    /* TUTORIEL SUPABASE */
                    <div className="space-y-6 animate-fade-in pb-8">
                        <div className="flex items-center gap-2 text-gold-antique text-xs uppercase font-bold border-b border-gold-dark/20 pb-2">
                            <HelpCircle className="w-4 h-4" /> Guide de Configuration
                        </div>

                        {/* Étape 1 */}
                        <div className="space-y-2">
                            <h5 className="text-[10px] font-bold text-white uppercase flex items-center gap-2">
                                <span className="bg-gold-dark text-black rounded-full w-4 h-4 flex items-center justify-center text-[9px]">1</span> Créer un Projet
                            </h5>
                            <p className="text-[10px] text-gray-400 pl-6">
                                Allez sur <a href="https://supabase.com" target="_blank" className="text-blue-400 hover:underline">supabase.com</a>, créez un compte et un nouveau projet gratuit.
                            </p>
                        </div>

                        {/* Étape 2 */}
                        <div className="space-y-2">
                            <h5 className="text-[10px] font-bold text-white uppercase flex items-center gap-2">
                                <span className="bg-gold-dark text-black rounded-full w-4 h-4 flex items-center justify-center text-[9px]">2</span> Créer la Table (SQL)
                            </h5>
                            <p className="text-[10px] text-gray-400 pl-6">
                                Allez dans l'onglet <strong>SQL Editor</strong> (à gauche), collez le code ci-dessous, puis cliquez sur le bouton <strong className="text-emerald-400 flex items-center gap-1 inline-flex border border-emerald-500/30 px-1 rounded bg-emerald-900/20"><Play className="w-2 h-2"/> RUN</strong>.
                            </p>
                            <div className="ml-6 bg-black border border-gray-700 rounded p-2 relative group">
                                <code className="text-[9px] font-mono text-green-400 block whitespace-pre-wrap">
                                    {`-- 1. Crée la table\ncreate table if not exists sessions (\n  id text primary key,\n  data jsonb,\n  updated_at timestamp with time zone default timezone('utc'::text, now())\n);\n\n-- 2. Autorise l'accès (Désactive RLS)\nalter table sessions disable row level security;\n\n-- 3. Active le Temps Réel (Live)\nalter publication supabase_realtime add table sessions;`}
                                </code>
                                <button 
                                    onClick={handleCopySql} 
                                    className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded text-white transition-colors"
                                    title="Copier le SQL"
                                >
                                    {sqlCopied ? <Check className="w-3 h-3 text-green-400"/> : <Copy className="w-3 h-3"/>}
                                </button>
                            </div>
                        </div>

                        {/* Étape 3 */}
                        <div className="space-y-2">
                            <h5 className="text-[10px] font-bold text-white uppercase flex items-center gap-2">
                                <span className="bg-gold-dark text-black rounded-full w-4 h-4 flex items-center justify-center text-[9px]">3</span> Récupérer les Clés
                            </h5>
                            <p className="text-[10px] text-gray-400 pl-6">
                                Allez dans <strong>Project Settings {'>'} API</strong>.<br/>
                                Copiez l'<strong>URL</strong> et la clé <strong>anon public</strong> dans le formulaire précédent.
                            </p>
                        </div>

                        <button onClick={() => setShowTutorial(false)} className="w-full py-3 bg-gold-dark/20 border border-gold-dark/50 text-gold-antique font-header text-xs rounded uppercase tracking-widest hover:bg-gold-dark/30 transition-all mt-4">
                            J'ai compris, retour
                        </button>
                    </div>
                )}
            </div>
        </div>
      )}

      {addingToPlayerId && (
          <div className="absolute inset-0 bg-black/98 flex flex-col items-center justify-center p-6 z-50">
              <div className="w-full max-w-xs space-y-4">
                  <h4 className="text-gold-antique font-header text-xs text-center uppercase tracking-widest border-b border-gold-dark/20 pb-2">Ajout d'Objet</h4>
                  <input type="text" value={manualItemName} onChange={e => setManualItemName(e.target.value)} placeholder="Nom de l'objet..." className="w-full bg-black border border-gold-dark/30 rounded p-3 text-xs text-parchment outline-none" />
                  <label className="flex items-center gap-3 text-[10px] text-gray-400 uppercase cursor-pointer font-bold">
                      <input type="checkbox" checked={isPenaltyManual} onChange={e => setIsPenaltyManual(e.target.checked)} className="accent-blood-red" /> Est-ce un Malus ?
                  </label>
                  <button onClick={addManualItem} disabled={isGeneratingImg} className="w-full py-4 bg-gold-dark/20 border border-gold-antique text-gold-antique font-header text-xs rounded shadow-lg">
                      {isGeneratingImg ? 'Création Magique...' : 'Ajouter au Sac'}
                  </button>
                  <button onClick={() => setAddingToPlayerId(null)} className="w-full text-gray-600 uppercase text-[9px] font-bold tracking-widest">Annuler</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default VirtualVault;
