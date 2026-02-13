
// Fix: Added missing React import to resolve "Cannot find namespace 'React'"
import React, { useState, useRef } from 'react';
import { ScrollText, Zap, Sparkles, Ghost, Dices, ShieldCheck, Volume2, VolumeX, Loader2, UserPlus, Box, Coins, AlertCircle } from 'lucide-react';
import { generateSpeech, generateCharacterImage } from '../services/geminiService';
import { SessionState, VaultItem } from '../types';

interface StoryBoxProps {
  narration: string | null;
  error: React.ReactNode | null;
  session: SessionState;
  onUpdateSession: (session: SessionState) => void;
}

const StoryBox: React.FC<StoryBoxProps> = ({ narration, error, session, onUpdateSession }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [loadingThumb, setLoadingThumb] = useState<string | null>(null);
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

  const addToPlayer = async (playerName: string, itemName: string, itemDesc: string) => {
    setLoadingThumb(itemName);
    try {
        const prompt = `A single RPG item icon: ${itemName}. Dark fantasy style, detailed, on black background.`;
        const imageUrl = await generateCharacterImage(prompt);
        const newItem: VaultItem = {
            id: Math.random().toString(36).substr(2, 9),
            name: itemName,
            description: itemDesc,
            imageUrl,
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
    } catch (e) { console.error(e); } finally { setLoadingThumb(null); }
  };
  
  if (!narration && !error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gold-dark/30 border border-dashed border-gold-dark/20 rounded-lg p-12 min-h-[300px]">
        <ScrollText className="w-16 h-16 mb-4 opacity-20" />
        <p className="font-fantasy text-xl text-center">Le parchemin est vierge...<br/>En attente de vos actions.</p>
      </div>
    );
  }

  const formatText = (text: string) => {
    const lines = text.trim().split('\n').filter(line => line.trim() !== '');
    const renderedElements: React.ReactNode[] = [];
    let aidBlockBuffer: string[] = [];
    let isCollectingAid = false;

    const flushAidBuffer = (keyPrefix: number) => {
        if (aidBlockBuffer.length > 0) {
            renderedElements.push(
                <div key={`aid-${keyPrefix}`} className="mt-6 p-5 bg-green-900/20 border border-green-700/40 rounded-lg font-body text-parchment flex items-start gap-4 animate-fade-in shadow-lg">
                    <Dices className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <span className="font-bold block text-[10px] uppercase tracking-[0.3em] text-green-600 mb-2 font-fantasy">Aide MJ & Dés</span>
                        <div className="text-sm space-y-2">
                             {aidBlockBuffer.map((l, idx) => (
                                <p key={idx} className="leading-snug">{l.replace(/\*\*/g, '').replace(/^- /, '• ')}</p>
                             ))}
                        </div>
                    </div>
                </div>
            );
            aidBlockBuffer = [];
        }
        isCollectingAid = false;
    };

    lines.forEach((line, i) => {
      const cleanLine = line.trim();
      const upperLine = cleanLine.toUpperCase();

      if (upperLine.includes('AIDE DÉBUTANT') || upperLine.includes('AIDE DEBUTANT') || upperLine.includes('AIDE MJ')) {
         isCollectingAid = true; return; 
      }
      if (isCollectingAid) {
          if (cleanLine.startsWith('**') && cleanLine.endsWith('**')) { flushAidBuffer(i); } 
          else { aidBlockBuffer.push(cleanLine); return; }
      }

      // Detection keywords
      const isLoot = upperLine.startsWith('CONTENU') || upperLine.startsWith('RÉCOMPENSE') || upperLine.startsWith('BUTIN');
      const isTitle = upperLine.startsWith('NOM') || upperLine.startsWith('OBJET') || (i === 0 && cleanLine.length < 50);
      const isEffect = upperLine.includes('EFFET') || upperLine.includes('RÉACTION') || upperLine.includes('STATS');

      if (isLoot) {
          flushAidBuffer(i);
          const lootVal = cleanLine.includes(':') ? cleanLine.split(':').slice(1).join(':').trim() : cleanLine.replace(/\*\*/g, '');
          renderedElements.push(
              <div key={i} className="mt-6 p-5 bg-gray-800/40 border border-gold-dark/30 rounded-lg font-fantasy text-parchment flex items-start gap-4 animate-fade-in shadow-md">
                <Coins className="w-6 h-6 shrink-0 mt-0.5 text-gold-antique" />
                <div className="flex-1">
                    <span className="font-bold block text-[10px] uppercase tracking-[0.3em] text-gold-antique mb-1">Contenu Trouvé</span>
                    <span className="text-lg leading-snug">{lootVal}</span>
                    
                    {session.isActive && session.players.length > 0 ? (
                        <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-2">
                             {session.players.map(p => (
                                <button key={p.id} onClick={() => addToPlayer(p.name, lootVal, "Trouvé")} className="px-3 py-1 bg-black/40 border border-gold-dark/30 rounded text-[9px] text-gold-antique hover:bg-gold-dark/40 disabled:opacity-50">
                                    {loadingThumb === lootVal ? '...' : `Donner à ${p.name}`}
                                </button>
                             ))}
                        </div>
                    ) : (
                        <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-500 italic">
                            <AlertCircle className="w-3 h-3" /> Lancez une session pour donner cet objet.
                        </div>
                    )}
                </div>
              </div>
          );
          return;
      }

      if (isTitle) {
        flushAidBuffer(i);
        const titleVal = cleanLine.includes(':') ? cleanLine.split(':').slice(1).join(':').trim() : cleanLine.replace(/\*\*/g, '');
        renderedElements.push(
          <div key={i} className="mb-8">
            <h3 className="text-3xl font-header text-gold-antique tracking-tight flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-blood-red opacity-80" />
                <span className="drop-shadow-lg">{titleVal}</span>
            </h3>
            <div className="h-0.5 w-full bg-gradient-to-r from-blood-red via-gold-dark/40 to-transparent mt-3"></div>
            
            {!upperLine.includes('LIEU') && (
                <div className="mt-4 flex items-center gap-3">
                    {session.isActive && session.players.length > 0 ? (
                        <div className="flex flex-wrap gap-2 bg-black/30 p-2 rounded border border-gold-dark/10">
                            <span className="text-[10px] text-gold-dark uppercase font-bold self-center mr-2">Attribuer :</span>
                            {session.players.map(p => (
                                <button key={p.id} onClick={() => addToPlayer(p.name, titleVal, narration || "")} className="px-3 py-1 bg-blood-dark/20 border border-blood-red/30 rounded text-[10px] text-parchment hover:bg-blood-red/40 disabled:opacity-50">
                                    {loadingThumb === titleVal ? '...' : p.name}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-[9px] text-gray-600 italic flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Ajoutez des joueurs dans le Coffre pour distribuer ce butin.</p>
                    )}
                </div>
            )}
          </div>
        );
        return;
      }

      if (isEffect) {
          flushAidBuffer(i);
          const effectVal = cleanLine.includes(':') ? cleanLine.split(':').slice(1).join(':').trim() : cleanLine.replace(/\*\*/g, '');
          renderedElements.push(
            <div key={i} className="mt-6 p-5 bg-blood-red/10 border border-blood-red/40 rounded-lg font-fantasy text-gold-antique flex items-start gap-4 animate-fade-in">
                <Zap className="w-6 h-6 text-blood-red shrink-0 mt-0.5" />
                <div className="flex-1">
                    <span className="font-bold block text-[10px] uppercase tracking-[0.3em] text-blood-red mb-1">Effet / Réaction</span>
                    <span className="text-lg leading-snug">{effectVal}</span>
                </div>
            </div>
          );
          return;
      }

      flushAidBuffer(i);
      const descContent = cleanLine.replace(/^(Description|Ambiance|Détails|Histoire|Visuelle|Action)\s*:\s*/i, '').replace(/\*\*/g, '');
      renderedElements.push(<p key={i} className="italic text-parchment/80 leading-relaxed text-lg border-l-2 border-gold-dark/20 pl-6 py-1 mb-4">{descContent}</p>);
    });

    flushAidBuffer(999);
    return renderedElements;
  };

  return (
    <div className="relative w-full h-full min-h-[450px] animate-fade-in group">
      <div className="absolute inset-0 bg-[#080808] rounded-xl border-2 border-gold-dark/30 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')]"></div>
      </div>
      <div className="relative z-10 p-10 h-full flex flex-col">
        {narration && (
            <div className="absolute top-6 right-6 z-50 flex gap-2">
                <button onClick={handleSpeech} disabled={isBuffering} className={`p-4 rounded-full border-2 transition-all ${isSpeaking ? 'bg-blood-red text-white' : 'bg-black text-gold-antique border-gold-dark/50 hover:border-gold-antique'}`}>
                    {isBuffering ? <Loader2 className="w-6 h-6 animate-spin" /> : isSpeaking ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </button>
            </div>
        )}
        <div className="flex-grow overflow-y-auto pr-4 custom-scrollbar">
            {error ? <div className="text-red-400 text-center italic py-20">{error}</div> : <div>{narration && formatText(narration)}</div>}
        </div>
      </div>
    </div>
  );
};

export default StoryBox;
