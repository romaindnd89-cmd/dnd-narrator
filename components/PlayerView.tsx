
import React, { useState, useEffect } from 'react';
import { SessionState } from '../types';
import { Box, User, Wifi, WifiOff, Loader2, Sparkles, Wand2, Skull } from 'lucide-react';
import { initSupabase, subscribeToSession, getSessionFromCloud } from '../services/supabaseService';

const atou = (str: string) => {
    try {
        return decodeURIComponent(atob(str).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    } catch(e) { return null; }
};

interface PlayerViewProps {
  data: string;
}

const PlayerView: React.FC<PlayerViewProps> = ({ data }) => {
  const [session, setSession] = useState<SessionState | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const startSession = async () => {
        try {
            const decodedStr = atou(data);
            if (!decodedStr) return;
            const initialData = JSON.parse(decodedStr);

            if (initialData.cloudConfig) {
                initSupabase(initialData.cloudConfig.url, initialData.cloudConfig.key);
                setIsLive(true);
                const cloudSession = await getSessionFromCloud(initialData.id);
                if (cloudSession) setSession(cloudSession);
                subscribeToSession(initialData.id, (updatedSession) => setSession(updatedSession));
            } else {
                setSession(initialData);
            }
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };
    startSession();
  }, [data]);

  if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center text-gold-antique"><Loader2 className="animate-spin mr-2" /> Ouverture...</div>;
  if (!session) return <div className="min-h-screen bg-black flex items-center justify-center text-red-500">Lien invalide.</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-parchment font-body pb-12 overflow-x-hidden">
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className={`px-4 py-1 rounded-full border text-[9px] uppercase font-bold tracking-widest backdrop-blur-md flex items-center gap-2 ${isLive ? 'bg-green-900/20 border-green-500/40 text-green-400' : 'bg-gold-dark/10 border-gold-dark/30 text-gold-antique'}`}>
              {isLive ? <Wifi className="w-3 h-3 animate-pulse" /> : <WifiOff className="w-3 h-3" />}
              {isLive ? 'Live' : 'Statique'}
          </div>
      </div>

      <div className="h-40 bg-blood-dark flex items-center justify-center border-b-2 border-gold-dark/40 shadow-2xl">
        <h1 className="font-header text-3xl text-gold-antique uppercase tracking-[0.3em]">{session.name}</h1>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-8 space-y-6">
        {session.players.map(player => (
            <div key={player.id} className="bg-darker-metal border-2 rounded-2xl overflow-hidden border-gold-dark/30 shadow-2xl">
                <div className="p-4 border-b bg-black/60 border-gold-dark/20 flex items-center gap-3">
                    <User className="w-5 h-5 text-gold-dark" />
                    <span className="font-header text-lg uppercase text-gold-antique">{player.name}</span>
                </div>

                {player.conditions?.length > 0 && (
                    <div className="p-4 bg-black/40 border-b border-white/5 space-y-2">
                        {player.conditions.map(c => (
                            <div key={c.id} className={`p-3 rounded-lg border flex items-center gap-3 ${c.isPenalty ? 'bg-blood-red/10 text-blood-red animate-neon-heartbeat' : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]'}`}>
                                {c.isPenalty ? <Skull className="w-4 h-4"/> : <Wand2 className="w-4 h-4"/>}
                                <div>
                                    <p className="text-[10px] font-bold uppercase">{c.name}</p>
                                    <p className="text-[9px] italic opacity-80">{c.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="p-4 bg-gold-dark/5 grid grid-cols-3 gap-2 border-b border-white/5">
                    <div className="text-center p-2 bg-black/40 rounded border border-yellow-600/30">
                        <span className="block text-xl font-bold text-yellow-500">{player.currency.gold}</span>
                        <span className="text-[7px] uppercase font-bold text-yellow-600/60 tracking-widest">Or</span>
                    </div>
                    <div className="text-center p-2 bg-black/40 rounded border border-gray-400/30">
                        <span className="block text-xl font-bold text-gray-300">{player.currency.silver}</span>
                        <span className="text-[7px] uppercase font-bold text-gray-400/60 tracking-widest">Argent</span>
                    </div>
                    <div className="text-center p-2 bg-black/40 rounded border border-orange-700/30">
                        <span className="block text-xl font-bold text-orange-600">{player.currency.copper}</span>
                        <span className="text-[7px] uppercase font-bold text-orange-700/60 tracking-widest">Cuivre</span>
                    </div>
                </div>

                <div className="p-5 space-y-3 bg-black/20">
                    <h4 className="text-[9px] uppercase tracking-widest text-gold-dark/60 font-bold mb-4">Inventaire</h4>
                    {player.inventory?.map(item => (
                        <div key={item.id} className={`bg-white/5 border rounded-xl p-3 flex gap-4 items-center ${item.isPenalty ? 'bg-blood-red/5 animate-neon-heartbeat' : 'border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_15px_rgba(52,211,153,0.4)]'}`}>
                            <div className="w-12 h-12 rounded bg-black/60 flex items-center justify-center shrink-0 border border-white/10 overflow-hidden">
                                {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <Box className={`w-6 h-6 ${item.isPenalty ? 'text-blood-red' : 'text-gold-antique'}`} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`font-header text-sm uppercase truncate ${item.isPenalty ? 'text-blood-red' : 'text-gold-antique'}`}>{item.name} x{item.quantity}</p>
                                <p className="text-[9px] italic text-parchment/60 line-clamp-1">{item.description}</p>
                            </div>
                        </div>
                    ))}
                    {(!player.inventory || player.inventory.length === 0) && <p className="text-[10px] text-center opacity-20 py-4 italic">Sac vide...</p>}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerView;
