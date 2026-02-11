
import { WeaponType, DiceResult } from "../types";

// Singleton pour le contexte audio
let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioCtx) {
    // @ts-ignore - Support Safari/Webkit
    const CtxClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new CtxClass();
  }
  return audioCtx;
};

const createNoiseBuffer = (ctx: AudioContext) => {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
};

/**
 * Son : Lancer de dés (cliquetis sur bois)
 */
export const playDiceSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const t = ctx.currentTime;
    
    // Plusieurs petits clics rapides pour simuler les rebonds
    for (let i = 0; i < 4; i++) {
        const start = t + (i * 0.08);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150 + Math.random() * 100, start);
        osc.frequency.exponentialRampToValueAtTime(50, start + 0.05);
        
        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.05);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.06);
    }
  } catch (e) {
    console.error("Audio error:", e);
  }
};

const playSwoosh = (ctx: AudioContext) => {
  const t = ctx.currentTime;
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx);
  
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, t);
  filter.frequency.exponentialRampToValueAtTime(100, t + 0.3);

  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.5, t + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start(t);
  noise.stop(t + 0.4);
};

const playSlashHit = (ctx: AudioContext, isHeavy = false) => {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
  oscGain.gain.setValueAtTime(isHeavy ? 0.8 : 0.5, t);
  oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
  osc.connect(oscGain);
  oscGain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.2);

  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx);
  const noiseFilter = ctx.createBiquadFilter();
  const noiseGain = ctx.createGain();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.setValueAtTime(1000, t);
  noiseGain.gain.setValueAtTime(isHeavy ? 0.6 : 0.3, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(t);
  noise.stop(t + 0.2);
};

const playBluntHit = (ctx: AudioContext) => {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(100, t);
  osc.frequency.exponentialRampToValueAtTime(20, t + 0.3);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 200;
  gain.gain.setValueAtTime(1, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.4);
};

const playParry = (ctx: AudioContext) => {
  const t = ctx.currentTime;
  [500, 850, 1200, 1600].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    const duration = 0.5 - (i * 0.1); 
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration);
  });
};

const playBowShoot = (ctx: AudioContext) => {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, t);
  osc.frequency.exponentialRampToValueAtTime(50, t + 0.2);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2000, t);
  filter.frequency.exponentialRampToValueAtTime(100, t + 0.1);
  gain.gain.setValueAtTime(0.5, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.3);
};

const playMagic = (ctx: AudioContext, isFire = true) => {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  if (isFire) {
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(500, t);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 1.0);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(t);
    noise.stop(t + 1.0);
  } else {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.linearRampToValueAtTime(1200, t + 0.5);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.linearRampToValueAtTime(0, t + 1.0);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 1.0);
  }
};

const playCritical = (ctx: AudioContext) => {
  const t = ctx.currentTime;
  playBluntHit(ctx);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(440, t);
  osc.frequency.setValueAtTime(880, t + 0.1);
  gain.gain.setValueAtTime(0.3, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.8);
};

export const playCombatSound = (weapon: WeaponType, result: DiceResult) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    if (result === DiceResult.FAIL || result === DiceResult.CRITICAL_FAIL || result === DiceResult.DODGED) {
      playSwoosh(ctx);
      return;
    }
    if (result === DiceResult.PARRIED) {
      playParry(ctx);
      return;
    }
    if (result === DiceResult.CRITICAL_HIT || result === DiceResult.FATAL_BLOW) {
      if (weapon === WeaponType.FIRE_SPELL || weapon === WeaponType.ICE_SPELL) {
         playMagic(ctx, weapon === WeaponType.FIRE_SPELL);
      } else {
         playCritical(ctx);
      }
      return;
    }
    switch (weapon) {
      case WeaponType.LONGSWORD:
      case WeaponType.DAGGER:
      case WeaponType.BATTLEAXE:
        playSlashHit(ctx, weapon === WeaponType.BATTLEAXE);
        break;
      case WeaponType.WARHAMMER:
      case WeaponType.UNARMED:
        playBluntHit(ctx);
        break;
      case WeaponType.BOW:
        playBowShoot(ctx);
        break;
      case WeaponType.FIRE_SPELL:
        playMagic(ctx, true);
        break;
      case WeaponType.ICE_SPELL:
        playMagic(ctx, false);
        break;
      default:
        playSwoosh(ctx);
    }
  } catch (e) {
    console.error("Audio error:", e);
  }
};
