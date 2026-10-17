import { selectPlural, type PluralForms } from "../../plural";
import type { Cause, Messages } from "./ru";

/** "3 slips" — a number with its word, never broken across lines. */
const count = (value: number, forms: PluralForms) =>
  `${value}\u00A0${selectPlural("en", value, forms)}`;

const SLIPS: PluralForms = { one: "slip", other: "slips" };
const DAYS: PluralForms = { one: "day", other: "days" };
const TIMES: PluralForms = { one: "time", other: "times" };
const WALKS: PluralForms = { one: "walk", other: "walks" };
const ALTERNATIVES: PluralForms = { one: "alternative", other: "alternatives" };

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
/** "Friday" */
const day = (index: number) => WEEKDAYS[index] ?? "";
/** "Fridays" */
const days = (index: number) => `${day(index)}s`;

const ORDINALS = [
  "",
  "first",
  "second",
  "third",
  "fourth",
  "fifth",
  "sixth",
  "seventh",
  "eighth",
  "ninth",
  "tenth",
];
/** "third", "12th" */
function ordinal(value: number) {
  const word = ORDINALS[value];
  if (word) return word;
  const tens = value % 100;
  const suffix =
    tens >= 11 && tens <= 13
      ? "th"
      : value % 10 === 1
        ? "st"
        : value % 10 === 2
          ? "nd"
          : value % 10 === 3
            ? "rd"
            : "th";
  return `${value}${suffix}`;
}

