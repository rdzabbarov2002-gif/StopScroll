import { m, type Messages, type PluralForms } from "../i18n";
import { getFeedApp } from "./catalog";
import { MS_PER_DAY, MS_PER_HOUR, addDays, dayKey, parseDayKey, weekdayIndex } from "./date";
import { isControlled, type ScrollLog } from "./stats";
import type {
  FeedApp,
  IconName,
  Settings,
  SlipEntry,
  TriggerId,
  WinArchive,
  WinEntry,
} from "./types";

/** Everything an achievement is judged on — the real history, nothing else. */
export interface AchievementData {
  wins: readonly WinEntry[];
  winArchive: WinArchive;
  slips: readonly SlipEntry[];
  scrollLog: ScrollLog;
  settings: Settings;
}

export type AchievementTone = "primary" | "success" | "warning" | "indigo" | "danger";

/** How progress reads under a locked achievement. */
export type ProgressUnit =
  | { kind: "count"; forms: PluralForms }
  | { kind: "minutes" }
  | { kind: "once" };

export interface Achievement {
  id: string;
  title: string | ((mainApp: FeedApp) => string);
  /** What it means, in human words. */
  description: string;
  /** How to earn it, shown while it is locked. */
  hint: string;
  icon: IconName;
  tone: AchievementTone;
  unit: ProgressUnit;
  target: number;
  evaluate: (history: History) => Evaluation;
}

interface Evaluation {
  /** Progress towards `target`. */
  current: number;
  /** When the history first met the goal; null while it hasn't. */
  achievedAt: number | null;
}

export interface AchievementStatus {
  achievement: Achievement;
  title: string;
  current: number;
  target: number;
  /** 0…1 */
  progress: number;
  /** When the history first met the goal (null while locked). */
  achievedAt: number | null;
}

// ---------------------------------------------------------------------------
// Shared, pre-sorted history
// ---------------------------------------------------------------------------

interface History {
  now: number;
  todayKey: string;
  settings: Settings;
  scrollLog: ScrollLog;
  winArchive: WinArchive;
  /** Oldest first. */
  wins: WinEntry[];
  slips: SlipEntry[];
  /** Local hours of slips, per day key. */
  slipHours: Map<string, number[]>;
  /** Local hours of wins, per day key. */
  winHours: Map<string, number[]>;
}

const byTime = <T extends { timestamp: number }>(items: readonly T[]) =>
  [...items].sort((a, b) => a.timestamp - b.timestamp);

function hoursByDay(items: readonly { timestamp: number }[]): Map<string, number[]> {
  const map = new Map<string, number[]>();
  for (const item of items) {
    const key = dayKey(item.timestamp);
    const hours = map.get(key) ?? [];
    hours.push(new Date(item.timestamp).getHours());
    map.set(key, hours);
  }
  return map;
}

function prepare(data: AchievementData, now: number): History {
  return {
    now,
    todayKey: dayKey(now),
    settings: data.settings,
    scrollLog: data.scrollLog,
    winArchive: data.winArchive,
    wins: byTime(data.wins),
    slips: byTime(data.slips),
    slipHours: hoursByDay(data.slips),
    winHours: hoursByDay(data.wins),
  };
}

/** The local time `hours` after the start of a day (DST-safe for whole days). */
const dayTime = (key: string, hours: number) => parseDayKey(key).getTime() + hours * MS_PER_HOUR;

/**
 * Counts entries until `target`; `start` covers history that was archived away.
 * Returns the timestamp of the entry that reached the goal.
 */
function countUntil(
  items: readonly { timestamp: number }[],
  target: number,
  start = 0,
): Evaluation {
  if (start >= target) return { current: target, achievedAt: items[0]?.timestamp ?? null };
  const total = start + items.length;
  if (total < target) return { current: total, achievedAt: null };
  return { current: target, achievedAt: items[target - start - 1]!.timestamp };
}

