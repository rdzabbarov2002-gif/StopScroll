import { getTrigger } from "../utils/catalog";
import { addDays, dayKey, parseDayKey, weekdayIndex } from "../utils/date";
import { getBestStreak, getCurrentStreak, isControlled, type ScrollLog } from "../utils/stats";
import type { Settings, SlipEntry, WinArchive, WinEntry } from "../utils/types";
import type { AiAnswer, AiChallenge, AiEntry, ChallengeFocus } from "./types";

/**
 * Arithmetic over the user's whole history, sent to ChatGPT with every analysis.
 *
 * Nothing here interprets anything: it only counts, sums and groups the records the user made
 * (by hour, weekday, week, month), so the model gets the entire history in a few kilobytes
 * instead of thousands of raw records, and doesn't have to count them itself. What the numbers
 * mean is decided by ChatGPT.
 */

/** Lists are newest first, as the app keeps them. */
export interface FactsInput {
  wins: readonly WinEntry[];
  winArchive: WinArchive;
  slips: readonly SlipEntry[];
  scrollLog: ScrollLog;
  settings: Settings;
  entries: readonly AiEntry[];
  answers: readonly AiAnswer[];
  challenge: AiChallenge | null;
  lastQuestionAt: number | null;
  lastChallengeAt: number | null;
  now: number;
}

export const WEEKDAYS = [
  "понедельник",
  "вторник",
  "среда",
  "четверг",
  "пятница",
  "суббота",
  "воскресенье",
] as const;

/** Questions at most every three days; an experiment at most once a week. */
export const QUESTION_COOLDOWN_DAYS = 3;
export const CHALLENGE_COOLDOWN_DAYS = 7;
/** Months of history summarized month by month. */
const MAX_MONTHS = 24;

