import { getLanguage, getLanguageInfo, m } from "../i18n";
import { addDays, formatDecimal, formatDurationWords, formatMinutesInline } from "../utils/date";
import { footprint, isActive, strength, votesByBelief, weight } from "./evidence";
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
  yearStats,
} from "./facts";
import type { AiAnalytics, AiChallenge, AiMemory, Belief, BeliefKind } from "./types";

/**
 * The AI tab's analytics: ChatGPT's conclusions from the long-term memory (situations, emotions,
 * dangerous periods, hypotheses, the coach's own corrections, the months of the user's story,
 * the overall conclusion) together with the numbers counted on the device (causes and their
 * shares, dangerous hours and weekdays, trends, comparisons with the user's own past, records,
 * saved time). The numbers are always current; the memory is refreshed by the rare deep analysis.
 *
 * What a later analysis concluded never rewrites an entry's own analysis (the user saw it that
 * day); it shows here — in "what changes", the long-term memory and the sections it feeds.
 */

/** A correction or a period that ended is news for this long, then it moves to the long-term memory. */
const FRESH_DAYS = 30;

const minutes = (value: number) => formatMinutesInline(value);
const percentChange = (from: number, to: number) =>
  from > 0 ? Math.round(((to - from) / from) * 100) : 0;
const unique = (lines: string[], limit: number) => [...new Set(lines)].slice(0, limit);
/** A model's sentence put inside a template: without its final period. */
const bare = (text: string) => text.trim().replace(/[\s.!?…]+$/u, "");

function capitalize(text: string) {
  let first = text.charAt(0);
  try {
    first = first.toLocaleUpperCase(getLanguageInfo(getLanguage()).locale);
  } catch {
    first = first.toUpperCase();
  }
  return first + text.slice(1);
}

const MONTH_KEY = /^(\d{4})-(\d{2})$/;
const DAY_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** "сентябрь 2026" from "2026-09". */
function monthLabel(key: string) {
  const match = MONTH_KEY.exec(key);
  return match ? m().ai.date.month(Number(match[2]) - 1, Number(match[1])) : key;
}

/** An event's date as written by the model: a day, a month, or free text. */
function eventDate(value: string, now: number) {
  const day = DAY_KEY.exec(value);
  if (day) {
    const year = Number(day[1]);
    return m().common.date.day(
      Number(day[3]),
      Number(day[2]) - 1,
      year === new Date(now).getFullYear() ? undefined : year,
    );
  }
  return monthLabel(value);
}

/** "март–май 2026" for a belief that held only for a while. */
function periodOf(since: string, until: string) {
  const from = MONTH_KEY.exec(since);
  const to = MONTH_KEY.exec(until);
  if (!from || !to) return `${since} – ${until}`;
  return m().ai.date.months(Number(from[2]) - 1, Number(from[1]), Number(to[2]) - 1, Number(to[1]));
}

/** Active beliefs of a kind, strongest first. */
function ranked(memory: AiMemory, t: Timeline, kind: BeliefKind): Belief[] {
  const votes = votesByBelief(t.input.entries);
  return (
    memory.beliefs
      .filter((belief) => belief.kind === kind && isActive(belief))
      .map((belief) => {
        const print = footprint(belief, t);
        return {
          belief,
          print,
          rank: weight(belief, strength(belief, votes.get(belief.id), print)),
        };
      })
      // The records themselves say a period or a trigger isn't real: don't show it as one.
      .filter((item) => item.print.verdict !== "failing")
      .sort((a, b) => b.rank - a.rank)
      .map((item) => item.belief)
  );
}

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
    .map(([name, value]) => ({
      title: capitalize(name),
      share: Math.round((value.count / counted.items) * 100),
      note: m().ai.analytics.causeNote(value.count, counted.items, dominantPart(value.hours)),
    }));
}

/** Changes over the last weeks, in numbers: slips, feed time, how often the user held on. */
function trends(t: Timeline) {
  const a = m().ai.analytics;
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
      improvements.push(a.slipsDown(recent, previous));
    } else if (recent > previous && (previous === 0 ? recent >= 3 : change >= 25)) {
      worsenings.push(a.slipsUp(recent, previous));
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
    const week = average(thisWeek)!;
    const before = average(weekBefore)!;
    const change = percentChange(before, week);
    if (before > 0 && change <= -15) improvements.push(a.feedDown(minutes(week), minutes(before)));
    if (before > 0 && change >= 15) worsenings.push(a.feedUp(minutes(week), minutes(before)));
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
    if (diff >= 0.2)
      improvements.push(a.heldMore(now.resisted, now.of, before.resisted, before.of));
    if (diff <= -0.2) worsenings.push(a.heldLess(now.resisted, now.of, before.resisted, before.of));
  }
  return { improvements, worsenings };
}

