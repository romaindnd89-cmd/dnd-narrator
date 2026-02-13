
import React, { useState, useRef } from 'react';
import { Zap, Sparkles, Volume2, VolumeX, Loader2, Coins, AlertCircle, X, Key, CheckCircle2, XCircle, Eye, EyeOff, ScrollText, Skull, Wand2, Laugh } from 'lucide-react';
import { generateSpeech, generateCharacterImage } from '../services/geminiService';
import { SessionState, VaultItem, PlayerCondition } from '../types';

interface StoryBoxProps {
  narration: string | null;
  error: React.ReactNode | null;
  session: SessionState;
  onUpdateSession: (session: SessionState) => void;
  onClose: () => void;
}

const StoryBox: React.FC<StoryBoxProps> = ({ narration, error, session, onUpdateSession, onClose }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [loadingThumb, setLoadingThumb] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const stopAudio = () => {
    if (audioSourceRef.current) {
        try { audioSourceRef.current.stop(); } catch(e) {}
        audioSourceRef.current = null;
    }
    setIsSpeaking(false);
  };

  const handleSpeech = async () => {
    if (isSpeaking) { stopAudio(); return; }
    if (!narration) return;
    setIsBuffering(true);
    try {
        const audioBuffer = await generateSpeech(narration);
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => { setIsSpeaking(false); audioSourceRef.current = null; };
        audioSourceRef.current = source;
        setIsSpeaking(true);
        source.start(0);
    } catch (err) {
        console.error("TTS Error:", err);
    } finally { setIsBuffering(false); }
  };

  const addToPlayer = async (playerName: string, itemName: string, itemDesc: string, isPenalty: boolean) => {
    setLoadingThumb(itemName);
    try {
        const imageUrl = await generateCharacterImage(itemName);
        const newItem: VaultItem = {
            id: Math.random().toString(36).substr(2, 9),
            name: itemName,
            description: itemDesc,
            quantity: 1,
            imageUrl,
            isPenalty,
            timestamp: Date.now()
        };
        const player = session.players.find(p => p.name === playerName);
        if (player) {
            onUpdateSession({
                ...session,
                players: session.players.map(p => 
                    p.id === player.id ? { ...p, inventory: [newItem, ...p.inventory] } : p
                )
            });
        }
    } catch (e) { 
        console.error(e);
        const player = session.players.find(p => p.name === playerName);
        if (player) {
            const fallbackItem: VaultItem = {
                id: Math.random().toString(36).substr(2, 9),
                name: itemName,
                description: itemDesc,
                quantity: 1,
                isPenalty,
                timestamp: Date.now()
            };
            onUpdateSession({
                ...session,
                players: session.players.map(p => p.id === player.id ? { ...p, inventory: [fallbackItem, ...p.inventory] } : p)
            });
        }
    } finally { setLoadingThumb(null); }
  };

  const addConditionToPlayer = (playerName: string, conditionName: string, description: string, isPenalty: boolean) => {
    const newCondition: PlayerCondition = {
        id: Math.random().toString(36).substr(2, 9),
        name: conditionName,
        description,
        isPenalty,
        timestamp: Date.now()
    };
    onUpdateSession({
        ...session,
        players: session.players.map(p => 
            p.name === playerName ? { ...p, conditions: [newCondition, ...(p.conditions || [])] } : p
        )
    });
  };
  
  if (!narration && !error) return null;

  const formatText = (text: string) => {
    const lines = text.trim().split('\n').filter(line => line.trim() !== '');
    const renderedElements: React.ReactNode[] = [];
    
    let lastGeneralDescription = "Événement curieux.";
    let contextIsPenalty = false;

    lines.forEach((line, i) => {
      const cleanLine = line.trim();
      const upperLine = cleanLine.toUpperCase();

      const isLoot = upperLine.startsWith('CONTENU') || upperLine.startsWith('RÉCOMPENSE');
      const isTitle = upperLine.startsWith('NOM') || (i === 0 && cleanLine.length < 50);
      const isBonusEffect = upperLine.startsWith('EFFET [BONUS]');
      const isMalusEffect = upperLine.startsWith('EFFET [MALUS]');
      const isGeneralEffect = upperLine.startsWith('EFFET') && !isBonusEffect && !isMalusEffect;
      const isSolution = upperLine.startsWith('SOLUTION');
      const isSuccess = upperLine.startsWith('SUCCÈS') || upperLine.startsWith('REUSSITE');
      const isFailure = upperLine.startsWith('ÉCHEC') || upperLine.startsWith('ECHEC');
      const isDescription = upperLine.startsWith('DESCRIPTION');

      if (isFailure || isMalusEffect) contextIsPenalty = true;
      if (isSuccess || isDescription || isBonusEffect) contextIsPenalty = false;

      // RENDU TITRE
      if (isTitle) {
        const titleVal = cleanLine.includes(':') ? cleanLine.split(':').slice(1).join(':').trim() : cleanLine.replace(/\*\*/g, '');
        renderedElements.push(
          <div key={`title-${i}`} className="mb-10 mt-2 text-center">
            <h3 className="text-3xl md:text-5xl font-header tracking-widest drop-shadow-lg text-gold-antique">{titleVal}</h3>
            <div className="flex items-center justify-center gap-4 mt-6 opacity-30">
              <div className="h-px w-24 bg-gradient-to-r from-transparent to-gold-dark"></div>
              <Sparkles className="w-4 h-4 text-gold-dark" />
              <div className="h-px w-24 bg-gradient-to-l from-transparent to-gold-dark"></div>
            </div>
          </div>
        );
        return;
      }

      // RENDU DESCRIPTION
      if (isDescription) {
          const descContent = cleanLine.replace(/^(Description|Ambiance|Visuelle|Action)\s*:\s*/i, '').replace(/\*\*/g, '');
          lastGeneralDescription = descContent;
          renderedElements.push(
            <div key={`desc-${i}`} className="my-8 p-8 md:p-12 bg-white/[0.03] border border-white/5 rounded-2xl animate-fade-in group shadow-inner">
                <div className="flex items-center gap-3 mb-6 opacity-30 group-hover:opacity-100 transition-opacity">
                    <ScrollText className="w-5 h-5 text-gold-dark" />
                    <span className="text-[9px] uppercase tracking-[0.4em] text-gold-dark font-bold">Narration Rapide</span>
                </div>
                <p className="text-gold-antique/90 leading-relaxed text-xl md:text-3xl font-body italic text-center max-w-5xl mx-auto drop-shadow-sm">
                    {descContent}
                </p>
            </div>
          );
          return;
      }

      // RENDU DOUBLE EFFET (Bonus vs Malus)
      if (isBonusEffect || isMalusEffect) {
          const effectVal = cleanLine.split(':').slice(1).join(':').trim().replace(/\*\*/g, '');
          const isMalus = isMalusEffect;
          
          renderedElements.push(
            <div key={`effect-${i}`} className={`mt-6 p-6 border-2 rounded-xl font-fantasy animate-fade-in transition-all hover:scale-[1.01] ${isMalus ? 'bg-blood-dark/20 border-blood-red/40 text-blood-red shadow-glow-red' : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.15)]'}`}>
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-lg ${isMalus ? 'bg-blood-red/20' : 'bg-emerald-500/20'}`}>
                    {isMalus ? <Skull className="w-6 h-6 shrink-0 animate-pulse text-blood-red" /> : <Wand2 className="w-6 h-6 shrink-0 animate-pulse text-emerald-400" />}
                </div>
                <div className="flex-1">
                  <span className={`text-[9px] uppercase tracking-[0.3em] font-black mb-1 block ${isMalus ? 'text-blood-red' : 'text-emerald-400'}`}>
                    {isMalus ? 'Issue Négative (Malus)' : 'Issue Positive (Bonus)'}
                  </span>
                  <p className="text-lg md:text-2xl font-header tracking-widest text-white leading-tight mb-2">{effectVal}</p>
                </div>
              </div>
              
              <div className={`mt-4 pt-4 border-t flex flex-wrap gap-2 ${isMalus ? 'border-blood-red/20' : 'border-emerald-500/20'}`}>
                {session.players.map(p => (
                    <button 
                        key={p.id} 
                        onClick={() => addConditionToPlayer(p.name, isMalus ? "Maudit / Altéré" : "Béni / Amélioré", effectVal, isMalus)}
                        className={`px-4 py-2 border rounded-lg text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 font-bold ${isMalus ? 'bg-blood-red/10 border-blood-red/30 text-blood-red hover:bg-blood-red/30' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30'}`}
                    >
                        {isMalus ? <Skull className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />} {p.name}
                    </button>
                ))}
              </div>
            </div>
          );
          return;
      }

      // RENDU EFFET GÉNÉRAL (SI PAS DE DOUBLE CHOIX)
      if (isGeneralEffect) {
          const effectVal = cleanLine.split(':').slice(1).join(':').trim().replace(/\*\*/g, '');
          const isMalus = effectVal.toUpperCase().includes('[MALUS]');
          const cleanEffect = effectVal.replace('[MALUS]', '').trim();

          renderedElements.push(
            <div key={`geffect-${i}`} className={`mt-8 p-6 border-2 rounded-xl font-fantasy animate-fade-in ${isMalus ? 'bg-blood-dark/20 border-blood-red/40 text-blood-red shadow-glow-red' : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]'}`}>
               <div className="flex items-center gap-3 mb-4">
                  {isMalus ? <Skull className="w-5 h-5 text-blood-red" /> : <Zap className="w-5 h-5 text-emerald-400" />}
                  <span className={`text-[10px] uppercase font-bold tracking-widest ${isMalus ? 'text-blood-red' : 'text-emerald-400'}`}>{isMalus ? 'Malus Détecté' : 'Effet Actif'}</span>
               </div>
               <p className="text-xl font-header text-white">{cleanEffect}</p>
            </div>
          );
          return;
      }

      // RENDU BUTIN
      if (isLoot) {
          const lootVal = cleanLine.includes(':') ? cleanLine.split(':').slice(1).join(':').trim() : cleanLine.replace(/\*\*/g, '');
          const currentPenalty = contextIsPenalty || lootVal.toUpperCase().includes('[MALUS]');
          
          renderedElements.push(
              <div key={`loot-${i}`} className={`mt-8 p-6 bg-black/60 border-2 rounded-xl font-fantasy flex flex-col md:flex-row items-center md:items-start gap-5 animate-fade-in shadow-2xl relative ${currentPenalty ? 'border-blood-red shadow-glow-red animate-pulse' : 'border-gold-dark/40 shadow-glow-gold/10'}`}>
                <div className={`relative z-10 p-3 rounded-full border ${currentPenalty ? 'bg-blood-red/10 border-blood-red/30' : 'bg-gold-dark/10 border-gold-dark/30'}`}>
                    <Coins className={`w-8 h-8 ${currentPenalty ? 'text-blood-red' : 'text-gold-antique animate-pulse'}`} />
                </div>
                <div className="relative z-10 flex-1 text-center md:text-left">
                    <span className={`font-bold block text-[10px] uppercase tracking-[0.3em] mb-1 ${currentPenalty ? 'text-blood-red' : 'text-gold-antique'}`}>
                        {currentPenalty ? 'OBJET MAUDIT / MALUS' : 'RÉCOMPENSE DÉCOUVERTE'}
                    </span>
                    <span className="text-xl md:text-2xl font-header text-white block mb-2">{lootVal.replace('[MALUS]', '')}</span>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-4 border-t border-white/5">
                        {session.players.map(p => (
                            <button key={p.id} onClick={() => addToPlayer(p.name, lootVal, lastGeneralDescription, currentPenalty)} disabled={loadingThumb === lootVal} className={`px-4 py-2 border rounded text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 ${currentPenalty ? 'bg-blood-dark/20 border-blood-red/40 text-blood-red hover:bg-blood-red/20' : 'bg-gold-dark/10 border-gold-dark/30 text-gold-antique hover:bg-gold-dark/40'}`}>
                                {loadingThumb === lootVal ? <Loader2 className="w-3 h-3 animate-spin" /> : <Coins className="w-3 h-3" />} {p.name}
                            </button>
                        ))}
                    </div>
                </div>
              </div>
          );
          return;
      }
    });

    return renderedElements;
  };

  return (
    <div className="w-full bg-darker-metal border-2 border-gold-dark/40 rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.9)] relative overflow-hidden animate-fade-in flex flex-col">
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')]"></div>
      <div className="p-4 border-b border-gold-dark/20 bg-black/80 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3">
              <div className="p-1.5 bg-gold-dark/10 rounded-md border border-gold-dark/20">
                <Sparkles className="w-4 h-4 text-gold-antique" />
              </div>
              <span className="font-header text-[10px] uppercase tracking-[0.3em] text-gold-antique">Registre de Narration</span>
          </div>
          <div className="flex items-center gap-3">
              <button onClick={handleSpeech} disabled={isBuffering} className={`p-2.5 rounded-full border transition-all ${isSpeaking ? 'bg-blood-red border-white/20 text-white shadow-glow-red scale-110' : 'text-gold-antique border-gold-dark/30 hover:bg-white/5 active:scale-90'}`}>
                  {isBuffering ? <Loader2 className="w-4 h-4 animate-spin" /> : isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <div className="w-px h-6 bg-gold-dark/20 mx-1"></div>
              <button onClick={() => { setShowSolution(false); onClose(); }} className="p-2 text-gray-700 hover:text-white transition-colors active:scale-90">
                <X className="w-5 h-5" />
              </button>
          </div>
      </div>
      <div className="p-8 md:p-14 lg:p-20 relative z-10 max-h-[80vh] overflow-y-auto no-scrollbar scroll-smooth">
          {error ? (
            <div className="text-red-400 text-lg text-center italic py-20 font-header flex flex-col items-center gap-6 animate-pulse">
                <AlertCircle className="w-16 h-16 opacity-50" />
                <span>Une force obscure a interrompu l'invocation...</span>
                <span className="text-xs opacity-50 uppercase tracking-widest">{error}</span>
            </div>
          ) : (
            <div className="w-full space-y-4">
                {narration && formatText(narration)}
            </div>
          )}
      </div>
      <div className="h-4 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
    </div>
  );
};

export default StoryBox;
