import { GoogleGenAI } from "@google/genai";
import { BodyPart, CombatState, DiceResult, LootType, NarrationStyle, NarratorMode } from "../types";

// Liste de sous-catégories pour varier le bric-à-brac
const JUNK_CATEGORIES = [
  "Organique / Dégoûtant (ex: dents, cheveux, nourriture fossilisée...)",
  "Sentimental / Triste (ex: lettre d'amour déchirée, jouet d'enfant cassé, médaillon vide...)",
  "Bureaucratique / Ennuyeux (ex: liste de courses, reçu de taxe, formulaire vierge...)",
  "Curiosité Naturelle (ex: caillou en forme de tête, plume miteuse, coquille d'escargot géant...)",
  "Débris d'équipement (ex: boucle de ceinture tordue, lacet en cuir, manche de dague sans lame...)",
  "Objet du quotidien abîmé (ex: cuillère tordue, peigne édenté, chaussette seule...)",
  "Mystique de pacotille (ex: idole en argile moche, gris-gris fait de brindilles, fausse gemme en verre...)"
];

export const generateNarration = async (combatState: CombatState, apiKey: string): Promise<string> => {
  
  // Gestion du mode DÉMO
  if (apiKey === 'DEMO') {
    return new Promise((resolve) => {
        setTimeout(() => {
            const text = combatState.mode === NarratorMode.COMBAT
                ? `[MODE DÉMO] Le guerrier lève son arme (${combatState.weapon}) et frappe avec précision. C'est un coup simulé. (Utilisez une vraie clé API pour la narration créative).`
                : `[MODE DÉMO] En fouillant, vous trouvez une vieille pièce de monnaie rouillée. (Utilisez une vraie clé API pour générer des objets uniques).`;
            resolve(text);
        }, 1500);
    });
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const { weapon, bodyPart, result, target, style, mode, lootType } = combatState;
    
    // 1. INSTRUCTION DE STYLE (Tone & Length)
    let styleInstruction = "";
    switch (style) {
        case NarrationStyle.SIMPLE:
            styleInstruction = "Format : Une seule phrase choc. Brutal et direct.";
            break;
        case NarrationStyle.MEDIUM:
            styleInstruction = "Format : 2 phrases maximum. Action -> Conséquence immédiate.";
            break;
        case NarrationStyle.IMMERSIVE:
        default:
            styleInstruction = "Format : Paragraphe littéraire 'Dark Fantasy'. Utilise les 5 sens (le crissement du métal, l'odeur de l'ozone, la chaleur du sang). Sois viscéral et poétique.";
            break;
    }

    // 2. SYSTEM INSTRUCTION (Role)
    // On force l'IA à adopter une persona d'auteur pour éviter le style robotique
    let systemInstruction = "Tu es un auteur de Dark Fantasy renommé pour ses scènes de combat réalistes et violentes. Tu ne donnes jamais de conseils de jeu. Tu racontes l'action.";

    let prompt = "";

    if (mode === NarratorMode.LOOT) {
        // --- MODE FOUILLE ---
        const location = target.trim() ? target : "un lieu sombre";
        const isUseful = lootType === LootType.USEFUL;
        const randomJunkCategory = JUNK_CATEGORIES[Math.floor(Math.random() * JUNK_CATEGORIES.length)];

        prompt = `
        TÂCHE : Décris un objet trouvé par un aventurier.
        LIEU : ${location}.
        TYPE : ${isUseful ? "OBJET UTILE (Petit consommable)" : "OBJET INUTILE (Curiosité/Ambiance)"}.
        
        CONTRAINTES :
        1. Ne mets pas de titre. Commence direct.
        2. ${isUseful 
            ? "L'objet doit avoir une petite utilité mécanique (ex: soin mineur, lumière). Pas d'artefact divin." 
            : `L'objet ne sert à rien. Inspire-toi de ce thème : "${randomJunkCategory}". Sois étrange et créatif.`}
        
        STYLE : ${styleInstruction}
        `;

    } else {
        // --- MODE COMBAT ---
        const targetDesc = target.trim() ? target : "l'adversaire";
        const bodyPartDesc = (bodyPart && bodyPart !== BodyPart.UNSPECIFIED) ? bodyPart : "une zone vulnérable";
        
        // Logique "Show Don't Tell" pour la létalité
        let situation = "";
        let negativePrompt = "";

        if (result === DiceResult.FATAL_BLOW) {
            situation = `C'est un COUP MORTEL. L'ennemi (${targetDesc}) meurt immédiatement. Décris son dernier souffle ou sa destruction totale.`;
        } else if (result === DiceResult.HIT || result === DiceResult.CRITICAL_HIT) {
            const intensity = result === DiceResult.CRITICAL_HIT ? "dévastateur" : "puissant";
            situation = `Le coup est ${intensity} et touche ${bodyPartDesc}. L'ennemi est blessé et souffre, MAIS IL SURVIT.`;
            
            // C'est ici qu'on corrige le problème "le combat n'est pas fini"
            negativePrompt = `
            INTERDICTIONS STRICTES (Si tu utilises ces phrases, tu échoues) :
            - NE DIS PAS "le combat continue".
            - NE DIS PAS "il est encore debout".
            - NE DIS PAS "mais il ne meurt pas".
            - NE DIS PAS "il se prépare à riposter".
            - NE DIS PAS "déterminé à vaincre".
            
            INSTRUCTION : Montre qu'il est vivant par sa réaction physique (un cri, un recul, du sang qui gicle, une respiration sifflante) sans commenter l'état du combat.
            `;
        } else {
            situation = `L'attaque rate ou est bloquée par ${targetDesc}. Décris l'échec.`;
        }

        prompt = `
          SCÈNE D'ACTION :
          Arme : ${weapon}
          Cible : ${targetDesc}
          Zone : ${bodyPartDesc}
          
          ACTION : ${situation}

          ${negativePrompt}

          STYLE : ${styleInstruction}
        `;
    }

    // Utilisation de gemini-2.0-flash avec une température plus élevée pour "casser" le côté robotique
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 1.15, // Augmenté pour plus de variété lexicale
        topP: 0.95,
        topK: 40,
      }
    });

    const text = response.text;
    if (!text) throw new Error("Réponse vide.");

    return text;
  } catch (error) {
    console.error("Erreur narration:", error);
    throw error;
  }
};