/** The user against their own past: this month vs the last, the last week vs a usual one. */
function selfComparison(t: Timeline) {
  const a = m().ai.analytics;
  const lines: string[] = [];
  const months = monthStats(t);
  const current = months[months.length - 1];
  const previous = months[months.length - 2];
  if (current && previous && current.observed >= 7 && previous.observed >= 7) {
    const calm = (month: typeof current) =>
      Math.round(((month.observed - month.hard) / month.observed) * 100);
    const now = calm(current);
    const before = calm(previous);
    lines.push(now === before ? a.calmSame(now) : a.calmVs(now, before));
  }
  const slipsSince = (days: number, until = 0) =>
    t.input.slips.filter(
      (slip) => slip.timestamp > t.now - days * DAY_MS && slip.timestamp <= t.now - until * DAY_MS,
    ).length;
  const observedMonth = observedSince(t, addDays(t.today, -35));
  if (observedMonth.length >= 14) {
    const usual = Math.round((slipsSince(35, 7) / 4) * 10) / 10;
    lines.push(a.weekVsUsual(slipsSince(7), formatDecimal(usual)));
  }
  const { current: streak, best } = streaks(t);
  if (best >= 3 && streak > 0) {
    lines.push(streak >= best ? a.streakRecord(streak) : a.streakBest(streak, best));
  }
  return lines.slice(0, 3);
}

/** What the records say changed over months and years. */
function monthsAndYears(t: Timeline) {
  const a = m().ai.analytics;
  const lines: string[] = [];
  const months = monthStats(t).filter((month) => month.observed >= 7);
  const latest = months[months.length - 1];
  const earlier = months.slice(0, -2);
  if (latest && earlier.length) {
    const old = [...earlier].reverse().find((month) => month.hardest !== null);
    if (old && latest.hardest !== null && old.hardest !== latest.hardest) {
      lines.push(a.hardestMoved(old.hardest!, latest.hardest));
    }
    const part = (month: typeof latest) => {
      const entries = Object.entries(month.byPart) as [PartOfDay, number][];
      const total = entries.reduce((sum, [, value]) => sum + value, 0);
      const top = entries.sort((x, y) => y[1] - x[1])[0]!;
      return total >= 4 && top[1] / total >= 0.5 ? top[0] : null;
    };
    const oldPart = earlier
      .map(part)
      .reverse()
      .find((value) => value !== null);
    const newPart = part(latest);
    if (oldPart && newPart && oldPart !== newPart) lines.push(a.partMoved(oldPart, newPart));
    const back = months.length >= 4 ? months[months.length - 4]! : null;
    if (back && back.avgFeed !== null && latest.avgFeed !== null && back.avgFeed > 0) {
      if (Math.abs(percentChange(back.avgFeed, latest.avgFeed)) >= 15) {
        lines.push(a.feedVsMonthsAgo(minutes(latest.avgFeed), minutes(back.avgFeed), 3));
      }
    }
  }
  // A year against the one before, once both have enough days.
  const years = yearStats(t).rows.filter((row) => row[1] >= 60 && row[2] !== null);
  const [before, year] = years.slice(-2);
  if (before && year && Math.abs(year[2]! - before[2]!) >= 5) {
    lines.push(a.years(Number(before[0]), before[2]!, Number(year[0]), year[2]!));
  }
  return lines;
}

function records(t: Timeline) {
  const a = m().ai.analytics;
  const lines: string[] = [];
  const { best } = streaks(t);
  if (best >= 3) lines.push(a.bestStreak(best));
  const slipTimes = t.input.slips.map((slip) => slip.timestamp).sort((x, y) => x - y);
  if (slipTimes.length >= 2) {
    let gap = t.now - slipTimes[slipTimes.length - 1]!;
    for (let index = 1; index < slipTimes.length; index += 1) {
      gap = Math.max(gap, slipTimes[index]! - slipTimes[index - 1]!);
    }
    const days = Math.floor(gap / DAY_MS);
    if (days >= 3) lines.push(a.longestCalm(days));
  }
  return lines;
}

