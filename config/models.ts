// ==================================================================================
// Modèles Gemini utilisés par l'application, du plus souhaité au dernier recours.
//
// Chaque modèle a son PROPRE quota gratuit chez Google. Quand un modèle répond
// « quota épuisé » (erreur 429), l'application passe automatiquement au suivant.
// Plusieurs modèles = plusieurs quotas cumulés, donc beaucoup moins de blocages.
//
// Si Google retire un modèle, il est simplement ignoré (erreur 404) : il suffit
// de mettre cette liste à jour, rien d'autre à modifier.
// Liste des modèles : https://ai.google.dev/gemini-api/docs/models
// ==================================================================================

export const TEXT_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
] as const;

export const TTS_MODELS = [
  'gemini-3.8-flash-tts',
  'gemini-3.8-flash-lite-tts',
  'gemini-2.5-flash-preview-tts',
] as const;

// Attention : la génération d'images n'a PAS de quota gratuit dans l'API Gemini.
// Elle est donc désactivée par défaut (option dans Configuration).
export const IMAGE_MODELS = ['gemini-3.1-flash-image', 'gemini-2.5-flash-image'] as const;

export const TTS_VOICE = 'Kore';
