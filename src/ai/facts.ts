import { getTrigger } from "../utils/catalog";
import { addDays, dayKey, parseDayKey, weekdayIndex } from "../utils/date";
import { getBestStreak, getCurrentStreak, isControlled, type ScrollLog } from "../utils/stats";
import type { Settings, SlipEntry, WinArchive, WinEntry } from "../utils/types";
import type { AiChallenge, AiEntry, ChallengeFocus } from "./types";

/**
 * The user's history day by day, and the arithmetic over it. Everything that is plain counting —
 * by hour, weekday, week and month, streaks, records, causes, saved time — is done here, on the
 * device: it is exact, instant and free. ChatGPT gets only a compact table of these numbers
 * (deepStats) with the rare deep analysis, never the raw records.
 */

/** Lists are newest first, as the app keeps them. */
export interface FactsInput {
  wins: readonly WinEntry[];
  winArchive: WinArchive;
  slips: readonly SlipEntry[];
  scrollLog: ScrollLog;
  settings: Settings;
  entries: readonly AiEntry[];
  now: number;
}

export const WEEKDAYS = [
  "понедельник",
  "вторник",
  "среда",
  "четверг",
  "пятница",
  "суббота",
  "воскресенье",
] as const;
const WEEKDAYS_SHORT = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"] as const;

/** Questions at most every three days; an experiment about once a week. */
export const QUESTION_COOLDOWN_DAYS = 3;
export const CHALLENGE_COOLDOWN_DAYS = 6;
/** Months of history kept in the tables. */
const MAX_MONTHS = 24;
export const DAY_MS = 86_400_000;

const pad = (value: number) => String(value).padStart(2, "0");
export const clock = (timestamp: number) => {
  const date = new Date(timestamp);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
export const hourOf = (timestamp: number) => new Date(timestamp).getHours();
export const minuteOfDay = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.getHours() * 60 + date.getMinutes();
};

export type PartOfDay = Exclude<ChallengeFocus, "all">;

export function partOfDay(hour: number): PartOfDay {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "day";
  if (hour >= 17 && hour < 23) return "evening";
  return "night";
}

export interface Day {
  key: string;
  weekday: number;
  feed: number | null;
  slips: SlipEntry[];
  wins: number;
  savedMinutes: number;
  entries: AiEntry[];
}

/** A slip, the feed over the limit, or an entry that ended with the feed opened. */
export const isHard = (day: Day, limit: number) =>
  day.slips.length > 0 ||
  (day.feed !== null && day.feed > limit) ||
  day.entries.some((entry) => entry.outcome === "opened");

export const isObserved = (day: Day) =>
  day.feed !== null || day.slips.length > 0 || day.wins > 0 || day.entries.length > 0;

/** Whether there is anything at all to analyze. */
export const hasHistory = (t: Timeline) =>
  t.all.some(isObserved) || t.input.entries.some((entry) => entry.analysis !== null);

/** When the feed won: slips and entries that ended with the feed opened. */
export const lossTimes = (day: Day) => [
  ...day.slips.map((slip) => slip.timestamp),
  ...day.entries.filter((entry) => entry.outcome === "opened").map((entry) => entry.timestamp),
];

/** When it pulled to the feed at all: slips and every entry. */
export const urgeTimes = (day: Day) => [
  ...day.slips.map((slip) => slip.timestamp),
  ...day.entries.map((entry) => entry.timestamp),
];

export const average = (values: number[]) =>
  values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;

export interface Timeline {
  now: number;
  today: string;
  limit: number;
  input: FactsInput;
  days: Map<string, Day>;
  /** Every day from the first record (at most two years back) to today, oldest first. */
  all: Day[];
  /** The same without today. */
  past: Day[];
  todayRecord: Day;
  firstDay: string;
}

