
import { GoogleGenAI, Modality } from "@google/genai";
import { BodyPart, CombatState, InteractionAction, InteractiveObjectType, LootType, NarrationStyle, NarratorMode, MonsterCR, MechanicalDifficulty, PlayerExperience } from "../types";

// Fonction utilitaire pour récupérer la clé (Priorité : LocalStorage > Env)
const getApiKey = (): string => {
  const localKey = localStorage.getItem('gemini_api_key');
  if (localKey && localKey.length > 10) return localKey;
  return process.env.API_KEY || "";
};

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const generateNarration = async (combatState: CombatState): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Clé API manquante. Veuillez l'ajouter via le menu.");
  
  const ai = new GoogleGenAI({ apiKey });
  const { weapon, bodyPart, result, target, style, mode, lootType, environmentType, atmosphere, interactiveObj, interactionAction, riddleDifficulty, monsterCR, mechanicalDifficulty, partySize, playerExperience, isLeader, isGroup, npcAction, questComplexity, npcReward } = combatState;
  
  let lengthInstruction = "";
  if (style === NarrationStyle.SIMPLE) lengthInstruction = "Fais court et brutal (2 phrases max).";
  if (style === NarrationStyle.MEDIUM) lengthInstruction = "Un paragraphe descriptif intense.";
  if (style === NarrationStyle.IMMERSIVE) lengthInstruction = "Narration très détaillée, sensorielle (bruits, odeurs, douleur).";

  // Construction du System Instruction dynamique selon le mode
  let systemInstruction = "";

  if (mode === NarratorMode.COMBAT) {
    systemInstruction = `Tu es un narrateur de combat Dark Fantasy viscéral.
    TACHE : Décris UNIQUEMENT l'action de combat.
    INTERDIT : Ne génère PAS de fiche de monstre, PAS de statistiques, PAS de nom de créature inventé, PAS de butin.
    CIBLE : Si le champ target est vide, utilise "l'adversaire" ou "l'ennemi". Ne décris pas son apparence, juste l'impact du coup sur lui.
    STYLE : Concentre-toi sur le mouvement de l'arme, le bruit de l'impact, la réaction physique (sang, recul, parade).
    TON : Sérieux, sombre, violent.`;
  } else if (mode === NarratorMode.BESTIARY) {
    systemInstruction = `Tu es un Maître du Donjon expert en création de monstres.
    TACHE : Génère une fiche technique complète.
    IMPORTANT : Si c'est un GROUPE, le NOM doit être au pluriel (ex: "Meute de Loups") et les actions doivent refléter le nombre.
    IMPORTANT : Si c'est un CHEF/ALPHA, le NOM doit avoir un titre (ex: "Grand Chef Orc") et être bien plus puissant.

    STATS : Format STRICT séparé par des virgules : FOR: X, DEX: X, CON: X, INT: X, SAG: X, CHA: X, CA: X, PV: X.
    
    STRUCTURE OBLIGATOIRE :
    NOM : [Nom de la créature ou du groupe]
    CR : [FP]
    STATS : [FOR:..., DEX:..., CON:..., INT:..., SAG:..., CHA:..., CA:..., PV:...]
    LIEU : [Habitat]
    INTRO : [3 phrases d'ambiance pour l'entrée en scène]
    DESCRIPTION : [Aspect visuel précis]
    ACTIONS : [Liste des attaques et capacités spéciales]
    EFFETS : [Ambiance passive ou aura]
    LOOT : [Objet | Description courte]
    FAIBLESSE : [Faille tactique]
    GUIDE_MJ : [Conseil de jeu]
    AIDE : [Note sur l'équilibrage]`;
  } else if (mode === NarratorMode.WORLD) {
    systemInstruction = `Tu es un Architecte de l'Imaginaire et Maître du Donjon.
    TACHE : Décris un lieu, une salle ou un paysage de manière purement environnementale.
    INTERDIT : PAS DE CRÉATURES, PAS DE PNJ, PAS D'ACTION, PAS D'OBJETS À RAMASSER. Juste le décor, l'architecture et l'atmosphère.
    FOCUS : Architecture, éclairage, météo, odeurs, textures, sons ambiants, histoire suggérée par les ruines.
    STRUCTURE :
    LIEU : [Nom du lieu]
    VISUEL : [Description panoramique]
    SENSORIEL : [Sons, odeurs, température]
    AMBIANCE : [Ressenti émotionnel]`;
  } else if (mode === NarratorMode.INTERACTIVE) {
      if (interactionAction === InteractionAction.OPEN) {
        systemInstruction = `Tu es un Maître du Donjon généreux et inventif.
        TACHE : Le joueur ouvre un contenant (${interactiveObj}). Génère un OBJET UNIQUE (${lootType}) trouvé à l'intérieur.
        VARIÉTÉ : Évite les classiques. Propose des objets inattendus, culturels ou bizarres.
        INTERDIT : Pas d'énigme, pas de piège ici. Focus sur le CONTENU.
        IMPORTANT : L'effet doit être immédiat et simple à comprendre.
        STRUCTURE OBLIGATOIRE :
        OBJET : [Nom original de l'objet]
        VISUEL : [Description physique courte]
        EFFET : [Propriété ultra-courte. MAX 10 MOTS. Ex: "Rend invisible 1 tour." ou "Vaut 100 PO." ]`;
      } else if (interactionAction === InteractionAction.TOUCH) {
        systemInstruction = `Tu es un Maître du Donjon qui gère les interactions d'objets mystérieux.
        CONTEXTE : Le joueur touche ou active un objet (${interactiveObj}).
        TACHE : Génère un EFFET RÉACTIF.
        CHOIX : Choisis aléatoirement entre un PIÈGE (Malus) ou une BÉNÉDICTION (Bonus), selon l'ambiance et l'objet.
        
        STRUCTURE OBLIGATOIRE (Choisis UNE des deux options) :
        
        Option 1 (Négatif) :
        PIÈGE : [Nom du Piège/Malus]
        VISUEL : [Description de l'activation du piège]
        EFFET : [L'effet mécanique négatif (ex: Dégâts, État temporaire)]

        Option 2 (Positif) :
        BÉNÉDICTION : [Nom de la Bénédiction/Bonus]
        VISUEL : [Description de l'aura ou de l'activation bénéfique]
        EFFET : [L'effet mécanique positif (ex: Soin, Avantage, Résistance)]`;
      } else {
        systemInstruction = `Tu es un Maître du Donjon énigmatique.
        TACHE : Le joueur observe une énigme ou un mécanisme bloqué (${interactiveObj}).
        BUT : Décrire le puzzle, donner la solution au MJ, et définir la récompense (${lootType}).
        STYLE : Mystérieux, cryptique.
        STRUCTURE OBLIGATOIRE :
        OBSERVATION : [Détails visuels subtils du puzzle]
        INDICE : [Piste de réflexion pour les joueurs]
        RÉPONSE : [La solution exacte de l'énigme pour le MJ]
        DIFFICULTÉ : [Niveau de complexité ressenti]
        -- Récompense (si réussite) --
        OBJET : [Nom de la récompense]
        VISUEL : [Description physique de la récompense]
        EFFET : [Effet de la récompense]`;
      }
  } else if (mode === NarratorMode.LOOT) {
    systemInstruction = `Tu es un Maître du Donjon créatif et imprévisible.
    TACHE : Génère un butin de type ${lootType} trouvé dans ${environmentType}.
    VARIÉTÉ : Ne donne pas toujours des armes ou des potions. Pense aux : bijoux, parchemins, outils, ingrédients, bibelots étranges, vêtements, nourriture magique.
    IMPORTANT : Si l'objet est magique, explique son effet en 5-10 mots maximum.
    STRUCTURE OBLIGATOIRE :
    OBJET : [Nom original de l'objet]
    VISUEL : [Description physique courte]
    EFFET : [Propriété ultra-courte. MAX 10 MOTS. Ex: "+1 en Force." ou "Brille dans le noir." ou "Soigne 1d4 PV." ]`;
  } else if (mode === NarratorMode.NPC) {
    // Handling new NPC mode
    systemInstruction = `Tu es le Maître du Donjon. Tu interprètes un PNJ (Personnage Non Joueur).
    TACHE : Interagir avec les joueurs. Ton : selon l'ambiance.
    STRUCTURE OBLIGATOIRE DE BASE :
    PNJ : [Nom du personnage et brève description de son attitude]
    DIALOGUE : "[Ce que dit le PNJ]"`;

    if (npcAction === "Donne une quête" /* Quest */ && questComplexity !== "Sans quête") {
        systemInstruction += `\n\nIl donne une QUÊTE (${questComplexity}). 
    VARIÉTÉ EXTRÊME DE QUÊTE : Sois original ! Invente des quêtes très variées issues de toutes les possibilités du JDR : voler un objet d'art, enquêter sur un meurtre, faire de la contrebande, persuader un noble récalcitrant, explorer une ruine, secourir un otage. NE PROPOSE PAS SYSTÉMATIQUEMENT UN COMBAT.
    L'objectif DOIT être décrit de façon naturelle dans le bloc DIALOGUE. N'ajoute pas de texte libre en dehors des balises.
    
    SI (ET SEULEMENT SI) la quête implique de CHASSER ou COMBATTRE un ennemi/monstre spécifique, tu DOIS obligatoirement ajouter sa fiche de statistiques APRÈS le dialogue, EXACTEMENT sous ce format SIMPLIFIÉ STRICT :
    NOM : [Nom du monstre/cible]
    CR : [Niveau de menace]
    STATS : [FOR:..., DEX:..., CON:..., INT:..., SAG:..., CHA:..., CA:..., PV:...]
    LIEU : [Lieu de la traque]
    INTRO : [3 phrases d'ambiance pour l'entrée en scène à lire aux joueurs]
    DESCRIPTION : [Aspect visuel détaillé]
    ACTIONS : [Ses attaques en combat]
    FAIBLESSE : [Astuce]
    GUIDE_MJ : [Conseil MJ pour jouer le combat]
    AIDE : [Ajustement de l'équilibrage si trop dur/facile]
    ATTENTION : NE METS AUCUN BLOC "LOOT" NI "EFFETS" POUR LE MONSTRE CI-DESSUS. La récompense vient uniquement du PNJ.`;
    }
    if (npcAction === "Propose une énigme" /* Riddle */) {
        systemInstruction += `\nIl pose une énigme. AJOUTE OBLIGATOIREMENT :
    OBSERVATION : [Comment il sourit ou pose l'énigme]
    INDICE : [Indice mystérieux glissé aux joueurs]
    RÉPONSE : [La réponse absolue à l'énigme pour le MJ]
    DIFFICULTÉ : [Facile/Moyen/Difficile]`;
    }
    if (npcReward === "Gain avec un objet" /* Item */) {
        systemInstruction += `\n\nLe PNJ donne ou promet un OBJET UNIQUE en gain. Tu DOIS ABSOLUMENT sauter une ligne et ajouter ce bloc TOUT À LA FIN (après l'aide ou le monstre) :
    REMERCIEMENT : [Phrase prononcée par le PNJ quand les joueurs reviennent de la quête réussie ou reçoivent l'objet]
    OBJET : [Nom original de l'objet]
    VISUEL : [Description détaillée de l'objet]
    EFFET : [L'effet ou la valeur de l'objet. MAX 10 MOTS]`;
    }
    
    systemInstruction += `\n\nRÈGLE ABSOLUE : N'AJOUTE AUCUN TEXTE EN DEHORS DES BLOCS DEMANDÉS (PNJ :, DIALOGUE :, NOM :, etc). Tout texte brut sans la balise correspondante fera bugger l'affichage.`;

  } else {
    // Autres modes
    systemInstruction = `Tu es un Maître du Donjon. Décris l'objet ou le butin avec une ambiance ${atmosphere}.`;
  }
  
  let prompt = "";
  switch (mode) {
      case NarratorMode.BESTIARY:
          let entityDirective = "Créature standard.";
          if (isGroup && !isLeader) entityDirective = "C'est une MEUTE / GROUPE. Le NOM doit être au PLURIEL (ex: 'Horde de Gobelins'). Les actions sont collectives.";
          if (!isGroup && isLeader) entityDirective = "C'est un CHEF / ALPHA. Le NOM doit inclure un titre (ex: 'Seigneur', 'Matriarche'). Les stats sont boostées (Boss).";
          if (isGroup && isLeader) entityDirective = "C'est un CHEF DE GUERRE avec son escorte. Décris le Boss principal entouré de ses sbires.";

          prompt = `Génère une fiche technique D&D 5e pour : ${target || "Monstre du lieu"}.
          TYPE : ${entityDirective}
          LIEU : ${environmentType}.
          AMBIANCE : ${atmosphere}.
          DANGER (CR) : ${monsterCR}.
          
          Assure-toi que la Description et les Actions correspondent bien à la directive "${entityDirective}".`;
          break;

      case NarratorMode.COMBAT:
          prompt = `ACTION PURE : ${weapon} frappe ${target || "l'ennemi"} (${bodyPart}). Résultat du dé : ${result}. ${lengthInstruction} Ambiance : ${atmosphere}.`;
          break;
      case NarratorMode.WORLD:
          prompt = `Génère une description immersive pour ce lieu : ${target || "Lieu inexploré"}. Type : ${environmentType}. Ambiance : ${atmosphere}.`;
          break;
      case NarratorMode.LOOT:
          prompt = `Génère un butin de type ${lootType} trouvé dans ${environmentType}. Si c'est un objet magique, explique bien son effet.`;
          break;
      case NarratorMode.NPC:
          if (npcAction === "Propose une énigme") {
              prompt = `Les joueurs rencontrent : ${target || "un personnage"}. Type d'interaction : Énigme. Difficulté : ${riddleDifficulty}. Gain : ${npcReward}. Ambiance : ${atmosphere}. Génère son dialogue et son énigme en respectant la structure.`;
          } else {
              prompt = `Les joueurs rencontrent : ${target || "un personnage"}. Type d'interaction : ${npcAction}. Quête : ${questComplexity}. Gain : ${npcReward}. Ambiance : ${atmosphere}. Si la quête inclut un combat, l'adversaire doit être de niveau : ${monsterCR}. Génère son dialogue en respectant la structure.`;
          }
          break;
      case NarratorMode.INTERACTIVE:
          if (interactionAction === InteractionAction.OPEN) {
              prompt = `Le joueur ouvre : ${interactiveObj} (${target || "Contenant"}). Quel objet de type ${lootType} trouve-t-il dedans ? Si magique, explique l'effet. Ambiance : ${atmosphere}.`;
          } else if (interactionAction === InteractionAction.TOUCH) {
              prompt = `Le joueur TOUCHE l'objet : ${interactiveObj} (${target || "Objet spécifié"}). C'est un test de courage. Génère soit un PIÈGE (conséquence négative), soit une BÉNÉDICTION (récompense mystique). Ambiance : ${atmosphere}.`;
          } else {
              prompt = `Le joueur étudie l'énigme de : ${interactiveObj} (${target || "Objet"}). Difficulté : ${riddleDifficulty}. Récompense à la clé : ${lootType}. Décris le puzzle, donne la RÉPONSE pour le MJ, et détaille l'OBJET gagné (Visuel + Effet). Ambiance : ${atmosphere}.`;
          }
          break;
      default:
          prompt = `Narration : ${target}. Mode : ${mode}.`;
          break;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: prompt,
      config: { systemInstruction, temperature: 0.85 }
    });
    return response.text || "Silence de mort.";
  } catch (err: any) {
    throw err;
  }
};

export const generateCharacterImage = async (monsterName: string, description?: string): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) return `https://placehold.co/600x600/0f1012/c5a059?text=${encodeURIComponent(monsterName)}`;

    const ai = new GoogleGenAI({ apiKey });
    const enrichedPrompt = `D&D Fantasy Art: ${monsterName}. ${description}. Dark, gritty, cinematic lighting, 8k resolution, landscape or portrait based on subject. No text.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: enrichedPrompt }] },
            config: { imageConfig: { aspectRatio: "1:1" } }
        });
        
        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("No image");
    } catch (e: any) {
        return `https://placehold.co/600x600/0f1012/c5a059?text=${encodeURIComponent(monsterName)}`;
    }
};

export const generateSpeech = async (text: string): Promise<AudioBuffer> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Clé API manquante.");

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: text.replace(/\*/g, '') }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
    },
  });
  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Audio vide.");
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  return await decodeAudioData(decodeBase64(base64Audio), audioContext, 24000, 1);
};
