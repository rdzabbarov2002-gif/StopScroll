import { TRIGGERS } from "./catalog";
import { MS_PER_HOUR, addDays, dayKey, parseDayKey, weekdayIndex } from "./date";
import { getBestStreak, getCurrentStreak, isControlled, type ScrollLog } from "./stats";
import type { Settings, SlipEntry, TriggerId, WinEntry } from "./types";

/** On Sunday at this hour the week's report is put together. */
export const WEEKLY_REPORT_HOUR = 19;

/** At most this many past weeks can be browsed. */
const MAX_REPORT_WEEKS = 52;

export interface ReportData {
  wins: readonly WinEntry[];
  slips: readonly SlipEntry[];
  scrollLog: ScrollLog;
  settings: Settings;
}

/** Monday of the week that contains `key`. */
export const weekStartOf = (key: string) => addDays(key, -weekdayIndex(key));

/** When the report for the week starting on `week` (a Monday) is ready. */
export const reportReadyAt = (week: string) =>
  parseDayKey(addDays(week, 6)).getTime() + WEEKLY_REPORT_HOUR * MS_PER_HOUR;

/** Monday of the newest report that is ready at `now`. */
export function latestReportWeek(now: number = Date.now()): string {
  const thisWeek = weekStartOf(dayKey(now));
  return now >= reportReadyAt(thisWeek) ? thisWeek : addDays(thisWeek, -7);
}

/** Weeks that have a report (any history in them), newest first. */
export function reportWeeks(data: ReportData, now: number = Date.now()): string[] {
  const latest = latestReportWeek(now);
  // The lists are newest first, so their last entries are the oldest.
  const firstDays = [
    data.wins[data.wins.length - 1]?.timestamp,
    data.slips[data.slips.length - 1]?.timestamp,
  ]
    .filter((value): value is number => value !== undefined)
    .map((timestamp) => dayKey(timestamp));
  const logged = Object.keys(data.scrollLog).sort()[0];
  if (logged) firstDays.push(logged);
  if (firstDays.length === 0) return [];

  const first = weekStartOf(firstDays.sort()[0]!);
  const weeks: string[] = [];
  for (let week = latest; week >= first && weeks.length < MAX_REPORT_WEEKS; ) {
    weeks.push(week);
    week = addDays(week, -7);
  }
  return weeks;
}

// ---------------------------------------------------------------------------
// One week
// ---------------------------------------------------------------------------

export interface ReportDay {
  key: string;
  /** Logged feed minutes, null when the day wasn't logged. */
  scroll: number | null;
  saved: number;
  wins: number;
  slips: number;
}

export interface WeeklyReport {
  /** Monday key. */
  week: string;
  /** Sunday key. */
  end: string;
  days: ReportDay[];
  savedMinutes: number;
  wins: number;
  slips: number;
  minutesLost: number;
  /** Share of impulses that ended without the feed, 0…1. */
  successRate: number | null;
  replacements: number;
  loggedDays: number;
  daysInLimit: number;
  scrollTotal: number;
  scrollAverage: number | null;
  /** Monday-first index; by slips, or by feed minutes when there were no slips. */
  hardestDay: { index: number; basis: "slips" | "scroll"; value: number } | null;
  /** By slips, or by all impulses when there were none. */
  hardestHour: { hour: number; basis: "slips" | "impulses"; count: number } | null;
  /** Impulses per 3-hour slot of the day: resisted and lost. */
  slots: { hour: number; resisted: number; lost: number }[];
  topTrigger: { id: TriggerId; count: number } | null;
  triggers: { id: TriggerId; count: number }[];
  /** As of the end of the week (or today, for a week still in progress). */
  currentStreak: number;
  bestStreak: number;
}

/** Local-midnight bounds of the week: comparing numbers is far cheaper than formatting days. */
export function weekBounds(week: string): { from: number; to: number } {
  return { from: parseDayKey(week).getTime(), to: parseDayKey(addDays(week, 7)).getTime() };
}

function peak(values: readonly number[]): number | null {
  let best: number | null = null;
  values.forEach((value, index) => {
    if (value > 0 && (best === null || value > values[best]!)) best = index;
  });
  return best;
}

