
import { WeaponType, DiceResult } from "../types";

// ==================================================================================
// 🎵 CONFIGURATION DES SONS (VOTRE RÉPERTOIRE HÉBERGÉ)
// ==================================================================================
// Dès que vous aurez créé votre répertoire, nous remplacerons les liens ci-dessous.
// En attendant, voici une configuration de secours stable.

const SOUND_LIBRARY: Record<string, string> = {
    // --- AMBIANCES (Boucles) ---
    rain: "https://archive.org/download/soundreality-fire-ambience-528618/liecio-calming-rain-257596.mp3",
    thunder: "https://archive.org/download/soundreality-fire-ambience-528618/soundreality-thunder-sound-375727.mp3",
    wind: "https://archive.org/download/soundreality-fire-ambience-528618/dragon-studio-winter-wind-402331.mp3",
    forest: "https://archive.org/download/soundreality-fire-ambience-528618/freesound_community-foret-oiseaux-et-brise-27890.mp3",
    cave: "https://archive.org/download/soundreality-fire-ambience-528618/freesound_community-spooky_grotto-18352.mp3",
    tavern: "https://archive.org/download/soundreality-fire-ambience-528618/freesound_community-music-in-greek-taverna-49137.mp3",
    camp: "https://archive.org/download/soundreality-fire-ambience-528618/soundreality-fire-ambience-528618.mp3",
    dark_ambience: "https://archive.org/download/soundreality-fire-ambience-528618/soundreality-cinematic-horror-pad-517323.mp3",
    
    // --- COMBAT ---
    sword_swing: "https://archive.org/download/soundreality-fire-ambience-528618/dragon-studio-violent-sword-slice-393839.mp3",
    sword_hit: "https://archive.org/download/soundreality-fire-ambience-528618/daviddumaisaudio-sword-slash-with-metal-shield-impact-185433.mp3",
    dagger: "https://archive.org/download/soundreality-fire-ambience-528618/daviddumaisaudio-metal-dagger-hit-185444.mp3",
    bow_shoot: "https://archive.org/download/soundreality-fire-ambience-528618/dennish18-arrow-body-impact-146419.mp3",
    punch: "https://assets.mixkit.co/active_storage/sfx/2048/2048-preview.mp3",
    
    // --- MAGIE ---
    fireball: "https://archive.org/download/yodguard-dark-magic-1-378650/dragon-studio-fire-spell-impact-393921.mp3",
    ice: "https://archive.org/download/yodguard-dark-magic-1-378650/dragon-studio-ice-spell-impact-448563.mp3",
    lightning: "https://archive.org/download/yodguard-dark-magic-1-378650/dragon-studio-electric-spell-impact-393918.mp3",
    heal: "https://archive.org/download/yodguard-dark-magic-1-378650/latent-rick-fantasy-healing-spell-cast-1-547831.mp3",
    curse: "https://archive.org/download/yodguard-dark-magic-1-378650/yodguard-dark-magic-1-378650.mp3",
    teleport: "https://archive.org/download/yodguard-dark-magic-1-378650/universfield-magic-teleport-whoosh-352764.mp3",
    
    // --- MONSTRES ---
    roar: "https://archive.org/download/u_83ynl5kta9-giant-walking-149155/dragon-studio-epic-dragon-roar-364481.mp3",
    ghost: "https://archive.org/download/u_83ynl5kta9-giant-walking-149155/freesound_community-little-girl-ghost-101813.mp3",
    zombie: "https://archive.org/download/u_83ynl5kta9-giant-walking-149155/dragon-studio-zombie-sound-2-357976.mp3",
    steps_heavy: "https://archive.org/download/u_83ynl5kta9-giant-walking-149155/u_83ynl5kta9-giant-walking-149155.mp3",
    
    // --- INTERACTIF ---
    dice: "https://assets.mixkit.co/active_storage/sfx/2579/2579-preview.mp3",
    trap: "https://archive.org/download/dragon-studio-door-creaking-335491/rison8-dbd-bear-trap-being-disarmed-135902.mp3",
    door_creak: "https://archive.org/download/dragon-studio-door-creaking-335491/dragon-studio-door-creaking-335491.mp3",
    chest_open: "https://archive.org/download/dragon-studio-door-creaking-335491/freesound_community-chest-opening-87569.mp3",
    lockpick: "https://archive.org/download/dragon-studio-door-creaking-335491/hasin2004-key-lock-sound-247454.mp3",
    coin: "https://archive.org/download/dragon-studio-door-creaking-335491/yodguard-coin-collect-3-540190.mp3",
};

