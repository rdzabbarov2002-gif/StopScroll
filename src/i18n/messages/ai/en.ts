import { selectPlural, type PluralForms } from "../../plural";
import type { Messages } from "./ru";

type Part = "morning" | "day" | "evening" | "night";
type Focus = Part | "all";

/** A number and its word never break apart: "3 days". */
const NB = " ";
const word = (value: number, forms: PluralForms) => selectPlural("en", value, forms);
const count = (value: number, forms: PluralForms) => `${value}${NB}${word(value, forms)}`;
const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const DAYS: PluralForms = { one: "day", other: "days" };
const SLIPS: PluralForms = { one: "slip", other: "slips" };
const CASES: PluralForms = { one: "case", other: "cases" };
const TIMES: PluralForms = { one: "time", other: "times" };
const MONTHS: PluralForms = { one: "month", other: "months" };
const MOVIES: PluralForms = { one: "movie", other: "movies" };
const PAGES: PluralForms = { one: "page", other: "pages" };
const WALKS: PluralForms = { one: "half-hour walk", other: "half-hour walks" };
const ENTRIES: PluralForms = { one: "entry", other: "entries" };
const SHIFTS: PluralForms = { one: "work shift", other: "work shifts" };

/** "once", "3 times" */
const times = (value: number) => (value === 1 ? "once" : count(value, TIMES));
/** "was" / "were" after "1 of …" / "3 of …". */
const wasWere = (value: number) => (value === 1 ? "was" : "were");

const WEEKDAY = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
/** "3 of the last 4 Tuesdays" */
const WEEKDAY_PLURAL = [
  "Mondays",
  "Tuesdays",
  "Wednesdays",
  "Thursdays",
  "Fridays",
  "Saturdays",
  "Sundays",
];

/** "3 of the last 4 Tuesdays were hard." */
const hardWeekdays = (hard: number, of: number, weekday: number) =>
  of === 1
    ? `The last ${WEEKDAY[weekday]} ${hard > 0 ? "was" : "wasn’t"} hard.`
    : `${hard} of the last ${of} ${WEEKDAY_PLURAL[weekday]} ${wasWere(hard)} hard.`;

const ADVERB: Record<Part, string> = {
  morning: "in the morning",
  day: "in the afternoon",
  evening: "in the evening",
  night: "at night",
};

