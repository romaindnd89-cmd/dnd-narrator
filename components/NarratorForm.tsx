
import React from 'react';
import { WeaponType, DiceResult, BodyPart, CombatState, NarrationStyle, NarratorMode, LootType } from '../types';
import { Sword, Skull, Target, Sparkles, User, BookOpen, Search, Gem, Archive, Dices, ZapOff } from 'lucide-react';

interface NarratorFormProps {
  combatState: CombatState;
  onChange: (newState: CombatState) => void;
  onSubmit: () => void;
  onDiceRoll: (sides: number) => void;
  isLoading: boolean;
}

const NarratorForm: React.FC<NarratorFormProps> = ({ 
  combatState, 
  onChange, 
  onSubmit, 
  onDiceRoll,
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

  const currentMode = combatState.mode;

  const diceTypes = [
    { label: 'd4', sides: 4, color: 'from-blue-900 to-blue-700' },
    { label: 'd6', sides: 6, color: 'from-green-900 to-green-700' },
    { label: 'd8', sides: 8, color: 'from-purple-900 to-purple-700' },
    { label: 'd10', sides: 10, color: 'from-orange-900 to-orange-700' },
    { label: 'd12', sides: 12, color: 'from-pink-900 to-pink-700' },
    { label: 'd20', sides: 20, color: 'from-blood-dark to-blood-red' },
    { label: 'd100', sides: 100, color: 'from-gray-800 to-gray-600' },
  ];

  return (
    <div className="bg-darker-metal border-2 border-gold-dark/30 rounded-lg shadow-2xl relative overflow-hidden group h-full">
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gold-antique pointer-events-none z-20"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-gold-antique pointer-events-none z-20"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-gold-antique pointer-events-none z-20"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gold-antique pointer-events-none z-20"></div>

      {/* Tabs for Mode Selection */}
      <div className="flex border-b border-gold-dark/30 overflow-x-auto no-scrollbar">
        <button
            onClick={() => handleModeChange(NarratorMode.COMBAT)}
            className={`flex-1 min-w-[100px] py-4 text-center font-header text-sm md:text-lg uppercase tracking-wider transition-colors flex items-center justify-center gap-2
                ${currentMode === NarratorMode.COMBAT ? 'bg-blood-dark/20 text-gold-antique shadow-[inset_0_-2px_0_#c5a059]' : 'bg-darker-metal text-gray-500 hover:text-gray-300 hover:bg-white/5'}
            `}
        >
            <Sword className="w-4 h-4 md:w-5 md:h-5" /> Combat
        </button>
        <button
            onClick={() => handleModeChange(NarratorMode.LOOT)}
            className={`flex-1 min-w-[100px] py-4 text-center font-header text-sm md:text-lg uppercase tracking-wider transition-colors flex items-center justify-center gap-2
                ${currentMode === NarratorMode.LOOT ? 'bg-blood-dark/20 text-gold-antique shadow-[inset_0_-2px_0_#c5a059]' : 'bg-darker-metal text-gray-500 hover:text-gray-300 hover:bg-white/5'}
            `}
        >
            <Search className="w-4 h-4 md:w-5 md:h-5" /> Fouille
        </button>
        <button
            onClick={() => handleModeChange(NarratorMode.DICE)}
            className={`flex-1 min-w-[100px] py-4 text-center font-header text-sm md:text-lg uppercase tracking-wider transition-colors flex items-center justify-center gap-2
                ${currentMode === NarratorMode.DICE ? 'bg-blood-dark/20 text-gold-antique shadow-[inset_0_-2px_0_#c5a059]' : 'bg-darker-metal text-gray-500 hover:text-gray-300 hover:bg-white/5'}
            `}
        >
            <Dices className="w-4 h-4 md:w-5 md:h-5" /> Dés
        </button>
      </div>

      <div className="p-6 md:p-8 space-y-6 relative z-10 overflow-y-auto max-h-[calc(100vh-350px)] lg:max-h-none custom-scrollbar">

        {currentMode !== NarratorMode.DICE && (
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
        )}
        
        {/* === COMBAT INPUTS === */}
        {currentMode === NarratorMode.COMBAT && (
            <>
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
        {currentMode === NarratorMode.LOOT && (
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
            </div>
        )}

        {/* === DICE INPUTS === */}
        {currentMode === NarratorMode.DICE && (
            <div className="space-y-6 animate-fade-in">
                 <div className="flex items-center justify-between mb-2">
                    <h3 className="text-gold-antique font-header uppercase tracking-widest text-sm flex items-center gap-2">
                        <Dices className="w-4 h-4" /> Vos Dés de Destinée
                    </h3>
                    <div className="px-2 py-0.5 rounded bg-green-900/30 border border-green-500/30 flex items-center gap-1.5 shadow-sm">
                        <ZapOff className="w-3 h-3 text-green-500" />
                        <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider">Calcul Local (Sans API)</span>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {diceTypes.map((dice) => (
                        <button
                            key={dice.sides}
                            onClick={() => onDiceRoll(dice.sides)}
                            className={`
                                group/dice relative py-6 rounded-lg border border-gold-dark/20 
                                bg-gradient-to-br ${dice.color} shadow-lg overflow-hidden
                                transition-all hover:scale-105 active:scale-95
                            `}
                        >
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/dice:opacity-100 transition-opacity"></div>
                            <span className="relative z-10 font-header text-2xl text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
                                {dice.label}
                            </span>
                            <div className="absolute bottom-1 right-2 opacity-20 group-hover/dice:opacity-40 transition-opacity">
                                <Dices className="w-8 h-8 text-white" />
                            </div>
                        </button>
                    ))}
                 </div>
                 <div className="p-4 bg-black/40 border border-gold-dark/10 rounded italic text-sm text-gray-500 font-body text-center">
                    Cliquez sur un dé pour le lancer. Le résultat s'affichera sur le parchemin.
                 </div>
            </div>
        )}

        {/* Target Input (Shared but different placeholder) */}
        {currentMode !== NarratorMode.DICE && (
            <div className="space-y-2 animate-fade-in">
            <label className="flex items-center gap-2 text-gold-antique font-header text-lg uppercase tracking-wider">
                {currentMode === NarratorMode.COMBAT ? <Target className="w-5 h-5 text-blood-red" /> : <Archive className="w-5 h-5 text-blood-red" />}
                {currentMode === NarratorMode.COMBAT ? 'Cible / Monstre' : 'Lieu de fouille'} <span className="text-xs text-gray-500 normal-case ml-auto opacity-70">(Optionnel)</span>
            </label>
            <input
                type="text"
                value={combatState.target}
                onChange={handleTargetChange}
                placeholder={currentMode === NarratorMode.COMBAT ? "Ex: Gobelin, Dragon Rouge..." : "Ex: Cadavre de bandit, Coffre pourri..."}
                className="w-full bg-dark-metal text-parchment font-body border border-gold-dark/50 rounded p-3 focus:border-gold-antique focus:ring-1 focus:ring-gold-antique outline-none placeholder-gray-600"
            />
            </div>
        )}

        {/* Submit Button (Only for Combat/Loot) */}
        {currentMode !== NarratorMode.DICE && (
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
                                <Sparkles className="w-5 h-5" /> {currentMode === NarratorMode.COMBAT ? 'Générer la Narration' : 'Générer l\'Objet'}
                            </>
                        )}
                    </span>
                    {!isLoading && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>}
                </button>
            </div>
        )}

      </div>
    </div>
  );
};

export default NarratorForm;
