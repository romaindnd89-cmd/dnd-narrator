
import React from 'react';
import { ScrollText, Zap, Sparkles, Ghost, Dices, ShieldCheck, HelpCircle, Eye } from 'lucide-react';

interface StoryBoxProps {
  narration: string | null;
  error: string | null;
  apiKey: string | null;
}

const StoryBox: React.FC<StoryBoxProps> = ({ narration, error }) => {
  
  if (!narration && !error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gold-dark/30 border border-dashed border-gold-dark/20 rounded-lg p-12 min-h-[300px]">
        <ScrollText className="w-16 h-16 mb-4 opacity-20" />
        <p className="font-fantasy text-xl text-center">Le parchemin est vierge...<br/>En attente de vos actions.</p>
      </div>
    );
  }

  const formatText = (text: string) => {
    let processedText = text.trim();
    if (processedText.startsWith('om :')) processedText = 'Nom :' + processedText.substring(4);
    if (processedText.startsWith('m :')) processedText = 'Nom :' + processedText.substring(3);

    const lines = processedText.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length <= 1) {
      return (
        <div className="py-6 animate-fade-in">
           <p className="italic text-parchment/90 leading-relaxed first-letter:text-5xl first-letter:font-header first-letter:text-blood-red first-letter:mr-3 first-letter:float-left drop-shadow-sm">
            {processedText.replace(/\*\*/g, '')}
           </p>
        </div>
      );
    }

    const renderedElements: React.ReactNode[] = [];
    let aidBlockBuffer: string[] = [];
    let isCollectingAid = false;

    const flushAidBuffer = (keyPrefix: number) => {
        if (aidBlockBuffer.length > 0) {
            renderedElements.push(
                <div key={`aid-${keyPrefix}`} className="mt-6 p-5 bg-green-900/20 border border-green-700/40 rounded-lg font-body text-parchment flex items-start gap-4 animate-fade-in shadow-[0_0_15px_rgba(20,80,20,0.2)]">
                    <Dices className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <span className="font-bold block text-[10px] uppercase tracking-[0.3em] text-green-600 mb-2 font-fantasy">Aide Débutant & Dés</span>
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

      if (upperLine.includes('AIDE DÉBUTANT') || upperLine.includes('AIDE DEBUTANT')) {
         isCollectingAid = true;
         return; 
      }

      if (isCollectingAid) {
          if (cleanLine.startsWith('**') && cleanLine.endsWith('**')) {
              flushAidBuffer(i);
          } else {
              aidBlockBuffer.push(cleanLine);
              return;
          }
      }

      // Detection des mots clés spéciaux
      const isEffect = upperLine.includes('EFFET') || upperLine.includes('UTILITÉ') || upperLine.includes('STATS') || upperLine.includes('CE QU\'ON Y TROUVE') || upperLine.includes('RÉACTION');
      const isSolution = upperLine.includes('SOLUTION') || upperLine.includes('RÉPONSE');
      const isRiddle = upperLine.includes('ÉNIGME') || upperLine.includes('PUZZLE');
      
      if (isSolution) {
          flushAidBuffer(i);
          const solutionVal = cleanLine.includes(':') ? cleanLine.split(':').slice(1).join(':').trim() : cleanLine.replace(/\*\*/g, '');
          renderedElements.push(
              <div key={i} className="mt-6 p-5 bg-purple-900/20 border border-purple-500/40 rounded-lg font-fantasy text-purple-200 flex items-start gap-4 animate-fade-in shadow-md relative overflow-hidden group/spoiler">
                <div className="absolute inset-0 bg-black/90 group-hover/spoiler:bg-transparent transition-colors duration-500 z-10 flex items-center justify-center cursor-help">
                    <span className="text-purple-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                        <Eye className="w-4 h-4" /> Survoler pour voir la solution
                    </span>
                </div>
                <HelpCircle className="w-6 h-6 text-purple-400 shrink-0 mt-0.5" />
                <div className="flex-1 relative z-0 blur-sm group-hover/spoiler:blur-0 transition-all duration-300">
                    <span className="font-bold block text-[10px] uppercase tracking-[0.3em] text-purple-400 mb-1">
                        Solution (MJ Uniquement)
                    </span>
                    <span className="text-lg leading-snug">{solutionVal}</span>
                </div>
              </div>
          );
          return;
      }

      if (isRiddle) {
          flushAidBuffer(i);
          const riddleVal = cleanLine.includes(':') ? cleanLine.split(':').slice(1).join(':').trim() : cleanLine.replace(/\*\*/g, '');
          renderedElements.push(
            <div key={i} className="mt-4 mb-4 p-6 bg-darker-metal border-2 border-gold-dark rounded-lg text-center relative">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black px-3 text-gold-antique font-header text-sm tracking-widest uppercase">L'Énigme</span>
                <p className="font-fantasy text-xl md:text-2xl text-parchment leading-relaxed drop-shadow-md">
                    "{riddleVal.replace(/"/g, '')}"
                </p>
            </div>
          );
          return;
      }

      if (isEffect) {
        flushAidBuffer(i);
        const effectVal = cleanLine.includes(':') ? cleanLine.split(':').slice(1).join(':').trim() : cleanLine.replace(/\*\*/g, '');
        const isStats = upperLine.includes('STATS') || upperLine.includes('CE QU\'ON Y TROUVE');
        
        renderedElements.push(
          <div key={i} className={`mt-6 p-5 ${isStats ? 'bg-blue-900/10 border-blue-500/30' : 'bg-blood-red/10 border-blood-red/40'} border rounded-lg font-fantasy text-gold-antique flex items-start gap-4 animate-fade-in shadow-md`}>
            {isStats ? <ShieldCheck className="w-6 h-6 text-blue-400 shrink-0 mt-0.5" /> : <Zap className="w-6 h-6 text-blood-red shrink-0 mt-0.5 animate-pulse" />}
            <div className="flex-1">
                <span className={`font-bold block text-[10px] uppercase tracking-[0.3em] ${isStats ? 'text-blue-400' : 'text-blood-red'} mb-1`}>
                    {isStats ? 'Éléments Notables' : 'Réaction / Effet'}
                </span>
                <span className="text-lg leading-snug">{effectVal}</span>
            </div>
          </div>
        );
        return;
      }
      
      const isTitle = upperLine.includes('NOM') || upperLine.includes('OBJET') || upperLine.includes('LIEU') || (i === 0 && cleanLine.length < 60);
      if (isTitle) {
        flushAidBuffer(i);
        const titleVal = cleanLine.includes(':') ? cleanLine.split(':').slice(1).join(':').trim() : cleanLine;
        renderedElements.push(
          <div key={i} className="mb-8 relative">
            <h3 className="text-3xl md:text-4xl font-header text-gold-antique tracking-tight flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-blood-red opacity-80" />
              <span className="drop-shadow-lg">{titleVal.replace(/\*\*/g, '') || "Sujet Inconnu"}</span>
            </h3>
            <div className="h-0.5 w-full bg-gradient-to-r from-blood-red via-gold-dark/40 to-transparent mt-3"></div>
          </div>
        );
        return;
      }

      flushAidBuffer(i);
      const descContent = cleanLine.replace(/^(Description|Ambiance|Détails|Histoire|Équipement|Equipement|Visuelle|Sensorielle|Action)\s*:\s*/i, '').replace(/\*\*/g, '');
      
      let label = null;
      if (upperLine.includes('VISUELLE')) label = "Description Visuelle";
      if (upperLine.includes('SENSORIELLE')) label = "Ambiance Sensorielle";
      if (upperLine.startsWith('DESCRIPTION')) label = "Description";
      if (upperLine.startsWith('ACTION')) label = "Action";

      renderedElements.push(
        <div key={i} className="mb-5">
            {label && <span className="block text-gold-dark text-xs uppercase tracking-widest font-bold mb-1">{label}</span>}
            <p className={`italic text-parchment/90 leading-relaxed text-lg border-l-2 ${label ? 'border-gold-antique/40' : 'border-gold-dark/10'} pl-6 py-1`}>
            {descContent}
            </p>
        </div>
      );
    });

    flushAidBuffer(999);
    return renderedElements;
  };

  return (
    <div className="relative w-full h-full min-h-[450px] animate-fade-in group">
      <div className="absolute inset-0 bg-[#080808] rounded-xl border-2 border-gold-dark/30 shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden">
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-blood-red/5"></div>
      </div>
      
      <div className="relative z-10 p-10 h-full flex flex-col">
        {/* Simple Text Header Ornament */}
        <div className="flex items-center justify-center gap-6 mb-10 opacity-30">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gold-dark"></div>
            <Ghost className="w-5 h-5 text-gold-antique" />
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gold-dark"></div>
        </div>

        <div className="flex-grow overflow-y-auto pr-4 custom-scrollbar">
            {error ? (
                <div className="text-center py-16 px-8">
                  <div className="mb-6 inline-flex p-4 rounded-full bg-red-950/30 border border-red-500/30">
                    <Ghost className="w-12 h-12 text-red-500 animate-bounce" />
                  </div>
                  <p className="text-red-400 font-body text-xl mb-8 italic">{error}</p>
                </div>
            ) : (
                <div className="font-body">
                    {narration ? formatText(narration) : ''}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default StoryBox;
