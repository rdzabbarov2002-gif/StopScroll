import {
  DAY_WORD_FORMS,
  SLIP_FORMS,
  TIME_FORMS,
  WALK_FORMS,
  capitalize,
  count,
  genitiveNumber,
  minutes,
  clock as hourClock,
  percentChange,
  weekday,
} from "../coach/language";
import { addDays, formatDurationWords, pluralize } from "../utils/date";
import {
  DAY_MS,
  type PartOfDay,
  type Timeline,
  average,
  calmRuns,
  causeCounts,
  challengeMeasure,
  dangerWindow,
  isObserved,
  monthStats,
  observedSince,
  partOfDay,
  savedMinutes,
  streaks,
  urgeHours,
  weekdayRates,
} from "./facts";
import type { AiAnalytics, AiChallenge, AiMemory } from "./types";

/**
 * The AI tab's analytics: ChatGPT's conclusions from the long-term memory (situations, emotions,
 * dangerous periods, hypotheses, long-run changes, the overall conclusion) together with the
 * numbers counted on the device (causes and their shares, dangerous hours and weekdays, trends,
 * comparisons with the user's own past, records, saved time). The numbers are always current;
 * the memory is refreshed by the rare deep analysis and, between them, by each entry's votes.
 */

const ADVERB: Record<PartOfDay, string> = {
  morning: "утром",
  day: "днём",
  evening: "вечером",
  night: "ночью",
};
const MONTH_FORMS = ["месяц", "месяца", "месяцев"] as const;
const FILM_FORMS = ["фильм", "фильма", "фильмов"] as const;
const PAGE_FORMS = ["страница", "страницы", "страниц"] as const;
const SHIFT_FORMS = ["рабочая смена", "рабочие смены", "рабочих смен"] as const;
const CASE_FORMS = ["случай", "случая", "случаев"] as const;

const unique = (lines: string[], limit: number) => [...new Set(lines)].slice(0, limit);

