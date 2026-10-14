import { FEED_APPS, TIME_OF_DAY_LABELS, TRIGGERS, getTrigger } from "./catalog";
import { MS_PER_DAY, formatHourRange, getTimeOfDay, weekdayIndex } from "./date";
import type { FeedApp, SlipEntry, TimeOfDay, TriggerId, WinEntry } from "./types";

/** Minimum number of slips before we start describing patterns. */
export const MIN_SLIPS_FOR_PATTERNS = 3;

const RECENT_DAYS = 30;

export const WEEKDAY_PHRASES = [
  "по понедельникам",
  "по вторникам",
  "по средам",
  "по четвергам",
  "по пятницам",
  "по субботам",
  "по воскресеньям",
] as const;

export interface TriggerStat {
  id: TriggerId;
  slips: number;
  resisted: number;
}

export interface Patterns {
  totalSlips: number;
  slipsLastWeek: number;
  minutesLostLastWeek: number;
  /** Over the last 30 days. */
  resisted: number;
  slipsRecent: number;
  /** Share of impulses that did not end in the feed (last 30 days), 0…1. */
  resistRate: number | null;
  /** Slips per hour of day, 0…23. */
  byHour: number[];
  /** Slips per weekday, Monday first. */
  byWeekday: number[];
  peakHour: number | null;
  peakWeekday: number | null;
  topTrigger: TriggerId | null;
  topTimeOfDay: TimeOfDay | null;
  topApp: FeedApp | null;
  /** Triggers sorted by how often they show up (slips + resisted). */
  triggerBreakdown: TriggerStat[];
  /** e.g. "Чаще всего срывы случаются по вечерам от скуки." */
  summary: string | null;
  /** e.g. "Пиковый час — 21:00–22:00. Труднее всего по пятницам." */
  detail: string | null;
  advice: string | null;
}

const TIME_ORDER: TimeOfDay[] = ["morning", "afternoon", "evening", "night"];

function pickTop<T>(counts: Map<T, number>, order: readonly T[]): T | null {
  let best: T | null = null;
  let bestCount = 0;
  // Iterating in a fixed order makes ties deterministic.
  for (const key of order) {
    const count = counts.get(key) ?? 0;
    if (count > bestCount) {
      best = key;
      bestCount = count;
    }
  }
  return best;
}

function peakIndex(values: readonly number[]): number | null {
  let best: number | null = null;
  values.forEach((value, index) => {
    if (value > 0 && (best === null || value > values[best]!)) best = index;
  });
  return best;
}

const increment = <T>(map: Map<T, number>, key: T) => map.set(key, (map.get(key) ?? 0) + 1);

export function computePatterns(
  slips: readonly SlipEntry[],
  wins: readonly WinEntry[],
  now: number = Date.now(),
): Patterns {
  const byHour = Array.from({ length: 24 }, () => 0);
  const byWeekday = Array.from({ length: 7 }, () => 0);
  const triggerCounts = new Map<TriggerId, number>();
  const timeCounts = new Map<TimeOfDay, number>();
  const appCounts = new Map<FeedApp, number>();
  const stats = new Map<TriggerId, TriggerStat>();
  const stat = (id: TriggerId) => {
    const existing = stats.get(id);
    if (existing) return existing;
    const created = { id, slips: 0, resisted: 0 };
    stats.set(id, created);
    return created;
  };

  let slipsLastWeek = 0;
  let minutesLostLastWeek = 0;
  let slipsRecent = 0;

  for (const slip of slips) {
    const date = new Date(slip.timestamp);
    byHour[date.getHours()]! += 1;
    byWeekday[weekdayIndex(date)]! += 1;
    if (slip.trigger) {
      increment(triggerCounts, slip.trigger);
      stat(slip.trigger).slips += 1;
    }
    increment(timeCounts, getTimeOfDay(slip.timestamp));
    increment(appCounts, slip.app);
    const age = now - slip.timestamp;
    if (age <= 7 * MS_PER_DAY) {
      slipsLastWeek += 1;
      minutesLostLastWeek += slip.minutesLost;
    }
    if (age <= RECENT_DAYS * MS_PER_DAY) slipsRecent += 1;
  }

  let resisted = 0;
  for (const win of wins) {
    if (win.trigger) stat(win.trigger).resisted += 1;
    if (now - win.timestamp <= RECENT_DAYS * MS_PER_DAY) resisted += 1;
  }

  const triggerOrder = TRIGGERS.map((trigger) => trigger.id);
  const topTrigger = pickTop(triggerCounts, triggerOrder);
  const topTimeOfDay = pickTop(timeCounts, TIME_ORDER);
  const topApp = pickTop(
    appCounts,
    FEED_APPS.map((app) => app.id),
  );
  const peakHour = peakIndex(byHour);
  const peakWeekday = peakIndex(byWeekday);

  const triggerBreakdown = triggerOrder
    .map((id) => stats.get(id))
    .filter((item): item is TriggerStat => item !== undefined)
    .sort((a, b) => b.slips + b.resisted - (a.slips + a.resisted));

  const impulses = resisted + slipsRecent;
  const hasEnough = slips.length >= MIN_SLIPS_FOR_PATTERNS && topTrigger && topTimeOfDay;

  return {
    totalSlips: slips.length,
    slipsLastWeek,
    minutesLostLastWeek,
    resisted,
    slipsRecent,
    resistRate: impulses > 0 ? resisted / impulses : null,
    byHour,
    byWeekday,
    peakHour,
    peakWeekday,
    topTrigger,
    topTimeOfDay,
    topApp,
    triggerBreakdown,
    summary: hasEnough
      ? `Чаще всего срывы случаются ${TIME_OF_DAY_LABELS[topTimeOfDay].phrase} ${getTrigger(topTrigger).reason}.`
      : null,
    detail:
      hasEnough && peakHour !== null && peakWeekday !== null
        ? `Пиковый час — ${formatHourRange(peakHour)}. Труднее всего ${WEEKDAY_PHRASES[peakWeekday]}.`
        : null,
    advice: hasEnough ? getTrigger(topTrigger).advice : null,
  };
}