function sumUntil(wins: readonly WinEntry[], target: number, start: number): Evaluation {
  let sum = start;
  if (sum >= target) return { current: target, achievedAt: wins[0]?.timestamp ?? null };
  for (const win of wins) {
    sum += win.minutesSaved;
    if (sum >= target) return { current: target, achievedAt: win.timestamp };
  }
  return { current: sum, achievedAt: null };
}

/**
 * Days whose window (`from`…`to` local hours, `to` may pass midnight) held at least one win
 * (or was tracked at all, when `needsWin` is false), had no slip, and is already over.
 * Returns the end time of each such window, oldest first.
 */
function cleanWindows(
  history: History,
  from: number,
  to: number,
  options: { needsWin: boolean; weekday?: number },
): number[] {
  const inWindow = (key: string, map: Map<string, number[]>) => {
    const sameDay = (map.get(key) ?? []).some((hour) => hour >= from && hour < Math.min(to, 24));
    if (to <= 24) return sameDay;
    const nextDay = (map.get(addDays(key, 1)) ?? []).some((hour) => hour < to - 24);
    return sameDay || nextDay;
  };

  const days = new Set<string>(history.winHours.keys());
  if (!options.needsWin) {
    for (const key of Object.keys(history.scrollLog)) days.add(key);
  }

  const ends: number[] = [];
  for (const key of [...days].sort()) {
    if (options.weekday !== undefined && weekdayIndex(key) !== options.weekday) continue;
    const end = to <= 24 ? dayTime(key, to) : dayTime(addDays(key, 1), to - 24);
    if (end > history.now) continue;
    if (options.needsWin && !inWindow(key, history.winHours)) continue;
    if (inWindow(key, history.slipHours)) continue;
    ends.push(end);
  }
  return ends;
}

function windowsUntil(ends: readonly number[], target: number): Evaluation {
  return ends.length >= target
    ? { current: target, achievedAt: ends[target - 1]! }
    : { current: ends.length, achievedAt: null };
}

/** Wins in a row with no slip between them. */
function refusalRun(history: History, target: number): Evaluation {
  type Event = { timestamp: number; win: boolean };
  const events: Event[] = [
    ...history.wins.map((win) => ({ timestamp: win.timestamp, win: true })),
    ...history.slips.map((slip) => ({ timestamp: slip.timestamp, win: false })),
  ].sort((a, b) => a.timestamp - b.timestamp);

  let run = 0;
  let achievedAt: number | null = null;
  for (const event of events) {
    run = event.win ? run + 1 : 0;
    if (achievedAt === null && run >= target) achievedAt = event.timestamp;
  }
  return { current: achievedAt !== null ? target : run, achievedAt };
}

/** A win on the same day after a slip — the comeback. */
function comeback(history: History): Evaluation {
  let slipIndex = 0;
  let lastSlip: number | null = null;
  for (const win of history.wins) {
    while (
      slipIndex < history.slips.length &&
      history.slips[slipIndex]!.timestamp < win.timestamp
    ) {
      lastSlip = history.slips[slipIndex]!.timestamp;
      slipIndex += 1;
    }
    if (lastSlip !== null && win.timestamp - lastSlip <= MS_PER_DAY) {
      return { current: 1, achievedAt: win.timestamp };
    }
  }
  return { current: 0, achievedAt: null };
}

/** Consecutive days within the limit; `current` is the streak running now. */
function limitStreak(history: History, target: number): Evaluation {
  const limit = history.settings.dailyLimitMinutes;
  let run = 0;
  let previous: string | null = null;
  let achievedAt: number | null = null;
  for (const key of Object.keys(history.scrollLog).sort()) {
    const controlled = isControlled(history.scrollLog[key], limit);
    const continues = previous !== null && addDays(previous, 1) === key;
    run = controlled ? (continues ? run + 1 : 1) : 0;
    previous = controlled ? key : null;
    if (achievedAt === null && run >= target) {
      achievedAt = Math.min(history.now, dayTime(addDays(key, 1), 0) - 1);
    }
  }
  if (achievedAt !== null) return { current: target, achievedAt };
  // A run only counts while it reaches yesterday or today.
  const alive =
    previous !== null &&
    (previous === history.todayKey || previous === addDays(history.todayKey, -1));
  return { current: alive ? run : 0, achievedAt: null };
}

