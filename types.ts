
export enum NarrationStyle {
  SIMPLE = 'Simple (Rapide)',
  MEDIUM = 'Semi-détaillée (Équilibrée)',
  IMMERSIVE = 'Immersive (Complète)',
}

export enum NarratorMode {
  COMBAT = 'Combat',
  LOOT = 'Fouille / Recherche',
  INTERACTIVE = 'Objet Interactif / Énigme',
  DICE = 'Dés',
  WORLD = 'Monde / Ambiance',
  BESTIARY = 'Bestiaire / Monstre',
  NPC = 'Personnage / PNJ',
}

export enum NpcAction {
  DIALOGUE = 'Dialogue seulement',
  QUEST = 'Donne une quête',
  RIDDLE = 'Propose une énigme',
}

export enum QuestComplexity {
  NONE = 'Sans quête',
  SIMPLE = 'Simple',
  COMPLEX = 'Complexe',
}

export enum NpcReward {
  NONE = 'Aucun objet',
  ITEM = 'Gain avec un objet',
}

export enum MechanicalDifficulty {
  BEGINNER = 'Débutant (Simple & Pédagogique)',
  INTERMEDIATE = 'Intermédiaire (Standard D&D)',
  ADVANCED = 'Confirmé (Tactique & Riche)',
  PRO = 'Expert (Légendaire & Complexe)',
}

export enum PlayerExperience {
  INITIATION = 'Initiation (Indulgent / Fun)',
  BEGINNER = 'Débutant (Standard / Équilibré)',
  VETERAN = 'Vétéran (Tactique / Exigeant)',
  HARDCORE = 'Hardcore (Létal / Impitoyable)',
}

export enum MonsterCR {
  TRIVIAL = 'FP 0 - 1/4 (Menu fretin : 1-15 PV)',
  MINOR = 'FP 1/2 - 1 (Standard T1 : 16-45 PV)',
  LOW = 'FP 2 - 4 (Élite T1 / Boss : 50-95 PV)',
  MEDIUM = 'FP 5 - 10 (Aguerri T2 : 100-190 PV)',
  HIGH = 'FP 11 - 16 (Légendaire T3 : 200-350 PV)',
  BOSS = 'FP 17+ (Divin T4 : 400+ PV)',
}

export enum LootType {
  USELESS = 'Objet Inutile (Ambiance / Bric-à-brac)',
  USEFUL = 'Objet Utile (Petit consommable / Outil)',
}

export enum InteractiveObjectType {
  CHEST = 'Coffre / Malle',
  DOOR = 'Porte / Portail',
  BOOK = 'Livre / Grimoire',
  STATUE = 'Statue / Idole',
  ORB = 'Orbe / Sphère',
  CUBE = 'Cube / Artefact',
  ALALTAR = 'Autel / Stèle',
  POUCH = 'Bourse / Sac',
  MECHANISM = 'Levier / Mécanisme',
  MIRROR = 'Miroir',
  RANDOM = 'Aléatoire',
}

export enum InteractionAction {
  TOUCH = 'Toucher (Piège / Bénédiction)',
  OPEN = 'Ouvrir / Fouiller (Contenant)',
  RIDDLE = 'Énigme / Puzzle (Bloqué)',
}

export enum RiddleDifficulty {
  EASY = 'Niveau 1 (Facile / Intuitif)',
  MEDIUM = 'Niveau 2 (Moyen / Réflexion)',
  HARD = 'Niveau 3 (Difficile / Abstrait)',
}

export enum EnvironmentType {
  DUNGEON = 'Donjon / Crypte',
  CASTLE = 'Château / Fort',
  MANOR = 'Manoir / Demeure',
  FOREST = 'Forêt / Bois',
  CAVE = 'Grotte / Caverne',
  TAVERN = 'Taverne / Auberge',
  CITY = 'Ville / Ruelle',
  RUINS = 'Ruines Antiques',
  PLAINS = 'Plaines / Champ de bataille',
  MOUNTAIN = 'Montagne / Col',
  SWAMP = 'Marais / Marécage',
  TEMPLE = 'Temple / Sanctuaire',
  VILLAGE = 'Village / Hameau',
}

