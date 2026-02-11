
import React from 'react';
import { ScrollText, Feather, Zap, Sparkles, Ghost } from 'lucide-react';

interface StoryBoxProps {
  narration: string | null;
  error: string | null;
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
    // Nettoyage des caractères bizarres en début de texte (comme le 'om :' rapporté)
    let processedText = text.trim();
    if (processedText.startsWith('om :')) processedText = 'Nom :' + processedText.substring(4);
    if (processedText.startsWith('m :')) processedText = 'Nom :' + processedText.substring(3);

    const lines = processedText.split('\n').filter(line => line.trim() !== '');
    
    // Si l'IA n'a pas renvoyé de lignes (format brut), on affiche tout d'un bloc
    if (lines.length <= 1) {
      return (
        <div className="py-6 animate-fade-in">
           <p className="italic text-parchment/90 leading-relaxed first-letter:text-5xl first-letter:font-header first-letter:text-blood-red first-letter:mr-3 first-letter:float-left drop-shadow-sm">
            {processedText.replace(/\*\*/g, '')}
           </p>
        </div>
      );
    }

    return lines.map((line, i) => {
      const cleanLine = line.trim();
      const upperLine = cleanLine.toUpperCase();
      
      // Détection de l'EFFET / UTILITÉ (Le bloc mécanique)
      const isEffect = upperLine.includes('EFFET') || upperLine.includes('UTILITÉ') || upperLine.includes('UTILITE') || upperLine.includes('STAT');
      
      if (isEffect) {
        const effectVal = cleanLine.includes(':') ? cleanLine.split(':').slice(1).join(':').trim() : cleanLine;
        return (
          <div key={i} className="mt-6 p-5 bg-blood-red/10 border border-blood-red/40 rounded-lg font-fantasy text-gold-antique flex items-start gap-4 animate-fade-in shadow-[0_0_15px_rgba(138,3,3,0.2)]">
            <Zap className="w-6 h-6 text-blood-red shrink-0 mt-0.5 animate-pulse" />
            <div className="flex-1">
                <span className="font-bold block text-[10px] uppercase tracking-[0.3em] text-blood-red mb-1">Propriété Occulte</span>
                <span className="text-lg leading-snug">{effectVal.replace(/\*\*/g, '')}</span>
            </div>
          </div>
        );
      }
      
      // Détection du NOM (Le Titre)
      const isTitle = upperLine.includes('NOM') || (i === 0 && cleanLine.length < 60);
      if (isTitle) {
        const titleVal = cleanLine.includes(':') ? cleanLine.split(':').slice(1).join(':').trim() : cleanLine;
        return (
          <div key={i} className="mb-8 relative">
            <h3 className="text-3xl md:text-4xl font-header text-gold-antique tracking-tight flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-blood-red opacity-80" />
              <span className="drop-shadow-lg">{titleVal.replace(/\*\*/g, '') || "Objet Mystérieux"}</span>
            </h3>
            <div className="h-0.5 w-full bg-gradient-to-r from-blood-red via-gold-dark/40 to-transparent mt-3"></div>
          </div>
        );
      }

      // Texte de description
      const descContent = cleanLine.replace(/^(Description|Ambiance|Détails)\s*:\s*/i, '').replace(/\*\*/g, '');
      return (
        <p key={i} className="mb-5 italic text-parchment/90 leading-relaxed text-lg border-l-2 border-gold-dark/10 pl-6 py-1">
          {descContent}
        </p>
      );
    });
  };

  return (
    <div className="relative w-full h-full min-h-[450px] animate-fade-in group">
      {/* Fond de parchemin noirci */}
      <div className="absolute inset-0 bg-[#080808] rounded-xl border-2 border-gold-dark/30 shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden">
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-blood-red/5"></div>
      </div>
      
      {/* Contenu textuel */}
      <div className="relative z-10 p-10 h-full flex flex-col">
        
        {/* Ornements supérieurs */}
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
                  <button 
                    onClick={() => window.location.reload()} 
                    className="px-10 py-4 bg-red-950 text-xs text-red-100 hover:bg-red-800 transition-all uppercase tracking-[0.3em] border border-red-700 font-bold shadow-lg"
                  >
                    Réveiller le Narrateur
                  </button>
                </div>
            ) : (
                <div className="font-body">
                    {narration ? formatText(narration) : ''}
                </div>
            )}
        </div>

        {/* Ornements inférieurs */}
        <div className="mt-10 pt-6 border-t border-gold-dark/10 flex justify-center items-center opacity-30">
             <div className="text-[10px] uppercase tracking-[0.8em] text-gold-antique font-fantasy">Fin de la Vision</div>
        </div>
      </div>

      {/* Coins gothiques */}
      <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-gold-antique/20 rounded-tl-xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-gold-antique/20 rounded-br-xl pointer-events-none"></div>
    </div>
  );
};

export default StoryBox;
