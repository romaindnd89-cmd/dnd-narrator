
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

export const generateNarration = async (combatState: CombatState): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { weapon, bodyPart, result, target, style, mode, lootType, environmentType, atmosphere, interactiveObj, interactionAction, riddleDifficulty } = combatState;
  
  let lengthInstruction = "";
  if (style === NarrationStyle.SIMPLE) lengthInstruction = "Réponse ultra-concise.";
  if (style === NarrationStyle.MEDIUM) lengthInstruction = "Un paragraphe court et percutant.";
  if (style === NarrationStyle.IMMERSIVE) lengthInstruction = "Narration immersive mais centrée sur l'instant présent.";

  const systemInstruction = `Tu es un Maître du Donjon expert en Dark Fantasy. Tu écris en français. ${lengthInstruction}
  
  STRUCTURE STRICTE POUR EFFET RÉACTIF (TOUCHER) :
  1. "Nom : [Titre de l'objet/piège]"
  2. "Description : [Ce qui arrive physiquement au contact]"
  3. "Effet [BONUS] : [Petit avantage léger ou effet drôle/cosmétique]"
  4. "Effet [MALUS] : [Petite gêne légère ou effet drôle/cosmétique]"
  
  RÈGLES POUR LES EFFETS :
  - Ils doivent être LÉGERS (ex: +1 au prochain jet, éternuements magiques, cheveux qui changent de couleur, -1m de vitesse, etc.).
  - Ils peuvent être DRÔLES ou ABSURDES.
  - Pas d'énigme ni de solution pour le mode TOUCHER.
  
  STRUCTURE POUR AUTRES MODES :
  - Nom : [Titre]
  - Description : [Narration]
  - Contenu : [Objet si fouille]
  - Effet : [Mécanique si combat ou autre]`;
  
  let prompt = "";
  switch (mode) {
      case NarratorMode.INTERACTIVE:
          const objName = target.trim() ? target : interactiveObj;
          if (interactionAction === InteractionAction.TOUCH) {
              prompt = `Le joueur touche ou interagit avec ${objName}. Invente une réaction magique ou physique immédiate. Propose systématiquement DEUX issues légères : un Effet [BONUS] et un Effet [MALUS]. Sois créatif et surprenant.`;
          } else if (interactionAction === InteractionAction.RIDDLE) {
              prompt = `Le joueur examine ${objName} (Difficulté: ${riddleDifficulty}). Donne l'énigme, la solution MJ, le Succès et l'Échec.`;
          } else {
              prompt = `Le joueur ouvre ${objName}. Décris l'action et donne le Contenu.`;
          }
          break;
      case NarratorMode.LOOT:
          prompt = `Le joueur fouille (${lootType}). Donne un objet TRÈS ORIGINAL dans "Contenu".`;
          break;
      case NarratorMode.WORLD:
          prompt = `Décris ${target || environmentType}. Ambiance : ${atmosphere}.`;
          break;
      default:
          prompt = `Combat : ${weapon} sur ${target || "l'ennemi"}. Résultat : ${result}.`;
          break;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview', 
    contents: prompt,
    config: { systemInstruction, temperature: 1.0 }
  });
  
  return response.text || "L'oracle reste silencieux...";
};

export const generateSpeech = async (text: string): Promise<AudioBuffer> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const cleanText = text.replace(/\*\*/g, '').replace(/\|/g, ', ');
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: cleanText }] }],
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const enrichedPrompt = `A 2D digital art game icon of a fantasy item: ${prompt}. Detailed, dark fantasy, black background.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: enrichedPrompt }] },
            config: { imageConfig: { aspectRatio: "1:1" } }
        });
        if (response.candidates?.[0]?.content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        return "https://placehold.co/512x512/0f1012/c5a059?text=Objet";
    } catch (e) {
        return "https://placehold.co/512x512/0f1012/c5a059?text=Objet";
    }
};
