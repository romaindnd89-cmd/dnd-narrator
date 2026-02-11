
import { GoogleGenAI } from "@google/genai";
import { BodyPart, CombatState, DiceResult, LootType, NarrationStyle, NarratorMode } from "../types";

export const generateNarration = async (combatState: CombatState, apiKey: string): Promise<string> => {
  if (apiKey === 'DEMO') {
    return "**Nom** : Fiole de Sang Séché\n**Description** : Une petite fiole scellée par de la cire noire.\n**Effet** : Réactif d'alchimie. Donne +1 aux jets de Nécromancie.";
  }

  // Utilisation de Gemini 3 Pro pour plus de fiabilité sur les formats complexes
  const ai = new GoogleGenAI({ apiKey });

  try {
    const { weapon, bodyPart, result, target, style, mode, lootType } = combatState;
    
    let lengthInstruction = "";
    if (style === NarrationStyle.SIMPLE) lengthInstruction = "Sois très bref (1 phrase).";
    if (style === NarrationStyle.MEDIUM) lengthInstruction = "Fais un paragraphe court.";
    if (style === NarrationStyle.IMMERSIVE) lengthInstruction = "Sois très descriptif et immersif.";

    const systemInstruction = "Tu es un Maître du Donjon expert en Dark Fantasy. Ton style est viscéral, sombre et élégant. Tu ne sors JAMAIS du personnage. Tu ne donnes aucune introduction (pas de 'Voici...', pas de 'Tu trouves...').";
    
    let prompt = "";
    if (mode === NarratorMode.LOOT) {
        const location = target.trim() ? target : "cet endroit lugubre";
        if (lootType === LootType.USEFUL) {
            prompt = `Le joueur fouille ${location} et trouve un OBJET UTILE (consommable ou petit outil). 
            ${lengthInstruction}
            RÉPONDS EXCLUSIVEMENT AVEC CE FORMAT (SANS RIEN D'AUTRE) :
            **Nom** : [Nom de l'objet]
            **Description** : [L'apparence de l'objet]
            **Effet** : [L'utilité concrète]`;
        } else {
            prompt = `Le joueur fouille ${location}. Décris un objet sans valeur, étrange ou macabre. 
            ${lengthInstruction}
            Format : **Nom** : [Nom] puis la description.`;
        }
    } else {
        const targetDesc = target.trim() ? target : "l'ennemi";
        const bodyPartDesc = (bodyPart && bodyPart !== BodyPart.UNSPECIFIED) ? bodyPart : "le corps";
        prompt = `Action : ${weapon} sur ${targetDesc} (${bodyPartDesc}). Résultat du dé : ${result}. 
        ${lengthInstruction}
        Raconte la scène de façon sombre.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Passage au modèle Pro pour éviter les troncatures
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8,
        maxOutputTokens: 500,
        // On ajoute un petit budget de réflexion pour assurer la qualité du format
        thinkingConfig: { thinkingBudget: 100 }
      }
    });

    const text = response.text;
    if (!text || text.trim().length < 3) {
        throw new Error("L'esprit de la narration s'est évaporé... Réessaie.");
    }
    return text;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
