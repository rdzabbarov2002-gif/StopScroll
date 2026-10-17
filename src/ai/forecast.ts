import { m } from "../i18n";
import { addDays, formatMinutesInline } from "../utils/date";
import { footprint, isActive, strength, votesByBelief, weight } from "./evidence";
import {
  type Day,
  type Timeline,
  dangerWindow,
  hourOf,
  isHard,
  isObserved,
  lossTimes,
  minuteOfDay,
  observedSince,
  partOfDay,
  streaks,
  urgeHours,
} from "./facts";
import type { AiForecast, AiMemory, Belief, RiskLevel } from "./types";

/**
 * Today's forecast, computed on the device — instantly, after every record, without a request.
 * The probability is the user's own empirical rate: how often the feed won from this time of day
 * on, on recent days and on the same weekday, adjusted for what already happened today. ChatGPT's
 * part comes from the memory: the dangerous periods it noticed and the personal advice.
 */

/** Days with records in the last four weeks before the forecast gives a number. */
export const FORECAST_MIN_DAYS = 5;

const minutes = (value: number) => formatMinutesInline(value);
const pad = (value: number) => String(value).padStart(2, "0");
/** "21:00" */
const hourClock = (hour: number) => `${pad(((hour % 24) + 24) % 24)}:00`;

export const levelOf = (probability: number): RiskLevel =>
  probability >= 65 ? "high" : probability >= 35 ? "medium" : "low";

interface Reason {
  /** true — raises the risk, false — lowers it. */
  up: boolean;
  text: string;
}

/** Active beliefs of a kind the records don't contradict, strongest first. */
function ranked(memory: AiMemory | null, t: Timeline, kind: Belief["kind"]): Belief[] {
  if (!memory) return [];
  const votes = votesByBelief(t.input.entries);
  return memory.beliefs
    .filter((belief) => belief.kind === kind && isActive(belief))
    .map((belief) => {
      const print = footprint(belief, t);
      return { belief, print, rank: weight(belief, strength(belief, votes.get(belief.id), print)) };
    })
    .filter((item) => item.print.verdict !== "failing")
    .sort((a, b) => b.rank - a.rank)
    .map((item) => item.belief);
}