/** Seven days that averaged half of the "before StopScroll" baseline or less. */
function halfFeed(history: History): Evaluation {
  const baseline = history.settings.baselineMinutes;
  if (baseline <= 0) return { current: 0, achievedAt: null };
  for (const key of Object.keys(history.scrollLog).sort()) {
    const week = Array.from({ length: 7 }, (_, index) => history.scrollLog[addDays(key, -index)]);
    const logged = week.filter((minutes): minutes is number => minutes !== undefined);
    if (logged.length < 5) continue;
    const average = logged.reduce((sum, minutes) => sum + minutes, 0) / logged.length;
    if (average <= baseline / 2) {
      return { current: 1, achievedAt: Math.min(history.now, dayTime(addDays(key, 1), 0) - 1) };
    }
  }
  return { current: 0, achievedAt: null };
}

const triggerWins = (history: History, trigger: TriggerId) =>
  history.wins.filter((win) => win.trigger === trigger);

// ---------------------------------------------------------------------------
// The achievements
// ---------------------------------------------------------------------------

const EVENING = { from: 17, to: 23 } as const;
const MORNING = { from: 5, to: 12 } as const;
/** 22:00 → 05:00 the next morning. */
const NIGHT = { from: 22, to: 29 } as const;

type TextId = keyof Messages["achievements"]["items"];
type UnitId = keyof Messages["achievements"]["units"];

/** An achievement's texts in the current language. */
const texts = (id: TextId) => m().achievements.items[id];

/** Progress counted in `unit`; its word is read in the current language when progress is shown. */
const counted = (unit: UnitId): ProgressUnit => ({
  kind: "count",
  get forms() {
    return m().achievements.units[unit];
  },
});

type Spec = Omit<Achievement, "id" | "title" | "description" | "hint"> & {
  id: TextId;
  /** Only for a title that names the user's feed app; otherwise it comes from the messages. */
  title?: (mainApp: FeedApp) => string;
};

/**
 * An achievement whose texts are getters, read from the messages whenever they are used, so the
 * catalog (built once at import) always speaks the current language.
 */
function define(spec: Spec): Achievement {
  // No object spread here: compiled spreads copy getters as values, freezing today's language.
  const { id, title } = spec;
  return {
    id,
    icon: spec.icon,
    tone: spec.tone,
    unit: spec.unit,
    target: spec.target,
    evaluate: spec.evaluate,
    get title() {
      return title ?? texts(id).title;
    },
    get description() {
      return texts(id).description;
    },
    get hint() {
      return texts(id).hint;
    },
  };
}