export function buildTimeline(input: FactsInput): Timeline {
  const { now } = input;
  const today = dayKey(now);
  const firstTimestamps = [
    input.slips[input.slips.length - 1]?.timestamp,
    input.wins[input.wins.length - 1]?.timestamp,
    input.entries[input.entries.length - 1]?.timestamp,
  ].filter((value): value is number => value !== undefined);
  const firstLogged = Object.keys(input.scrollLog).sort()[0];
  const firstDay =
    [...firstTimestamps.map((timestamp) => dayKey(timestamp)), firstLogged]
      .filter((key): key is string => Boolean(key) && key! <= today)
      .sort()[0] ?? today;
  const limitStart = addDays(today, -(MAX_MONTHS * 31));
  const spanStart = firstDay < limitStart ? limitStart : firstDay;

  const days = new Map<string, Day>();
  for (let key = spanStart; key <= today; key = addDays(key, 1)) {
    days.set(key, {
      key,
      weekday: weekdayIndex(key),
      feed: input.scrollLog[key] ?? null,
      slips: [],
      wins: 0,
      savedMinutes: 0,
      entries: [],
    });
  }
  const dayOf = (timestamp: number) => days.get(dayKey(timestamp));
  for (const slip of input.slips) dayOf(slip.timestamp)?.slips.push(slip);
  for (const win of input.wins) {
    const day = dayOf(win.timestamp);
    if (day) {
      day.wins += 1;
      day.savedMinutes += win.minutesSaved;
    }
  }
  for (const entry of input.entries) dayOf(entry.timestamp)?.entries.push(entry);

  const all = [...days.values()];
  return {
    now,
    today,
    limit: input.settings.dailyLimitMinutes,
    input,
    days,
    all,
    past: all.slice(0, -1),
    todayRecord: days.get(today)!,
    firstDay,
  };
}

/** Past days with records from the day `from` on, oldest first. */
export const observedSince = (t: Timeline, from: string) =>
  t.past.filter((day) => day.key >= from && isObserved(day));

/** Urges (slips and entries) by hour over the last `days` days. */
export function urgeHours(t: Timeline, days: number) {
  const from = addDays(t.today, -days);
  const hours = Array<number>(24).fill(0);
  for (const day of t.all) {
    if (day.key < from) continue;
    for (const timestamp of urgeTimes(day)) hours[hourOf(timestamp)]! += 1;
  }
  return hours;
}

/** The three hours (possibly over midnight) with the most urges — when they cluster clearly. */
export function dangerWindow(hours: readonly number[], minShare = 0.4) {
  const total = hours.reduce((sum, value) => sum + value, 0);
  let best = { from: 0, count: 0, first: 0 };
  for (let from = 0; from < 24; from += 1) {
    const inWindow = [0, 1, 2].reduce((sum, offset) => sum + hours[(from + offset) % 24]!, 0);
    // Of equal windows, the one that starts where the urges start.
    if (inWindow > best.count || (inWindow === best.count && hours[from]! > best.first)) {
      best = { from, count: inWindow, first: hours[from]! };
    }
  }
  return best.count >= 3 && best.count / total >= minShare
    ? { from: best.from, to: (best.from + 3) % 24, count: best.count, total }
    : null;
}

/** Hard and observed days per weekday (Monday first). */
export function weekdayRates(t: Timeline, list: readonly Day[]) {
  return Array.from({ length: 7 }, (_, index) => {
    const observed = list.filter((day) => day.weekday === index && isObserved(day));
    return {
      index,
      observed: observed.length,
      hard: observed.filter((day) => isHard(day, t.limit)).length,
    };
  });
}

/** Runs of days within the limit without slips, and how many of the next three days were hard. */
export function calmRuns(t: Timeline) {
  type Run = { start: string; end: string; days: number; hardNext3: number | null };
  const runs: Run[] = [];
  let open: Run | undefined;
  for (const day of t.all) {
    if (isControlled(day.feed ?? undefined, t.limit) && day.slips.length === 0) {
      if (open) {
        open.end = day.key;
        open.days += 1;
      } else {
        open = { start: day.key, end: day.key, days: 1, hardNext3: null };
      }
    } else if (open) {
      if (open.days >= 3) runs.push(open);
      open = undefined;
    }
  }
  if (open && open.days >= 3) runs.push(open);
  for (const run of runs) {
    run.hardNext3 =
      run.end >= addDays(t.today, -3)
        ? null
        : [1, 2, 3]
            .map((offset) => t.days.get(addDays(run.end, offset)))
            .filter((day): day is Day => day !== undefined && isHard(day, t.limit)).length;
  }
  return runs;
}

export const streaks = (t: Timeline) => ({
  current: getCurrentStreak(t.input.scrollLog, t.limit, t.today),
  best: Math.max(
    getBestStreak(t.input.scrollLog, t.limit),
    getCurrentStreak(t.input.scrollLog, t.limit, t.today),
  ),
});

