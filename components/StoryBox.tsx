import React from 'react';
import { ScrollText, Feather } from 'lucide-react';

interface StoryBoxProps {
  narration: string | null;
  error: string | null;
}

const StoryBox: React.FC<StoryBoxProps> = ({ narration, error }) => {
  if (!narration && !error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gold-dark/30 border border-dashed border-gold-dark/20 rounded-lg p-12 min-h-[300px]">
        <ScrollText className="w-16 h-16 mb-4 opacity-20" />
        <p className="font-fantasy text-xl text-center">Le parchemin est vierge...<br/>En attente de votre lancer de dés.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[300px] animate-fade-in">
      {/* Background Texture Effect */}
      <div className="absolute inset-0 bg-[#161311] opacity-90 rounded-lg border border-gold-dark/60 shadow-inner"></div>
      
      {/* Inner Content Area */}
      <div className="relative z-10 p-8 h-full flex flex-col">
        
        {/* Header decoration */}
        <div className="flex items-center justify-center mb-6">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-gold-antique"></div>
            <Feather className="w-5 h-5 text-gold-antique mx-3 rotate-45" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-gold-antique"></div>
        </div>

        {/* Text Output */}
        <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
            {error ? (
                <p className="text-red-500 font-body italic text-center text-lg">
                    {error}
                </p>
            ) : (
                <p className="text-parchment font-body text-xl leading-relaxed first-letter:text-5xl first-letter:font-fantasy first-letter:text-gold-antique first-letter:mr-2 first-letter:float-left shadow-black drop-shadow-md">
                    {narration}
                </p>
            )}
        </div>

        {/* Footer decoration */}
        <div className="mt-6 flex justify-center opacity-50">
            <div className="text-gold-dark font-fantasy text-sm">~ Fin de la description ~</div>
        </div>
      </div>

        {/* Border Overlay */}
        <div className="absolute inset-0 border-double border-4 border-gold-dark/40 rounded-lg pointer-events-none"></div>
    </div>
  );
};

export default StoryBox;