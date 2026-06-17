
import React, { useState, useEffect } from 'react';
import NarratorForm from './components/NarratorForm';
import StoryBox from './components/StoryBox';
import VirtualVault from './components/VirtualVault';
import SoundBox from './components/SoundBox';
import QuickHelp from './components/QuickHelp';
import PlayerView from './components/PlayerView'; 
import ApiKeyGate from './components/ApiKeyGate';
import { CombatState, DiceResult, WeaponType, BodyPart, NarrationStyle, NarratorMode, LootType, EnvironmentType, WorldAtmosphere, InteractiveObjectType, InteractionAction, RiddleDifficulty, SessionState, MonsterCR, MechanicalDifficulty, PlayerExperience, NpcAction, QuestComplexity, NpcReward } from './types';
import { generateNarration } from './services/geminiService';
import { playCombatSound, playDiceSound, playRoar } from './services/soundService';
import { BookOpen, Briefcase, Sparkles, Instagram, X, Volume2, Music2, Skull, Key, Settings, LogOut, Save, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';

const App: React.FC = () => {
  // Initialisation : On prend le LocalStorage, sinon l'Env, sinon null.
  const [apiKey, setApiKey] = useState<string | null>(() => {
      const local = localStorage.getItem('gemini_api_key');
      if (local) return local;
      return process.env.API_KEY || null;
  });

  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showVault, setShowVault] = useState<boolean>(false);
  const [showSoundBox, setShowSoundBox] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false); // Nouvelle modale Settings
  const [playerViewData, setPlayerViewData] = useState<string | null>(null);

  // État temporaire pour la modale de settings
  const [tempKey, setTempKey] = useState('');
  const [keySavedMsg, setKeySavedMsg] = useState(false);

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
      localStorage.setItem('gemini_api_key', key);
      setApiKey(key);
  };

  // Mise à jour de la clé depuis les settings
  const handleUpdateKey = () => {
    if (tempKey.length > 10) {
        localStorage.setItem('gemini_api_key', tempKey);
        setApiKey(tempKey);
        setTempKey('');
        setKeySavedMsg(true);
        setTimeout(() => {
            setKeySavedMsg(false);
            setShowSettings(false);
        }, 1500);
    }
  };

  // Déconnexion complète
  const handleLogout = () => {
      localStorage.removeItem('gemini_api_key');
      setApiKey(null);
      setShowSettings(false);
  };

  const handleSubmit = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    setNarration(null);
    
    if (combatState.mode === NarratorMode.BESTIARY) {
      playRoar();
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

  // Si pas de clé (état null), on affiche la porte d'entrée
  if (!apiKey) {
      return <ApiKeyGate onKeySubmit={handleKeySubmit} />;
  }

  const isOverlayActive = isLoading || showHelp || showVault || showSoundBox || showSettings;

  return (
    <div className="min-h-screen bg-black text-parchment font-body selection:bg-blood-red/30 flex flex-col items-center">
      
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#1a0505_0%,_#000000_100%)] opacity-70"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')] opacity-15"></div>
      </div>

      {/* HEADER */}
      <header className="relative z-30 w-full max-w-7xl px-4 md:px-8 pt-6 md:pt-10 mb-6 md:mb-10 flex items-center justify-between animate-fade-in shrink-0">
        <div className="flex-1 lg:flex-none">
          <h1 className="font-header text-xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-gold-antique to-gold-dark uppercase tracking-[0.2em] md:tracking-widest leading-none drop-shadow-md">
            D&D Narrator
          </h1>
          <div className="flex items-center gap-3 mt-1 md:mt-2">
            <p className="text-blood-red font-fantasy text-[6px] md:text-xs tracking-[0.4em] opacity-70 uppercase whitespace-nowrap">Forgé par Romain.DnD89</p>
            <a href="https://www.instagram.com/romain.dnd89/" target="_blank" className="text-gold-dark hover:text-gold-antique transition-all hover:scale-110">
                <Instagram className="w-2.5 h-2.5 md:w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="flex items-center gap-4">
            <button onClick={() => setShowSettings(true)} className="flex items-center gap-2 text-gold-dark hover:text-gold-antique transition-colors border border-gold-dark/30 px-3 py-1.5 rounded-full hover:bg-gold-dark/10 shadow-lg group">
                <Settings className="w-3 h-3 md:w-4 h-4 group-hover:rotate-90 transition-transform" /> 
                <span className="text-[9px] md:text-[10px] uppercase font-bold tracking-widest hidden md:inline">Configuration / Clé</span>
            </button>
            <button onClick={() => setShowHelp(true)} className="flex items-center gap-1 text-blood-red font-bold uppercase tracking-widest text-[8px] md:text-[10px] hover:text-white transition-colors border-b border-blood-red/30 pb-0.5">
              <BookOpen className="w-3 h-3 md:w-4 h-4" /> Grimoire
            </button>
        </div>
      </header>

      {/* MAIN CONTENT : Padding bas réduit */}
      <main className="relative z-20 w-full max-w-[1600px] px-4 md:px-6 flex flex-col lg:flex-row items-start gap-6 md:gap-8 flex-1 pb-32 lg:pb-16">
        <aside className="w-full lg:w-[350px] shrink-0 space-y-4">
            <NarratorForm 
              combatState={combatState} 
              onChange={setCombatState} 
              onSubmit={handleSubmit}
              onDiceRoll={handleDiceRoll}
              isLoading={isLoading}
            />
            <div className="hidden lg:block h-[350px]">
                <SoundBox onClose={() => {}} />
            </div>
        </aside>

        <section id="story-area" className="flex-1 w-full min-h-[400px]">
          {isLoading ? (
            <div className="bg-darker-metal border-2 border-gold-dark/20 rounded-2xl p-24 flex flex-col items-center justify-center text-gold-antique animate-pulse shadow-2xl relative overflow-hidden h-full">
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
                mode={combatState.mode}
                combatState={combatState}
            />
          )}
          
          {!narration && !isLoading && !error && (
            <div className="h-full min-h-[400px] border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-gray-800 space-y-6 opacity-20">
                <button onClick={() => setCombatState({...combatState, mode: NarratorMode.BESTIARY})} className="group flex flex-col items-center gap-4">
                    <Skull className="w-16 h-16 transition-all group-hover:scale-110 group-hover:text-gold-antique" />
                    <p className="font-header text-[9px] uppercase tracking-[0.5em]">L'aventure attend...</p>
                </button>
            </div>
          )}
        </section>

        <aside className="hidden lg:block lg:w-[400px] shrink-0">
          <VirtualVault session={session} onUpdateSession={setSession} onReset={() => setSession({ ...session, players: [], isActive: false })} />
        </aside>
      </main>

      {/* --- MODALES --- */}

      {showHelp && <QuickHelp onClose={() => setShowHelp(false)} />}
      
      {showVault && (
        <div className="fixed inset-0 z-[10000] bg-black flex flex-col animate-fade-in lg:hidden">
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
        <div className="fixed inset-0 z-[10000] bg-black flex flex-col animate-fade-in lg:hidden">
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

      {/* SETTINGS MODAL */}
      {showSettings && (
          <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
              <div className="w-full max-w-md bg-darker-metal border-2 border-gold-dark/50 rounded-lg shadow-[0_0_50px_rgba(197,160,89,0.1)] p-6 relative">
                  <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                      <X className="w-6 h-6" />
                  </button>

                  <h2 className="font-header text-xl text-gold-antique uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Settings className="w-5 h-5" /> Configuration
                  </h2>

                  <div className="space-y-6">
                      <div className="bg-black/40 border border-gold-dark/20 p-4 rounded-lg">
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-2">Clé API Actuelle</label>
                          <div className="flex items-center justify-between">
                              <code className="text-xs text-green-400 font-mono">
                                  {apiKey && apiKey.length > 10 ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 8)}` : 'Non connectée'}
                              </code>
                              {apiKey && <CheckCircle className="w-4 h-4 text-green-500" />}
                          </div>
                      </div>

                      <div className="space-y-3">
                          <label className="text-[10px] font-bold text-gold-antique uppercase block">Mettre à jour la Clé</label>
                          <input 
                              type="password" 
                              value={tempKey}
                              onChange={(e) => setTempKey(e.target.value)}
                              placeholder="Collez la nouvelle clé ici..."
                              className="w-full bg-black border border-gold-dark/30 rounded p-3 text-sm text-parchment outline-none focus:border-gold-antique transition-colors"
                          />
                          <button 
                              onClick={handleUpdateKey}
                              disabled={tempKey.length < 10}
                              className={`w-full py-3 rounded uppercase font-bold text-xs tracking-widest flex items-center justify-center gap-2 transition-all
                                ${tempKey.length >= 10 
                                    ? 'bg-gold-dark text-black hover:bg-gold-antique shadow-glow-gold' 
                                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'}
                              `}
                          >
                             {keySavedMsg ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                             {keySavedMsg ? 'Clé Enregistrée !' : 'Sauvegarder'}
                          </button>
                      </div>

                      <div className="bg-blue-950/20 border border-blue-500/20 p-3 rounded mt-4">
                          <h4 className="text-[10px] font-bold text-blue-400 uppercase mb-1 flex items-center gap-2">
                              <ExternalLink className="w-3 h-3" /> Pas de clé ?
                          </h4>
                          <p className="text-[9px] text-gray-400 leading-relaxed">
                              Obtenez-la gratuitement sur <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-400 underline hover:text-blue-300">Google AI Studio</a>.
                              <br/>Connectez-vous avec Google, puis cliquez sur <strong>"Create API Key"</strong>.
                          </p>
                      </div>

                      <div className="border-t border-white/10 pt-6 mt-6">
                           <button 
                                onClick={handleLogout}
                                className="w-full py-3 border border-blood-red/30 text-blood-red hover:bg-blood-red/10 rounded uppercase font-bold text-xs tracking-widest flex items-center justify-center gap-2 transition-all"
                           >
                               <LogOut className="w-4 h-4" /> Oublier la clé (Déconnexion)
                           </button>
                           <p className="text-[9px] text-gray-600 text-center mt-3">
                               Ceci effacera la clé de votre navigateur. Vous devrez la ressaisir.
                           </p>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* BARRE MOBILE PLEINE LARGEUR - AFFINÉE (SLEEK) */}
      {!isOverlayActive && (
        <div className="lg:hidden fixed bottom-0 left-0 w-full z-[9999] bg-darker-metal/98 backdrop-blur-2xl border-t border-gold-dark/30 shadow-[0_-10px_40px_rgba(0,0,0,1)] px-6 py-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] flex items-center justify-between animate-fade-in">
              {/* Côté Gauche : Logo plus compact */}
              <div className="flex items-center gap-2">
                <Skull className="w-5 h-5 text-blood-red" />
                <span className="font-header text-[9px] uppercase tracking-widest text-gold-antique font-black">D&D Narrator</span>
              </div>

              {/* Côté Droit : Boutons affinés (h-11 au lieu de h-14) */}
              <div className="flex items-center gap-3">
                  <button 
                      onClick={() => setShowSettings(true)} 
                      title="Configuration / Clé"
                      className="flex items-center justify-center w-11 h-11 bg-black/40 text-gold-dark rounded-xl border border-gold-dark/30 active:scale-90 transition-all"
                  >
                      <Settings className="w-5 h-5" />
                  </button>
                  <button 
                      onClick={() => setShowSoundBox(true)} 
                      className="flex items-center justify-center w-11 h-11 bg-gold-antique text-black rounded-xl border border-gold-dark shadow-md active:scale-90 transition-all"
                  >
                      <Volume2 className="w-5 h-5" />
                  </button>
                  
                  <button 
                      onClick={() => setShowVault(true)} 
                      className="flex items-center gap-2 px-5 h-11 bg-black/40 border border-gold-dark/30 text-gold-antique rounded-xl active:scale-90 transition-all"
                  >
                      <Briefcase className="w-4 h-4 text-gold-antique" />
                      <span className="font-header text-[9px] uppercase tracking-widest font-bold">Coffre MJ</span>
                  </button>
              </div>
        </div>
      )}

      <footer className="relative z-30 w-full text-center text-gray-800 text-[8px] uppercase tracking-[0.4em] py-16 opacity-20 font-header">
        © {new Date().getFullYear()} Romain.DnD89 — MAÎTRE DU DONJON VIRTUEL
      </footer>
    </div>
  );
};

export default App;
