import React, { useMemo, useState } from 'react';
import { AlertOctagon, Brain, Check, Copy, Dices, Gem, Globe, Loader2, ScrollText, Skull, UserCircle, Volume2, VolumeX, Wand2 } from 'lucide-react';
import { NarratorMode, SessionState } from '../types';
import { parseNarration, plainText, speakableText } from '../utils/parser';
import { createItem, giveItem, splitLoot, updatePlayer } from '../utils/session';
import { newId } from '../utils/storage';
import { useSpeech } from '../hooks/useSpeech';
import { DiceSection, ItemSection, MonsterSection, NpcSection, ProseSection, RiddleSection, WorldSection } from './story/Sections';
import { cx, IconButton } from './ui';

export interface Narration {
  /** Identifiant unique : sert de `key` pour remettre la carte à zéro à chaque nouvelle narration. */
  id: string;
  text: string;
  /** Mode au moment de la génération (avant : on utilisait le mode courant → la carte changeait si on changeait d'onglet). */
  mode: NarratorMode;
  model?: string;
}

interface StoryBoxProps {
  narration: Narration;
  session: SessionState;
  onUpdateSession: (session: SessionState) => void;
  onClose: () => void;
}

const StoryBox: React.FC<StoryBoxProps> = ({ narration, session, onUpdateSession, onClose }) => {
  const parsed = useMemo(() => parseNarration(narration.text, narration.mode), [narration]);
  const speech = useSpeech();
  const [copied, setCopied] = useState(false);
  const speakText = useMemo(() => speakableText(parsed), [parsed]);

  // Titre et couleur de la carte selon le contenu
  const head = parsed.dice
    ? { icon: Dices, title: 'Lancer de dés', tone: 'text-gold-antique', border: 'border-gold-dark/40' }
    : parsed.monster
      ? { icon: Skull, title: parsed.npc ? 'PNJ & quête' : 'Bestiaire', tone: 'text-gold-antique', border: 'border-gold-dark/40' }
      : parsed.riddle
        ? { icon: Brain, title: 'Énigme', tone: 'text-purple-300', border: 'border-purple-900/50' }
        : parsed.item?.kind === 'trap'
          ? { icon: AlertOctagon, title: 'Piège déclenché', tone: 'text-blood-red', border: 'border-blood-red/50' }
          : parsed.item?.kind === 'blessing'
            ? { icon: Wand2, title: 'Bénédiction', tone: 'text-cyan-300', border: 'border-cyan-500/40' }
            : parsed.item && !parsed.npc
              ? { icon: Gem, title: narration.mode === NarratorMode.LOOT ? 'Butin découvert' : 'Objet trouvé', tone: 'text-gold-antique', border: 'border-gold-dark/40' }
              : parsed.npc
                ? { icon: UserCircle, title: 'Personnage non joueur', tone: 'text-gold-antique', border: 'border-gold-dark/40' }
                : parsed.world
                  ? { icon: Globe, title: 'Environnement', tone: 'text-gold-antique', border: 'border-gold-dark/40' }
                  : { icon: ScrollText, title: 'Narration', tone: 'text-gold-antique', border: 'border-gold-dark/40' };

  const giveObject = (playerId: string) => {
    const item = parsed.item;
    if (!item) return;
    const description = [item.visual, item.effect].filter(Boolean).join(' — ');
    // Pièges et bénédictions deviennent des ÉTATS du joueur (avec le bouton × pour les retirer),
    // les objets vont dans l'inventaire.
    if (item.kind === 'item') {
      onUpdateSession(giveItem(session, playerId, createItem(item.name, description)));
    } else {
      onUpdateSession(
        updatePlayer(session, playerId, (p) => ({
          ...p,
          conditions: [
            { id: newId(), name: item.name, description: item.effect || item.visual, isPenalty: item.kind === 'trap', timestamp: Date.now() },
            ...(p.conditions ?? []),
          ],
        }))
      );
    }
  };

  const giveLoot = (playerId: string) => {
    if (!parsed.monster?.loot) return;
    const { name, desc } = splitLoot(parsed.monster.loot, parsed.monster.name);
    onUpdateSession(giveItem(session, playerId, createItem(name, desc)));
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(plainText(narration.text));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* presse-papiers indisponible */
    }
  };

  const Icon = head.icon;
  const hasRewardWithContext = parsed.item && (parsed.npc || parsed.riddle || parsed.monster);

  return (
    <article className={cx('w-full bg-darker-metal border-2 rounded-2xl animate-fade-in overflow-hidden shadow-2xl', head.border)}>
      <header className="flex items-center justify-between gap-2 pl-4 pr-2 py-2 border-b border-white/10 bg-black/80">
        <span className={cx('font-header text-xs uppercase tracking-[0.25em] flex items-center gap-2 min-w-0', head.tone)}>
          <Icon className="w-4 h-4 shrink-0" aria-hidden /> <span className="truncate">{head.title}</span>
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {speakText && !parsed.dice && (
            <IconButton
              label={speech.status === 'playing' ? 'Arrêter la lecture' : 'Lire à voix haute'}
              tone="gold"
              active={speech.status === 'playing'}
              onClick={() => speech.toggle(speakText)}
              disabled={speech.status === 'loading'}
            >
              {speech.status === 'loading' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : speech.status === 'playing' ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </IconButton>
          )}
          {!parsed.dice && (
            <IconButton label="Copier le texte" onClick={copy}>
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </IconButton>
          )}
          <IconButton label="Fermer" onClick={onClose}>
            <span aria-hidden className="text-xl leading-none">×</span>
          </IconButton>
        </div>
      </header>

      {speech.error && (
        <p className="px-4 py-2 text-xs text-amber-400 bg-amber-900/20 border-b border-amber-700/30" role="status">
          {speech.error}
        </p>
      )}

      <div className="p-5 md:p-10 space-y-8">
        {parsed.dice && <DiceSection {...parsed.dice} />}
        {parsed.npc && <NpcSection npc={parsed.npc} />}
        {parsed.monster && <MonsterSection monster={parsed.monster} players={session.players} onGiveLoot={giveLoot} />}
        {parsed.riddle && <RiddleSection riddle={parsed.riddle} />}
        {parsed.item && (
          <ItemSection
            item={parsed.item}
            heading={hasRewardWithContext ? (parsed.riddle ? 'Récompense en cas de succès' : 'Récompense') : undefined}
            npcName={parsed.npc?.name}
            players={session.players}
            onGive={giveObject}
          />
        )}
        {parsed.world && <WorldSection world={parsed.world} />}
        {parsed.prose && <ProseSection text={parsed.prose} />}
      </div>

      {narration.model && narration.model !== 'démo' && (
        <footer className="px-4 py-2 text-[10px] text-gray-500 text-right border-t border-white/5">via {narration.model}</footer>
      )}
    </article>
  );
};

export default StoryBox;