export const ACHIEVEMENTS: readonly Achievement[] = [
  define({
    id: "first-choice",
    icon: "hand-left",
    tone: "primary",
    unit: { kind: "once" },
    target: 1,
    evaluate: (history) => countUntil(history.wins, 1, history.winArchive.count),
  }),
  define({
    id: "first-evening",
    title: (mainApp) =>
      mainApp === "other"
        ? texts("first-evening").title
        : m().achievements.firstEveningWith(getFeedApp(mainApp).label),
    icon: "moon",
    tone: "indigo",
    unit: { kind: "once" },
    target: 1,
    evaluate: (history) =>
      windowsUntil(cleanWindows(history, EVENING.from, EVENING.to, { needsWin: true }), 1),
  }),
  define({
    id: "first-hour",
    icon: "hourglass",
    tone: "success",
    unit: { kind: "minutes" },
    target: 60,
    evaluate: (history) => sumUntil(history.wins, 60, history.winArchive.minutes),
  }),
  define({
    id: "morning-free",
    icon: "sunny",
    tone: "warning",
    unit: { kind: "once" },
    target: 1,
    evaluate: (history) =>
      windowsUntil(cleanWindows(history, MORNING.from, MORNING.to, { needsWin: true }), 1),
  }),
  define({
    id: "comeback",
    icon: "refresh-circle",
    tone: "success",
    unit: { kind: "once" },
    target: 1,
    evaluate: comeback,
  }),
  define({
    id: "honest-look",
    icon: "chatbubbles",
    tone: "indigo",
    unit: counted("times"),
    target: 5,
    evaluate: (history) =>
      countUntil(
        history.slips.filter((slip) => slip.trigger !== null),
        5,
      ),
  }),
  define({
    id: "sunday-evening",
    icon: "cafe",
    tone: "indigo",
    unit: { kind: "once" },
    target: 1,
    evaluate: (history) =>
      windowsUntil(
        cleanWindows(history, EVENING.from, EVENING.to, { needsWin: true, weekday: 6 }),
        1,
      ),
  }),
  define({
    id: "week-in-limit",
    icon: "calendar",
    tone: "warning",
    unit: counted("days"),
    target: 7,
    evaluate: (history) => limitStreak(history, 7),
  }),
  define({
    id: "nights-7",
    icon: "bed",
    tone: "indigo",
    unit: counted("nights"),
    target: 7,
    evaluate: (history) =>
      windowsUntil(cleanWindows(history, NIGHT.from, NIGHT.to, { needsWin: false }), 7),
  }),
  define({
    id: "stress-10",
    icon: "thunderstorm",
    tone: "danger",
    unit: counted("times"),
    target: 10,
    evaluate: (history) => countUntil(triggerWins(history, "stress"), 10),
  }),
  define({
    id: "boredom-20",
    icon: "hourglass-outline",
    tone: "warning",
    unit: counted("times"),
    target: 20,
    evaluate: (history) => countUntil(triggerWins(history, "boredom"), 20),
  }),
  define({
    id: "replacements-25",
    icon: "barbell",
    tone: "success",
    unit: counted("replacements"),
    target: 25,
    evaluate: (history) =>
      countUntil(
        history.wins.filter((win) => win.source === "replacement"),
        25,
        history.winArchive.replacementCount,
      ),
  }),
  define({
    id: "refusals-30",
    icon: "flame",
    tone: "danger",
    unit: counted("refusals"),
    target: 30,
    evaluate: (history) => refusalRun(history, 30),
  }),
  define({
    id: "half-feed",
    icon: "trending-down",
    tone: "primary",
    unit: { kind: "once" },
    target: 1,
    evaluate: halfFeed,
  }),
  define({
    id: "day-of-life",
    icon: "infinite",
    tone: "success",
    unit: { kind: "minutes" },
    target: 24 * 60,
    evaluate: (history) => sumUntil(history.wins, 24 * 60, history.winArchive.minutes),
  }),
];

export function getAchievement(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((achievement) => achievement.id === id);
}

export function achievementTitle(achievement: Achievement, mainApp: FeedApp): string {
  return typeof achievement.title === "function" ? achievement.title(mainApp) : achievement.title;
}

/** Every achievement with its progress, in catalog order. */
export function evaluateAchievements(
  data: AchievementData,
  now: number = Date.now(),
): AchievementStatus[] {
  const history = prepare(data, now);
  return ACHIEVEMENTS.map((achievement) => {
    const { current, achievedAt } = achievement.evaluate(history);
    const clamped = Math.min(achievement.target, Math.max(0, current));
    return {
      achievement,
      title: achievementTitle(achievement, data.settings.mainApp),
      current: achievedAt !== null ? achievement.target : clamped,
      target: achievement.target,
      progress: achievedAt !== null ? 1 : clamped / achievement.target,
      achievedAt,
    };
  });
}

/** Achievement id → when it was earned, for everything the history already satisfies. */
export function earnedAchievements(
  data: AchievementData,
  now: number = Date.now(),
): Record<string, number> {
  const earned: Record<string, number> = {};
  for (const status of evaluateAchievements(data, now)) {
    if (status.achievedAt !== null)
      earned[status.achievement.id] = Math.min(now, status.achievedAt);
  }
  return earned;
}
