import { EQUIVALENTS, type Equivalent } from "./catalog";
import { addDays, dayKey, formatDecimal, pluralize, weekdayIndex } from "./date";
import { MAX_SCROLL_DAYS } from "./persistedState";
import type { WinArchive, WinEntry } from "./types";

export type ScrollLog = Readonly<Record<string, number>>;

/**
 * great — at most half of the daily limit; ok — within the limit; over — above it;
 * empty — nothing logged; future — after today (heatmap padding).
 */
export type DayStatus = "great" | "ok" | "over" | "empty" | "future";

export function getDayStatus(minutes: number | undefined, limit: number): DayStatus {
  if (minutes === undefined) return "empty";
  if (minutes > limit) return "over";
  if (minutes <= limit / 2) return "great";
  return "ok";
}

export const isControlled = (minutes: number | undefined, limit: number) =>
  minutes !== undefined && minutes <= limit;

// ---------------------------------------------------------------------------
// Comparison & trend
// ---------------------------------------------------------------------------

export interface ScrollComparison {
  today: number | null;
  yesterday: number | null;
  baseline: number;
  /** today − yesterday; null when either day is missing. */
  deltaMinutes: number | null;
  /** Relative change vs yesterday in %, negative = less scrolling. */
  deltaPercent: number | null;
  /** Relative change of today vs the baseline in %. */
  baselinePercent: number | null;
}

/** Rounded half away from zero, so a drop and a rise of the same size read the same. */
function percentChange(from: number, to: number): number | null {
  if (from <= 0) return null;
  const change = ((to - from) / from) * 100;
  return Math.sign(change) * Math.round(Math.abs(change));
}

export function compareScroll(
  log: ScrollLog,
  todayKey: string,
  baseline: number,
): ScrollComparison {
  const today = log[todayKey] ?? null;
  const yesterday = log[addDays(todayKey, -1)] ?? null;
  return {
    today,
    yesterday,
    baseline,
    deltaMinutes: today !== null && yesterday !== null ? today - yesterday : null,
    deltaPercent: today !== null && yesterday !== null ? percentChange(yesterday, today) : null,
    baselinePercent: today !== null ? percentChange(baseline, today) : null,
  };
}

export interface TrendPoint {
  key: string;
  minutes: number | null;
}

/** The last `days` days, oldest first, ending today. */
export function getTrend(log: ScrollLog, todayKey: string, days: number): TrendPoint[] {
  return Array.from({ length: days }, (_, index) => {
    const key = addDays(todayKey, index - days + 1);
    return { key, minutes: log[key] ?? null };
  });
}

export function averageMinutes(points: readonly TrendPoint[]): number | null {
  const logged = points.filter(
    (point): point is { key: string; minutes: number } => point.minutes !== null,
  );
  if (logged.length === 0) return null;
  return Math.round(logged.reduce((sum, point) => sum + point.minutes, 0) / logged.length);
}

// ---------------------------------------------------------------------------
// Streaks & heatmap
// ---------------------------------------------------------------------------

/**
 * Consecutive days at or under the limit. Today only counts once it is logged — an
 * unlogged today doesn't break the chain until the day is over.
 */
export function getCurrentStreak(log: ScrollLog, limit: number, todayKey: string): number {
  const today = log[todayKey];
  if (today !== undefined && today > limit) return 0;
  let key = today === undefined ? addDays(todayKey, -1) : todayKey;
  let streak = 0;
  while (streak < MAX_SCROLL_DAYS && isControlled(log[key], limit)) {
    streak += 1;
    key = addDays(key, -1);
  }
  return streak;
}

export function getBestStreak(log: ScrollLog, limit: number): number {
  const keys = Object.keys(log).sort();
  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const key of keys) {
    const controlled = isControlled(log[key], limit);
    const continues = previous !== null && addDays(previous, 1) === key;
    run = controlled ? (continues ? run + 1 : 1) : 0;
    best = Math.max(best, run);
    previous = controlled ? key : null;
  }
  return best;
}

export interface HeatCell {
  key: string;
  minutes: number | null;
  status: DayStatus;
  isToday: boolean;
}

/** Calendar grid: one column per week (oldest first), Monday-first rows. */
export function getHeatmap(
  log: ScrollLog,
  limit: number,
  todayKey: string,
  weeks: number,
): HeatCell[][] {
  const thisMonday = addDays(todayKey, -weekdayIndex(todayKey));
  const firstMonday = addDays(thisMonday, -(weeks - 1) * 7);
  return Array.from({ length: weeks }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => {
      const key = addDays(firstMonday, week * 7 + day);
      const minutes = log[key];
      return {
        key,
        minutes: minutes ?? null,
        // Day keys are zero-padded, so string comparison is chronological.
        status: key > todayKey ? "future" : getDayStatus(minutes, limit),
        isToday: key === todayKey,
      };
    }),
  );
}

export function countControlledDays(
  log: ScrollLog,
  limit: number,
  todayKey: string,
  days: number,
): { controlled: number; logged: number } {
  let controlled = 0;
  let logged = 0;
  for (const point of getTrend(log, todayKey, days)) {
    if (point.minutes === null) continue;
    logged += 1;
    if (point.minutes <= limit) controlled += 1;
  }
  return { controlled, logged };
}

// ---------------------------------------------------------------------------
// Saved time
// ---------------------------------------------------------------------------

export interface SavedSummary {
  todayMinutes: number;
  todayWins: number;
  weekMinutes: number;
  totalMinutes: number;
  totalWins: number;
}

export function summarizeWins(
  wins: readonly WinEntry[],
  archive: WinArchive,
  todayKey: string,
): SavedSummary {
  const weekStart = addDays(todayKey, -6);
  const summary: SavedSummary = {
    todayMinutes: 0,
    todayWins: 0,
    weekMinutes: 0,
    totalMinutes: archive.minutes,
    totalWins: wins.length + archive.count,
  };
  for (const win of wins) {
    const key = dayKey(win.timestamp);
    summary.totalMinutes += win.minutesSaved;
    if (key >= weekStart && key <= todayKey) summary.weekMinutes += win.minutesSaved;
    if (key === todayKey) {
      summary.todayMinutes += win.minutesSaved;
      summary.todayWins += 1;
    }
  }
  return summary;
}

export interface EquivalentValue {
  equivalent: Equivalent;
  /** Rounded down to one decimal so we never overstate. */
  value: number;
  /** "1,5 книги", "12 прогулок". */
  label: string;
  /** Progress towards the next whole unit, 0…1. */
  progress: number;
}

export function formatQuantity(value: number, forms: readonly [string, string, string]): string {
  // Russian uses the genitive singular after a fraction: "1,5 книги", "0,3 часа сна".
  const word = Number.isInteger(value) ? pluralize(value, forms) : forms[1];
  return `${formatDecimal(value)} ${word}`;
}

export function computeEquivalents(totalMinutes: number): EquivalentValue[] {
  return EQUIVALENTS.map((equivalent) => {
    const exact = Math.max(0, totalMinutes) / equivalent.unitMinutes;
    const value = exact >= 10 ? Math.floor(exact) : Math.floor(exact * 10) / 10;
    return {
      equivalent,
      value,
      label: formatQuantity(value, equivalent.forms),
      progress: exact - Math.floor(exact),
    };
  });
}
