// Blocs d'affichage d'une narration. Ils s'empilent : un PNJ peut donner une quête
// (fiche de monstre) ET une récompense (objet), sans dupliquer de code.

import React, { useState } from 'react';
import {
  Activity, AlertTriangle, Brain, Eye, EyeOff, Gift, Lock, MapPin, MessageSquareText, PackagePlus,
  ScrollText, Sparkles, Sword, Users, Wand2, Wind, ZapOff, Dices, Gem,
} from 'lucide-react';
import { Player } from '../../types';
import { ItemData, MonsterData, NpcData, RiddleData, WorldData } from '../../utils/parser';
import { cx, PlayerPicker, ReadAloud, SectionTitle } from '../ui';

// ---------- PNJ ----------

export const NpcSection: React.FC<{ npc: NpcData }> = ({ npc }) => (
  <section className="relative bg-black/60 rounded-2xl border border-blood-red/40 px-5 pt-8 pb-6 text-center shadow-xl">
    <MessageSquareText
      className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 text-blood-red bg-black rounded-full p-2 border border-blood-red/40"
      aria-hidden
    />
    {npc.name && <h3 className="font-header text-gold-antique text-lg md:text-xl tracking-wide">{npc.name}</h3>}
    {npc.dialogue ? (
      <p className="font-body italic text-parchment pt-4 text-lg md:text-2xl leading-relaxed whitespace-pre-line">« {npc.dialogue} »</p>
    ) : (
      <p className="font-body text-gray-400 italic pt-4">Le personnage vous dévisage en silence.</p>
    )}
  </section>
);

// ---------- Monstre ----------

const StatTile: React.FC<{ stat: string }> = ({ stat }) => {
  const [label, value] = stat.split(/\s*:\s*/);
  return (
    <div className="bg-black/60 border border-gold-dark/25 rounded-lg py-2 px-1 text-center">
      {value !== undefined ? (
        <>
          <span className="block text-[10px] font-header text-gold-dark uppercase tracking-wider">{label}</span>
          <span className="block text-base font-bold text-parchment">{value}</span>
        </>
      ) : (
        <span className="block text-sm text-parchment">{stat}</span>
      )}
    </div>
  );
};

