import { selectPlural, type PluralForms } from "../../plural";
import type { Messages } from "./ru";

const word = (count: number, value: PluralForms) => selectPlural("en", count, value);

const ENTRIES: PluralForms = { one: "entry", other: "entries" };
const SLIPS: PluralForms = { one: "slip", other: "slips" };

const WEEKDAY_PHRASES = [
  "on Mondays",
  "on Tuesdays",
  "on Wednesdays",
  "on Thursdays",
  "on Fridays",
  "on Saturdays",
  "on Sundays",
] as const;

export const en: Messages = {
  title: "Journal",
  intro:
    "Log a slip in 10 seconds — no self-criticism. The coach will ask what happened and, over time, show you what keeps repeating.",
  deepAnalytics: "Deep analytics",
  locked: {
    title: "The hours and days when the feed wins",
    text: "Charts of slips by hour and day, plus a breakdown of where you hold on and where you don’t.",
  },
  empty: {
    title: "No entries yet",
    text: "And that’s great. If the feed does win, note it here to see the patterns.",
  },
  history: "Slip history",
  entries: (count: number) => `${count} ${word(count, ENTRIES)}`,
  showMore: "Show more",
  form: {
    label: "Log a slip",
    statement: "The feed won? It happens.",
    where: "Where",
    howLong: "Time lost",
    save: "Log slip",
  },
  patterns: {
    label: "Patterns",
    addMore: (count: number) =>
      `Add ${count} more ${word(count, ENTRIES)}, and we’ll show when and why the feed wins most often.`,
    slipsWeek: "Slips in 7 days",
    lostWeek: "Lost in 7 days",
    resisted: "Resisted",
    percent: (percent: number) => `${percent}%`,
    riskyTime: "Risky time",
    topApp: "Main feed",
    summary: (time: string, reason: string) => `Slips happen most often ${time} ${reason}.`,
    detail: (hours: string, weekday: number) =>
      `Peak hour: ${hours}. It’s hardest ${WEEKDAY_PHRASES[weekday]}.`,
    weekdayPhrases: WEEKDAY_PHRASES,
  },
  deep: {
    byHour: "Slips by hour",
    byWeekday: "Slips by weekday",
    noData: "No data yet",
    columnA11y: (label: string, count: number) => `${label}: ${count} ${word(count, SLIPS)}`,
    readout: (label: string, count: number) => `${label} · ${count} ${word(count, SLIPS)}`,
    triggers: "Triggers: held on or slipped",
    resisted: "Held on",
    slips: "Slips",
    triggersEmpty:
      "Note the reason in the SOS pause and in the journal — the breakdown will appear here.",
    triggerA11y: (label: string, resisted: number, slips: number) =>
      `${label}: held on ${resisted}, slips ${slips}`,
  },
  item: {
    noReason: "No reason given",
    delete: "Delete entry",
    reflectA11y: "Talk the slip through with the coach",
    reflect: "Talk it through",
    confirm: "Delete this entry?",
    cancel: "Cancel",
    confirmDelete: "Delete",
  },
  demoNote: "Opened it “for a minute” before bed",
};
