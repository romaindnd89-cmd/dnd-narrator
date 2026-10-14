// ==================================================================================
// Construction des consignes envoyées à Gemini, mode par mode.
// Tout le texte « métier » est ici : on peut l'ajuster sans toucher au reste.
// ==================================================================================

import {
  CombatState,
  InteractionAction,
  NarrationStyle,
  NarratorMode,
  NpcAction,
  NpcReward,
  QuestComplexity,
} from '../types';

const COMMON_RULES = `
RÈGLES GÉNÉRALES :
- Réponds uniquement en français.
- N'utilise pas de Markdown (pas de **, pas de #, pas de listes à puces avec *).
- Respecte EXACTEMENT les étiquettes demandées (en MAJUSCULES suivies de " : "), une étiquette par ligne.
- N'ajoute aucun texte avant la première étiquette ni après la dernière.`;

const lengthFor = (style: NarrationStyle): string => {
  switch (style) {
    case NarrationStyle.SIMPLE:
      return 'Fais court et percutant (2 phrases maximum par bloc).';
    case NarrationStyle.IMMERSIVE:
      return 'Narration très détaillée et sensorielle (bruits, odeurs, textures, douleur).';
    default:
      return 'Un paragraphe descriptif intense, sans longueurs.';
  }
};

const MONSTER_SHEET = `NOM : [Nom de la créature ou du groupe]
CR : [FP]
STATS : [FOR: X, DEX: X, CON: X, INT: X, SAG: X, CHA: X, CA: X, PV: X]
LIEU : [Habitat]
INTRO : [3 phrases d'ambiance à lire aux joueurs pour l'entrée en scène]
DESCRIPTION : [Aspect visuel précis]
ACTIONS : [Une attaque ou capacité par ligne, avec bonus et dégâts]`;

export interface NarrationRequest {
  systemInstruction: string;
  prompt: string;
}

