import { selectPlural, type PluralForms } from "../../plural";
import type { Messages } from "./ru";

const word = (count: number, value: PluralForms) => selectPlural("fr", count, value);

const DAYS: PluralForms = { one: "jour", other: "jours" };
const WEEKS: PluralForms = { one: "semaine", other: "semaines" };
const WINS: PluralForms = { one: "victoire", other: "victoires" };
const EQUIVALENTS: PluralForms = { one: "équivalent", other: "équivalents" };

export const fr: Messages = {
  title: "Statistiques",
  weeklyReport: "Bilan de la semaine",
  achievements: "Récompenses",
  achievementsCount: (earned: number, total: number) => `${earned} sur ${total}`,
  today: "Aujourd’hui",
  yesterday: "Hier",
  noEntry: "non noté",
  dayValue: (day: string, value: string) => `${day}\u00A0: ${value}`,
  limitLine: (duration: string) => `limite ${duration}`,
  trend: {
    label: "Temps sur le fil",
    days: (days: number) => `${days} ${word(days, DAYS)}`,
    average: "En moyenne",
    empty: "Rien de noté pour l’instant",
    perDay: "par jour",
  },
  logger: {
    label: "Noter le temps",
    question: "Combien de temps sur le fil\u00A0?",
    hint: "Reels, TikTok, Shorts — tout compris",
    over: (duration: string) => `${duration} au-delà de la limite`,
    within: (limit: string) => `Dans la limite de ${limit}`,
    minus: "Moins 5 minutes",
    plus: "Plus 5 minutes",
    slider: "Minutes sur le fil par jour",
    preset: (duration: string) => `Régler sur ${duration}`,
    saved: "Enregistré",
    save: "Enregistrer",
    update: "Mettre à jour",
    footnote:
      "Le temps exact se trouve dans «\u00A0Temps d’écran\u00A0» sur iOS ou «\u00A0Bien-être numérique\u00A0» sur Android.",
  },
  comparison: {
    label: "Comparaison",
    before: "Avant StopScroll",
    both: (yesterday: string, today: string) => `Hier ${yesterday}, aujourd’hui ${today}`,
    todayOnly: (today: string) => `Aujourd’hui ${today}`,
    empty: "Notez votre temps d’aujourd’hui",
    noData: "aucune donnée",
    change: (sign: string, percent: number) => `${sign}${percent}\u00A0%`,
    vsYesterday: (change: string) => `${change} par rapport à hier`,
    vsBaseline: (change: string) => `${change} depuis le début`,
    sameAsYesterday: "comme hier",
    sameAsBaseline: "comme au début",
  },
  heatmap: {
    label: "Jours maîtrisés",
    rule: (limit: string) => `Un jour compte si le fil n’a pas dépassé ${limit}.`,
    streak: "Série",
    record: "Record",
    month: "Sur 30 jours",
    days: DAYS,
    status: {
      great: "moins de la moitié de la limite",
      ok: "dans la limite",
      over: "au-delà de la limite",
      empty: "non noté",
      future: "",
    },
    cellValue: (duration: string, status: string) => `${duration}, ${status}`,
    selectedValue: (duration: string, status: string) => `${duration} — ${status}`,
    hint: "Touchez un jour pour voir le détail.",
    legend: {
      great: "≤ ½ limite",
      ok: "dans la limite",
      over: "au-delà",
      empty: "non noté",
    },
    more: (weeks: number) => `Voir ${weeks} ${word(weeks, WEEKS)} d’historique avec Pro`,
  },
  equivalents: {
    label: "Temps gagné",
    total: (duration: string) => `Au total, vous avez récupéré ${duration}.`,
    empty: "Chaque pause et chaque alternative vous rendront du temps — il apparaîtra ici.",
    summary: (wins: number, week: string, session: string) =>
      `${wins} ${word(wins, WINS)} · ${week} sur 7 jours. Chaque victoire = ${session} qui partaient d’habitude dans le fil.`,
    lockedTitle: (count: number) => `${count} ${word(count, EQUIVALENTS)} de plus avec Pro`,
    lockedText: "Séances de sport, cours de langue et appels à vos proches.",
  },
};
