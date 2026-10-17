import type { Messages } from "./ru";

/*
 * French typography: a no-break space ( ) goes before « : ? ! ; » and inside « guillemets »;
 * thousands are grouped with a narrow no-break space ( ).
 */
export const fr: Messages = {
  triggers: {
    boredom: {
      label: "Ennui",
      hint: "Envie de nouveauté",
      ask: "Je m’ennuyais",
      noun: "l’ennui",
      because: "par ennui",
      reason: "par ennui",
      advice:
        "L’ennui est une faim de nouveauté, et le fil la nourrit de calories vides. Gardez à portée de main une nouveauté « vivante » : un livre, une énigme, un nouvel itinéraire.",
    },
    fatigue: {
      label: "Fatigue",
      hint: "Plus d’énergie pour rien",
      ask: "Je n’avais plus d’énergie",
      noun: "la fatigue",
      because: "à cause de la fatigue",
      reason: "par fatigue",
      advice:
        "Un cerveau fatigué choisit la facilité. Le fil ne repose pas — il achève. Essayez 3 minutes les yeux fermés, ou un verre d’eau à la fenêtre.",
    },
    stress: {
      label: "Stress",
      hint: "Envie de fuir",
      ask: "Le stress montait",
      noun: "le stress",
      because: "à cause du stress",
      reason: "à cause du stress",
      advice:
        "Le fil promet une évasion, mais l’angoisse revient plus forte ensuite. D’abord le corps : une longue expiration, du mouvement, de l’eau froide — les décisions après.",
    },
    loneliness: {
      label: "Solitude",
      hint: "Besoin de contact",
      ask: "La solitude me pesait",
      noun: "la solitude",
      because: "par solitude",
      reason: "par solitude",
      advice:
        "La vie des autres dans le fil ne remplace pas un vrai contact. Un court message à une personne réelle apporte plus qu’une heure de vidéos.",
    },
    procrastination: {
      label: "Procrastination",
      hint: "Je repousse une tâche",
      ask: "Je n’avais pas envie de m’y mettre",
      noun: "la procrastination",
      because: "par procrastination",
      reason: "quand vous repoussez une tâche",
      advice:
        "Le fil est le moyen le plus confortable de ne pas commencer. Réduisez la tâche à une étape de 2 minutes et ne faites que celle-là.",
    },
    autopilot: {
      label: "Pilote auto",
      hint: "Ouvert sans y penser",
      ask: "Ça s’est ouvert tout seul, par réflexe",
      noun: "le pilote automatique",
      because: "en pilote automatique",
      reason: "en pilote automatique",
      advice:
        "L’habitude se déclenche avant la pensée. Retirez les apps de l’écran d’accueil et posez le téléphone écran contre la table — un peu de friction casse le pilote automatique.",
    },
    relax: {
      label: "Détente",
      hint: "Envie de souffler",
      ask: "J’avais envie de décompresser",
      noun: "l’envie de se détendre",
      because: "par envie de se détendre",
      reason: "quand vous voulez décompresser",
      advice:
        "Le fil promet du repos, mais en donne rarement. Choisissez une pause qui allège vraiment : une douche, de la musique les yeux fermés, cinq minutes d’étirements.",
    },
    sleepless: {
      label: "Insomnie",
      hint: "Impossible de dormir",
      ask: "Je n’arrivais pas à dormir",
      noun: "l’insomnie",
      because: "à cause de l’insomnie",
      reason: "quand le sommeil ne vient pas",
      advice:
        "Un écran lumineux réveille encore plus le cerveau. Si le sommeil ne vient pas, baissez la lumière et lisez un livre papier une dizaine de minutes — et rechargez le téléphone hors de la chambre.",
    },
    other: {
      label: "Autre",
      hint: "Une autre raison",
      ask: "Autre chose",
      noun: "d’autres raisons",
      because: "pour d’autres raisons",
      reason: "pour diverses raisons",
      advice:
        "Quelques mots sur ce qui s’est passé juste avant aident à repérer ce qui se répète. Notez-les — tout deviendra plus clair.",
    },
  },

  feedApps: {
    other: "Autre",
  },

  categories: {
    body: { label: "Corps", description: "Bouger en 1 à 3 minutes" },
    mind: { label: "Esprit", description: "Des défis qui réveillent la tête" },
    facts: { label: "Faits", description: "Un peu de nouveauté utile" },
  },

  items: {
    squats: {
      title: "15 squats",
      description:
        "Un afflux de sang au cerveau et une dopamine méritée, celle de l’effort accompli.",
      steps: [
        "Levez-vous, pieds écartés à la largeur des épaules.",
        "Faites 15 squats lents, le dos droit.",
        "À la fin, inspirez profondément et sentez la chaleur monter.",
      ],
    },
    "neck-shoulders": {
      title: "Nuque et épaules",
      description: "Dénoue les tensions accumulées à force de regarder le téléphone.",
      steps: [
        "Inclinez lentement la tête vers l’épaule droite, puis vers la gauche — 3 fois de chaque côté.",
        "Faites 10 cercles des épaules vers l’arrière.",
        "Croisez les mains dans le dos et ouvrez la poitrine pendant 3 respirations.",
      ],
    },
    "eyes-20-20": {
      title: "Pause yeux 20-20-20",
      description: "L’écran fixe la vue à 30 cm. Offrez un horizon à vos yeux.",
      steps: [
        "Approchez-vous d’une fenêtre ou trouvez le point le plus éloigné de la pièce.",
        "Regardez-le 20 secondes, en clignant des yeux naturellement.",
        "Couvrez vos yeux avec les paumes pendant 20 secondes, puis clignez lentement 10 fois.",
      ],
    },
    "cold-water": {
      title: "Eau froide",
      description:
        "Un visage rafraîchi et un verre d’eau — une remise à zéro express pour les nerfs.",
      steps: [
        "Passez-vous de l’eau froide sur le visage ou gardez les poignets sous le robinet 30 secondes.",
        "Buvez lentement un verre d’eau.",
        "Remarquez ce qui a changé dans votre corps.",
      ],
    },
    "walk-3": {
      title: "Trois minutes de marche",
      description: "Bouger sans but — le meilleur redémarrage pour l’attention.",
      steps: [
        "Laissez le téléphone sur la table.",
        "Marchez trois minutes dans l’appartement, au bureau ou dans l’escalier.",
        "Repérez trois nouveaux détails en chemin.",
      ],
    },
    "tidy-surface": {
      title: "Ranger une surface",
      description: "Une petite tâche terminée donne un sentiment de contrôle.",
      steps: [
        "Choisissez une seule surface : un bureau, une étagère, un rebord de fenêtre.",
        "Enlevez tout ce qui est en trop en 3 minutes.",
        "Regardez le résultat — c’est votre victoire.",
      ],
    },
    plank: {
      title: "Gainage 45 secondes",
      description: "Un effort bref qui fait passer de l’angoisse au corps.",
      steps: [
        "Mettez-vous en planche sur les avant-bras, le corps bien droit.",
        "Tenez 45 secondes en respirant calmement.",
        "Allongez-vous 15 secondes et relâchez tout le corps.",
      ],
    },
    "shake-off": {
      title: "Évacuer la tension",
      description: "C’est ainsi que les animaux évacuent le stress après un danger.",
      steps: [
        "Levez-vous et secouez les mains pendant 20 secondes.",
        "Ajoutez les épaules, puis les jambes — encore 30 secondes.",
        "Immobilisez-vous et faites trois longues expirations.",
      ],
    },
    "muscle-relax": {
      title: "Relaxation musculaire",
      description: "Contracter puis relâcher, tour à tour — un repos profond en 3 minutes.",
      steps: [
        "Serrez les poings 5 secondes, puis relâchez d’un coup.",
        "Recommencez avec les épaules, le visage, le ventre et les jambes.",
        "Pour finir, restez immobile 30 secondes en sentant le poids de votre corps.",
      ],
    },
    "serial-sevens": {
      title: "Compter à rebours par 7",
      description: "Sollicite le cortex préfrontal et coupe l’élan automatique.",
      steps: [
        "Retirez 7 à partir de 100, de tête : 93, 86, 79…",
        "Une erreur ? Reprenez au dernier nombre juste.",
        "Continuez jusqu’à passer sous 10.",
      ],
    },
    "two-minute-step": {
      title: "Une étape de 2 minutes",
      description: "À la place du fil — la plus petite étape d’une tâche repoussée.",
      steps: [
        "Pensez à une tâche que vous repoussez.",
        "Trouvez-y une étape de 2 minutes : ouvrir le fichier, écrire la première ligne.",
        "Faites seulement celle-là. Rien ne vous oblige à continuer.",
      ],
    },
    gratitude: {
      title: "Trois bonnes choses",
      description: "Déplace l’attention de ce qui manque vers ce qui est déjà là.",
      steps: [
        "Rappelez-vous trois bons moments d’aujourd’hui — même minuscules.",
        "Pour chacun, demandez-vous : pourquoi est-ce arrivé ?",
        "Notez une phrase si vous avez du papier.",
      ],
    },
    "message-human": {
      title: "Écrire à quelqu’un",
      description: "Un vrai contact plutôt que la vie sans fin des autres.",
      steps: [
        "Choisissez une personne à qui vous n’avez pas parlé depuis longtemps.",
        "Envoyez-lui un message chaleureux ou une question.",
        "Fermez la messagerie sans attendre de réponse.",
      ],
    },
    "brain-dump": {
      title: "Vider sa tête",
      description: "L’angoisse se calme quand les pensées sont sur le papier, pas dans la tête.",
      steps: [
        "Prenez une feuille ou vos notes.",
        "Écrivez tout ce qui vous trotte dans la tête, 2 minutes sans vous arrêter.",
        "Soulignez une chose que vous pouvez faire aujourd’hui.",
      ],
    },
    "alphabet-game": {
      title: "Le jeu de l’alphabet",
      description: "Un petit défi mental qui comble la faim de nouveauté.",
      steps: [
        "Choisissez un thème : villes, animaux, plats.",
        "Trouvez un mot pour chaque lettre de l’alphabet.",
        "Une lettre vous bloque ? Passez-la et revenez-y à la fin.",
      ],
    },
    "evening-plan": {
      title: "Imaginer sa soirée",
      description: "Le cerveau lâche plus facilement le fil quand il voit un meilleur plan.",
      steps: [
        "Fermez les yeux.",
        "Imaginez en détail comment vous passerez l’heure qui vient sans le fil.",
        "Choisissez la première action et ouvrez les yeux.",
      ],
    },
    "facts-brain": {
      title: "Le cerveau et les habitudes",
      description: "Comment fonctionne l’attrait du fil — et pourquoi on peut le désapprendre.",
      steps: [
        "La dopamine est davantage liée à l’attente d’une récompense qu’au plaisir lui-même. C’est pourquoi un fil sans fin accroche plus que n’importe quelle vidéo.",
        "Les vidéos courtes fonctionnent comme une machine à sous : la récompense arrive de façon imprévisible, et le cerveau continue de « tirer le levier ».",
        "Une envie ressemble à une vague : elle monte, puis retombe. Même une courte pause interrompt le geste automatique et laisse une chance de choisir autrement.",
        "Les systèmes émotionnels du cerveau réagissent plus vite que le cortex préfrontal — le « directeur » chargé du contrôle de soi. Une pause lui laisse le temps de rattraper l’envie.",
        "Une nouvelle habitude s’ancre par la répétition dans un même contexte. La même alternative dans la même situation marche mieux que la variété.",
      ],
    },
    "facts-nature": {
      title: "La nature étonnante",
      description: "Un peu de nouveauté vivante à la place du fil.",
      steps: [
        "La pieuvre « goûte » le monde avec ses ventouses : les récepteurs de ses bras distinguent les saveurs.",
        "Dans une forêt, les arbres peuvent échanger des substances grâce aux réseaux de champignons qui enlacent leurs racines.",
        "Le cœur d’un colibri peut battre plus de 1 000 fois par minute.",
        "Les loutres de mer se tiennent par la patte en dormant pour que le courant ne les sépare pas.",
        "Les abeilles s’indiquent la direction des fleurs grâce à une « danse frétillante ».",
      ],
    },
    "facts-space": {
      title: "L’espace en une minute",
      description: "Une échelle à côté de laquelle le fil paraît bien petit.",
      steps: [
        "La lumière du Soleil met environ 8 minutes à atteindre la Terre — nous le voyons toujours un peu dans le passé.",
        "Sur Vénus, un jour dure plus qu’une année : elle tourne sur elle-même plus lentement qu’elle ne fait le tour du Soleil.",
        "L’Univers observable compte plus d’étoiles qu’il n’y a de grains de sable sur toutes les plages de la Terre.",
        "Les traces de pas des astronautes sur la Lune peuvent durer des millions d’années — il n’y a pas de vent là-haut.",
        "Une étoile à neutrons est si dense qu’une cuillère à café de sa matière pèserait des milliards de tonnes.",
      ],
    },
    "facts-history": {
      title: "L’histoire en détails",
      description: "De courtes histoires qu’on a envie de raconter.",
      steps: [
        "Cléopâtre a vécu plus près, dans le temps, des premiers pas sur la Lune que de la construction de la pyramide de Khéops.",
        "L’université d’Oxford est plus ancienne que l’Empire aztèque.",
        "La guerre la plus courte de l’histoire — la guerre anglo-zanzibarite de 1896 — a duré moins d’une heure.",
        "La Rome antique avait son « fast-food » : des thermopolia de rue qui servaient des plats chauds.",
        "Le mot « robot » est apparu dans une pièce de Karel Čapek en 1920, mais c’est son frère Josef qui l’a inventé.",
      ],
    },
  },

  breath: {
    inhale: "Inspirez",
    exhale: "Expirez",
    hold: "Retenez",
    rest: "Pause",
  },

  exercises: {
    "breath-ground": {
      title: "Respirer et s’ancrer",
      subtitle: "Longue expiration + technique 3-2-1",
      prompts: [
        "Nommez en silence 3 objets que vous voyez en ce moment",
        "Sentez 2 points d’appui : les pieds au sol et le dos",
        "Faites 1 longue expiration et relâchez les épaules",
      ],
    },
    "box-breath": {
      title: "Respiration carrée",
      subtitle: "Un rythme régulier pour le stress intense",
      prompts: [
        "Inspirez par le nez — comptez jusqu’à quatre",
        "Retenez votre souffle, sans forcer",
        "Expirez lentement par la bouche",
        "Pause. Remarquez le calme à l’intérieur",
      ],
    },
    "serial-sevens": {
      title: "Compter à rebours par 7",
      subtitle: "Réveille le « directeur » du cerveau",
      prompts: [
        "Calculez de tête : 100 − 7 = ?",
        "Exact, 93. Ensuite : 93 − 7 = ?",
        "C’est 86. Encore une fois : 86 − 7 = ?",
      ],
    },
    "intent-check": {
      title: "Trois questions honnêtes",
      subtitle: "La conscience plutôt que le pilote auto",
      prompts: [
        "Qu’est-ce que je ressens, là, en un mot ?",
        "Qu’est-ce que j’attends vraiment du fil ?",
        "Qu’est-ce qui me donnerait ce sentiment sans téléphone ?",
      ],
    },
  },

  equivalents: {
    books: {
      unit: { one: "livre", other: "livres" },
      caption: "un livre moyen ≈ 5 heures de lecture",
    },
    sleep: {
      unit: { one: "heure de sommeil", other: "heures de sommeil" },
      caption: "du temps à rendre au sommeil",
    },
    walks: {
      unit: { one: "balade", other: "balades" },
      caption: "30 minutes chacune, au grand air",
    },
    workouts: {
      unit: { one: "séance de sport", other: "séances de sport" },
      caption: "45 minutes chacune",
    },
    language: {
      unit: { one: "cours de langue", other: "cours de langue" },
      caption: "20 minutes chacun",
    },
    calls: {
      unit: { one: "appel", other: "appels" },
      caption: "avec vos proches, 15 minutes chacun",
    },
  },

  timeOfDay: {
    morning: { label: "Matin", phrase: "le matin" },
    afternoon: { label: "Après-midi", phrase: "l’après-midi" },
    evening: { label: "Soir", phrase: "le soir" },
    night: { label: "Nuit", phrase: "la nuit" },
  },
};
