
import React, { useState, useEffect } from 'react';
import NarratorForm from './components/NarratorForm';
import StoryBox from './components/StoryBox';
import VirtualVault from './components/VirtualVault';
import QuickHelp from './components/QuickHelp';
import PlayerView from './components/PlayerView'; 
import ApiKeyGate from './components/ApiKeyGate';
import { CombatState, DiceResult, WeaponType, BodyPart, NarrationStyle, NarratorMode, LootType, EnvironmentType, WorldAtmosphere, InteractiveObjectType, InteractionAction, RiddleDifficulty, SessionState } from './types';
import { generateNarration } from './services/geminiService';
import { playCombatSound, playDiceSound } from './services/soundService';
import { BookOpen, Briefcase, Sparkles, Instagram, Key, X } from 'lucide-react';

const App: React.FC = () => {
  // Gestion manuelle de la clé pour éviter le sélecteur automatique Google
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('dnd_api_key') || '');
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showVault, setShowVault] = useState<boolean>(false);
  const [playerViewData, setPlayerViewData] = useState<string | null>(null);

  const [combatState, setCombatState] = useState<CombatState>({
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
    target: '',
  });

  const [session, setSession] = useState<SessionState>(() => {
    const saved = localStorage.getItem('dnd_session');
    return saved ? JSON.parse(saved) : {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Session de Romain',
      players: [],
      isActive: false
    };
  });

  const [narration, setNarration] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('dnd_session', JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/view/')) {
        setPlayerViewData(hash.replace('#/view/', ''));
      }
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleKeySubmit = (key: string) => {
    localStorage.setItem('dnd_api_key', key);
    setApiKey(key);
  };

  const handleResetKey = () => {
    if (confirm("Voulez-vous revenir au menu de saisie de la clé API ?")) {
      localStorage.removeItem('dnd_api_key');
      setApiKey('');
    }
  };

  const handleSubmit = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    setNarration(null);
    
    if (combatState.mode === NarratorMode.COMBAT) {
      playCombatSound(combatState.weapon, combatState.result);
    }

    try {
      const text = await generateNarration(combatState);
      setNarration(text);
      setTimeout(() => {
        const storyEl = document.getElementById('story-area');
        if (storyEl) storyEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'invocation.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiceRoll = (sides: number) => {
    setError(null);
    playDiceSound();
    const roll = Math.floor(Math.random() * sides) + 1;
    setNarration(`Nom : Lancer de d${sides}\nDescription : Vous lancez un dé.\nEffet : Résultat : ${roll}`);
  };

  if (playerViewData) return <PlayerView data={playerViewData} />;

  // Si pas de clé stockée et pas de clé env, on montre le "menu précédent" (ApiKeyGate)
  if (!apiKey && !process.env.API_KEY) {
    return <ApiKeyGate onKeySubmit={handleKeySubmit} />;
  }

  return (
    <div className="min-h-screen bg-black text-parchment font-body selection:bg-blood-red/30 overflow-x-hidden flex flex-col items-center">
      
      {/* Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#1a0505_0%,_#000000_100%)] opacity-70"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')] opacity-20"></div>
      </div>

      {/* Header */}
      <header className="relative z-30 w-full max-w-7xl px-4 md:px-8 mt-6 md:mt-10 mb-6 flex items-center justify-between animate-fade-in shrink-0">
        <div className="flex-1 lg:flex-none">
          <h1 className="font-header text-2xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-gold-antique to-gold-dark uppercase tracking-widest leading-none drop-shadow-md">
            D&D Narrator
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-blood-red font-fantasy text-[7px] md:text-xs tracking-[0.4em] opacity-70 uppercase whitespace-nowrap">Forgé par Romain.DnD89</p>
            <a href="https://www.instagram.com/romain.dnd89/" target="_blank" className="text-gold-dark hover:text-gold-antique transition-all">
                <Instagram className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" />
            </a>
          </div>
        </div>

        <div className="flex items-center gap-4">
            <button onClick={handleResetKey} className="flex items-center gap-1 text-gold-dark font-bold uppercase tracking-widest text-[8px] md:text-[10px] hover:text-gold-antique border-b border-gold-dark/30 pb-0.5">
              <Key className="w-3 h-3 md:w-4 h-4" /> Clé API
            </button>
            <button onClick={() => setShowHelp(true)} className="flex items-center gap-1 text-blood-red font-bold uppercase tracking-widest text-[8px] md:text-[10px] hover:text-blood-red/80 border-b border-blood-red/30 pb-0.5">
              <BookOpen className="w-3 h-3 md:w-4 md:h-4" /> Grimoire
            </button>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-20 w-full max-w-[1600px] px-4 md:px-6 mb-10 flex flex-col lg:flex-row items-start gap-8 flex-1 min-h-0">
        <aside className="w-full lg:w-[350px] shrink-0">
            <NarratorForm 
              combatState={combatState} 
              onChange={setCombatState} 
              onSubmit={handleSubmit}
              onDiceRoll={handleDiceRoll}
              isLoading={isLoading}
            />
        </aside>

        <section id="story-area" className="flex-1 w-full min-h-[300px]">
          {isLoading ? (
            <div className="bg-darker-metal border-2 border-gold-dark/20 rounded-lg p-20 flex flex-col items-center justify-center text-gold-dark animate-pulse shadow-2xl">
                <Sparkles className="w-12 h-12 mb-6 animate-spin text-gold-antique drop-shadow-glow" />
                <p className="font-header text-sm md:text-lg uppercase tracking-[0.3em] text-center">Le destin s'écrit...</p>
                <p className="text-[9px] text-gold-dark/40 uppercase mt-4 tracking-widest">Invoquer les arcanes de l'IA</p>
            </div>
          ) : (
            <StoryBox 
                narration={narration} 
                error={error} 
                session={session}
                onUpdateSession={setSession}
                onClose={() => setNarration(null)}
            />
          )}
        </section>

        <aside className="hidden lg:block lg:w-[380px] shrink-0">
          <VirtualVault session={session} onUpdateSession={setSession} onReset={() => setSession({ ...session, players: [], isActive: false })} />
        </aside>
      </main>

      {/* Overlays */}
      {showHelp && <QuickHelp onClose={() => setShowHelp(false)} />}
      
      {showVault && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-fade-in lg:hidden">
            <div className="p-4 flex justify-end shrink-0 bg-darker-metal border-b border-gold-dark/20">
                <button onClick={() => setShowVault(false)} className="p-3 bg-blood-dark rounded-full border border-gold-dark/50 text-gold-antique shadow-glow-red">
                  <X className="w-6 h-6" />
                </button>
            </div>
            <div className="flex-1 overflow-hidden p-4">
              <VirtualVault session={session} onUpdateSession={setSession} onReset={() => { setSession({ ...session, players: [], isActive: false }); setShowVault(false); }} />
            </div>
        </div>
      )}

      {/* Floating Mobile Button (EN BAS AU CENTRE) */}
      <div className="lg:hidden fixed bottom-10 left-1/2 -translate-x-1/2 z-[60]">
          {!showVault && (
            <button onClick={() => setShowVault(true)} className="flex items-center gap-3 px-8 py-4 bg-darker-metal/95 backdrop-blur-md text-gold-antique rounded-full border-2 border-gold-dark/50 shadow-2xl active:scale-95 transition-all">
                <Briefcase className="w-6 h-6 text-gold-antique drop-shadow-glow" />
                <span className="font-header text-[12px] uppercase tracking-[0.2em] font-bold text-gold-antique">Coffre MJ</span>
            </button>
          )}
      </div>

      <footer className="relative z-30 w-full text-center text-gray-800 text-[8px] uppercase tracking-[0.4em] py-10 opacity-30 font-header">
        © {new Date().getFullYear()} Romain.DnD89 — MAÎTRE DU DONJON VIRTUEL
      </footer>
    </div>
  );
};

export default App;