const isFresh = (at: number, t: Timeline) => t.now - at < FRESH_DAYS * DAY_MS;

/** The coach corrected itself: what it thought, what it thinks now and why. */
const correctionLine = (item: AiMemory["corrections"][number]) =>
  m().ai.analytics.correction(bare(item.was), bare(item.now), item.why ? bare(item.why) : null);

/** Beliefs that were true only for a while (the habit changed), newest end first. */
const scoped = (memory: AiMemory) =>
  memory.beliefs
    .filter((belief) => belief.until !== null && belief.status !== "retired")
    .sort((a, b) => (a.until! < b.until! ? 1 : -1));

const scopedLine = (belief: Belief) =>
  m().ai.analytics.scoped(bare(belief.text), periodOf(belief.since, belief.until!));

/**
 * The long-term memory: the months of the user's story as the coach summed them up, the
 * conclusions it corrected and the patterns that ended, what the records show over months and
 * years, dated events and records. Fresh corrections show under "what changes" first.
 */
function longTerm(t: Timeline, memory: AiMemory) {
  const a = m().ai.analytics;
  const calm = new Map(
    monthStats(t)
      .filter((month) => month.observed >= 7)
      .map((month) => [
        month.month,
        Math.round(((month.observed - month.hard) / month.observed) * 100),
      ]),
  );
  const chapters = [...memory.chapters]
    .sort((x, y) => (x.month < y.month ? 1 : -1))
    .slice(0, 3)
    .map((chapter) =>
      a.chapter(
        capitalize(monthLabel(chapter.month)),
        chapter.note,
        calm.get(chapter.month) ?? null,
      ),
    );
  const corrections = [...memory.corrections]
    .filter((item) => !isFresh(item.at, t))
    .sort((x, y) => y.at - x.at)
    .slice(0, 2)
    .map(correctionLine);
  const ended = scoped(memory)
    .filter((belief) => !isFresh(belief.statusAt, t))
    .slice(0, 2)
    .map(scopedLine);
  const events = memory.events
    .slice(-3)
    .map((event) => a.event(capitalize(eventDate(event.date, t.now)), event.note));
  return unique(
    [...chapters, ...corrections, ...ended, ...monthsAndYears(t), ...events, ...records(t)],
    10,
  );
}

function savedTime(t: Timeline): AiAnalytics["numbers"] {
  const a = m().ai.analytics;
  const total = savedMinutes(t);
  if (total < 30) return null;
  const equivalents: string[] = [];
  const films = Math.round(total / 120);
  if (films >= 1) equivalents.push(a.films(films));
  const shifts = Math.floor(total / 480);
  if (shifts >= 1) equivalents.push(shifts === 1 ? a.oneShift : a.shifts(shifts));
  const walks = Math.floor(total / 30);
  if (walks >= 1) equivalents.push(a.walks(walks));
  equivalents.push(a.pages(Math.floor(total / 2)));
  return {
    headline: a.savedHeadline(formatDurationWords(total)),
    equivalents: equivalents.slice(0, 3),
  };
}