export enum WorldAtmosphere {
  DARK_FANTASY = 'Dark Fantasy (Standard)',
  HAUNTED = 'Hanté / Lugubre / Spectral',
  ABANDONED = 'Abandonné / Poussiéreux',
  BLOODY = 'Sanglant / Massacre récent',
  MAGICAL = 'Magique / Féérique / Mystique',
  DARKNESS = 'Ténèbres Totales / Oppressant',
  FOGGY = 'Brumeux / MystÉRIeux',
  BURNING = 'En flammes / Cendres',
}

export enum WeaponType {
  LONGSWORD = 'Épée longue',
  DAGGER = 'Dague',
  BATTLEAXE = 'Hache de bataille',
  BOW = 'Arc',
  FIRE_SPELL = 'Sortilège de feu',
  ICE_SPELL = 'Sortilège de glace',
  NATURE_SPELL = 'Sortilège de Nature / Lianes',
  MAGIC_SPELL = 'Sortilège / Magie (Générique)',
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
  weapon: WeaponType;
  bodyPart: BodyPart;
  result: DiceResult;
  lootType: LootType;
  environmentType: EnvironmentType;
  atmosphere: WorldAtmosphere;
  interactiveObj: InteractiveObjectType;
  interactionAction: InteractionAction;
  riddleDifficulty: RiddleDifficulty;
  monsterCR: MonsterCR;
  mechanicalDifficulty: MechanicalDifficulty;
  playerExperience: PlayerExperience;
  partySize: number;
  isLeader: boolean;
  isGroup: boolean;
  target: string;
  npcAction: NpcAction;
  questComplexity: QuestComplexity;
  npcReward: NpcReward;
}

export interface Currency {
  copper: number;
  silver: number;
  gold: number;
}

export interface PlayerCondition {
  id: string;
  name: string;
  description: string;
  isPenalty?: boolean;
  timestamp: number;
}

export interface VaultItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  imageUrl?: string;
  isPenalty?: boolean;
  timestamp: number;
}

export interface Player {
  id: string;
  name: string;
  currency: Currency;
  inventory: VaultItem[];
  conditions: PlayerCondition[];
}

export interface SessionState {
  id: string;
  name: string;
  players: Player[];
  isActive: boolean;
}

// Interfaces added to support CharacterSheet.tsx
export interface CharacterStats {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface CharacterModifiers {
  str: string;
  dex: string;
  con: string;
  int: string;
  wis: string;
  cha: string;
}

export interface SavingThrow {
  name: string;
  mod: string;
  proficient: boolean;
}

export interface Skill {
  name: string;
  mod: string;
  proficient: boolean;
  stat: string;
}

export interface Attack {
  name: string;
  bonus: string;
  damage: string;
}

export interface Feature {
  name: string;
  description: string;
}

export interface CharacterProfile {
  name: string;
  visualPrompt: string;
  class: string;
  subclass: string;
  level: number;
  background: string;
  playerName: string;
  race: string;
  alignment: string;
  xp: string;
  stats: CharacterStats;
  modifiers: CharacterModifiers;
  proficiencyBonus: string;
  savingThrows: SavingThrow[];
  skills: Skill[];
  passivePerception: number;
  ac: number;
  initiative: string;
  speed: string;
  hpMax: number;
  hpCurrent: number;
  hitDice: string;
  attacks: Attack[];
  treasure: string;
  equipment: string[];
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  featuresAndTraits: Feature[];
  otherProficiencies: string[];
  age: string;
  height: string;
  weight: string;
  eyes: string;
  skin: string;
  hair: string;
  backstory: string;
}
