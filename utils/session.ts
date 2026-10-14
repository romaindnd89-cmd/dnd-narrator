import { Currency, Player, SessionState, VaultItem } from '../types';
import { newId } from './storage';

export const createSession = (): SessionState => ({
  id: newId(),
  name: 'Session de Romain',
  players: [],
  isActive: false,
});

export const createPlayer = (name: string): Player => ({
  id: newId(),
  name: name.trim(),
  currency: { copper: 0, silver: 0, gold: 0 },
  inventory: [],
  conditions: [],
});

export const createItem = (name: string, description: string, opts: { imageUrl?: string; isPenalty?: boolean } = {}): VaultItem => ({
  id: newId(),
  name: name.trim() || 'Objet inconnu',
  description: description.trim() || 'Aucune description.',
  quantity: 1,
  timestamp: Date.now(),
  imageUrl: opts.imageUrl,
  isPenalty: !!opts.isPenalty,
});

/** Modifie un seul joueur et renvoie une nouvelle session. */
export const updatePlayer = (session: SessionState, playerId: string, fn: (p: Player) => Player): SessionState => ({
  ...session,
  players: session.players.map((p) => (p.id === playerId ? fn(p) : p)),
});

export const giveItem = (session: SessionState, playerId: string, item: VaultItem): SessionState =>
  updatePlayer(session, playerId, (p) => ({ ...p, inventory: [item, ...(p.inventory ?? [])] }));

/**
 * Ajoute/retire de la monnaie avec conversion automatique (10 pc = 1 pa, 10 pa = 1 po).
 * Calcul en pièces de cuivre : plus simple et sans boucle.
 */
export const changeCurrency = (c: Currency, type: keyof Currency, amount: number): Currency => {
  const factor = { copper: 1, silver: 10, gold: 100 }[type];
  const total = Math.max(0, (c.gold || 0) * 100 + (c.silver || 0) * 10 + (c.copper || 0) + amount * factor);
  return { gold: Math.floor(total / 100), silver: Math.floor((total % 100) / 10), copper: total % 10 };
};

/** Le dé « Objet | Description » renvoyé dans le butin des monstres. */
export const splitLoot = (loot: string, monsterName: string) => {
  const [name, ...rest] = loot.split('|').map((s) => s.trim());
  const desc = rest.join(' ').trim();
  return desc ? { name: name || 'Butin', desc } : { name: `Butin : ${monsterName || 'créature'}`, desc: name };
};
