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

/**
 * Générateur de bruit blanc (pour les swooshs et impacts sourds)
 */
const createNoiseBuffer = (ctx: AudioContext) => {
  const bufferSize = ctx.sampleRate * 2; // 2 secondes de buffer suffisent
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
};

/**
 * Son : Coup dans le vide / Esquive (Swoosh)
 */
const playSwoosh = (ctx: AudioContext) => {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  // Bruit blanc filtré pour faire "Fwiish"
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

/**
 * Son : Impact d'arme blanche (Tranchant/Chair)
 */
const playSlashHit = (ctx: AudioContext, isHeavy = false) => {
  const t = ctx.currentTime;
  
  // 1. L'impact (bruit sourd)
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

  // 2. Le bruit de déchirement (bruit rose/blanc filtré)
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

/**
 * Son : Impact contondant (Marteau/Poing)
 */
const playBluntHit = (ctx: AudioContext) => {
  const t = ctx.currentTime;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square'; // Son plus "lourd"
  osc.frequency.setValueAtTime(100, t);
  osc.frequency.exponentialRampToValueAtTime(20, t + 0.3);

  // Filtre passe-bas pour étouffer le son carré
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

/**
 * Son : Métal contre Métal (Parade)
 */
const playParry = (ctx: AudioContext) => {
  const t = ctx.currentTime;
  
  // On crée plusieurs harmoniques pour faire "Clang"
  [500, 850, 1200, 1600].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    
    // Decay différent pour chaque harmonique (métallique)
    const duration = 0.5 - (i * 0.1); 
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(t);
    osc.stop(t + duration);
  });
};

/**
 * Son : Arc (Corde qui claque)
 */
const playBowShoot = (ctx: AudioContext) => {
  const t = ctx.currentTime;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  // "Twang" effect
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

/**
 * Son : Magie (Brillant/Étincelant)
 */
const playMagic = (ctx: AudioContext, isFire = true) => {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  if (isFire) {
    // Fire: Noise rumble + crackle
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
    // Ice/Generic Magic: Chime
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.linearRampToValueAtTime(1200, t + 0.5); // Slide up
    
    // Tremolo
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 15;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.5; // Depth
    lfo.connect(lfoGain.gain);
    
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.linearRampToValueAtTime(0, t + 1.0);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 1.0);
  }
};

/**
 * Son : Coup Critique (Impact lourd + son aigu glorieux)
 */
const playCritical = (ctx: AudioContext) => {
  const t = ctx.currentTime;
  
  // Gros boum
  playBluntHit(ctx);
  
  // + Son "Brillant/Glorieux"
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(440, t); // La
  osc.frequency.setValueAtTime(880, t + 0.1); // Octave up
  
  gain.gain.setValueAtTime(0.3, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.8);
};


// --- Fonction principale exportée ---

export const playCombatSound = (weapon: WeaponType, result: DiceResult) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // IMPORTANT: Les navigateurs bloquent l'audio s'il n'est pas initié par une action utilisateur.
    // Cette fonction DOIT être appelée dans un gestionnaire d'événement (onClick).
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // 1. Échec / Raté / Esquive -> Swoosh
    if (result === DiceResult.FAIL || result === DiceResult.CRITICAL_FAIL || result === DiceResult.DODGED) {
      playSwoosh(ctx);
      return;
    }

    // 2. Parade -> Métal
    if (result === DiceResult.PARRIED) {
      playParry(ctx);
      return;
    }

    // 3. Coup Critique / Fatal -> Spécial
    if (result === DiceResult.CRITICAL_HIT || result === DiceResult.FATAL_BLOW) {
      if (weapon === WeaponType.FIRE_SPELL || weapon === WeaponType.ICE_SPELL) {
         playMagic(ctx, weapon === WeaponType.FIRE_SPELL); // Magie plus intense
      } else {
         playCritical(ctx);
      }
      return;
    }

    // 4. Touche normale -> Selon l'arme
    switch (weapon) {
      case WeaponType.LONGSWORD:
      case WeaponType.DAGGER:
      case WeaponType.BATTLEAXE:
        playSlashHit(ctx, weapon === WeaponType.BATTLEAXE); // Hache = plus lourd
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
    console.error("Erreur lecture audio synthétisée:", e);
  }
};
