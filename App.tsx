
import React, { useState, useEffect } from 'react';
import NarratorForm from './components/NarratorForm';
import StoryBox from './components/StoryBox';
import VirtualVault from './components/VirtualVault';
import SoundBox from './components/SoundBox';
import QuickHelp from './components/QuickHelp';
import PlayerView from './components/PlayerView'; 
import { CombatState, DiceResult, WeaponType, BodyPart, NarrationStyle, NarratorMode, LootType, EnvironmentType, WorldAtmosphere, InteractiveObjectType, InteractionAction, RiddleDifficulty, SessionState } from './types';
import { generateNarration } from './services/geminiService';
import { playCombatSound, playDiceSound } from './services/soundService';
import { BookOpen, Briefcase, Sparkles, Instagram, X, Volume2 } from 'lucide-react';

const App: React.FC = () => {
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showVault, setShowVault] = useState<boolean>(false);
  const [showSoundBox, setShowSoundBox] = useState<boolean>(false);
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
      setError(err.message || "L'invocation de l'IA a échoué.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiceRoll = (sides: number) => {
    setError(null);
    playDiceSound();
    const roll = Math.floor(Math.random() * sides) + 1;
    
    const atmosphericPhrases = [
      "Le polyèdre s'entrechoque contre le bois usé de la table, défiant les lois du hasard...",
      "Un silence s'abat alors que le dé roule lourdement, révélant la volonté du destin...",
      "Le destin bascule. Les arcanes s'alignent sur le nombre que vous venez d'invoquer...",
      "Le dé s'immobilise enfin, comme si le souffle des anciens dieux l'avait guidé...",
      "La face supérieure du polyèdre luit d'une lueur fatidique, scellant votre prochain geste..."
    ];
    const phrase = atmosphericPhrases[Math.floor(Math.random() * atmosphericPhrases.length)];

    setNarration(`Nom : Lancer de d${sides}\nDescription : ${phrase}\nEffet : Résultat : ${roll}`);
  };

  if (playerViewData) return <PlayerView data={playerViewData} />;

  return (
    <div className="min-h-screen bg-black text-parchment font-body selection:bg-blood-red/30 overflow-x-hidden flex flex-col items-center">
      
      {/* Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#1a0505_0%,_#000000_100%)] opacity-70"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')] opacity-15"></div>
      </div>

      {/* Header */}
      <header className="relative z-30 w-full max-w-7xl px-4 md:px-8 mt-6 md:mt-10 mb-6 flex items-center justify-between animate-fade-in shrink-0">
        <div className="flex-1 lg:flex-none">
          <h1 className="font-header text-2xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-gold-antique to-gold-dark uppercase tracking-widest leading-none drop-shadow-md">
            D&D Narrator
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-blood-red font-fantasy text-[7px] md:text-xs tracking-[0.4em] opacity-70 uppercase whitespace-nowrap">Forgé par Romain.DnD89</p>
            <a href="https://www.instagram.com/romain.dnd89/" target="_blank" className="text-gold-dark hover:text-gold-antique transition-all hover:scale-110">
                <Instagram className="w-2.5 h-2.5 md:w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="flex items-center gap-4">
            <button onClick={() => setShowHelp(true)} className="flex items-center gap-1 text-blood-red font-bold uppercase tracking-widest text-[8px] md:text-[10px] hover:text-blood-red/80 border-b border-blood-red/30 pb-0.5">
              <BookOpen className="w-3 h-3 md:w-4 h-4" /> Grimoire
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-20 w-full max-w-[1600px] px-4 md:px-6 mb-20 flex flex-col lg:flex-row items-start gap-8 flex-1 min-h-0">
        <aside className="w-full lg:w-[350px] shrink-0 space-y-4">
            <NarratorForm 
              combatState={combatState} 
              onChange={setCombatState} 
              onSubmit={handleSubmit}
              onDiceRoll={handleDiceRoll}
              isLoading={isLoading}
            />
            {/* SoundBox Desktop intégrée en bas du form ou flottante */}
            <div className="hidden lg:block h-[350px]">
                <SoundBox onClose={() => {}} />
            </div>
        </aside>

        <section id="story-area" className="flex-1 w-full min-h-[350px]">
          {isLoading ? (
            <div className="bg-darker-metal border-2 border-gold-dark/20 rounded-2xl p-24 flex flex-col items-center justify-center text-gold-antique animate-pulse shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gold-dark/5 animate-pulse"></div>
                <Sparkles className="w-16 h-16 mb-8 animate-spin text-gold-antique drop-shadow-glow" />
                <p className="font-header text-xl md:text-3xl uppercase tracking-[0.4em] text-center text-gold-antique">Le destin s'écrit...</p>
                <p className="text-[10px] text-gold-dark/40 uppercase mt-6 tracking-[0.6em]">Les dés sont jetés</p>
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
            <div className="h-full min-h-[400px] border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-gray-800 space-y-6 opacity-20">
                <Sparkles className="w-20 h-20" />
                <p className="font-header text-xs uppercase tracking-[0.5em]">Prêt pour l'aventure...</p>
            </div>
          )}
        </section>

        <aside className="hidden lg:block lg:w-[400px] shrink-0">
          <VirtualVault session={session} onUpdateSession={setSession} onReset={() => setSession({ ...session, players: [], isActive: false })} />
        </aside>
      </main>

      {/* Mobile Overlays */}
      {showHelp && <QuickHelp onClose={() => setShowHelp(false)} />}
      
      {showVault && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-fade-in lg:hidden">
            <div className="p-4 flex justify-end shrink-0 bg-darker-metal border-b border-gold-dark/20">
                <button onClick={() => setShowVault(false)} className="p-4 bg-blood-dark rounded-full border border-gold-dark/50 text-gold-antique shadow-glow-red active:scale-90 transition-all">
                  <X className="w-6 h-6" />
                </button>
            </div>
            <div className="flex-1 overflow-hidden p-4">
              <VirtualVault session={session} onUpdateSession={setSession} onReset={() => { setSession({ ...session, players: [], isActive: false }); setShowVault(false); }} />
            </div>
        </div>
      )}

      {showSoundBox && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-fade-in lg:hidden">
            <div className="p-4 flex justify-end shrink-0 bg-darker-metal border-b border-gold-dark/20">
                <button onClick={() => setShowSoundBox(false)} className="p-4 bg-gold-dark rounded-full border border-gold-dark/50 text-black shadow-glow-gold active:scale-90 transition-all">
                  <X className="w-6 h-6" />
                </button>
            </div>
            <div className="flex-1 overflow-hidden p-4">
              <SoundBox onClose={() => setShowSoundBox(false)} />
            </div>
        </div>
      )}

      {/* Floating Mobile Buttons */}
      <div className="lg:hidden fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3">
          {!showVault && !showSoundBox && (
            <>
              <button 
                  onClick={() => setShowSoundBox(true)} 
                  className="flex items-center gap-2 p-5 bg-gold-antique text-black rounded-full border-2 border-gold-dark shadow-xl active:scale-95 transition-all"
              >
                  <Volume2 className="w-6 h-6" />
              </button>
              <button 
                  onClick={() => setShowVault(true)} 
                  className="flex items-center gap-4 px-10 py-5 bg-darker-metal/95 backdrop-blur-xl text-gold-antique rounded-full border-2 border-gold-dark/50 shadow-[0_10px_40px_rgba(0,0,0,0.9)] active:scale-95 transition-all group border-b-4 border-gold-dark"
              >
                  <Briefcase className="w-6 h-6 text-gold-antique drop-shadow-glow" />
                  <span className="font-header text-[12px] uppercase tracking-[0.3em] font-bold text-gold-antique">Coffre MJ</span>
              </button>
            </>
          )}
      </div>

      <footer className="relative z-30 w-full text-center text-gray-800 text-[8px] uppercase tracking-[0.4em] py-12 opacity-30 font-header">
        © {new Date().getFullYear()} Romain.DnD89 — MAÎTRE DU DONJON VIRTUEL
      </footer>
    </div>
  );
};

export default App;
