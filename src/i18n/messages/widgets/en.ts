import { selectPlural, type PluralForms } from "../../plural";
import type { Messages } from "./ru";

const word = (count: number, forms: PluralForms) => selectPlural("en", count, forms);
const DAYS: PluralForms = { one: "day", other: "days" };
const WINS: PluralForms = { one: "win", other: "wins" };

export const en: Messages = {
  empty: "Open StopScroll to see your numbers here.",
  today: {
    a11y: (saved: string) => `Saved today: ${saved}`,
    label: "Saved",
    caption: "Today",
    wins: (count: number) => `${count} ${word(count, WINS)} over the feed`,
    noWins: "A pause wins time back",
  },
  streak: {
    a11y: (days: number) => `Streak: ${days} ${word(days, DAYS)}`,
    label: "Streak",
    unit: (days: number) => word(days, DAYS),
    active: "within your limit",
    start: "Start a streak today",
  },
  limit: {
    a11yUnlogged: "Limit: no time logged",
    a11yLeft: (left: string) => `Limit: ${left} left`,
    label: "Limit",
    today: "Today",
    left: "Remaining",
    over: "Over limit",
    logPrompt: "Log today’s time",
    ofToday: (limit: string) => `of ${limit} today`,
  },
  ring: {
    a11y: (used: string | null, limit: string) => `Feed today: ${used ?? "not logged"} of ${limit}`,
    of: (limit: string) => `of ${limit}`,
    logPrompt: "Log your time",
    over: "Limit exceeded",
    feedToday: "Feed today",
  },
  replacement: {
    a11y: (title: string) => `Instead of the feed: ${title}`,
    label: "Instead of the feed",
    caption: (duration: string) => `${duration} · new every 30 min`,
  },
};
