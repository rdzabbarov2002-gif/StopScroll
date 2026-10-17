import { m } from "../i18n";
import { getTrigger } from "../utils/catalog";
import { addDays, formatDurationWords, weekdayIndex } from "../utils/date";
import type { IconName, SlipEntry, TriggerId } from "../utils/types";
import {
  type ReportData,
  type WeeklyReport,
  buildWeeklyReport,
  isEmptyReport,
  weekBounds,
} from "../utils/weeklyReport";
import { chooseAdvice } from "./advice";
import { hourOf, isLate } from "./history";
import { clock, minutes, variant } from "./language";
import { findTimePattern } from "./patterns";

export interface ReviewSection {
  id: "good" | "worse" | "habit" | "weak" | "next";
  title: string;
  icon: IconName;
  tone: "success" | "warning" | "primary" | "indigo";
  text: string;
}

const percent = (value: number) => Math.round(value * 100);

function weekSlips(data: ReportData, week: string): SlipEntry[] {
  const { from, to } = weekBounds(week);
  return data.slips.filter((slip) => slip.timestamp >= from && slip.timestamp < to);
}

const lateCount = (slips: readonly SlipEntry[]) =>
  slips.filter((slip) => isLate(hourOf(slip.timestamp), 21)).length;

function reasonCounts(slips: readonly SlipEntry[]) {
  const counts = new Map<TriggerId, number>();
  for (const slip of slips) {
    if (slip.trigger && slip.trigger !== "other") {
      counts.set(slip.trigger, (counts.get(slip.trigger) ?? 0) + 1);
    }
  }
  return counts;
}

/** "Что получилось" — the week's real wins, at most two of them. */
function good(report: WeeklyReport, previous: WeeklyReport | null, say: Say): string {
  const t = m().coach.review;
  const parts: string[] = [];
  if (report.savedMinutes > 0) {
    const movies = Math.floor(report.savedMinutes / 120);
    const saved = formatDurationWords(report.savedMinutes);
    parts.push(movies >= 1 ? t.savedMovies(saved, movies) : t.saved(saved));
  }
  if (report.loggedDays >= 4 && report.daysInLimit >= Math.ceil(report.loggedDays / 2)) {
    parts.push(t.daysInLimit(report.daysInLimit, report.loggedDays));
  }
  if (previous && previous.slips >= 2 && report.slips < previous.slips) {
    parts.push(t.fewerSlips(report.slips, previous.slips));
  }
  if (report.successRate !== null && report.wins + report.slips >= 5 && report.successRate >= 0.6) {
    parts.push(t.impulses(percent(report.successRate)));
  }
  if (report.replacements >= 3) {
    parts.push(t.replacements(report.replacements));
  }
  if (parts.length === 0) return say(t.noWins);
  return parts.slice(0, 2).join(" ");
}

/** "Что ухудшилось" — honestly, without blame. */
function worse(report: WeeklyReport, previous: WeeklyReport | null): string {
  const t = m().coach.review;
  if (!previous) return t.firstWeek;
  const parts: string[] = [];
  if (report.slips >= 3 && report.slips >= previous.slips + 2) {
    parts.push(t.moreSlips(report.slips, previous.slips));
  }
  if (
    report.scrollAverage !== null &&
    previous.scrollAverage !== null &&
    previous.scrollAverage > 0 &&
    report.scrollAverage >= previous.scrollAverage * 1.15
  ) {
    parts.push(t.moreScroll(minutes(report.scrollAverage), minutes(previous.scrollAverage)));
  }
  if (
    report.successRate !== null &&
    previous.successRate !== null &&
    previous.successRate - report.successRate >= 0.15
  ) {
    parts.push(t.heldLess(percent(report.successRate), percent(previous.successRate)));
  }
  return parts.length > 0 ? parts.slice(0, 2).join(" ") : t.nothingWorse;
}

