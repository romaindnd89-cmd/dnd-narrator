
import React, { useState, useEffect } from 'react';
import { SessionState } from '../types';
import { Box, User, Shield, Wifi, WifiOff, Loader2, AlertCircle, Zap, AlertTriangle, Skull, Sparkles, Wand2 } from 'lucide-react';
import { initSupabase, subscribeToSession, getSessionFromCloud } from '../services/supabaseService';

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
                if (cloudSession) setSession(cloudSession);
                else setErrorMsg("Session Cloud introuvable.");
                subscribeToSession(initialData.id, (updatedSession) => setSession(updatedSession));
            } else {
                setSession(initialData);
            }
        } catch (e: any) {
            setErrorMsg(e.message || "Erreur de chargement.");
        } finally {
            setIsLoading(false);
        }
    };
    startSession();
  }, [data]);

  if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center text-gold-antique"><Loader2 className="animate-spin mr-2" /> Ouverture du grimoire...</div>;
  if (!session) return <div className="min-h-screen bg-black flex items-center justify-center text-red-500">Erreur critique : lien corrompu.</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-parchment font-body pb-12 overflow-x-hidden">
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] uppercase font-bold tracking-widest backdrop-blur-md ${isLive ? 'bg-green-900/20 border-green-500/40 text-green-400' : 'bg-gold-dark/10 border-gold-dark/30 text-gold-antique'}`}>
              {isLive ? <Wifi className="w-3 h-3 animate-pulse" /> : <WifiOff className="w-3 h-3" />}
              {isLive ? 'Synchro Live' : 'Hors-Ligne'}
          </div>
      </div>

      <div className="h-48 bg-blood-dark flex flex-col items-center justify-center border-b-2 border-gold-dark/40 shadow-2xl relative">
        <div className="absolute inset-0 bg-black/40"></div>
        <h1 className="font-header text-3xl md:text-5xl text-gold-antique uppercase tracking-[0.3em] relative z-10 drop-shadow-glow">{session.name}</h1>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-10 space-y-8 relative z-20 pb-20">
        {session.players.map(player => {
            const hasConditions = player.conditions && player.conditions.length > 0;
            return (
                <div key={player.id} className={`bg-darker-metal border-2 rounded-2xl overflow-hidden shadow-[0_10px_50px_rgba(0,0,0,0.8)] transition-all ${hasConditions ? 'border-gold-antique' : 'border-gold-dark/30'}`}>
                    <div className={`p-5 border-b flex items-center justify-between bg-black/60 border-gold-dark/20`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full border bg-gold-dark/10 border-gold-dark/20`}>
                                <User className="w-5 h-5 text-gold-dark" />
                            </div>
                            <span className={`font-header text-xl uppercase tracking-widest text-gold-antique`}>{player.name}</span>
                        </div>
                    </div>

                    {/* ÉTATS ACTIFS (CONDITIONS) */}
                    {hasConditions && (
                        <div className="p-5 bg-black/40 border-b border-white/5 space-y-3">
                            <h4 className="text-[9px] uppercase tracking-[0.3em] text-gold-dark font-bold flex items-center gap-2">
                                <Sparkles className="w-3 h-3" /> États & Effets Actifs
                            </h4>
                            {player.conditions.map(c => {
                                const isMalus = c.isPenalty;
                                return (
                                    <div key={c.id} className={`p-4 bg-black/40 border rounded-xl relative overflow-hidden group transition-all ${isMalus ? 'border-blood-red/40' : 'border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]'}`}>
                                        <div className={`absolute inset-0 bg-gradient-to-r ${isMalus ? 'from-blood-red/10' : 'from-emerald-500/10'} to-transparent`}></div>
                                        <div className="relative z-10 flex items-start gap-3">
                                            {isMalus ? <Skull className="w-5 h-5 text-blood-red mt-1 shrink-0 animate-pulse" /> : <Wand2 className="w-5 h-5 text-emerald-400 mt-1 shrink-0 animate-pulse" />}
                                            <div>
                                                <p className={`font-header text-xs uppercase tracking-widest mb-1 ${isMalus ? 'text-blood-red' : 'text-emerald-400'}`}>{c.name}</p>
                                                <p className="text-[11px] font-body italic text-parchment/80 leading-relaxed">{c.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="p-4 bg-gold-dark/5 grid grid-cols-3 gap-3 border-b border-white/5">
                        <div className="bg-black/40 p-4 rounded-xl border border-yellow-600/30 text-center shadow-inner">
                            <span className="block text-2xl font-bold text-yellow-500 leading-none mb-1">{player.currency.gold}</span>
                            <span className="text-[8px] uppercase font-bold text-yellow-600/60 tracking-widest">Or</span>
                        </div>
                        <div className="bg-black/40 p-4 rounded-xl border border-gray-400/30 text-center shadow-inner">
                            <span className="block text-2xl font-bold text-gray-300 leading-none mb-1">{player.currency.silver}</span>
                            <span className="text-[8px] uppercase font-bold text-gray-400/60 tracking-widest">Argent</span>
                        </div>
                        <div className="bg-black/40 p-4 rounded-xl border border-orange-700/30 text-center shadow-inner">
                            <span className="block text-2xl font-bold text-orange-600 leading-none mb-1">{player.currency.copper}</span>
                            <span className="text-[8px] uppercase font-bold text-orange-700/60 tracking-widest">Cuivre</span>
                        </div>
                    </div>

                    <div className="p-6 space-y-4 bg-black/20">
                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                            <h4 className="text-[10px] uppercase tracking-[0.3em] text-gold-dark/60 font-bold">Inventaire</h4>
                            <span className="text-[8px] text-white/20 uppercase tracking-widest">Sac de voyage</span>
                        </div>
                        
                        {(player.inventory && player.inventory.length > 0) ? (
                            player.inventory.map(item => (
                                <div key={item.id} className={`bg-white/5 border rounded-2xl p-4 flex gap-5 items-start shadow-xl transition-all ${item.isPenalty ? 'border-blood-red/40 bg-blood-red/5' : 'border-emerald-500/20 bg-emerald-500/5'}`}>
                                    <div className={`w-20 h-20 rounded-xl bg-black/60 flex items-center justify-center shrink-0 border overflow-hidden ${item.isPenalty ? 'border-blood-red shadow-glow-red/40' : 'border-emerald-500/40'}`}>
                                        {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" alt="" /> : <Box className={`w-10 h-10 ${item.isPenalty ? 'text-blood-red' : 'text-emerald-500'}`} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className={`font-header text-lg uppercase truncate tracking-wider ${item.isPenalty ? 'text-blood-red font-bold' : 'text-emerald-400 font-bold'}`}>
                                                {item.name}
                                            </p>
                                            <div className={`px-2 py-1 rounded-md border ${item.isPenalty ? 'bg-blood-red/20 border-blood-red/30' : 'bg-emerald-500/20 border-emerald-500/30'}`}>
                                                <span className={`text-[10px] font-header ${item.isPenalty ? 'text-blood-red' : 'text-emerald-400'}`}>x{item.quantity}</span>
                                            </div>
                                        </div>
                                        <div className={`p-3 rounded-lg border leading-relaxed ${item.isPenalty ? 'bg-blood-red/10 border-blood-red/20' : 'bg-black/40 border-white/5 shadow-inner'}`}>
                                            <p className={`text-[10px] md:text-[11px] italic font-body ${item.isPenalty ? 'text-blood-red/80' : 'text-parchment/80'}`}>{item.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-10 text-center opacity-20 flex flex-col items-center gap-4">
                                <Box className="w-12 h-12" />
                                <span className="text-[10px] font-header uppercase tracking-widest">Le sac est vide...</span>
                            </div>
                        )}
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default PlayerView;
