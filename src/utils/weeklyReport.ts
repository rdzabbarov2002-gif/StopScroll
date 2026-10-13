import { TRIGGERS } from "./catalog";
import {
  MS_PER_HOUR,
  TIMES_FORMS,
  addDays,
  dayKey,
  formatDurationWords,
  parseDayKey,
  pluralize,
  weekdayIndex,
} from "./date";
import { getBestStreak, getCurrentStreak, isControlled, type ScrollLog } from "./stats";
import type { IconName, InterceptEntry, Settings, SlipEntry, TriggerId, WinEntry } from "./types";

/** On Sunday at this hour the week's report is put together. */
export const WEEKLY_REPORT_HOUR = 19;

/** At most this many past weeks can be browsed. */
const MAX_REPORT_WEEKS = 52;

export interface ReportData {
  wins: readonly WinEntry[];
  slips: readonly SlipEntry[];
  intercepts: readonly InterceptEntry[];
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
    data.intercepts[data.intercepts.length - 1]?.timestamp,
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
  /** Feed apps that were not opened on the pause screen. */
  prevented: number;
  /** "Open anyway" on the pause screen. */
  openedAnyway: number;
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

const inWeek = (timestamp: number, week: string, end: string) => {
  const key = dayKey(timestamp);
  return key >= week && key <= end;
};

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
  const wins = data.wins.filter((win) => inWeek(win.timestamp, week, end));
  const slips = data.slips.filter((slip) => inWeek(slip.timestamp, week, end));
  const intercepts = data.intercepts.filter((item) => inWeek(item.timestamp, week, end));
  const opened = intercepts.filter((item) => item.outcome === "opened");

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

  // Losses are slips and "open anyway"; the hour of the urge matters, not just the outcome.
  const lostHours = Array.from({ length: 24 }, () => 0);
  const allHours = Array.from({ length: 24 }, () => 0);
  const slots = Array.from({ length: 8 }, (_, index) => ({
    hour: index * 3,
    resisted: 0,
    lost: 0,
  }));
  const hour = (timestamp: number) => new Date(timestamp).getHours();
  for (const item of [...slips, ...opened]) {
    lostHours[hour(item.timestamp)]! += 1;
    allHours[hour(item.timestamp)]! += 1;
    slots[Math.floor(hour(item.timestamp) / 3)]!.lost += 1;
  }
  for (const win of wins) {
    allHours[hour(win.timestamp)]! += 1;
    slots[Math.floor(hour(win.timestamp) / 3)]!.resisted += 1;
  }

  const lostByDay = days.map(
    (day, index) =>
      day.slips + opened.filter((item) => weekdayIndex(item.timestamp) === index).length,
  );
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
  for (const slip of slips)
    triggerCounts.set(slip.trigger, (triggerCounts.get(slip.trigger) ?? 0) + 1);
  const triggers = TRIGGERS.map((trigger) => ({
    id: trigger.id,
    count: triggerCounts.get(trigger.id) ?? 0,
  }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);

  const logged = days.filter((day) => day.scroll !== null);
  const scrollTotal = logged.reduce((sum, day) => sum + day.scroll!, 0);
  const impulses = wins.length + slips.length + opened.length;

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
    prevented: intercepts.length - opened.length,
    openedAnyway: opened.length,
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
  report.wins === 0 &&
  report.slips === 0 &&
  report.loggedDays === 0 &&
  report.prevented === 0 &&
  report.openedAnyway === 0;

// ---------------------------------------------------------------------------
// Week over week
// ---------------------------------------------------------------------------

export type ChangeDirection = "better" | "worse" | "same";

export interface ReportChange {
  id: "saved" | "prevented" | "slips" | "success" | "scroll";
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
  add("prevented", current.prevented - previous.prevented, true);
  add("slips", current.slips - previous.slips, false);
  if (current.successRate !== null && previous.successRate !== null) {
    add("success", Math.round((current.successRate - previous.successRate) * 100), true);
  }
  if (current.scrollAverage !== null && previous.scrollAverage !== null) {
    add("scroll", current.scrollAverage - previous.scrollAverage, false);
  }
  return changes;
}

// ---------------------------------------------------------------------------
// Motivation
// ---------------------------------------------------------------------------

export interface MotivationCard {
  id: string;
  icon: IconName;
  text: string;
}

const MOVIE_MINUTES = 120;
/** An average page of a book takes about two minutes. */
const PAGE_MINUTES = 2;
const NUMBER_WORDS = [
  "",
  "один",
  "два",
  "три",
  "четыре",
  "пять",
  "шесть",
  "семь",
  "восемь",
  "девять",
];

/** Generated from the week's numbers; the strongest message comes first. */
export function buildMotivation(
  report: WeeklyReport,
  previous: WeeklyReport | null,
): MotivationCard[] {
  const cards: MotivationCard[] = [];
  const saved = report.savedMinutes;

  if (saved > 0) {
    cards.push({
      id: "returned",
      icon: "leaf",
      text: `На этой неделе вы вернули себе ${formatDurationWords(saved)}.`,
    });
  }
  const movies = Math.floor(saved / MOVIE_MINUTES);
  if (movies >= 1) {
    const count = movies < NUMBER_WORDS.length ? NUMBER_WORDS[movies]! : String(movies);
    cards.push({
      id: "movies",
      icon: "film",
      text: `За это время можно было посмотреть ${count} ${pluralize(movies, ["фильм", "фильма", "фильмов"])}.`,
    });
  }
  const pages = saved / PAGE_MINUTES;
  if (pages >= 5) {
    const rounded = pages >= 30 ? Math.round(pages / 10) * 10 : Math.round(pages);
    cards.push({
      id: "pages",
      icon: "book",
      text: `За это время можно было прочитать около ${rounded} ${pluralize(rounded, ["страницы", "страниц", "страниц"])}.`,
    });
  }
  if (report.wins >= 2) {
    cards.push({
      id: "wins",
      icon: "trophy",
      text: `Вы выиграли у бесконечной ленты ${report.wins} ${pluralize(report.wins, TIMES_FORMS)}.`,
    });
  }
  if (report.prevented >= 1) {
    cards.push({
      id: "prevented",
      icon: "shield-checkmark",
      text: `${report.prevented} ${pluralize(report.prevented, TIMES_FORMS)} вы остановились на пороге ленты и не открыли её.`,
    });
  }
  if (previous?.scrollAverage && report.scrollAverage !== null) {
    const drop = Math.round((1 - report.scrollAverage / previous.scrollAverage) * 100);
    if (drop >= 5) {
      cards.push({
        id: "less-feed",
        icon: "trending-down",
        text: `Лента заняла на ${drop}% меньше времени, чем неделей раньше.`,
      });
    }
  }
  if (report.currentStreak >= 2) {
    cards.push({
      id: "streak",
      icon: "flame",
      text: `${report.currentStreak} ${pluralize(report.currentStreak, ["день", "дня", "дней"])} подряд вы держитесь в пределах лимита.`,
    });
  }
  if (cards.length === 0) {
    cards.push({
      id: "fresh",
      icon: "sparkles",
      text: "Новая неделя — чистый лист. Одна пауза перед лентой уже меняет счёт.",
    });
  }
  return cards;
}