/** "Какая привычка стала лучше" — the clearest improvement against last week. */
function habit(
  report: WeeklyReport,
  previous: WeeklyReport | null,
  slips: readonly SlipEntry[],
  previousSlips: readonly SlipEntry[],
): string {
  const t = m().coach.review;
  if (!previous) return t.habitFirstWeek;
  const lateNow = lateCount(slips);
  const lateBefore = lateCount(previousSlips);
  if (lateBefore >= 2 && lateNow < lateBefore) {
    return t.eveningHabit(clock(21), lateNow, lateBefore);
  }
  const before = reasonCounts(previousSlips);
  const now = reasonCounts(slips);
  const improved = [...before.entries()]
    .filter(([trigger, value]) => value >= 2 && (now.get(trigger) ?? 0) < value)
    .sort((a, b) => b[1] - (now.get(b[0]) ?? 0) - (a[1] - (now.get(a[0]) ?? 0)))[0];
  if (improved) {
    const [trigger, value] = improved;
    return t.reasonHabit(getTrigger(trigger), now.get(trigger) ?? 0, value);
  }
  if (report.replacements > previous.replacements && report.replacements >= 2) {
    return t.switchHabit(report.replacements, previous.replacements);
  }
  if (
    report.scrollAverage !== null &&
    previous.scrollAverage !== null &&
    previous.scrollAverage > 0 &&
    report.scrollAverage <= previous.scrollAverage * 0.9
  ) {
    return t.scrollHabit(minutes(report.scrollAverage), minutes(previous.scrollAverage));
  }
  return t.noHabit;
}

/** "Где ты чаще всего проигрываешь" — day, hour and reason, when there were slips. */
function weak(report: WeeklyReport, slips: readonly SlipEntry[]): string {
  const t = m().coach.review;
  if (report.slips === 0) return t.noWeakSpots;
  const day = report.hardestDay?.basis === "slips" ? report.hardestDay.index : null;
  const hour = report.hardestHour?.basis === "slips" ? report.hardestHour.hour : null;
  const reason = report.topTrigger && report.topTrigger.id !== "other" ? report.topTrigger : null;
  if (report.slips === 1) {
    const slip = slips[0]!;
    const trigger = slip.trigger && slip.trigger !== "other" ? getTrigger(slip.trigger) : null;
    return t.singleSlip(weekdayIndex(slip.timestamp), clock(hourOf(slip.timestamp)), trigger);
  }
  return t.hardest(day, hour !== null ? clock(hour) : null, reason ? getTrigger(reason.id) : null);
}

/** "Что попробовать на следующей неделе" — one rule-based tip and one small goal. */
function next(report: WeeklyReport, slips: readonly SlipEntry[], data: ReportData): string {
  const reason = report.topTrigger && report.topTrigger.count >= 2 ? report.topTrigger.id : null;
  const advice = chooseAdvice(
    {
      day: report.week,
      risk: null,
      reason,
      timePattern: findTimePattern(slips),
      walksHelp: false,
      replacementsHelp: false,
      todayLogged: true,
      hour: 12,
      mainApp: data.settings.mainApp,
      learning: false,
    },
    [],
  );
  const t = m().coach;
  const tip = t.advice.forWeek(advice.text);
  if (report.loggedDays >= 3) {
    return t.review.goal(tip, Math.min(7, report.daysInLimit + 1));
  }
  return t.review.logDaily(tip);
}

type Say = <T>(options: readonly T[]) => T;

/**
 * The coach's conclusion under the weekly numbers: what worked, what got worse, which habit
 * improved, where the feed wins most, and what to try next week. Null for an empty week.
 */
export function buildWeeklyReview(
  data: ReportData,
  week: string,
  now: number = Date.now(),
): ReviewSection[] | null {
  const report = buildWeeklyReport(data, week, now);
  if (isEmptyReport(report)) return null;
  const previousReport = buildWeeklyReport(data, addDays(week, -7), now);
  const previous = isEmptyReport(previousReport) ? null : previousReport;
  const slips = weekSlips(data, week);
  const previousSlips = weekSlips(data, addDays(week, -7));
  const say: Say = (options) => variant(`${week}:review`, options);
  const titles = m().coach.review.titles;

  return [
    {
      id: "good",
      title: titles.good,
      icon: "checkmark-circle",
      tone: "success",
      text: good(report, previous, say),
    },
    {
      id: "worse",
      title: titles.worse,
      icon: "trending-down",
      tone: "warning",
      text: worse(report, previous),
    },
    {
      id: "habit",
      title: titles.habit,
      icon: "leaf",
      tone: "success",
      text: habit(report, previous, slips, previousSlips),
    },
    {
      id: "weak",
      title: titles.weak,
      icon: "locate",
      tone: "indigo",
      text: weak(report, slips),
    },
    {
      id: "next",
      title: titles.next,
      icon: "compass",
      tone: "primary",
      text: next(report, slips, data),
    },
  ];
}
