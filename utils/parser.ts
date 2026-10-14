// ==================================================================================
// Lecture des réponses de l'IA : « ÉTIQUETTE : contenu » sur plusieurs lignes.
// Un seul parseur pour tous les modes (avant : 4 copies quasi identiques).
// ==================================================================================

import { NarratorMode } from '../types';

/** Étiquettes reconnues, sans accents ni espaces (« RÉPONSE » → « REPONSE », « GUIDE MJ » → « GUIDE_MJ »). */
const KNOWN_LABELS = new Set([
  'NOM', 'CR', 'FP', 'STATS', 'LIEU', 'INTRO', 'DESCRIPTION', 'ACTIONS', 'EFFETS', 'LOOT', 'FAIBLESSE', 'GUIDE_MJ', 'AIDE',
  'PNJ', 'DIALOGUE', 'PAROLES', 'REMERCIEMENT', 'OBJET', 'VISUEL', 'EFFET', 'PIEGE', 'BENEDICTION',
  'OBSERVATION', 'INDICE', 'REPONSE', 'DIFFICULTE', 'RECOMPENSE', 'SENSORIEL', 'AMBIANCE',
]);

const normalizeLabel = (raw: string) =>
  raw
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .trim()
    .replace(/\s+/g, '_');

export type Blocks = Record<string, string>;

export const parseBlocks = (text: string): Blocks => {
  const blocks: Blocks = {};
  let current: string | null = null;
  const lines = text.replace(/\*\*/g, '').replace(/\r/g, '').split('\n');

  for (const rawLine of lines) {
    if (/^\s*-{2,}.*-{2,}\s*$/.test(rawLine)) continue; // séparateurs du type « -- Récompense -- »
    const line = rawLine.replace(/^\s*[-•>#]+\s*/, '').trimEnd();

    const m = line.match(/^\s*([A-Za-zÀ-ÿ_ ]{2,20}?)\s*:\s*(.*)$/);
    if (m) {
      const label = normalizeLabel(m[1]);
      if (KNOWN_LABELS.has(label)) {
        current = label === 'PAROLES' ? 'DIALOGUE' : label === 'FP' ? 'CR' : label;
        // Si l'étiquette revient (ex. OBJET du PNJ après OBJET du monstre), la dernière gagne.
        blocks[current] = m[2].trim();
        continue;
      }
    }
    if (current) blocks[current] = blocks[current] ? `${blocks[current]}\n${line.trim()}` : line.trim();
  }

  for (const k of Object.keys(blocks)) {
    blocks[k] = blocks[k]
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .replace(/^["«]\s*|\s*["»]$/g, ''); // guillemets superflus
  }
  return blocks;
};

// ---------- Données prêtes à afficher ----------

export interface MonsterData {
  name: string; cr: string; stats: string[]; location: string; intro: string; desc: string;
  actions: string[]; effects: string; loot: string; weakness: string; guide: string; help: string;
}
export interface RiddleData { observation: string; hint: string; answer: string; difficulty: string }
export interface ItemData {
  name: string; visual: string; effect: string; thanks: string;
  kind: 'item' | 'trap' | 'blessing';
}
export interface NpcData { name: string; dialogue: string }
export interface WorldData { place: string; visual: string; sensory: string; mood: string }

export interface ParsedNarration {
  npc?: NpcData;
  monster?: MonsterData;
  riddle?: RiddleData;
  item?: ItemData;
  world?: WorldData;
  dice?: { sides: number; roll: number; phrase: string };
  /** Texte libre (combat, ou réponse non structurée). */
  prose?: string;
}

const splitLines = (s = '') => s.split('\n').map((l) => l.trim()).filter(Boolean);

export const parseNarration = (text: string, mode: NarratorMode): ParsedNarration => {
  if (mode === NarratorMode.DICE) {
    const m = text.match(/^DICE\|(\d+)\|(\d+)\|(.*)$/s);
    if (m) return { dice: { sides: Number(m[1]), roll: Number(m[2]), phrase: m[3] } };
  }

  const b = parseBlocks(text);
  const out: ParsedNarration = {};

  if (mode === NarratorMode.NPC && (b.PNJ || b.DIALOGUE)) out.npc = { name: b.PNJ ?? '', dialogue: b.DIALOGUE ?? '' };

  if ((mode === NarratorMode.BESTIARY || mode === NarratorMode.NPC) && b.NOM) {
    out.monster = {
      name: b.NOM,
      cr: b.CR ?? '',
      stats: (b.STATS ?? '').split(/[,|\n]/).map((s) => s.trim()).filter(Boolean),
      location: b.LIEU ?? '',
      intro: b.INTRO ?? '',
      desc: b.DESCRIPTION ?? '',
      actions: splitLines(b.ACTIONS),
      effects: b.EFFETS ?? '',
      loot: b.LOOT ?? '',
      weakness: b.FAIBLESSE ?? '',
      guide: b.GUIDE_MJ ?? '',
      help: b.AIDE ?? '',
    };
  }

  if ((mode === NarratorMode.INTERACTIVE || mode === NarratorMode.NPC) && (b.REPONSE || b.OBSERVATION)) {
    out.riddle = { observation: b.OBSERVATION ?? '', hint: b.INDICE ?? '', answer: b.REPONSE ?? '', difficulty: b.DIFFICULTE ?? '' };
  }

  if (mode === NarratorMode.LOOT || mode === NarratorMode.INTERACTIVE || mode === NarratorMode.NPC) {
    const name = b.PIEGE || b.BENEDICTION || b.OBJET;
    if (name) {
      out.item = {
        name,
        visual: b.VISUEL ?? '',
        effect: b.EFFET ?? '',
        thanks: b.REMERCIEMENT ?? '',
        kind: b.PIEGE ? 'trap' : b.BENEDICTION ? 'blessing' : 'item',
      };
    }
  }

  if (mode === NarratorMode.WORLD && (b.VISUEL || b.LIEU)) {
    out.world = { place: b.LIEU ?? '', visual: b.VISUEL ?? '', sensory: b.SENSORIEL ?? '', mood: b.AMBIANCE ?? '' };
  }

  if (!out.npc && !out.monster && !out.riddle && !out.item && !out.world) {
    out.prose = text.replace(/\*\*/g, '').trim();
  }
  return out;
};

/** Le texte à lire à voix haute : uniquement ce que les JOUEURS peuvent entendre (jamais la solution ni les notes MJ). */
export const speakableText = (p: ParsedNarration): string => {
  const parts: string[] = [];
  if (p.npc?.dialogue) parts.push(p.npc.dialogue);
  if (p.monster?.intro) parts.push(p.monster.intro);
  if (p.riddle?.observation) parts.push(p.riddle.observation);
  if (p.item && !p.npc) parts.push(`${p.item.name}. ${p.item.visual}`);
  if (p.world) parts.push([p.world.visual, p.world.sensory].filter(Boolean).join(' '));
  if (p.prose) parts.push(p.prose);
  return parts.join('\n\n').trim();
};

/** Version texte brut, pour le bouton « Copier ». */
export const plainText = (text: string) => text.replace(/\*\*/g, '').trim();
