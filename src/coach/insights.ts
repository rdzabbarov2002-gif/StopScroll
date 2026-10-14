import { getTrigger } from "../utils/catalog";
import type { IconName } from "../utils/types";
import type { History } from "./history";
import { slipsWithin } from "./history";
import {
  DAY_WORD_FORMS,
  SLIP_FORMS,
  TIME_FORMS,
  WALK_FORMS,
  capitalize,
  clock,
  count,
  genitiveNumber,
  minutes,
  ordinalFeminine,
  variant,
  weekday,
} from "./language";
import {
  durationTrend,
  eveningTrend,
  findCalmWeekday,
  findHardWeekday,
  findTimePattern,
  findTopReason,
  recurringHardWeekday,
  replacementEffect,
  scrollTrend,
  slipTrend,
  streaks,
  walkEffect,
} from "./patterns";

export type InsightTone = "primary" | "success" | "warning" | "indigo";

/** One thing the coach noticed, worded from real numbers. */
export interface Insight {
  id: string;
  /** Insights of one group say similar things; only the strongest of a group is shown. */
  group: "time" | "reason" | "weekday" | "replacement" | "trend" | "streak" | "memory";
  icon: IconName;
  tone: InsightTone;
  text: string;
  /** How much it is worth saying today; higher first. */
  score: number;
}

const percent = (part: number, whole: number) => Math.round((part / whole) * 100);

