import type { Messages, Months, Week } from "./ru";

/** "4. Oktober" */
const MONTHS: Months = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

/** "4. Okt." */
const MONTHS_SHORT: Months = [
  "Jan.",
  "Feb.",
  "März",
  "Apr.",
  "Mai",
  "Juni",
  "Juli",
  "Aug.",
  "Sept.",
  "Okt.",
  "Nov.",
  "Dez.",
];

const WEEKDAYS: Week = [
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
  "Sonntag",
];

const WEEKDAYS_SHORT: Week = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

const withYear = (text: string, year?: number) => (year === undefined ? text : `${text} ${year}`);

export const de: Messages = {
  tabs: {
    home: "Start",
    ai: "KI",
    replacements: "Alternativen",
    stats: "Statistik",
    journal: "Tagebuch",
  },
  back: "Zurück",
  close: "Schließen",
  closeSheet: "Fenster schließen",
  noData: "keine Daten",
  sos: {
    label: "SOS-Pause",
    hint: "Öffnet eine 15-sekündige Atempause, damit der Impuls nachlässt",
  },
  pro: {
    lockedCard: (title: string) => `${title}. Verfügbar in StopScroll Pro`,
    lockedOption: (label: string) => `${label}, in Pro verfügbar`,
  },
  theme: {
    light: "Hell",
    dark: "Dunkel",
    lightA11y: "Helles Design",
    darkA11y: "Dunkles Design",
    system: "Wie im System",
    systemA11y: "Design wie im System",
  },
  date: {
    weekdays: WEEKDAYS,
    weekdaysShort: WEEKDAYS_SHORT,
    todayAt: (time: string) => `Heute, ${time}`,
    yesterdayAt: (time: string) => `Gestern, ${time}`,
    dateAt: (date: string, time: string) => `${date}, ${time}`,
    day: (day: number, month: number, year?: number) => withYear(`${day}. ${MONTHS[month]}`, year),
    dayShort: (day: number, month: number, year?: number) =>
      withYear(`${day}. ${MONTHS_SHORT[month]}`, year),
    long: (weekday: number, day: number, month: number) =>
      `${WEEKDAYS[weekday]}, ${day}. ${MONTHS[month]}`,
    rangeInMonth: (startDay: number, endDay: number, month: number) =>
      `${startDay}.–${endDay}. ${MONTHS[month]}`,
    range: (startDay: number, startMonth: number, endDay: number, endMonth: number) =>
      `${startDay}. ${MONTHS[startMonth]} – ${endDay}. ${MONTHS[endMonth]}`,
  },
  duration: {
    minute: "Min.",
    hour: "Std.",
    compactMinute: "m",
    compactHour: "h",
    hours: { one: "Stunde", other: "Stunden" },
    minutes: { one: "Minute", other: "Minuten" },
  },
  greeting: {
    morning: "Guten Morgen",
    afternoon: "Guten Tag",
    evening: "Guten Abend",
    night: "Guten Abend",
  },
  number: {
    group: ".",
    decimal: ",",
  },
  units: {
    days: { one: "Tag", other: "Tage" },
    entries: { one: "Eintrag", other: "Einträge" },
    wins: { one: "Erfolg", other: "Erfolge" },
    times: { one: "Mal", other: "Mal" },
  },
};
