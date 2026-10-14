# D&D Narrator

Narrateur Dark Fantasy pour Maîtres du Donjon : combats, bestiaire, PNJ, énigmes, butin, table sonore et coffre des joueurs. Propulsé par l'API Google Gemini.

Forgé par [Romain.DnD89](https://www.instagram.com/romain.dnd89/).

## Lancer en local

Prérequis : Node.js 20 ou plus.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # version de production dans dist/
```

Chaque utilisateur saisit **sa propre clé Gemini** dans l'application (gratuite sur [Google AI Studio](https://aistudio.google.com/app/apikey)).
Elle est stockée uniquement dans son navigateur. **Ne mettez pas de clé dans un fichier `.env` pour le déploiement** :
elle serait publiée en clair dans le JavaScript.

Le bouton « mode démo » permet de visiter toute l'interface sans clé.

## Quota gratuit

- L'application essaie plusieurs modèles Gemini à la suite (liste dans `config/models.ts`). Chacun a son propre quota gratuit :
  quand l'un est épuisé, le suivant prend le relais automatiquement.
- Les modèles épuisés sont mis en pause (le temps indiqué par Google) et ne sont plus appelés inutilement.
- **Configuration › Quota du jour** affiche le nombre de requêtes et l'état de chaque modèle. Le quota se recharge à minuit, heure du Pacifique (9 h à Paris).
- La voix ne relit que le texte destiné aux joueurs, et une même narration n'est générée en audio qu'une fois.
- Les images IA sont **désactivées par défaut** : Google ne les inclut pas dans le quota gratuit.

Si Google retire un modèle, il est simplement ignoré. Pour en ajouter un nouveau, modifiez `config/models.ts`.

## Organisation du code

| Dossier | Rôle |
|---|---|
| `App.tsx` | Assemblage de l'écran et état global |
| `components/` | Interface (`NarratorForm`, `StoryBox`, `VirtualVault`, `SettingsModal`…) |
| `components/story/` | Blocs d'affichage d'une narration (monstre, énigme, objet, PNJ, monde, dés, erreur) |
| `components/vault/` | Carte joueur et synchro Supabase du coffre |
| `components/ui.tsx` | Petits composants réutilisables (boutons, listes, fenêtres) |
| `services/prompts.ts` | **Toutes les consignes envoyées à l'IA**, mode par mode |
| `services/geminiService.ts` | Appels Gemini (texte, voix, images) |
| `services/quota.ts` | Lecture des erreurs Google, bascule de modèle, compteur du jour |
| `services/demo.ts` | Réponses d'exemple du mode démo |
| `utils/parser.ts` | Lecture des réponses « ÉTIQUETTE : contenu » |
| `config/models.ts` | Liste des modèles Gemini |

## Android (Capacitor)

```bash
npm run build
npm run cap:sync
npm run cap:open
```