/** Everything noteworthy in the history, strongest first, one per group. */
export function buildInsights(history: History): Insight[] {
  const say = <T>(id: string, options: readonly T[]) =>
    variant(`${history.todayKey}:${id}`, options);
  const found: Insight[] = [];
  const recent28 = slipsWithin(history, 28);

  const time = findTimePattern(recent28);
  if (time) {
    const share = time.count / time.total;
    found.push({
      id: "time-pattern",
      group: "time",
      icon: "time",
      tone: "indigo",
      score: 3 + share * 2,
      text:
        time.kind === "after"
          ? say("time-after", [
              `За последние четыре недели ${time.count} из ${time.total} срывов случились после ${clock(time.hour)}.`,
              `Большинство срывов — ${time.count} из ${time.total} за последние четыре недели — начинаются после ${clock(time.hour)}.`,
            ])
          : `Срывы чаще всего случаются между ${clock(time.from)} и ${clock(time.to)}: ${time.count} из ${time.total} за последние четыре недели.`,
    });
  }

  const reason = findTopReason(slipsWithin(history, 21));
  if (reason) {
    const noun = getTrigger(reason.trigger).noun;
    found.push({
      id: "top-reason",
      group: "reason",
      icon: getTrigger(reason.trigger).icon,
      tone: "warning",
      score: 3 + (reason.count / reason.total) * 2,
      text: say("top-reason", [
        `Основная причина последних срывов — ${noun}: ${reason.count} из ${reason.total}.`,
        `Чаще всего в последние три недели срывы случались ${getTrigger(reason.trigger).because}: ${reason.count} из ${reason.total}.`,
      ]),
    });
  }

  const recurring = recurringHardWeekday(history);
  if (recurring) {
    found.push({
      id: "recurring-weekday",
      group: "memory",
      icon: "repeat",
      tone: "indigo",
      score: 3.5 + recurring.weeks * 0.2,
      text: `Это уже ${ordinalFeminine(recurring.weeks)} неделя подряд, когда ${weekday(recurring.index, "nominative")} остаётся самым тяжёлым днём.`,
    });
  }

  const hard = findHardWeekday(history);
  if (hard && hard.index !== recurring?.index) {
    found.push({
      id: "hard-weekday",
      group: "weekday",
      icon: "calendar",
      tone: "warning",
      score: 2.5 + hard.bad / hard.active,
      text: `${capitalize(weekday(hard.index, "nominative"))} — самый трудный день: ${hard.bad} из последних ${genitiveNumber(hard.active)} ${weekday(hard.index, "genitivePlural")} прошли со срывом или выше лимита.`,
    });
  }

  const calm = findCalmWeekday(history);
  if (calm) {
    found.push({
      id: "calm-weekday",
      group: "weekday",
      icon: "leaf",
      tone: "success",
      score: 2.2,
      text:
        calm.bad === 0
          ? `${capitalize(weekday(calm.index, "accusative"))} вероятность срыва минимальна: из последних ${genitiveNumber(calm.active)} ${weekday(calm.index, "genitivePlural")} трудных не было ни разу.`
          : `${capitalize(weekday(calm.index, "accusative"))} срывы случаются реже всего: из последних ${genitiveNumber(calm.active)} ${weekday(calm.index, "genitivePlural")} трудный день выпал только ${count(calm.bad, TIME_FORMS)}.`,
    });
  }

  const walks = walkEffect(history);
  if (walks) {
    found.push({
      id: "walk-effect",
      group: "replacement",
      icon: "walk",
      tone: "success",
      score: 3.2,
      text:
        walks.slipsAfter === 0
          ? `За последние четыре недели было ${count(walks.walks, WALK_FORMS)} — и ни после одной в ближайшие три часа не случилось срыва.`
          : `После прогулок срывы почти не случаются: лишь ${walks.slipsAfter} из ${count(walks.walks, WALK_FORMS)} ${walks.slipsAfter % 10 === 1 && walks.slipsAfter % 100 !== 11 ? "закончилась" : "закончились"} лентой в ближайшие три часа.`,
    });
  }

  const replacements = replacementEffect(history);
  if (replacements && !walks) {
    const withRate = percent(replacements.withBad, replacements.withDays);
    const withoutRate = percent(replacements.withoutBad, replacements.withoutDays);
    found.push({
      id: "replacement-effect",
      group: "replacement",
      icon: "sparkles",
      tone: "success",
      score: 3,
      text:
        replacements.withBad === 0
          ? `В дни, когда ты делаешь хотя бы одну замену, срывов не было ни разу, а без замен трудными были ${withoutRate}% дней.`
          : `В дни с заменами трудных дней заметно меньше: ${withRate}% против ${withoutRate}% в остальные дни.`,
    });
  }

  const scroll = scrollTrend(history);
  const slips = slipTrend(history);
  if (scroll && scroll.change <= -15) {
    const steady = slips.recent <= slips.previous;
    found.push({
      id: "scroll-down",
      group: "trend",
      icon: "trending-down",
      tone: "success",
      score: 2.5 + Math.min(1.5, Math.abs(scroll.change) / 40) + (steady ? 0.3 : 0),
      text: steady
        ? `Последние две недели — устойчивый прогресс: лента занимает в среднем ${minutes(scroll.recent)} в день, на ${Math.abs(scroll.change)}% меньше, чем раньше, и срывов не прибавилось.`
        : `Последние две недели лента занимает в среднем ${minutes(scroll.recent)} в день — на ${Math.abs(scroll.change)}% меньше, чем две недели до этого.`,
    });
  } else if (scroll && scroll.change >= 20) {
    found.push({
      id: "scroll-up",
      group: "trend",
      icon: "trending-up",
      tone: "warning",
      score: 2.4 + Math.min(1.2, scroll.change / 50),
      text: `Последние две недели ленты стало больше: в среднем ${minutes(scroll.recent)} в день против ${minutes(scroll.previous)} раньше.`,
    });
  } else if (slips.previous >= 3 && slips.recent <= slips.previous / 2) {
    found.push({
      id: "slips-down",
      group: "trend",
      icon: "trending-down",
      tone: "success",
      score: 2.6,
      text: `Срывов стало заметно меньше: ${slips.recent} за последние две недели против ${slips.previous} перед этим.`,
    });
  } else if (slips.recent >= 4 && slips.recent >= slips.previous * 1.5) {
    found.push({
      id: "slips-up",
      group: "trend",
      icon: "trending-up",
      tone: "warning",
      score: 2.2,
      text: `За последние две недели срывов стало больше: ${slips.recent} против ${slips.previous} перед этим.`,
    });
  }

  const evening = eveningTrend(history);
  if (evening.previous >= 3 && evening.recent <= evening.previous * 0.7) {
    found.push({
      id: "evening-better",
      group: "memory",
      icon: "moon",
      tone: "success",
      score: 2.8,
      text: `Вечерняя привычка стала лучше, чем месяц назад: после 21:00 — ${count(evening.recent, SLIP_FORMS)} за месяц против ${evening.previous} месяцем раньше.`,
    });
  }

  const duration = durationTrend(history);
  if (duration && duration.change <= -25) {
    found.push({
      id: "shorter-slips",
      group: "trend",
      icon: "hourglass",
      tone: "success",
      score: 2,
      text: `Срывы стали короче: в среднем ${minutes(duration.recent)} против ${minutes(duration.previous)} двумя неделями раньше.`,
    });
  }

  const streak = streaks(history);
  if (streak.best >= 3 && streak.current >= 1 && streak.current < streak.best) {
    const gap = streak.best - streak.current;
    if (gap <= 3) {
      found.push({
        id: "streak-gap",
        group: "streak",
        icon: "flame",
        tone: "primary",
        score: 3.1 - gap * 0.2,
        text: `До твоего лучшего результата — ${count(streak.best, DAY_WORD_FORMS)} подряд — осталось ${count(gap, DAY_WORD_FORMS)}.`,
      });
    }
  } else if (streak.current >= 3 && streak.current === streak.best) {
    found.push({
      id: "streak-record",
      group: "streak",
      icon: "flame",
      tone: "primary",
      score: 3,
      text: `Сейчас идёт твоя самая длинная серия: ${count(streak.current, DAY_WORD_FORMS)} подряд в пределах лимита.`,
    });
  }

  // One insight per group, strongest first.
  const seen = new Set<Insight["group"]>();
  return found
    .sort((a, b) => b.score - a.score)
    .filter((insight) => {
      if (seen.has(insight.group)) return false;
      seen.add(insight.group);
      return true;
    });
}
