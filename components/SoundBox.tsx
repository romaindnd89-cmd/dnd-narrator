
import React, { useState } from 'react';
import { 
    CloudRain, CloudLightning, TreePine, Mountain, Home, Flame, Wind, 
    Sword, Skull, Target, Zap, Snowflake, Heart, X, Volume2, Music2,
    Ghost, Footprints, DoorOpen, Lock, Archive, Coins, Key, Moon
} from 'lucide-react';
import * as soundService from '../services/soundService';

interface SoundBoxProps {
  onClose: () => void;
}

type Category = 'atmosphere' | 'combat' | 'magic' | 'monsters' | 'interactive';

const SoundBox: React.FC<SoundBoxProps> = ({ onClose }) => {
  const [activeCategory, setActiveCategory] = useState<Category>('atmosphere');
  const [activeAmbience, setActiveAmbience] = useState<string | null>(null);

  const categories = [
    { id: 'atmosphere', label: 'Météo/Lieux', icon: Wind },
    { id: 'combat', label: 'Armes', icon: Sword },
    { id: 'magic', label: 'Sorts', icon: Zap },
    { id: 'monsters', label: 'Bestiaire', icon: Skull },
    { id: 'interactive', label: 'Objets', icon: Key },
  ];

  const handleAmbience = (name: string, playFn: () => void) => {
    if (activeAmbience === name) {
        soundService.stopAmbience();
        setActiveAmbience(null);
    } else {
        playFn();
        setActiveAmbience(name);
    }
  };

  const handleEffect = (playFn: () => void) => {
    playFn();
  };

  return (
    <div className="h-full flex flex-col bg-darker-metal border-2 border-gold-dark/30 rounded-lg relative overflow-hidden shadow-2xl animate-fade-in">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gold-dark/30 bg-black/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Music2 className="w-4 h-4 text-gold-antique" />
          <h3 className="font-header text-xs text-gold-antique uppercase tracking-widest">Table Sonore</h3>
        </div>
        
        {activeAmbience && (
            <div className="flex items-center gap-2 px-3 py-1 bg-gold-dark/10 border border-gold-dark/30 rounded-full animate-pulse">
                <Volume2 className="w-3 h-3 text-gold-antique" />
                <span className="text-[9px] uppercase font-bold text-gold-antique">{activeAmbience}</span>
            </div>
        )}

        <button onClick={onClose} className="p-1 text-gray-500 hover:text-white lg:hidden">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gold-dark/10 bg-black/20 overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as Category)}
            className={`flex-1 min-w-[60px] py-3 flex flex-col items-center gap-1 transition-all ${activeCategory === cat.id ? 'bg-gold-dark/10 text-gold-antique border-b-2 border-gold-antique' : 'text-gray-600 hover:text-gray-400 border-b-2 border-transparent'}`}
          >
            <cat.icon className="w-4 h-4" />
            <span className="text-[7px] uppercase font-bold tracking-widest">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3 no-scrollbar bg-black/20">
        
        {activeCategory === 'atmosphere' && (
            <div className="grid grid-cols-3 gap-2 animate-fade-in">
                <SoundButton 
                    icon={CloudRain} label="Pluie" isActive={activeAmbience === 'Pluie'}
                    onClick={() => handleAmbience('Pluie', soundService.playRain)} 
                />
                <SoundButton 
                    icon={TreePine} label="Forêt" isActive={activeAmbience === 'Forêt'}
                    onClick={() => handleAmbience('Forêt', soundService.playForest)} 
                />
                <SoundButton 
                    icon={Mountain} label="Grotte" isActive={activeAmbience === 'Grotte'}
                    onClick={() => handleAmbience('Grotte', soundService.playCave)} 
                />
                <SoundButton 
                    icon={Home} label="Taverne" isActive={activeAmbience === 'Taverne'}
                    onClick={() => handleAmbience('Taverne', soundService.playTavern)} 
                />
                <SoundButton 
                    icon={Flame} label="Feu Camp" isActive={activeAmbience === 'Feu Camp'}
                    onClick={() => handleAmbience('Feu Camp', soundService.playCampfire)} 
                />
                 <SoundButton 
                    icon={Wind} label="Vent" isActive={activeAmbience === 'Vent'}
                    onClick={() => handleAmbience('Vent', soundService.playWind)} 
                />
                <SoundButton 
                    icon={Moon} label="Dark Ambiance" isActive={activeAmbience === 'Dark Ambiance'}
                    onClick={() => handleAmbience('Dark Ambiance', soundService.playDarkAmbience)} 
                    color="text-indigo-400"
                />
                <div className="col-span-3 h-px bg-white/5 my-2"></div>
                <SoundButton icon={CloudLightning} label="Tonnerre" onClick={() => handleEffect(soundService.playThunder)} isEffect />
            </div>
        )}

        {activeCategory === 'combat' && (
            <div className="grid grid-cols-3 gap-2 animate-fade-in">
                <SoundButton icon={Sword} label="Impact Épée" onClick={() => handleEffect(soundService.playSwordHit)} isEffect color="text-orange-400" />
                <SoundButton icon={Sword} label="Swing Épée" onClick={() => handleEffect(soundService.playSwordSwing)} isEffect color="text-gray-400" />
                <SoundButton icon={Target} label="Arc" onClick={() => handleEffect(soundService.playBowShot)} isEffect color="text-yellow-600" />
                <SoundButton icon={Sword} label="Dague" onClick={() => handleEffect(soundService.playDagger)} isEffect color="text-gray-300" />
                <SoundButton icon={Skull} label="Coup Poing" onClick={() => handleEffect(soundService.playPunch)} isEffect color="text-red-800" />
            </div>
        )}

        {activeCategory === 'magic' && (
            <div className="grid grid-cols-3 gap-2 animate-fade-in">
                <SoundButton icon={Flame} label="Boule Feu" onClick={() => handleEffect(soundService.playFireball)} isEffect color="text-red-500" />
                <SoundButton icon={Snowflake} label="Glace" onClick={() => handleEffect(soundService.playIce)} isEffect color="text-blue-400" />
                <SoundButton icon={Zap} label="Éclair" onClick={() => handleEffect(soundService.playLightning)} isEffect color="text-yellow-400" />
                <SoundButton icon={Heart} label="Soin" onClick={() => handleEffect(soundService.playHeal)} isEffect color="text-green-400" />
                <SoundButton icon={Ghost} label="Malédiction" onClick={() => handleEffect(soundService.playCurse)} isEffect color="text-purple-500" />
                <SoundButton icon={Wind} label="Téléport" onClick={() => handleEffect(soundService.playTeleport)} isEffect color="text-cyan-400" />
            </div>
        )}

        {activeCategory === 'monsters' && (
            <div className="grid grid-cols-3 gap-2 animate-fade-in">
                <SoundButton icon={Skull} label="Dragon" onClick={() => handleEffect(soundService.playRoar)} isEffect color="text-red-600" />
                <SoundButton icon={Ghost} label="Spectre" onClick={() => handleEffect(soundService.playGhost)} isEffect color="text-indigo-400" />
                <SoundButton icon={Skull} label="Zombie" onClick={() => handleEffect(soundService.playZombie)} isEffect color="text-green-800" />
                <SoundButton icon={Footprints} label="Pas Géant" onClick={() => handleEffect(soundService.playSteps)} isEffect color="text-gray-500" />
            </div>
        )}
        
        {activeCategory === 'interactive' && (
            <div className="grid grid-cols-3 gap-2 animate-fade-in">
                 <SoundButton icon={Lock} label="Piège" onClick={() => handleEffect(soundService.playTrap)} isEffect color="text-orange-600" />
                 <SoundButton icon={Key} label="Crochetage" onClick={() => handleEffect(soundService.playLockpick)} isEffect color="text-gray-400" />
                 <SoundButton icon={DoorOpen} label="Porte" onClick={() => handleEffect(soundService.playDoor)} isEffect color="text-amber-700" />
                 <SoundButton icon={Archive} label="Coffre" onClick={() => handleEffect(soundService.playChest)} isEffect color="text-amber-500" />
                 <SoundButton icon={Coins} label="Pièce Or" onClick={() => handleEffect(soundService.playCoin)} isEffect color="text-yellow-500" />
            </div>
        )}

      </div>
      
      {/* Footer Stop Button */}
      {activeAmbience && (
         <button 
            onClick={() => handleAmbience(activeAmbience, () => {})}
            className="w-full py-3 bg-red-900/20 hover:bg-red-900/40 text-red-400 border-t border-red-900/30 text-[9px] uppercase font-bold tracking-widest transition-colors flex items-center justify-center gap-2"
         >
            <Volume2 className="w-3 h-3" /> Arrêter l'ambiance
         </button>
      )}
    </div>
  );
};