export const en: Messages = {
  greeting: {
    morning: "Good morning",
    afternoon: "Good afternoon",
    evening: "Good evening",
    night: "Good evening",
  },

  tidy: (text: string) =>
    text.replace(/(\d) of (\d)/g, "$1\u00A0of\u00A0$2").replace(/(\d) —/g, "$1\u00A0—"),

  guard: {
    forbidden: /artificial intelligence|neural net|language model/i,
    weekdays: [/monday/i, /tuesday/i, /wednesday/i, /thursday/i, /friday/i, /saturday/i, /sunday/i],
  },

  briefing: {
    risk: {
      hardWeekday: (index: number, bad: number, active: number) =>
        `${days(index)} are most often hard days for you: ${bad} of the last ${active} ${days(index)}.`,
      calmWeekday: (index: number, bad: number, active: number) =>
        bad === 0
          ? `On ${days(index)}, slips are usually rare: none of the last ${active} was a hard day.`
          : `On ${days(index)}, slips are usually rare: only ${bad} of the last ${active} ${bad === 1 ? "was a hard day" : "were hard days"}.`,
      recentSlips: (slips: number) =>
        `${count(slips, SLIPS)} in the last three days — the urges are stronger than usual right now.`,
      oneRecentSlip: "There was one slip in the last three days.",
      yesterdayOver: (scroll: string, limit: string) =>
        `Yesterday the feed took ${scroll} — more than your ${limit} limit.`,
      todayOver: (scroll: string, limit: string) =>
        `Today’s limit is already used up: ${scroll} of ${limit}.`,
      todaySlip: "There’s already been a slip today.",
      streak: (value: number) => `You’ve stayed within your limit ${count(value, DAYS)} in a row.`,
      heavierWeek: (recent: string, previous: string) =>
        `This past week was heavier than the one before: ${recent} of feed a day on average vs ${previous}.`,
      lighterWeek: (recent: string, previous: string) =>
        `This past week was lighter than the one before: ${recent} of feed a day on average vs ${previous}.`,
      calmWeek: "Not a single slip in the past week.",
      noSignals: (slips: number) =>
        `No clear risk signals today: ${count(slips, SLIPS)} this week, none back to back.`,
    },
    memory: {
      workedEvening: "Yesterday’s advice worked: the evening went by without slips.",
      workedDay: "Yesterday’s advice worked: no slips, and you stayed within your limit.",
      missed: [
        "Yesterday didn’t work out — and that’s okay. Today we’ll try a different angle.",
        "Yesterday’s advice didn’t work, and that’s useful to know too. Today, a different approach.",
      ],
    },
  },

  insights: {
    timeAfter: [
      (slips: number, total: number, time: string) =>
        `Over the last four weeks, ${slips} of ${total} slips happened after ${time}.`,
      (slips: number, total: number, time: string) =>
        `Most slips — ${slips} of ${total} over the last four weeks — start after ${time}.`,
    ],
    timeWindow: (from: string, to: string, slips: number, total: number) =>
      `Slips happen most often between ${from} and ${to}: ${slips} of ${total} over the last four weeks.`,
    topReason: [
      (cause: Cause, slips: number, total: number) =>
        `The main reason behind your recent slips is ${cause.noun}: ${slips} of ${total}.`,
      (cause: Cause, slips: number, total: number) =>
        `Over the last three weeks, slips most often happened ${cause.because}: ${slips} of ${total}.`,
    ],
    recurringWeekday: (weeks: number, index: number) =>
      `This is the ${ordinal(weeks)} week in a row that ${day(index)} has been your hardest day.`,
    hardWeekday: (index: number, bad: number, active: number) =>
      `${day(index)} is your hardest day: ${bad} of the last ${active} ${days(index)} had a slip or went over the limit.`,
    calmWeekdayNone: (index: number, active: number) =>
      `On ${days(index)}, the risk of a slip is minimal: not one of the last ${active} ${days(index)} was hard.`,
    calmWeekday: (index: number, bad: number, active: number) =>
      `${days(index)} see the fewest slips: only ${bad} of the last ${active} ${days(index)} ${bad === 1 ? "was" : "were"} hard.`,
    walksNoSlips: (walks: number) =>
      `You took ${count(walks, WALKS)} over the last four weeks — and not one was followed by a slip within three hours.`,
    walksFewSlips: (slipsAfter: number, walks: number) =>
      `Slips rarely follow a walk: only ${slipsAfter} of ${count(walks, WALKS)} ended in the feed within three hours.`,
    replacementsNoSlips: (withoutRate: number) =>
      `On days when you do at least one alternative, there were no slips at all, while ${withoutRate}% of days without one were hard.`,
    replacementsFewer: (withRate: number, withoutRate: number) =>
      `Days with alternatives are clearly easier: ${withRate}% were hard vs ${withoutRate}% of other days.`,
    scrollDownSteady: (average: string, change: number) =>
      `Two weeks of steady progress: the feed takes ${average} a day on average, ${change}% less than before, with no extra slips.`,
    scrollDown: (average: string, change: number) =>
      `Over the last two weeks, the feed has taken ${average} a day on average — ${change}% less than the two weeks before.`,
    scrollUp: (recent: string, previous: string) =>
      `There’s been more feed over the last two weeks: ${recent} a day on average vs ${previous} before.`,
    slipsDown: (recent: number, previous: number) =>
      `Noticeably fewer slips: ${recent} in the last two weeks vs ${previous} before that.`,
    slipsUp: (recent: number, previous: number) =>
      `More slips over the last two weeks: ${recent} vs ${previous} before that.`,
    eveningBetter: (time: string, recent: number, previous: number) =>
      `Your evenings are better than a month ago: ${count(recent, SLIPS)} after ${time} this month vs ${previous} the month before.`,
    shorterSlips: (recent: string, previous: string) =>
      `Slips have gotten shorter: ${recent} on average vs ${previous} two weeks earlier.`,
    streakGap: (best: number, gap: number) =>
      `Your best is ${count(best, DAYS)} in a row — just ${count(gap, DAYS)} to go.`,
    streakRecord: (value: number) =>
      `You’re on your longest streak yet: ${count(value, DAYS)} in a row within your limit.`,
  },

  advice: {
    earlySleep: [
      "Today, try going to bed half an hour earlier and leaving your phone to charge outside the bedroom.",
      "Better to get to bed early today: to a tired brain the feed always seems like a good idea — in the morning, not so much.",
    ],
    phoneAway: [
      (time: string) =>
        `After dinner today, put your phone in another room for at least 15 minutes — especially around ${time}.`,
      (time: string) =>
        `Around ${time}, put your phone face down in another room and let the evening pass without the feed.`,
    ],
    walkHelps: [
      "You almost never slip after a walk. Today, when the feed pulls at you, start with five minutes outside.",
      "Walks help you — the data shows it. When the feed pulls at you today, go out for a walk, even just for five minutes.",
    ],
    walkTry: (app: string | null) =>
      `When ${app ?? "the feed"} pulls at you today, try a short walk instead.`,
    livingAlternative: [
      "Keep one “real” alternative to the feed in sight — a book, a notebook, a guitar. Boredom needs novelty, not endless scrolling.",
      "Have one thing ready for when boredom strikes: a page of a book, a quick puzzle, a call. Then the feed has some competition.",
    ],
    moveApps:
      "Move feed apps off your Home Screen. Autopilot is faster than thought — give it one extra step.",
    moveApp: (app: string) =>
      `Move ${app} off your Home Screen. Autopilot is faster than thought — give it one extra step.`,
    breatheFirst: [
      "If you feel anxious today, start with a long exhale or an SOS pause. The feed promises an escape, but the anxiety comes back afterwards.",
      "When tension builds, give yourself a 15-second SOS pause before opening the feed. It calms your body faster than videos do.",
    ],
    callSomeone:
      "Text one person close to you today. A real conversation warms you more than other people’s lives in a feed.",
    tinyStep:
      "If you feel like putting something off today, just take a first two-minute step. The feed is mostly a way not to start.",
    realRest:
      "Today, pick a kind of rest that actually leaves you lighter: a shower, music with your eyes closed, or five minutes of stretching.",
    keepRhythmLogged: [
      "Low risk today — just keep your rhythm. If the feed pulls at you, the pause is always at hand.",
      "A calm day today. Nothing to prove — just carry on as you are.",
    ],
    keepRhythm: [
      "Low risk today — just keep your rhythm. Tonight, log your feed time to keep the streak going.",
      "A calm day today. Don’t forget to log your feed time tonight — the streak is built on those entries.",
    ],
    logLearning:
      "Log how much time goes to the feed every day, and note your slips. In a few days I’ll be able to say something specific about your habits.",
    logToday: "Log how much time went to the feed today — it’ll help me spot patterns.",
    sosReady: [
      "Keep the SOS pause at hand: 15 seconds of breathing, and the decision is yours again.",
      "If the urge turns out strong, tap the SOS pause. It doesn’t forbid anything — it just gives you time to think.",
    ],
    forWeek: (tip: string) =>
      tip.replace(/\bToday\b/g, "This week").replace(/\btoday\b/g, "this week"),
  },

  replacement: {
    helped: (times: number) => `After it, you’ve stayed slip-free ${count(times, TIMES)} already.`,
    matches: (cause: Cause) => `Good for when the reason is ${cause.noun} — your most common one.`,
    lastTime: "Last time, no slip followed it.",
  },

  reflection: {
    understanding: {
      boredom: "Boredom is one of the most common reasons a hand reaches for the feed.",
      fatigue:
        "When you’re out of energy, the brain picks the easiest option — and the feed is always at hand.",
      relax:
        "Wanting rest is normal. The feed just rarely gives the kind of rest you came to it for.",
      sleepless:
        "When you can’t sleep, the screen feels like a rescue, but it usually just pushes sleep further away.",
      autopilot: "Autopilot kicks in before thought does — that’s a habit, not a weakness.",
      stress:
        "When you’re anxious, the feed promises a breather. No wonder your hand reaches for it.",
      loneliness:
        "When you feel lonely, other people’s lives in the feed feel like company for a while.",
      procrastination:
        "The feed often helps you avoid starting something hard. It happens to everyone.",
      other: "Working out what happened is already a useful step.",
    },
    nextTime: {
      boredom: "Next time, try a short alternative first — boredom needs novelty.",
      fatigue: "Today it’s better to go to bed early than to run on willpower.",
      relax: "Next time, try resting without a screen — even for five minutes.",
      sleepless:
        "If you can’t sleep again, dim the lights and put your phone far away from the bed.",
      autopilot:
        "Friction helps: move the app off your Home Screen, and autopilot will have a harder time.",
      stress:
        "Next time, start with a long exhale or an SOS pause — your body will calm down faster.",
      loneliness: "Next time, try texting a real person — that warmth lasts longer.",
      procrastination:
        "Next time, start the task with a two-minute step — it usually gets easier from there.",
      other: "If you like, add a few words — it makes it easier to notice what repeats.",
    },
    thanksForNote: "Thank you for putting it in your own words — I’ll remember that.",
    noted: "I’ll remember this.",
    repeated: (times: number, cause: Cause) =>
      `This is already the ${ordinal(times)} time in two weeks that the reason was ${cause.noun}.`,
    twice: "Something similar happened just recently — I’ll keep it in mind.",
    first: "I’ll remember this: the more honest your notes, the more precise my advice.",
    lateEvening: (cause: Cause) =>
      `Late evening plus ${cause.noun} is a combination in which the feed almost always wins.`,
    close: [
      "One slip doesn’t cancel anything out.",
      "This is one episode, not the sum of your day.",
      "Tomorrow is a new day.",
    ],
  },

  review: {
    titles: {
      good: "What went well",
      worse: "What got worse",
      habit: "Which habit improved",
      weak: "Where the feed wins most often",
      next: "What to try next week",
    },
    savedMovies: (duration: string, movies: number) =>
      `This week gave you back ${duration} — enough for ${movies === 1 ? "a whole movie" : `${movies} movies`}.`,
    saved: (duration: string) => `This week gave you back ${duration}.`,
    daysInLimit: (inLimit: number, logged: number) =>
      `${inLimit} of ${count(logged, DAYS)} within your limit.`,
    fewerSlips: (now: number, before: number) =>
      `Fewer slips: ${now} vs ${before} the week before.`,
    impulses: (percent: number) => `${percent}% of urges passed without the feed.`,
    replacements: (replacements: number) =>
      `${count(replacements, ALTERNATIVES)} instead of the feed.`,
    noWins: [
      "Not many clear wins this week — but now you can see what to build on.",
      "A tough week. That’s not a failure, it’s data: it already shows where to soften the landing.",
    ],
    firstWeek: "Nothing to compare with yet — this is the first week with entries.",
    moreSlips: (now: number, before: number) => `More slips: ${now} vs ${before}.`,
    moreScroll: (now: string, before: string) =>
      `The feed took ${now} a day on average vs ${before} the week before.`,
    heldLess: (now: number, before: number) =>
      `Resisting worked less often: ${now}% vs ${before}%.`,
    nothingWorse: "Nothing got noticeably worse.",
    habitFirstWeek: "Nothing to compare with yet — in a week you’ll see the trend here.",
    eveningHabit: (time: string, now: number, before: number) =>
      `Evenings: ${count(now, SLIPS)} after ${time} vs ${before} the week before.`,
    reasonHabit: (cause: Cause, now: number, before: number) =>
      `Fewer slips ${cause.because}: ${now} vs ${before} the week before.`,
    switchHabit: (now: number, before: number) =>
      `The habit of switching is getting stronger: ${count(now, ALTERNATIVES)} vs ${before} the week before.`,
    scrollHabit: (now: string, before: string) => `Feed time went down: ${now} a day vs ${before}.`,
    noHabit: "No habit has clearly shifted yet — that’s normal for a single week.",
    noWeakSpots: "No weak spots: not a single slip all week.",
    singleSlip: (index: number, time: string, cause: Cause | null) =>
      `There was one slip — on ${day(index)} around ${time}${cause ? `, ${cause.because}` : ""}.`,
    hardest: (index: number | null, time: string | null, cause: Cause | null) => {
      const where = [index !== null ? `on ${day(index)}` : null, time && `around ${time}`]
        .filter(Boolean)
        .join(" ");
      const why = cause ? ` — usually ${cause.because}` : "";
      return where
        ? `It was hardest ${where}${why}.`
        : `The hard moments came at different times${why}.`;
    },
    goal: (tip: string, target: number) =>
      `${tip} And a small goal: ${target} of 7 days within your limit.`,
    logDaily: (tip: string) =>
      `${tip} And try logging your feed time every day — it’ll make the next review more accurate.`,
  },

  ui: {
    badge: "Your personal coach",
    briefing: {
      learningCaption: "Getting to know your habits",
      caption: "Today’s briefing",
      learning: (needed: number) =>
        `I’m still gathering information — the forecast will appear once there are ${count(needed, DAYS)} with entries.`,
      progress: (active: number, needed: number) =>
        `Days with entries: ${active} of ${needed}. Anything counts: feed time, an SOS pause, an alternative or a slip.`,
      riskTitle: "Risk of mindless scrolling today",
      riskA11y: (level: string) => `Risk of mindless scrolling today: ${level}`,
      riskLevels: { low: "Low", medium: "Medium", high: "High" },
      why: "Why: ",
      adviceTitle: "Today’s advice",
      start: (title: string) => `Start: ${title}`,
    },
    insightsTitle: "What the entries show",
    reflection: {
      title: "What happened?",
      subtitle: "No judgment — just to see what repeats.",
      replyTitle: "I understand",
      placeholder: "Or in your own words — optional",
      noteA11y: "What happened, in your own words",
      done: "Done",
      notNow: "Not now",
      tryReplacement: (title: string) => `Try: ${title}`,
      thanks: "Thanks",
    },
    weeklyCaption: "Weekly review",
  },
};
