import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { BookOpen, Briefcase, Instagram, Settings, Skull, Sparkles, Volume2, X } from 'lucide-react';
import NarratorForm from './components/NarratorForm';
import StoryBox, { Narration } from './components/StoryBox';
import VirtualVault from './components/VirtualVault';
import SoundBox from './components/SoundBox';
import ApiKeyGate from './components/ApiKeyGate';
import { ErrorCard, DisplayError } from './components/story/ErrorCard';
import {
  BodyPart, CombatState, DiceResult, EnvironmentType, InteractionAction, InteractiveObjectType, LootType, MechanicalDifficulty,
  MonsterCR, NarrationStyle, NarratorMode, NpcAction, NpcReward, PlayerExperience, QuestComplexity, RiddleDifficulty, SessionState,
  WeaponType, WorldAtmosphere,
} from './types';
import { DEMO_KEY, generateNarration } from './services/geminiService';
import { classifyError } from './services/quota';
import { playCombatSound, playDiceSound, playRoar } from './services/soundService';
import { useCloudSync } from './hooks/useCloudSync';
import { useMediaQuery } from './hooks/useMediaQuery';
import { createSession } from './utils/session';
import { getSettings, saveSettings, AppSettings } from './utils/settings';
import { newId, readJSON, readString, STORAGE_KEYS, writeJSON, writeString } from './utils/storage';
import { cx } from './components/ui';

// Chargés seulement quand on en a besoin : démarrage plus rapide.
const QuickHelp = lazy(() => import('./components/QuickHelp'));
const PlayerView = lazy(() => import('./components/PlayerView'));
const SettingsModal = lazy(() => import('./components/SettingsModal'));

const INITIAL_FORM: CombatState = {
  mode: NarratorMode.COMBAT,
  style: NarrationStyle.MEDIUM,
  weapon: WeaponType.LONGSWORD,
  bodyPart: BodyPart.UNSPECIFIED,
  result: DiceResult.HIT,
  lootType: LootType.USEFUL,
  environmentType: EnvironmentType.DUNGEON,
  atmosphere: WorldAtmosphere.DARK_FANTASY,
  interactiveObj: InteractiveObjectType.CHEST,
  interactionAction: InteractionAction.OPEN,
  riddleDifficulty: RiddleDifficulty.EASY,
  monsterCR: MonsterCR.LOW,
  mechanicalDifficulty: MechanicalDifficulty.BEGINNER,
  playerExperience: PlayerExperience.BEGINNER,
  partySize: 4,
  isLeader: false,
  isGroup: false,
  target: '',
  npcAction: NpcAction.DIALOGUE,
  questComplexity: QuestComplexity.NONE,
  npcReward: NpcReward.NONE,
};

const DICE_PHRASES = [
  "Le polyèdre s'entrechoque contre le bois usé de la table, défiant les lois du hasard…",
  "Un silence s'abat alors que le dé roule lourdement, révélant la volonté du destin…",
  'Le destin bascule. Les arcanes s’alignent sur le nombre que vous venez d’invoquer…',
  "Le dé s'immobilise enfin, comme si le souffle des anciens dieux l'avait guidé…",
  'La face supérieure luit d’une lueur fatidique, scellant votre prochain geste…',
];

