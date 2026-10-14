import { GoogleGenAI, Modality } from '@google/genai';
import { CombatState } from '../types';
import { IMAGE_MODELS, TEXT_MODELS, TTS_MODELS, TTS_VOICE } from '../config/models';
import { buildNarrationRequest } from './prompts';
import { callWithFallback, NarratorError } from './quota';
import { demoNarration } from './demo';
import { readString, STORAGE_KEYS } from '../utils/storage';

export const DEMO_KEY = 'DEMO';

/** Vérification souple (Google peut changer le format) : au moins 30 caractères, sans espace. */
export const isPlausibleApiKey = (key: string) => /^[\w.-]{30,}$/.test(key.trim());
/** Les clés actuelles commencent par « AIza » : sert seulement à afficher un conseil. */
export const looksLikeGoogleKey = (key: string) => key.trim().startsWith('AIza');

export const getApiKey = (): string => readString(STORAGE_KEYS.apiKey)?.trim() || '';
export const isDemoMode = () => getApiKey() === DEMO_KEY;

let cachedClient: { key: string; ai: GoogleGenAI } | null = null;
const client = (): GoogleGenAI => {
  const apiKey = getApiKey();
  if (!apiKey || apiKey === DEMO_KEY) {
    throw new NarratorError('no_key', 'Aucune clé API : ajoutez votre clé Gemini dans Configuration.');
  }
  if (!cachedClient || cachedClient.key !== apiKey) cachedClient = { key: apiKey, ai: new GoogleGenAI({ apiKey }) };
  return cachedClient.ai;
};

export interface NarrationResult {
  text: string;
  model: string;
}

export const generateNarration = async (state: CombatState): Promise<NarrationResult> => {
  if (isDemoMode()) {
    await new Promise((r) => setTimeout(r, 700));
    return { text: demoNarration(state), model: 'démo' };
  }
  const ai = client();
  const { systemInstruction, prompt } = buildNarrationRequest(state);

  const { result, model } = await callWithFallback('text', TEXT_MODELS, async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { systemInstruction, temperature: 0.85 },
    });
    const text = response.text?.trim();
    if (!text) {
      const reason = response.candidates?.[0]?.finishReason;
      if (reason === 'SAFETY' || response.promptFeedback?.blockReason) {
        throw new NarratorError('blocked', 'Le contenu a été bloqué par les filtres de Google. Reformulez la demande.');
      }
      throw new NarratorError('overloaded', 'Réponse vide.');
    }
    return text;
  });
  return { text: result, model };
};

export const placeholderImage = (name: string) =>
  `https://placehold.co/600x600/0f1012/c5a059?text=${encodeURIComponent(name)}`;

/** Image IA (payante chez Google). Renvoie undefined en cas d'échec : l'appelant garde l'icône par défaut. */
export const generateItemImage = async (name: string, description = ''): Promise<string | undefined> => {
  if (isDemoMode()) return undefined;
  try {
    const ai = client();
    const prompt = `D&D fantasy art, object icon: ${name}. ${description}. Dark, gritty, cinematic lighting, centered on dark background. No text.`;
    const { result } = await callWithFallback('image', IMAGE_MODELS, async (model) => {
      const response = await ai.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: '1:1' } },
      });
      const part = response.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
      if (!part?.inlineData) throw new NarratorError('overloaded', 'Pas d’image reçue.');
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    });
    return result;
  } catch (e) {
    console.warn('[image] génération impossible', e);
    return undefined;
  }
};

/** Compatibilité avec CharacterSheet (composant pas encore branché dans l'appli). */
export const generateCharacterImage = async (name: string, description?: string): Promise<string> =>
  (await generateItemImage(name, description)) ?? placeholderImage(name);

// ---------- Synthèse vocale ----------

let audioCtx: AudioContext | null = null;
/** Un seul AudioContext pour toute l'appli (les navigateurs en limitent le nombre). */
export const getAudioContext = (): AudioContext => {
  if (!audioCtx || audioCtx.state === 'closed') {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new Ctx({ sampleRate: 24000 });
  }
  return audioCtx;
};

const pcmToBuffer = (base64: string, ctx: AudioContext, sampleRate = 24000): AudioBuffer => {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length - (bin.length % 2));
  for (let i = 0; i < bytes.length; i++) bytes[i] = bin.charCodeAt(i);
  const pcm = new Int16Array(bytes.buffer);
  const buffer = ctx.createBuffer(1, pcm.length, sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < pcm.length; i++) channel[i] = pcm[i] / 32768;
  return buffer;
};

// Cache : relire la même narration ne consomme pas de quota une deuxième fois.
const speechCache = new Map<string, AudioBuffer>();

export const generateSpeech = async (text: string): Promise<AudioBuffer> => {
  const clean = text.replace(/[*#_]/g, '').trim();
  const cached = speechCache.get(clean);
  if (cached) return cached;
  if (isDemoMode()) throw new NarratorError('no_key', 'La voix nécessite une clé API (indisponible en mode démo).');

  const ai = client();
  const { result } = await callWithFallback('tts', TTS_MODELS, async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: clean }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: TTS_VOICE } } },
      },
    });
    const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!data) throw new NarratorError('overloaded', 'Audio vide.');
    return data;
  });
  const buffer = pcmToBuffer(result, getAudioContext());
  if (speechCache.size > 20) speechCache.delete(speechCache.keys().next().value as string);
  speechCache.set(clean, buffer);
  return buffer;
};
