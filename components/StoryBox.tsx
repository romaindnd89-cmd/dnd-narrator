
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Sparkles, Volume2, VolumeX, Loader2, X, ScrollText, Skull, Activity, MessageSquareText, Gift, ChevronRight, PackagePlus, ZapOff, Brain, Users, Sword, Eye, Lock, Gem, Box, AlertTriangle, AlertOctagon, Hourglass, Wand2, UserCircle } from 'lucide-react';
import { generateSpeech, generateCharacterImage } from '../services/geminiService';
import { SessionState, VaultItem, NarratorMode, CombatState } from '../types';

interface StoryBoxProps {
  narration: string | null;
  error: string | null;
  session: SessionState;
  onUpdateSession: (session: SessionState) => void;
  onClose: () => void;
  mode?: NarratorMode;
  combatState?: CombatState;
}

const StoryBox: React.FC<StoryBoxProps> = ({ narration, error, session, onUpdateSession, onClose, mode, combatState }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [monsterImage, setMonsterImage] = useState<string | null>(null);
  const [itemImage, setItemImage] = useState<string | null>(null);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [showLootDistribute, setShowLootDistribute] = useState(false);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Parsing pour les Monstres (Bestiaire)
  const monsterData = useMemo(() => {
    if ((mode !== NarratorMode.BESTIARY && mode !== NarratorMode.NPC) || !narration) return null;
    
    const cleanNarration = narration.replace(/\*\*/g, '');
    const lines = cleanNarration.split('\n');
    
    const extractBlock = (key: string) => {
        const startIndex = lines.findIndex(l => {
            const trimmed = l.trim().toUpperCase();
            return trimmed.startsWith(key.toUpperCase() + " :") || trimmed.startsWith(key.toUpperCase() + ":");
        });
        
        if (startIndex === -1) return "";
        
        let block = [lines[startIndex].split(/: (.+)/)[1]?.trim() || ""];
        const labels = ["NOM", "CR", "STATS", "LIEU", "INTRO", "DESCRIPTION", "ACTIONS", "EFFETS", "LOOT", "FAIBLESSE", "GUIDE_MJ", "AIDE", "PNJ", "DIALOGUE", "PAROLES", "REMERCIEMENT", "OBJET", "VISUEL", "EFFET"];
        
        for (let i = startIndex + 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            if (labels.some(l => line.toUpperCase().startsWith(l + " :") || line.toUpperCase().startsWith(l + ":"))) break;
            block.push(line);
        }
        return block.join('\n').trim();
    };
    
    const name = extractBlock('NOM');
    if (!name) return null;

    const rawStats = extractBlock('STATS');
    const statsArray = rawStats.split(/[,|]/).map(s => s.trim()).filter(s => s.length > 0);

    return {
      name,
      cr: extractBlock('CR'),
      stats: statsArray,
      location: extractBlock('LIEU'),
      intro: extractBlock('INTRO'),
      desc: extractBlock('DESCRIPTION'),
      actions: extractBlock('ACTIONS'),
      effects: extractBlock('EFFETS'),
      loot: extractBlock('LOOT'),
      weakness: extractBlock('FAIBLESSE'),
      guide: extractBlock('GUIDE_MJ'),
      help: extractBlock('AIDE'),
      pnj: extractBlock('PNJ'),
      dialogue: extractBlock('DIALOGUE') || extractBlock('PAROLES')
    };
  }, [narration, mode]);

  // Parsing pour les Énigmes (Riddle)
  const riddleData = useMemo(() => {
    if ((mode !== NarratorMode.INTERACTIVE && mode !== NarratorMode.NPC) || !narration) return null;
    
    const cleanNarration = narration.replace(/\*\*/g, '');
    const lines = cleanNarration.split('\n');
    
    // Fonction d'extraction multi-lignes robuste
    const extractBlock = (keys: string[]) => {
        const startIndex = lines.findIndex(l => {
            const trimmed = l.trim().toUpperCase();
            return keys.some(k => trimmed.startsWith(k + " :") || trimmed.startsWith(k + ":"));
        });
        
        if (startIndex === -1) return "";
        
        // Récupérer le contenu sur la même ligne (après le :)
        let firstLineContent = lines[startIndex].split(/:(.+)/)[1]?.trim() || "";
        let block = firstLineContent ? [firstLineContent] : [];
        
        // Liste des mots-clés qui arrêtent la lecture
        const allKeywords = ["OBSERVATION", "INDICE", "RÉPONSE", "REPONSE", "DIFFICULTÉ", "DIFFICULTE", "OBJET", "VISUEL", "EFFET", "RÉCOMPENSE", "RECOMPENSE", "PIÈGE", "PIEGE", "BÉNÉDICTION", "BENEDICTION", "PNJ", "DIALOGUE", "PAROLES", "REMERCIEMENT"];
        
        for (let i = startIndex + 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line && block.length === 0) continue; // Ignorer les lignes vides au début
            if (!line && block.length > 0) { block.push(""); continue; } // Garder les sauts de ligne dans le texte
            
            // Si on tombe sur un nouveau mot-clé, on arrête
            if (allKeywords.some(k => line.toUpperCase().startsWith(k + ":") || line.toUpperCase().startsWith(k + " :"))) break;
            
            block.push(line);
        }
        return block.join('\n').trim();
    };

    // On vérifie si c'est bien une énigme (présence de RÉPONSE ou INDICE)
    const answer = extractBlock(['RÉPONSE', 'REPONSE']);
    if (!answer && !extractBlock(['OBSERVATION'])) return null;

    return {
        observation: extractBlock(['OBSERVATION']),
        hint: extractBlock(['INDICE']),
        answer: answer,
        difficulty: extractBlock(['DIFFICULTÉ', 'DIFFICULTE']),
        pnj: extractBlock(['PNJ']),
        dialogue: extractBlock(['DIALOGUE', 'PAROLES'])
    };
  }, [narration, mode]);

  // Parsing pour les Objets (Loot), Pièges (Interactif) ET Bénédictions
  const parsedItem = useMemo(() => {
      if ((mode !== NarratorMode.LOOT && mode !== NarratorMode.INTERACTIVE && mode !== NarratorMode.NPC) || !narration) return null;
      
      const cleanNarration = narration.replace(/\*\*/g, '');
      const lines = cleanNarration.split('\n');
      
      // Fonction d'extraction multi-lignes (similaire mais adaptée pour item)
      const extractBlock = (keys: string[]) => {
          const startIndex = lines.findIndex(l => {
              const trimmed = l.trim().toUpperCase();
              return keys.some(k => trimmed.startsWith(k + " :") || trimmed.startsWith(k + ":"));
          });
          
          if (startIndex === -1) return "";
          
          let firstLineContent = lines[startIndex].split(/:(.+)/)[1]?.trim() || "";
          let block = firstLineContent ? [firstLineContent] : [];
          
          const allKeywords = ["OBJET", "VISUEL", "EFFET", "PIÈGE", "PIEGE", "BÉNÉDICTION", "BENEDICTION", "OBSERVATION", "INDICE", "RÉPONSE", "PNJ", "DIALOGUE", "PAROLES", "REMERCIEMENT"];
          
          for (let i = startIndex + 1; i < lines.length; i++) {
              const line = lines[i].trim();
              if (allKeywords.some(k => line.toUpperCase().startsWith(k + ":") || line.toUpperCase().startsWith(k + " :"))) break;
              block.push(line);
          }
          return block.join('\n').trim();
      };
      
      const findLine = (prefix: string) => lines.find(l => l.trim().toUpperCase().startsWith(prefix));
      
      // Détection Objet (Positif) ou Piège (Négatif) ou Bénédiction (Positif)
      const objLine = findLine('OBJET :') || findLine('OBJET:');
      const trapLine = findLine('PIÈGE :') || findLine('PIÈGE:') || findLine('PIEGE:');
      const blessLine = findLine('BÉNÉDICTION :') || findLine('BÉNÉDICTION:') || findLine('BENEDICTION:');
      
      if (!objLine && !trapLine && !blessLine) return null; // Rien trouvé

      const isTrap = !!trapLine;
      const isBlessing = !!blessLine;
      
      let nameLine = objLine;
      if (isTrap) nameLine = trapLine;
      if (isBlessing) nameLine = blessLine;

      const name = nameLine!.split(/:(.+)/)[1]?.trim() || "Élément Inconnu";
      
      const visual = extractBlock(['VISUEL']);
      const effect = extractBlock(['EFFET']);
      const thanks = extractBlock(['REMERCIEMENT']);
      
      return { 
          name, 
          description: `${visual} ${effect}`.trim(), 
          visual,
          effect,
          thanks,
          isPenalty: isTrap,
          isBlessing: isBlessing,
          pnj: extractBlock(['PNJ']),
          dialogue: extractBlock(['DIALOGUE', 'PAROLES'])
      };
  }, [narration, mode]);

  // Parsing spécifiquement pour le PNJ pur (sans énigme, sans objet, sans monstre complet)
  const isPureNpc = mode === NarratorMode.NPC && !monsterData && !riddleData && !parsedItem;
  
  const pureNpcData = useMemo(() => {
    if (!isPureNpc || !narration) return null;
    
    const cleanNarration = narration.replace(/\*\*/g, '');
    const lines = cleanNarration.split('\n');
    
    const extractBlock = (keys: string[]) => {
        const startIndex = lines.findIndex(l => {
            const trimmed = l.trim().toUpperCase();
            return keys.some(k => trimmed.startsWith(k + " :") || trimmed.startsWith(k + ":"));
        });
        
        if (startIndex === -1) return "";
        let firstLineContent = lines[startIndex].split(/:(.+)/)[1]?.trim() || "";
        let block = firstLineContent ? [firstLineContent] : [];
        
        const allKeywords = ["PNJ", "DIALOGUE", "PAROLES", "REMERCIEMENT", "OBJET", "VISUEL", "EFFET"];
        
        for (let i = startIndex + 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line && block.length === 0) continue;
            if (!line && block.length > 0) { block.push(""); continue; }
            if (allKeywords.some(k => line.toUpperCase().startsWith(k + ":") || line.toUpperCase().startsWith(k + " :"))) break;
            block.push(line);
        }
        return block.join('\n').trim();
    };

    const pnj = extractBlock(['PNJ']);
    const dialogue = extractBlock(['DIALOGUE', 'PAROLES']);
    
    if (!pnj && !dialogue) return null;
    return { pnj, dialogue };
  }, [narration, mode, isPureNpc]);

  // Génération Image Monstre & Objet désactivée pour économiser le quota
  // useEffect(() => { ... }, [monsterData]);
  // useEffect(() => { ... }, [parsedItem]);

  const distributeLoot = (playerId: string) => {
    if (!monsterData?.loot) return;
    const parts = monsterData.loot.split('|').map(s => s.trim());
    let itemName = parts[0] || "Butin";
    let itemDesc = parts[1];
    
    if (!itemDesc) {
        // Si le gemini n'a pas mis de pipe, on met le texte en description et on met "Butin" (ou le nom du monstre) en nom
        itemDesc = itemName;
        itemName = "Butin sur " + (monsterData.name || "Créature");
    }
    
    addItemToPlayer(playerId, itemName, itemDesc, monsterImage || undefined);
  };

  const distributeParsedItem = (playerId: string) => {
      if (!parsedItem) return;
      
      const name = parsedItem.name && typeof parsedItem.name === 'string' ? parsedItem.name : "Objet Inconnu";
      let desc = parsedItem.description && typeof parsedItem.description === 'string' ? parsedItem.description : "";
      
      if (!desc && parsedItem.visual && typeof parsedItem.visual === 'string') desc = parsedItem.visual;
      if (!desc) desc = "Aucune description.";

      const img = itemImage && typeof itemImage === 'string' ? itemImage : undefined;
      const isPenalty = !!parsedItem.isPenalty;

      addItemToPlayer(playerId, name, desc, img, isPenalty);
  };

  const addItemToPlayer = (playerId: string, name: string, desc: string, img?: string, isPenalty: boolean = false) => {
    if (!session || !session.players) return;

    const newItem: VaultItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: name,
        description: desc,
        quantity: 1,
        timestamp: Date.now(),
        imageUrl: img,
        isPenalty: isPenalty
    };

    onUpdateSession({
        ...session,
        players: session.players.map(p => 
            p.id === playerId ? { ...p, inventory: [newItem, ...(p.inventory || [])] } : p
        )
    });
    setShowLootDistribute(false);
  };

  const handleSpeech = async () => {
    if (isSpeaking) {
        if (audioSourceRef.current) { try { audioSourceRef.current.stop(); } catch(e) {} }
        setIsSpeaking(false);
        return;
    }
    if (!narration) return;
    setIsBuffering(true);
    try {
        const audioBuffer = await generateSpeech(narration);
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => setIsSpeaking(false);
        audioSourceRef.current = source;
        setIsSpeaking(true);
        source.start(0);
    } catch (err) { console.error(err); } finally { setIsBuffering(false); }
  };

  // --- GESTION DES ERREURS (Affichage dans la boîte) ---
  if (error) {
    const isQuotaError = error.includes("429") || error.toLowerCase().includes("quota") || error.toLowerCase().includes("exhausted");
    
    // Configuration visuelle selon le type d'erreur
    const theme = isQuotaError ? {
        borderColor: "border-amber-600/50",
        shadow: "shadow-[0_0_30px_rgba(217,119,6,0.2)]",
        headerBorder: "border-amber-600/20",
        textColor: "text-amber-500",
        iconColor: "text-amber-600",
        icon: Hourglass,
        title: "Épuisement Arcanique",
        subtitle: "Flux Magique Interrompu",
        descBorder: "border-amber-600/30"
    } : {
        borderColor: "border-blood-red/50",
        shadow: "shadow-[0_0_30px_rgba(138,3,3,0.2)]",
        headerBorder: "border-blood-red/20",
        textColor: "text-blood-red",
        iconColor: "text-blood-dark",
        icon: Skull,
        title: "Échec Critique",
        subtitle: "L'Invocation a échoué",
        descBorder: "border-blood-red/30"
    };

    const Icon = theme.icon;

    return (
        <div className={`w-full bg-darker-metal border-2 ${theme.borderColor} rounded-2xl animate-fade-in flex flex-col overflow-hidden ${theme.shadow} relative min-h-[300px]`}>
            <div className={`p-4 border-b ${theme.headerBorder} bg-black/80 flex justify-between items-center z-20 shrink-0`}>
                <span className={`font-header text-[10px] uppercase tracking-[0.3em] ${theme.textColor} flex items-center gap-2`}>
                    <AlertTriangle className="w-4 h-4" /> {theme.title}
                </span>
                <button onClick={onClose} className="p-2 text-gray-700 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 p-8 md:p-16 flex flex-col items-center justify-center text-center space-y-6">
                <Icon className={`w-16 h-16 ${theme.iconColor} animate-pulse`} />
                <div>
                    <h3 className={`text-xl md:text-2xl font-header ${theme.textColor} mb-3`}>{theme.subtitle}</h3>
                    <p className={`text-parchment/80 font-body text-sm md:text-base max-w-lg mx-auto leading-relaxed border-l-2 ${theme.descBorder} pl-4 py-2 bg-black/40 rounded-r`}>
                        {isQuotaError 
                            ? "Les esprits de la machine sont fatigués par tant de sollicitations. Le mana de votre clé API est temporairement épuisé." 
                            : error}
                    </p>
                </div>
                {isQuotaError && (
                    <div className="bg-amber-900/20 border border-amber-600/30 p-4 rounded text-[11px] text-amber-500 max-w-sm">
                        <p className="font-bold uppercase mb-1 flex items-center justify-center gap-2"><Hourglass className="w-3 h-3"/> Conseil du Sage</p>
                        Vous avez atteint la limite de requêtes par minute de Google. Attendez quelques instants avant de relancer le dé.
                    </div>
                )}
            </div>
        </div>
    );
  }

  if (!narration) return null;

  // --- RENDU BESTIAIRE ---
  if (monsterData) {
      return (
        <div className="w-full bg-darker-metal border-2 border-gold-dark/40 rounded-2xl animate-fade-in flex flex-col overflow-hidden shadow-2xl relative">
            <div className="flex items-center justify-between p-4 border-b border-gold-dark/20 bg-black/80 z-20 shrink-0">
                <div className="flex items-center gap-3">
                    <Skull className="w-5 h-5 text-blood-red" />
                    <span className="font-header text-[10px] uppercase tracking-[0.4em] text-gold-antique">Bestiaire</span>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleSpeech} disabled={isBuffering} className={`p-2 rounded-full border transition-all ${isSpeaking ? 'bg-blood-red text-white' : 'text-gold-antique border-gold-dark/30'}`}>
                        {isBuffering ? <Loader2 className="w-3 h-3 animate-spin" /> : isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                    </button>
                    <button onClick={onClose} className="p-2 text-gray-700 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>
            </div>

            <div className="p-6 md:p-8 flex flex-col space-y-8 overflow-y-auto no-scrollbar">

                {/* Optional PNJ Dialogue for Bestiary view */}
                {monsterData.pnj && (
                    <div className="bg-black/60 p-6 rounded-2xl border border-blood-red/40 text-center relative shadow-xl">
                        <MessageSquareText className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 text-blood-red bg-black rounded-full p-2 border border-blood-red/40 shadow-lg" />
                        <h3 className="font-header text-blood-red uppercase text-xl font-bold mt-2 tracking-widest">{monsterData.pnj}</h3>
                        {monsterData.dialogue ? (
                            <p className="font-body italic text-parchment pt-4 text-xl md:text-2xl leading-relaxed">"{monsterData.dialogue}"</p>
                        ) : (
                            <p className="font-body text-gray-500 italic pt-4">Le personnage te désigne l'ennemi en silence.</p>
                        )}
                    </div>
                )}

                <div className="text-center">
                    <h2 className="text-4xl md:text-6xl font-header tracking-tighter text-gold-antique uppercase mb-2 drop-shadow-glow">{monsterData.name}</h2>
                    <div className="flex items-center justify-center gap-3">
                        <span className="px-3 py-0.5 bg-gold-dark/20 border border-gold-antique/30 rounded-full text-[9px] font-black text-gold-antique tracking-widest">{monsterData.cr}</span>
                        <span className="text-[8px] uppercase tracking-widest text-gold-dark/60 font-bold">{monsterData.location}</span>
                    </div>
                </div>

                {monsterData.intro && monsterData.intro.trim() !== '' && (
                <div className="bg-gold-antique/5 border border-gold-antique/30 p-5 md:p-6 rounded-3xl text-center relative">
                     <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gold-antique text-black font-header text-[7px] uppercase tracking-widest rounded-full flex items-center gap-2">
                        <Eye className="w-2.5 h-2.5" /> À lire aux joueurs
                     </div>
                     <p className="text-parchment text-base md:text-xl font-body italic leading-relaxed pt-1">"{monsterData.intro}"</p>
                </div>
                )}

                <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-gold-dark/10 pb-1 mb-1">
                        <span className="text-[9px] font-black uppercase text-gold-antique tracking-widest flex items-center gap-2"><ScrollText className="w-3.5 h-3.5" /> Aspect & Nature</span>
                    </div>
                    <p className="text-parchment/90 text-sm md:text-base font-body leading-relaxed">{monsterData.desc}</p>
                </div>

                {/* STATS GRID */}
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2">
                    {monsterData.stats.map((stat, idx) => (
                        <div key={idx} className="bg-black/60 border border-gold-dark/20 p-2.5 rounded-lg text-center shadow-lg hover:border-gold-antique transition-colors group">
                            <span className="text-[10px] font-header text-white/90 group-hover:text-gold-antique block truncate">{stat}</span>
                        </div>
                    ))}
                </div>

                <div className="bg-black/80 border-2 border-blood-red/20 p-5 md:p-6 rounded-3xl shadow-xl">
                    <h3 className="flex items-center gap-2 text-blood-red font-header text-sm uppercase mb-4 pb-2 border-b border-blood-red/10">
                        <Activity className="w-4 h-4" /> Capacités
                    </h3>
                    <div className="space-y-3">
                        {monsterData.actions.split('\n').filter(a => a.trim()).map((action, i) => (
                            <div key={i} className="flex gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                                <Sword className="w-4 h-4 text-blood-red shrink-0 mt-0.5 opacity-60" />
                                <p className="text-parchment text-sm md:text-base font-body leading-relaxed">{action.trim()}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {monsterData.guide && monsterData.guide.trim() !== '' && (
                    <div className="bg-black/40 border border-gold-dark/20 p-4 rounded-2xl space-y-2 relative">
                        <div className="absolute top-2 right-2"><Lock className="w-3 h-3 text-gold-dark/30" /></div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-gold-antique flex items-center gap-2"><Brain className="w-4 h-4" /> Guide MJ</span>
                        <p className="text-xs text-parchment/70 italic leading-relaxed">{monsterData.guide}</p>
                    </div>
                    )}
                    {monsterData.help && monsterData.help.trim() !== '' && (
                    <div className="bg-black/40 border border-gold-dark/20 p-4 rounded-2xl space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-gold-antique flex items-center gap-2"><Users className="w-4 h-4" /> Équilibrage</span>
                        <p className="text-xs text-parchment/70 italic leading-relaxed">{monsterData.help}</p>
                    </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-6">
                    {monsterData.loot && monsterData.loot.trim() !== '' && (
                    <div className="bg-gold-dark/5 border border-gold-antique/20 p-4 rounded-2xl flex items-center justify-between gap-3 relative">
                        <div className="min-w-0">
                            <span className="text-[9px] font-black uppercase text-gold-antique tracking-widest block mb-1">Butin</span>
                            <p className="text-parchment font-header text-[10px] truncate">{monsterData.loot}</p>
                        </div>
                        <button onClick={() => setShowLootDistribute(!showLootDistribute)} className="p-2 bg-gold-antique text-black rounded-lg shadow-glow-gold"><Gift className="w-4 h-4" /></button>
                        {showLootDistribute && (
                            <div className="absolute bottom-full right-0 w-48 mb-2 bg-black border border-gold-antique rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                                {session.players.length > 0 ? session.players.map(p => (
                                    <button key={p.id} onClick={() => distributeLoot(p.id)} className="w-full p-3 flex items-center justify-between hover:bg-gold-antique/10 text-gold-antique border-b border-white/5 last:border-0 text-left">
                                        <span className="font-header text-[10px]">{p.name}</span>
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                )) : (
                                    <div className="p-3 text-[10px] text-gray-500 text-center">Aucun joueur dans le coffre.</div>
                                )}
                            </div>
                        )}
                    </div>
                    )}
                    {monsterData.weakness && monsterData.weakness.trim() !== '' && (
                    <div className="bg-blood-dark/20 border border-blood-red/20 p-4 rounded-2xl flex items-center gap-4">
                        <ZapOff className="w-6 h-6 text-blood-red shrink-0 opacity-80" />
                        <div>
                            <span className="text-[9px] font-black uppercase text-blood-red block opacity-60 tracking-widest">Faille (Jet requis)</span>
                            <p className="text-parchment font-body text-[11px] italic">{monsterData.weakness}</p>
                        </div>
                    </div>
                    )}
                </div>
            </div>

            {/* Récompense (Si le PNJ a promis un objet) */}
            {parsedItem && (
                <div className="mt-4 border-t border-gold-dark/20 p-6 md:p-8 bg-black/40">
                    {parsedItem.thanks && (
                        <div className="bg-black/60 p-6 rounded-2xl border border-blood-red/40 text-center relative shadow-xl max-w-2xl mx-auto mb-8">
                            <MessageSquareText className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 text-blood-red bg-black rounded-full p-2 border border-blood-red/40 shadow-lg" />
                            <h3 className="font-header text-blood-red uppercase text-xl font-bold mt-2 tracking-widest">{pureNpcData?.pnj || monsterData?.pnj || "Le PNJ"} (Remerciement)</h3>
                            <p className="font-body italic text-parchment pt-4 text-xl md:text-2xl leading-relaxed">"{parsedItem.thanks}"</p>
                        </div>
                    )}
                    
                    <div className="bg-gold-dark/10 border border-gold-dark/30 rounded-xl p-4 flex flex-col items-center text-center relative max-w-lg mx-auto shadow-xl">
                        <Gift className="absolute -top-4 w-8 h-8 text-gold-antique bg-black rounded-full p-1 border border-gold-dark/30 shadow-lg" />
                        <span className="text-[9px] font-black uppercase text-gold-antique tracking-widest block mb-2 mt-2">Récompense de Quête</span>
                        <h4 className="text-xl font-header text-gold-antique mb-2">{parsedItem.name}</h4>
                        <p className="text-xs text-parchment/60 italic mb-3">{parsedItem.visual}</p>
                        {parsedItem.effect && (
                            <div className="mb-4 bg-black/80 border-2 border-green-500/50 p-2 rounded-lg inline-block px-4 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                                <span className="text-[9px] font-black uppercase text-green-400 tracking-widest block mb-1 drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]">Effet Magique / Propriété</span>
                                <span className="text-sm font-bold text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,1)]">{parsedItem.effect}</span>
                            </div>
                        )}
                        
                        <div className="relative">
                            <button 
                                onClick={() => setShowLootDistribute(!showLootDistribute)}
                                className="bg-gold-dark hover:bg-gold-antique text-black font-header text-xs uppercase tracking-widest font-bold py-2 px-6 rounded shadow-lg flex items-center gap-2 transition-all"
                            >
                                <Gift className="w-4 h-4"/> Donner la Récompense
                            </button>
                            {showLootDistribute && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-black border border-gold-antique rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                                    {session.players.length > 0 ? session.players.map(p => (
                                        <button key={p.id} onClick={() => distributeParsedItem(p.id)} className="w-full p-3 flex items-center justify-between hover:bg-gold-antique/10 text-gold-antique border-b border-white/5 last:border-0 text-left">
                                            <span className="font-header text-[10px]">{p.name}</span>
                                            <ChevronRight className="w-3 h-3" />
                                        </button>
                                    )) : (
                                        <div className="p-3 text-[10px] text-gray-500 text-center">Aucun joueur.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
      );
  }

  // --- RENDU ÉNIGME (RIDDLE) ---
  if (riddleData) {
      return (
        <div className="w-full bg-darker-metal border-2 border-purple-900/40 rounded-2xl animate-fade-in flex flex-col overflow-hidden shadow-2xl relative">
            <div className="flex items-center justify-between p-4 border-b border-purple-900/20 bg-black/80 z-20 shrink-0">
                <div className="flex items-center gap-3">
                    <Brain className="w-5 h-5 text-purple-400" />
                    <span className="font-header text-[10px] uppercase tracking-[0.4em] text-purple-300">Énigme Mystique</span>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleSpeech} disabled={isBuffering} className={`p-2 rounded-full border transition-all ${isSpeaking ? 'bg-purple-600 text-white' : 'text-purple-300 border-purple-900/30'}`}>
                        {isBuffering ? <Loader2 className="w-3 h-3 animate-spin" /> : isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                    </button>
                    <button onClick={onClose} className="p-2 text-gray-700 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>
            </div>

            <div className="p-6 md:p-8 flex flex-col space-y-6 overflow-y-auto no-scrollbar">

                {/* Optional PNJ Dialogue for Riddle view */}
                {riddleData.pnj && (
                    <div className="bg-black/60 p-4 rounded-xl border border-purple-900/30 text-center">
                        <h3 className="font-header text-purple-300 uppercase text-lg drop-shadow-md">{riddleData.pnj}</h3>
                        <p className="font-body italic text-parchment pt-2 text-lg">"{riddleData.dialogue}"</p>
                    </div>
                )}
                
                {/* Observation */}
                <div className="bg-black/40 border border-purple-900/30 p-6 rounded-2xl text-center">
                    <h3 className="text-purple-300 font-header text-sm uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
                        <Eye className="w-4 h-4" /> Observation
                    </h3>
                    <p className="text-parchment text-lg font-body italic leading-relaxed">"{riddleData.observation}"</p>
                </div>

                {/* Indice */}
                <div className="bg-purple-900/10 border border-purple-500/20 p-4 rounded-xl flex items-start gap-4">
                    <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-1" />
                    <div>
                        <span className="text-[9px] font-black uppercase text-purple-400 tracking-widest block mb-1">Indice pour les Joueurs</span>
                        <p className="text-parchment/80 text-sm font-body">{riddleData.hint}</p>
                    </div>
                </div>

                {/* Réponse (Spoiler) */}
                <div className="bg-black border border-purple-500/30 p-4 rounded-xl relative group">
                    <div className="absolute inset-0 bg-black flex items-center justify-center group-hover:opacity-0 transition-opacity duration-500 z-10 cursor-pointer">
                        <span className="text-purple-500 font-header text-xs uppercase tracking-widest flex items-center gap-2">
                            <Lock className="w-3 h-3" /> Révéler la Réponse (MJ)
                        </span>
                    </div>
                    <div className="text-center">
                        <span className="text-[9px] font-black uppercase text-purple-500 tracking-widest block mb-2">Solution</span>
                        <p className="text-white text-xl font-header font-bold">{riddleData.answer}</p>
                    </div>
                </div>

                {/* Récompense (Si présente) */}
                {parsedItem && (
                    <div className="mt-4 pt-6 border-t border-white/10">
                        {parsedItem.thanks && (
                            <div className="bg-black/60 p-6 rounded-2xl border border-purple-900/40 text-center relative shadow-xl max-w-2xl mx-auto mb-8">
                                <MessageSquareText className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 text-purple-400 bg-black rounded-full p-2 border border-purple-900/40 shadow-lg" />
                                <h3 className="font-header text-purple-400 uppercase text-xl font-bold mt-2 tracking-widest">{riddleData.pnj || pureNpcData?.pnj || monsterData?.pnj || "Le PNJ"} (Remerciement)</h3>
                                <p className="font-body italic text-parchment pt-4 text-xl md:text-2xl leading-relaxed">"{parsedItem.thanks}"</p>
                            </div>
                        )}
                        <div className="bg-gold-dark/10 border border-gold-dark/30 rounded-xl p-4 flex flex-col items-center text-center relative">
                            <span className="text-[9px] font-black uppercase text-gold-antique tracking-widest block mb-2">Récompense en cas de succès</span>
                            <h4 className="text-xl font-header text-gold-antique mb-2">{parsedItem.name}</h4>
                            <p className="text-xs text-parchment/60 italic mb-4">{parsedItem.visual}</p>
                            
                            {parsedItem.effect && (
                                <div className="mb-4 bg-black/80 border-2 border-green-500/50 p-2 rounded-lg inline-block px-4 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                                    <span className="text-[9px] font-black uppercase text-green-400 tracking-widest block mb-1 drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]">Effet Magique / Propriété</span>
                                    <span className="text-sm font-bold text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,1)]">{parsedItem.effect}</span>
                                </div>
                            )}

                            <div className="relative">
                                <button 
                                    onClick={() => setShowLootDistribute(!showLootDistribute)}
                                    className="bg-gold-dark hover:bg-gold-antique text-black font-header text-xs uppercase tracking-widest font-bold py-2 px-6 rounded shadow-lg flex items-center gap-2 transition-all"
                                >
                                    <Gift className="w-4 h-4"/> Donner la Récompense
                                </button>
                                {showLootDistribute && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-black border border-gold-antique rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                                        {session.players.length > 0 ? session.players.map(p => (
                                            <button key={p.id} onClick={() => distributeParsedItem(p.id)} className="w-full p-3 flex items-center justify-between hover:bg-gold-antique/10 text-gold-antique border-b border-white/5 last:border-0 text-left">
                                                <span className="font-header text-[10px]">{p.name}</span>
                                                <ChevronRight className="w-3 h-3" />
                                            </button>
                                        )) : (
                                            <div className="p-3 text-[10px] text-gray-500 text-center">Aucun joueur.</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
      );
  }

  // --- RENDU CARTE OBJET (LOOT / INTERACTIF) ---
  if (parsedItem) {
      // Styles dynamiques : Piège (Red), Bénédiction (Cyan), Objet (Gold)
      let accentColor = 'text-gold-antique';
      let borderColor = 'border-gold-dark/40';
      let gradientTitle = 'from-gold-antique to-gold-dark';
      let buttonBg = 'bg-gold-dark hover:bg-gold-antique';
      let Icon = Gem;
      let titleLabel = mode === NarratorMode.LOOT ? "Butin Découvert" : "Objet Trouvé";

      if (parsedItem.isPenalty) {
          accentColor = 'text-blood-red';
          borderColor = 'border-blood-red/40';
          gradientTitle = 'from-red-600 to-blood-dark';
          buttonBg = 'bg-blood-dark hover:bg-blood-red';
          Icon = AlertOctagon;
          titleLabel = "PIÈGE DÉCLENCHÉ";
      } else if (parsedItem.isBlessing) {
          accentColor = 'text-cyan-400';
          borderColor = 'border-cyan-500/40';
          gradientTitle = 'from-cyan-300 to-blue-600';
          buttonBg = 'bg-cyan-900 hover:bg-cyan-700';
          Icon = Wand2;
          titleLabel = "BÉNÉDICTION DIVINE";
      }

      return (
        <div className={`w-full bg-darker-metal border-2 ${borderColor} rounded-2xl animate-fade-in flex flex-col overflow-hidden shadow-2xl relative`}>
            <div className={`flex items-center justify-between p-4 border-b border-white/10 bg-black/80 z-20 shrink-0`}>
                <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${accentColor}`} />
                    <span className={`font-header text-[10px] uppercase tracking-[0.4em] ${accentColor}`}>
                        {titleLabel}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleSpeech} disabled={isBuffering} className={`p-2 rounded-full border transition-all ${isSpeaking ? 'bg-blood-red text-white' : `text-gray-400 border-white/10 hover:text-white`}`}>
                        {isBuffering ? <Loader2 className="w-3 h-3 animate-spin" /> : isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                    </button>
                    <button onClick={onClose} className="p-2 text-gray-700 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>
            </div>

            <div className="p-6 md:p-12 overflow-y-auto no-scrollbar flex flex-col items-center">
                
                {/* Optional PNJ Dialogue for Loot view */}
                {parsedItem.pnj && (
                    <div className="bg-black/80 p-6 rounded-2xl border border-gold-dark/30 text-center max-w-xl w-full mb-8 relative">
                         <MessageSquareText className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 text-gold-antique bg-black rounded-full p-1 border border-gold-dark/30" />
                        <h3 className="font-header text-gold-antique uppercase text-lg">{parsedItem.pnj}</h3>
                        <p className="font-body italic text-parchment pt-2 text-lg leading-relaxed">"{parsedItem.dialogue}"</p>
                    </div>
                )}

                <h2 className={`text-3xl md:text-5xl font-header tracking-tighter text-transparent bg-clip-text bg-gradient-to-b ${gradientTitle} uppercase mb-8 drop-shadow-sm text-center`}>
                    {parsedItem.name}
                </h2>

                <div className={`bg-black/40 border ${parsedItem.isPenalty ? 'border-blood-red/20' : (parsedItem.isBlessing ? 'border-cyan-500/20' : 'border-gold-dark/20')} p-6 rounded-xl text-center max-w-xl w-full mb-8`}>
                    <p className="text-parchment text-lg font-body italic leading-relaxed max-h-40 overflow-y-auto pr-2">
                        {parsedItem.visual}
                    </p>
                    {parsedItem.effect && (
                        <div className="mt-4 pt-4 border-t border-white/5">
                             <span className={`text-[9px] font-black uppercase ${parsedItem.isPenalty ? 'text-blood-red' : (parsedItem.isBlessing ? 'text-cyan-400' : 'text-green-400 drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]')} tracking-widest block mb-1`}>
                                {parsedItem.isPenalty ? "Conséquence" : "Propriété"}
                             </span>
                             <p className={`text-sm font-bold ${parsedItem.isPenalty ? 'text-red-200' : (parsedItem.isBlessing ? 'text-cyan-100' : 'text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,1)]')} max-h-32 overflow-y-auto pr-2`}>{parsedItem.effect}</p>
                        </div>
                    )}
                </div>

                <div className="relative">
                    <button 
                        onClick={() => setShowLootDistribute(!showLootDistribute)}
                        className={`${buttonBg} text-white font-header text-sm uppercase tracking-widest font-bold py-3 px-8 rounded shadow-lg flex items-center gap-3 transition-all transform hover:scale-105`}
                    >
                        {parsedItem.isPenalty ? <AlertTriangle className="w-5 h-5"/> : (parsedItem.isBlessing ? <Sparkles className="w-5 h-5"/> : <PackagePlus className="w-5 h-5" />)} 
                        {parsedItem.isPenalty ? "Infliger au Joueur" : (parsedItem.isBlessing ? "Accorder le Don" : "Ajouter au Coffre")}
                    </button>

                    {showLootDistribute && (
                        <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 bg-darker-metal border ${parsedItem.isPenalty ? 'border-blood-red' : (parsedItem.isBlessing ? 'border-cyan-500' : 'border-gold-antique')} rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in`}>
                            <div className={`${parsedItem.isPenalty ? 'bg-blood-red/20' : (parsedItem.isBlessing ? 'bg-cyan-900/40' : 'bg-gold-antique/10')} p-2 text-center border-b border-white/10`}>
                                <span className={`text-[8px] font-bold uppercase ${parsedItem.isPenalty ? 'text-blood-red' : (parsedItem.isBlessing ? 'text-cyan-400' : 'text-gold-antique')} tracking-widest`}>Choisir la cible</span>
                            </div>
                            {session.players.length > 0 ? session.players.map(p => (
                                <button key={p.id} onClick={() => distributeParsedItem(p.id)} className="w-full p-3 flex items-center justify-between hover:bg-white/5 text-parchment border-b border-white/5 last:border-0 text-left group">
                                    <span className={`font-header text-[10px] group-hover:${parsedItem.isPenalty ? 'text-blood-red' : (parsedItem.isBlessing ? 'text-cyan-400' : 'text-gold-antique')} transition-colors`}>{p.name}</span>
                                    <ChevronRight className="w-3 h-3 text-gray-600" />
                                </button>
                            )) : (
                                <div className="p-4 text-[10px] text-gray-500 text-center italic">
                                    Aucun joueur dans le coffre.<br/>Ajoutez-en un dans le menu latéral.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
      );
  }

  // --- RENDU PNJ PUR (Ni Monstre, ni Loot, ni Énigme) ---
  if (isPureNpc && pureNpcData) {
      return (
        <div className="w-full bg-darker-metal border-2 border-gold-dark/40 rounded-2xl animate-fade-in flex flex-col overflow-hidden shadow-2xl relative min-h-[400px]">
            <div className="p-4 border-b border-gold-dark/20 bg-black/80 flex justify-between items-center z-20 shrink-0">
                <span className="font-header text-[10px] uppercase tracking-[0.3em] text-gold-antique flex items-center gap-2">
                    <UserCircle className="w-4 h-4" /> Personnage Non Joueur
                </span>
                <div className="flex items-center gap-3">
                    <button onClick={handleSpeech} disabled={isBuffering} className={`p-2 rounded-full border transition-all ${isSpeaking ? 'bg-blood-red text-white' : 'text-gold-antique border-gold-dark/30'}`}>
                        {isBuffering ? <Loader2 className="w-4 h-4 animate-spin" /> : isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <button onClick={onClose} className="p-2 text-gray-700 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>
            </div>
            
            <div className="flex-1 p-8 md:p-16 flex flex-col items-center justify-center text-center space-y-8 bg-black/40">
                 <div className="bg-black/60 p-8 md:p-12 rounded-3xl border border-gold-dark/30 text-center max-w-3xl w-full relative shadow-lg">
                     <MessageSquareText className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 text-gold-antique bg-black rounded-full p-2 border border-gold-dark/30 shadow-lg" />
                     {pureNpcData.pnj && <h3 className="font-header text-gold-antique uppercase text-2xl md:text-3xl mb-6 mt-2">{pureNpcData.pnj}</h3>}
                     {pureNpcData.dialogue ? (
                        <p className="font-body italic text-parchment text-xl md:text-2xl leading-relaxed">"{pureNpcData.dialogue}"</p>
                     ) : (
                        <p className="font-body text-gray-500 italic">Le personnage te dévisage en silence.</p>
                     )}
                 </div>
            </div>
        </div>
      );
  }

  // --- RENDU TEXTE STANDARD (COMBAT, MONDE, ETC.) ---
  return (
    <div className="w-full bg-darker-metal border-2 border-gold-dark/40 rounded-2xl animate-fade-in flex flex-col overflow-hidden shadow-2xl relative min-h-[400px]">
        <div className="p-4 border-b border-gold-dark/20 bg-black/80 flex justify-between items-center z-20 shrink-0">
            <span className="font-header text-[10px] uppercase tracking-[0.3em] text-gold-antique flex items-center gap-2">
                {mode === NarratorMode.WORLD ? <Box className="w-4 h-4"/> : <ScrollText className="w-4 h-4" />}
                {mode === NarratorMode.WORLD ? "Environnement" : "Narration"}
            </span>
            <div className="flex items-center gap-3">
                <button onClick={handleSpeech} disabled={isBuffering} className={`p-2 rounded-full border transition-all ${isSpeaking ? 'bg-blood-red text-white' : 'text-gold-antique border-gold-dark/30'}`}>
                    {isBuffering ? <Loader2 className="w-4 h-4 animate-spin" /> : isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button onClick={onClose} className="p-2 text-gray-700 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
        </div>
        <div className="flex-1 p-8 md:p-16 overflow-y-auto no-scrollbar flex items-center justify-center">
            <div className="max-w-2xl w-full text-gold-antique/90 text-xl md:text-2xl font-body italic leading-relaxed text-center">
                {narration?.split('\n').map((line, i) => (
                    <p key={i} className="mb-4">{line.replace(/\*\*/g, '')}</p>
                ))}
            </div>
        </div>
    </div>
  );
};

export default StoryBox;