/** Causes: ChatGPT's tags from the entries and the reasons chosen in the journal, merged. */
export function causeCounts(t: Timeline, sinceDays?: number) {
  const from = sinceDays === undefined ? 0 : t.now - sinceDays * DAY_MS;
  const counts = new Map<string, { count: number; hours: number[] }>();
  const add = (name: string, timestamp: number) => {
    const current = counts.get(name) ?? { count: 0, hours: [] };
    current.count += 1;
    current.hours.push(hourOf(timestamp));
    counts.set(name, current);
  };
  let items = 0;
  for (const entry of t.input.entries) {
    if (entry.timestamp < from || !entry.analysis?.tags.length) continue;
    items += 1;
    for (const tag of new Set(entry.analysis.tags)) add(tag, entry.timestamp);
  }
  for (const slip of t.input.slips) {
    if (slip.timestamp < from || !slip.trigger || slip.trigger === "other") continue;
    items += 1;
    add(getTrigger(slip.trigger).noun, slip.timestamp);
  }
  return { items, causes: [...counts.entries()].sort((a, b) => b[1].count - a[1].count) };
}

export const savedMinutes = (t: Timeline, sinceDay?: string) =>
  sinceDay === undefined
    ? t.input.wins.reduce((sum, win) => sum + win.minutesSaved, 0) + t.input.winArchive.minutes
    : t.all.filter((day) => day.key >= sinceDay).reduce((sum, day) => sum + day.savedMinutes, 0);

/** Calendar months, oldest first, for "half a year ago it was different". */
export function monthStats(t: Timeline) {
  const keys = [...new Set(t.all.filter(isObserved).map((day) => day.key.slice(0, 7)))]
    .sort()
    .slice(-MAX_MONTHS);
  return keys.map((month) => {
    const list = t.all.filter((day) => day.key.startsWith(month) && isObserved(day));
    const slips = list.flatMap((day) => day.slips);
    const byPart = { morning: 0, day: 0, evening: 0, night: 0 };
    for (const slip of slips) byPart[partOfDay(hourOf(slip.timestamp))] += 1;
    // The weekday with the highest share of hard days (two or more observed); a tie — none.
    const rated = weekdayRates(t, list)
      .filter((day) => day.observed >= 2 && day.hard > 0)
      .map((day) => ({ index: day.index, rate: day.hard / day.observed }))
      .sort((a, b) => b.rate - a.rate);
    const hardest =
      rated[0] && (rated.length === 1 || rated[0].rate > rated[1]!.rate) ? rated[0].index : null;
    const entries = list.flatMap((day) => day.entries);
    return {
      month,
      observed: list.length,
      hard: list.filter((day) => isHard(day, t.limit)).length,
      slips: slips.length,
      byPart,
      entries: entries.length,
      opened: entries.filter((entry) => entry.outcome === "opened").length,
      avgFeed: average(list.filter((day) => day.feed !== null).map((day) => day.feed!)),
      hardest,
    };
  });
}

/**
 * A fingerprint of the app's records (not of the date), to notice whether the history changed
 * since the last deep analysis: new or deleted slips and wins, a reason given, feed time logged.
 */
export function recordsKey(input: Pick<FactsInput, "wins" | "slips" | "scrollLog">) {
  const feed = Object.entries(input.scrollLog);
  return [
    input.slips.length,
    input.slips[0]?.timestamp ?? 0,
    input.slips.filter((slip) => slip.trigger !== null).length,
    input.wins.length,
    input.wins[0]?.timestamp ?? 0,
    feed.length,
    feed.reduce((sum, [key, minutes]) => sum + minutes * (Number(key.slice(-2)) + 1), 0),
  ].join("|");
}

/**
 * The whole history for the deep analysis in a few hundred tokens: tables with their columns
 * named once (`cols`), instead of thousands of raw records.
 */
