import React from 'react';
import { WeaponType, DiceResult, BodyPart, CombatState, NarrationStyle, NarratorMode, LootType } from '../types';
import { Sword, Skull, Target, Sparkles, User, BookOpen, Search, Gem, Archive } from 'lucide-react';

interface NarratorFormProps {
  combatState: CombatState;
  onChange: (newState: CombatState) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const NarratorForm: React.FC<NarratorFormProps> = ({ 
  combatState, 
  onChange, 
  onSubmit, 
  isLoading,
}) => {
  
  const handleModeChange = (mode: NarratorMode) => {
    onChange({ ...combatState, mode });
  };

  const handleWeaponChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...combatState, weapon: e.target.value as WeaponType });
  };

  const handleBodyPartChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...combatState, bodyPart: e.target.value as BodyPart });
  };

  const handleResultChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...combatState, result: e.target.value as DiceResult });
  };

  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...combatState, target: e.target.value });
  };

  const handleStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...combatState, style: e.target.value as NarrationStyle });
  };
  
  const handleLootTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...combatState, lootType: e.target.value as LootType });
  };

  const isCombat = combatState.mode === NarratorMode.COMBAT;

  return (
    <div className="bg-darker-metal border-2 border-gold-dark/30 rounded-lg shadow-2xl relative overflow-hidden group">
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gold-antique pointer-events-none z-20"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-gold-antique pointer-events-none z-20"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-gold-antique pointer-events-none z-20"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gold-antique pointer-events-none z-20"></div>

      {/* Tabs for Mode Selection */}
      <div className="flex border-b border-gold-dark/30">
        <button
            onClick={() => handleModeChange(NarratorMode.COMBAT)}
            className={`flex-1 py-4 text-center font-header text-lg uppercase tracking-wider transition-colors flex items-center justify-center gap-2
                ${isCombat ? 'bg-blood-dark/20 text-gold-antique shadow-[inset_0_-2px_0_#c5a059]' : 'bg-darker-metal text-gray-500 hover:text-gray-300 hover:bg-white/5'}
            `}
        >
            <Sword className="w-5 h-5" /> Combat
        </button>
        <button
            onClick={() => handleModeChange(NarratorMode.LOOT)}
            className={`flex-1 py-4 text-center font-header text-lg uppercase tracking-wider transition-colors flex items-center justify-center gap-2
                ${!isCombat ? 'bg-blood-dark/20 text-gold-antique shadow-[inset_0_-2px_0_#c5a059]' : 'bg-darker-metal text-gray-500 hover:text-gray-300 hover:bg-white/5'}
            `}
        >
            <Search className="w-5 h-5" /> Fouille
        </button>
      </div>

      <div className="p-6 md:p-8 space-y-6 relative z-10">

        {/* Style Selection (Always Visible) */}
        <div className="space-y-2">
            <label className="flex items-center gap-2 text-gold-antique font-header text-lg uppercase tracking-wider">
                <BookOpen className="w-5 h-5 text-blood-red" />
                Style de Narration
            </label>
            <div className="relative">
                <select
                value={combatState.style}
                onChange={handleStyleChange}
                className="w-full bg-dark-metal text-parchment font-body border border-gold-dark/50 rounded p-3 focus:border-gold-antique focus:ring-1 focus:ring-gold-antique outline-none appearance-none cursor-pointer hover:bg-black transition-colors"
                >
                {Object.values(NarrationStyle).map((style) => (
                    <option key={style} value={style}>{style}</option>
                ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gold-dark">
                ▼
                </div>
            </div>
        </div>
        
        {/* === COMBAT INPUTS === */}
        {isCombat && (
            <>
                {/* Weapon Selection */}
                <div className="space-y-2 animate-fade-in">
                    <label className="flex items-center gap-2 text-gold-antique font-header text-lg uppercase tracking-wider">
                        <Sword className="w-5 h-5 text-blood-red" />
                        L'Arme
                    </label>
                    <div className="relative">
                        <select
                        value={combatState.weapon}
                        onChange={handleWeaponChange}
                        className="w-full bg-dark-metal text-parchment font-body border border-gold-dark/50 rounded p-3 focus:border-gold-antique focus:ring-1 focus:ring-gold-antique outline-none appearance-none cursor-pointer hover:bg-black transition-colors"
                        >
                        {Object.values(WeaponType).map((weapon) => (
                            <option key={weapon} value={weapon}>{weapon}</option>
                        ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gold-dark">
                        ▼
                        </div>
                    </div>
                </div>

                {/* Body Part Selection (Optional) */}
                <div className="space-y-2 animate-fade-in">
                    <label className="flex items-center gap-2 text-gold-antique font-header text-lg uppercase tracking-wider">
                        <User className="w-5 h-5 text-blood-red" />
                        Zone visée <span className="text-xs text-gray-500 normal-case ml-auto opacity-70">(Optionnel)</span>
                    </label>
                    <div className="relative">
                        <select
                        value={combatState.bodyPart}
                        onChange={handleBodyPartChange}
                        className="w-full bg-dark-metal text-parchment font-body border border-gold-dark/50 rounded p-3 focus:border-gold-antique focus:ring-1 focus:ring-gold-antique outline-none appearance-none cursor-pointer hover:bg-black transition-colors"
                        >
                        {Object.values(BodyPart).map((part) => (
                            <option key={part} value={part}>{part}</option>
                        ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gold-dark">
                        ▼
                        </div>
                    </div>
                </div>

                {/* Dice Result Selection */}
                <div className="space-y-2 animate-fade-in">
                    <label className="flex items-center gap-2 text-gold-antique font-header text-lg uppercase tracking-wider">
                        <Skull className="w-5 h-5 text-blood-red" />
                        Le Résultat du Dé
                    </label>
                    <div className="relative">
                        <select
                        value={combatState.result}
                        onChange={handleResultChange}
                        className="w-full bg-dark-metal text-parchment font-body border border-gold-dark/50 rounded p-3 focus:border-gold-antique focus:ring-1 focus:ring-gold-antique outline-none appearance-none cursor-pointer hover:bg-black transition-colors"
                        >
                        {Object.values(DiceResult).map((result) => (
                            <option key={result} value={result}>{result}</option>
                        ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gold-dark">
                        ▼
                        </div>
                    </div>
                </div>
            </>
        )}

        {/* === LOOT INPUTS === */}
        {!isCombat && (
            <div className="space-y-2 animate-fade-in">
                <label className="flex items-center gap-2 text-gold-antique font-header text-lg uppercase tracking-wider">
                    <Gem className="w-5 h-5 text-blood-red" />
                    Type d'objet
                </label>
                <div className="relative">
                    <select
                    value={combatState.lootType}
                    onChange={handleLootTypeChange}
                    className="w-full bg-dark-metal text-parchment font-body border border-gold-dark/50 rounded p-3 focus:border-gold-antique focus:ring-1 focus:ring-gold-antique outline-none appearance-none cursor-pointer hover:bg-black transition-colors"
                    >
                    {Object.values(LootType).map((type) => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gold-dark">
                    ▼
                    </div>
                </div>
                <p className="text-xs text-gray-500 italic mt-1 ml-1">
                   {combatState.lootType === LootType.USEFUL 
                    ? "Génère un petit consommable avec des effets mécaniques équilibrés." 
                    : "Génère un objet d'ambiance, étrange ou intriguant, sans valeur réelle."}
                </p>
            </div>
        )}

        {/* Target Input (Shared but different placeholder) */}
        <div className="space-y-2 animate-fade-in">
          <label className="flex items-center gap-2 text-gold-antique font-header text-lg uppercase tracking-wider">
            {isCombat ? <Target className="w-5 h-5 text-blood-red" /> : <Archive className="w-5 h-5 text-blood-red" />}
            {isCombat ? 'Cible / Monstre' : 'Lieu de fouille'} <span className="text-xs text-gray-500 normal-case ml-auto opacity-70">(Optionnel)</span>
          </label>
          <input
            type="text"
            value={combatState.target}
            onChange={handleTargetChange}
            placeholder={isCombat ? "Ex: Gobelin, Dragon Rouge..." : "Ex: Cadavre de bandit, Coffre pourri, Étagère..."}
            className="w-full bg-dark-metal text-parchment font-body border border-gold-dark/50 rounded p-3 focus:border-gold-antique focus:ring-1 focus:ring-gold-antique outline-none placeholder-gray-600"
          />
        </div>

        {/* Submit Button & Quota Info */}
        <div>
            <button
            onClick={onSubmit}
            disabled={isLoading}
            className={`
                w-full relative overflow-hidden group/btn
                mt-4 py-4 px-6 rounded border border-gold-dark
                font-header text-xl uppercase tracking-widest font-bold
                transition-all duration-300
                ${isLoading 
                ? 'bg-gray-900 cursor-not-allowed text-gray-500 border-gray-700' 
                : 'bg-blood-dark hover:bg-blood-red text-gold-antique shadow-glow-red hover:shadow-glow-gold hover:-translate-y-0.5'
                }
            `}
            >
                <span className="relative z-10 flex items-center justify-center gap-3">
                    {isLoading ? (
                        <>
                            <span className="animate-spin text-2xl">⟳</span> Invocation...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-5 h-5" /> {isCombat ? 'Générer la Narration' : 'Générer l\'Objet'}
                        </>
                    )}
                </span>
                {!isLoading && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>}
            </button>
            
            <p className="text-xs text-center text-gray-600 mt-2 font-body italic opacity-70">
                Limite : ~15 requêtes / minute
            </p>
        </div>

      </div>
    </div>
  );
};

export default NarratorForm;