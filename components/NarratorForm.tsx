import React from 'react';
import {
  BookOpen, Box, Brain, Gem, Ghost, Globe, GraduationCap, HandMetal, Map, MessageSquareText, Search, ShieldAlert,
  Skull, Sparkles, Star, Sword, Target, User, UserCircle, Users,
} from 'lucide-react';
import {
  BodyPart, CombatState, DiceResult, EnvironmentType, InteractionAction, InteractiveObjectType, LootType, MechanicalDifficulty,
  MonsterCR, NarrationStyle, NarratorMode, NpcAction, NpcReward, PlayerExperience, QuestComplexity, RiddleDifficulty, WeaponType,
  WorldAtmosphere,
} from '../types';
import { cx, FieldLabel, SelectField } from './ui';

interface NarratorFormProps {
  combatState: CombatState;
  onChange: (newState: CombatState) => void;
  onSubmit: () => void;
  onDiceRoll: (sides: number) => void;
  isLoading: boolean;
}

const MODES = [
  { mode: NarratorMode.COMBAT, icon: Sword, label: 'Combat' },
  { mode: NarratorMode.BESTIARY, icon: Ghost, label: 'Bestiaire' },
  { mode: NarratorMode.NPC, icon: UserCircle, label: 'PNJ' },
  { mode: NarratorMode.WORLD, icon: Globe, label: 'Monde' },
  { mode: NarratorMode.INTERACTIVE, icon: Box, label: 'Objet' },
  { mode: NarratorMode.LOOT, icon: Search, label: 'Fouille' },
];

const DICE = [4, 6, 8, 10, 12, 20, 100];

const TARGET: Partial<Record<NarratorMode, { label: string; placeholder: string }>> = {
  [NarratorMode.COMBAT]: { label: 'Cible', placeholder: 'Ex : Orc, Garde…' },
  [NarratorMode.BESTIARY]: { label: 'Créature', placeholder: 'Ex : Gobelin, Dragon rouge…' },
  [NarratorMode.NPC]: { label: 'Identité du personnage', placeholder: 'Ex : Aubergiste borgne…' },
  [NarratorMode.WORLD]: { label: 'Nom du lieu', placeholder: 'Ex : Ruines elfiques…' },
  [NarratorMode.INTERACTIVE]: { label: 'Détail de l’objet', placeholder: 'Ex : Levier rouillé…' },
  [NarratorMode.LOOT]: { label: 'Où fouiller ?', placeholder: 'Ex : Cadavre, Bureau…' },
};

const QUEST_LEVELS = [QuestComplexity.SIMPLE, QuestComplexity.COMPLEX] as const;
const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8];

