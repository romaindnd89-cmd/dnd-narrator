
import React, { useState, useEffect } from 'react';
import NarratorForm from './components/NarratorForm';
import StoryBox from './components/StoryBox';
import ApiKeyGate from './components/ApiKeyGate';
import { CombatState, DiceResult, WeaponType, BodyPart, NarrationStyle, NarratorMode, LootType, EnvironmentType, WorldAtmosphere, InteractiveObjectType, InteractionAction } from './types';
import { generateNarration } from './services/geminiService';
import { playCombatSound, playDiceSound } from './services/soundService';
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
    environmentType: EnvironmentType.FOREST,
    atmosphere: WorldAtmosphere.DARK_FANTASY,
    interactiveObj: InteractiveObjectType.CHEST,
    interactionAction: InteractionAction.OPEN,
    target: '',
  });

  const [narration, setNarration] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleDiceRoll = (sides: number) => {
    setError(null);
    playDiceSound();
    const roll = Math.floor(Math.random() * sides) + 1;
    
    const diceOutput = `**Nom** : Lancer de d${sides}\n**Description** : Vous lancez un polyèdre à ${sides} faces. Il rebondit sur la table avant de s'immobiliser.\n**Effet** : Résultat du jet : ${roll}`;
    setNarration(diceOutput);
  };

  const handleSubmit = async () => {
    if (!apiKey) return;
    setIsLoading(true);
    setError(null);
    setNarration(null);

    if (combatState.mode === NarratorMode.COMBAT) {
      playCombatSound(combatState.weapon, combatState.result);
    }

    try {
      const resultData = await generateNarration(combatState, apiKey);
      setNarration(resultData);
    } catch (err: any) {
      console.error(err);
      const msg = err.message?.toLowerCase() || "";
      if (msg.includes('429') || msg.includes('quota')) {
        setError("Limite Google atteinte. Attends 60 secondes ou vérifie ton quota journalier sur AI Studio.");
      } else if (msg.includes('403') || msg.includes('key not valid')) {
        setError("Clé API invalide. Assure-toi d'avoir activé le modèle Gemini 1.5/2.0/3.0 sur ton projet.");
      } else {
        setError("Une perturbation dans le Warp empêche la narration... Réessaie.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!apiKey) return <ApiKeyGate onKeySubmit={handleKeySubmit} />;

  return (
    <div className="min-h-screen w-full flex flex-col items-center py-8 px-4 md:px-8 relative bg-black selection:bg-blood-red selection:text-white">
      {apiKey === "DEMO" && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-900/95 text-gold-antique text-sm py-2 px-4 text-center z-50 flex items-center justify-center gap-2 border-b border-gold-dark shadow-lg backdrop-blur-md">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span><strong>MODE DÉMO</strong> (IA simulée). <button onClick={handleLogout} className="underline ml-2 hover:text-white transition-colors">Mettre ma clé</button></span>
        </div>
      )}

      <header className="mb-12 text-center relative w-full max-w-6xl mt-8 animate-fade-in">
        <h1 className="font-header text-5xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-b from-gold-antique via-gold-dark to-gold-dark uppercase tracking-[0.2em] mb-4 drop-shadow-lg">
          D&D Narrator
        </h1>
        <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3 text-blood-red font-fantasy text-xl tracking-wide">
                <Flame className="w-5 h-5 animate-pulse fill-blood-red/20" />
                <span className="drop-shadow-[0_0_8px_rgba(138,3,3,0.4)]">Forgé par Romain.DnD89</span>
                <Flame className="w-5 h-5 animate-pulse fill-blood-red/20" />
            </div>
            <a 
              href="https://www.instagram.com/romain.dnd89/" 
              target="_blank" 
              rel="noreferrer" 
              className="group flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold-dark/20 bg-gold-dark/5 hover:bg-gold-dark/20 transition-all duration-300"
            >
                <Instagram className="w-4 h-4 text-gold-antique group-hover:scale-110 transition-transform" />
                <span className="text-sm font-body text-gold-antique/80 group-hover:text-gold-antique transition-colors">@romain.dnd89</span>
            </a>
        </div>
        <button 
          onClick={handleLogout} 
          className="absolute right-0 top-0 hidden lg:flex items-center gap-2 text-xs text-gray-600 hover:text-red-500 px-3 py-1.5 border border-gray-800 rounded-md transition-all hover:border-red-900/50 bg-black/40"
        >
            <LogOut className="w-3 h-3" /> Quitter
        </button>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 items-stretch">
        <div className="flex flex-col">
          <NarratorForm 
            combatState={combatState} 
            onChange={setCombatState} 
            onSubmit={handleSubmit} 
            onDiceRoll={handleDiceRoll}
            isLoading={isLoading} 
          />
        </div>
        <div className="flex flex-col">
          <StoryBox narration={narration} error={error} apiKey={apiKey} />
        </div>
      </main>

      <footer className="mt-auto text-center text-gray-600 text-sm font-body pb-10 border-t border-gold-dark/10 pt-10 w-full max-w-4xl">
        <p className="tracking-wide">© {new Date().getFullYear()} <span className="text-gold-dark">Romain.DnD89</span> — Maître du Donjon Virtuel</p>
      </footer>
    </div>
  );
};

export default App;
