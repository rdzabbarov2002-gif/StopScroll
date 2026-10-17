import { selectPlural, type PluralForms } from "../../plural";
import type { Messages } from "./ru";

const word = (count: number, value: PluralForms) => selectPlural("en", count, value);

const DAYS: PluralForms = { one: "day", other: "days" };
const WINS: PluralForms = { one: "win", other: "wins" };

export const en: Messages = {
  settings: "Settings",
  today: "Today",
  yesterday: "Yesterday",
  noEntry: "not logged",
  dayValue: (day: string, value: string) => `${day}: ${value}`,
  feed: {
    a11y: "Feed time, open stats",
    label: "Feed time",
    limitLine: (duration: string) => `limit ${duration}`,
    empty: "Log how much time went to the feed today.",
    withinLimit: (duration: string) => `${duration} in the feed today — within your limit.`,
    overLimit: (duration: string) => `${duration} in the feed today — over your limit.`,
    less: (percent: number) => `You spent ${percent}% less time in the feed today than yesterday.`,
    more: (percent: number) => `You spent ${percent}% more time in the feed today than yesterday.`,
    same: "You spent as much time in the feed today as yesterday.",
  },
  limit: {
    a11y: "Limit and streak, open stats",
    label: "Limit",
    streak: "Streak",
    record: "Best",
    days: DAYS,
    streakDays: (days: number) => `${days} ${word(days, DAYS)} in a row within your limit.`,
    firstDay: "Your first day within the limit. Tomorrow the streak goes on.",
    over: "Over the limit today. Tomorrow starts a new streak.",
    start: (limit: string) => `Stay within ${limit} a day, and your streak starts here.`,
    dayWithin: "within limit",
    dayOver: "over limit",
  },
  saved: {
    a11y: "Time saved, open stats",
    label: "Time saved",
    today: (duration: string, wins: number) =>
      `Today you took back ${duration} — ${wins} ${word(wins, WINS)} over the urge.`,
    empty: "Every pause gives you time back. When the feed pulls, tap pause.",
    total: "Total",
  },
  pick: {
    a11y: (title: string) => `Alternative of the day: ${title}`,
    label: "Alternative of the day",
    start: "Start",
  },
  tiles: {
    a11y: (label: string, title: string, caption: string) => `${label}: ${title}, ${caption}`,
    report: "Report",
    newReport: "New report",
    sunday: "On Sunday",
    reportSaved: (duration: string) => `Saved ${duration}`,
    reportPromise: "Your coach will review your week",
    achievements: "Achievements",
    achievementsCount: (earned: number, total: number) => `${earned} of ${total}`,
    firstAchievement: "The first comes with your first pause",
  },
};