/** The part of the day that holds at least half of the hours, if any. */
function dominantPart(hours: readonly number[]): PartOfDay | null {
  const counts = new Map<PartOfDay, number>();
  for (const hour of hours) counts.set(partOfDay(hour), (counts.get(partOfDay(hour)) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return top && hours.length >= 2 && top[1] / hours.length >= 0.5 ? top[0] : null;
}

function causes(t: Timeline) {
  let counted = causeCounts(t, 90);
  if (counted.items < 5) counted = causeCounts(t);
  if (counted.items < 3) return [];
  return counted.causes
    .filter(([, value]) => value.count >= 2)
    .slice(0, 5)
    .map(([name, value]) => {
      const part = dominantPart(value.hours);
      return {
        title: capitalize(name),
        share: Math.round((value.count / counted.items) * 100),
        note: `${value.count} из ${count(counted.items, CASE_FORMS)}${part ? `, чаще всего ${ADVERB[part]}` : ""}`,
      };
    });
}

/** Changes over the last weeks, in numbers: slips, feed time, how often the user held on. */
function trends(t: Timeline) {
  const improvements: string[] = [];
  const worsenings: string[] = [];
  const slipsBetween = (fromDays: number, toDays: number) =>
    t.input.slips.filter(
      (slip) =>
        slip.timestamp > t.now - fromDays * DAY_MS && slip.timestamp <= t.now - toDays * DAY_MS,
    ).length;
  const recent = slipsBetween(14, 0);
  const previous = slipsBetween(28, 14);
  if (recent + previous >= 4) {
    const change = percentChange(previous, recent);
    if (previous > 0 && change <= -25) {
      improvements.push(
        `За две недели срывов стало меньше: ${recent} против ${previous} в предыдущие две.`,
      );
    } else if (recent > previous && (previous === 0 ? recent >= 3 : change >= 25)) {
      worsenings.push(
        `За две недели срывов стало больше: ${recent} против ${previous} в предыдущие две.`,
      );
    }
  }

  const feedOf = (from: number, to: number) =>
    t.past
      .filter((day) => day.key >= addDays(t.today, -from) && day.key < addDays(t.today, -to))
      .filter((day) => day.feed !== null)
      .map((day) => day.feed!);
  const thisWeek = feedOf(7, 0);
  const weekBefore = feedOf(14, 7);
  if (thisWeek.length >= 3 && weekBefore.length >= 3) {
    const a = average(thisWeek)!;
    const b = average(weekBefore)!;
    const change = percentChange(b, a);
    const line = `в среднем ${minutes(a)} в день за неделю против ${minutes(b)} неделей раньше.`;
    if (b > 0 && change <= -15) improvements.push(`В ленте стало меньше времени: ${line}`);
    if (b > 0 && change >= 15) worsenings.push(`В ленте стало больше времени: ${line}`);
  }

  const held = (fromDays: number, toDays: number) => {
    const list = t.input.entries.filter(
      (entry) =>
        entry.outcome !== null &&
        entry.timestamp > t.now - fromDays * DAY_MS &&
        entry.timestamp <= t.now - toDays * DAY_MS,
    );
    return {
      resisted: list.filter((entry) => entry.outcome === "resisted").length,
      of: list.length,
    };
  };
  const now = held(14, 0);
  const before = held(28, 14);
  if (now.of >= 4 && before.of >= 4) {
    const diff = now.resisted / now.of - before.resisted / before.of;
    const line = `${now.resisted} из ${now.of} записей за две недели против ${before.resisted} из ${before.of} раньше.`;
    if (diff >= 0.2) improvements.push(`Вы чаще удерживаетесь: ${line}`);
    if (diff <= -0.2) worsenings.push(`Удерживаться стало труднее: ${line}`);
  }
  return { improvements, worsenings };
}

/** The user against their own past: this month vs the last, the last week vs a usual one. */
function selfComparison(t: Timeline) {
  const lines: string[] = [];
  const months = monthStats(t);
  const current = months[months.length - 1];
  const previous = months[months.length - 2];
  if (current && previous && current.observed >= 7 && previous.observed >= 7) {
    const calm = (month: typeof current) =>
      Math.round(((month.observed - month.hard) / month.observed) * 100);
    const a = calm(current);
    const b = calm(previous);
    lines.push(
      a === b
        ? `Спокойных дней в этом месяце столько же, сколько в прошлом: ${a}%.`
        : `В этом месяце спокойных дней ${a}% против ${b}% в прошлом.`,
    );
  }
  const slipsSince = (days: number, until = 0) =>
    t.input.slips.filter(
      (slip) => slip.timestamp > t.now - days * DAY_MS && slip.timestamp <= t.now - until * DAY_MS,
    ).length;
  const observedMonth = observedSince(t, addDays(t.today, -35));
  if (observedMonth.length >= 14) {
    const week = slipsSince(7);
    const usual = Math.round((slipsSince(35, 7) / 4) * 10) / 10;
    lines.push(
      `За последние 7 дней — ${count(week, SLIP_FORMS)}; в прошлом месяце в среднем было ${String(usual).replace(".", ",")} в неделю.`,
    );
  }
  const { current: streak, best } = streaks(t);
  if (best >= 3 && streak > 0) {
    lines.push(
      streak >= best
        ? `Текущая серия — ${count(streak, DAY_WORD_FORMS)}, это ваш рекорд.`
        : `Текущая серия — ${count(streak, DAY_WORD_FORMS)}, лучшая — ${count(best, DAY_WORD_FORMS)}.`,
    );
  }
  return lines.slice(0, 3);
}

/** What changed over months, the memory's dated events and the records. */
function longTerm(t: Timeline, memory: AiMemory) {
  const lines: string[] = [];
  const months = monthStats(t).filter((month) => month.observed >= 7);
  const latest = months[months.length - 1];
  const earlier = months.slice(0, -2);
  if (latest && earlier.length) {
    const old = [...earlier].reverse().find((month) => month.hardest !== null);
    if (old && latest.hardest !== null && old.hardest !== latest.hardest) {
      lines.push(
        `Самый трудный день недели раньше — ${weekday(old.hardest!, "nominative")}, сейчас — ${weekday(latest.hardest, "nominative")}.`,
      );
    }
    const part = (month: typeof latest) => {
      const entries = Object.entries(month.byPart) as [PartOfDay, number][];
      const total = entries.reduce((sum, [, value]) => sum + value, 0);
      const top = entries.sort((a, b) => b[1] - a[1])[0]!;
      return total >= 4 && top[1] / total >= 0.5 ? top[0] : null;
    };
    const oldPart = earlier
      .map(part)
      .reverse()
      .find((value) => value !== null);
    const newPart = part(latest);
    if (oldPart && newPart && oldPart !== newPart) {
      lines.push(`Срывы сместились: раньше чаще ${ADVERB[oldPart]}, сейчас — ${ADVERB[newPart]}.`);
    }
    const back = months.length >= 4 ? months[months.length - 4]! : null;
    if (back && back.avgFeed !== null && latest.avgFeed !== null && back.avgFeed > 0) {
      const change = percentChange(back.avgFeed, latest.avgFeed);
      if (Math.abs(change) >= 15) {
        lines.push(
          `Среднее время в ленте — ${minutes(latest.avgFeed)} в день против ${minutes(back.avgFeed)} ${count(3, MONTH_FORMS)} назад.`,
        );
      }
    }
  }
  for (const event of memory.events.slice(-4)) lines.push(`${event.date}: ${event.note}`);

  const { best } = streaks(t);
  if (best >= 3) lines.push(`Лучшая серия — ${count(best, DAY_WORD_FORMS)} в пределах лимита.`);
  const slipTimes = t.input.slips.map((slip) => slip.timestamp).sort((a, b) => a - b);
  if (slipTimes.length >= 2) {
    let gap = t.now - slipTimes[slipTimes.length - 1]!;
    for (let index = 1; index < slipTimes.length; index += 1) {
      gap = Math.max(gap, slipTimes[index]! - slipTimes[index - 1]!);
    }
    const days = Math.floor(gap / DAY_MS);
    if (days >= 3) lines.push(`Самый долгий период без срывов — ${count(days, DAY_WORD_FORMS)}.`);
  }
  return lines.slice(0, 7);
}

function savedTime(t: Timeline): AiAnalytics["numbers"] {
  const total = savedMinutes(t);
  if (total < 30) return null;
  const equivalents: string[] = [];
  const films = Math.round(total / 120);
  if (films >= 1) equivalents.push(`около ${count(films, FILM_FORMS)}`);
  const shifts = Math.floor(total / 480);
  if (shifts >= 1) {
    equivalents.push(shifts === 1 ? "целая рабочая смена" : count(shifts, SHIFT_FORMS));
  }
  const walks = Math.floor(total / 30);
  if (walks >= 1) equivalents.push(`${count(walks, WALK_FORMS)} по 30 минут`);
  const pages = Math.floor(total / 2);
  equivalents.push(`${count(pages, PAGE_FORMS)} книги`);
  return {
    headline: `Вы вернули себе ${formatDurationWords(total)}.`,
    equivalents: equivalents.slice(0, 3),
  };
}

function dangerous(t: Timeline) {
  const times = [];
  const window = dangerWindow(urgeHours(t, 60), 0.3);
  if (window) {
    times.push({
      title: `${hourClock(window.from)}–${hourClock(window.to)}`,
      note: `Здесь ${window.count} из ${window.total} срывов и записей за два месяца.`,
    });
  }
  const weekdays = [];
  const rates = weekdayRates(t, t.past.slice(-56));
  const observed = rates.reduce((sum, day) => sum + day.observed, 0);
  const overall = observed ? rates.reduce((sum, day) => sum + day.hard, 0) / observed : 0;
  const hardest = rates
    .filter(
      (day) =>
        day.observed >= 3 &&
        day.hard / day.observed >= 0.5 &&
        day.hard / day.observed - overall >= 0.15,
    )
    .sort((a, b) => b.hard / b.observed - a.hard / a.observed)[0];
  if (hardest) {
    weekdays.push({
      title: capitalize(weekday(hardest.index, "nominative")),
      note: `Трудными были ${hardest.hard} из последних ${genitiveNumber(hardest.observed)} ${weekday(hardest.index, "genitivePlural")}.`,
    });
  }
  return { times, weekdays };
}

/** A pattern that is easy to miss: slipping right after a good run. */
function afterRuns(t: Timeline) {
  const runs = calmRuns(t).filter((run) => run.days >= 4 && run.hardNext3 !== null);
  const slipped = runs.filter((run) => run.hardNext3! > 0).length;
  return runs.length >= 2 && slipped / runs.length >= 0.5
    ? `После спокойных серий от 4 дней трудный день в ближайшие три дня случался ${slipped} ${pluralize(slipped, TIME_FORMS)} из ${runs.length}.`
    : null;
}

export function buildAnalytics(t: Timeline, memory: AiMemory): AiAnalytics {
  const local = trends(t);
  const { times, weekdays } = dangerous(t);
  const relapse = afterRuns(t);
  const observedDays = t.all.filter(isObserved).length;
  const analyzed = t.input.entries.filter((entry) => entry.analysis !== null).length;
  return {
    conclusion:
      memory.conclusion || memory.profile || "Выводы появятся после следующего анализа истории.",
    dataNote:
      observedDays < 14
        ? "Данных пока немного — выводы станут точнее через пару недель."
        : analyzed < 10
          ? "Записей пока немного: причины и ситуации станут точнее, когда их будет больше."
          : null,
    warnings: unique(
      [...memory.dangerZones.map((zone) => zone.note || zone.title), ...(relapse ? [relapse] : [])],
      3,
    ),
    improvements: unique([...local.improvements, ...memory.improvements], 4),
    worsenings: unique([...local.worsenings, ...memory.worsenings], 4),
    habitChanges: memory.changes.slice(0, 4),
    causes: causes(t),
    situations: memory.triggers,
    emotions: memory.emotions,
    times,
    weekdays,
    hypotheses: memory.hypotheses
      .filter((item) => item.status !== "weakened")
      .slice(0, 4)
      .map((item) => ({
        text: item.text,
        confidence:
          item.status === "proposed"
            ? "low"
            : item.support >= 5 && item.support >= 3 * Math.max(1, item.against)
              ? "high"
              : "medium",
      })),
    selfComparison: selfComparison(t),
    longTerm: longTerm(t, memory),
    numbers: savedTime(t),
  };
}

const FOCUS_IN: Record<AiChallenge["focus"], string> = {
  morning: " утром",
  day: " днём",
  evening: " вечером",
  night: " ночью",
  all: "",
};
const LOSS_FORMS = ["раз", "раза", "раз"] as const;

/**
 * The experiment's result in numbers: the days of the experiment against as many days right
 * before it. ChatGPT gets this result with the next deep analysis and draws conclusions from it.
 */
export function challengeReview(challenge: AiChallenge, t: Timeline): string {
  const measured = challengeMeasure(challenge, t);
  const checks = Object.values(challenge.checkins);
  const managed = checks.filter(Boolean).length;
  const lines: string[] = [];
  if (checks.length) {
    lines.push(`Получилось ${count(managed, DAY_WORD_FORMS)} из ${challenge.durationDays}.`);
  }
  if (!measured || measured.during.observed === 0) {
    lines.push("Записей за дни эксперимента нет, поэтому сравнить пока не с чем.");
    return lines.join(" ");
  }
  const { before, during, length } = measured;
  const span = count(length, DAY_WORD_FORMS);
  lines.push(
    `Лента побеждала${FOCUS_IN[challenge.focus]} ${count(during.losses, LOSS_FORMS)} за ${span} эксперимента против ${count(before.losses, LOSS_FORMS)} за ${span} до него${
      before.losses > 0 && during.losses !== before.losses
        ? ` (${percentChange(before.losses, during.losses) > 0 ? "+" : "−"}${Math.abs(percentChange(before.losses, during.losses))}%)`
        : ""
    }.`,
  );
  if (before.avgFeed !== null && during.avgFeed !== null) {
    lines.push(
      `Время в ленте — в среднем ${minutes(during.avgFeed)} в день против ${minutes(before.avgFeed)}.`,
    );
  }
  lines.push(
    before.observed < 2
      ? "Данных до эксперимента мало, поэтому сравнение предварительное."
      : during.losses < before.losses
        ? "Похоже, это помогает — подход стоит оставить."
        : during.losses === before.losses
          ? "Разницы пока не видно — возможно, нужно больше дней."
          : "В эти дни было не легче — значит, дело, скорее всего, в другом.",
  );
  return lines.join(" ");
}
