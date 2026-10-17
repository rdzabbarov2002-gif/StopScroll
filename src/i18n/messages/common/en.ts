import type { Messages, Months, Week } from "./ru";

/** "October 4" */
const MONTHS: Months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "Oct 4" */
const MONTHS_SHORT: Months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const WEEKDAYS: Week = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const WEEKDAYS_SHORT: Week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const withYear = (text: string, year?: number) => (year === undefined ? text : `${text}, ${year}`);

export const en: Messages = {
  tabs: {
    home: "Home",
    ai: "AI",
    replacements: "Alternatives",
    stats: "Stats",
    journal: "Journal",
  },
  back: "Back",
  close: "Close",
  closeSheet: "Dismiss",
  noData: "no data",
  sos: {
    label: "SOS pause",
    hint: "Opens a 15-second breathing pause to let the urge fade",
  },
  pro: {
    lockedCard: (title: string) => `${title}. Available in StopScroll Pro`,
    lockedOption: (label: string) => `${label}, available in Pro`,
  },
  theme: {
    light: "Light",
    dark: "Dark",
    lightA11y: "Light appearance",
    darkA11y: "Dark appearance",
    system: "Match System",
    systemA11y: "Match system appearance",
  },
  date: {
    weekdays: WEEKDAYS,
    weekdaysShort: WEEKDAYS_SHORT,
    todayAt: (time: string) => `Today at ${time}`,
    yesterdayAt: (time: string) => `Yesterday at ${time}`,
    dateAt: (date: string, time: string) => `${date} at ${time}`,
    day: (day: number, month: number, year?: number) => withYear(`${MONTHS[month]} ${day}`, year),
    dayShort: (day: number, month: number, year?: number) =>
      withYear(`${MONTHS_SHORT[month]} ${day}`, year),
    long: (weekday: number, day: number, month: number) =>
      `${WEEKDAYS[weekday]}, ${MONTHS[month]} ${day}`,
    rangeInMonth: (startDay: number, endDay: number, month: number) =>
      `${MONTHS[month]} ${startDay}–${endDay}`,
    range: (startDay: number, startMonth: number, endDay: number, endMonth: number) =>
      `${MONTHS[startMonth]} ${startDay} – ${MONTHS[endMonth]} ${endDay}`,
  },
  duration: {
    minute: "min",
    hour: "hr",
    compactMinute: "m",
    compactHour: "h",
    hours: { one: "hour", other: "hours" },
    minutes: { one: "minute", other: "minutes" },
  },
  greeting: {
    morning: "Good morning",
    afternoon: "Good afternoon",
    evening: "Good evening",
    night: "Good evening",
  },
  number: {
    group: ",",
    decimal: ".",
  },
  units: {
    days: { one: "day", other: "days" },
    entries: { one: "entry", other: "entries" },
    wins: { one: "win", other: "wins" },
    times: { one: "time", other: "times" },
  },
};
