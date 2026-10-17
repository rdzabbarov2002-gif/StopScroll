import { selectPlural, type PluralForms } from "../../plural";
import type { Messages } from "./ru";

const word = (count: number, forms: PluralForms) => selectPlural("fr", count, forms);
const DAYS: PluralForms = { one: "jour", other: "jours" };
const WINS: PluralForms = { one: "victoire", other: "victoires" };

export const fr: Messages = {
  empty: "Ouvrez StopScroll pour voir vos chiffres ici.",
  today: {
    a11y: (saved: string) => `Temps gagné aujourd’hui : ${saved}`,
    label: "Temps gagné",
    caption: "Aujourd’hui",
    wins: (count: number) => `${count} ${word(count, WINS)} sur le fil`,
    noWins: "Une pause rend du temps",
  },
  streak: {
    a11y: (days: number) => `Série : ${days} ${word(days, DAYS)}`,
    label: "Série",
    unit: (days: number) => word(days, DAYS),
    active: "dans la limite",
    start: "Démarrez une série",
  },
  limit: {
    a11yUnlogged: "Limite : temps non noté",
    a11yLeft: (left: string) => `Limite : il reste ${left}`,
    label: "Limite",
    today: "Aujourd’hui",
    left: "Il reste",
    over: "Dépassement",
    logPrompt: "Notez le temps du jour",
    ofToday: (limit: string) => `sur ${limit} aujourd’hui`,
  },
  ring: {
    a11y: (used: string | null, limit: string) =>
      `Fil aujourd’hui : ${used ?? "non noté"} sur ${limit}`,
    of: (limit: string) => `sur ${limit}`,
    logPrompt: "Notez le temps",
    over: "Limite dépassée",
    feedToday: "Fil du jour",
  },
  replacement: {
    a11y: (title: string) => `Au lieu du fil : ${title}`,
    label: "Au lieu du fil",
    caption: (duration: string) => `${duration} · change toutes les 30 min`,
  },
};