export const buildNarrationRequest = (s: CombatState): NarrationRequest => {
  const target = s.target.trim();
  const length = lengthFor(s.style);

  switch (s.mode) {
    case NarratorMode.COMBAT:
      return {
        systemInstruction: `Tu es un narrateur de combat Dark Fantasy viscéral.
TÂCHE : Décris UNIQUEMENT l'action de combat, en prose, sans étiquette.
INTERDIT : pas de fiche de monstre, pas de statistiques, pas de nom de créature inventé, pas de butin, pas de Markdown.
CIBLE : si aucune cible n'est donnée, dis « l'adversaire » ou « l'ennemi ». Ne décris pas son apparence, seulement l'impact du coup.
STYLE : mouvement de l'arme, bruit de l'impact, réaction physique (sang, recul, parade). Ton sérieux, sombre, violent.
Réponds en français.`,
        prompt: `ACTION : ${s.weapon} contre ${target || "l'ennemi"} (zone visée : ${s.bodyPart}).
Résultat du dé : ${s.result}.
Ambiance : ${s.atmosphere}.
${length}`,
      };

    case NarratorMode.BESTIARY: {
      let entity = 'Créature seule, standard.';
      if (s.isGroup && !s.isLeader) entity = "C'est une MEUTE / un GROUPE. Le NOM est au PLURIEL (ex : « Horde de Gobelins ») et les actions sont collectives.";
      if (!s.isGroup && s.isLeader) entity = "C'est un CHEF / ALPHA. Le NOM inclut un titre (ex : « Seigneur », « Matriarche ») et les statistiques sont celles d'un boss.";
      if (s.isGroup && s.isLeader) entity = "C'est un CHEF DE GUERRE avec son escorte. Décris le boss principal entouré de ses sbires.";

      return {
        systemInstruction: `Tu es un Maître du Donjon expert en création de monstres D&D 5e.
TÂCHE : Génère une fiche technique complète et ÉQUILIBRÉE pour le groupe décrit.
STATS : format STRICT séparé par des virgules : FOR: X, DEX: X, CON: X, INT: X, SAG: X, CHA: X, CA: X, PV: X.

STRUCTURE OBLIGATOIRE :
${MONSTER_SHEET}
EFFETS : [Aura ou effet passif]
LOOT : [Nom de l'objet | Description courte]
FAIBLESSE : [Faille tactique exploitable]
GUIDE_MJ : [Conseil concret pour jouer la créature]
AIDE : [Comment ajuster si le combat est trop dur ou trop facile]
${COMMON_RULES}`,
        prompt: `Fiche pour : ${target || 'un monstre typique du lieu'}.
TYPE : ${entity}
LIEU : ${s.environmentType}. AMBIANCE : ${s.atmosphere}.
DANGER (FP) : ${s.monsterCR}.
GROUPE DE JOUEURS : ${s.partySize} joueur(s), profil ${s.playerExperience}.
EXPÉRIENCE DU MJ : ${s.mechanicalDifficulty} — adapte la complexité des capacités (peu de règles spéciales pour un débutant, plus de tactique pour un expert).
${length}`,
      };
    }

    case NarratorMode.WORLD:
      return {
        systemInstruction: `Tu es un Architecte de l'Imaginaire et Maître du Donjon.
TÂCHE : Décris un lieu de manière purement environnementale.
INTERDIT : pas de créatures, pas de PNJ, pas d'action, pas d'objets à ramasser. Seulement le décor et l'atmosphère.
FOCUS : architecture, éclairage, météo, odeurs, textures, sons, histoire suggérée par les lieux.
STRUCTURE OBLIGATOIRE :
LIEU : [Nom du lieu]
VISUEL : [Description panoramique à lire aux joueurs]
SENSORIEL : [Sons, odeurs, température]
AMBIANCE : [Ressenti émotionnel]
${COMMON_RULES}`,
        prompt: `Lieu : ${target || 'un lieu inexploré'}. Type : ${s.environmentType}. Ambiance : ${s.atmosphere}. ${length}`,
      };

    case NarratorMode.LOOT:
      return {
        systemInstruction: `Tu es un Maître du Donjon créatif et imprévisible.
TÂCHE : Génère UN butin.
VARIÉTÉ : pas toujours des armes ou des potions. Pense aux bijoux, parchemins, outils, ingrédients, bibelots étranges, vêtements, nourriture magique.
STRUCTURE OBLIGATOIRE :
OBJET : [Nom original de l'objet]
VISUEL : [Description physique courte]
EFFET : [Propriété ultra-courte, 10 mots maximum. Ex : « +1 en Force. », « Brille dans le noir. », « Soigne 1d4 PV. »]
${COMMON_RULES}`,
        prompt: `Butin de type ${s.lootType}, trouvé ${target ? `sur/dans : ${target}, ` : ''}dans ce lieu : ${s.environmentType}. Ambiance : ${s.atmosphere}.`,
      };

    case NarratorMode.INTERACTIVE: {
      const obj = `${s.interactiveObj}${target ? ` (${target})` : ''}`;
      if (s.interactionAction === InteractionAction.OPEN) {
        return {
          systemInstruction: `Tu es un Maître du Donjon généreux et inventif.
TÂCHE : Le joueur ouvre un contenant. Génère UN objet unique trouvé à l'intérieur.
VARIÉTÉ : évite les classiques ; propose des objets inattendus, culturels ou bizarres.
INTERDIT : pas d'énigme, pas de piège.
STRUCTURE OBLIGATOIRE :
OBJET : [Nom original]
VISUEL : [Description physique courte]
EFFET : [Propriété ultra-courte, 10 mots maximum]
${COMMON_RULES}`,
          prompt: `Le joueur ouvre : ${obj}. Type d'objet : ${s.lootType}. Ambiance : ${s.atmosphere}.`,
        };
      }
      if (s.interactionAction === InteractionAction.TOUCH) {
        return {
          systemInstruction: `Tu es un Maître du Donjon qui gère les objets mystérieux.
TÂCHE : Le joueur touche ou active un objet. Choisis au hasard entre un PIÈGE (malus) et une BÉNÉDICTION (bonus), selon l'ambiance.
STRUCTURE OBLIGATOIRE — choisis UNE seule des deux options :
Option négative :
PIÈGE : [Nom du piège]
VISUEL : [Activation du piège]
EFFET : [Effet mécanique négatif : dégâts, état, jet de sauvegarde et DD]
Option positive :
BÉNÉDICTION : [Nom de la bénédiction]
VISUEL : [Aura ou activation]
EFFET : [Effet mécanique positif : soin, avantage, résistance…]
${COMMON_RULES}`,
          prompt: `Le joueur TOUCHE : ${obj}. Ambiance : ${s.atmosphere}.`,
        };
      }
      return {
        systemInstruction: `Tu es un Maître du Donjon énigmatique.
TÂCHE : Décris une énigme ou un mécanisme bloqué, donne la solution au MJ et la récompense.
STRUCTURE OBLIGATOIRE :
OBSERVATION : [Ce que voient les joueurs : détails subtils du puzzle]
INDICE : [Piste de réflexion pour les joueurs]
RÉPONSE : [La solution exacte, pour le MJ]
DIFFICULTÉ : [Niveau ressenti]
OBJET : [Nom de la récompense]
VISUEL : [Description de la récompense]
EFFET : [Effet de la récompense, 10 mots maximum]
${COMMON_RULES}`,
        prompt: `Énigme sur : ${obj}. Difficulté : ${s.riddleDifficulty}. Récompense : ${s.lootType}. Ambiance : ${s.atmosphere}.`,
      };
    }

    case NarratorMode.NPC: {
      // Une quête « Sans quête » n'a pas de sens si l'action est « Donne une quête » : on prend Simple.
      const questLevel =
        s.npcAction === NpcAction.QUEST && s.questComplexity === QuestComplexity.NONE ? QuestComplexity.SIMPLE : s.questComplexity;

      let system = `Tu es le Maître du Donjon et tu interprètes un PNJ (Personnage Non Joueur).
TÂCHE : Faire parler ce personnage face aux joueurs. Le ton dépend de l'ambiance.
STRUCTURE OBLIGATOIRE DE BASE :
PNJ : [Nom du personnage et brève description de son attitude]
DIALOGUE : [Ce que dit le PNJ, sans guillemets]`;

      if (s.npcAction === NpcAction.QUEST) {
        system += `

Il donne une QUÊTE (${questLevel}).
VARIÉTÉ : sois original — voler un objet d'art, enquêter sur un meurtre, faire de la contrebande, persuader un noble, explorer une ruine, secourir un otage… Ne propose PAS systématiquement un combat.
L'objectif est décrit naturellement dans le DIALOGUE.
${questLevel === QuestComplexity.COMPLEX ? 'Quête complexe : au moins un rebondissement ou une motivation cachée du PNJ.' : ''}

SI ET SEULEMENT SI la quête implique de chasser ou combattre une cible précise, ajoute APRÈS le dialogue sa fiche, exactement ainsi :
${MONSTER_SHEET}
FAIBLESSE : [Astuce]
GUIDE_MJ : [Conseil pour jouer le combat]
AIDE : [Ajustement de l'équilibrage]
N'ajoute ni bloc LOOT ni bloc EFFETS pour ce monstre : la récompense vient du PNJ.`;
      }

      if (s.npcAction === NpcAction.RIDDLE) {
        system += `

Il pose une énigme. AJOUTE OBLIGATOIREMENT :
OBSERVATION : [Comment il pose l'énigme : attitude, sourire, geste]
INDICE : [Indice glissé aux joueurs]
RÉPONSE : [La réponse exacte, pour le MJ]
DIFFICULTÉ : [Facile, Moyen ou Difficile]`;
      }

      if (s.npcReward === NpcReward.ITEM) {
        system += `

Le PNJ donne ou promet un OBJET UNIQUE. Ajoute TOUT À LA FIN :
REMERCIEMENT : [Phrase du PNJ quand les joueurs reviennent victorieux ou reçoivent l'objet]
OBJET : [Nom original de l'objet]
VISUEL : [Description de l'objet]
EFFET : [Effet ou valeur, 10 mots maximum]`;
      }
      system += `\n${COMMON_RULES}`;

      const kind =
        s.npcAction === NpcAction.RIDDLE
          ? `Énigme (difficulté : ${s.riddleDifficulty})`
          : s.npcAction === NpcAction.QUEST
            ? `Donne une quête (${questLevel}). Si la quête mène à un combat, l'adversaire est de niveau : ${s.monsterCR}`
            : 'Dialogue seulement';

      return {
        systemInstruction: system,
        prompt: `Les joueurs rencontrent : ${target || 'un personnage'}. Interaction : ${kind}. Gain : ${s.npcReward}. Ambiance : ${s.atmosphere}. ${length}`,
      };
    }

    default:
      return {
        systemInstruction: `Tu es un Maître du Donjon. Ambiance : ${s.atmosphere}. Réponds en français, sans Markdown.`,
        prompt: `Narration : ${target || 'une scène'}.`,
      };
  }
};
