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
import {
  DAY_WORD_FORMS,
  REPLACEMENT_WORD_FORMS,
  SLIP_FORMS,
  clock,
  count,
  minutes,
  variant,
  weekday,
} from "./language";
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
  const parts: string[] = [];
  if (report.savedMinutes > 0) {
    const movies = Math.floor(report.savedMinutes / 120);
    parts.push(
      movies >= 1
        ? `Эта неделя вернула тебе ${formatDurationWords(report.savedMinutes)} — хватило бы на ${movies === 1 ? "целый фильм" : `${movies} фильма`}.`
        : `Эта неделя вернула тебе ${formatDurationWords(report.savedMinutes)}.`,
    );
  }
  if (report.loggedDays >= 4 && report.daysInLimit >= Math.ceil(report.loggedDays / 2)) {
    parts.push(
      `${report.daysInLimit} из ${count(report.loggedDays, DAY_WORD_FORMS)} — в пределах лимита.`,
    );
  }
  if (previous && previous.slips >= 2 && report.slips < previous.slips) {
    parts.push(`Срывов стало меньше: ${report.slips} против ${previous.slips} неделей раньше.`);
  }
  if (report.successRate !== null && report.wins + report.slips >= 5 && report.successRate >= 0.6) {
    parts.push(`${percent(report.successRate)}% импульсов прошли без ленты.`);
  }
  if (report.replacements >= 3) {
    parts.push(
      `${capitalizeFirst(count(report.replacements, REPLACEMENT_WORD_FORMS))} вместо ленты.`,
    );
  }
  if (parts.length === 0) {
    return say([
      "Явных побед на этой неделе немного — зато теперь видно, на что опереться дальше.",
      "Неделя получилась непростой. Это не провал, а данные: по ним уже понятно, где подстелить соломку.",
    ]);
  }
  return parts.slice(0, 2).join(" ");
}

/** "Что ухудшилось" — honestly, without blame. */
function worse(report: WeeklyReport, previous: WeeklyReport | null): string {
  if (!previous) return "Сравнивать пока не с чем — это первая неделя с записями.";
  const parts: string[] = [];
  if (report.slips >= 3 && report.slips >= previous.slips + 2) {
    parts.push(`Срывов стало больше: ${report.slips} против ${previous.slips}.`);
  }
  if (
    report.scrollAverage !== null &&
    previous.scrollAverage !== null &&
    previous.scrollAverage > 0 &&
    report.scrollAverage >= previous.scrollAverage * 1.15
  ) {
    parts.push(
      `Лента в среднем заняла ${minutes(report.scrollAverage)} в день против ${minutes(previous.scrollAverage)} неделей раньше.`,
    );
  }
  if (
    report.successRate !== null &&
    previous.successRate !== null &&
    previous.successRate - report.successRate >= 0.15
  ) {
    parts.push(
      `Удерживаться получалось реже: ${percent(report.successRate)}% против ${percent(previous.successRate)}%.`,
    );
  }
  return parts.length > 0 ? parts.slice(0, 2).join(" ") : "Заметных ухудшений нет.";
}

/** "Какая привычка стала лучше" — the clearest improvement against last week. */
function habit(
  report: WeeklyReport,
  previous: WeeklyReport | null,
  slips: readonly SlipEntry[],
  previousSlips: readonly SlipEntry[],
): string {
  if (!previous) return "Сравнивать пока не с чем — через неделю здесь появится динамика.";
  const lateNow = lateCount(slips);
  const lateBefore = lateCount(previousSlips);
  if (lateBefore >= 2 && lateNow < lateBefore) {
    return `Вечерняя привычка: после 21:00 — ${count(lateNow, SLIP_FORMS)} против ${lateBefore} неделей раньше.`;
  }
  const before = reasonCounts(previousSlips);
  const now = reasonCounts(slips);
  const improved = [...before.entries()]
    .filter(([trigger, value]) => value >= 2 && (now.get(trigger) ?? 0) < value)
    .sort((a, b) => b[1] - (now.get(b[0]) ?? 0) - (a[1] - (now.get(a[0]) ?? 0)))[0];
  if (improved) {
    const [trigger, value] = improved;
    return `Срывов ${getTrigger(trigger).because} стало меньше: ${now.get(trigger) ?? 0} против ${value} неделей раньше.`;
  }
  if (report.replacements > previous.replacements && report.replacements >= 2) {
    return `Привычка переключаться крепнет: ${count(report.replacements, REPLACEMENT_WORD_FORMS)} против ${previous.replacements} неделей раньше.`;
  }
  if (
    report.scrollAverage !== null &&
    previous.scrollAverage !== null &&
    previous.scrollAverage > 0 &&
    report.scrollAverage <= previous.scrollAverage * 0.9
  ) {
    return `Время в ленте сократилось: ${minutes(report.scrollAverage)} в день против ${minutes(previous.scrollAverage)}.`;
  }
  return "Пока ни одна привычка заметно не сдвинулась — для одной недели это нормально.";
}

/** "Где ты чаще всего проигрываешь" — day, hour and reason, when there were slips. */
function weak(report: WeeklyReport, slips: readonly SlipEntry[]): string {
  if (report.slips === 0) return "Слабых мест не видно: за неделю ни одного срыва.";
  const day =
    report.hardestDay?.basis === "slips" ? weekday(report.hardestDay.index, "accusative") : null;
  const hour = report.hardestHour?.basis === "slips" ? report.hardestHour.hour : null;
  const reason = report.topTrigger && report.topTrigger.id !== "other" ? report.topTrigger : null;
  if (report.slips === 1) {
    const slip = slips[0]!;
    const trigger = slip.trigger && slip.trigger !== "other" ? getTrigger(slip.trigger) : null;
    return `Срыв был один — ${weekday(weekdayIndex(slip.timestamp), "accusative")} около ${clock(hourOf(slip.timestamp))}${trigger ? `, ${trigger.because}` : ""}.`;
  }
  const where = [day, hour !== null ? `около ${clock(hour)}` : null].filter(Boolean).join(" ");
  const why = reason ? ` — обычно ${getTrigger(reason.id).because}` : "";
  return `Труднее всего ${where || "было в разное время"}${why}.`;
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
  const tip = advice.text.replace(/^Сегодня /, "На этой неделе ").replace(/ сегодня/g, "");
  if (report.loggedDays >= 3) {
    const target = Math.min(7, report.daysInLimit + 1);
    return `${tip} И маленькая цель: ${target} из 7 дней в пределах лимита.`;
  }
  return `${tip} И попробуй отмечать время в ленте каждый день — так следующий разбор будет точнее.`;
}

const capitalizeFirst = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

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

  return [
    {
      id: "good",
      title: "Что получилось",
      icon: "checkmark-circle",
      tone: "success",
      text: good(report, previous, say),
    },
    {
      id: "worse",
      title: "Что ухудшилось",
      icon: "trending-down",
      tone: "warning",
      text: worse(report, previous),
    },
    {
      id: "habit",
      title: "Какая привычка стала лучше",
      icon: "leaf",
      tone: "success",
      text: habit(report, previous, slips, previousSlips),
    },
    {
      id: "weak",
      title: "Где лента выигрывает чаще всего",
      icon: "locate",
      tone: "indigo",
      text: weak(report, slips),
    },
    {
      id: "next",
      title: "Что попробовать на следующей неделе",
      icon: "compass",
      tone: "primary",
      text: next(report, slips, data),
    },
  ];
}
