
import { GoogleGenAI } from "@google/genai";
import { BodyPart, CombatState, DiceResult, LootType, NarrationStyle, NarratorMode } from "../types";

export const generateNarration = async (combatState: CombatState, apiKey: string): Promise<string> => {
  if (apiKey === 'DEMO') {
    return "**Nom** : Fiole de Sang Séché\n**Description** : Une petite fiole scellée par de la cire noire.\n**Effet** : Réactif d'alchimie. Donne +1 aux jets de Nécromancie.";
  }

  // Utilisation de Gemini 3 Flash : beaucoup plus de quota (15 RPM) et plus rapide
  const ai = new GoogleGenAI({ apiKey });

  try {
    const { weapon, bodyPart, result, target, style, mode, lootType } = combatState;
    
    let lengthInstruction = "";
    if (style === NarrationStyle.SIMPLE) lengthInstruction = "Réponse ultra-courte (10-15 mots).";
    if (style === NarrationStyle.MEDIUM) lengthInstruction = "Un paragraphe de 2-3 phrases.";
    if (style === NarrationStyle.IMMERSIVE) lengthInstruction = "Narration riche, gore et atmosphérique.";

    const systemInstruction = "Tu es un Maître du Donjon de Dark Fantasy. Ton style est gothique, sanglant et poétique. Tu écris en français. Ne sors JAMAIS du personnage. Pas de politesse, pas d'introduction.";
    
    let prompt = "";
    if (mode === NarratorMode.LOOT) {
        const location = target.trim() ? target : "cet endroit maudit";
        if (lootType === LootType.USEFUL) {
            prompt = `Le joueur fouille ${location} et trouve un OBJET UTILE. 
            ${lengthInstruction}
            REPECTE CE FORMAT STRICT :
            **Nom** : [Nom]
            **Description** : [Apparence]
            **Effet** : [Mécanique]`;
        } else {
            prompt = `Le joueur fouille ${location}. Décris un objet sans valeur mais macabre. 
            ${lengthInstruction}
            Format : **Nom** : [Nom] puis la description.`;
        }
    } else {
        const targetDesc = target.trim() ? target : "l'adversaire";
        const bodyPartDesc = (bodyPart && bodyPart !== BodyPart.UNSPECIFIED) ? bodyPart : "le corps";
        prompt = `Action : ${weapon} sur ${targetDesc} (${bodyPartDesc}). Résultat : ${result}. 
        ${lengthInstruction}
        Raconte la violence de l'instant.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Flash est plus stable pour les quotas gratuits
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.9,
        maxOutputTokens: 400,
        // On réduit le thinkingBudget pour Flash afin d'économiser du temps de réponse
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });

    const text = response.text;
    if (!text || text.trim().length < 3) {
        throw new Error("L'oracle reste silencieux... Réessaie.");
    }
    return text;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