function dangerous(t: Timeline) {
  const a = m().ai.analytics;
  const times = [];
  const window = dangerWindow(urgeHours(t, 60), 0.3);
  if (window) {
    const pad = (hour: number) => `${String(((hour % 24) + 24) % 24).padStart(2, "0")}:00`;
    times.push({
      title: `${pad(window.from)}–${pad(window.to)}`,
      note: a.windowNote(window.count, window.total),
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
    .sort((x, y) => y.hard / y.observed - x.hard / x.observed)[0];
  if (hardest) {
    weekdays.push({
      title: a.weekdayTitle(hardest.index),
      note: a.weekdayNote(hardest.hard, hardest.observed, hardest.index),
    });
  }
  return { times, weekdays };
}

/** A pattern that is easy to miss: slipping right after a good run. */
function afterRuns(t: Timeline) {
  const runs = calmRuns(t).filter((run) => run.days >= 4 && run.hardNext3 !== null);
  const slipped = runs.filter((run) => run.hardNext3! > 0).length;
  return runs.length >= 2 && slipped / runs.length >= 0.5
    ? m().ai.analytics.afterRuns(slipped, runs.length)
    : null;
}

const CONFIDENCE = { proposed: "low", supported: "medium", established: "high" } as const;

export function buildAnalytics(t: Timeline, memory: AiMemory): AiAnalytics {
  const a = m().ai.analytics;
  const local = trends(t);
  const { times, weekdays } = dangerous(t);
  const relapse = afterRuns(t);
  const observedDays = t.all.filter(isObserved).length;
  const analyzed = t.input.entries.filter((entry) => entry.analysis !== null).length;
  const zones = ranked(memory, t, "zone");
  const triggers = ranked(memory, t, "trigger");
  const hypotheses = ranked(memory, t, "hypothesis").filter(
    (belief) => belief.status !== "weakened",
  );
  // What the coach revised lately is news: it shows with the other changes for a month.
  const fresh = [
    ...[...memory.corrections]
      .filter((item) => isFresh(item.at, t))
      .sort((x, y) => y.at - x.at)
      .slice(0, 2)
      .map(correctionLine),
    ...scoped(memory)
      .filter((belief) => isFresh(belief.statusAt, t))
      .slice(0, 1)
      .map(scopedLine),
  ];
  return {
    conclusion: memory.conclusion || memory.profile || a.conclusionPending,
    dataNote: observedDays < 14 ? a.fewDays : analyzed < 10 ? a.fewEntries : null,
    warnings: unique(
      [...zones.map((zone) => zone.note || zone.text), ...(relapse ? [relapse] : [])],
      3,
    ),
    improvements: unique([...local.improvements, ...memory.improvements], 4),
    worsenings: unique([...local.worsenings, ...memory.worsenings], 4),
    habitChanges: unique([...fresh, ...memory.changes], 5),
    causes: causes(t),
    situations: triggers.slice(0, 4).map((belief) => ({ title: belief.text, note: belief.note })),
    emotions: memory.emotions,
    times,
    weekdays,
    hypotheses: hypotheses.slice(0, 4).map((belief) => ({
      text: belief.text,
      confidence: CONFIDENCE[belief.status as keyof typeof CONFIDENCE] ?? "low",
    })),
    selfComparison: selfComparison(t),
    longTerm: longTerm(t, memory),
    numbers: savedTime(t),
  };
}

/**
 * The experiment's result in numbers: the days of the experiment against as many days right
 * before it. ChatGPT gets this result with the next deep analysis and draws conclusions from it.
 */
export function challengeReview(challenge: AiChallenge, t: Timeline): string {
  const r = m().ai.challenge.review;
  const measured = challengeMeasure(challenge, t);
  const checks = Object.values(challenge.checkins);
  const lines: string[] = [];
  if (checks.length) lines.push(r.managed(checks.filter(Boolean).length, challenge.durationDays));
  if (!measured || measured.during.observed === 0) {
    lines.push(r.noData);
    return lines.join(" ");
  }
  const { before, during, length } = measured;
  const change =
    before.losses > 0 && during.losses !== before.losses
      ? percentChange(before.losses, during.losses)
      : null;
  lines.push(r.losses(challenge.focus, during.losses, before.losses, length, change));
  if (before.avgFeed !== null && during.avgFeed !== null) {
    lines.push(r.feed(minutes(during.avgFeed), minutes(before.avgFeed)));
  }
  lines.push(
    before.observed < 2
      ? r.fewBefore
      : during.losses < before.losses
        ? r.helps
        : during.losses === before.losses
          ? r.same
          : r.worse,
  );
  return lines.join(" ");
}

/**
 * Did the experiment's tip help, by the records alone? Clearly fewer losses than right before —
 * yes; about as many or more — no; too little data or a small change — unknown (null).
 */
export function challengeHelped(challenge: AiChallenge, t: Timeline): boolean | null {
  // A tip the user mostly didn't manage to follow wasn't tested at all.
  const checks = Object.values(challenge.checkins);
  if (checks.length && checks.filter(Boolean).length / checks.length < 0.5) return null;
  const measured = challengeMeasure(challenge, t);
  if (!measured || measured.before.observed < 2 || measured.during.observed === 0) return null;
  const { before, during } = measured;
  if (before.losses === 0) return during.losses === 0 ? null : false;
  if (during.losses <= before.losses * 0.6) return true;
  if (during.losses >= before.losses * 0.9) return false;
  return null;
}
