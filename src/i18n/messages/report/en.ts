import { selectPlural, type PluralForms } from "../../plural";
import type { Messages } from "./ru";

const word = (count: number, value: PluralForms) => selectPlural("en", count, value);

const DAYS: PluralForms = { one: "day", other: "days" };
const WINS: PluralForms = { one: "win", other: "wins" };
const SLIPS: PluralForms = { one: "slip", other: "slips" };
const URGES: PluralForms = { one: "urge", other: "urges" };
const ALTERNATIVES: PluralForms = { one: "alternative", other: "alternatives" };
const TIMES: PluralForms = { one: "time", other: "times" };

export const en: Messages = {
  title: "Week",
  back: "Back",
  olderWeek: "Previous week",
  newerWeek: "Next week",

  firstReport: {
    title: "Your first report comes on Sunday",
    text: "Every Sunday evening, your personal coach reviews the week: what worked, where the feed is winning and what to try next. Log your time and slips so the review has something to go on.",
  },
  quietWeek: {
    title: "A quiet week",
    text: "Nothing was logged these days: no wins over an urge, no slips, no feed time.",
  },

  daySaved: (day: string, duration: string) => `${day}: ${duration} saved`,
  dayScroll: (day: string, duration: string | null) =>
    `${day}: ${duration === null ? "not logged" : duration}`,

  saved: {
    label: "Saved",
    change: (amount: string, more: boolean) =>
      `${amount} ${more ? "more" : "less"} than the week before.`,
    total: (amount: string) =>
      `This week’s pauses and alternatives gave you back ${amount} of your life.`,
    none: "No time saved yet this week — your next SOS pause will change that.",
    week: "Week total",
    wins: "Wins",
  },

  metrics: {
    inLimit: "Within limit",
    ofDays: (logged: number) => `of ${logged} ${word(logged, DAYS)}`,
    slips: "Slips",
    replacements: "Alternatives",
    streak: "Streak",
    record: (days: number) => `Best: ${days} ${word(days, DAYS)}`,
    vsLastWeek: (delta: string) => `${delta} vs last week`,
  },

  impulses: {
    label: "Urges",
    none: "No urges this week.",
    success: (percent: number) => `${percent}% of urges passed without the feed.`,
    breakdown: (total: number, wins: number, slips: number) =>
      `${total} ${word(total, URGES)}: ${wins} ${word(wins, WINS)}, ${slips} ${word(slips, SLIPS)}.`,
    byTime: "By time of day",
    resisted: "Resisted",
    slips: "Slips",
    slot: (from: number, to: number, resisted: number, lost: number) =>
      `${from}:00 to ${to}:00: ${resisted} resisted, ${lost} ${word(lost, SLIPS)}`,
  },

  hardest: {
    header: "Toughest moments",
    noData: "No data",
    day: "Riskiest day",
    hour: "Riskiest time",
    trigger: "Top trigger",
    slips: (count: number) => `${count} ${word(count, SLIPS)}`,
    mostFeed: (duration: string) => `Most feed time: ${duration}`,
    mostPull: (count: number) => `Strongest pull to the feed · ${count} ${word(count, TIMES)}`,
    triggerSlips: (count: number, total: number) => `${count} of ${total} ${word(total, SLIPS)}`,
    noSlips: "No slips",
  },

  feed: {
    label: "Feed by day",
    none: "No feed time was logged this week.",
    average: (average: string, inLimit: number, logged: number) =>
      `${average} a day on average · ${inLimit} of ${logged} ${word(logged, DAYS)} within the limit.`,
    limit: (duration: string) => `limit ${duration}`,
  },

  changes: {
    header: "Compared with last week",
    saved: "Saved",
    slips: "Slips",
    success: "Resisted",
    scroll: "Feed per day",
    same: "No change",
  },

  percent: (value: number, sign = "") => `${sign}${value}%`,

  units: {
    days: DAYS,
    wins: WINS,
    slips: SLIPS,
    replacements: ALTERNATIVES,
  },

  reminder: {
    channel: "Weekly report",
    title: "Your weekly report is ready",
    body: "How much time you took back, your toughest hours and new achievements.",
  },
};
