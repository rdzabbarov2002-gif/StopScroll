import { selectPlural, type PluralForms } from "../../plural";
import type { Messages } from "./ru";

const word = (count: number, value: PluralForms) => selectPlural("fr", count, value);

const DAYS: PluralForms = { one: "jour", other: "jours" };
const WINS: PluralForms = { one: "victoire", other: "victoires" };
const SLIPS: PluralForms = { one: "écart", other: "écarts" };
const URGES: PluralForms = { one: "envie", other: "envies" };
const ALTERNATIVES: PluralForms = { one: "alternative", other: "alternatives" };

export const fr: Messages = {
  title: "Semaine",
  back: "Retour",
  olderWeek: "Semaine précédente",
  newerWeek: "Semaine suivante",

  firstReport: {
    title: "Premier bilan dimanche",
    text: "Chaque dimanche soir, votre coach personnel fait le point sur la semaine\u00A0: ce qui a marché, où le fil l’emporte et quoi essayer ensuite. Notez votre temps et vos écarts pour donner de la matière au bilan.",
  },
  quietWeek: {
    title: "Une semaine calme",
    text: "Rien n’a été noté ces jours-ci\u00A0: ni victoire sur une envie, ni écart, ni temps enregistré.",
  },

  daySaved: (day: string, duration: string) => `${day}\u00A0: temps gagné ${duration}`,
  dayScroll: (day: string, duration: string | null) =>
    `${day}\u00A0: ${duration === null ? "non noté" : duration}`,

  saved: {
    label: "Temps gagné",
    change: (amount: string, more: boolean) =>
      `${amount} de ${more ? "plus" : "moins"} que la semaine précédente.`,
    total: (amount: string) =>
      `Les pauses et les alternatives de la semaine vous ont rendu ${amount} de vie.`,
    none: "Aucun temps gagné cette semaine pour l’instant — la prochaine pause SOS va changer ça.",
    week: "Sur la semaine",
    wins: "Victoires",
  },

  metrics: {
    inLimit: "Dans la limite",
    ofDays: (logged: number) => `sur ${logged} ${word(logged, DAYS)}`,
    slips: "Écarts",
    replacements: "Alternatives",
    streak: "Série",
    record: (days: number) => `Record\u00A0: ${days} ${word(days, DAYS)}`,
    vsLastWeek: (delta: string) => `${delta} vs la semaine dernière`,
  },

  impulses: {
    label: "Envies",
    none: "Aucune envie cette semaine.",
    success: (percent: number) => `${percent}\u00A0% des envies sont passées sans le fil.`,
    breakdown: (total: number, wins: number, slips: number) =>
      `${total} ${word(total, URGES)}\u00A0: ${wins} ${word(wins, WINS)}, ${slips} ${word(slips, SLIPS)}.`,
    byTime: "Selon l’heure",
    resisted: "Surmontées",
    slips: "Écarts",
    slot: (from: number, to: number, resisted: number, lost: number) =>
      `De ${from}\u00A0h à ${to}\u00A0h\u00A0: ${resisted} ${resisted < 2 ? "surmontée" : "surmontées"}, ${lost} ${word(lost, SLIPS)}`,
  },

  hardest: {
    header: "Les moments difficiles",
    noData: "Pas de données",
    day: "Jour à risque",
    hour: "Heure à risque",
    trigger: "Cause principale",
    slips: (count: number) => `${count} ${word(count, SLIPS)}`,
    mostFeed: (duration: string) => `Le plus de fil\u00A0: ${duration}`,
    mostPull: (count: number) => `Envie de fil la plus forte · ${count} fois`,
    triggerSlips: (count: number, total: number) => `${count} ${word(count, SLIPS)} sur ${total}`,
    noSlips: "Aucun écart",
  },

  feed: {
    label: "Fil par jour",
    none: "Aucun temps de fil noté cette semaine.",
    average: (average: string, inLimit: number, logged: number) =>
      `En moyenne ${average} par jour · ${inLimit} ${word(inLimit, DAYS)} sur ${logged} dans la limite.`,
    limit: (duration: string) => `limite ${duration}`,
  },

  changes: {
    header: "Par rapport à la semaine dernière",
    saved: "Temps gagné",
    slips: "Écarts",
    success: "Envies surmontées",
    scroll: "Fil par jour",
    same: "Inchangé",
  },

  percent: (value: number, sign = "") => `${sign}${value}\u00A0%`,

  units: {
    days: DAYS,
    wins: WINS,
    slips: SLIPS,
    replacements: ALTERNATIVES,
  },

  reminder: {
    channel: "Bilan de la semaine",
    title: "Votre bilan de la semaine est prêt",
    body: "Le temps que vous avez repris, vos heures les plus difficiles et vos nouvelles récompenses.",
  },
};