export function deepStats(t: Timeline) {
  const thisMonday = addDays(t.today, -weekdayIndex(t.today));
  const weeks = Array.from({ length: 8 }, (_, index) => {
    const monday = addDays(thisMonday, -7 * (7 - index));
    const list = Array.from({ length: 7 }, (__, offset) =>
      t.days.get(addDays(monday, offset)),
    ).filter((day): day is Day => day !== undefined);
    const logged = list.filter((day) => day.feed !== null);
    const entries = list.flatMap((day) => day.entries);
    return [
      monday,
      list.reduce((sum, day) => sum + day.slips.length, 0),
      entries.length,
      entries.filter((entry) => entry.outcome === "opened").length,
      list.filter((day) => isObserved(day) && isHard(day, t.limit)).length,
      logged.filter((day) => isControlled(day.feed ?? undefined, t.limit)).length,
      logged.length,
      average(logged.map((day) => day.feed!)),
    ] as const;
  }).filter((row) => row[1] + row[2] + row[6] > 0);

  const slipHours = Array<number>(24).fill(0);
  const entryHours = Array<number>(24).fill(0);
  for (const slip of t.input.slips) slipHours[hourOf(slip.timestamp)]! += 1;
  for (const entry of t.input.entries) entryHours[hourOf(entry.timestamp)]! += 1;

  const rates = (list: readonly Day[]) =>
    weekdayRates(t, list).map((day) => `${day.hard}/${day.observed}`);
  const recentCauses = new Map(causeCounts(t, 30).causes.map(([name, value]) => [name, value]));
  const { current, best } = streaks(t);

  return {
    today: `${t.today} ${WEEKDAYS_SHORT[t.todayRecord.weekday]}`,
    dailyLimitMinutes: t.limit,
    coverage: {
      since: t.firstDay,
      observedDays: t.all.filter(isObserved).length,
      entries: t.input.entries.length,
      slips: t.input.slips.length,
      wins: t.input.wins.length + t.input.winArchive.count,
    },
    months: {
      cols: "месяц,дней,трудных,срывов,утро,день,вечер,ночь,записей,открыл,ср.лента мин,трудный день",
      rows: monthStats(t).map((month) => [
        month.month,
        month.observed,
        month.hard,
        month.slips,
        month.byPart.morning,
        month.byPart.day,
        month.byPart.evening,
        month.byPart.night,
        month.entries,
        month.opened,
        month.avgFeed,
        month.hardest === null ? null : WEEKDAYS_SHORT[month.hardest],
      ]),
    },
    weeks: {
      cols: "понедельник,срывов,записей,открыл,трудных,в лимите,с лентой,ср.лента мин",
      rows: weeks,
    },
    hours: { slips: slipHours, entries: entryHours },
    weekdays: { last8Weeks: rates(t.past.slice(-56)), allTime: rates(t.past) },
    streaks: {
      current,
      best,
      // Calm runs and how many of the three days after each were hard.
      runs: calmRuns(t)
        .slice(-6)
        .map((run) => `${run.start} ${run.days}д → ${run.hardNext3 ?? "?"}/3`),
    },
    causes: causeCounts(t)
      .causes.slice(0, 15)
      .map(
        ([name, value]) => `${name} ${value.count} (30д: ${recentCauses.get(name)?.count ?? 0})`,
      ),
    savedMinutes: { total: savedMinutes(t), last30Days: savedMinutes(t, addDays(t.today, -29)) },
  };
}

export type DeepStats = ReturnType<typeof deepStats>;

/** The experiment's days against the same number of days right before it. */
export function challengeMeasure(challenge: AiChallenge, t: Timeline) {
  if (!challenge.startDay || !challenge.endDay) return null;
  const length =
    Math.round(
      (parseDayKey(challenge.endDay).getTime() - parseDayKey(challenge.startDay).getTime()) /
        DAY_MS,
    ) + 1;
  // `after` cuts the first day at the moment of acceptance: what happened earlier doesn't count.
  const measure = (from: string, after = 0) => {
    const list = Array.from({ length }, (_, offset) => t.days.get(addDays(from, offset))).filter(
      (day): day is Day => day !== undefined && day.key <= t.today,
    );
    const counts = (timestamp: number) =>
      timestamp >= after &&
      (challenge.focus === "all" || partOfDay(hourOf(timestamp)) === challenge.focus);
    const losses = list.flatMap(lossTimes).filter(counts);
    return {
      days: list.length,
      observed: list.filter(isObserved).length,
      losses: losses.length,
      avgFeed: average(list.filter((day) => day.feed !== null).map((day) => day.feed!)),
    };
  };
  return {
    length,
    before: measure(addDays(challenge.startDay, -length)),
    during: measure(challenge.startDay, challenge.startedAt ?? 0),
  };
}
