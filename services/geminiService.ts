
import { GoogleGenAI, Modality } from "@google/genai";
import { BodyPart, CombatState, InteractionAction, InteractiveObjectType, LootType, NarrationStyle, NarratorMode } from "../types";

// Fonction pour récupérer la clé : priorité à la saisie manuelle stockée en local
const getApiKey = () => {
  const localKey = localStorage.getItem('dnd_api_key');
  if (localKey && localKey !== "DEMO") return localKey;
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
  if (!apiKey) throw new Error("Veuillez configurer votre clé API dans le menu 'Clé API'.");
  
  const ai = new GoogleGenAI({ apiKey });
  const { weapon, bodyPart, result, target, style, mode, lootType, environmentType, atmosphere, interactiveObj, interactionAction, riddleDifficulty } = combatState;
  
  let lengthInstruction = "";
  if (style === NarrationStyle.SIMPLE) lengthInstruction = "Réponse concise (2-3 phrases).";
  if (style === NarrationStyle.MEDIUM) lengthInstruction = "Un paragraphe détaillé.";
  if (style === NarrationStyle.IMMERSIVE) lengthInstruction = "Narration très riche, sensorielle et atmosphérique.";

  const systemInstruction = `Tu es un Maître du Donjon de Dark Fantasy expert. Tu écris en français. ${lengthInstruction}
  IMPORTANT : Pour tout objet ou loot, commence TOUJOURS ta réponse par "Nom : [Nom de l'objet]" sur la première ligne.
  N'hésite pas à être viscéral et sombre.`;
  
  let prompt = "";
  switch (mode) {
      case NarratorMode.INTERACTIVE:
          const objName = target.trim() ? target : interactiveObj;
          prompt = interactionAction === InteractionAction.RIDDLE 
            ? `L'objet est : ${objName}. Propose une énigme (Difficulté : ${riddleDifficulty}).`
            : `Le joueur interagit avec : ${objName} (Action : ${interactionAction}).`;
          break;
      case NarratorMode.WORLD:
          prompt = `Décris le lieu : ${target || environmentType}. Ambiance : ${atmosphere}.`;
          break;
      case NarratorMode.LOOT:
          prompt = `Fouille de ${target || "cet endroit"}. Type d'objet : ${lootType}.`;
          break;
      case NarratorMode.COMBAT:
      default:
          prompt = `Attaque avec ${weapon} sur ${target || "l'ennemi"} (${bodyPart}). Résultat : ${result}.`;
          break;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview', 
    contents: prompt,
    config: { systemInstruction, temperature: 0.8 }
  });
  
  return response.text || "L'IA n'a pas pu générer de texte.";
};

export const generateSpeech = async (text: string): Promise<AudioBuffer> => {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const cleanText = text.replace(/\*\*/g, '').replace(/\|/g, ', ');
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Lis ceci : ${cleanText}` }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } },
        },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Audio error.");
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    return await decodeAudioData(decodeBase64(base64Audio), audioContext, 24000, 1);
};

export const generateCharacterImage = async (prompt: string): Promise<string> => {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: "1:1" } }
    });
    for (const part of response.candidates?.[0]?.content.parts || []) {
        if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    throw new Error("Img error.");
};
