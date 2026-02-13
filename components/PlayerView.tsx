
import React, { useState, useEffect } from 'react';
import { SessionState } from '../types';
import { Box, Coins, User, Shield, RefreshCw, Sparkles, Clock, CloudLightning, Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react';
import { initSupabase, subscribeToSession, getSessionFromCloud } from '../services/supabaseService';

// Helper pour le décodage Base64 compatible UTF-8
const atou = (str: string) => {
    try {
        return decodeURIComponent(atob(str).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    } catch(e) {
        return null;
    }
};

interface PlayerViewProps {
  data: string;
}

const PlayerView: React.FC<PlayerViewProps> = ({ data }) => {
  const [session, setSession] = useState<SessionState | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const startSession = async () => {
        try {
            setIsLoading(true);
            const decodedStr = atou(data);
            if (!decodedStr) throw new Error("Format de lien invalide.");
            
            const initialData = JSON.parse(decodedStr);

            if (initialData.cloudConfig) {
                initSupabase(initialData.cloudConfig.url, initialData.cloudConfig.key);
                setIsLive(true);
                
                const cloudSession = await getSessionFromCloud(initialData.id);
                if (cloudSession) {
                    setSession(cloudSession);
                } else {
                    setErrorMsg("Session Cloud introuvable. Demandez au MJ de renvoyer le lien.");
                }

                subscribeToSession(initialData.id, (updatedSession) => {
                    setSession(updatedSession);
                });
            } else {
                setSession(initialData);
            }
        } catch (e: any) {
            console.error("Decoding error:", e);
            setErrorMsg(e.message || "Impossible de charger le Grimoire.");
        } finally {
            setIsLoading(false);
        }
    };

    startSession();
  }, [data]);

  if (isLoading) {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-gold-antique">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <p className="font-fantasy uppercase tracking-widest text-sm">Ouverture du Grimoire...</p>
        </div>
    );
  }

  if (errorMsg || !session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8 text-center">
        <div className="w-full max-w-sm p-8 border-2 border-blood-red/30 bg-darker-metal rounded-2xl shadow-glow-red">
           <AlertCircle className="w-12 h-12 text-blood-red mx-auto mb-4" />
           <h2 className="font-header text-gold-antique uppercase mb-2">Erreur de Magie</h2>
           <p className="text-xs text-parchment/60 leading-relaxed italic">{errorMsg || "Le lien semble expiré ou invalide."}</p>
           <button onClick={() => window.location.hash = ''} className="mt-8 w-full py-3 bg-blood-dark/50 border border-blood-red/30 rounded text-[10px] text-parchment uppercase tracking-widest font-bold">Retourner à l'Auberge</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-parchment font-body pb-12 overflow-x-hidden">
      
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] uppercase font-bold tracking-widest backdrop-blur-md transition-all ${isLive ? 'bg-green-900/20 border-green-500/40 text-green-400' : 'bg-gold-dark/10 border-gold-dark/30 text-gold-antique'}`}>
              {isLive ? <Wifi className="w-3 h-3 animate-pulse shadow-[0_0_5px_#22c55e]" /> : <WifiOff className="w-3 h-3" />}
              {isLive ? 'Synchro Magique Active' : 'Mode Hors-Ligne'}
          </div>
      </div>

      <div className="relative h-48 bg-blood-dark flex flex-col items-center justify-center border-b-2 border-gold-dark/40 shadow-2xl">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')]"></div>
        <div className="relative z-10 text-center px-4">
            <span className="text-[10px] uppercase tracking-[0.4em] text-gold-antique/60 mb-1 block">Grimoire de Session</span>
            <h1 className="font-header text-2xl text-gold-antique uppercase tracking-widest drop-shadow-md">{session.name}</h1>
            <div className="h-0.5 w-16 bg-gold-dark/50 mx-auto mt-3"></div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-10 relative z-20 space-y-6">
        {session.players.length === 0 ? (
            <div className="bg-darker-metal p-12 rounded-2xl border border-dashed border-white/5 text-center">
                <User className="w-12 h-12 text-gray-800 mx-auto mb-4 opacity-20" />
                <p className="text-xs text-gray-700 uppercase font-bold">Aucun héros détecté</p>
            </div>
        ) : (
            session.players.map(player => (
            <div key={player.id} className="bg-darker-metal border-2 border-gold-dark/30 rounded-2xl overflow-hidden shadow-2xl animate-fade-in">
                <div className="p-4 bg-black/60 border-b border-gold-dark/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gold-dark/10 border border-gold-dark/30 flex items-center justify-center">
                            <User className="w-5 h-5 text-gold-antique" />
                        </div>
                        <span className="font-header text-lg text-gold-antique uppercase">{player.name}</span>
                    </div>
                    <Shield className="w-5 h-5 text-blood-red/40" />
                </div>

                <div className="p-4 bg-gold-dark/5 grid grid-cols-3 gap-3">
                    <div className="bg-black/40 p-3 rounded-xl border border-yellow-600/30 text-center shadow-inner">
                        <span className="block text-xl font-bold text-yellow-500 leading-none mb-1">{player.currency.gold}</span>
                        <span className="text-[9px] uppercase font-bold text-yellow-600/60 tracking-tighter">Gold (PO)</span>
                    </div>
                    <div className="bg-black/40 p-3 rounded-xl border border-gray-400/30 text-center shadow-inner">
                        <span className="block text-xl font-bold text-gray-300 leading-none mb-1">{player.currency.silver}</span>
                        <span className="text-[9px] uppercase font-bold text-gray-400/60 tracking-tighter">Ar (PA)</span>
                    </div>
                    <div className="bg-black/40 p-3 rounded-xl border border-orange-700/30 text-center shadow-inner">
                        <span className="block text-xl font-bold text-orange-600 leading-none mb-1">{player.currency.copper}</span>
                        <span className="text-[9px] uppercase font-bold text-orange-700/60 tracking-tighter">Cu (PC)</span>
                    </div>
                </div>

                <div className="p-5 space-y-3 bg-black/20">
                    <h4 className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gold-dark/60 font-bold mb-4 border-b border-white/5 pb-2">
                        <Box className="w-3.5 h-3.5" /> Sac de l'aventurier
                    </h4>
                    {player.inventory.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                            {player.inventory.map(item => (
                                <div key={item.id} className="bg-white/5 border border-white/5 rounded-xl p-3 flex gap-4 items-center animate-fade-in group">
                                    <div className="w-14 h-14 rounded-lg bg-black/60 flex items-center justify-center shrink-0 border border-gold-dark/20 overflow-hidden shadow-lg">
                                        {item.imageUrl ? (
                                            <img src={item.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={item.name} />
                                        ) : (
                                            <Box className="w-6 h-6 text-gray-700" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-header text-sm text-gold-antique uppercase truncate leading-tight mb-1">{item.name}</p>
                                        <p className="text-[10px] text-parchment/40 line-clamp-2 italic font-body">{item.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 opacity-20 italic text-xs">Le sac est vide...</div>
                    )}
                </div>
            </div>
            ))
        )}
        
        <p className="text-center text-[9px] text-gray-700 uppercase tracking-widest font-header pt-8 opacity-40">
            Propulsé par D&D Action Narrator
        </p>
      </div>
    </div>
  );
};

export default PlayerView;