const MONTH_NAMES = [
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

export const en: Messages = {
  yes: "Yes",
  no: "No",

  errors: {
    offline: "No internet connection. The analysis will resume once you’re back online.",
    timeout: "ChatGPT is taking too long to respond. We’ll try again shortly.",
    busy: "The service is overloaded right now. We’ll try again in a couple of minutes.",
    unavailable: "ChatGPT is unavailable right now. We’ll try again in a couple of minutes.",
    server: "The AI coach server is unavailable. We’ll try again later.",
    unusable: "ChatGPT’s response couldn’t be read. We’ll try again.",
  },

  sync: {
    entry: "ChatGPT is reviewing your entry…",
    deep: "ChatGPT is updating the analytics for your whole history…",
    translate: "ChatGPT is translating the coach’s memory into the new language…",
    retry: "Try Again",
    updated: (when: string) => `Analytics updated ${when}`,
    today: (time: string) => `today at ${time}`,
    onDate: (date: string, time: string) => `on ${date} at ${time}`,
  },

  date: {
    month: (month: number, year: number) => `${MONTH_NAMES[month]} ${year}`,
    months: (fromMonth: number, fromYear: number, toMonth: number, toYear: number) =>
      fromYear === toYear && fromMonth === toMonth
        ? `${MONTH_NAMES[fromMonth]} ${fromYear}`
        : fromYear === toYear
          ? `${MONTH_NAMES[fromMonth]}–${MONTH_NAMES[toMonth]} ${toYear}`
          : `${MONTH_NAMES[fromMonth]} ${fromYear} – ${MONTH_NAMES[toMonth]} ${toYear}`,
  },

  impulse: {
    label: "Urge",
    question: "What happened right before the urge to open the feed?",
    placeholder: "Describe what happened in your own words…",
    inputA11y: "What happened right before the urge to open the feed",
    outcomeLabel: "How it ended — if you already know",
    resisted: "Resisted",
    opened: "Opened the Feed",
    save: "Save",
    analysis: "Entry Analysis",
    hide: "Hide analysis",
    allAnalytics: "All AI Analytics",
    sos: "SOS Pause",
    notConfigured:
      "Entry saved. AI analysis isn’t connected in this build, so ChatGPT won’t read it.",
    needConsent:
      "Entry saved on your phone. For ChatGPT to review it, we need your permission to send entries.",
    allow: "Allow Analysis",
    failed: "Couldn’t get an analysis from ChatGPT. Your entry is saved.",
    retry: "Try Again",
    analyzing: "Entry saved. ChatGPT is reviewing it…",
  },

  entry: {
    cause: "Cause",
    emotion: "Feeling",
    context: "Situation",
    behavior: "Behavior",
    colon: ": ",
    notEnough: (missing: string | null) =>
      missing
        ? `Not enough information yet for a confident conclusion: ${missing}`
        : "Not enough information yet for a confident conclusion.",
  },

  history: {
    title: "Entry History",
    count: (value: number) => count(value, ENTRIES),
    more: "Show More",
    failed: "Analysis failed",
    waiting: "Awaiting analysis",
    unclear: "Cause unclear",
    resisted: " · resisted",
    opened: " · opened the feed",
    retry: "Retry Analysis",
    confirmDelete: "Delete this entry?",
    cancel: "Cancel",
    delete: "Delete",
    deleteEntry: "Delete Entry",
  },

  screen: {
    overline: "Personal Analytics",
    title: "AI Coach",
    preparing: "Preparing Analysis",
    startEntry:
      "Start with an entry on Home: what happened right before the urge to open the feed.",
    studying:
      "ChatGPT is studying your history — the first insights will appear here on their own.",
    moreEntries:
      "The more entries you make, the more accurate the patterns and forecasts. There’s nothing to run manually.",
    notConnected: "Not Connected",
    notConnectedTitle: "AI analysis isn’t connected in this build.",
    notConnectedText:
      "Entries are saved on your phone. Once the app is connected to the AI coach server, ChatGPT will review your entire history.",
    demoNote:
      "This is a sample screen. ChatGPT isn’t connected in the web demo, so the texts below are an example, not an analysis of your data. In the app, ChatGPT writes them based on your history.",
  },

  consent: {
    label: "Your Permission",
    declined: "AI analysis is off — entries stay only on your phone.",
    ask: "The AI coach needs your permission to study your habits",
    text: "Your entries, answers to questions, and habit stats (feed time, slips, wins — no name, email, or contacts) will be sent through the StopScroll server to OpenAI, where ChatGPT analyzes them. Under OpenAI’s policies, data sent through the API isn’t used to train models. The coach’s memory and your history are stored only on your phone. You can turn this off anytime in Settings.",
    allow: "Allow Analysis",
    notNow: "Not Now",
  },

  question: {
    label: "Clarifying Question",
    skip: "Skip",
  },

  highlights: {
    label: "AI Coach Highlights",
    a11y: "AI coach highlights, open analytics",
  },

  forecast: {
    title: "Today’s Forecast",
    probabilityA11y: (percent: number) => `Chance of opening the feed today: ${percent} percent`,
    probabilityCaption: "chance of opening the feed today",
    helps: "What Can Help Today",
    updatedAt: (time: string) => `Updated at ${time}`,
    analytics: "Analytics",
    soon: "Today’s forecast will appear soon.",

    hardPart: {
      morning: "This morning is likely to be tough.",
      day: "This afternoon is likely to be tough.",
      evening: "This evening is likely to be tough.",
      night: "Tonight is likely to be tough.",
    },
    medium: (rest: boolean, part: Part | null) =>
      `${rest ? "The rest of the day" : "Today"} could be tough${part ? `, especially ${ADVERB[part]}` : ""}.`,
    lowRest: "The rest of the day will likely be calmer.",
    low: "Today looks like a calm day.",
    preliminary: "The forecast is preliminary for now: there’s not much history yet.",
    passedHeadline: "Today’s hardest stretch is behind you.",
    passed: (from: string, to: string) =>
      `The risky window ${from}–${to} is behind you, and today it went by calmly.`,

    overLimit: (feed: string, limit: string) =>
      `You’ve already used up today’s limit: ${feed} of ${limit}.`,
    slipToday: "There’s already been a slip today — urges are usually stronger on days like this.",
    openedToday:
      "You’ve already opened the feed today — urges are usually stronger on days like this.",
    window: (inWindow: number, total: number, from: string, to: string) =>
      `${inWindow} of ${total} slips and entries in the past two months fell between ${from} and ${to}.`,
    weekdayHard: hardWeekdays,
    weekdayCalm: (hard: number, of: number, weekday: number) =>
      `${WEEKDAY_PLURAL[weekday]} are usually calm: ${
        of === 1
          ? `the last one ${hard > 0 ? "was" : "wasn’t"} hard`
          : `${hard} of the last ${of} ${wasWere(hard)} hard`
      }.`,
    afterHardUsuallyHard: (hard: number, of: number) =>
      `Yesterday was a hard day, and the day after a hard one has been hard ${times(hard)} out of ${of}.`,
    afterHardUsuallyFine: (hard: number, of: number) =>
      `Yesterday was a hard day, but you usually bounce back fast: the day after has been hard ${times(hard)} out of ${of}.`,
    afterHard: "Yesterday was a hard day.",
    recentSlips: (slips: number) =>
      `You’ve had ${count(slips, SLIPS)} in the last three days — urges are stronger than usual right now.`,
    streak: (days: number) => `You’ve stayed within your limit for ${count(days, DAYS)} in a row.`,
    calmWeek: "The feed hasn’t won once in the past week.",
    plan: (from: string, to: string) =>
      `Decide ahead of time what you’ll do from ${from} to ${to} instead of scrolling.`,
    needDays: (min: number, have: number) =>
      `The forecast needs at least ${count(min, DAYS)} of data from the past four weeks — so far you have ${have}.`,
    noSignals: "No clear risk signals today.",
    windowRest: (to: string) =>
      `If you can stay off the feed until ${to}, the rest of the day will go more calmly.`,
    windowDay: (to: string) =>
      `If you can stay off the feed until ${to}, your chances of a calm day go up noticeably.`,
    basis: (days: number) => `${count(days, DAYS)} of history`,
  },

  analytics: {
    conclusion: "Overall Takeaway",
    warnings: "Risky Periods",
    changes: "What’s Changing",
    causes: "Common Causes",
    situations: "Recurring Situations",
    emotions: "Emotional States",
    times: "Risky Times and Days",
    hypotheses: "Hypotheses",
    confidence: {
      low: "Weak evidence",
      medium: "Moderate evidence",
      high: "Strong evidence",
    },
    notFact: "still a guess, not a fact",
    confirmed: "confirmed by testing",
    self: "You vs. Yourself",
    saved: "Time You’ve Won Back",
    memory: "Long-Term Memory",

    conclusionPending: "Takeaways will appear after the next analysis of your history.",
    fewDays:
      "There’s not much data yet — the takeaways will get more accurate in a couple of weeks.",
    fewEntries:
      "There aren’t many entries yet: causes and situations will get more accurate as you add more.",

    causeNote: (value: number, of: number, part: Part | null) =>
      `${value} of ${count(of, CASES)}${part ? `, mostly ${ADVERB[part]}` : ""}`,

    slipsDown: (recent: number, previous: number) =>
      `Fewer slips over the past two weeks: ${recent} vs. ${previous} in the two weeks before.`,
    slipsUp: (recent: number, previous: number) =>
      `More slips over the past two weeks: ${recent} vs. ${previous} in the two weeks before.`,
    feedDown: (week: string, before: string) =>
      `Less time in the feed: ${week} a day on average this week vs. ${before} the week before.`,
    feedUp: (week: string, before: string) =>
      `More time in the feed: ${week} a day on average this week vs. ${before} the week before.`,
    heldMore: (resisted: number, of: number, before: number, beforeOf: number) =>
      `You’re resisting more often: ${resisted} of ${of} entries in the past two weeks vs. ${before} of ${beforeOf} before.`,
    heldLess: (resisted: number, of: number, before: number, beforeOf: number) =>
      `Resisting has gotten harder: ${resisted} of ${of} entries in the past two weeks vs. ${before} of ${beforeOf} before.`,

    calmSame: (percent: number) => `This month has as many calm days as last month: ${percent}%.`,
    calmVs: (percent: number, before: number) =>
      `Calm days this month: ${percent}% vs. ${before}% last month.`,
    weekVsUsual: (week: number, usual: string) =>
      `${count(week, SLIPS)} in the last 7 days; last month you averaged ${usual} a week.`,
    streakRecord: (days: number) =>
      `Your current streak is ${count(days, DAYS)} — your personal best.`,
    streakBest: (days: number, best: number) =>
      `Your current streak is ${count(days, DAYS)}; your best is ${count(best, DAYS)}.`,

    hardestMoved: (before: number, now: number) =>
      `Your hardest day of the week used to be ${WEEKDAY[before]}; now it’s ${WEEKDAY[now]}.`,
    partMoved: (before: Part, now: Part) =>
      `Your slips have shifted: they used to happen mostly ${ADVERB[before]}, now ${ADVERB[now]}.`,
    feedVsMonthsAgo: (now: string, before: string, months: number) =>
      `Average feed time: ${now} a day vs. ${before} ${count(months, MONTHS)} ago.`,
    bestStreak: (days: number) => `Best streak: ${count(days, DAYS)} within your limit.`,
    longestCalm: (days: number) => `Longest stretch without slips: ${count(days, DAYS)}.`,
    years: (before: number, beforeShare: number, year: number, share: number) =>
      `In ${before}, ${beforeShare}% of days were hard; in ${year}, ${share}%.`,

    chapter: (month: string, note: string, calm: number | null) =>
      `${cap(month)}: ${note}${calm === null ? "" : ` Calm days: ${calm}%.`}`,
    correction: (was: string, now: string, why: string | null) =>
      `Earlier: ${was}. Now, more precisely: ${now}${why ? ` (${why})` : ""}.`,
    scoped: (text: string, period: string) => `${text} (${period}; no longer the case).`,
    event: (date: string, note: string) => `${date}: ${note}`,

    savedHeadline: (duration: string) => `You’ve won back ${duration}.`,
    films: (films: number) => `about ${count(films, MOVIES)}`,
    oneShift: "a full work shift",
    shifts: (shifts: number) => count(shifts, SHIFTS),
    walks: (walks: number) => count(walks, WALKS),
    pages: (pages: number) => `${count(pages, PAGES)} of a book`,

    windowNote: (inWindow: number, total: number) =>
      `This window holds ${inWindow} of ${total} slips and entries from the past two months.`,
    weekdayTitle: (weekday: number) => WEEKDAY[weekday] ?? "",
    weekdayNote: hardWeekdays,
    afterRuns: (slipped: number, runs: number) =>
      `After calm streaks of 4+ days, a hard day followed within the next three days ${times(slipped)} out of ${runs}.`,
  },

  challenge: {
    label: "AI Challenge",
    proposed: "Let’s try a small experiment",
    day: (day: number, of: number) => `Experiment · Day ${day} of ${of}`,
    pastResult: "Last experiment’s results",
    result: "Experiment results",
    duration: (days: number) => `For ${count(days, DAYS)}.`,
    try: "Try It",
    notNow: "Not Now",
    daysA11y: "Experiment days",
    todayQuestion: "Did you manage it today?",
    managed: "Done",
    missed: "Missed",
    managedToday: "Done for today — noted.",
    missedToday: "Missed today — that’s still useful data for the results.",
    reviewing: "Experiment complete. Comparing the days before and during the experiment…",
    finished: "Experiment complete.",

    review: {
      managed: (days: number, of: number) => `You managed ${count(days, DAYS)} out of ${of}.`,
      noData: "There are no records from the experiment days, so there’s nothing to compare yet.",
      losses: (focus: Focus, during: number, before: number, days: number, change: number | null) =>
        `The feed won ${times(during)}${focus === "all" ? "" : ` ${ADVERB[focus]}`} during the ${days}-day experiment vs. ${times(before)} in ${
          days === 1 ? "the day" : `the ${count(days, DAYS)}`
        } before it${change === null ? "" : ` (${change > 0 ? "+" : "−"}${Math.abs(change)}%)`}.`,
      feed: (during: string, before: string) => `Average feed time: ${during} a day vs. ${before}.`,
      fewBefore:
        "There’s little data from before the experiment, so the comparison is preliminary.",
      helps: "Looks like this helps — it’s worth keeping.",
      same: "No difference yet — it may take more days.",
      worse: "These days weren’t any easier — so the cause is likely something else.",
    },
  },

  demo: {
    forecast: {
      headline: "This evening is likely to be tough.",
      reasons: [
        "For the last three Sundays, you’ve opened the feed between 21:00 and 23:00.",
        "You’ve had three slips in the last three days — more than usual for this week.",
        "Most of this month’s slips happened late in the evening, when you were tired.",
      ],
      window:
        "If you can stay off the feed until 23:00, your chances of a calm day go up noticeably.",
      advice: "Put your phone on the charger in another room around 21:00.",
      basis: "sample",
    },
    analytics: {
      conclusion:
        "It looks like the feed wins most often not out of boredom but from evening tiredness after a long day. During the day, you’re holding up noticeably better than a month ago.",
      dataNote: "There aren’t enough entries yet to draw conclusions about weekends.",
      warning: "After a run of 5+ calm days, you’ve slipped back on the weekend twice.",
      improvement:
        "Over the last two weeks, you’ve been opening the feed less and less during the day: 2 slips vs. 6.",
      worsening: "Late evenings have gotten harder: 4 of your last 5 slips came after 22:00.",
      habitChange: "Over the month, your after-work habit changed the most — it’s gotten calmer.",
      causes: [
        { title: "Tiredness", note: "Most often after 21:00 on weekdays." },
        { title: "Boredom", note: "Mostly during the day, on breaks." },
        { title: "Autopilot", note: "Opening it for no reason, right after unlocking." },
      ],
      situation: { title: "After work, at home", note: "Comes up in 6 of 14 entries." },
      emotion: { title: "Feeling drained", note: "Shows up in almost every evening entry." },
      time: { title: "21:00–23:00", note: "This window holds 15 of 17 slips from the past month." },
      weekday: { title: "Sunday", note: "The hardest day three weeks in a row." },
      hypothesis:
        "Evening walks seem to make opening the feed less likely: none of five walks was followed by a slip.",
      selfComparison: "This month you had 24% more calm days than last month.",
      longTerm: [
        "Earlier: the feed wins out of boredom at lunchtime. Now, more precisely: from tiredness late in the evening (based on entries from the past month).",
        "Best streak: 9 days within your limit.",
      ],
      savedHeadline: "You’ve won back almost 17 hours.",
      equivalents: ["about eight movies", "two work shifts", "34 half-hour walks"],
    },
    challenge: {
      title: "Phone out of the bedroom",
      description:
        "For three evenings in a row, leave your phone charging outside the bedroom from 22:30.",
      expectation: "Let’s see if late-night slips go down.",
    },
  },
};
