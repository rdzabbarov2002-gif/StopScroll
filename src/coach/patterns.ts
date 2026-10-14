import { MS_PER_HOUR, addDays, weekdayIndex } from "../utils/date";
import { getBestStreak, getCurrentStreak } from "../utils/stats";
import type { SlipEntry, TriggerId } from "../utils/types";
import {
  type DayRecord,
  type History,
  hourOf,
  isLate,
  lastDays,
  slipSoonAfter,
  slipsWithin,
} from "./history";

/**
 * Deterministic pattern finders over the user's history. Each returns the facts it found (or
 * null when the data is too thin to say anything honest); the coach only ever words these facts.
 */

export type TimePattern =
  | { kind: "after"; hour: number; count: number; total: number }
  | { kind: "window"; from: number; to: number; count: number; total: number };

/** When slips cluster: "after 21:00" or "between 13:00 and 16:00". Needs four or more slips. */
export function findTimePattern(slips: readonly SlipEntry[]): TimePattern | null {
  const total = slips.length;
  if (total < 4) return null;
  const hours = slips.map((slip) => hourOf(slip.timestamp));

  // The latest hour after which a clear majority happened: three in four first, then three in five.
  // "4 из 5 после 21:00" says more than "3 из 5 после 22:00".
  for (const share of [0.75, 0.6]) {
    for (let hour = 23; hour >= 17; hour -= 1) {
      const late = hours.filter((value) => isLate(value, hour)).length;
      if (late / total >= share) return { kind: "after", hour, count: late, total };
    }
  }

  let best = { from: 0, count: 0 };
  for (let from = 0; from < 24; from += 1) {
    const inWindow = hours.filter((value) => (value - from + 24) % 24 < 3).length;
    if (inWindow > best.count) best = { from, count: inWindow };
  }
  if (best.count >= 3 && best.count / total >= 0.4) {
    return { kind: "window", from: best.from, to: (best.from + 3) % 24, count: best.count, total };
  }
  return null;
}

/** The hour when the risky window starts, for timing advice. */
export const patternStartHour = (pattern: TimePattern) =>
  pattern.kind === "after" ? pattern.hour : pattern.from;

export interface ReasonPattern {
  trigger: TriggerId;
  count: number;
  /** Slips with a known reason. */
  total: number;
}

/** The most common reason among slips the user explained; needs three and a 40% share. */
export function findTopReason(slips: readonly SlipEntry[]): ReasonPattern | null {
  const counts = new Map<TriggerId, number>();
  for (const slip of slips) {
    if (slip.trigger && slip.trigger !== "other") {
      counts.set(slip.trigger, (counts.get(slip.trigger) ?? 0) + 1);
    }
  }
  const total = [...counts.values()].reduce((sum, value) => sum + value, 0);
  if (total < 3) return null;
  let top: ReasonPattern | null = null;
  for (const [trigger, value] of counts) {
    if (!top || value > top.count) top = { trigger, count: value, total };
  }
  return top && top.count >= 2 && top.count / total >= 0.4 ? top : null;
}

export interface WeekdayStat {
  index: number;
  active: number;
  bad: number;
  slips: number;
}

/** Per weekday over the last eight weeks: active days, bad days (slip or over the limit). */
export function weekdayProfile(history: History): WeekdayStat[] {
  const stats = Array.from({ length: 7 }, (_, index) => ({ index, active: 0, bad: 0, slips: 0 }));
  // Today is still going: it would count as "good" before the evening has happened.
  for (const day of lastDays(history, history.days.length, 1)) {
    if (!day.active) continue;
    const stat = stats[day.weekday]!;
    stat.active += 1;
    stat.slips += day.slips.length;
    if (day.bad) stat.bad += 1;
  }
  return stats;
}

const badRate = (stat: WeekdayStat) => (stat.active > 0 ? stat.bad / stat.active : 0);

function overallBadRate(stats: readonly WeekdayStat[]) {
  const active = stats.reduce((sum, stat) => sum + stat.active, 0);
  const bad = stats.reduce((sum, stat) => sum + stat.bad, 0);
  return { active, rate: active > 0 ? bad / active : 0 };
}

/** A weekday that goes wrong clearly more often than the rest. */
export function findHardWeekday(history: History): WeekdayStat | null {
  const stats = weekdayProfile(history);
  const overall = overallBadRate(stats);
  if (overall.active < 10) return null;
  const candidates = stats
    .filter(
      (stat) => stat.active >= 3 && badRate(stat) >= 0.5 && badRate(stat) - overall.rate >= 0.2,
    )
    .sort((a, b) => badRate(b) - badRate(a) || b.slips - a.slips);
  return candidates[0] ?? null;
}

/** A weekday that almost never goes wrong while others do. */
export function findCalmWeekday(history: History): WeekdayStat | null {
  const stats = weekdayProfile(history);
  const overall = overallBadRate(stats);
  if (overall.active < 10 || overall.rate < 0.25) return null;
  const candidates = stats
    .filter((stat) => stat.active >= 3 && badRate(stat) <= 0.15)
    .sort((a, b) => badRate(a) - badRate(b) || b.active - a.active);
  return candidates[0] ?? null;
}