const pad = (value: number) => String(value).padStart(2, "0");
export const clock = (timestamp: number) => {
  const date = new Date(timestamp);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
const hourOf = (timestamp: number) => new Date(timestamp).getHours();

export type PartOfDay = Exclude<ChallengeFocus, "all">;

export function partOfDay(hour: number): PartOfDay {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "day";
  if (hour >= 17 && hour < 23) return "evening";
  return "night";
}

interface Day {
  key: string;
  weekday: number;
  feed: number | null;
  slips: SlipEntry[];
  wins: number;
  savedMinutes: number;
  entries: AiEntry[];
}

const isHard = (day: Day, limit: number) =>
  day.slips.length > 0 ||
  (day.feed !== null && day.feed > limit) ||
  day.entries.some((entry) => entry.outcome === "opened");

const isObserved = (day: Day) =>
  day.feed !== null || day.slips.length > 0 || day.wins > 0 || day.entries.length > 0;

const average = (values: number[]) =>
  values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;

const share = (part: number, whole: number) => ({ part, of: whole });

/**
 * A fingerprint of the app's records (not of the date), to notice when analytics or the forecast
 * went stale: new or deleted slips and wins, a reason given, any feed time logged or changed.
 */
export function recordsKey(input: Pick<FactsInput, "wins" | "slips" | "scrollLog">) {
  const feed = Object.entries(input.scrollLog);
  return [
    input.slips.length,
    input.slips[0]?.timestamp ?? 0,
    input.slips.filter((slip) => slip.trigger !== null).length,
    input.wins.length,
    input.wins[0]?.timestamp ?? 0,
    feed.length,
    feed.reduce((sum, [key, minutes]) => sum + minutes * (Number(key.slice(-2)) + 1), 0),
  ].join("|");
}

export function buildFacts(input: FactsInput) {
  const { now, settings } = input;
  const limit = settings.dailyLimitMinutes;
  const today = dayKey(now);
  const hour = hourOf(now);

  // Every day from the first record to today.
  const firstTimestamps = [
    input.slips[input.slips.length - 1]?.timestamp,
    input.wins[input.wins.length - 1]?.timestamp,
    input.entries[input.entries.length - 1]?.timestamp,
  ].filter((value): value is number => value !== undefined);
  const firstLogged = Object.keys(input.scrollLog).sort()[0];
  const firstKeys = [...firstTimestamps.map((timestamp) => dayKey(timestamp)), firstLogged]
    .filter((key): key is string => Boolean(key))
    .sort();
  const firstDay = firstKeys[0] ?? today;
  const spanStart =
    firstDay < addDays(today, -(MAX_MONTHS * 31)) ? addDays(today, -(MAX_MONTHS * 31)) : firstDay;

  const days = new Map<string, Day>();
  for (let key = spanStart; key <= today; key = addDays(key, 1)) {
    days.set(key, {
      key,
      weekday: weekdayIndex(key),
      feed: input.scrollLog[key] ?? null,
      slips: [],
      wins: 0,
      savedMinutes: 0,
      entries: [],
    });
  }
  const dayOf = (timestamp: number) => days.get(dayKey(timestamp));

  const hours = { slips: Array(24).fill(0), entries: Array(24).fill(0), wins: Array(24).fill(0) };
  for (const slip of input.slips) {
    hours.slips[hourOf(slip.timestamp)] += 1;
    dayOf(slip.timestamp)?.slips.push(slip);
  }
  for (const win of input.wins) {
    hours.wins[hourOf(win.timestamp)] += 1;
    const day = dayOf(win.timestamp);
    if (day) {
      day.wins += 1;
      day.savedMinutes += win.minutesSaved;
    }
  }
  for (const entry of input.entries) {
    hours.entries[hourOf(entry.timestamp)] += 1;
    dayOf(entry.timestamp)?.entries.push(entry);
  }

  const all = [...days.values()];
  const past = all.filter((day) => day.key < today);
  const observedPast = past.filter(isObserved);
  const todayRecord = days.get(today)!;

  const weekdayStats = (list: Day[]) =>
    WEEKDAYS.map((name, index) => {
      const observed = list.filter((day) => day.weekday === index && isObserved(day));
      return {
        weekday: name,
        observedDays: observed.length,
        hardDays: observed.filter((day) => isHard(day, limit)).length,
        slips: observed.reduce((sum, day) => sum + day.slips.length, 0),
        entries: observed.reduce((sum, day) => sum + day.entries.length, 0),
        avgFeedMinutes: average(
          observed.filter((day) => day.feed !== null).map((day) => day.feed!),
        ),
      };
    });

  // Month by month, oldest first: for "half a year ago it was different".
  const monthKeys = [...new Set(observedPast.concat(todayRecord).map((day) => day.key.slice(0, 7)))]
    .sort()
    .slice(-MAX_MONTHS);
  const months = monthKeys.map((month) => {
    const list = all.filter((day) => day.key.startsWith(month) && isObserved(day));
    const slips = list.flatMap((day) => day.slips);
    const byPart = { morning: 0, day: 0, evening: 0, night: 0 };
    for (const slip of slips) byPart[partOfDay(hourOf(slip.timestamp))] += 1;
    const weekdays = weekdayStats(list);
    // The weekday with the highest share of hard days (at least two of them observed); a tie
    // means there is no single hardest day.
    const rated = weekdays
      .filter((day) => day.observedDays >= 2 && day.hardDays > 0)
      .map((day) => ({ day, rate: day.hardDays / day.observedDays }))
      .sort((a, b) => b.rate - a.rate);
    const hardest =
      rated[0] && (rated.length === 1 || rated[0].rate > rated[1]!.rate) ? rated[0].day : null;
    return {
      month,
      observedDays: list.length,
      hardDays: list.filter((day) => isHard(day, limit)).length,
      slips: slips.length,
      slipsByPartOfDay: byPart,
      entries: list.reduce((sum, day) => sum + day.entries.length, 0),
      wins: list.reduce((sum, day) => sum + day.wins, 0),
      avgFeedMinutes: average(list.filter((day) => day.feed !== null).map((day) => day.feed!)),
      hardestWeekday: hardest?.weekday ?? null,
    };
  });

  // The last eight weeks, Monday to Sunday.
  const thisMonday = addDays(today, -weekdayIndex(today));
  const weeks = Array.from({ length: 8 }, (_, index) => {
    const monday = addDays(thisMonday, -7 * (7 - index));
    const list = Array.from({ length: 7 }, (__, offset) =>
      days.get(addDays(monday, offset)),
    ).filter((day): day is Day => day !== undefined);
    const logged = list.filter((day) => day.feed !== null);
    return {
      week: monday,
      slips: list.reduce((sum, day) => sum + day.slips.length, 0),
      entries: list.reduce((sum, day) => sum + day.entries.length, 0),
      wins: list.reduce((sum, day) => sum + day.wins, 0),
      hardDays: list.filter((day) => isObserved(day) && isHard(day, limit)).length,
      loggedDays: logged.length,
      daysInLimit: logged.filter((day) => isControlled(day.feed ?? undefined, limit)).length,
      avgFeedMinutes: average(logged.map((day) => day.feed!)),
    };
  }).filter((week) => week.slips + week.entries + week.wins + week.loggedDays > 0);

  // Runs of days within the limit, and what happened in the three days after each.
  type Run = { start: string; end: string; days: number; hardDaysInNext3: number | null };
  const runs: Run[] = [];
  let open: Run | undefined;
  for (const day of all) {
    if (isControlled(day.feed ?? undefined, limit) && day.slips.length === 0) {
      if (open) {
        open.end = day.key;
        open.days += 1;
      } else {
        open = { start: day.key, end: day.key, days: 1, hardDaysInNext3: null };
      }
    } else if (open) {
      if (open.days >= 3) runs.push(open);
      open = undefined;
    }
  }
  if (open && open.days >= 3) runs.push(open);
  for (const item of runs) {
    const next = [1, 2, 3].map((offset) => days.get(addDays(item.end, offset)));
    item.hardDaysInNext3 =
      item.end >= addDays(today, -3)
        ? null
        : next.filter((day): day is Day => day !== undefined && isHard(day, limit)).length;
  }

  // Causes: ChatGPT's tags from the entries, and the reasons chosen in the journal.
  const since30 = now - 30 * 86_400_000;
  const tagCounts = new Map<string, { count: number; last30: number }>();
  for (const entry of input.entries) {
    for (const tag of entry.analysis?.tags ?? []) {
      const current = tagCounts.get(tag) ?? { count: 0, last30: 0 };
      current.count += 1;
      if (entry.timestamp >= since30) current.last30 += 1;
      tagCounts.set(tag, current);
    }
  }
  const reasonCounts = new Map<string, { count: number; last30: number }>();
  for (const slip of input.slips) {
    if (!slip.trigger) continue;
    const label = getTrigger(slip.trigger).noun;
    const current = reasonCounts.get(label) ?? { count: 0, last30: 0 };
    current.count += 1;
    if (slip.timestamp >= since30) current.last30 += 1;
    reasonCounts.set(label, current);
  }
  const top = (map: Map<string, { count: number; last30: number }>, size: number) =>
    [...map.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, size)
      .map(([name, value]) => ({ name, ...value }));

  // Base rates for today's forecast.
  const sameWeekday = observedPast.filter((day) => day.weekday === todayRecord.weekday).slice(-8);
  const last28 = observedPast.filter((day) => day.key >= addDays(today, -28));
  const lateHard = (day: Day) =>
    day.slips.some((slip) => hourOf(slip.timestamp) >= hour) ||
    day.entries.some((entry) => entry.outcome === "opened" && hourOf(entry.timestamp) >= hour);
  const afterHard = observedPast.filter((day) => {
    const before = days.get(addDays(day.key, -1));
    return before !== undefined && isObserved(before) && isHard(before, limit);
  });
  const yesterday = days.get(addDays(today, -1));

  const savedSince = (from: string) =>
    all.filter((day) => day.key >= from).reduce((sum, day) => sum + day.savedMinutes, 0);

  const daysSince = (timestamp: number | null) =>
    timestamp === null ? null : Math.floor((now - timestamp) / 86_400_000);
  const questionDays = daysSince(input.lastQuestionAt);
  const challengeDays = daysSince(input.lastChallengeAt);

  return {
    now: {
      date: today,
      weekday: WEEKDAYS[todayRecord.weekday],
      time: clock(now),
    },
    settings: {
      dailyLimitMinutes: limit,
      sessionMinutes: settings.sessionMinutes,
      mainApp: settings.mainApp,
    },
    coverage: {
      firstRecordDay: firstDay,
      observedDays: observedPast.length + (isObserved(todayRecord) ? 1 : 0),
      entries: input.entries.length,
      slips: input.slips.length,
      wins: input.wins.length + input.winArchive.count,
    },
    today: {
      feedMinutes: todayRecord.feed,
      overLimit: todayRecord.feed !== null && todayRecord.feed > limit,
      slipsAt: todayRecord.slips.map((slip) => clock(slip.timestamp)).sort(),
      wins: todayRecord.wins,
      entries: todayRecord.entries.map((entry) => ({
        time: clock(entry.timestamp),
        outcome: entry.outcome,
        cause: entry.analysis?.cause ?? null,
      })),
    },
    recentDays: past.slice(-14).map((day) => ({
      date: day.key,
      weekday: WEEKDAYS[day.weekday],
      feedMinutes: day.feed,
      slipsAt: day.slips.map((slip) => clock(slip.timestamp)).sort(),
      wins: day.wins,
      entries: day.entries.length,
      hard: isObserved(day) ? isHard(day, limit) : null,
    })),
    byHour: hours,
    byWeekday: { allTime: weekdayStats(past), last8Weeks: weekdayStats(past.slice(-56)) },
    months,
    weeks,
    streaks: {
      current: getCurrentStreak(input.scrollLog, limit, today),
      best: getBestStreak(input.scrollLog, limit),
      runs: runs.slice(-10),
    },
    causes: { entryTags: top(tagCounts, 20), journalReasons: top(reasonCounts, 10) },
    savedMinutes: {
      today: todayRecord.savedMinutes,
      last7Days: savedSince(addDays(today, -6)),
      last30Days: savedSince(addDays(today, -29)),
      total: input.wins.reduce((sum, win) => sum + win.minutesSaved, 0) + input.winArchive.minutes,
    },
    baseRates: {
      sameWeekdayHard: share(
        sameWeekday.filter((day) => isHard(day, limit)).length,
        sameWeekday.length,
      ),
      afterThisHourHard: share(last28.filter(lateHard).length, last28.length),
      hardAfterHardDay: share(
        afterHard.filter((day) => isHard(day, limit)).length,
        afterHard.length,
      ),
      yesterdayHard: yesterday && isObserved(yesterday) ? isHard(yesterday, limit) : null,
      hardDaysOfLast3: past.slice(-3).filter((day) => isObserved(day) && isHard(day, limit)).length,
    },
    answers: input.answers.slice(0, 10).map((answer) => ({
      date: dayKey(answer.answeredAt),
      question: answer.question,
      answer: answer.answer,
    })),
    challenge: input.challenge ? challengeFacts(input.challenge, days, limit, today) : null,
    questionPolicy: {
      allowed: questionDays === null || questionDays >= QUESTION_COOLDOWN_DAYS,
      daysSinceLast: questionDays,
    },
    challengePolicy: {
      canPropose:
        (input.challenge === null ||
          input.challenge.status === "done" ||
          input.challenge.status === "declined") &&
        (challengeDays === null || challengeDays >= CHALLENGE_COOLDOWN_DAYS),
      daysSinceLast: challengeDays,
    },
  };
}

export type Facts = ReturnType<typeof buildFacts>;

/** The experiment's window against the same number of days right before it. */
function challengeFacts(
  challenge: AiChallenge,
  days: Map<string, Day>,
  limit: number,
  today: string,
) {
  const base = {
    title: challenge.title,
    description: challenge.description,
    status: challenge.status,
    focus: challenge.focus,
    startDay: challenge.startDay,
    startedAt: challenge.startedAt === null ? null : clock(challenge.startedAt),
    endDay: challenge.endDay,
    checkins: challenge.checkins,
  };
  if (!challenge.startDay || !challenge.endDay) return base;
  const length =
    Math.round(
      (parseDayKey(challenge.endDay).getTime() - parseDayKey(challenge.startDay).getTime()) /
        86_400_000,
    ) + 1;
  // `after` cuts the first day at the moment of acceptance: what happened earlier doesn't count.
  const measure = (from: string, after = 0) => {
    const list = Array.from({ length }, (_, offset) => days.get(addDays(from, offset))).filter(
      (day): day is Day => day !== undefined && day.key <= today,
    );
    const counts = (timestamp: number) =>
      timestamp >= after &&
      (challenge.focus === "all" || partOfDay(hourOf(timestamp)) === challenge.focus);
    const slips = list.flatMap((day) => day.slips).filter((slip) => counts(slip.timestamp));
    const entries = list.flatMap((day) => day.entries).filter((entry) => counts(entry.timestamp));
    const hard = (day: Day) =>
      day.slips.some((slip) => slip.timestamp >= after) ||
      day.entries.some((entry) => entry.outcome === "opened" && entry.timestamp >= after) ||
      // A day's feed total can't be split by time, so the first, partial day leaves it out.
      (day.key !== from || after === 0 ? day.feed !== null && day.feed > limit : false);
    return {
      from,
      days: list.length,
      slipsInFocus: slips.length,
      minutesLostInFocus: slips.reduce((sum, slip) => sum + slip.minutesLost, 0),
      entriesInFocus: entries.length,
      openedInFocus: entries.filter((entry) => entry.outcome === "opened").length,
      hardDays: list.filter((day) => isObserved(day) && hard(day)).length,
      avgFeedMinutes: average(list.filter((day) => day.feed !== null).map((day) => day.feed!)),
    };
  };
  return {
    ...base,
    before: measure(addDays(challenge.startDay, -length)),
    during: measure(challenge.startDay, challenge.startedAt ?? 0),
  };
}
