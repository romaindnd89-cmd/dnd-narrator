
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

const atou = (str: string) => {
    try {
        return decodeURIComponent(atob(str).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    } catch(e) {
        return null;
    }
};

const App: React.FC = () => {
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
    if (confirm("Voulez-vous changer de clé API ?")) {
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
      setError(err.message || "Une erreur magique est survenue dans le donjon.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiceRoll = (sides: number) => {
    setError(null);
    playDiceSound();
    const roll = Math.floor(Math.random() * sides) + 1;
    const diceOutput = `Nom : Lancer de d${sides}\nDescription : Vous lancez un polyèdre à ${sides} faces.\nEffet : Résultat du jet : ${roll}`;
    setNarration(diceOutput);
  };

  if (playerViewData) {
    return <PlayerView data={playerViewData} />;
  }

  if (!apiKey && !process.env.API_KEY) {
    return <ApiKeyGate onKeySubmit={handleKeySubmit} />;
  }

  return (
    <div className="min-h-screen bg-black text-parchment font-body selection:bg-blood-red/30 overflow-x-hidden flex flex-col items-center">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#1a0505_0%,_#000000_100%)] opacity-70"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')] opacity-20"></div>
      </div>

      {/* Main Header */}
      <header className="relative z-30 w-full max-w-7xl px-4 md:px-8 mt-6 md:mt-10 mb-6 flex items-center justify-between animate-fade-in shrink-0">
        <div className="flex-1 lg:flex-none">
          <h1 className="font-header text-2xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-gold-antique to-gold-dark uppercase tracking-widest leading-none drop-shadow-md">
            D&D Narrator
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-blood-red font-fantasy text-[7px] md:text-xs tracking-[0.4em] opacity-70 uppercase whitespace-nowrap">Forgé par Romain.DnD89</p>
            <a href="https://www.instagram.com/romain.dnd89/" target="_blank" className="flex items-center gap-1.5 text-gold-dark hover:text-gold-antique transition-all hover:scale-105">
                <Instagram className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" />
                <span className="text-[6px] md:text-[8px] font-header font-bold uppercase tracking-wider opacity-60">Instagram</span>
            </a>
          </div>
        </div>

        <div className="flex items-center gap-4">
            <button 
              onClick={handleResetKey}
              className="flex items-center gap-1 text-gold-dark font-bold uppercase tracking-widest text-[8px] md:text-[10px] hover:text-gold-antique transition-colors border-b border-gold-dark/30 pb-0.5"
            >
              <Key className="w-3 h-3 md:w-4 h-4" /> Clé API
            </button>
            <button 
              onClick={() => setShowHelp(true)} 
              className="flex items-center gap-1 text-blood-red font-bold uppercase tracking-widest text-[8px] md:text-[10px] hover:text-blood-red/80 transition-colors border-b border-blood-red/30 pb-0.5"
            >
              <BookOpen className="w-3 h-3 md:w-4 md:h-4" /> Grimoire
            </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-20 w-full max-w-[1600px] px-4 md:px-6 mb-10 flex flex-col lg:flex-row items-start gap-8 flex-1 min-h-0">
        
        {/* Left Section: Narrator Controls */}
        <aside className="w-full lg:w-[350px] lg:sticky lg:top-6 shrink-0">
            <NarratorForm 
              combatState={combatState} 
              onChange={setCombatState} 
              onSubmit={handleSubmit}
              onDiceRoll={handleDiceRoll}
              isLoading={isLoading}
            />
        </aside>

        {/* Middle Section: Story Display */}
        <section id="story-area" className="flex-1 w-full min-h-[300px]">
          {isLoading ? (
            <div className="bg-darker-metal border-2 border-gold-dark/20 rounded-lg p-20 flex flex-col items-center justify-center text-gold-dark animate-pulse shadow-2xl">
                <Sparkles className="w-12 h-12 mb-6 animate-spin text-gold-antique drop-shadow-glow" />
                <p className="font-header text-sm md:text-lg uppercase tracking-[0.3em] text-center">Le destin s'écrit...</p>
                <p className="text-[9px] text-gold-dark/40 uppercase mt-4 tracking-widest">Invocation des arcanes de l'IA</p>
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
          
          {!narration && !isLoading && !error && (
            <div className="h-full min-h-[400px] border-2 border-dashed border-white/5 rounded-lg flex flex-col items-center justify-center text-gray-800 space-y-4 opacity-30">
                <Sparkles className="w-16 h-16" />
                <p className="font-header text-[10px] uppercase tracking-[0.4em]">En attente d'une action...</p>
            </div>
          )}
        </section>

        {/* Right Section: Vault (Desktop Only) */}
        <aside className="hidden lg:block lg:w-[380px] lg:sticky lg:top-6 lg:h-[calc(100vh-120px)] shrink-0">
          <VirtualVault 
            session={session} 
            onUpdateSession={setSession} 
            onReset={() => {
              if (confirm("Clore la session et vider les inventaires ?")) {
                setSession({ ...session, players: [], isActive: false });
              }
            }} 
          />
        </aside>
      </main>

      {/* Overlays */}
      {showHelp && <QuickHelp onClose={() => setShowHelp(false)} />}
      
      {/* Mobile Vault Overlay */}
      {showVault && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-fade-in lg:hidden">
            <div className="p-4 flex justify-end shrink-0 bg-darker-metal border-b border-gold-dark/20">
                <button 
                  onClick={() => setShowVault(false)} 
                  className="p-3 bg-blood-dark rounded-full border border-gold-dark/50 text-gold-antique active:scale-90 transition-all shadow-glow-red"
                >
                  <X className="w-6 h-6" />
                </button>
            </div>
            <div className="flex-1 overflow-hidden p-4">
              <VirtualVault 
                session={session} 
                onUpdateSession={setSession} 
                onReset={() => {
                  if (confirm("Clore la session et vider les inventaires ?")) {
                    setSession({ ...session, players: [], isActive: false });
                    setShowVault(false);
                  }
                }} 
              />
            </div>
        </div>
      )}

      {/* Floating Mobile Button (RESTAURÉ EN BAS) */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[60]">
          {!showVault && (
            <button 
                onClick={() => setShowVault(true)}
                className="flex items-center gap-3 px-6 py-4 bg-darker-metal/95 backdrop-blur-md text-gold-antique rounded-full border-2 border-gold-dark/50 shadow-[0_0_30px_rgba(0,0,0,0.8)] active:scale-95 transition-all group"
            >
                <Briefcase className="w-5 h-5 text-gold-antique drop-shadow-glow group-hover:animate-bounce" />
                <span className="font-header text-[10px] uppercase tracking-[0.2em] font-bold text-gold-antique">Coffre Maître de jeu</span>
            </button>
          )}
      </div>

      {/* Sticky Footer */}
      <footer className="relative z-30 w-full text-center text-gray-800 text-[8px] uppercase tracking-[0.4em] py-10 opacity-30 font-header shrink-0">
        © {new Date().getFullYear()} Romain.DnD89 — MAÎTRE DU DONJON VIRTUEL
      </footer>
    </div>
  );
};

export default App;
