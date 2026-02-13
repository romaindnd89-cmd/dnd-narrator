
import React, { useState, useRef } from 'react';
import { Zap, Sparkles, Dices, Volume2, VolumeX, Loader2, Coins, AlertCircle, X } from 'lucide-react';
import { generateSpeech, generateCharacterImage } from '../services/geminiService';
import { SessionState, VaultItem } from '../types';

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
            quantity: 1,
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
  
  if (!narration && !error) return null;

  const formatText = (text: string) => {
    const lines = text.trim().split('\n').filter(line => line.trim() !== '');
    const renderedElements: React.ReactNode[] = [];
    let aidBlockBuffer: string[] = [];
    let isCollectingAid = false;
    
    // On garde en mémoire la dernière description/effet trouvés pour l'associer au prochain loot
    let lastGeneralDescription = "Objet trouvé dans l'aventure.";

    const flushAidBuffer = (keyPrefix: number) => {
        if (aidBlockBuffer.length > 0) {
            renderedElements.push(
                <div key={`aid-${keyPrefix}`} className="mt-6 p-5 bg-green-900/10 border border-green-700/30 rounded font-body text-parchment flex items-start gap-4 animate-fade-in shadow-lg">
                    <Dices className="w-5 h-5 text-green-600 shrink-0 mt-1" />
                    <div className="flex-1">
                        <span className="font-bold block text-[10px] uppercase tracking-[0.2em] text-green-600 mb-2 font-fantasy">Note du MJ</span>
                        <div className="text-sm space-y-2 opacity-80">
                             {aidBlockBuffer.map((l, idx) => (
                                <p key={idx} className="leading-relaxed">{l.replace(/\*\*/g, '').replace(/^- /, '• ')}</p>
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

      const isLoot = upperLine.startsWith('CONTENU') || upperLine.startsWith('RÉCOMPENSE') || upperLine.startsWith('BUTIN');
      const isTitle = upperLine.startsWith('NOM') || upperLine.startsWith('OBJET') || (i === 0 && cleanLine.length < 50);
      const isEffect = upperLine.includes('EFFET') || upperLine.includes('RÉACTION') || upperLine.includes('STATS');

      if (isLoot) {
          flushAidBuffer(i);
          const lootVal = cleanLine.includes(':') ? cleanLine.split(':').slice(1).join(':').trim() : cleanLine.replace(/\*\*/g, '');
          const currentItemDesc = lastGeneralDescription; // On capture la description actuelle

          renderedElements.push(
              <div key={i} className="mt-8 p-6 bg-black/40 border-2 border-gold-dark/30 rounded-lg font-fantasy text-parchment flex items-start gap-5 animate-fade-in shadow-xl">
                <Coins className="w-8 h-8 shrink-0 mt-1 text-gold-antique" />
                <div className="flex-1">
                    <span className="font-bold block text-[11px] uppercase tracking-[0.3em] text-gold-antique mb-1">Trésor Découvert</span>
                    <span className="text-xl leading-tight font-header text-white block mb-2">{lootVal}</span>
                    <p className="text-[10px] italic text-parchment/50 mb-4 line-clamp-2">{currentItemDesc}</p>
                    
                    {session.isActive && session.players.length > 0 ? (
                        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-2">
                             {session.players.map(p => (
                                <button key={p.id} onClick={() => addToPlayer(p.name, lootVal, currentItemDesc)} className="px-4 py-1.5 bg-gold-dark/10 border border-gold-dark/40 rounded text-[10px] text-gold-antique hover:bg-gold-dark/30 transition-all">
                                    {loadingThumb === lootVal ? '...' : `Donner à ${p.name}`}
                                </button>
                             ))}
                        </div>
                    ) : null}
                </div>
              </div>
          );
          return;
      }

      if (isTitle) {
        flushAidBuffer(i);
        const titleVal = cleanLine.includes(':') ? cleanLine.split(':').slice(1).join(':').trim() : cleanLine.replace(/\*\*/g, '');
        renderedElements.push(
          <div key={i} className="mb-8 mt-2 text-center">
            <h3 className="text-3xl md:text-5xl font-header text-gold-antique tracking-tight drop-shadow-[0_0_10px_rgba(197,160,89,0.3)]">
                {titleVal}
            </h3>
            <div className="flex items-center justify-center gap-3 mt-4 opacity-40">
                <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold-dark"></div>
                <Sparkles className="w-3 h-3 text-blood-red" />
                <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold-dark"></div>
            </div>
          </div>
        );
        return;
      }

      if (isEffect) {
          flushAidBuffer(i);
          const effectVal = cleanLine.includes(':') ? cleanLine.split(':').slice(1).join(':').trim() : cleanLine.replace(/\*\*/g, '');
          lastGeneralDescription = effectVal; // On stocke l'effet comme description
          renderedElements.push(
            <div key={i} className="mt-8 p-6 bg-blood-red/10 border border-blood-red/40 rounded-lg font-fantasy text-gold-antique flex items-start gap-5 animate-fade-in shadow-lg">
                <Zap className="w-8 h-8 text-blood-red shrink-0 mt-1" />
                <div className="flex-1">
                    <span className="font-bold block text-[11px] uppercase tracking-[0.3em] text-blood-red mb-1">Effet / Réaction</span>
                    <span className="text-xl leading-tight font-header text-parchment">{effectVal}</span>
                </div>
            </div>
          );
          return;
      }

      flushAidBuffer(i);
      const descContent = cleanLine.replace(/^(Description|Ambiance|Détails|Histoire|Visuelle|Action)\s*:\s*/i, '').replace(/\*\*/g, '');
      if (descContent.length > 20) lastGeneralDescription = descContent; // On stocke la description si elle est substantielle
      
      renderedElements.push(
        <p key={i} className="text-parchment/90 leading-relaxed text-lg md:text-xl font-body italic text-center max-w-3xl mx-auto py-3 animate-fade-in">
            {descContent}
        </p>
      );
    });

    flushAidBuffer(999);
    return renderedElements;
  };

  return (
    <div className="w-full bg-darker-metal border-2 border-gold-dark/40 rounded-lg shadow-2xl relative overflow-hidden animate-fade-in">
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')]"></div>
      <div className="p-4 border-b border-gold-dark/20 bg-black/40 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold-antique" />
              <span className="font-header text-[10px] uppercase tracking-widest text-gold-dark">Récit d'Action</span>
          </div>
          <div className="flex items-center gap-3">
              <button 
                onClick={handleSpeech} 
                disabled={isBuffering} 
                className={`p-2 rounded-full border transition-all ${isSpeaking ? 'bg-blood-red border-white/20 text-white' : 'text-gold-antique border-gold-dark/30 hover:bg-white/5'}`}
              >
                  {isBuffering ? <Loader2 className="w-4 h-4 animate-spin" /> : isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button onClick={onClose} className="p-2 text-gray-600 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
          </div>
      </div>
      <div className="p-8 md:p-12 relative z-10">
          {error ? (
              <div className="text-red-400 text-lg text-center italic py-10 font-header flex flex-col items-center gap-4">
                  <AlertCircle className="w-10 h-10" />
                  {error}
              </div>
          ) : (
              <div className="w-full space-y-6">
                  {narration && formatText(narration)}
                  <div className="pt-10 flex flex-col items-center gap-3 opacity-20">
                      <div className="h-px w-16 bg-gold-dark"></div>
                      <span className="font-header text-[8px] uppercase tracking-[0.5em] text-gold-dark">Fin de la vision</span>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default StoryBox;
