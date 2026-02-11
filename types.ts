
export enum NarrationStyle {
  SIMPLE = 'Simple (Rapide)',
  MEDIUM = 'Semi-détaillée (Équilibrée)',
  IMMERSIVE = 'Immersive (Complète)',
}

export enum NarratorMode {
  COMBAT = 'Combat',
  LOOT = 'Fouille / Recherche',
  DICE = 'Dés',
}

export enum LootType {
  USELESS = 'Objet Inutile (Ambiance / Bric-à-brac)',
  USEFUL = 'Objet Utile (Petit consommable / Outil)',
}

export enum WeaponType {
  LONGSWORD = 'Épée longue',
  DAGGER = 'Dague',
  BATTLEAXE = 'Hache de bataille',
  BOW = 'Arc',
  FIRE_SPELL = 'Sortilège de feu',
  ICE_SPELL = 'Sortilège de glace',
  UNARMED = 'Mains nues',
  WARHAMMER = 'Marteau de guerre',
}

export enum BodyPart {
  UNSPECIFIED = 'Non spécifié / Général',
  HEAD = 'Tête',
  NECK = 'Cou',
  TORSO = 'Torse',
  LEFT_ARM = 'Bras Gauche',
  RIGHT_ARM = 'Bras Droit',
  LEFT_LEG = 'Jambe Gauche',
  RIGHT_LEG = 'Jambe Droite',
  EYES = 'Yeux',
  WINGS = 'Ailes (si applicable)',
}

export enum DiceResult {
  CRITICAL_FAIL = 'Échec Critique (1)',
  FAIL = 'Échec simple (Rater)',
  HIT = 'Touché',
  PARRIED = 'Paré par l\'ennemi',
  DODGED = 'Esquivé par l\'ennemi',
  CRITICAL_HIT = 'Coup Critique (20)',
  FATAL_BLOW = 'Coup fatal (Kill)',
}

export interface CombatState {
  mode: NarratorMode;
  style: NarrationStyle;
  // Combat props
  weapon: WeaponType;
  bodyPart: BodyPart;
  result: DiceResult;
  // Loot props
  lootType: LootType;
  // Shared props
  target: string; // Enemy name OR Loot location (Chest, Body...)
}

export interface NarrationResponse {
  text: string;
}