export const MonsterSection: React.FC<{
  monster: MonsterData;
  players: Player[];
  onGiveLoot: (playerId: string) => void;
}> = ({ monster, players, onGiveLoot }) => (
  <section className="space-y-6">
    <header className="text-center">
      <h2 className="text-3xl md:text-5xl font-header text-gold-antique uppercase leading-tight drop-shadow-glow break-words">{monster.name}</h2>
      <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
        {monster.cr && (
          <span className="px-3 py-1 bg-gold-dark/20 border border-gold-antique/30 rounded-full text-xs font-bold text-gold-antique tracking-wider">
            {monster.cr}
          </span>
        )}
        {monster.location && (
          <span className="flex items-center gap-1 text-xs text-gold-dark">
            <MapPin className="w-3 h-3" aria-hidden /> {monster.location}
          </span>
        )}
      </div>
    </header>

    {monster.intro && <ReadAloud>« {monster.intro} »</ReadAloud>}

    {monster.desc && (
      <div>
        <SectionTitle icon={ScrollText}>Aspect & nature</SectionTitle>
        <p className="text-parchment/90 text-base leading-relaxed">{monster.desc}</p>
      </div>
    )}

    {monster.stats.length > 0 && (
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2" aria-label="Statistiques">
        {monster.stats.map((s, i) => (
          <StatTile key={i} stat={s} />
        ))}
      </div>
    )}

    {monster.actions.length > 0 && (
      <div className="bg-black/70 border-2 border-blood-red/25 p-4 md:p-6 rounded-2xl">
        <SectionTitle icon={Activity} tone="text-red-400">
          Capacités
        </SectionTitle>
        <ul className="space-y-2 mt-3">
          {monster.actions.map((a, i) => (
            <li key={i} className="flex gap-3 p-3 bg-white/5 rounded-xl">
              <Sword className="w-4 h-4 text-blood-red shrink-0 mt-1 opacity-70" aria-hidden />
              <span className="text-parchment text-base leading-relaxed">{a}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {monster.effects && (
      <p className="text-sm text-parchment/80 italic flex gap-2">
        <Wind className="w-4 h-4 text-gold-dark shrink-0 mt-0.5" aria-hidden /> {monster.effects}
      </p>
    )}

    {(monster.guide || monster.help) && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {monster.guide && (
          <div className="bg-black/40 border border-gold-dark/20 p-4 rounded-2xl">
            <SectionTitle icon={Brain}>Guide MJ</SectionTitle>
            <p className="text-sm text-parchment/80 leading-relaxed">{monster.guide}</p>
          </div>
        )}
        {monster.help && (
          <div className="bg-black/40 border border-gold-dark/20 p-4 rounded-2xl">
            <SectionTitle icon={Users}>Équilibrage</SectionTitle>
            <p className="text-sm text-parchment/80 leading-relaxed">{monster.help}</p>
          </div>
        )}
      </div>
    )}

    {monster.weakness && (
      <div className="bg-blood-dark/20 border border-blood-red/30 p-4 rounded-2xl flex items-start gap-3">
        <ZapOff className="w-5 h-5 text-blood-red shrink-0 mt-0.5" aria-hidden />
        <div>
          <span className="text-[11px] font-header uppercase text-red-400 tracking-widest block mb-1">Faille (jet requis)</span>
          <p className="text-parchment text-sm italic">{monster.weakness}</p>
        </div>
      </div>
    )}

    {monster.loot && (
      <div className="bg-gold-dark/5 border border-gold-antique/25 p-4 rounded-2xl space-y-3">
        <div>
          <span className="text-[11px] font-header uppercase text-gold-antique tracking-widest block mb-1 flex items-center gap-2">
            <Gem className="w-3.5 h-3.5" aria-hidden /> Butin
          </span>
          <p className="text-parchment text-sm">{monster.loot.replace(/\s*\|\s*/, ' — ')}</p>
        </div>
        <PlayerPicker players={players} label="Donner le butin" icon={Gift} onPick={onGiveLoot} />
      </div>
    )}
  </section>
);

// ---------- Énigme ----------

export const RiddleSection: React.FC<{ riddle: RiddleData }> = ({ riddle }) => {
  const [revealed, setRevealed] = useState(false);
  return (
    <section className="space-y-4">
      {riddle.observation && <ReadAloud label="Observation">{riddle.observation}</ReadAloud>}

      {riddle.hint && (
        <div className="bg-purple-900/15 border border-purple-500/25 p-4 rounded-xl flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-purple-300 shrink-0 mt-0.5" aria-hidden />
          <div>
            <span className="text-[11px] font-header uppercase text-purple-300 tracking-widest block mb-1">Indice pour les joueurs</span>
            <p className="text-parchment/90 text-base">{riddle.hint}</p>
          </div>
        </div>
      )}

      {riddle.answer && (
        // Avant : révélée au survol de la souris → impossible sur téléphone. Maintenant : un appui.
        <button
          type="button"
          onClick={() => setRevealed(!revealed)}
          aria-expanded={revealed}
          className="w-full bg-black border border-purple-500/40 rounded-xl p-4 min-h-[72px] text-center transition-colors hover:border-purple-400"
        >
          {revealed ? (
            <>
              <span className="text-[11px] font-header uppercase text-purple-300 tracking-widest flex items-center justify-center gap-2 mb-2">
                <EyeOff className="w-3.5 h-3.5" aria-hidden /> Solution (appuyer pour masquer)
              </span>
              <span className="block text-white text-lg md:text-xl font-header">{riddle.answer}</span>
            </>
          ) : (
            <span className="text-purple-300 font-header text-sm uppercase tracking-widest flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" aria-hidden /> Révéler la réponse (MJ)
            </span>
          )}
        </button>
      )}
      {riddle.difficulty && <p className="text-center text-xs text-gray-400">Difficulté : {riddle.difficulty}</p>}
    </section>
  );
};

// ---------- Objet / piège / bénédiction ----------

const ITEM_THEME = {
  item: { title: 'from-gold-antique to-gold-dark', box: 'border-gold-dark/30', effect: 'text-emerald-300', effectLabel: 'Propriété', tone: 'gold' as const, icon: PackagePlus, action: 'Ajouter au coffre de…' },
  trap: { title: 'from-red-500 to-blood-red', box: 'border-blood-red/40', effect: 'text-red-200', effectLabel: 'Conséquence', tone: 'red' as const, icon: AlertTriangle, action: 'Infliger à…' },
  blessing: { title: 'from-cyan-200 to-blue-500', box: 'border-cyan-500/40', effect: 'text-cyan-100', effectLabel: 'Effet', tone: 'cyan' as const, icon: Wand2, action: 'Accorder le don à…' },
};

export const ItemSection: React.FC<{
  item: ItemData;
  heading?: string;
  npcName?: string;
  players: Player[];
  onGive: (playerId: string) => void;
}> = ({ item, heading, npcName, players, onGive }) => {
  const t = ITEM_THEME[item.kind];
  return (
    <section className="space-y-5">
      {item.thanks && (
        <div className="bg-black/50 border border-gold-dark/25 rounded-2xl p-5 text-center">
          <span className="text-[11px] font-header uppercase text-gold-dark tracking-widest block mb-2">
            {npcName ? `${npcName.split(',')[0]} — au retour des héros` : 'Au retour des héros'}
          </span>
          <p className="font-body italic text-parchment text-lg leading-relaxed">« {item.thanks} »</p>
        </div>
      )}
      <div className={cx('bg-black/40 border rounded-2xl p-5 md:p-8 flex flex-col items-center text-center', t.box)}>
        {heading && (
          <span className="text-[11px] font-header uppercase text-gold-antique tracking-widest mb-2 flex items-center gap-2">
            <Gift className="w-3.5 h-3.5" aria-hidden /> {heading}
          </span>
        )}
        <h2 className={cx('text-2xl md:text-4xl font-header uppercase text-transparent bg-clip-text bg-gradient-to-b mb-4 break-words', t.title)}>
          {item.name}
        </h2>
        {item.visual && <p className="text-parchment text-base md:text-lg italic leading-relaxed max-w-xl">{item.visual}</p>}
        {item.effect && (
          <div className="mt-5 pt-4 border-t border-white/10 w-full max-w-xl">
            <span className="text-[11px] font-header uppercase tracking-widest text-gray-400 block mb-1">{t.effectLabel}</span>
            <p className={cx('text-base font-bold', t.effect)}>{item.effect}</p>
          </div>
        )}
        <div className="mt-6 w-full">
          <PlayerPicker players={players} label={t.action} icon={t.icon} tone={t.tone} onPick={onGive} />
        </div>
      </div>
    </section>
  );
};

// ---------- Monde ----------

export const WorldSection: React.FC<{ world: WorldData }> = ({ world }) => (
  <section className="space-y-5">
    {world.place && <h2 className="text-2xl md:text-4xl font-header text-gold-antique uppercase text-center break-words">{world.place}</h2>}
    {world.visual && <ReadAloud>{world.visual}</ReadAloud>}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {world.sensory && (
        <div className="bg-black/40 border border-gold-dark/20 p-4 rounded-2xl">
          <SectionTitle icon={Wind}>Sons, odeurs, température</SectionTitle>
          <p className="text-parchment/85 text-base leading-relaxed">{world.sensory}</p>
        </div>
      )}
      {world.mood && (
        <div className="bg-black/40 border border-gold-dark/20 p-4 rounded-2xl">
          <SectionTitle icon={Eye}>Ambiance</SectionTitle>
          <p className="text-parchment/85 text-base leading-relaxed">{world.mood}</p>
        </div>
      )}
    </div>
  </section>
);

// ---------- Texte libre (combat) ----------

export const ProseSection: React.FC<{ text: string }> = ({ text }) => (
  <section className="max-w-2xl mx-auto text-gold-antique/95 text-lg md:text-2xl font-body italic leading-relaxed md:text-center space-y-4">
    {text
      .split(/\n+/)
      .filter((l) => l.trim())
      .map((line, i) => (
        <p key={i}>{line}</p>
      ))}
  </section>
);

// ---------- Dés ----------

export const DiceSection: React.FC<{ sides: number; roll: number; phrase: string }> = ({ sides, roll, phrase }) => {
  const crit = sides === 20 && roll === 20;
  const fumble = sides === 20 && roll === 1;
  return (
    <section className="flex flex-col items-center text-center py-4 md:py-10">
      <span className="flex items-center gap-2 font-header text-sm uppercase tracking-[0.3em] text-gold-dark">
        <Dices className="w-4 h-4" aria-hidden /> d{sides}
      </span>
      <span
        className={cx(
          'font-header font-black leading-none my-4 text-[96px] md:text-[140px] animate-fade-in',
          crit ? 'text-emerald-300 drop-shadow-[0_0_25px_rgba(52,211,153,0.6)]' : fumble ? 'text-blood-red drop-shadow-[0_0_25px_rgba(138,3,3,0.8)]' : 'text-gold-antique drop-shadow-glow'
        )}
        aria-live="polite"
      >
        {roll}
      </span>
      {crit && <span className="font-header uppercase tracking-widest text-emerald-300 mb-2">Coup critique !</span>}
      {fumble && <span className="font-header uppercase tracking-widest text-blood-red mb-2">Échec critique…</span>}
      <p className="text-parchment/70 italic max-w-md">{phrase}</p>
    </section>
  );
};
