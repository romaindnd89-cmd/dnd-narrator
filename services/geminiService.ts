
import { GoogleGenAI } from "@google/genai";
import { BodyPart, CombatState, DiceResult, LootType, NarrationStyle, NarratorMode } from "../types";

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
  if (apiKey === 'DEMO') {
    return new Promise((resolve) => {
        setTimeout(() => {
            const text = combatState.mode === NarratorMode.COMBAT
                ? `[MODE DÉMO] Le guerrier lève son arme (${combatState.weapon}) et frappe avec précision. (Utilisez une vraie clé API pour une narration complète).`
                : `[MODE DÉMO] En fouillant, vous trouvez une vieille pièce de monnaie rouillée.`;
            resolve(text);
        }, 1000);
    });
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const { weapon, bodyPart, result, target, style, mode, lootType } = combatState;
    
    let styleInstruction = "";
    switch (style) {
        case NarrationStyle.SIMPLE:
            styleInstruction = "Format : Une seule phrase courte et brutale.";
            break;
        case NarrationStyle.MEDIUM:
            styleInstruction = "Format : 2 phrases. Action et conséquence.";
            break;
        case NarrationStyle.IMMERSIVE:
        default:
            styleInstruction = "Format : Un paragraphe riche et viscéral. Utilise le vocabulaire de la dark fantasy (sang, acier, terreur, poussière).";
            break;
    }

    let systemInstruction = "Tu es un Maître du Donjon expert en narration Dark Fantasy. Ton style est sérieux, sombre et épique. Ne donne jamais de règles techniques (ex: 'faites un jet'), décris uniquement l'action.";

    let prompt = "";

    if (mode === NarratorMode.LOOT) {
        const location = target.trim() ? target : "un lieu sombre";
        const randomJunkCategory = JUNK_CATEGORIES[Math.floor(Math.random() * JUNK_CATEGORIES.length)];
        prompt = `Décris un objet trouvé dans ${location}. Type : ${lootType === LootType.USEFUL ? "Petit objet utile" : "Bric-à-brac inutile"}. Thème : ${randomJunkCategory}. ${styleInstruction}`;
    } else {
        const targetDesc = target.trim() ? target : "l'adversaire";
        const bodyPartDesc = (bodyPart && bodyPart !== BodyPart.UNSPECIFIED) ? bodyPart : "une zone vitale";
        prompt = `Décris cette action de combat : Arme : ${weapon}. Cible : ${targetDesc}. Zone : ${bodyPartDesc}. Résultat : ${result}. ${styleInstruction}. Ne dis jamais 'le combat continue'.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 1.0,
      }
    });

    return response.text || "La vision s'obscurcit... (Réponse vide)";
  } catch (error: any) {
    console.error("Erreur Gemini:", error);
    // On renvoie l'erreur brute pour que App.tsx puisse la traiter
    throw error;
  }
};