const NarratorForm: React.FC<NarratorFormProps> = ({ combatState: s, onChange, onSubmit, onDiceRoll, isLoading }) => {
  /** Met à jour un champ du formulaire. */
  const set = <K extends keyof CombatState>(key: K) => (value: CombatState[K]) => onChange({ ...s, [key]: value });

  const setNpcAction = (npcAction: NpcAction) =>
    onChange({
      ...s,
      npcAction,
      // « Donne une quête » avec « Sans quête » ne générait aucune quête : on passe à Simple.
      questComplexity: npcAction === NpcAction.QUEST && s.questComplexity === QuestComplexity.NONE ? QuestComplexity.SIMPLE : s.questComplexity,
    });

  const target = TARGET[s.mode];

  return (
    <div className="bg-darker-metal border-2 border-gold-dark/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
      <nav className="grid grid-cols-3 border-b border-gold-dark/30 bg-black/40" aria-label="Type de narration">
        {MODES.map((tab) => {
          const active = s.mode === tab.mode;
          return (
            <button
              key={tab.mode}
              type="button"
              onClick={() => onChange({ ...s, mode: tab.mode })}
              aria-pressed={active}
              className={cx(
                'min-h-[56px] py-2 flex flex-col items-center justify-center gap-1 transition-colors border-white/5 [&:nth-child(-n+3)]:border-b [&:not(:nth-child(3n))]:border-r',
                active ? 'bg-blood-dark/40 text-gold-antique shadow-[inset_0_-3px_0_#c5a059]' : 'text-gray-400 hover:text-parchment hover:bg-white/5'
              )}
            >
              <tab.icon className={cx('w-5 h-5', active ? 'text-gold-antique' : 'text-gray-500')} aria-hidden />
              <span className="text-[11px] font-header uppercase tracking-wide leading-none">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <form
        className="p-4 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        {s.mode === NarratorMode.COMBAT && (
          <>
            <SelectField id="weapon" label="L'arme" icon={Sword} value={s.weapon} options={Object.values(WeaponType)} onChange={set('weapon')} />
            <SelectField id="bodyPart" label="Zone visée" icon={User} value={s.bodyPart} options={Object.values(BodyPart)} onChange={set('bodyPart')} />
            <SelectField id="result" label="Résultat du dé" icon={Skull} value={s.result} options={Object.values(DiceResult)} onChange={set('result')} />
          </>
        )}

        {s.mode === NarratorMode.BESTIARY && (
          <>
            <SelectField id="cr" label="Niveau de danger (FP)" icon={Skull} value={s.monsterCR} options={Object.values(MonsterCR)} onChange={set('monsterCR')} />
            <div>
              <FieldLabel icon={Users}>Nombre de joueurs</FieldLabel>
              <div className="grid grid-cols-8 gap-1.5" role="radiogroup" aria-label="Nombre de joueurs">
                {PARTY_SIZES.map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={s.partySize === n}
                    onClick={() => set('partySize')(n)}
                    className={cx(
                      'h-10 rounded-lg border text-sm font-bold font-header transition-colors',
                      s.partySize === n ? 'bg-gold-antique text-black border-gold-antique' : 'bg-black/40 border-gold-dark/25 text-gold-dark hover:border-gold-dark/60'
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ToggleChip active={s.isLeader} onClick={() => set('isLeader')(!s.isLeader)} icon={ShieldAlert} label="Alpha / Chef" tone="gold" />
              <ToggleChip active={s.isGroup} onClick={() => set('isGroup')(!s.isGroup)} icon={Users} label="Meute / Groupe" tone="red" />
            </div>
            <SelectField id="env" label="Lieu" icon={Map} value={s.environmentType} options={Object.values(EnvironmentType)} onChange={set('environmentType')} />
            <SelectField
              id="playerExp"
              label="Expérience des joueurs"
              icon={Star}
              value={s.playerExperience}
              options={Object.values(PlayerExperience)}
              onChange={set('playerExperience')}
            />
            <SelectField
              id="gmExp"
              label="Expérience du MJ"
              icon={GraduationCap}
              value={s.mechanicalDifficulty}
              options={Object.values(MechanicalDifficulty)}
              onChange={set('mechanicalDifficulty')}
            />
          </>
        )}

        {s.mode === NarratorMode.INTERACTIVE && (
          <>
            <SelectField id="obj" label="Objet" icon={Box} value={s.interactiveObj} options={Object.values(InteractiveObjectType)} onChange={set('interactiveObj')} />
            <SelectField
              id="action"
              label="Action"
              icon={HandMetal}
              value={s.interactionAction}
              options={Object.values(InteractionAction)}
              onChange={set('interactionAction')}
            />
            {s.interactionAction === InteractionAction.RIDDLE && (
              <SelectField id="riddle" label="Difficulté du puzzle" icon={Brain} value={s.riddleDifficulty} options={Object.values(RiddleDifficulty)} onChange={set('riddleDifficulty')} />
            )}
            {s.interactionAction !== InteractionAction.TOUCH && (
              <SelectField id="loot" label="Type de récompense" icon={Gem} value={s.lootType} options={Object.values(LootType)} onChange={set('lootType')} />
            )}
          </>
        )}

        {s.mode === NarratorMode.LOOT && (
          <>
            <SelectField id="loot" label="Butin" icon={Gem} value={s.lootType} options={Object.values(LootType)} onChange={set('lootType')} />
            <SelectField id="env" label="Lieu" icon={Map} value={s.environmentType} options={Object.values(EnvironmentType)} onChange={set('environmentType')} />
          </>
        )}

        {s.mode === NarratorMode.WORLD && (
          <SelectField id="env" label="Lieu" icon={Map} value={s.environmentType} options={Object.values(EnvironmentType)} onChange={set('environmentType')} />
        )}

        {s.mode === NarratorMode.NPC && (
          <>
            <SelectField id="npcAction" label="Type d'interaction" icon={MessageSquareText} value={s.npcAction} options={Object.values(NpcAction)} onChange={setNpcAction} />
            {s.npcAction === NpcAction.RIDDLE && (
              <SelectField id="riddle" label="Difficulté de l'énigme" icon={Brain} value={s.riddleDifficulty} options={Object.values(RiddleDifficulty)} onChange={set('riddleDifficulty')} />
            )}
            {s.npcAction === NpcAction.QUEST && (
              <>
                <SelectField
                  id="quest"
                  label="Complexité de la quête"
                  icon={Map}
                  value={s.questComplexity === QuestComplexity.NONE ? QuestComplexity.SIMPLE : s.questComplexity}
                  options={QUEST_LEVELS}
                  onChange={set('questComplexity')}
                />
                <SelectField id="cr" label="Adversaire (si combat)" icon={Skull} value={s.monsterCR} options={Object.values(MonsterCR)} onChange={set('monsterCR')} />
              </>
            )}
            <SelectField id="reward" label="Récompense" icon={Gem} value={s.npcReward} options={Object.values(NpcReward)} onChange={set('npcReward')} />
          </>
        )}

        <SelectField id="atmo" label="Ambiance" icon={Globe} value={s.atmosphere} options={Object.values(WorldAtmosphere)} onChange={set('atmosphere')} />

        {(s.mode === NarratorMode.COMBAT || s.mode === NarratorMode.WORLD || s.mode === NarratorMode.NPC || s.mode === NarratorMode.BESTIARY) && (
          <SelectField id="style" label="Longueur du texte" icon={BookOpen} value={s.style} options={Object.values(NarrationStyle)} onChange={set('style')} />
        )}

        {target && (
          <div>
            <FieldLabel icon={Target} htmlFor="target">
              {target.label} <span className="normal-case tracking-normal text-gray-500 font-body">(facultatif)</span>
            </FieldLabel>
            <input
              id="target"
              type="text"
              value={s.target}
              onChange={(e) => set('target')(e.target.value)}
              placeholder={target.placeholder}
              autoComplete="off"
              className="w-full bg-black text-parchment font-body border border-gold-dark/30 rounded-lg px-3 py-2.5 outline-none placeholder:text-gray-600 focus:border-gold-antique transition-colors"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={cx(
            'w-full min-h-[52px] rounded-xl border border-gold-dark/50 font-header text-sm uppercase tracking-[0.2em] font-bold transition-all flex items-center justify-center gap-2',
            isLoading ? 'bg-gray-900 cursor-wait text-gray-500' : 'bg-blood-dark hover:bg-blood-red text-gold-antique shadow-glow-red active:scale-[0.98]'
          )}
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-gold-antique/20 border-t-gold-antique rounded-full animate-spin" aria-hidden />
              Invocation…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" aria-hidden /> Lancer l'action
            </>
          )}
        </button>
      </form>

      {/* Dés toujours accessibles, quel que soit le mode */}
      <div className="border-t border-gold-dark/20 bg-black/30 p-3">
        <span className="block text-[11px] font-header uppercase tracking-widest text-gold-dark mb-2 text-center">Lancer un dé</span>
        <div className="grid grid-cols-7 gap-1.5">
          {DICE.map((sides) => (
            <button
              key={sides}
              type="button"
              onClick={() => onDiceRoll(sides)}
              aria-label={`Lancer un d${sides}`}
              className={cx(
                'h-11 rounded-lg border font-header text-xs font-bold transition-all active:scale-90',
                sides === 20
                  ? 'bg-gradient-to-br from-blood-dark to-blood-red border-blood-red text-gold-antique'
                  : 'bg-dark-metal border-gold-dark/30 text-parchment hover:border-gold-antique'
              )}
            >
              d{sides}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const ToggleChip: React.FC<{ active: boolean; onClick: () => void; icon: React.ComponentType<{ className?: string }>; label: string; tone: 'gold' | 'red' }> = ({
  active,
  onClick,
  icon: Icon,
  label,
  tone,
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cx(
      'min-h-[44px] rounded-lg border transition-colors flex items-center justify-center gap-2 font-header text-[11px] uppercase tracking-wider',
      active
        ? tone === 'gold'
          ? 'bg-gold-dark/20 border-gold-antique text-gold-antique'
          : 'bg-blood-dark/30 border-blood-red text-red-300'
        : 'bg-black border-gold-dark/20 text-gray-500 hover:text-gray-300'
    )}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

export default NarratorForm;
