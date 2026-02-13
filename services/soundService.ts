
import { WeaponType, DiceResult } from "../types";

let audioCtx: AudioContext | null = null;
const soundCache: Map<string, AudioBuffer> = new Map();

// Son de dé de secours (petit "clac" encodé en base64) pour garantir un feedback même hors ligne/erreur réseau
const FALLBACK_DICE_B64 = "UklGRi4AAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="; 

// CONFIGURATION DES SOURCES (Dépôt Heileis stable)
const SOURCES = [
  {
    name: "Heileis (Raw)",
    base: "https://raw.githubusercontent.com/Heileis/DND-Soundboard/master/sounds"
  },
  {
    name: "Heileis (CDN)",
    base: "https://cdn.jsdelivr.net/gh/Heileis/DND-Soundboard@master/sounds"
  }
];

// CHEMINS RELATIFS EXACTS (Minuscules obligatoires pour ce repo)
const FILE_PATHS: Record<string, string> = {
    rain: "weather/rain.mp3",
    thunder: "weather/thunder.mp3",
    wind: "ambiance/wind.mp3",
    forest: "ambiance/forest.mp3",
    dungeon: "ambiance/cave.mp3", // 'dungeon.mp3' n'existe pas toujours, 'cave.mp3' est sûr
    roar: "monsters/dragon_roar.mp3",
    hit_flesh: "combat/hit.mp3",
    hit_armor: "combat/sword_hit_armor.mp3",
    sword_swing: "combat/sword_swing.mp3",
    ghost: "magic/ghost.mp3",
    magic_blast: "magic/fireball.mp3",
    electric: "magic/lightning.mp3",
    trap: "traps/trap.mp3",
    ice: "magic/ice.mp3",
    dice: "dice/dice.mp3"
};

const getAudioContext = async () => {
  if (!audioCtx) {
    // @ts-ignore
    const CtxClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new CtxClass();
  }
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }
  return audioCtx;
};

const loadSound = async (key: string): Promise<AudioBuffer | null> => {
  // 1. Cache
  if (soundCache.has(key)) return soundCache.get(key)!;

  const ctx = await getAudioContext();
  const relativePath = FILE_PATHS[key];

  if (!relativePath) {
      console.error(`[Audio] Clé de son non configurée : ${key}`);
      return null;
  }

  // 2. Tentatives Sources Réseau
  for (const source of SOURCES) {
    const url = `${source.base}/${relativePath}`;
    try {
      const response = await fetch(url);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = await ctx.decodeAudioData(arrayBuffer);
        soundCache.set(key, buffer);
        console.log(`[Audio] Chargé succès (${source.name}): ${key}`);
        return buffer;
      }
    } catch (e) {
      // Continue vers la source suivante
    }
  }

  // Fallback silencieux pour éviter le spam d'erreur si vraiment introuvable
  console.warn(`[Audio] Échec chargement : ${key} (Chemin: ${relativePath})`);
  return null;
};

const play = async (key: string, options: { volume?: number, loop?: boolean, pitchVar?: number } = {}) => {
  try {
    const buffer = await loadSound(key);
    if (!buffer) return null;

    const ctx = await getAudioContext();
    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();
    
    source.buffer = buffer;
    source.loop = options.loop || false;

    if (options.pitchVar) {
        const detune = (Math.random() * options.pitchVar * 2) - options.pitchVar;
        source.detune.value = detune;
    }

    gainNode.gain.value = options.volume ?? 0.5;
    
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    source.start(0);
    return { source, gain: gainNode };
  } catch (e) {
    console.error("Erreur lecture audio", e);
    return null;
  }
};

// --- EXPORTS API ---

export const playRainAmbience = (duration = 15) => {
    play('rain', { loop: true, volume: 0.3 }).then(audio => {
        if (audio) {
            setTimeout(() => {
                const now = audio.gain.context.currentTime;
                try {
                    audio.gain.gain.linearRampToValueAtTime(0, now + 2);
                    setTimeout(() => { try { audio.source.stop(); } catch(e){} }, 2000);
                } catch(e){}
            }, duration * 1000);
        }
    });
};

export const playDarkForest = (duration = 15) => {
    // Mix vent + forêt
    play('wind', { loop: true, volume: 0.15 }).then(a => {
        if(a) setTimeout(() => { try{ a.source.stop() } catch(e){} }, (duration + 1) * 1000);
    });
    play('forest', { loop: true, volume: 0.25 }).then(audio => {
        if (audio) {
            setTimeout(() => {
                const now = audio.gain.context.currentTime;
                try {
                    audio.gain.gain.linearRampToValueAtTime(0, now + 2);
                    setTimeout(() => { try { audio.source.stop(); } catch(e){} }, 2000);
                } catch(e){}
            }, duration * 1000);
        }
    });
};

export const playThunder = () => play('thunder', { volume: 0.6, pitchVar: 50 });

export const playDungeonAmbience = (duration = 15) => {
    play('dungeon', { loop: true, volume: 0.4 }).then(audio => {
        if (audio) {
            setTimeout(() => {
                const now = audio.gain.context.currentTime;
                try {
                    audio.gain.gain.linearRampToValueAtTime(0, now + 2);
                    setTimeout(() => { try { audio.source.stop(); } catch(e){} }, 2000);
                } catch(e){}
            }, duration * 1000);
        }
    });
};

export const playMonsterEnraged = () => play('roar', { volume: 0.5, pitchVar: 150 });
export const playMonsterHit = () => play('hit_flesh', { volume: 0.5, pitchVar: 100 });
export const playGhostlyWail = () => play('ghost', { volume: 0.3 });
export const playElectricArc = () => play('electric', { volume: 0.3 });
export const playMechanicalTrap = () => play('trap', { volume: 0.5 });
export const playIceTrap = () => play('ice', { volume: 0.4 });
export const playDiceSound = () => play('dice', { volume: 0.6, pitchVar: 50 });

export const playCombatSound = (weapon: WeaponType, result: DiceResult) => {
    if (result === DiceResult.FAIL || result === DiceResult.CRITICAL_FAIL) {
        play('sword_swing', { volume: 0.3, pitchVar: 100 });
        return;
    }
    
    if ([WeaponType.WARHAMMER, WeaponType.BATTLEAXE].includes(weapon)) {
        play('hit_armor', { volume: 0.5, pitchVar: 100 });
    } else if ([WeaponType.FIRE_SPELL, WeaponType.ICE_SPELL].includes(weapon)) {
        play('magic_blast', { volume: 0.4 });
    } else {
        play('hit_flesh', { volume: 0.5, pitchVar: 100 });
    }
};