export function buildForecast(t: Timeline, memory: AiMemory | null): AiForecast | null {
  if (!t.all.some(isObserved)) return null;
  const f = m().ai.forecast;
  const today = t.todayRecord;
  const nowMinute = minuteOfDay(t.now);
  const recent = observedSince(t, addDays(t.today, -28));
  const sameDay = t.past
    .filter((day) => day.weekday === today.weekday && isObserved(day))
    .slice(-8);

  // Did the feed win on that day from this time of day on?
  const restHard = (day: Day) =>
    lossTimes(day).some((timestamp) => minuteOfDay(timestamp) >= nowMinute) ||
    (nowMinute < 18 * 60 && day.feed !== null && day.feed > t.limit);
  const rate = (list: readonly Day[]) => (list.filter(restHard).length + 1) / (list.length + 2);

  // When the urges cluster (two months of slips and entries).
  const window = dangerWindow(urgeHours(t, 60));
  const wraps = window !== null && window.to !== 0 && window.to < window.from;
  const windowEnd = window ? (window.to === 0 ? 24 * 60 : window.to * 60) : 0;
  const inWindow = (hour: number) => window !== null && (hour - window.from + 24) % 24 < 3;
  const ahead = window !== null && (wraps || nowMinute < windowEnd);
  const lostInWindow = lossTimes(today).some((timestamp) => inWindow(hourOf(timestamp)));
  const passed =
    window !== null && !wraps && nowMinute >= windowEnd && !lostInWindow
      ? f.passed(hourClock(window.from), hourClock(window.to))
      : null;

  const lostToday = lossTimes(today).length > 0;
  const overToday = today.feed !== null && today.feed > t.limit;
  const yesterday = t.days.get(addDays(t.today, -1));
  const yesterdayHard =
    yesterday !== undefined && isObserved(yesterday) && isHard(yesterday, t.limit);
  const lastThreeSlips = t.past.slice(-3).reduce((sum, day) => sum + day.slips.length, 0);
  const streak = streaks(t).current;

  let probability: number | null = null;
  if (recent.length >= FORECAST_MIN_DAYS) {
    let p = sameDay.length >= 3 ? (rate(recent) + rate(sameDay)) / 2 : rate(recent);
    const raise = (share: number) => {
      p += (1 - p) * share;
    };
    if (overToday) raise(0.35);
    else if (lostToday) raise(0.25);
    if (yesterdayHard) raise(0.1);
    if (lastThreeSlips >= 2) raise(0.15);
    if (streak >= 3) p *= 0.85;
    if (passed) p *= 0.7;
    probability = Math.round(Math.min(0.97, Math.max(0.03, p)) * 100);
  }
  const level = probability === null ? null : levelOf(probability);

  const reasons: Reason[] = [];
  // ChatGPT's memory first: a dangerous period it noticed that applies to today.
  const zone = ranked(memory, t, "zone").find((belief) => {
    const item = belief.zone;
    return (
      item !== null &&
      (item.weekday === today.weekday || (item.weekday === null && item.from !== null)) &&
      (item.to === null || item.from === null || item.to < item.from || item.to * 60 > nowMinute)
    );
  });
  if (zone) reasons.push({ up: true, text: zone.note || zone.text });

  if (overToday) {
    reasons.push({
      up: true,
      text: f.overLimit(minutes(today.feed!), minutes(t.limit)),
    });
  } else if (lostToday) {
    reasons.push({
      up: true,
      text: today.slips.length ? f.slipToday : f.openedToday,
    });
  }

  if (window && ahead) {
    reasons.push({
      up: true,
      text: f.window(window.count, window.total, hourClock(window.from), hourClock(window.to)),
    });
  }

  if (sameDay.length >= 3) {
    const hard = sameDay.filter((day) => isHard(day, t.limit)).length;
    if (hard / sameDay.length >= 0.5) {
      reasons.push({
        up: true,
        text: f.weekdayHard(hard, sameDay.length, today.weekday),
      });
    } else if (hard / sameDay.length <= 0.2) {
      reasons.push({
        up: false,
        text: f.weekdayCalm(hard, sameDay.length, today.weekday),
      });
    }
  }

  if (yesterdayHard) {
    // How the day after a hard day usually goes for this user.
    const after = t.past.filter((day) => {
      const before = t.days.get(addDays(day.key, -1));
      return (
        isObserved(day) && before !== undefined && isObserved(before) && isHard(before, t.limit)
      );
    });
    const hardAfter = after.filter((day) => isHard(day, t.limit)).length;
    if (after.length >= 4 && hardAfter / after.length >= 0.5) {
      reasons.push({
        up: true,
        text: f.afterHardUsuallyHard(hardAfter, after.length),
      });
    } else if (after.length >= 4) {
      reasons.push({
        up: false,
        text: f.afterHardUsuallyFine(hardAfter, after.length),
      });
    } else {
      reasons.push({ up: true, text: f.afterHard });
    }
  }

  if (lastThreeSlips >= 2) {
    reasons.push({
      up: true,
      text: f.recentSlips(lastThreeSlips),
    });
  }
  if (streak >= 3) {
    reasons.push({
      up: false,
      text: f.streak(streak),
    });
  }
  const lastWeek = observedSince(t, addDays(t.today, -7));
  if (lastWeek.length >= 4 && lastWeek.every((day) => lossTimes(day).length === 0)) {
    reasons.push({ up: false, text: f.calmWeek });
  }

  const ordered =
    level === "low"
      ? [...reasons.filter((item) => !item.up), ...reasons.filter((item) => item.up)]
      : [...reasons.filter((item) => item.up), ...reasons.filter((item) => !item.up)];
  const texts = ordered.slice(0, 4).map((item) => item.text);

  const part = window && ahead ? partOfDay((window.from + 1) % 24) : partOfDay(hourOf(t.now));
  // After the feed already won today, the forecast is about the rest of the day.
  const rest = lostToday || overToday;
  const headline =
    probability === null
      ? f.preliminary
      : passed && level !== "high"
        ? f.passedHeadline
        : level === "high"
          ? f.hardPart[part]
          : level === "medium"
            ? f.medium(rest, window && ahead ? part : null)
            : rest
              ? f.lowRest
              : f.low;

  // Personal advice from the memory, for the time that matters today: a tip that has helped in
  // an experiment comes first; one that failed and never helped is not offered again.
  const tips = ranked(memory, t, "tip")
    .filter((belief) => !(belief.trials.failed > 0 && belief.trials.helped === 0))
    .sort((a, b) => b.trials.helped - b.trials.failed - (a.trials.helped - a.trials.failed));
  const tip = tips.find((item) => item.when === part) ?? tips.find((item) => item.when === "any");
  const advice =
    tip?.text ?? (window && ahead ? f.plan(hourClock(window.from), hourClock(window.to)) : null);

  return {
    probability,
    level,
    headline,
    reasons: texts.length
      ? texts
      : probability === null
        ? [f.needDays(FORECAST_MIN_DAYS, recent.length)]
        : [f.noSignals],
    window: {
      until: window && ahead ? hourClock(window.to) : null,
      message:
        window && ahead && probability !== null
          ? rest
            ? f.windowRest(hourClock(window.to))
            : f.windowDay(hourClock(window.to))
          : null,
    },
    passed,
    advice,
    basis: f.basis(t.all.filter(isObserved).length),
    day: t.today,
    createdAt: t.now,
  };
}
