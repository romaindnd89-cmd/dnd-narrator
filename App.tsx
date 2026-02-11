import React, { useState, useEffect } from 'react';
import NarratorForm from './components/NarratorForm';
import StoryBox from './components/StoryBox';
import ApiKeyGate from './components/ApiKeyGate';
import { CombatState, DiceResult, WeaponType, BodyPart, NarrationStyle, NarratorMode, LootType } from './types';
import { generateNarration } from './services/geminiService';
import { playCombatSound } from './services/soundService';
import { Flame, AlertTriangle, LogOut, Instagram } from 'lucide-react';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  
  useEffect(() => {
    const storedKey = localStorage.getItem('dnd_narrator_api_key');
    if (storedKey) setApiKey(storedKey);
  }, []);

  const handleKeySubmit = (key: string) => {
    setApiKey(key);
    if (key !== "DEMO") localStorage.setItem('dnd_narrator_api_key', key);
  };

  const handleLogout = () => {
    setApiKey(null);
    localStorage.removeItem('dnd_narrator_api_key');
  };

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

    // Déclenchement du son
    if (combatState.mode === NarratorMode.COMBAT) {
      playCombatSound(combatState.weapon, combatState.result);
    }

    try {
      const resultText = await generateNarration(combatState, apiKey);
      setNarration(resultText);
    } catch (err: any) {
      const errorMsg = err?.message || "Erreur inconnue";
      if (errorMsg.includes('quota')) setError("Quota API atteint. Patientez un peu.");
      else setError("Les esprits du chaos interfèrent... Impossible de générer.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!apiKey) return <ApiKeyGate onKeySubmit={handleKeySubmit} />;

  return (
    <div className="min-h-screen w-full flex flex-col items-center py-8 px-4 md:px-8 relative">
      {apiKey === "DEMO" && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-900/95 text-gold-antique text-sm py-2 px-4 text-center z-50 flex items-center justify-center gap-2 border-b border-gold-dark shadow-lg">
            <AlertTriangle className="w-4 h-4" />
            <span><strong>MODE DÉMO</strong> (IA simulée). <button onClick={handleLogout} className="underline ml-2">Mettre ma clé</button></span>
        </div>
      )}

      <header className="mb-12 text-center relative w-full max-w-6xl mt-8">
        <h1 className="font-header text-4xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-gold-antique to-gold-dark uppercase tracking-widest mb-2">
          D&D Narrator
        </h1>
        <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-blood-red/80 font-fantasy text-lg">
                <Flame className="w-5 h-5 animate-pulse" />
                <span>Forgé par Romain.DnD89</span>
                <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <a href="https://www.instagram.com/romain.dnd89/" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-gold-dark/60 hover:text-gold-antique">
                <Instagram className="w-4 h-4" />
                <span className="text-sm font-body">@romain.dnd89</span>
            </a>
        </div>
        <button onClick={handleLogout} className="absolute right-0 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2 text-xs text-gray-500 hover:text-red-400 px-3 py-1 border border-gray-800 rounded">
            <LogOut className="w-3 h-3" /> Déconnexion
        </button>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <NarratorForm combatState={combatState} onChange={setCombatState} onSubmit={handleSubmit} isLoading={isLoading} />
        <StoryBox narration={narration} error={error} />
      </main>

      <footer className="mt-auto text-center text-gray-600 text-sm font-body pb-8 border-t border-gray-900/50 pt-8 w-full">
        <p>© {new Date().getFullYear()} Romain.DnD89 - Maître du Donjon Virtuel</p>
      </footer>
    </div>
  );
};

export default App;