const SoundButton = ({ icon: Icon, label, onClick, color = "text-gold-antique", isActive = false, isEffect = false }: { icon: any, label: string, onClick: () => void, color?: string, isActive?: boolean, isEffect?: boolean }) => (
  <button
    onClick={onClick}
    className={`
        flex flex-col items-center justify-center p-3 rounded-lg border transition-all active:scale-95 group relative overflow-hidden h-[80px]
        ${isActive 
            ? 'bg-gold-dark/20 border-gold-antique shadow-[inset_0_0_15px_rgba(197,160,89,0.2)]' 
            : 'bg-black/40 border-gold-dark/10 hover:bg-gold-dark/5 hover:border-gold-dark/30'
        }
    `}
  >
    <Icon className={`w-5 h-5 mb-2 transition-transform group-hover:scale-110 ${isActive ? 'text-white animate-pulse' : color}`} />
    <span className={`text-[8px] font-header uppercase tracking-wider text-center leading-none ${isActive ? 'text-white font-bold' : 'text-parchment/60 group-hover:text-parchment'}`}>
        {label}
    </span>
    {isActive && <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gold-antique animate-pulse"></div>}
    {isEffect && <div className="absolute inset-0 bg-white/5 opacity-0 active:opacity-100 transition-opacity"></div>}
  </button>
);

export default SoundBox;
