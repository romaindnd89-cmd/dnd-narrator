
import React from 'react';
import { X, Sword, Shield, Sparkles, Zap, Scroll, Book, Eye, Search, Wind, Move, Star, AlertCircle, Heart, Brain, MessageSquare, Target, Wand2 } from 'lucide-react';

interface QuickHelpProps {
  onClose: () => void;
}

const QuickHelp: React.FC<QuickHelpProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-darker-metal border-2 border-gold-dark rounded-lg shadow-[0_0_50px_rgba(138,3,3,0.3)] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gold-dark/30 bg-blood-dark/20 flex items-center justify-between shrink-0">
            <h2 className="font-header text-2xl text-gold-antique uppercase tracking-[0.2em] flex items-center gap-3">
                <Book className="w-6 h-6 text-blood-red" />
                Grimoire de Référence MJ
            </h2>
            <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-gold-dark hover:text-white"
            >
                <X className="w-6 h-6" />
            </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-8 font-body custom-scrollbar">
            
            {/* Règle d'Or */}
            <div className="bg-blood-red/10 border border-blood-red/30 p-4 rounded-lg flex items-center gap-4">
                <div className="bg-blood-red p-2 rounded rotate-45 shadow-glow-red">
                    <Target className="w-6 h-6 text-white -rotate-45" />
                </div>
                <div>
                    <h3 className="font-header text-lg text-gold-antique uppercase leading-none mb-1">La Règle d'Or</h3>
                    <p className="text-sm text-parchment/80">Pour TOUT test, attaque ou sauvegarde : <span className="text-blood-red font-bold underline decoration-double">Lancez 1d20</span> + Modificateur + Maîtrise (si vous l'avez).</p>
                </div>
            </div>

            {/* 1. COMBAT ET MAGIE (Réintégré) */}
            <section className="space-y-4">
                <h3 className="font-header text-lg text-gold-antique flex items-center gap-2 border-b border-gold-dark/20 pb-2">
                    <Sword className="w-5 h-5 text-blood-red" /> Actions de Combat
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Attaque Physique */}
                    <div className="bg-black/40 p-4 border border-gold-dark/20 rounded">
                        <span className="flex items-center gap-2 text-blood-red font-bold text-xs uppercase mb-2">
                            <Sword className="w-4 h-4" /> Attaque Physique
                        </span>
                        <p className="text-[11px] text-parchment/80 leading-relaxed">
                            <strong className="text-parchment">Jet pour toucher :</strong> 1d20 + Modif (FOR ou DEX) + Maîtrise.<br/>
                            <strong className="text-parchment">Dégâts :</strong> Dés de l'arme + Modif (FOR ou DEX).<br/>
                            <span className="text-[10px] italic text-gray-500 mt-2 block">Note : On n'ajoute pas la maîtrise aux dégâts.</span>
                        </p>
                    </div>
                    {/* Magie */}
                    <div className="bg-black/40 p-4 border border-gold-dark/20 rounded">
                        <span className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase mb-2">
                            <Wand2 className="w-4 h-4" /> Sortilèges & Incantations
                        </span>
                        <p className="text-[11px] text-parchment/80 leading-relaxed">
                            <strong className="text-blue-400">Attaque de Sort :</strong> 1d20 + Modif Incant + Maîtrise.<br/>
                            <strong className="text-blue-400">DD de Sauvegarde :</strong> 8 + Modif Incant + Maîtrise.<br/>
                            <span className="text-[10px] italic text-gray-500 mt-2 block">Le DD est le score que l'ennemi doit battre pour résister.</span>
                        </p>
                    </div>
                </div>
            </section>

            {/* 2. Les 6 Caractéristiques */}
            <section className="space-y-4">
                <h3 className="font-header text-lg text-gold-antique flex items-center gap-2 border-b border-gold-dark/20 pb-2">
                    <Star className="w-5 h-5 text-yellow-500" /> Les 6 Caractéristiques (d20)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* FORCE */}
                    <div className="bg-black/40 p-3 border border-orange-900/30 rounded">
                        <div className="flex items-center gap-2 mb-2 text-orange-500">
                            <Zap className="w-4 h-4" /> <span className="font-header text-sm uppercase">Force (FOR)</span>
                        </div>
                        <p className="text-[11px] text-parchment/80">Athlétisme. Sauter, grimper, soulever, nager contre le courant.</p>
                    </div>

                    {/* DEXTÉRITÉ */}
                    <div className="bg-black/40 p-3 border border-blue-900/30 rounded">
                        <div className="flex items-center gap-2 mb-2 text-blue-400">
                            <Wind className="w-4 h-4" /> <span className="font-header text-sm uppercase">Dextérité (DEX)</span>
                        </div>
                        <p className="text-[11px] text-parchment/80">Acrobaties, Discrétion, Escamotage. Initiative, Équilibre, Réflexes.</p>
                    </div>

                    {/* CONSTITUTION */}
                    <div className="bg-black/40 p-3 border border-red-900/30 rounded">
                        <div className="flex items-center gap-2 mb-2 text-red-500">
                            <Heart className="w-4 h-4" /> <span className="font-header text-sm uppercase">Constitution (CON)</span>
                        </div>
                        <p className="text-[11px] text-parchment/80">Points de vie, Concentration (Sorts), Résister à la fatigue/poison.</p>
                    </div>

                    {/* INTELLIGENCE */}
                    <div className="bg-black/40 p-3 border border-purple-900/30 rounded">
                        <div className="flex items-center gap-2 mb-2 text-purple-400">
                            <Brain className="w-4 h-4" /> <span className="font-header text-sm uppercase">Intelligence (INT)</span>
                        </div>
                        <p className="text-[11px] text-parchment/80">Investigation, Arcanes, Histoire, Nature, Religion. Logique pure.</p>
                    </div>

                    {/* SAGESSE */}
                    <div className="bg-black/40 p-3 border border-green-900/30 rounded">
                        <div className="flex items-center gap-2 mb-2 text-green-500">
                            <Eye className="w-4 h-4" /> <span className="font-header text-sm uppercase">Sagesse (SAG)</span>
                        </div>
                        <p className="text-[11px] text-parchment/80">Perception, Intuition, Survie, Médecine. Instinct et observation.</p>
                    </div>

                    {/* CHARISME */}
                    <div className="bg-black/40 p-3 border border-pink-900/30 rounded">
                        <div className="flex items-center gap-2 mb-2 text-pink-400">
                            <MessageSquare className="w-4 h-4" /> <span className="font-header text-sm uppercase">Charisme (CHA)</span>
                        </div>
                        <p className="text-[11px] text-parchment/80">Persuasion, Tromperie, Intimidation. Force de personnalité.</p>
                    </div>
                </div>
            </section>

            {/* 3. Fouille & Observation */}
            <section className="space-y-4">
                <h3 className="font-header text-lg text-gold-antique flex items-center gap-2 border-b border-gold-dark/20 pb-2">
                    <Search className="w-5 h-5 text-gold-antique" /> Trouver & Analyser
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-black/40 p-4 border border-gold-dark/10 rounded flex gap-4">
                        <Eye className="w-6 h-6 text-green-500 shrink-0" />
                        <div>
                            <span className="text-xs font-bold text-parchment block mb-1 uppercase">Perception (SAG) - d20</span>
                            <p className="text-[11px] text-gray-400">Repérer un bruit, une odeur, ou une créature cachée. <span className="text-green-500">Action instinctive.</span></p>
                        </div>
                    </div>
                    <div className="bg-black/40 p-4 border border-gold-dark/10 rounded flex gap-4">
                        <Search className="w-6 h-6 text-blue-400 shrink-0" />
                        <div>
                            <span className="text-xs font-bold text-parchment block mb-1 uppercase">Investigation (INT) - d20</span>
                            <p className="text-[11px] text-gray-400">Chercher un tiroir secret, comprendre un mécanisme. <span className="text-blue-400">Action de déduction.</span></p>
                        </div>
                    </div>
                </div>
            </section>

             {/* 4. Mouvement : Grimer vs Pirouette */}
             <section className="space-y-4">
                <h3 className="font-header text-lg text-gold-antique flex items-center gap-2 border-b border-gold-dark/20 pb-2">
                    <Move className="w-5 h-5 text-orange-500" /> Actions Physiques (d20)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-orange-950/10 border border-orange-800/30 rounded">
                        <h4 className="text-[10px] font-bold text-orange-400 uppercase mb-2">Grimper / Sauter (Athlétisme)</h4>
                        <p className="text-[11px] text-gray-400">Escalader une paroi, sauter une fosse, nager. <strong className="text-white">Stat : FORCE.</strong></p>
                    </div>
                    <div className="p-4 bg-blue-950/10 border border-blue-800/30 rounded">
                        <h4 className="text-[10px] font-bold text-blue-400 uppercase mb-2">Équilibre / Pirouettes (Acrobaties)</h4>
                        <p className="text-[11px] text-gray-400">Marcher sur une corde, faire une roulade, rester debout sur de la glace. <strong className="text-white">Stat : DEXTÉRITÉ.</strong></p>
                    </div>
                </div>
            </section>

        </div>

        {/* Footer */}
        <div className="p-4 bg-black/60 border-t border-gold-dark/30 flex justify-center">
            <button 
                onClick={onClose}
                className="text-gold-antique hover:text-white font-header uppercase tracking-widest text-sm flex items-center gap-2 transition-all hover:scale-105"
            >
                <X className="w-4 h-4" /> Fermer le Grimoire
            </button>
        </div>
      </div>
    </div>
  );
};

export default QuickHelp;
