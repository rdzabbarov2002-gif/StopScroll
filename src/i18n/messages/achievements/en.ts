import { selectPlural, type PluralForms } from "../../plural";
import type { Messages } from "./ru";

const word = (count: number, value: PluralForms) => selectPlural("en", count, value);

const ACHIEVEMENTS: PluralForms = { one: "achievement", other: "achievements" };

export const en: Messages = {
  title: "Achievements",
  back: "Back",
  earned: "Earned",
  ofTotal: (total: number) => `of ${total}`,
  closest: (title: string, progress: string) => `Closest: “${title}” — ${progress}.`,
  allEarned: "You’ve earned every achievement. The feed no longer calls the shots.",
  earnedCount: (count: number) => `${count} ${word(count, ACHIEVEMENTS)}`,
  ahead: "Still ahead",
  earnedOn: (date: string) => `Earned ${date}`,
  howToEarn: "How to earn it",

  progress: {
    minutes: (current: string, target: string) => `${current} of ${target}`,
    count: (current: number, target: number, unit: PluralForms) =>
      `${current} of ${target} ${word(target, unit)}`,
    once: "Still ahead",
    onceInline: "still ahead",
  },

  units: {
    times: { one: "time", other: "times" },
    days: { one: "day", other: "days" },
    nights: { one: "night", other: "nights" },
    replacements: { one: "alternative", other: "alternatives" },
    refusals: { one: "urge", other: "urges" },
  },

  unlock: {
    overline: "New achievement",
    close: "Great",
    openAll: "All achievements",
  },

  items: {
    "first-choice": {
      title: "A first choice for yourself",
      description:
        "The urge pulled you toward the feed, and you chose a pause. This is where it all begins.",
      hint: "Take a pause or do an alternative instead of the feed.",
    },
    "first-evening": {
      title: "First evening without the feed",
      description: "An evening when you held on and never slipped into the feed.",
      hint: "Resist the feed in the evening (5–11 pm) and end the evening without a slip.",
    },
    "first-hour": {
      title: "Your first hour saved",
      description: "60 minutes that stayed yours, not the algorithm’s.",
      hint: "Save 60 minutes with pauses and alternatives.",
    },
    "morning-free": {
      title: "The morning is yours",
      description: "A morning that began with a pause, not with endless scrolling.",
      hint: "Resist the feed in the morning (5 am–noon) and don’t slip before noon.",
    },
    comeback: {
      title: "Slipped — and came back",
      description: "A slip wasn’t a reason to give up: you won the very next urge.",
      hint: "Resist an urge within 24 hours of a logged slip.",
    },
    "honest-look": {
      title: "Five honest looks back",
      description:
        "Five times after a slip, a calm talk about what happened instead of self-criticism.",
      hint: "Answer the coach’s “What happened?” after five slips.",
    },
    "sunday-evening": {
      title: "Sunday evening is yours",
      description: "The week’s most feed-heavy evening went by without a single slip.",
      hint: "Resist the feed on Sunday evening and end it without a slip.",
    },
    "week-in-limit": {
      title: "A week at your own pace",
      description: "Seven days in a row within your limit. The feed no longer sets the pace.",
      hint: "Stay within your daily limit for 7 days in a row.",
    },
    "nights-7": {
      title: "7 nights without late scrolling",
      description: "Seven nights when sleep mattered more than the feed.",
      hint: "Spend 7 nights (10 pm–5 am) without a slip on days you use StopScroll.",
    },
    "stress-10": {
      title: "Stress without escape",
      description: "10 times you faced stress without the feed. That’s what resilience is.",
      hint: "Resist 10 times when stress pulls you toward the feed.",
    },
    "boredom-20": {
      title: "20 wins over boredom",
      description: "Boredom called you to the feed twenty times — and lost twenty times.",
      hint: "Resist 20 times when boredom pulls you toward the feed.",
    },
    "replacements-25": {
      title: "Body and mind over the feed",
      description: "25 times you chose movement, a task or a fact instead of scrolling.",
      hint: "Complete 25 healthy alternatives.",
    },
    "refusals-30": {
      title: "30 urges resisted in a row",
      description: "Thirty urges in a row — and not a single slip between them.",
      hint: "Resist 30 times in a row without a slip.",
    },
    "half-feed": {
      title: "Half the feed",
      description: "A week when the feed took half the time it did before StopScroll.",
      hint: "Log your time for 7 days, averaging no more than half your starting level.",
    },
    "day-of-life": {
      title: "A whole day of life, yours",
      description: "1,440 minutes saved. A whole day you took back for yourself.",
      hint: "Save 24 hours with pauses and alternatives.",
    },
  },

  firstEveningWith: (app: string) => `First evening without ${app}`,
};