const DEFAULT_SOUND_LIBRARY: Record<string, string> = {
    rain: "https://assets.mixkit.co/active_storage/sfx/2515/2515-preview.mp3",
    thunder: "https://assets.mixkit.co/active_storage/sfx/2390/2390-preview.mp3",
    wind: "https://assets.mixkit.co/active_storage/sfx/1381/1381-preview.mp3",
    forest: "https://assets.mixkit.co/active_storage/sfx/2432/2432-preview.mp3",
    cave: "https://assets.mixkit.co/active_storage/sfx/2437/2437-preview.mp3",
    tavern: "https://assets.mixkit.co/active_storage/sfx/455/455-preview.mp3",
    camp: "https://assets.mixkit.co/active_storage/sfx/1657/1657-preview.mp3",
    dark_ambience: "https://opengameart.org/sites/default/files/Socapex%20-%20Dark%20ambiance_3.mp3",
    sword_swing: "https://assets.mixkit.co/active_storage/sfx/2403/2403-preview.mp3",
    sword_hit: "https://assets.mixkit.co/active_storage/sfx/209/209-preview.mp3",
    dagger: "https://assets.mixkit.co/active_storage/sfx/2404/2404-preview.mp3",
    bow_shoot: "https://assets.mixkit.co/active_storage/sfx/314/314-preview.mp3"
};

// Gestion de l'état audio
let currentAmbience: HTMLAudioElement | null = null;
let currentAmbienceKey: string | null = null;
const audioCache: Map<string, HTMLAudioElement> = new Map();

// Récupère ou crée l'objet Audio
const getAudio = (key: string): HTMLAudioElement | null => {
    const url = SOUND_LIBRARY[key];
    if (!url) return null;

    if (audioCache.has(key)) {
        const cached = audioCache.get(key)!;
        // On rembobine pour pouvoir rejouer le son
        if (cached.readyState >= 2) {
             cached.currentTime = 0;
        }
        return cached;
    }

    const audio = new Audio(url);
    audio.preload = 'auto';
    // Gestion d'erreur basique pour éviter de crasher l'app si un lien est mort
    // Ajout d'un système de repli (fallback) car Google Drive bloque les fichiers "restreints"
    audio.onerror = () => {
        console.warn(`[Sound] Impossible de charger le son custom: ${key} (${url}). (Vérifiez que le partage GDrive est "Tous ceux qui ont le lien" sans restriction). Bascule sur son par défaut.`);
        
        // Tester le son de fallback s'il existe
        const defaultUrl = DEFAULT_SOUND_LIBRARY[key];
        if (defaultUrl && audio.src !== defaultUrl) {
             audio.src = defaultUrl;
             audio.load();
        }
    };
    
    audioCache.set(key, audio);
    return audio;
};

// Jouer un effet sonore (Fire & Forget)
export const playEffect = async (key: string, volume: number = 0.5) => {
    try {
        const audio = getAudio(key);
        if (!audio) return;

        // On clone le noeud pour permettre de jouer le même son plusieurs fois simultanément
        // (ex: pluie de flèches ou clics rapides)
        const clone = audio.cloneNode() as HTMLAudioElement;
        clone.volume = Math.max(0, Math.min(1, volume));
        
        await clone.play();
        
        // Nettoyage après lecture
        clone.onended = () => clone.remove();
    } catch (e) {
        // Ignorer les erreurs d'interaction (ex: l'utilisateur n'a pas encore cliqué sur la page)
        // console.warn(`[Sound] Erreur lecture ${key}`, e);
    }
};

