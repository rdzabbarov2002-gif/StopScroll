import { selectPlural, type PluralForms } from "../../plural";
import type { Messages } from "./ru";

const word = (count: number, value: PluralForms) => selectPlural("en", count, value);

const DAYS: PluralForms = { one: "day", other: "days" };
const WEEKS: PluralForms = { one: "week", other: "weeks" };
const WINS: PluralForms = { one: "win", other: "wins" };
const EQUIVALENTS: PluralForms = { one: "equivalent", other: "equivalents" };

export const en: Messages = {
  title: "Stats",
  weeklyReport: "Weekly report",
  achievements: "Achievements",
  achievementsCount: (earned: number, total: number) => `${earned} of ${total}`,
  today: "Today",
  yesterday: "Yesterday",
  noEntry: "not logged",
  dayValue: (day: string, value: string) => `${day}: ${value}`,
  limitLine: (duration: string) => `limit ${duration}`,
  trend: {
    label: "Feed time",
    days: (days: number) => `${days} ${word(days, DAYS)}`,
    average: "Average",
    empty: "Nothing logged yet",
    perDay: "a day",
  },
  logger: {
    label: "Log time",
    question: "How much went to the feed?",
    hint: "Reels, TikTok, Shorts — all together",
    over: (duration: string) => `${duration} over the limit`,
    within: (limit: string) => `Within the ${limit} limit`,
    minus: "Minus 5 minutes",
    plus: "Plus 5 minutes",
    slider: "Feed minutes per day",
    preset: (duration: string) => `Set ${duration}`,
    saved: "Logged",
    save: "Log",
    update: "Update entry",
    footnote: "For the exact time, check Screen Time on iOS or Digital Wellbeing on Android.",
  },
  comparison: {
    label: "Comparison",
    before: "Before StopScroll",
    both: (yesterday: string, today: string) => `Yesterday ${yesterday}, today ${today}`,
    todayOnly: (today: string) => `Today ${today}`,
    empty: "Log your time for today",
    noData: "no data",
    change: (sign: string, percent: number) => `${sign}${percent}%`,
    vsYesterday: (change: string) => `${change} vs yesterday`,
    vsBaseline: (change: string) => `${change} vs your start`,
    sameAsYesterday: "same as yesterday",
    sameAsBaseline: "same as at the start",
  },
  heatmap: {
    label: "Days under control",
    rule: (limit: string) => `A day counts if the feed took no more than ${limit}.`,
    streak: "Streak",
    record: "Best",
    month: "Last 30 days",
    days: DAYS,
    status: {
      great: "under half the limit",
      ok: "within limit",
      over: "over limit",
      empty: "not logged",
      future: "",
    },
    cellValue: (duration: string, status: string) => `${duration}, ${status}`,
    selectedValue: (duration: string, status: string) => `${duration} — ${status}`,
    hint: "Tap a day to see the details.",
    legend: {
      great: "≤ ½ limit",
      ok: "within limit",
      over: "over limit",
      empty: "not logged",
    },
    more: (weeks: number) => `See ${weeks} ${word(weeks, WEEKS)} of history with Pro`,
  },
  equivalents: {
    label: "Time saved",
    total: (duration: string) => `In total, you’ve taken back ${duration}.`,
    empty: "Every pause and alternative gives you time back — you’ll see it here.",
    summary: (wins: number, week: string, session: string) =>
      `${wins} ${word(wins, WINS)} · ${week} in the last 7 days. Each win = ${session} that would usually go to the feed.`,
    lockedTitle: (count: number) => `${count} more ${word(count, EQUIVALENTS)} in Pro`,
    lockedText: "Workouts, language lessons and talks with loved ones.",
  },
};
