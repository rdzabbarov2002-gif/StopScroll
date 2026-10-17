import type { Messages } from "./ru";

/*
 * French typography: a no-break space ( ) goes before « : ? ! ; » and inside « guillemets ».
 * French uses the singular for 0 and 1.
 */
const seconds = (count: number) => `${count} ${count < 2 ? "seconde" : "secondes"}`;

export const fr: Messages = {
  units: {
    replacements: { one: "alternative", other: "alternatives" },
    seconds: { one: "seconde", other: "secondes" },
  },

  a11y: {
    locked: ", disponible avec Pro",
    doneToday: ", fait aujourd’hui",
  },

  close: "Fermer",

  list: {
    title: "Alternatives",
    add: "Ajouter votre alternative",
    filterAll: "Toutes",
    filterMine: "Les miennes",
    pickLabel: "Idéal maintenant",
    pickForTrigger: (phrase: string, title: string) =>
      `Quand le fil vous attire ${phrase}, essayez « ${title} ».`,
    pick: (title: string) => `Essayez « ${title} » au lieu du fil.`,
    triggerPhrase: {
      boredom: "par ennui",
      fatigue: "par fatigue",
      stress: "sous le stress",
      loneliness: "par solitude",
      procrastination: "au lieu de travailler",
      autopilot: "en pilote automatique",
      relax: "pour décompresser",
      sleepless: "les nuits sans sommeil",
      other: "",
    },
    start: "Commencer",
    emptyTitle: "Rien pour l’instant",
    emptyPro: "Ajoutez une habitude qui vous ressource : guitare, pompes, une page de livre.",
    emptyFree: "Vos propres alternatives et habitudes sont disponibles avec Pro.",
    openPro: "Découvrir Pro",
    catalog: "Catalogue",
    today: (count: string) => `Aujourd’hui : ${count}`,
  },

  card: {
    own: "Perso",
  },

  detail: {
    notFoundTitle: "Alternative introuvable",
    notFoundText: "Vous l’avez peut-être supprimée.",
    lockedTitle: "Cette alternative fait partie de StopScroll Pro",
    lockedText: "Débloquez le catalogue complet : plus de mouvements, de défis et de faits.",
    fact: (index: number, total: number) => `Fait ${index} sur ${total}`,
    nextFact: "Fait suivant",
    countWin: (minutes: string) => `Compter une victoire · +${minutes}`,
    cancel: "Annuler",
    delete: "Supprimer",
    deleteOwn: "Supprimer cette alternative",
    timer: "Minuteur",
    timerDone: "Temps écoulé — bravo !",
    secondsLeft: (count: number) => `Encore ${seconds(count)}`,
    again: "Recommencer",
    startTimer: (duration: string) => `Lancer pour ${duration}`,
  },

  custom: {
    title: "Votre alternative",
    subtitle: "Ce qui marche pour vous : guitare, pompes, une page de livre.",
    name: "Nom",
    namePlaceholder: "Par exemple : 10 pompes",
    nameA11y: "Nom de l’alternative",
    how: "Comment faire",
    howPlaceholder: "Facultatif : quelques mots-clés",
    howA11y: "Description de l’alternative, facultatif",
    type: "Type",
    duration: "Durée",
    save: "Enregistrer l’alternative",
  },

  intercept: {
    passed: "Pause terminée",
    title: "L’envie est retombée ?",
    text: "Vous avez laissé à votre cortex préfrontal le temps de s’activer. Maintenant, c’est vous qui choisissez, pas l’algorithme.",
    whatTriggered: "Qu’est-ce qui a déclenché l’envie ?",
    suggestionsFor: {
      boredom: "Alternatives contre l’ennui",
      fatigue: "Alternatives contre la fatigue",
      stress: "Alternatives contre le stress",
      loneliness: "Alternatives contre la solitude",
      procrastination: "Alternatives contre la procrastination",
      autopilot: "Alternatives contre le pilote auto",
      relax: "Alternatives pour décompresser",
      sleepless: "Alternatives contre l’insomnie",
      other: "Alternatives pour d’autres raisons",
    },
    suggestionsAny: "Remplacez le fil par 1 à 3 minutes",
    switched: (minutes: string) => `J’ai décroché · +${minutes}`,
    more: "15 secondes de plus",
    logSlip: "Le fil a gagné — noter un écart",
    pause: "Pause",
    closePause: "Fermer la pause",
    heading: "15 secondes de calme",
    wave: "Une envie, c’est comme une vague. Laissez-la passer — le téléphone peut attendre.",
    phaseA11y: (phase: string, count: number) => `${phase}. Encore ${seconds(count)}`,
    step: (index: number, total: number) => `étape ${index} sur ${total}`,
  },

  win: {
    overline: "Envie vaincue",
    saved:
      "repris au fil. Votre cerveau a eu une dopamine méritée — celle d’un choix, pas du scroll.",
    today: "Aujourd’hui",
    total: "Temps gagné au total",
    already: "Cela fait déjà",
    back: "Retour",
    undo: "Annuler l’enregistrement",
  },
};