// Jouer une ambiance en boucle avec fondu
export const playAmbienceLoop = async (key: string, volume: number = 0.3) => {
    // Si c'est déjà la même ambiance qui joue, on ne fait rien
    if (currentAmbienceKey === key && currentAmbience && !currentAmbience.paused) return;

    // On arrête l'ambiance précédente
    stopAmbience();

    try {
        const audio = getAudio(key);
        if (!audio) return;

        audio.loop = true;
        audio.volume = 0; // On commence à 0 pour le Fade In
        currentAmbience = audio;
        currentAmbienceKey = key;

        await audio.play();

        // Fade In manuel
        let vol = 0;
        const fadeInterval = setInterval(() => {
            if (!currentAmbience || currentAmbience !== audio) {
                clearInterval(fadeInterval);
                return;
            }
            vol += 0.05;
            if (vol >= volume) {
                vol = volume;
                clearInterval(fadeInterval);
            }
            audio.volume = vol;
        }, 100);

    } catch (e) {
        console.error(`[Sound] Erreur ambiance ${key}`, e);
    }
};

// Arrêter l'ambiance active avec fondu
export const stopAmbience = () => {
    if (!currentAmbience) return;
    
    const audioToStop = currentAmbience;
    currentAmbience = null;
    currentAmbienceKey = null;

    // Fade Out manuel
    const fadeOutInterval = setInterval(() => {
        if (audioToStop.volume > 0.05) {
            audioToStop.volume -= 0.05;
        } else {
            audioToStop.volume = 0;
            audioToStop.pause();
            audioToStop.currentTime = 0;
            clearInterval(fadeOutInterval);
        }
    }, 100);
};

// --- API PUBLIQUE (MAPPINGS) ---

export const playRain = () => playAmbienceLoop('rain', 0.5);
export const playThunder = () => playEffect('thunder', 0.8);
export const playWind = () => playAmbienceLoop('wind', 0.4);
export const playForest = () => playAmbienceLoop('forest', 0.3);
export const playCave = () => playAmbienceLoop('cave', 0.5);
export const playTavern = () => playAmbienceLoop('tavern', 0.4);
export const playCampfire = () => playAmbienceLoop('camp', 0.4);
export const playDarkAmbience = () => playAmbienceLoop('dark_ambience', 0.4);

export const playSwordSwing = () => playEffect('sword_swing', 0.4);
export const playSwordHit = () => playEffect('sword_hit', 0.6);
export const playBowShot = () => playEffect('bow_shoot', 0.6);
export const playPunch = () => playEffect('punch', 0.6);
export const playDagger = () => playEffect('dagger', 0.5);

export const playFireball = () => playEffect('fireball', 0.7);
export const playIce = () => playEffect('ice', 0.6);
export const playLightning = () => playEffect('lightning', 0.6);
export const playHeal = () => playEffect('heal', 0.5);
export const playCurse = () => playEffect('curse', 0.6);
export const playTeleport = () => playEffect('teleport', 0.6);

export const playRoar = () => playEffect('roar', 0.8);
export const playGhost = () => playEffect('ghost', 0.5);
export const playZombie = () => playEffect('zombie', 0.6);
export const playSteps = () => playEffect('steps_heavy', 0.7);

export const playDiceSound = () => playEffect('dice', 0.8);
export const playTrap = () => playEffect('trap', 0.7);
export const playDoor = () => playEffect('door_creak', 0.7);
export const playChest = () => playEffect('chest_open', 0.6);
export const playLockpick = () => playEffect('lockpick', 0.6);
export const playCoin = () => playEffect('coin', 0.5);

// Helper pour jouer un son automatique selon l'arme et le résultat
export const playCombatSound = (weapon: WeaponType, result: DiceResult) => {
    if (result === DiceResult.FAIL || result === DiceResult.CRITICAL_FAIL) {
        playEffect('sword_swing', 0.4);
        return;
    }
    
    switch (weapon) {
        case WeaponType.BOW: playEffect('bow_shoot', 0.6); break;
        case WeaponType.FIRE_SPELL: playEffect('fireball', 0.6); break;
        case WeaponType.ICE_SPELL: playEffect('ice', 0.6); break;
        case WeaponType.UNARMED: playEffect('punch', 0.6); break;
        case WeaponType.DAGGER: playEffect('dagger', 0.6); break;
        default: playEffect('sword_hit', 0.6); break;
    }
};
