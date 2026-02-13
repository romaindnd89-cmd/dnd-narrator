
import React, { useState } from 'react';
import { Volume2, CloudRain, CloudLightning, TreePine, Ghost, Skull, Zap, Snowflake, Cog, X, Bug, Wind, Castle, Sword, AlertTriangle, Loader2 } from 'lucide-react';
import * as soundService from '../services/soundService';

interface SoundBoxProps {
  onClose: () => void;
}

const SoundBox: React.FC<SoundBoxProps> = ({ onClose }) => {
  const [activeCategory, setActiveCategory] = useState<'ambience' | 'bestiary' | 'traps'>('ambience');
  const [loadingSound, setLoadingSound] = useState<string | null>(null);

  const categories = [
    { id: 'ambience', label: 'Ambiances', icon: Wind },
    { id: 'bestiary', label: 'Bestiaire', icon: Bug },
    { id: 'traps', label: 'Pièges', icon: AlertTriangle },
  ];

  const handlePlay = async (soundLabel: string, playFn: () => void) => {
    setLoadingSound(soundLabel);
    try {
        await playFn();
    } finally {
        // On laisse un petit délai pour l'effet visuel
        setTimeout(() => setLoadingSound(null), 800);
    }
  };

  const renderCategory = () => {
    switch (activeCategory) {
      case 'ambience':
        return (
          <div className="grid grid-cols-2 gap-3 animate-fade-in">
            <SoundButton 
                icon={CloudRain} 
                label="Pluie" 
                loading={loadingSound === "Pluie"}
                onClick={() => handlePlay("Pluie", () => soundService.playRainAmbience(12))} 
            />
            <SoundButton 
                icon={CloudLightning} 
                label="Orage" 
                loading={loadingSound === "Orage"}
                onClick={() => handlePlay("Orage", () => soundService.playThunder())} 
            />
            <SoundButton 
                icon={TreePine} 
                label="Forêt Lugubre" 
                loading={loadingSound === "Forêt Lugubre"}
                onClick={() => handlePlay("Forêt Lugubre", () => soundService.playDarkForest(10))} 
            />
            <SoundButton 
                icon={Castle} 
                label="Donjon écho" 
                loading={loadingSound === "Donjon écho"}
                onClick={() => handlePlay("Donjon écho", () => soundService.playDungeonAmbience(10))} 
            />
            <SoundButton 
                icon={Ghost} 
                label="Murmures" 
                loading={loadingSound === "Murmures"}
                onClick={() => handlePlay("Murmures", () => soundService.playGhostlyWail())} 
            />
            <SoundButton 
                icon={Wind} 
                label="Vent hurlant" 
                loading={loadingSound === "Vent hurlant"}
                onClick={() => handlePlay("Vent hurlant", () => soundService.playDarkForest(8))} 
            />
          </div>
        );
      case 'bestiary':
        return (
          <div className="grid grid-cols-2 gap-3 animate-fade-in">
            <SoundButton 
                icon={Skull} 
                label="Rugissement" 
                loading={loadingSound === "Rugissement"}
                onClick={() => handlePlay("Rugissement", () => soundService.playMonsterEnraged())} 
                color="text-red-500" 
            />
            <SoundButton 
                icon={Sword} 
                label="Coup Sanglant" 
                loading={loadingSound === "Coup Sanglant"}
                onClick={() => handlePlay("Coup Sanglant", () => soundService.playMonsterHit())} 
                color="text-orange-500" 
            />
            <SoundButton 
                icon={Bug} 
                label="Cri de Bête" 
                loading={loadingSound === "Cri de Bête"}
                onClick={() => handlePlay("Cri de Bête", () => soundService.playMonsterEnraged())} 
                color="text-green-600" 
            />
            <SoundButton 
                icon={Ghost} 
                label="Spectre" 
                loading={loadingSound === "Spectre"}
                onClick={() => handlePlay("Spectre", () => soundService.playGhostlyWail())} 
                color="text-indigo-400" 
            />
          </div>
        );
      case 'traps':
        return (
          <div className="grid grid-cols-2 gap-3 animate-fade-in">
            <SoundButton 
                icon={Zap} 
                label="Arc Électrique" 
                loading={loadingSound === "Arc Électrique"}
                onClick={() => handlePlay("Arc Électrique", () => soundService.playElectricArc())} 
                color="text-yellow-400" 
            />
            <SoundButton 
                icon={Snowflake} 
                label="Glace/Givre" 
                loading={loadingSound === "Glace/Givre"}
                onClick={() => handlePlay("Glace/Givre", () => soundService.playIceTrap())} 
                color="text-blue-300" 
            />
            <SoundButton 
                icon={Cog} 
                label="Mécanisme" 
                loading={loadingSound === "Mécanisme"}
                onClick={() => handlePlay("Mécanisme", () => soundService.playMechanicalTrap())} 
                color="text-gray-400" 
            />
            <SoundButton 
                icon={CloudLightning} 
                label="Éboulement" 
                loading={loadingSound === "Éboulement"}
                onClick={() => handlePlay("Éboulement", () => soundService.playMechanicalTrap())} 
                color="text-orange-600" 
            />
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-darker-metal border-2 border-gold-dark/30 rounded-lg relative overflow-hidden shadow-2xl animate-fade-in">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gold-dark/30 bg-black/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Volume2 className="w-4 h-4 text-gold-antique" />
          <h3 className="font-header text-xs text-gold-antique uppercase tracking-widest">Sound Box MJ</h3>
        </div>
        <button onClick={onClose} className="p-2 text-gray-500 hover:text-white lg:hidden">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gold-dark/10 bg-black/20">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as any)}
            className={`flex-1 py-3 flex flex-col items-center gap-1 transition-all ${activeCategory === cat.id ? 'bg-gold-dark/10 text-gold-antique' : 'text-gray-600 hover:text-gray-400'}`}
          >
            <cat.icon className="w-4 h-4" />
            <span className="text-[7px] uppercase font-bold tracking-widest">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
        {renderCategory()}
        <div className="mt-6 p-4 bg-black/40 border border-white/5 rounded-lg">
            <p className="text-[9px] text-gray-500 italic text-center leading-relaxed">
                Utilisation d'échantillons atmosphériques réels. Prévoyez un court délai au premier déclenchement pour la mise en cache.
            </p>
        </div>
      </div>
    </div>
  );
};

const SoundButton = ({ icon: Icon, label, onClick, color = "text-gold-antique", loading = false }: { icon: any, label: string, onClick: () => void, color?: string, loading?: boolean }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className="flex flex-col items-center justify-center p-4 bg-black/40 border border-gold-dark/20 rounded-xl hover:bg-gold-dark/10 hover:border-gold-dark/40 transition-all active:scale-95 group relative overflow-hidden"
  >
    {loading ? (
        <Loader2 className="w-6 h-6 mb-2 animate-spin text-gold-antique" />
    ) : (
        <Icon className={`w-6 h-6 mb-2 group-hover:scale-110 transition-transform ${color}`} />
    )}
    <span className="text-[9px] font-header uppercase tracking-wider text-parchment/70 group-hover:text-white">{label}</span>
    {loading && <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gold-dark animate-pulse"></div>}
  </button>
);

export default SoundBox;
