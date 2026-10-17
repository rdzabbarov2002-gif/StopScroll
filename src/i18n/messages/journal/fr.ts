import { selectPlural, type PluralForms } from "../../plural";
import type { Messages } from "./ru";

const word = (count: number, value: PluralForms) => selectPlural("fr", count, value);

const ENTRIES: PluralForms = { one: "entrée", other: "entrées" };
const SLIPS: PluralForms = { one: "écart", other: "écarts" };

const WEEKDAY_PHRASES = [
  "le lundi",
  "le mardi",
  "le mercredi",
  "le jeudi",
  "le vendredi",
  "le samedi",
  "le dimanche",
] as const;

export const fr: Messages = {
  title: "Journal",
  intro:
    "Notez un écart en 10 secondes — sans vous juger. Le coach vous demandera ce qui s’est passé et, avec le temps, vous montrera ce qui se répète.",
  deepAnalytics: "Analyse approfondie",
  locked: {
    title: "Les heures et les jours où le fil l’emporte",
    text: "Les écarts par heure et par jour en graphiques, et une analyse\u00A0: où vous tenez bon, et où ce n’est pas le cas.",
  },
  empty: {
    title: "Aucune entrée pour l’instant",
    text: "Et c’est très bien. Si le fil finit par l’emporter, notez-le ici pour repérer les tendances.",
  },
  history: "Historique des écarts",
  entries: (count: number) => `${count} ${word(count, ENTRIES)}`,
  showMore: "Afficher plus",
  form: {
    label: "Noter un écart",
    statement: "Le fil a gagné\u00A0? Ça arrive.",
    where: "Où",
    howLong: "Temps perdu",
    save: "Noter l’écart",
  },
  patterns: {
    label: "Tendances",
    addMore: (count: number) =>
      `Encore ${count} ${word(count, ENTRIES)}, et nous vous montrerons quand et pourquoi le fil l’emporte le plus souvent.`,
    slipsWeek: "Écarts sur 7 jours",
    lostWeek: "Perdu sur 7 jours",
    resisted: "Résisté",
    percent: (percent: number) => `${percent}\u00A0%`,
    riskyTime: "Moment à risque",
    topApp: "Fil principal",
    summary: (time: string, reason: string) => `Les écarts arrivent surtout ${time} ${reason}.`,
    detail: (hours: string, weekday: number) =>
      `Heure critique\u00A0: ${hours}. Le plus dur, c’est ${WEEKDAY_PHRASES[weekday]}.`,
    weekdayPhrases: WEEKDAY_PHRASES,
  },
  deep: {
    byHour: "Écarts par heure",
    byWeekday: "Écarts par jour",
    noData: "Pas encore de données",
    columnA11y: (label: string, count: number) => `${label}\u00A0: ${count} ${word(count, SLIPS)}`,
    readout: (label: string, count: number) => `${label} · ${count} ${word(count, SLIPS)}`,
    triggers: "Causes\u00A0: tenu bon ou cédé",
    resisted: "Tenu bon",
    slips: "Écarts",
    triggersEmpty:
      "Indiquez la raison dans la pause SOS et dans le journal — la répartition apparaîtra ici.",
    triggerA11y: (label: string, resisted: number, slips: number) =>
      `${label}\u00A0: tenu bon ${resisted}\u00A0fois, ${slips} ${word(slips, SLIPS)}`,
  },
  item: {
    noReason: "Raison non précisée",
    delete: "Supprimer l’entrée",
    reflectA11y: "Analyser l’écart avec le coach",
    reflect: "En parler",
    confirm: "Supprimer cette entrée\u00A0?",
    cancel: "Annuler",
    confirmDelete: "Supprimer",
  },
  demoNote: "Ouvert «\u00A0juste une minute\u00A0» avant de dormir",
};
