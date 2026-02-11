import React, { useState, useEffect } from 'react';
import NarratorForm from './components/NarratorForm';
import StoryBox from './components/StoryBox';
import ApiKeyGate from './components/ApiKeyGate';
import { CombatState, DiceResult, WeaponType, BodyPart, NarrationStyle, NarratorMode, LootType } from './types';
import { generateNarration } from './services/geminiService';
import { Flame, AlertTriangle, LogOut, Instagram } from 'lucide-react';

const App: React.FC = () => {
  // --- Gestion de la Clé API ---
  const [apiKey, setApiKey] = useState<string | null>(null);
  
  // Chargement de la clé au démarrage
  useEffect(() => {
    const storedKey = localStorage.getItem('dnd_narrator_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const handleKeySubmit = (key: string) => {
    setApiKey(key);
    // On ne stocke pas "DEMO" pour éviter de bloquer l'utilisateur en mode démo au reload
    if (key !== "DEMO") {
        localStorage.setItem('dnd_narrator_api_key', key);
    }
  };

  const handleLogout = () => {
    setApiKey(null);
    localStorage.removeItem('dnd_narrator_api_key');
  };

  // --- Gestion de l'App ---
  const [combatState, setCombatState] = useState<CombatState>({
    mode: NarratorMode.COMBAT,
    style: NarrationStyle.IMMERSIVE,
    weapon: WeaponType.LONGSWORD,
    bodyPart: BodyPart.UNSPECIFIED,
    result: DiceResult.HIT,
    lootType: LootType.USEFUL,
    target: '',
  });

  const [narration, setNarration] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!apiKey) return;

    setIsLoading(true);
    setError(null);
    setNarration(null);

    try {
      // On passe la clé stockée dans le state au service
      const resultText = await generateNarration(combatState, apiKey);
      setNarration(resultText);
    } catch (err: any) {
      console.error("Erreur API catchée:", err);
      
      const errorMsg = err?.message || JSON.stringify(err) || "";

      if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('quota')) {
         setError("Le puis de magie est tari (Quota API atteint). Veuillez patienter quelques instants avant de relancer.");
      } else if (errorMsg.includes('API key') || errorMsg.includes('403')) {
         setError("Votre Clé Runique semble invalide ou a expiré. Veuillez vous reconnecter.");
      } else {
         setError("Les esprits du chaos interfèrent... Impossible de générer la narration.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Si pas de clé, on affiche le portail
  if (!apiKey) {
    return <ApiKeyGate onKeySubmit={handleKeySubmit} />;
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center py-8 px-4 md:px-8 relative">
      
      {/* Demo Mode Banner */}
      {apiKey === "DEMO" && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-900/95 text-gold-antique text-xs md:text-sm py-2 px-4 text-center z-50 flex items-center justify-center gap-2 border-b border-gold-dark shadow-lg backdrop-blur-sm">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span><strong className="text-white">MODE DÉMO :</strong> Aucune IA n'est utilisée. Les réponses sont simulées.</span>
            <button onClick={handleLogout} className="underline hover:text-white ml-4 font-bold">
                Mettre ma clé
            </button>
        </div>
      )}

      {/* Header / Title */}
      <header className={`mb-12 text-center relative w-full max-w-6xl flex flex-col items-center justify-center ${apiKey === "DEMO" ? 'mt-8' : 'mt-6'}`}>
        
        <div className="text-center relative">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-900/20 blur-[80px] rounded-full pointer-events-none"></div>
            <h1 className="relative font-header text-4xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-gold-antique to-gold-dark drop-shadow-sm uppercase tracking-widest mb-2">
            D&D Narrator
            </h1>
            
            <div className="flex flex-col items-center gap-2">
                <div className="flex items-center justify-center gap-2 text-blood-red/80 font-fantasy text-lg md:text-xl">
                    <Flame className="w-5 h-5 fill-current animate-pulse" />
                    <span>Forgé par Romain.DnD89</span>
                    <Flame className="w-5 h-5 fill-current animate-pulse" />
                </div>
                
                <a 
                    href="https://www.instagram.com/romain.dnd89/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-gold-dark/60 hover:text-gold-antique transition-colors group"
                >
                    <Instagram className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-body border-b border-transparent group-hover:border-gold-antique/30">@romain.dnd89</span>
                </a>
            </div>
        </div>
        
        {/* Logout Button */}
        <button 
            onClick={handleLogout}
            className="absolute right-0 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2 text-xs text-gray-500 hover:text-red-400 transition-colors border border-gray-800 hover:border-red-900 rounded px-3 py-1"
            title="Changer de clé API"
        >
            <LogOut className="w-3 h-3" /> Déconnexion
        </button>

      </header>

      {/* Main Content Grid */}
      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-12">
        
        {/* Left Column: Controls */}
        <section className="w-full animate-slide-in-left">
          <NarratorForm 
            combatState={combatState}
            onChange={setCombatState}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </section>

        {/* Right Column: Output */}
        <section className="w-full h-full min-h-[400px] lg:min-h-[600px] animate-slide-in-right">
          <StoryBox narration={narration} error={error} />
        </section>

      </main>

      {/* Mobile Logout (visible only on small screens) */}
      <div className="md:hidden w-full flex justify-center mb-8">
        <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-400 transition-colors border border-gray-800 bg-black/50 px-4 py-2 rounded"
        >
            <LogOut className="w-4 h-4" /> Changer de Clé API
        </button>
      </div>

      {/* Footer */}
      <footer className="mt-auto text-center text-gray-600 text-sm font-body pb-8 border-t border-gray-900/50 pt-8 w-full max-w-4xl">
        <p>Utilisez cette narration pour enrichir vos sessions de jeu de rôle.</p>
        <p className="mt-1 text-xs opacity-50">© {new Date().getFullYear()} Maître du Donjon Virtuel</p>
      </footer>

      {/* Animations CSS injection */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        .animate-slide-in-left {
          animation: fade-in 0.5s ease-out forwards;
        }
        .animate-slide-in-right {
          animation: fade-in 0.5s ease-out 0.2s forwards;
          opacity: 0; /* Initial state before animation starts */
        }
      `}</style>
    </div>
  );
};

export default App;