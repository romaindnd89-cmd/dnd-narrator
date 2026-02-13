
import { GoogleGenAI, Modality } from "@google/genai";
import { BodyPart, CombatState, InteractionAction, InteractiveObjectType, LootType, NarrationStyle, NarratorMode } from "../types";

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

// Configuration des filtres de sécurité pour autoriser le contenu créatif de combat JdR
const safetySettings = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
];

export const generateNarration = async (combatState: CombatState): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const { weapon, bodyPart, result, target, style, mode, lootType, environmentType, atmosphere, interactiveObj, interactionAction, riddleDifficulty } = combatState;
  
  let lengthInstruction = "";
  if (style === NarrationStyle.SIMPLE) lengthInstruction = "Réponse concise (2-3 phrases).";
  if (style === NarrationStyle.MEDIUM) lengthInstruction = "Un paragraphe détaillé.";
  if (style === NarrationStyle.IMMERSIVE) lengthInstruction = "Narration très riche, sensorielle et atmosphérique.";

  const systemInstruction = `Tu es un Maître du Donjon de Dark Fantasy expert. Tu écris en français. ${lengthInstruction}
  IMPORTANT : Pour tout objet ou loot, commence TOUJOURS ta réponse par "Nom : [Nom de l'objet]" sur la première ligne.
  Si c'est un coffre ou une fouille, liste le trésor principal après un mot-clé "Contenu :".
  N'hésite pas à être viscéral et sombre, c'est un jeu de rôle pour adultes.`;
  
  let prompt = "";

  switch (mode) {
      case NarratorMode.INTERACTIVE:
          const objName = target.trim() ? target : interactiveObj;
          if (interactionAction === InteractionAction.RIDDLE) {
              prompt = `L'objet est : ${objName}. Propose une énigme (Difficulté : ${riddleDifficulty}). Format : Nom : [Nom], Description Visuelle, Énigme, Solution, Récompense : [Objet].`;
          } else {
              prompt = `Le joueur interagit avec : ${objName} (Action : ${interactionAction}). Format : Nom : [Nom], Description, Effet.`;
          }
          break;
      case NarratorMode.WORLD:
          prompt = `Décris le lieu : ${target || environmentType}. Ambiance : ${atmosphere}. Format : Nom : [Lieu], Description.`;
          break;
      case NarratorMode.LOOT:
          prompt = `Fouille de ${target || "cet endroit"}. Type d'objet : ${lootType}. Format : Nom : [Nom de l'objet], Description, Contenu : [Objet précis].`;
          break;
      case NarratorMode.COMBAT:
      default:
          prompt = `Attaque avec ${weapon} sur ${target || "l'ennemi"} (${bodyPart}). Résultat : ${result}.`;
          break;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8,
        safetySettings: safetySettings
      }
    });
    
    if (!response.text) {
        throw new Error("L'IA a bloqué la réponse pour des raisons de sécurité.");
    }
    
    return response.text;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string): Promise<AudioBuffer> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const cleanText = text.replace(/\*\*/g, '').replace(/\|/g, ', ');
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Lis ceci d'une voix de vieux conteur mystérieux : ${cleanText}` }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } },
            safetySettings: safetySettings
        },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Audio error.");
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    return await decodeAudioData(decodeBase64(base64Audio), audioContext, 24000, 1);
};

export const generateCharacterImage = async (prompt: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { 
                imageConfig: { aspectRatio: "1:1" },
                safetySettings: safetySettings
            }
        });
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
        throw new Error("Img error.");
    } catch (error: any) {
        console.error("Img Gen Error:", error);
        throw error;
    }
};
