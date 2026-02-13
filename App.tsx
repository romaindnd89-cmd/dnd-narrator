
import React, { useState, useEffect } from 'react';
import NarratorForm from './components/NarratorForm';
import StoryBox from './components/StoryBox';
import VirtualVault from './components/VirtualVault';
import QuickHelp from './components/QuickHelp';
import PlayerView from './components/PlayerView'; 
import { CombatState, DiceResult, WeaponType, BodyPart, NarrationStyle, NarratorMode, LootType, EnvironmentType, WorldAtmosphere, InteractiveObjectType, InteractionAction, RiddleDifficulty, SessionState } from './types';
import { generateNarration } from './services/geminiService';
import { playCombatSound, playDiceSound } from './services/soundService';
import { Instagram, BookOpen, ChevronRight, Briefcase } from 'lucide-react';

const App: React.FC = () => {
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showVault, setShowVault] = useState<boolean>(true);
  const [playerViewData, setPlayerViewData] = useState<string | null>(null);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/view/')) {
        setPlayerViewData(hash.replace('#/view/', ''));
      } else {
        setPlayerViewData(null);
      }
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);
  
  const [session, setSession] = useState<SessionState>(() => {
    const saved = localStorage.getItem('dnd_session');
    return saved ? JSON.parse(saved) : {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Session de Romain',
      players: [],
      isActive: false
    };
  });

  useEffect(() => {
    localStorage.setItem('dnd_session', JSON.stringify(session));
  }, [session]);

  const resetSession = () => {
    if (confirm("Voulez-vous vraiment clôre cette session et vider les inventaires ?")) {
      setSession({
        id: Math.random().toString(36).substr(2, 9),
        name: 'Session de Romain',
        players: [],
        isActive: false
      });
    }
  };

  const [combatState, setCombatState] = useState<CombatState>({
    mode: NarratorMode.COMBAT,
    style: NarrationStyle.IMMERSIVE,
    weapon: WeaponType.LONGSWORD,
    bodyPart: BodyPart.UNSPECIFIED,
    result: DiceResult.HIT,
    lootType: LootType.USEFUL,
    environmentType: EnvironmentType.FOREST,
    atmosphere: WorldAtmosphere.DARK_FANTASY,
    interactiveObj: InteractiveObjectType.CHEST,
    interactionAction: InteractionAction.OPEN,
    riddleDifficulty: RiddleDifficulty.EASY,
    target: '',
  });

  const [narration, setNarration] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<React.ReactNode | null>(null);

  const handleDiceRoll = (sides: number) => {
    setError(null);
    playDiceSound();
    const roll = Math.floor(Math.random() * sides) + 1;
    const diceOutput = `**Nom** : Lancer de d${sides}\n**Description** : Vous lancez un polyèdre à ${sides} faces.\n**Effet** : Résultat du jet : ${roll}`;
    setNarration(diceOutput);
  };

  const handleSubmit = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    setNarration(null);
    if (combatState.mode === NarratorMode.COMBAT) playCombatSound(combatState.weapon, combatState.result);
    try {
      const resultData = await generateNarration(combatState);
      setNarration(resultData);
    } catch (err: any) {
      setError(<span className="text-red-400">Une erreur magique est survenue dans le donjon.</span>);
    } finally {
      setIsLoading(false);
    }
  };

  if (playerViewData) {
    return <PlayerView data={playerViewData} />;
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-black selection:bg-blood-red selection:text-white overflow-x-hidden">
      
      {showHelp && <QuickHelp onClose={() => setShowHelp(false)} />}

      <header className="w-full max-w-7xl px-8 mt-12 mb-8 flex items-center justify-between animate-fade-in shrink-0">
        <div className="flex-1 lg:flex-none">
          <h1 className="font-header text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-gold-antique to-gold-dark uppercase tracking-widest drop-shadow-lg leading-tight">
            D&D Narrator
          </h1>
          <p className="text-blood-red font-fantasy text-xs tracking-[0.5em] mt-1 opacity-70 uppercase">Forgé par Romain.DnD89</p>
        </div>

        <div className="hidden lg:flex items-center gap-6">
            <div className="flex gap-6">
                <a href="https://www.instagram.com/romain.dnd89/" target="_blank" className="text-gold-dark hover:text-gold-antique transition-all hover:scale-110"><Instagram className="w-5 h-5" /></a>
                <button onClick={() => setShowHelp(true)} className="flex items-center gap-2 text-blood-red font-bold uppercase tracking-widest text-[10px] hover:text-blood-red/80 transition-colors border-b border-blood-red/30 pb-1"><BookOpen className="w-4 h-4" /> Le Grimoire</button>
            </div>
        </div>
      </header>

      <main className={`
        w-full max-w-[1920px] px-4 md:px-8 mb-16 gap-6 grid flex-1
        transition-all duration-500 ease-in-out
        ${showVault ? 'lg:grid-cols-[1.1fr_1.8fr_1.1fr]' : 'lg:grid-cols-[1.2fr_2fr]'}
      `}>
        <section className="h-full min-h-[500px] flex flex-col">
          <NarratorForm combatState={combatState} onChange={setCombatState} onSubmit={handleSubmit} onDiceRoll={handleDiceRoll} isLoading={isLoading} />
        </section>

        <section className="h-full min-h-[500px] flex flex-col">
          <StoryBox narration={narration} error={error} session={session} onUpdateSession={setSession} />
        </section>

        <section className={`h-full min-h-[500px] flex flex-col relative transition-all duration-500 ${showVault ? 'opacity-100' : 'opacity-0 translate-x-10 pointer-events-none hidden lg:flex'}`}>
          <VirtualVault session={session} onUpdateSession={setSession} onReset={resetSession} />
          <button 
            onClick={() => setShowVault(!showVault)}
            className="absolute -left-6 top-1/2 -translate-y-1/2 bg-darker-metal border border-gold-dark/30 border-r-0 p-2 rounded-l-md text-gold-dark hover:text-gold-antique hidden lg:block shadow-2xl z-10"
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${showVault ? '' : 'rotate-180'}`} />
          </button>
        </section>

        <button 
           onClick={() => setShowVault(!showVault)}
           className="lg:hidden fixed bottom-6 right-6 z-50 p-5 bg-blood-dark text-gold-antique rounded-full border border-gold-dark/50 shadow-[0_0_20px_rgba(138,3,3,0.6)]"
        >
           <Briefcase className="w-7 h-7" />
        </button>
      </main>

      <footer className="w-full text-center text-gray-800 text-[9px] uppercase tracking-[0.4em] pb-8 mt-auto opacity-50 font-header">
        © {new Date().getFullYear()} Romain.DnD89 — MAÎTRE DU DONJON VIRTUEL
      </footer>
    </div>
  );
};

export default App;