export function buildWeeklyReport(
  data: ReportData,
  week: string,
  now: number = Date.now(),
): WeeklyReport {
  const end = addDays(week, 6);
  const today = dayKey(now);
  const limit = data.settings.dailyLimitMinutes;
  const { from, to } = weekBounds(week);
  const wins = data.wins.filter((win) => win.timestamp >= from && win.timestamp < to);
  const slips = data.slips.filter((slip) => slip.timestamp >= from && slip.timestamp < to);

  const days: ReportDay[] = Array.from({ length: 7 }, (_, index) => {
    const key = addDays(week, index);
    return { key, scroll: data.scrollLog[key] ?? null, saved: 0, wins: 0, slips: 0 };
  });
  for (const win of wins) {
    const day = days[weekdayIndex(win.timestamp)]!;
    day.saved += win.minutesSaved;
    day.wins += 1;
  }
  for (const slip of slips) days[weekdayIndex(slip.timestamp)]!.slips += 1;

  // The hour of the urge matters, not just the outcome.
  const lostHours = Array.from({ length: 24 }, () => 0);
  const allHours = Array.from({ length: 24 }, () => 0);
  const slots = Array.from({ length: 8 }, (_, index) => ({
    hour: index * 3,
    resisted: 0,
    lost: 0,
  }));
  const hour = (timestamp: number) => new Date(timestamp).getHours();
  for (const item of slips) {
    lostHours[hour(item.timestamp)]! += 1;
    allHours[hour(item.timestamp)]! += 1;
    slots[Math.floor(hour(item.timestamp) / 3)]!.lost += 1;
  }
  for (const win of wins) {
    allHours[hour(win.timestamp)]! += 1;
    slots[Math.floor(hour(win.timestamp) / 3)]!.resisted += 1;
  }

  const lostByDay = days.map((day) => day.slips);
  const slipPeakDay = peak(lostByDay);
  const scrollPeakDay = peak(days.map((day) => day.scroll ?? 0));
  const hardestDay =
    slipPeakDay !== null
      ? { index: slipPeakDay, basis: "slips" as const, value: lostByDay[slipPeakDay]! }
      : scrollPeakDay !== null
        ? { index: scrollPeakDay, basis: "scroll" as const, value: days[scrollPeakDay]!.scroll! }
        : null;

  const lostPeak = peak(lostHours);
  const anyPeak = peak(allHours);
  const hardestHour =
    lostPeak !== null
      ? { hour: lostPeak, basis: "slips" as const, count: lostHours[lostPeak]! }
      : anyPeak !== null
        ? { hour: anyPeak, basis: "impulses" as const, count: allHours[anyPeak]! }
        : null;

  const triggerCounts = new Map<TriggerId, number>();
  for (const slip of slips) {
    if (slip.trigger) triggerCounts.set(slip.trigger, (triggerCounts.get(slip.trigger) ?? 0) + 1);
  }
  const triggers = TRIGGERS.map((trigger) => ({
    id: trigger.id,
    count: triggerCounts.get(trigger.id) ?? 0,
  }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);

  const logged = days.filter((day) => day.scroll !== null);
  const scrollTotal = logged.reduce((sum, day) => sum + day.scroll!, 0);
  const impulses = wins.length + slips.length;

  // Streaks as they stood when the week ended (or today, while it is still running).
  const asOf = end < today ? end : today;
  const pastLog = Object.fromEntries(Object.entries(data.scrollLog).filter(([key]) => key <= asOf));
  const currentStreak = getCurrentStreak(pastLog, limit, asOf);

  return {
    week,
    end,
    days,
    savedMinutes: wins.reduce((sum, win) => sum + win.minutesSaved, 0),
    wins: wins.length,
    slips: slips.length,
    minutesLost: slips.reduce((sum, slip) => sum + slip.minutesLost, 0),
    successRate: impulses > 0 ? wins.length / impulses : null,
    replacements: wins.filter((win) => win.source === "replacement").length,
    loggedDays: logged.length,
    daysInLimit: logged.filter((day) => isControlled(day.scroll ?? undefined, limit)).length,
    scrollTotal,
    scrollAverage: logged.length > 0 ? Math.round(scrollTotal / logged.length) : null,
    hardestDay,
    hardestHour,
    slots,
    topTrigger: triggers[0] ?? null,
    triggers,
    currentStreak,
    bestStreak: Math.max(currentStreak, getBestStreak(pastLog, limit)),
  };
}

/** True when the week has nothing in it at all. */
export const isEmptyReport = (report: WeeklyReport) =>
  report.wins === 0 && report.slips === 0 && report.loggedDays === 0;

// ---------------------------------------------------------------------------
// Week over week
// ---------------------------------------------------------------------------

export type ChangeDirection = "better" | "worse" | "same";

export interface ReportChange {
  id: "saved" | "slips" | "success" | "scroll";
  /** Absolute change in the metric's own unit (minutes, count or percentage points). */
  delta: number;
  direction: ChangeDirection;
}

const direction = (delta: number, higherIsBetter: boolean): ChangeDirection =>
  delta === 0 ? "same" : delta > 0 === higherIsBetter ? "better" : "worse";

export function compareReports(current: WeeklyReport, previous: WeeklyReport): ReportChange[] {
  const changes: ReportChange[] = [];
  const add = (id: ReportChange["id"], delta: number, higherIsBetter: boolean) =>
    changes.push({ id, delta, direction: direction(delta, higherIsBetter) });

  add("saved", current.savedMinutes - previous.savedMinutes, true);
  add("slips", current.slips - previous.slips, false);
  if (current.successRate !== null && previous.successRate !== null) {
    add("success", Math.round((current.successRate - previous.successRate) * 100), true);
  }
  if (current.scrollAverage !== null && previous.scrollAverage !== null) {
    add("scroll", current.scrollAverage - previous.scrollAverage, false);
  }
  return changes;
}
