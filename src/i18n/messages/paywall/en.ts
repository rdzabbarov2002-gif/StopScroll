import { selectPlural, type PluralForms } from "../../plural";
import type { Messages, PeriodUnit } from "./ru";

const PERIODS: Record<PeriodUnit, PluralForms> = {
  DAY: { one: "day", other: "days" },
  WEEK: { one: "week", other: "weeks" },
  MONTH: { one: "month", other: "months" },
  YEAR: { one: "year", other: "years" },
};

export const en: Messages = {
  close: "Close",
  title: "StopScroll Pro",
  activeTitle: "You have Pro",
  thanks: "Thanks for supporting the app!",
  activeText: "All exercises, alternatives, and analytics are unlocked.",
  done: "Done",
  plansFailed: "Couldn’t load plans.",
  retry: "Try Again",
  tryTrial: (trial: string) => `Try ${trial}`,
  subscribe: "Get Pro",
  restore: "Restore Purchases",
  nothingToRestore: "No active purchases found for this store account.",
  renewal: (plan: string, price: string) =>
    `The “${plan}” subscription for ${price} renews automatically until you cancel it. You can cancel anytime in App Store or Google Play settings, at least 24 hours before the end of the period.`,
  table: {
    free: "Free",
    pro: "Pro",
    yes: "yes",
    no: "no",
    row: (label: string, free: string, pro: string) => `${label}: Free — ${free}, Pro — ${pro}`,
  },
  rows: {
    sos: "SOS pause",
    exercises: "Pause exercises",
    replacements: "Alternatives",
    replacementsPro: (count: number) => `${count} + custom`,
    trend: "Trends",
    heatmap: "Heatmap",
    converter: "Time converter",
    patterns: "Patterns",
    days: (count: number) => `${count} days`,
    weeks: (count: number) => `${count} weeks`,
  },
  headlines: {
    default: {
      title: "Win your time back from the algorithms",
      text: "All exercises, the full catalog of alternatives, your own habits, and in-depth analytics.",
    },
    exercises: {
      title: "Every exercise for the SOS pause",
      text: "Box breathing, counting back from 100, and honest questions — different keys for different urges.",
    },
    replacements: {
      title: "The full catalog of micro-alternatives",
      text: "More movement, brain teasers, and quick facts — healthy dopamine for any moment.",
    },
    custom: {
      title: "Your own alternatives and habits",
      text: "Add what works for you: guitar, push-ups, a page of a book.",
    },
    analytics: {
      title: "In-depth pattern analytics",
      text: "Find out at what hour and on which weekday the feed wins most often — and get ready in advance.",
    },
    history: {
      title: "Your full progress history",
      text: "30-day trends and a 16-week heatmap — see how your habit is changing.",
    },
    converter: {
      title: "The full time converter",
      text: "Workouts, language lessons, and talks with loved ones that you’ve won back from the feed.",
    },
  },
  plans: {
    annual: "Yearly",
    sixMonths: "6 Months",
    threeMonths: "3 Months",
    twoMonths: "2 Months",
    monthly: "Monthly",
    weekly: "Weekly",
    lifetime: "Lifetime",
    trial: (count: number, unit: PeriodUnit) =>
      `${count} ${selectPlural("en", count, PERIODS[unit])} free`,
    oneTime: "one-time purchase",
    pricePerMonth: (price: string) => `≈ ${price}/month`,
    perMonth: "per month",
    perWeek: "per week",
    savings: (percent: number) => `−${percent}%`,
  },
  unavailable: {
    demoTitle: "This is a demo: payments are off",
    devTitle: "Purchases aren’t set up in this build",
    title: "Purchases are temporarily unavailable",
    demoText:
      "In the App Store and Google Play app, plans appear here. To explore Pro features, turn on Test Pro.",
    devText:
      "Add your RevenueCat keys to .env.local (see .env.example) and restart the build — plans will appear here automatically.",
    text: "Couldn’t reach the store. Try again later — all free features keep working.",
    testProOff: "Turn Off Test Pro",
    testProOn: "Turn On Pro for Testing",
  },
  errors: {
    network: "Can’t reach the store. Check your internet connection and try again.",
    alreadyPurchased: "You already have this subscription. Tap “Restore Purchases”.",
    notAllowed: "Purchases aren’t allowed on this device or account.",
    pending:
      "Your payment is awaiting approval. Pro will turn on automatically once it goes through.",
    planUnavailable: "This plan isn’t available in your store right now.",
    generic: "Couldn’t complete the purchase. Please try again a little later.",
    noPlans: "Plans haven’t been published yet. Check back a little later.",
    notActivated: "Payment went through, but Pro isn’t active yet. Try “Restore Purchases”.",
  },
};
