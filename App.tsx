
import React, { useState, useEffect } from 'react';
import NarratorForm from './components/NarratorForm';
import StoryBox from './components/StoryBox';
import VirtualVault from './components/VirtualVault';
import QuickHelp from './components/QuickHelp';
import PlayerView from './components/PlayerView'; 
import { CombatState, DiceResult, WeaponType, BodyPart, NarrationStyle, NarratorMode, LootType, EnvironmentType, WorldAtmosphere, InteractiveObjectType, InteractionAction, RiddleDifficulty, SessionState } from './types';
import { generateNarration } from './services/geminiService';
import { playCombatSound, playDiceSound } from './services/soundService';
import { Instagram, BookOpen, Briefcase, X, Sparkles } from 'lucide-react';

const atou = (str: string) => {
    try {
        return decodeURIComponent(atob(str).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    } catch(e) {
        return null;
    }
};

const App: React.FC = () => {
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showVault, setShowVault] = useState<boolean>(false);
  const [playerViewData, setPlayerViewData] = useState<string | null>(null);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/view/')) {
        setPlayerViewData(hash.replace('#/view/', ''));
      } else if (hash.startsWith('#/dm/')) {
        const configData = hash.replace('#/dm/', '');
        const decoded = atou(configData);
        if (decoded) {
            try {
                const config = JSON.parse(decoded);
                if (config.url && config.key) {
                    localStorage.setItem('dnd_supabase_url', config.url);
                    localStorage.setItem('dnd_supabase_key', config.key);
                    window.location.hash = '';
                    window.location.reload();
                }
            } catch(e) { console.error("Lien MJ invalide"); }
        }
        setPlayerViewData(null);
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
      setTimeout(() => {
          const storyEl = document.getElementById('story-area');
          if (storyEl) storyEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      const msg = err.message || "Erreur inconnue";
      setError(
        <div className="flex flex-col items-center gap-2">
            <span className="text-red-400">Une erreur magique est survenue dans le donjon.</span>
            <span className="text-[10px] text-gray-600 uppercase tracking-widest italic">{msg}</span>
        </div>
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (playerViewData) {
    return <PlayerView data={playerViewData} />;
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-black selection:bg-blood-red selection:text-white">
      
      {showHelp && <QuickHelp onClose={() => setShowHelp(false)} />}
      
      <header className="w-full max-w-7xl px-4 md:px-8 mt-6 md:mt-10 mb-6 flex items-center justify-between animate-fade-in shrink-0">
        <div className="flex-1 lg:flex-none">
          <h1 className="font-header text-2xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-gold-antique to-gold-dark uppercase tracking-widest leading-none">
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
            <button onClick={() => setShowHelp(true)} className="flex items-center gap-1 text-blood-red font-bold uppercase tracking-widest text-[8px] md:text-[10px] hover:text-blood-red/80 transition-colors border-b border-blood-red/30 pb-0.5"><BookOpen className="w-3 h-3 md:w-4 md:h-4" /> Grimoire</button>
        </div>
      </header>

      <main className="w-full max-w-[1600px] px-4 md:px-6 mb-10 flex flex-col lg:flex-row items-start gap-8 flex-1 min-h-0">
        
        {/* COLONNE GAUCHE : FORMULAIRE */}
        <aside className="w-full lg:w-[350px] lg:sticky lg:top-6 shrink-0">
          <NarratorForm 
            combatState={combatState} 
            onChange={setCombatState} 
            onSubmit={handleSubmit} 
            onDiceRoll={handleDiceRoll} 
            isLoading={isLoading} 
          />
        </aside>

        {/* COLONNE CENTRALE : NARRATION */}
        <section id="story-area" className="flex-1 w-full min-h-[200px]">
          {isLoading && !narration && (
            <div className="bg-darker-metal border-2 border-gold-dark/20 rounded-lg p-12 flex flex-col items-center justify-center text-gold-dark animate-pulse">
                <Sparkles className="w-10 h-10 mb-4 animate-spin text-gold-antique" />
                <p className="font-header text-xs uppercase tracking-widest">Le destin s'écrit...</p>
            </div>
          )}
          
          <StoryBox 
            narration={narration} 
            error={error} 
            session={session} 
            onUpdateSession={setSession} 
            onClose={() => setNarration(null)}
          />
          
          {!narration && !isLoading && (
            <div className="h-full min-h-[300px] border-2 border-dashed border-white/5 rounded-lg flex flex-col items-center justify-center text-gray-800 space-y-4 opacity-30">
                <Briefcase className="w-16 h-16" />
                <p className="font-header text-[10px] uppercase tracking-[0.4em]">En attente d'une action...</p>
            </div>
          )}
        </section>

        {/* COLONNE DROITE : VAULT */}
        <aside className={`
            shrink-0 transition-all duration-300
            ${showVault 
                ? 'fixed inset-0 z-[100] bg-black p-4 flex flex-col h-[100dvh]' 
                : 'hidden lg:block lg:w-[380px] lg:sticky lg:top-6 lg:h-[calc(100vh-120px)]'}
        `}>
          {showVault && (
            <div className="lg:hidden flex justify-end mb-4 shrink-0">
              <button onClick={() => setShowVault(false)} className="p-3 bg-blood-dark rounded-full border border-gold-dark/50 text-gold-antique active:scale-90 transition-all shadow-glow-red"><X className="w-6 h-6" /></button>
            </div>
          )}
          <div className="flex-1 min-h-0">
            <VirtualVault session={session} onUpdateSession={setSession} onReset={resetSession} />
          </div>
        </aside>
      </main>

      {/* BOUTON FLOTTANT MOBILE : LOGO COFFRE + ÉCRITURE */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[60]">
          {!showVault && (
            <button 
                onClick={() => setShowVault(true)}
                className="flex items-center gap-3 px-6 py-4 bg-darker-metal/95 backdrop-blur-md text-gold-antique rounded-full border-2 border-gold-dark/50 shadow-[0_0_30px_rgba(0,0,0,0.8)] active:scale-95 transition-all"
            >
                <Briefcase className="w-5 h-5 text-gold-antique drop-shadow-glow" />
                <span className="font-header text-[10px] uppercase tracking-[0.2em] font-bold text-gold-antique">Coffre Maître de Jeu</span>
            </button>
          )}
      </div>

      <footer className="w-full text-center text-gray-800 text-[8px] uppercase tracking-[0.4em] py-8 opacity-30 font-header shrink-0">
        © {new Date().getFullYear()} Romain.DnD89 — MAÎTRE DU DONJON VIRTUEL
      </footer>
    </div>
  );
};

export default App;
