import type { Messages, Months, Week } from "./ru";

/** "4 octobre" */
const MONTHS: Months = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

/** "4 oct." */
const MONTHS_SHORT: Months = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

const WEEKDAYS: Week = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

const WEEKDAYS_SHORT: Week = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/** The first of the month is "1er": "1er octobre". */
const ordinal = (day: number) => (day === 1 ? "1er" : String(day));

const withYear = (text: string, year?: number) => (year === undefined ? text : `${text} ${year}`);

export const fr: Messages = {
  tabs: {
    home: "Accueil",
    ai: "IA",
    replacements: "Alternatives",
    stats: "Statistiques",
    journal: "Journal",
  },
  back: "Retour",
  close: "Fermer",
  closeSheet: "Fermer la fenêtre",
  noData: "aucune donnée",
  sos: {
    label: "Pause SOS",
    hint: "Ouvre une pause respiration de 15 secondes pour laisser l’envie retomber",
  },
  pro: {
    lockedCard: (title: string) => `${title}. Disponible avec StopScroll Pro`,
    lockedOption: (label: string) => `${label}, disponible avec Pro`,
  },
  theme: {
    light: "Clair",
    dark: "Sombre",
    lightA11y: "Thème clair",
    darkA11y: "Thème sombre",
    system: "Comme le système",
    systemA11y: "Thème identique au système",
  },
  date: {
    weekdays: WEEKDAYS,
    weekdaysShort: WEEKDAYS_SHORT,
    todayAt: (time: string) => `Aujourd’hui à ${time}`,
    yesterdayAt: (time: string) => `Hier à ${time}`,
    dateAt: (date: string, time: string) => `${date} à ${time}`,
    day: (day: number, month: number, year?: number) =>
      withYear(`${ordinal(day)} ${MONTHS[month]}`, year),
    dayShort: (day: number, month: number, year?: number) =>
      withYear(`${ordinal(day)} ${MONTHS_SHORT[month]}`, year),
    long: (weekday: number, day: number, month: number) =>
      `${WEEKDAYS[weekday]} ${ordinal(day)} ${MONTHS[month]}`,
    rangeInMonth: (startDay: number, endDay: number, month: number) =>
      `${ordinal(startDay)}–${endDay} ${MONTHS[month]}`,
    range: (startDay: number, startMonth: number, endDay: number, endMonth: number) =>
      `${ordinal(startDay)} ${MONTHS[startMonth]} – ${ordinal(endDay)} ${MONTHS[endMonth]}`,
  },
  duration: {
    minute: "min",
    hour: "h",
    compactMinute: "min",
    compactHour: "h",
    hours: { one: "heure", other: "heures" },
    minutes: { one: "minute", other: "minutes" },
  },
  greeting: {
    morning: "Bonjour",
    afternoon: "Bonjour",
    evening: "Bonsoir",
    night: "Bonsoir",
  },
  number: {
    // Narrow no-break space, as French typography groups thousands: "12 480".
    group: "\u202F",
    decimal: ",",
  },
  units: {
    days: { one: "jour", other: "jours" },
    entries: { one: "entrée", other: "entrées" },
    wins: { one: "victoire", other: "victoires" },
    times: { one: "fois", other: "fois" },
  },
};
