
import React from 'react';
import { WeaponType, DiceResult, BodyPart, CombatState, NarrationStyle, NarratorMode, LootType, EnvironmentType, WorldAtmosphere, InteractiveObjectType, InteractionAction, RiddleDifficulty, MonsterCR, MechanicalDifficulty, PlayerExperience, NpcAction, QuestComplexity, NpcReward } from '../types';
import { Sword, Skull, Target, Sparkles, Map, BookOpen, Search, Gem, Archive, Dices, ZapOff, Globe, User, Box, HandMetal, Brain, ChevronDown, Ghost, ShieldAlert, Users, GraduationCap, UserCircle, Star, MessageSquareText } from 'lucide-react';

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

  const handleEnvironmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...combatState, environmentType: e.target.value as EnvironmentType });
  };

  const handleAtmosphereChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...combatState, atmosphere: e.target.value as WorldAtmosphere });
  };

  const handleInteractiveObjChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...combatState, interactiveObj: e.target.value as InteractiveObjectType });
  };

  const handleInteractionActionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...combatState, interactionAction: e.target.value as InteractionAction });
  };

  const handleRiddleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...combatState, riddleDifficulty: e.target.value as RiddleDifficulty });
  };

  const handleCRChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...combatState, monsterCR: e.target.value as MonsterCR });
  };

  const handleMechanicalDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...combatState, mechanicalDifficulty: e.target.value as MechanicalDifficulty });
  };

  const handlePlayerExperienceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...combatState, playerExperience: e.target.value as PlayerExperience });
  };

  const setPartySize = (size: number) => {
    onChange({ ...combatState, partySize: size });
  };

  const toggleLeader = () => {
    onChange({ ...combatState, isLeader: !combatState.isLeader });
  };

  const toggleGroup = () => {
    onChange({ ...combatState, isGroup: !combatState.isGroup });
  };

  const currentMode = combatState.mode;

  const handleNpcActionChange = (e: React.ChangeEvent<HTMLSelectElement>) => onChange({ ...combatState, npcAction: e.target.value as NpcAction });
  const handleQuestComplexityChange = (e: React.ChangeEvent<HTMLSelectElement>) => onChange({ ...combatState, questComplexity: e.target.value as QuestComplexity });
  const handleNpcRewardChange = (e: React.ChangeEvent<HTMLSelectElement>) => onChange({ ...combatState, npcReward: e.target.value as NpcReward });

  const diceTypes = [
    { label: 'd4', sides: 4, color: 'from-blue-900 to-blue-700' },
    { label: 'd6', sides: 6, color: 'from-green-900 to-green-700' },
    { label: 'd8', sides: 8, color: 'from-purple-900 to-purple-700' },
    { label: 'd10', sides: 10, color: 'from-orange-900 to-orange-700' },
    { label: 'd12', sides: 12, color: 'from-pink-900 to-pink-700' },
    { label: 'd20', sides: 20, color: 'from-blood-dark to-blood-red' },
    { label: 'd100', sides: 100, color: 'from-gray-800 to-gray-600' },
  ];

  const modes = [
    { mode: NarratorMode.COMBAT, icon: Sword, label: 'Combat' },
    { mode: NarratorMode.BESTIARY, icon: Ghost, label: 'Bestiaire' },
    { mode: NarratorMode.WORLD, icon: Globe, label: 'Monde' },
    { mode: NarratorMode.INTERACTIVE, icon: Box, label: 'Objet' },
    { mode: NarratorMode.NPC, icon: UserCircle, label: 'Perso' },
    { mode: NarratorMode.LOOT, icon: Search, label: 'Fouille' },
    { mode: NarratorMode.DICE, icon: Dices, label: 'Dés' }
  ];

  // Définition dynamique du placeholder
  const getPlaceholder = () => {
      switch (currentMode) {
          case NarratorMode.BESTIARY: return "Ex: Gobelin, Dragon Rouge...";
          case NarratorMode.COMBAT: return "Ex: Orc, Garde...";
          case NarratorMode.WORLD: return "Ex: Ruines elfiques, Taverne...";
          case NarratorMode.NPC: return "Ex: Aubergiste borgne, Marchand...";
          case NarratorMode.LOOT: return "Ex: Coffre, Cadavre...";
          case NarratorMode.INTERACTIVE: return "Ex: Levier, Autel...";
          default: return "Cible...";
      }
  };

  const getTargetLabel = () => {
      switch (currentMode) {
          case NarratorMode.WORLD: return "Nom du Lieu";
          case NarratorMode.NPC: return "Identité du Personnage";
          case NarratorMode.INTERACTIVE: return "Détail / Objet";
          default: return "Nom / Type";
      }
  };

  return (
    <div className="bg-darker-metal border-2 border-gold-dark/30 rounded-lg shadow-2xl relative overflow-hidden flex flex-col h-full no-scrollbar">
      
      <nav className="flex flex-row border-b border-gold-dark/30 shrink-0 bg-black/40 overflow-x-auto no-scrollbar">
        {modes.map((tab) => (
          <button
            key={tab.mode}
            onClick={() => handleModeChange(tab.mode)}
            className={`flex-1 min-w-[65px] py-3 flex flex-col items-center justify-center gap-1 transition-all
              ${currentMode === tab.mode 
                ? 'bg-blood-dark/30 text-gold-antique shadow-[inset_0_-3px_0_#c5a059]' 
                : 'text-gray-500 hover:text-gray-400 hover:bg-white/5'}
            `}
          >
            <tab.icon className={`w-4 h-4 ${currentMode === tab.mode ? 'text-gold-antique' : 'text-gray-600'}`} />
            <span className="text-[7px] font-header uppercase tracking-tighter leading-none">{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-4 relative z-10 flex flex-col">

        {currentMode !== NarratorMode.DICE && (
            <div className="space-y-1.5 animate-fade-in">
                <label className="flex items-center gap-2 text-gold-antique font-header text-[8px] uppercase tracking-widest">
                    <BookOpen className="w-3 h-3 text-blood-red" /> Style Narration
                </label>
                <div className="relative">
                  <select
                    value={combatState.style}
                    onChange={handleStyleChange}
                    className="w-full bg-dark-metal text-parchment font-body border border-gold-dark/30 rounded px-3 py-2 text-[11px] outline-none appearance-none cursor-pointer focus:border-gold-antique transition-colors"
                  >
                    {Object.values(NarrationStyle).map((style) => (
                        <option key={style} value={style}>{style}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gold-dark pointer-events-none" />
                </div>
            </div>
        )}
        
        {currentMode === NarratorMode.COMBAT && (
            <div className="space-y-4 animate-fade-in">
                <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-gold-antique font-header text-[8px] uppercase tracking-widest">
                        <Sword className="w-3 h-3 text-blood-red" /> L'Arme
                    </label>
                    <select
                      value={combatState.weapon}
                      onChange={handleWeaponChange}
                      className="w-full bg-dark-metal text-parchment font-body border border-gold-dark/30 rounded px-3 py-2 text-[11px] outline-none appearance-none"
                    >
                      {Object.values(WeaponType).map((weapon) => (
                          <option key={weapon} value={weapon}>{weapon}</option>
                      ))}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-gold-antique font-header text-[8px] uppercase tracking-widest">
                        <User className="w-3 h-3 text-blood-red" /> Zone Visée
                    </label>
                    <select
                      value={combatState.bodyPart}
                      onChange={handleBodyPartChange}
                      className="w-full bg-dark-metal text-parchment font-body border border-gold-dark/30 rounded px-3 py-2 text-[11px] outline-none appearance-none"
                    >
                      {Object.values(BodyPart).map((part) => (
                          <option key={part} value={part}>{part}</option>
                      ))}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-gold-antique font-header text-[8px] uppercase tracking-widest">
                        <Skull className="w-3 h-3 text-blood-red" /> Résultat Dé
                    </label>
                    <select
                      value={combatState.result}
                      onChange={handleResultChange}
                      className="w-full bg-dark-metal text-parchment font-body border border-gold-dark/30 rounded px-3 py-2 text-[11px] outline-none appearance-none"
                    >
                      {Object.values(DiceResult).map((result) => (
                          <option key={result} value={result}>{result}</option>
                      ))}
                    </select>
                </div>
            </div>
        )}

        {currentMode === NarratorMode.BESTIARY && (
            <div className="space-y-4 animate-fade-in">
                <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-gold-antique font-header text-[8px] uppercase tracking-widest">
                        <GraduationCap className="w-3 h-3 text-blood-red" /> Expérience du MJ
                    </label>
                    <select
                      value={combatState.mechanicalDifficulty}
                      onChange={handleMechanicalDifficultyChange}
                      className="w-full bg-dark-metal text-parchment font-body border border-gold-dark/30 rounded px-3 py-2 text-[11px] outline-none appearance-none"
                    >
                      {Object.values(MechanicalDifficulty).map((diff) => (
                          <option key={diff} value={diff}>{diff}</option>
                      ))}
                    </select>
                </div>

                <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-gold-antique font-header text-[8px] uppercase tracking-widest">
                        <Star className="w-3 h-3 text-blood-red" /> Expérience des Joueurs
                    </label>
                    <select
                      value={combatState.playerExperience}
                      onChange={handlePlayerExperienceChange}
                      className="w-full bg-dark-metal text-parchment font-body border border-gold-dark/30 rounded px-3 py-2 text-[11px] outline-none appearance-none"
                    >
                      {Object.values(PlayerExperience).map((exp) => (
                          <option key={exp} value={exp}>{exp}</option>
                      ))}
                    </select>
                </div>

                <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-gold-antique font-header text-[8px] uppercase tracking-widest">
                        <Users className="w-3 h-3 text-blood-red" /> Nombre de Joueurs
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                            <button
                                key={n}
                                onClick={() => setPartySize(n)}
                                className={`py-2 rounded border text-[10px] font-bold font-header transition-all ${combatState.partySize === n ? 'bg-gold-antique text-black border-gold-antique' : 'bg-black/40 border-gold-dark/20 text-gold-dark hover:border-gold-dark/50'}`}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-gold-antique font-header text-[8px] uppercase tracking-widest">
                        <Skull className="w-3 h-3 text-blood-red" /> Niveau de Danger (FP)
                    </label>
                    <select
                      value={combatState.monsterCR}
                      onChange={handleCRChange}
                      className="w-full bg-dark-metal text-parchment font-body border border-gold-dark/30 rounded px-3 py-2 text-[11px] outline-none appearance-none"
                    >
                      {Object.values(MonsterCR).map((cr) => (
                          <option key={cr} value={cr}>{cr}</option>
                      ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={toggleLeader}
                      className={`py-2 rounded border transition-all flex items-center justify-center gap-2 font-header text-[7px] md:text-[8px] uppercase tracking-widest
                        ${combatState.isLeader 
                          ? 'bg-gold-dark/20 border-gold-antique text-gold-antique shadow-glow-gold' 
                          : 'bg-black border-gold-dark/20 text-gray-600 opacity-50'}
                      `}
                    >
                      <ShieldAlert className={`w-3 h-3 ${combatState.isLeader ? 'text-gold-antique' : 'text-gray-700'}`} />
                      Alpha / Chef
                    </button>

                    <button 
                      onClick={toggleGroup}
                      className={`py-2 rounded border transition-all flex items-center justify-center gap-2 font-header text-[7px] md:text-[8px] uppercase tracking-widest
                        ${combatState.isGroup 
                          ? 'bg-blood-dark/20 border-blood-red text-blood-red' 
                          : 'bg-black border-gold-dark/20 text-gray-600 opacity-50'}
                      `}
                    >
                      <Users className={`w-3 h-3 ${combatState.isGroup ? 'text-blood-red' : 'text-gray-700'}`} />
                      Meute / Groupe
                    </button>
                </div>
                
                <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-gold-antique font-header text-[8px] uppercase tracking-widest">
                        <Map className="w-3 h-3 text-blood-red" /> Lieu
                    </label>
                    <select
                      value={combatState.environmentType}
                      onChange={handleEnvironmentChange}
                      className="w-full bg-dark-metal text-parchment font-body border border-gold-dark/30 rounded px-3 py-2 text-[11px] outline-none appearance-none"
                    >
                      {Object.values(EnvironmentType).map((env) => (
                          <option key={env} value={env}>{env}</option>
                      ))}
                    </select>
                </div>
            </div>
        )}

        {currentMode === NarratorMode.INTERACTIVE && (
            <div className="space-y-4 animate-fade-in">
                <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-gold-antique font-header text-[8px] uppercase tracking-widest">
                        <Box className="w-3 h-3 text-blood-red" /> Objet
                    </label>
                    <select
                      value={combatState.interactiveObj}
                      onChange={handleInteractiveObjChange}
                      className="w-full bg-dark-metal text-parchment font-body border border-gold-dark/30 rounded px-3 py-2 text-[11px] outline-none appearance-none"
                    >
                      {Object.values(InteractiveObjectType).map((obj) => (
                          <option key={obj} value={obj}>{obj}</option>
                      ))}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-gold-antique font-header text-[8px] uppercase tracking-widest">
                        <HandMetal className="w-3 h-3 text-blood-red" /> Action
                    </label>
                    <select
                      value={combatState.interactionAction}
                      onChange={handleInteractionActionChange}
                      className="w-full bg-dark-metal text-parchment font-body border border-gold-dark/30 rounded px-3 py-2 text-[11px] outline-none appearance-none"
                    >
                      {Object.values(InteractionAction).map((action) => (
                          <option key={action} value={action}>{action}</option>
                      ))}
                    </select>
                </div>

                {combatState.interactionAction === InteractionAction.RIDDLE && (
                    <div className="space-y-1.5 animate-fade-in">
                        <label className="flex items-center gap-2 text-gold-antique font-header text-[8px] uppercase tracking-widest">
                            <Brain className="w-3 h-3 text-blood-red" /> Difficulté du Puzzle
                        </label>
                        <select
                          value={combatState.riddleDifficulty}
                          onChange={handleRiddleDifficultyChange}
                          className="w-full bg-dark-metal text-parchment font-body border border-gold-dark/30 rounded px-3 py-2 text-[11px] outline-none appearance-none"
                        >
                          {Object.values(RiddleDifficulty).map((diff) => (
                              <option key={diff} value={diff}>{diff}</option>
                          ))}
                        </select>
                    </div>
                )}
                
                {(combatState.interactionAction === InteractionAction.RIDDLE || combatState.interactionAction === InteractionAction.OPEN) && (
                    <div className="space-y-1.5 animate-fade-in">
                        <label className="flex items-center gap-2 text-gold-antique font-header text-[8px] uppercase tracking-widest">
                            <Gem className="w-3 h-3 text-blood-red" /> Type de Récompense
                        </label>
                        <select
                          value={combatState.lootType}
                          onChange={handleLootTypeChange}
                          className="w-full bg-dark-metal text-parchment font-body border border-gold-dark/30 rounded px-3 py-2 text-[11px] outline-none appearance-none"
                        >
                          {Object.values(LootType).map((type) => (
                              <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                    </div>
                )}
            </div>
        )}

        {currentMode === NarratorMode.LOOT && (
            <div className="space-y-1.5 animate-fade-in">
                <label className="flex items-center gap-2 text-gold-antique font-header text-[8px] uppercase tracking-widest">
                    <Gem className="w-3 h-3 text-blood-red" /> Butin
                </label>
                <select
                  value={combatState.lootType}
                  onChange={handleLootTypeChange}
                  className="w-full bg-dark-metal text-parchment font-body border border-gold-dark/30 rounded px-3 py-2 text-[11px] outline-none appearance-none"
                >
                  {Object.values(LootType).map((type) => (
                      <option key={type} value={type}>{type}</option>
                  ))}
                </select>
            </div>
        )}

        {currentMode === NarratorMode.WORLD && (
            <div className="space-y-4 animate-fade-in">
                <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-gold-antique font-header text-[8px] uppercase tracking-widest">
                        <Map className="w-3 h-3 text-blood-red" /> Lieu
                    </label>
                    <select
                      value={combatState.environmentType}
                      onChange={handleEnvironmentChange}
                      className="w-full bg-dark-metal text-parchment font-body border border-gold-dark/30 rounded px-3 py-2 text-[11px] outline-none appearance-none"
                    >
                      {Object.values(EnvironmentType).map((env) => (
                          <option key={env} value={env}>{env}</option>
                      ))}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-gold-antique font-header text-[8px] uppercase tracking-widest">
                        <Globe className="w-3 h-3 text-blood-red" /> Ambiance
                    </label>
                    <select
                      value={combatState.atmosphere}
                      onChange={handleAtmosphereChange}
                      className="w-full bg-dark-metal text-parchment font-body border border-gold-dark/30 rounded px-3 py-2 text-[11px] outline-none appearance-none"
                    >
                      {Object.values(WorldAtmosphere).map((atm) => (
                          <option key={atm} value={atm}>{atm}</option>
                      ))}
                    </select>
                </div>
            </div>
        )}

        {currentMode === NarratorMode.NPC && (
            <div className="space-y-4 animate-fade-in">
                <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-gold-antique font-header text-[8px] uppercase tracking-widest">
                        <MessageSquareText className="w-3 h-3 text-blood-red" /> Type d'Interaction
                    </label>
                    <div className="relative">
                      <select
                        value={combatState.npcAction}
                        onChange={handleNpcActionChange}
                        className="w-full bg-dark-metal text-parchment font-body border border-gold-dark/30 rounded px-3 py-2 text-[11px] outline-none appearance-none"
                      >
                        {Object.values(NpcAction).map((act) => (
                            <option key={act} value={act}>{act}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gold-dark pointer-events-none" />
                    </div>
                </div>

                {combatState.npcAction === NpcAction.RIDDLE && (
                    <div className="space-y-1.5 animate-fade-in">
                        <label className="flex items-center gap-2 text-gold-antique font-header text-[8px] uppercase tracking-widest">
                            <Brain className="w-3 h-3 text-blood-red" /> Difficulté de l'Énigme
                        </label>
                        <div className="relative">
                          <select
                            value={combatState.riddleDifficulty}
                            onChange={handleRiddleDifficultyChange}
                            className="w-full bg-dark-metal text-parchment font-body border border-gold-dark/30 rounded px-3 py-2 text-[11px] outline-none appearance-none"
                          >
                            {Object.values(RiddleDifficulty).map((diff) => (
                                <option key={diff} value={diff}>{diff}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gold-dark pointer-events-none" />
                        </div>
                    </div>
                )}

                {combatState.npcAction === NpcAction.QUEST && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-2 text-gold-antique font-header text-[8px] uppercase tracking-widest">
                                <Map className="w-3 h-3 text-blood-red" /> Complexité de la Quête
                            </label>
                            <div className="relative">
                              <select
                                value={combatState.questComplexity}
                                onChange={handleQuestComplexityChange}
                                className="w-full bg-dark-metal text-parchment font-body border border-gold-dark/30 rounded px-3 py-2 text-[11px] outline-none appearance-none"
                              >
                                {Object.values(QuestComplexity).map((comp) => (
                                    <option key={comp} value={comp}>{comp}</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gold-dark pointer-events-none" />
                            </div>
                        </div>

                        {combatState.questComplexity !== QuestComplexity.NONE && (
                            <div className="space-y-1.5 animate-fade-in">
                                <label className="flex items-center gap-2 text-gold-antique font-header text-[8px] uppercase tracking-widest">
                                    <Skull className="w-3 h-3 text-blood-red" /> Adversaire (Si Combat)
                                </label>
                                <div className="relative">
                                  <select
                                    value={combatState.monsterCR}
                                    onChange={handleCRChange}
                                    className="w-full bg-dark-metal text-parchment font-body border border-gold-dark/30 rounded px-3 py-2 text-[11px] outline-none appearance-none"
                                  >
                                    {Object.values(MonsterCR).map((cr) => (
                                        <option key={cr} value={cr}>{cr}</option>
                                    ))}
                                  </select>
                                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gold-dark pointer-events-none" />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-gold-antique font-header text-[8px] uppercase tracking-widest">
                        <Gem className="w-3 h-3 text-blood-red" /> Récompense / Gain
                    </label>
                    <div className="relative">
                      <select
                        value={combatState.npcReward}
                        onChange={handleNpcRewardChange}
                        className="w-full bg-dark-metal text-parchment font-body border border-gold-dark/30 rounded px-3 py-2 text-[11px] outline-none appearance-none"
                      >
                        {Object.values(NpcReward).map((rew) => (
                            <option key={rew} value={rew}>{rew}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gold-dark pointer-events-none" />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-gold-antique font-header text-[8px] uppercase tracking-widest">
                        <Globe className="w-3 h-3 text-blood-red" /> Ambiance
                    </label>
                    <div className="relative">
                      <select
                        value={combatState.atmosphere}
                        onChange={handleAtmosphereChange}
                        className="w-full bg-dark-metal text-parchment font-body border border-gold-dark/30 rounded px-3 py-2 text-[11px] outline-none appearance-none"
                      >
                        {Object.values(WorldAtmosphere).map((atm) => (
                            <option key={atm} value={atm}>{atm}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gold-dark pointer-events-none" />
                    </div>
                </div>
            </div>
        )}

        {currentMode === NarratorMode.DICE && (
            <div className="space-y-4 animate-fade-in flex-grow flex flex-col justify-center">
                 <div className="grid grid-cols-3 gap-2">
                    {diceTypes.map((dice) => (
                        <button
                            key={dice.sides}
                            onClick={() => onDiceRoll(dice.sides)}
                            className={`
                                group/dice relative py-3 rounded border border-gold-dark/20 
                                bg-gradient-to-br ${dice.color} shadow-lg transition-all active:scale-95 flex items-center justify-center
                            `}
                        >
                            <span className="relative z-10 font-header text-[9px] text-white drop-shadow-md">
                                {dice.label}
                            </span>
                        </button>
                    ))}
                 </div>
            </div>
        )}

        {currentMode !== NarratorMode.DICE && (
            <>
                <div className="space-y-1.5 animate-fade-in">
                  <label className="flex items-center gap-2 text-gold-antique font-header text-[8px] uppercase tracking-widest">
                      <Target className="w-3 h-3 text-blood-red" /> {getTargetLabel()}
                  </label>
                  <input
                      type="text"
                      value={combatState.target}
                      onChange={handleTargetChange}
                      placeholder={getPlaceholder()}
                      className="w-full bg-black text-parchment font-body border border-gold-dark/30 rounded px-3 py-2 text-[11px] outline-none placeholder-gray-700 focus:border-gold-antique transition-colors"
                  />
                </div>
                <div className="pt-2 shrink-0">
                    <button
                    onClick={onSubmit}
                    disabled={isLoading}
                    className={`
                        w-full py-3 rounded border border-gold-dark/50
                        font-header text-[10px] uppercase tracking-[0.2em] font-bold
                        transition-all flex items-center justify-center gap-2
                        ${isLoading 
                        ? 'bg-gray-900 cursor-not-allowed text-gray-500' 
                        : 'bg-blood-dark hover:bg-blood-red text-gold-antique shadow-glow-red active:scale-[0.98]'
                        }
                    `}
                    >
                    {isLoading ? (
                        <>
                            <div className="w-3 h-3 border-2 border-gold-antique/20 border-t-gold-antique rounded-full animate-spin"></div>
                            Invocation...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-3 h-3" />
                            Lancer Action
                        </>
                    )}
                    </button>
                </div>
            </>
        )}
      </div>
    </div>
  );
};

export default NarratorForm;
