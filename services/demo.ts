// Réponses d'exemple pour le mode démo (sans clé API) : permet de visiter
// toute l'interface sans consommer de quota.

import { CombatState, InteractionAction, NarratorMode, NpcAction, NpcReward } from '../types';

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const demoNarration = (s: CombatState): string => {
  const target = s.target.trim();
  switch (s.mode) {
    case NarratorMode.COMBAT:
      return pick([
        `La lame décrit un arc sifflant et mord ${target || "l'adversaire"} juste sous la clavicule. Un craquement sec, un jet chaud et sombre : l'ennemi recule d'un pas, la mâchoire serrée, le souffle brisé.`,
        `${target || "L'ennemi"} lève son bouclier une fraction de seconde trop tard. Le choc résonne dans tout le bras, le métal hurle, et une gerbe d'étincelles éclaire brièvement son regard affolé.`,
      ]);

    case NarratorMode.BESTIARY:
      return `NOM : ${target || 'Goule des Cryptes'}
CR : FP 2
STATS : FOR: 13, DEX: 15, CON: 10, INT: 7, SAG: 10, CHA: 6, CA: 13, PV: 36
LIEU : Cryptes oubliées, ossuaires humides
INTRO : Un raclement d'ongles sur la pierre résonne derrière les sarcophages. L'odeur de chair froide envahit la salle. Deux yeux laiteux s'allument dans l'obscurité.
DESCRIPTION : Silhouette décharnée à la peau grise tendue sur les os, mâchoire disloquée garnie de dents noircies, griffes longues comme des dagues.
ACTIONS : Morsure. +2 au toucher, 2d6+2 perforants.
Griffes. +4 au toucher, 2d4+2 tranchants ; JS Constitution DD 10 ou paralysé 1 minute (nouveau jet à chaque tour).
EFFETS : Les torches vacillent à 3 m de la créature.
LOOT : Anneau d'os gravé | Un anneau taillé dans une phalange, tiède au toucher.
FAIBLESSE : Craint la lumière radiante : désavantage aux attaques au contact d'une flamme sacrée.
GUIDE_MJ : Faites-la surgir du plafond ou d'un sarcophage. Elle vise d'abord le personnage le plus isolé.
AIDE : Groupe en difficulté : retirez la paralysie. Trop facile : ajoutez une deuxième goule.`;

    case NarratorMode.WORLD:
      return `LIEU : ${target || 'La Chapelle Engloutie'}
VISUEL : Une nef effondrée à moitié noyée dans une eau noire et immobile. Des piliers brisés émergent comme des côtes de géant, et un vitrail fendu laisse filtrer une lumière verdâtre.
SENSORIEL : Le clapotis lent de gouttes qui tombent de la voûte. Une odeur de vase et d'encens rance. L'air est froid, humide, presque lourd à respirer.
AMBIANCE : Un recueillement inquiet, comme si le lieu retenait encore une prière inachevée.`;

    case NarratorMode.LOOT:
      return `OBJET : Boussole du Marin Perdu
VISUEL : Un boîtier de cuivre vert-de-gris dont l'aiguille tremble sans jamais indiquer le nord.
EFFET : Indique la direction de l'eau potable la plus proche.`;

    case NarratorMode.INTERACTIVE:
      if (s.interactionAction === InteractionAction.TOUCH) {
        return pick([
          `PIÈGE : Morsure de l'Idole
VISUEL : Les yeux de l'objet s'illuminent d'un rouge sang et des aiguilles jaillissent de sa surface.
EFFET : 2d4 perforants, JS Constitution DD 12 ou empoisonné 1 heure.`,
          `BÉNÉDICTION : Souffle des Anciens
VISUEL : Une brume dorée s'élève et s'enroule doucement autour du poignet du joueur.
EFFET : Avantage au prochain jet de sauvegarde.`,
        ]);
      }
      if (s.interactionAction === InteractionAction.RIDDLE) {
        return `OBSERVATION : Sur le couvercle, trois cadrans gravés : un soleil, une lune et un œil fermé. Une inscription : « Je dévore tout, mais la lumière me tue. »
INDICE : Ce qui dévore tout disparaît dès qu'on allume une torche.
RÉPONSE : L'obscurité. Il faut tourner l'œil fermé vers le haut.
DIFFICULTÉ : Facile
OBJET : Lanterne de Veille
VISUEL : Une petite lanterne de fer noir à la flamme bleutée.
EFFET : Révèle les créatures invisibles à 3 mètres.`;
      }
      return `OBJET : Flûte en os de corbeau
VISUEL : Une flûte légère, percée de sept trous, ornée de plumes noires.
EFFET : Attire tous les oiseaux à 100 mètres.`;

    case NarratorMode.NPC: {
      let out = `PNJ : ${target || 'Maître Aldric, aubergiste borgne'}, essuyant un verre sans jamais quitter les joueurs des yeux.
DIALOGUE : Vous n'êtes pas d'ici, ça se voit. Asseyez-vous. Les gens qui posent des questions dans cette ville finissent souvent dans le canal… mais vous avez l'air de savoir vous défendre.`;
      if (s.npcAction === NpcAction.QUEST) {
        out = `PNJ : ${target || 'Maître Aldric, aubergiste borgne'}, la voix basse, penché au-dessus du comptoir.
DIALOGUE : Mon registre a disparu cette nuit. Il contient les noms de tous ceux qui ont dormi ici… y compris quelques nobles qui préféreraient l'oublier. Retrouvez-le avant qu'il ne serve à les faire chanter, et je saurai me montrer reconnaissant.`;
      }
      if (s.npcAction === NpcAction.RIDDLE) {
        out += `
OBSERVATION : Il pose une pièce sur le comptoir et sourit en coin.
INDICE : On le paie sans jamais le posséder.
RÉPONSE : Le temps.
DIFFICULTÉ : Moyen`;
      }
      if (s.npcReward === NpcReward.ITEM) {
        out += `
REMERCIEMENT : Je savais que vous étiez différents des autres. Tenez, ce vieux machin vous servira mieux qu'à moi.
OBJET : Chope du Voyageur
VISUEL : Une chope d'étain cabossée, gravée d'une rose des vents.
EFFET : Se remplit d'eau fraîche une fois par jour.`;
      }
      return out;
    }

    default:
      return 'Le destin retient son souffle…';
  }
};