type Overlay = 'help' | 'vault' | 'sound' | 'settings' | null;

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(() => readString(STORAGE_KEYS.apiKey));
  const [settings, setSettings] = useState<AppSettings>(getSettings);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [playerViewData, setPlayerViewData] = useState<string | null>(null);
  const [form, setForm] = useState<CombatState>(INITIAL_FORM);
  const [session, setSession] = useState<SessionState>(() => readJSON(STORAGE_KEYS.session, createSession()));
  const [narration, setNarration] = useState<Narration | null>(null);
  const [error, setError] = useState<DisplayError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);
  const storyRef = useRef<HTMLElement>(null);
  const cloud = useCloudSync(session);
  // Le coffre et la table sonore « bureau » ne sont montés que sur grand écran (avant : montés en double sur mobile).
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  useEffect(() => {
    // writeJSON renvoie false si le stockage est plein (ex. trop d'images) : on prévient au lieu de planter.
    setStorageWarning(!writeJSON(STORAGE_KEYS.session, session));
  }, [session]);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      setPlayerViewData(hash.startsWith('#/view/') ? hash.slice('#/view/'.length) : null);
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const saveKey = (key: string) => {
    writeString(STORAGE_KEYS.apiKey, key);
    setApiKey(key);
    setError(null);
  };

  const logout = () => {
    writeString(STORAGE_KEYS.apiKey, null);
    setApiKey(null);
    setOverlay(null);
  };

  const updateSettings = (s: AppSettings) => {
    setSettings(s);
    saveSettings(s);
  };

  const scrollToStory = () =>
    setTimeout(() => {
      // Sur mobile, le résultat est sous le formulaire : on y descend.
      if (!window.matchMedia('(min-width: 1024px)').matches) storyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);

  const handleSubmit = async () => {
    if (isLoading) return;
    const request = form; // on fige le formulaire au moment du clic
    setIsLoading(true);
    setError(null);
    setNarration(null);
    scrollToStory();
    if (request.mode === NarratorMode.BESTIARY) playRoar();

    try {
      const { text, model } = await generateNarration(request);
      setNarration({ id: newId(), text, mode: request.mode, model });
      if (request.mode === NarratorMode.COMBAT && settings.combatSounds) playCombatSound(request.weapon, request.result);
    } catch (e) {
      const err = classifyError(e);
      setError({
        kind: err.kind,
        message: err.message,
        retryAt: err.retryAfterSec ? Date.now() + err.retryAfterSec * 1000 : undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiceRoll = (sides: number) => {
    setError(null);
    playDiceSound();
    const roll = Math.floor(Math.random() * sides) + 1;
    const phrase = DICE_PHRASES[Math.floor(Math.random() * DICE_PHRASES.length)];
    setNarration({ id: newId(), text: `DICE|${sides}|${roll}|${phrase}`, mode: NarratorMode.DICE });
    scrollToStory();
  };

  if (playerViewData) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-black" />}>
        <PlayerView data={playerViewData} />
      </Suspense>
    );
  }

  if (!apiKey) return <ApiKeyGate onKeySubmit={saveKey} />;

  const isDemo = apiKey === DEMO_KEY;
  const resetVault = () => setSession({ ...session, players: [], isActive: false });

  return (
    <div className="min-h-screen bg-black text-parchment font-body selection:bg-blood-red/30 flex flex-col items-center">
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,_#1a0505_0%,_#000000_70%)] opacity-80" />
      </div>

      {/* EN-TÊTE */}
      <header
        className="relative z-30 w-full max-w-[1600px] px-4 md:px-6 mb-4 md:mb-8 flex items-center justify-between gap-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
      >
        <div className="min-w-0">
          <h1 className="font-header text-2xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-gold-antique to-gold-dark uppercase tracking-[0.15em] md:tracking-widest leading-none">
            D&D Narrator
          </h1>
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-gold-antique/80 font-fantasy text-[10px] md:text-xs tracking-[0.3em] uppercase whitespace-nowrap">Forgé par Romain.DnD89</p>
            <a
              href="https://www.instagram.com/romain.dnd89/"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram de Romain.DnD89"
              className="text-gold-dark hover:text-gold-antique p-1"
            >
              <Instagram className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </a>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setOverlay('help')}
            aria-label="Grimoire de règles"
            className="min-h-[44px] px-3 flex items-center gap-2 text-gold-antique border border-gold-dark/30 rounded-full hover:bg-gold-dark/10"
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-[11px] uppercase font-bold tracking-widest hidden sm:inline">Grimoire</span>
          </button>
          <button
            type="button"
            onClick={() => setOverlay('settings')}
            aria-label="Configuration et quota"
            className="min-h-[44px] px-3 flex items-center gap-2 text-gold-dark hover:text-gold-antique border border-gold-dark/30 rounded-full hover:bg-gold-dark/10 group"
          >
            <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            <span className="text-[11px] uppercase font-bold tracking-widest hidden md:inline">Configuration</span>
          </button>
        </div>
      </header>

      {isDemo && (
        <div className="relative z-20 w-full max-w-[1600px] px-4 md:px-6 mb-4">
          <div className="bg-amber-900/20 border border-amber-600/40 rounded-xl px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-sm text-amber-300">
            <span>Mode démo : réponses d'exemple, sans IA.</span>
            <button type="button" onClick={() => setOverlay('settings')} className="underline font-bold min-h-[36px]">
              Ajouter ma clé
            </button>
          </div>
        </div>
      )}

      {storageWarning && (
        <div className="relative z-20 w-full max-w-[1600px] px-4 md:px-6 mb-4">
          <p className="bg-red-900/30 border border-red-600/40 rounded-xl px-4 py-2 text-sm text-red-300" role="alert">
            Le stockage du navigateur est plein : la session n'est plus sauvegardée. Retirez des objets avec image ou videz le coffre.
          </p>
        </div>
      )}

      <main className="relative z-20 w-full max-w-[1600px] px-4 md:px-6 flex flex-col lg:flex-row items-start gap-6 flex-1 pb-6 lg:pb-12">
        <aside className="w-full lg:w-[360px] shrink-0 space-y-4 lg:sticky lg:top-4">
          <NarratorForm combatState={form} onChange={setForm} onSubmit={handleSubmit} onDiceRoll={handleDiceRoll} isLoading={isLoading} />
          {isDesktop && (
            <div className="h-[340px]">
              <SoundBox onClose={() => {}} />
            </div>
          )}
        </aside>

        <section ref={storyRef} id="story-area" className="flex-1 w-full min-w-0 scroll-mt-4" aria-live="polite">
          {isLoading ? (
            <div className="bg-darker-metal border-2 border-gold-dark/20 rounded-2xl py-16 md:py-28 px-6 flex flex-col items-center justify-center text-gold-antique shadow-2xl">
              <Sparkles className="w-12 h-12 md:w-16 md:h-16 mb-6 animate-spin text-gold-antique" aria-hidden />
              <p className="font-header text-lg md:text-3xl uppercase tracking-[0.3em] text-center">Le destin s'écrit…</p>
              <p className="text-xs text-gold-dark/70 uppercase mt-4 tracking-[0.4em]">Les dés sont jetés</p>
            </div>
          ) : error ? (
            <ErrorCard error={error} onRetry={handleSubmit} onOpenSettings={() => setOverlay('settings')} onClose={() => setError(null)} />
          ) : narration ? (
            <StoryBox key={narration.id} narration={narration} session={session} onUpdateSession={setSession} onClose={() => setNarration(null)} />
          ) : (
            <div className="min-h-[220px] lg:min-h-[480px] border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-4 text-gray-500 p-8 text-center">
              <Skull className="w-12 h-12 text-gray-700" aria-hidden />
              <p className="font-header text-xs uppercase tracking-[0.4em]">L'aventure attend…</p>
              <p className="text-sm text-gray-600 max-w-xs">Choisissez un mode, réglez les options puis « Lancer l'action ».</p>
            </div>
          )}
        </section>

        {isDesktop && (
          <aside className="w-[380px] shrink-0 sticky top-4 h-[calc(100vh-2rem)]">
            <VirtualVault session={session} onUpdateSession={setSession} onReset={resetVault} cloud={cloud} aiImages={settings.aiImages} />
          </aside>
        )}
      </main>

      {/* ---- Fenêtres ---- */}
      <Suspense fallback={null}>
        {overlay === 'help' && <QuickHelp onClose={() => setOverlay(null)} />}
        {overlay === 'settings' && (
          <SettingsModal
            apiKey={apiKey}
            onSaveKey={saveKey}
            onLogout={logout}
            settings={settings}
            onSettingsChange={updateSettings}
            onClose={() => setOverlay(null)}
          />
        )}
      </Suspense>

      {!isDesktop && (overlay === 'vault' || overlay === 'sound') && (
        <div className="fixed inset-0 z-[10000] bg-black flex flex-col animate-fade-in lg:hidden" role="dialog" aria-modal="true">
          <div
            className="px-4 pb-1 flex items-center justify-end shrink-0"
            style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.5rem)' }}
          >
            <button
              type="button"
              onClick={() => setOverlay(null)}
              aria-label="Fermer"
              className="w-11 h-11 flex items-center justify-center bg-blood-dark rounded-full border border-gold-dark/50 text-gold-antique active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden p-3 pb-safe">
            {overlay === 'vault' ? (
              <VirtualVault session={session} onUpdateSession={setSession} onReset={resetVault} cloud={cloud} aiImages={settings.aiImages} />
            ) : (
              <SoundBox onClose={() => setOverlay(null)} />
            )}
          </div>
        </div>
      )}

      {/* ---- Barre mobile : action principale à portée de pouce ---- */}
      {!overlay && !isDesktop && (
        <nav
          className="lg:hidden fixed bottom-0 inset-x-0 z-[9999] bg-darker-metal/95 backdrop-blur-xl border-t border-gold-dark/30 shadow-[0_-10px_40px_rgba(0,0,0,0.9)] px-3 pt-2 pb-safe grid grid-cols-[1fr_2fr_1fr] gap-2"
          aria-label="Actions rapides"
        >
          <button
            type="button"
            onClick={() => setOverlay('sound')}
            className="min-h-[52px] flex flex-col items-center justify-center gap-0.5 text-gold-antique rounded-xl border border-gold-dark/30 bg-black/40 active:scale-95"
          >
            <Volume2 className="w-5 h-5" aria-hidden />
            <span className="text-[10px] font-header uppercase tracking-wider">Sons</span>
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className={cx(
              'min-h-[52px] rounded-xl border font-header text-xs uppercase tracking-[0.15em] font-bold flex items-center justify-center gap-2 active:scale-95',
              isLoading ? 'bg-gray-900 text-gray-500 border-gray-700' : 'bg-blood-dark border-blood-red text-gold-antique shadow-glow-red'
            )}
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-gold-antique/20 border-t-gold-antique rounded-full animate-spin" aria-hidden />
            ) : (
              <Sparkles className="w-4 h-4" aria-hidden />
            )}
            {isLoading ? 'Invocation…' : 'Lancer'}
          </button>
          <button
            type="button"
            onClick={() => setOverlay('vault')}
            className="min-h-[52px] flex flex-col items-center justify-center gap-0.5 text-gold-antique rounded-xl border border-gold-dark/30 bg-black/40 active:scale-95"
          >
            <Briefcase className="w-5 h-5" aria-hidden />
            <span className="text-[10px] font-header uppercase tracking-wider">Coffre</span>
          </button>
        </nav>
      )}

      <footer className="relative z-10 w-full text-center text-gray-600 text-[10px] uppercase tracking-[0.3em] pt-4 pb-32 lg:pb-8 font-header">
        © {new Date().getFullYear()} Romain.DnD89 — Maître du Donjon virtuel
      </footer>
    </div>
  );
};

export default App;