/** The same weekday was the week's hardest (most slips) several completed weeks in a row. */
export function recurringHardWeekday(history: History): { index: number; weeks: number } | null {
  const lastMonday = addDays(history.todayKey, -weekdayIndex(history.todayKey) - 7);
  let streak: { index: number; weeks: number } | null = null;
  for (let week = 0; week < 8; week += 1) {
    const monday = addDays(lastMonday, -7 * week);
    const counts = Array.from({ length: 7 }, (_, offset) => {
      const day = history.byKey.get(addDays(monday, offset));
      return day ? day.slips.length : 0;
    });
    const max = Math.max(...counts);
    const leaders = counts.filter((value) => value === max);
    if (max === 0 || leaders.length > 1) break;
    const index = counts.indexOf(max);
    if (!streak) streak = { index, weeks: 1 };
    else if (streak.index === index) streak.weeks += 1;
    else break;
  }
  return streak && streak.weeks >= 2 ? streak : null;
}

export interface ReplacementEffect {
  withDays: number;
  withBad: number;
  withoutDays: number;
  withoutBad: number;
}

/** Bad-day rate on days with a replacement vs active days without one, last four weeks. */
export function replacementEffect(history: History): ReplacementEffect | null {
  const days = lastDays(history, 28, 1).filter((day) => day.active);
  const withReplacement = days.filter((day) => day.replacements > 0);
  const without = days.filter((day) => day.replacements === 0);
  if (withReplacement.length < 4 || without.length < 4) return null;
  const effect = {
    withDays: withReplacement.length,
    withBad: withReplacement.filter((day) => day.bad).length,
    withoutDays: without.length,
    withoutBad: without.filter((day) => day.bad).length,
  };
  const withRate = effect.withBad / effect.withDays;
  const withoutRate = effect.withoutBad / effect.withoutDays;
  return withoutRate >= 0.3 && withRate <= withoutRate * 0.6 ? effect : null;
}

/** Walks, and how many of them were followed by a slip within three hours. */
export function walkEffect(history: History): { walks: number; slipsAfter: number } | null {
  const walks = history.wins.filter(
    (win) => win.replacementId === "walk-3" && history.now - win.timestamp <= 28 * 24 * MS_PER_HOUR,
  );
  if (walks.length < 3) return null;
  const slipsAfter = walks.filter((walk) =>
    slipSoonAfter(history, walk.timestamp, 3 * MS_PER_HOUR),
  ).length;
  return slipsAfter <= walks.length * 0.2 ? { walks: walks.length, slipsAfter } : null;
}

const average = (values: readonly number[]) =>
  values.length > 0
    ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
    : null;

const loggedMinutes = (days: readonly DayRecord[]) =>
  days.filter((day) => day.scroll !== null).map((day) => day.scroll!);

export interface Trend {
  recent: number;
  previous: number;
  /** Percent, negative = less. */
  change: number;
}

/** Average logged feed time: the last 14 days vs the 14 before. Needs four logged days in each. */
export function scrollTrend(history: History): Trend | null {
  const recent = loggedMinutes(lastDays(history, 14));
  const previous = loggedMinutes(lastDays(history, 14, 14));
  if (recent.length < 4 || previous.length < 4) return null;
  const a = average(recent)!;
  const b = average(previous)!;
  if (b === 0) return null;
  return { recent: a, previous: b, change: Math.round(((a - b) / b) * 100) };
}

/** Last seven days vs the seven before, for the daily risk. */
export function weekScrollTrend(history: History): Trend | null {
  const recent = loggedMinutes(lastDays(history, 7, 1));
  const previous = loggedMinutes(lastDays(history, 7, 8));
  if (recent.length < 3 || previous.length < 3) return null;
  const a = average(recent)!;
  const b = average(previous)!;
  if (b === 0) return null;
  return { recent: a, previous: b, change: Math.round(((a - b) / b) * 100) };
}

/** Slips in the last 14 days vs the 14 before. */
export function slipTrend(history: History) {
  return { recent: slipsWithin(history, 14).length, previous: slipsWithin(history, 14, 14).length };
}

/** Late-evening slips (after 21:00) this month vs the month before. */
export function eveningTrend(history: History) {
  const late = (slips: readonly SlipEntry[]) =>
    slips.filter((slip) => isLate(hourOf(slip.timestamp), 21)).length;
  return { recent: late(slipsWithin(history, 30)), previous: late(slipsWithin(history, 30, 30)) };
}

/** Average minutes per slip: the last 14 days vs the 14 before (three slips in each). */
export function durationTrend(history: History): Trend | null {
  const recent = slipsWithin(history, 14).map((slip) => slip.minutesLost);
  const previous = slipsWithin(history, 14, 14).map((slip) => slip.minutesLost);
  if (recent.length < 3 || previous.length < 3) return null;
  const a = average(recent)!;
  const b = average(previous)!;
  if (b === 0) return null;
  return { recent: a, previous: b, change: Math.round(((a - b) / b) * 100) };
}

const streakCache = new WeakMap<History, { current: number; best: number }>();

/** The current and the best run of days within the limit (computed once per history). */
export function streaks(history: History) {
  const cached = streakCache.get(history);
  if (cached) return cached;
  const limit = history.settings.dailyLimitMinutes;
  const current = getCurrentStreak(history.scrollLog, limit, history.todayKey);
  const result = { current, best: Math.max(current, getBestStreak(history.scrollLog, limit)) };
  streakCache.set(history, result);
  return result;
}
