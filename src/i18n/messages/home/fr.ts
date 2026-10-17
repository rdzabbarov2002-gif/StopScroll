import { selectPlural, type PluralForms } from "../../plural";
import type { Messages } from "./ru";

const word = (count: number, value: PluralForms) => selectPlural("fr", count, value);

const DAYS: PluralForms = { one: "jour", other: "jours" };
const WINS: PluralForms = { one: "victoire", other: "victoires" };

export const fr: Messages = {
  settings: "Réglages",
  today: "Aujourd’hui",
  yesterday: "Hier",
  noEntry: "non noté",
  dayValue: (day: string, value: string) => `${day}\u00A0: ${value}`,
  feed: {
    a11y: "Temps sur le fil, ouvrir les statistiques",
    label: "Temps sur le fil",
    limitLine: (duration: string) => `limite ${duration}`,
    empty: "Notez combien de temps le fil vous a pris aujourd’hui.",
    withinLimit: (duration: string) => `${duration} sur le fil aujourd’hui — dans la limite.`,
    overLimit: (duration: string) => `${duration} sur le fil aujourd’hui — au-delà de la limite.`,
    less: (percent: number) =>
      `Aujourd’hui, vous avez passé ${percent}\u00A0% de temps en moins sur le fil qu’hier.`,
    more: (percent: number) =>
      `Aujourd’hui, vous avez passé ${percent}\u00A0% de temps en plus sur le fil qu’hier.`,
    same: "Aujourd’hui, vous avez passé autant de temps sur le fil qu’hier.",
  },
  limit: {
    a11y: "Limite et série, ouvrir les statistiques",
    label: "Limite",
    streak: "Série",
    record: "Record",
    days: DAYS,
    streakDays: (days: number) =>
      `Voilà ${days} ${word(days, DAYS)} d’affilée que vous respectez votre limite.`,
    firstDay: "Premier jour dans la limite. Demain, la série continue.",
    over: "Limite dépassée aujourd’hui. Demain, une nouvelle série commence.",
    start: (limit: string) => `Restez sous ${limit} par jour, et votre série commencera ici.`,
    dayWithin: "dans la limite",
    dayOver: "au-delà de la limite",
  },
  saved: {
    a11y: "Temps gagné, ouvrir les statistiques",
    label: "Temps gagné",
    today: (duration: string, wins: number) =>
      `Aujourd’hui, vous avez récupéré ${duration} — ${wins} ${word(wins, WINS)} sur l’envie.`,
    empty: "Chaque pause vous rend du temps. Quand le fil vous attire, appuyez sur pause.",
    total: "Total",
  },
  pick: {
    a11y: (title: string) => `Alternative du jour\u00A0: ${title}`,
    label: "Alternative du jour",
    start: "Commencer",
  },
  tiles: {
    a11y: (label: string, title: string, caption: string) => `${label}\u00A0: ${title}, ${caption}`,
    report: "Bilan",
    newReport: "Nouveau bilan",
    sunday: "Dimanche",
    reportSaved: (duration: string) => `Gagné\u00A0: ${duration}`,
    reportPromise: "Votre coach fera le point sur votre semaine",
    achievements: "Récompenses",
    achievementsCount: (earned: number, total: number) => `${earned} sur ${total}`,
    firstAchievement: "La première arrive avec votre première pause",
  },
};
