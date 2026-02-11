
import { GoogleGenAI } from "@google/genai";
import { BodyPart, CombatState, InteractionAction, InteractiveObjectType, LootType, NarrationStyle, NarratorMode } from "../types";

export const generateNarration = async (combatState: CombatState, apiKey: string): Promise<string> => {
  if (apiKey === 'DEMO') {
    if (combatState.mode === NarratorMode.INTERACTIVE) {
        if (combatState.interactionAction === InteractionAction.RIDDLE) {
            return "**Objet** : Une porte en pierre gravée d'un visage grimaçant.\n**Énigme** : \"Je suis grand quand je suis jeune et petit quand je suis vieux. Je rayonne de vie mais le vent est mon ennemi. Que suis-je ?\"\n**Solution** : Une bougie.";
        }
        return "**Objet** : Coffre en fer noir.\n**Action** : Vous tentez de l'ouvrir.\n**Effet** : Une aiguille empoisonnée jaillit de la serrure ! (Jet de Sauvegarde Constitution DD 12)";
    }
    if (combatState.mode === NarratorMode.WORLD) return "**Lieu** : La Forêt des Murmures\n**Ambiance** : Une brume épaisse s'accroche aux racines tordues.\n**Description** : Les arbres semblent vous observer. Le silence n'est brisé que par le craquement de branches invisibles. L'air sent l'humus et la peur ancienne.";
    return "**Nom** : Fiole de Sang Séché\n**Description** : Une petite fiole scellée par de la cire noire.\n**Effet** : Réactif d'alchimie. Donne +1 aux jets de Nécromancie.";
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const { weapon, bodyPart, result, target, style, mode, lootType, environmentType, atmosphere, interactiveObj, interactionAction } = combatState;
    
    let lengthInstruction = "";
    if (style === NarrationStyle.SIMPLE) lengthInstruction = "Réponse concise (2-3 phrases).";
    if (style === NarrationStyle.MEDIUM) lengthInstruction = "Un paragraphe détaillé.";
    if (style === NarrationStyle.IMMERSIVE) lengthInstruction = "Narration très riche, sensorielle et atmosphérique.";

    const systemInstruction = "Tu es un Maître du Donjon de Dark Fantasy expert en descriptions immersives. Ton style est gothique, mystérieux et mature. Tu écris en français.";
    let prompt = "";

    switch (mode) {
        case NarratorMode.INTERACTIVE:
            const objName = target.trim() ? target : interactiveObj;
            
            if (interactionAction === InteractionAction.RIDDLE) {
                prompt = `Crée une énigme ou un puzzle pour un objet de type : ${objName}.
                Ambiance : Mystérieuse et Ancienne.
                Format OBLIGATOIRE :
                1. **Description Visuelle** : L'apparence de l'objet ou de l'obstacle.
                2. **Énigme** : Le texte exact de l'énigme (posée par une voix, une inscription, ou un mécanisme).
                3. **Solution** : La réponse attendue pour réussir (à afficher clairement pour le MJ).
                ${lengthInstruction}`;
            } else if (interactionAction === InteractionAction.TOUCH) {
                prompt = `Le joueur touche ou active : ${objName}.
                C'est un effet RÉACTIF INSTANTANÉ (Magique ou Physique).
                Format OBLIGATOIRE :
                1. **Description** : L'apparence de l'objet.
                2. **Réaction** : Ce qui se passe immédiatement (Piège, Flash magique, Malédiction, Bénédiction, Transformation).
                3. **Effet** : Conséquence technique suggérée (Dégâts, Condition, Bonus).
                ${lengthInstruction}`;
            } else { // OPEN
                prompt = `Le joueur ouvre ou fouille : ${objName}.
                Format OBLIGATOIRE :
                1. **Description** : L'apparence du contenant et le mécanisme d'ouverture (bruit, sensation).
                2. **Contenu** : Ce qu'on trouve à l'intérieur (Loot rare, étrange ou dangereux).
                ${lengthInstruction}`;
            }
            break;

        case NarratorMode.WORLD:
            const placeName = target.trim() ? `Lieu spécifique : ${target}` : `Lieu : ${environmentType}`;
            prompt = `Décris un environnement pour un JDR.
            ${placeName}.
            Ambiance / Style : ${atmosphere}.
            
            Format attendu :
            1. **Description Visuelle** : Ce que les joueurs voient (architecture, nature, éclairage).
            2. **Ambiance Sensorielle** : Ce qu'ils entendent (sons lointains, craquements) et sentent (odeurs, température).
            3. **Ce qu'on y trouve** : Détails notables, mobilier, ou éléments étranges qui attirent l'attention.
            
            ${lengthInstruction}`;
            break;

        case NarratorMode.LOOT:
            const location = target.trim() ? target : "cet endroit";
            if (lootType === LootType.USEFUL) {
                prompt = `Le joueur fouille ${location} et trouve un OBJET UTILE. ${lengthInstruction} Format: **Nom**, **Description**, **Effet/Utilité**.`;
            } else {
                prompt = `Le joueur fouille ${location}. Décris un objet macabre ou d'ambiance (bric-à-brac). ${lengthInstruction} Format: **Nom**, **Description**.`;
            }
            break;

        case NarratorMode.COMBAT:
        default:
            const targetDesc = target.trim() ? target : "l'adversaire";
            const bodyPartDesc = (bodyPart && bodyPart !== BodyPart.UNSPECIFIED) ? bodyPart : "le corps";
            prompt = `Action de combat : Attaque avec ${weapon} sur ${targetDesc} (${bodyPartDesc}). Résultat du dé : ${result}. ${lengthInstruction} Raconte l'action avec impact et violence.`;
            break;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.9,
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });

    const text = response.text;
    if (!text) throw new Error("Réponse vide.");
    return text;

  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const generateCharacterImage = async (prompt: string, apiKey: string): Promise<string> => {
    // Fonctionnalité d'image conservée pour usage futur si besoin, même si l'onglet est masqué
    if (apiKey === 'DEMO') {
        return "https://via.placeholder.com/1024x1024.png?text=Character+Portrait+(Demo)";
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }]
            },
            config: {
                imageConfig: {
                    aspectRatio: "1:1"
                }
            }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                const base64EncodeString = part.inlineData.data;
                return `data:${part.inlineData.mimeType};base64,${base64EncodeString}`;
            }
        }
        throw new Error("Aucune image générée.");
    } catch (error) {
        console.error("Gemini Image Gen Error:", error);
        throw error;
    }
};
