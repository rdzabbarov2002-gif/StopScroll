import type { Messages } from "./ru";

export const fr: Messages = {
  step: (current: number, total: number) => `Étape ${current} sur ${total}`,
  intro: "L’anti-scroll cognitif : on intercepte l’envie avant que le fil ne vous happe.",
  promises: {
    sos: {
      title: "Pause SOS de 15 secondes",
      text: "Respiration et ancrage, le temps que l’envie retombe.",
    },
    replacements: {
      title: "Micro-alternatives",
      text: "1 à 3 minutes de mouvement, un défi ou un fait au lieu du fil.",
    },
    stats: {
      title: "Des stats honnêtes",
      text: "Le temps que vous avez récupéré — pour lire, dormir et marcher.",
    },
  },
  start: "Commencer",
  demo: "Voir avec des données d’exemple",
  baseline: {
    overline: "Un point de départ honnête",
    title: "Combien de temps passez-vous chaque jour sur le fil ?",
    text: "À peu près — au ressenti ou d’après « Temps d’écran ». C’est votre niveau de départ pour comparer.",
    slider: "Minutes par jour sur le fil actuellement",
    mainApp: "Quelle app vous happe le plus souvent ?",
    next: "Suivant",
  },
  goal: {
    overline: "Un objectif réaliste",
    title: "Combien de fil par jour vous semble raisonnable ?",
    text: "Inutile de tout arrêter d’un coup. Chaque jour sous la limite prolonge votre série.",
    limit: "Limite quotidienne",
    session: "Une « session » sur le fil",
    sessionHint: "Minutes comptées pour chaque envie surmontée",
    summary: (perDay: string, perWeek: string) =>
      `Objectif : ${perDay} de moins par jour. Soit ${perWeek} par semaine qui vous reviennent.`,
    done: "Terminé",
    back: "Retour",
  },
};
