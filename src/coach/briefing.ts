import { m } from "../i18n";
import { addDays } from "../utils/date";
import type { CoachLogEntry, RiskLevel } from "../utils/types";
import { type Advice, type AdviceOutcome, chooseAdvice, getAdviceRule } from "./advice";
import {
  type CoachInput,
  type History,
  activeDayCount,
  buildHistory,
  hourOf,
  isLate,
  lastDays,
  slipsWithin,
} from "./history";
import { type Insight, buildInsights } from "./insights";
import { type ReplacementPick, pickReplacement } from "./replacement";
import { greeting, minutes, variant } from "./language";
import {
  findCalmWeekday,
  findHardWeekday,
  findTimePattern,
  findTopReason,
  replacementEffect,
  streaks,
  walkEffect,
  weekScrollTrend,
} from "./patterns";

/** Days with records (in the last four weeks) the coach needs before it forecasts anything. */
export const DAYS_TO_LEARN = 5;

export interface DailyBriefing {
  greeting: string;
  /** Set while the coach is still collecting data: it says so instead of guessing. */
  learning: { activeDays: number; needed: number } | null;
  risk: RiskLevel | null;
  /** Why the risk is what it is — always a fact from the user's own records. */
  riskReason: string | null;
  advice: Advice;
  /** A look back: how yesterday's advice went, or how close the best streak is. */
  memory: string | null;
  insights: Insight[];
  /** The replacement of the day, chosen from what helped and the main reason. */
  replacement: ReplacementPick;
  /** What to remember about today's briefing. */
  logEntry: CoachLogEntry;
}

interface Evidence {
  points: number;
  text: string;
}

/** Signals for and against a hard day, each a sentence built from the records. */
function riskEvidence(history: History): Evidence[] {
  const evidence: Evidence[] = [];
  const t = m().coach.briefing.risk;
  const today = history.byKey.get(history.todayKey)!;
  const limit = history.settings.dailyLimitMinutes;
  const todayIndex = today.weekday;

  const hard = findHardWeekday(history);
  if (hard?.index === todayIndex) {
    evidence.push({
      points: 2,
      text: t.hardWeekday(todayIndex, hard.bad, hard.active),
    });
  }
  const calm = findCalmWeekday(history);
  if (calm?.index === todayIndex) {
    evidence.push({
      points: -1,
      text: t.calmWeekday(todayIndex, calm.bad, calm.active),
    });
  }

  const lastThree = lastDays(history, 3, 1);
  const recentSlips = lastThree.reduce((sum, day) => sum + day.slips.length, 0);
  if (recentSlips >= 2) {
    evidence.push({ points: 2, text: t.recentSlips(recentSlips) });
  } else if (recentSlips === 1) {
    evidence.push({ points: 1, text: t.oneRecentSlip });
  }

  const yesterday = history.byKey.get(addDays(history.todayKey, -1));
  if (yesterday?.scroll !== null && yesterday?.scroll !== undefined && yesterday.scroll > limit) {
    evidence.push({
      points: 1,
      text: t.yesterdayOver(minutes(yesterday.scroll), minutes(limit)),
    });
  }

  if (today.scroll !== null && today.scroll > limit) {
    evidence.push({
      points: 3,
      text: t.todayOver(minutes(today.scroll), minutes(limit)),
    });
  } else if (today.slips.length > 0) {
    evidence.push({ points: 1, text: t.todaySlip });
  }

  const streak = streaks(history).current;
  if (streak >= 3) {
    evidence.push({ points: -1, text: t.streak(streak) });
  }

  const trend = weekScrollTrend(history);
  if (trend && trend.change >= 20) {
    evidence.push({
      points: 1,
      text: t.heavierWeek(minutes(trend.recent), minutes(trend.previous)),
    });
  } else if (trend && trend.change <= -20) {
    evidence.push({
      points: -1,
      text: t.lighterWeek(minutes(trend.recent), minutes(trend.previous)),
    });
  }
  return evidence;
}

