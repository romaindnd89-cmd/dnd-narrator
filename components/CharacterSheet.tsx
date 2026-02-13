
import React, { useState } from 'react';
import { CharacterProfile } from '../types';
import { Shield, Heart, Zap, Image as ImageIcon, Printer, Skull, Sparkles, Coins, Scroll } from 'lucide-react';
import { generateCharacterImage } from '../services/geminiService';

interface CharacterSheetProps {
  profile: CharacterProfile;
}

const CharacterSheet: React.FC<CharacterSheetProps> = ({ profile }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);

  const handleGenerateImage = async () => {
    setLoadingImage(true);
    try {
        const url = await generateCharacterImage(profile.visualPrompt);
        setImageUrl(url);
    } catch (e) {
        console.error(e);
        alert("Impossible de générer l'image. Vérifiez votre connexion.");
    } finally {
        setLoadingImage(false);
    }
  };

  // Composant Score de Caractéristique redesigné pour être plus robuste
  const AbilityScore = ({ label, score, mod }: { label: string, score: number, mod: string }) => (
    <div className="flex flex-col items-center bg-white border-2 border-gray-800 rounded-xl p-2 w-full max-w-[90px] shadow-sm relative overflow-visible">
        <span className="text-[9px] font-bold uppercase text-gray-500 mb-0.5 tracking-tighter">{label}</span>
        <span className="text-3xl font-header font-bold text-black leading-none">{mod}</span>
        <div className="w-10 h-7 mt-1 border border-gray-400 rounded-full flex items-center justify-center bg-gray-50 shadow-inner z-10 absolute -bottom-3.5">
             <span className="text-sm font-bold text-gray-700">{score}</span>
        </div>
        <div className="h-2 w-full"></div> {/* Spacer for the absolute bubble */}
    </div>
  );

  const SkillRow = ({ name, mod, proficient, stat }: { name: string, mod: string, proficient: boolean, stat: string }) => (
    <div className="flex items-center gap-2 text-[10px] md:text-xs mb-1 border-b border-gray-100 pb-0.5 last:border-0">
        <div className={`w-3 h-3 rounded-full border border-gray-800 flex-shrink-0 ${proficient ? 'bg-black' : ''}`}></div>
        <span className="text-gray-500 w-6 text-center font-mono">{mod}</span>
        <span className="font-bold text-gray-800 flex-1 truncate">{name} <span className="text-gray-400 font-normal">({stat})</span></span>
    </div>
  );

  const SaveRow = ({ name, mod, proficient }: { name: string, mod: string, proficient: boolean }) => (
    <div className="flex items-center gap-2 text-[10px] md:text-xs mb-1">
        <div className={`w-3 h-3 rounded-full border border-gray-800 flex-shrink-0 ${proficient ? 'bg-black' : ''}`}></div>
        <span className="text-gray-500 w-6 text-center font-mono">{mod}</span>
        <span className="font-bold text-gray-800">{name}</span>
    </div>
  );

  // Fix: children set as optional to avoid "Property 'children' is missing" errors in TS environments where the JSX parser is strict
  const BoxTitle = ({ children }: { children?: React.ReactNode }) => (
      <h3 className="text-[10px] font-bold uppercase text-center bg-gray-200 border-t border-b border-gray-300 py-0.5 tracking-wider text-gray-600 mb-2 mt-auto">
          {children}
      </h3>
  );

  return (
    <div className="bg-white text-black p-4 md:p-8 rounded-none shadow-2xl w-full max-w-[1000px] mx-auto font-serif relative overflow-hidden print:shadow-none print:w-full print:max-w-none print:p-0">
      
      {/* Background Texture */}
      <div className="absolute inset-0 bg-[#fdfbf7] pointer-events-none opacity-50 print:hidden"></div>

      {/* --- HEADER --- */}
      <div className="relative z-10 flex flex-col md:flex-row gap-6 mb-6 border-b-2 border-gray-800 pb-6">
         {/* Name Section */}
         <div className="w-full md:w-1/3 bg-gray-100 border border-gray-300 rounded p-4 flex flex-col justify-end">
             <input 
                type="text" 
                defaultValue={profile.name} 
                className="text-2xl md:text-3xl font-header font-bold uppercase bg-transparent border-b border-gray-400 w-full outline-none focus:border-blood-red placeholder-gray-400"
                placeholder="Nom du Personnage"
             />
             <span className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">Nom du Personnage</span>
         </div>

         {/* Meta Data Grid */}
         <div className="w-full md:w-2/3 grid grid-cols-3 gap-2 text-[10px] md:text-xs">
             <div className="bg-white border-b border-gray-300 p-2">
                 <span className="block font-bold truncate">{profile.class} {profile.subclass} (Nv {profile.level})</span>
                 <span className="text-gray-500 uppercase text-[9px]">Classe & Niveau</span>
             </div>
             <div className="bg-white border-b border-gray-300 p-2">
                 <span className="block font-bold truncate">{profile.background}</span>
                 <span className="text-gray-500 uppercase text-[9px]">Historique</span>
             </div>
             <div className="bg-white border-b border-gray-300 p-2">
                 <span className="block font-bold truncate">{profile.playerName || "Joueur"}</span>
                 <span className="text-gray-500 uppercase text-[9px]">Nom du Joueur</span>
             </div>
             <div className="bg-white border-b border-gray-300 p-2">
                 <span className="block font-bold truncate">{profile.race}</span>
                 <span className="text-gray-500 uppercase text-[9px]">Race</span>
             </div>
             <div className="bg-white border-b border-gray-300 p-2">
                 <span className="block font-bold truncate">{profile.alignment}</span>
                 <span className="text-gray-500 uppercase text-[9px]">Alignement</span>
             </div>
             <div className="bg-white border-b border-gray-300 p-2">
                 <span className="block font-bold truncate">{profile.xp} XP</span>
                 <span className="text-gray-500 uppercase text-[9px]">Points d'Expérience</span>
             </div>
         </div>
      </div>

      {/* --- MAIN GRID (3 COLUMNS) --- */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 lg:bg-transparent lg:border-none lg:p-0">
                  <div className="grid grid-cols-3 gap-4 lg:grid-cols-1 lg:gap-6 justify-items-center">
                    <AbilityScore label="Force" score={profile.stats.str} mod={profile.modifiers.str} />
                    <AbilityScore label="Dextérité" score={profile.stats.dex} mod={profile.modifiers.dex} />
                    <AbilityScore label="Constitution" score={profile.stats.con} mod={profile.modifiers.con} />
                    <AbilityScore label="Intelligence" score={profile.stats.int} mod={profile.modifiers.int} />
                    <AbilityScore label="Sagesse" score={profile.stats.wis} mod={profile.modifiers.wis} />
                    <AbilityScore label="Charisme" score={profile.stats.cha} mod={profile.modifiers.cha} />
                  </div>
              </div>
          </div>

          <div className="lg:col-span-3 flex flex-col gap-4">
              <div className="flex gap-2">
                  <div className="flex-1 border-2 border-gray-800 rounded p-1 flex items-center justify-between px-2">
                      <div className="w-3 h-3 rounded-full border border-gray-800"></div>
                      <span className="text-[9px] font-bold uppercase">Insp.</span>
                  </div>
                  <div className="flex-1 border-2 border-gray-800 rounded p-1 flex items-center gap-2 px-2 justify-center">
                      <span className="font-header text-md font-bold">{profile.proficiencyBonus}</span>
                      <span className="text-[8px] font-bold uppercase leading-tight">Maîtrise</span>
                  </div>
              </div>

              <div className="border border-gray-400 rounded p-2 bg-white flex flex-col">
                  <div className="space-y-1 mb-2">
                      {profile.savingThrows.map((save, i) => <SaveRow key={i} {...save} />)}
                  </div>
                  <BoxTitle>Jets de Sauvegarde</BoxTitle>
              </div>

              <div className="border border-gray-400 rounded p-2 bg-white flex-1 flex flex-col">
                  <div className="space-y-1 mb-2">
                      {profile.skills.map((skill, i) => <SkillRow key={i} {...skill} />)}
                  </div>
                  <BoxTitle>Compétences</BoxTitle>
              </div>

              <div className="border-2 border-gray-300 rounded-full py-1 px-3 flex items-center gap-2 bg-white">
                  <span className="font-header text-lg font-bold">{profile.passivePerception}</span>
                  <span className="text-[9px] font-bold uppercase text-gray-500 leading-tight">Perception Passive (Sagesse)</span>
              </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-2 bg-gray-100 p-2 rounded-lg border border-gray-300">
                  <div className="flex flex-col items-center">
                      <div className="relative flex items-center justify-center w-14 h-14">
                          <Shield className="w-14 h-14 text-gray-200 absolute" strokeWidth={1} />
                          <span className="relative z-10 font-header text-xl font-bold">{profile.ac}</span>
                      </div>
                      <span className="text-[8px] font-bold uppercase mt-1">CA</span>
                  </div>
                  <div className="flex flex-col items-center border-2 border-gray-400 rounded-lg justify-center bg-white aspect-square">
                       <span className="font-header text-xl font-bold">{profile.initiative}</span>
                       <span className="text-[8px] font-bold uppercase">Init</span>
                  </div>
                  <div className="flex flex-col items-center border-2 border-gray-400 rounded-lg justify-center bg-white aspect-square">
                       <span className="font-header text-xl font-bold">{profile.speed}</span>
                       <span className="text-[8px] font-bold uppercase">Vitesse</span>
                  </div>
              </div>

              <div className="border-2 border-gray-400 rounded-lg p-2 bg-white">
                  <div className="flex justify-between items-center text-[9px] text-gray-500 mb-1 px-1">
                      <span>PV Max: {profile.hpMax}</span>
                  </div>
                  <div className="h-16 flex items-center justify-center">
                      <Heart className="w-6 h-6 text-gray-200 mr-2" />
                      <span className="text-3xl font-header font-bold text-gray-800">{profile.hpCurrent}</span>
                  </div>
                  <BoxTitle>Points de Vie Actuels</BoxTitle>
              </div>

               <div className="border-2 border-gray-400 rounded-lg p-2 bg-white min-h-[50px] flex flex-col justify-end">
                   <BoxTitle>Points de Vie Temporaires</BoxTitle>
               </div>

              <div className="grid grid-cols-2 gap-3">
                  <div className="border border-gray-400 rounded p-1 bg-white flex flex-col justify-end min-h-[60px]">
                      <span className="text-[9px] text-gray-500 block mb-1 text-center">Total: {profile.level}</span>
                      <span className="block text-lg font-bold text-center mb-1">{profile.hitDice}</span>
                      <BoxTitle>Dés de Vie</BoxTitle>
                  </div>
                  <div className="border border-gray-400 rounded p-1 bg-white flex flex-col justify-end min-h-[60px]">
                      <div className="flex items-center justify-between text-[8px] mb-1 px-1">
                          <span className="font-bold">SUCCÈS</span>
                          <div className="flex gap-1"><div className="w-2 h-2 border rounded-full"></div><div className="w-2 h-2 border rounded-full"></div><div className="w-2 h-2 border rounded-full"></div></div>
                      </div>
                      <div className="flex items-center justify-between text-[8px] mb-1 px-1">
                          <span className="font-bold">ÉCHECS</span>
                          <div className="flex gap-1"><div className="w-2 h-2 border rounded-full"></div><div className="w-2 h-2 border rounded-full"></div><div className="w-2 h-2 border rounded-full"></div></div>
                      </div>
                      <BoxTitle>Contre la Mort</BoxTitle>
                  </div>
              </div>

              <div className="border border-gray-400 rounded p-2 bg-white flex-1 min-h-[200px] flex flex-col">
                   <div className="grid grid-cols-12 bg-gray-100 p-1 text-[8px] font-bold uppercase text-gray-600 mb-2 rounded">
                       <div className="col-span-5 pl-1">Nom</div>
                       <div className="col-span-3 text-center">Bonus</div>
                       <div className="col-span-4 text-center">Dégâts/Type</div>
                   </div>
                   <div className="flex-1 space-y-1">
                       {profile.attacks.map((atk, i) => (
                           <div key={i} className="grid grid-cols-12 items-center bg-gray-50 p-1 rounded border border-gray-100">
                               <div className="col-span-5 pl-1 font-bold text-[10px] truncate">{atk.name}</div>
                               <div className="col-span-3 text-center text-[10px] font-mono bg-white border rounded mx-1">{atk.bonus}</div>
                               <div className="col-span-4 text-center text-[9px] truncate">{atk.damage}</div>
                           </div>
                       ))}
                   </div>
                   <div className="mt-2 border-t pt-1">
                       <p className="text-[9px] text-gray-400 italic text-center">Actions: Attaque, Lancer un sort, Foncer...</p>
                   </div>
                   <BoxTitle>Attaques et Incantations</BoxTitle>
              </div>

              <div className="border border-gray-400 rounded p-2 bg-white flex flex-col">
                   <div className="flex gap-2 mb-2">
                       <div className="w-12 flex flex-col items-center justify-center border border-gray-200 rounded bg-gray-50 p-1 shrink-0">
                           <Coins className="w-3 h-3 text-yellow-600 mb-1" />
                           <span className="text-[8px] font-bold text-center leading-tight break-all">{profile.treasure}</span>
                       </div>
                       <div className="flex-1 text-[10px] space-y-1">
                           {profile.equipment.map((item, i) => (
                               <span key={i} className="inline-block bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 mr-1 mb-1">{item}</span>
                           ))}
                       </div>
                   </div>
                   <BoxTitle>Équipement</BoxTitle>
              </div>
          </div>

          <div className="lg:col-span-3 flex flex-col gap-4">
              <div className="bg-gray-100 p-2 rounded-t-lg border-2 border-gray-800 border-b-0 space-y-2">
                  <div className="bg-white p-2 border border-gray-300 rounded shadow-sm">
                      <p className="text-[10px] italic min-h-[30px] line-clamp-3 hover:line-clamp-none">{profile.personalityTraits}</p>
                      <BoxTitle>Traits de Personnalité</BoxTitle>
                  </div>
                  <div className="bg-white p-2 border border-gray-300 rounded shadow-sm">
                      <p className="text-[10px] italic min-h-[30px] line-clamp-3 hover:line-clamp-none">{profile.ideals}</p>
                      <BoxTitle>Idéaux</BoxTitle>
                  </div>
                  <div className="bg-white p-2 border border-gray-300 rounded shadow-sm">
                      <p className="text-[10px] italic min-h-[30px] line-clamp-3 hover:line-clamp-none">{profile.bonds}</p>
                      <BoxTitle>Liens</BoxTitle>
                  </div>
                  <div className="bg-white p-2 border border-gray-300 rounded shadow-sm">
                      <p className="text-[10px] italic min-h-[30px] line-clamp-3 hover:line-clamp-none">{profile.flaws}</p>
                      <BoxTitle>Défauts</BoxTitle>
                  </div>
              </div>

              <div className="border-2 border-gray-800 rounded-b-lg p-2 bg-white flex-1 min-h-[400px] flex flex-col">
                  <div className="space-y-3 h-full mb-2">
                      {profile.featuresAndTraits.map((feat, i) => (
                          <div key={i} className="border-b border-gray-100 pb-2 last:border-0">
                              <h4 className="font-bold text-xs text-blood-red flex items-center gap-1">
                                  <Zap className="w-3 h-3" /> {feat.name}
                              </h4>
                              <p className="text-[10px] text-gray-700 leading-relaxed mt-0.5 text-justify">
                                  {feat.description}
                              </p>
                          </div>
                      ))}
                  </div>
                  <BoxTitle>Capacités et Traits</BoxTitle>
              </div>

               <div className="border border-gray-400 rounded p-2 bg-white flex flex-col">
                  <ul className="text-[10px] list-disc list-inside space-y-0.5 mb-2">
                      {profile.otherProficiencies.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                  <BoxTitle>Autres Maîtrises et Langues</BoxTitle>
              </div>
          </div>
      </div>

      {/* --- PAGE 2: VISUALS & BACKSTORY --- */}
      <div className="mt-8 pt-8 border-t-4 border-double border-gray-300">
          <h2 className="text-center font-header text-2xl uppercase tracking-widest mb-6 text-gray-400">Description & Histoire</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-4">
                  <div className="border-4 border-double border-gray-800 rounded-lg h-[400px] bg-gray-50 flex items-center justify-center overflow-hidden relative group shadow-inner">
                        {imageUrl ? (
                            <img src={imageUrl} alt="Character Portrait" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center p-8">
                                <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-sm text-gray-500 italic mb-6">Le portrait de votre héros n'a pas encore été peint.</p>
                                <button 
                                    onClick={handleGenerateImage}
                                    disabled={loadingImage}
                                    className="bg-blood-red text-white px-6 py-3 rounded-full uppercase font-bold tracking-wider hover:bg-blood-dark transition-all flex items-center gap-2 mx-auto disabled:opacity-50 shadow-lg hover:shadow-glow-red"
                                >
                                    {loadingImage ? <span className="animate-spin">⟳</span> : <Sparkles className="w-4 h-4" />}
                                    Générer le Portrait (IA)
                                </button>
                            </div>
                        )}
                  </div>
                  
                  <div className="bg-white border border-gray-300 rounded p-4 grid grid-cols-2 gap-4 text-xs">
                       <div><span className="font-bold block text-gray-500 uppercase text-[9px]">Âge</span> {profile.age}</div>
                       <div><span className="font-bold block text-gray-500 uppercase text-[9px]">Taille</span> {profile.height}</div>
                       <div><span className="font-bold block text-gray-500 uppercase text-[9px]">Poids</span> {profile.weight}</div>
                       <div><span className="font-bold block text-gray-500 uppercase text-[9px]">Yeux</span> {profile.eyes}</div>
                       <div><span className="font-bold block text-gray-500 uppercase text-[9px]">Peau</span> {profile.skin}</div>
                       <div><span className="font-bold block text-gray-500 uppercase text-[9px]">Cheveux</span> {profile.hair}</div>
                  </div>
              </div>

              <div className="border border-gray-400 rounded p-6 bg-white shadow-sm relative">
                   <Scroll className="w-8 h-8 text-gray-200 absolute top-4 right-4" />
                   <h3 className="font-header text-xl font-bold mb-4 border-b border-gray-200 pb-2">L'Histoire du Personnage</h3>
                   <div className="prose prose-sm max-w-none text-justify font-serif text-gray-800 leading-relaxed whitespace-pre-line">
                       {profile.backstory}
                   </div>
                   <div className="mt-8 border-t border-gray-200 pt-2">
                       <BoxTitle>Histoire du Personnage</BoxTitle>
                   </div>
              </div>
          </div>
      </div>

      <div className="relative z-10 mt-8 pt-4 border-t border-gray-200 flex justify-between items-center print:hidden">
            <span className="text-xs text-gray-400 flex items-center gap-2">
                <Skull className="w-4 h-4" /> Généré par D&D Action Narrator
            </span>
            <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors text-xs font-bold uppercase tracking-widest shadow-lg"
            >
                <Printer className="w-4 h-4" /> Imprimer la Fiche
            </button>
      </div>
    </div>
  );
};

export default CharacterSheet;