function levelOf(points: number): RiskLevel {
  if (points >= 3) return "high";
  if (points >= 1) return "medium";
  return "low";
}

/** How the advice remembered for `entry.day` went, judged by that day's records. */
export function adviceOutcome(history: History, entry: CoachLogEntry): AdviceOutcome | null {
  const day = history.byKey.get(entry.day);
  if (!day || !day.active || entry.day >= history.todayKey) return null;
  const rule = getAdviceRule(entry.advice);
  const slips =
    rule?.focus === "evening"
      ? day.slips.filter((slip) => isLate(hourOf(slip.timestamp), 17))
      : day.slips;
  const overLimit = day.controlled === false;
  return slips.length === 0 && !overLimit ? "worked" : "missed";
}

function memoryLine(history: History, outcome: AdviceOutcome | null, focus: string | undefined) {
  const t = m().coach.briefing.memory;
  if (outcome === "worked") return focus === "evening" ? t.workedEvening : t.workedDay;
  if (outcome === "missed") return variant(`${history.todayKey}:missed`, t.missed);
  return null;
}

/** The morning briefing: today's risk, why, one piece of advice and a look back. */
export function buildBriefing(input: CoachInput, isPro = false): DailyBriefing {
  const history = buildHistory(input);
  const activeDays = activeDayCount(history, 28);
  const learning = activeDays < DAYS_TO_LEARN;
  const insights = learning ? [] : buildInsights(history);

  let risk: RiskLevel | null = null;
  let riskReason: string | null = null;
  if (!learning) {
    const evidence = riskEvidence(history);
    const points = evidence.reduce((sum, item) => sum + item.points, 0);
    risk = levelOf(points);
    const supporting =
      risk === "low"
        ? evidence.filter((item) => item.points < 0).sort((a, b) => a.points - b.points)
        : evidence.filter((item) => item.points > 0).sort((a, b) => b.points - a.points);
    if (supporting[0]) {
      riskReason = supporting[0].text;
    } else {
      const weekSlips = slipsWithin(history, 7).length;
      const t = m().coach.briefing.risk;
      riskReason = weekSlips === 0 ? t.calmWeek : t.noSignals(weekSlips);
    }
  }

  // The coach's memory: its last advice and how each went.
  const remembered = history.coachLog
    .filter((entry) => entry.day < history.todayKey)
    .slice(0, 3)
    .map((entry) => ({ advice: entry.advice, outcome: adviceOutcome(history, entry) }));
  const yesterdayEntry = history.coachLog.find(
    (entry) => entry.day === addDays(history.todayKey, -1),
  );
  const yesterdayOutcome = yesterdayEntry ? adviceOutcome(history, yesterdayEntry) : null;

  const reason = findTopReason(slipsWithin(history, 28));
  const advice = chooseAdvice(
    {
      day: history.todayKey,
      risk,
      reason: reason?.trigger ?? null,
      timePattern: findTimePattern(slipsWithin(history, 28)),
      walksHelp: walkEffect(history) !== null,
      replacementsHelp: replacementEffect(history) !== null,
      todayLogged: history.byKey.get(history.todayKey)!.scroll !== null,
      hour: history.hour,
      mainApp: history.settings.mainApp,
      learning,
    },
    yesterdayEntry ? remembered : [],
  );

  const memory =
    memoryLine(
      history,
      yesterdayOutcome,
      yesterdayEntry ? getAdviceRule(yesterdayEntry.advice)?.focus : undefined,
    ) ??
    insights.find((insight) => insight.group === "streak" || insight.group === "memory")?.text ??
    null;

  return {
    greeting: greeting(history.hour),
    learning: learning ? { activeDays, needed: DAYS_TO_LEARN } : null,
    risk,
    riskReason,
    advice,
    memory,
    // The memory line is already said above; don't repeat it in the list.
    insights: insights.filter((insight) => insight.text !== memory),
    replacement: pickReplacement(history, isPro, advice.replacementId),
    logEntry: { day: history.todayKey, risk, advice: advice.id },
  };
}
