import { MS_PER_DAY, addDays, dayKey, parseDayKey, weekdayIndex } from "../utils/date";
import type { ScrollLog } from "../utils/stats";
import type { CoachLogEntry, Settings, SlipEntry, WinEntry } from "../utils/types";

/** Everything the coach looks at — the user's own records, nothing made up. */
export interface CoachInput {
  wins: readonly WinEntry[];
  slips: readonly SlipEntry[];
  scrollLog: ScrollLog;
  settings: Settings;
  coachLog: readonly CoachLogEntry[];
  now: number;
}

export interface DayRecord {
  key: string;
  /** Monday = 0. */
  weekday: number;
  /** Logged feed minutes, null when the day wasn't logged. */
  scroll: number | null;
  slips: SlipEntry[];
  wins: WinEntry[];
  replacements: number;
  /** Within the limit; null when the day wasn't logged. */
  controlled: boolean | null;
  /** Anything recorded that day. */
  active: boolean;
  /** A slip or more feed time than the limit. */
  bad: boolean;
}

export interface History {
  now: number;
  todayKey: string;
  hour: number;
  settings: Settings;
  /** The last WINDOW_DAYS days, oldest first, today last. */
  days: DayRecord[];
  byKey: ReadonlyMap<string, DayRecord>;
  /** Records of the last RECORD_DAYS days, oldest first. */
  slips: SlipEntry[];
  wins: WinEntry[];
  /** Slip timestamps, ascending — for "was there a slip soon after…" lookups. */
  slipTimes: number[];
  scrollLog: ScrollLog;
  coachLog: readonly CoachLogEntry[];
}

/** Eight weeks: long enough for weekday patterns, short enough to stay current. */
export const WINDOW_DAYS = 56;
/** Records kept for comparisons that reach further back (30 days against the 30 before). */
const RECORD_DAYS = 64;

export function buildHistory(input: CoachInput): History {
  const todayKey = dayKey(input.now);
  const limit = input.settings.dailyLimitMinutes;
  const firstKey = addDays(todayKey, -(WINDOW_DAYS - 1));

  const days: DayRecord[] = Array.from({ length: WINDOW_DAYS }, (_, index) => {
    const key = addDays(firstKey, index);
    const scroll = input.scrollLog[key] ?? null;
    return {
      key,
      weekday: weekdayIndex(key),
      scroll,
      slips: [],
      wins: [],
      replacements: 0,
      controlled: scroll === null ? null : scroll <= limit,
      active: scroll !== null,
      bad: scroll !== null && scroll > limit,
    };
  });
  const byKey = new Map(days.map((day) => [day.key, day]));

  // Only what the coach looks at: older records would cost time on every render and change nothing.
  const since = Math.min(parseDayKey(firstKey).getTime(), input.now - RECORD_DAYS * MS_PER_DAY);
  const slips = input.slips
    .filter((slip) => slip.timestamp >= since)
    .sort((a, b) => a.timestamp - b.timestamp);
  const wins = input.wins
    .filter((win) => win.timestamp >= since)
    .sort((a, b) => a.timestamp - b.timestamp);
  // Both lists are sorted, so each record finds its day by walking local midnights forward.
  const starts = days.map((day) => parseDayKey(day.key).getTime());
  starts.push(parseDayKey(addDays(todayKey, 1)).getTime());
  const place = <T extends { timestamp: number }>(
    items: T[],
    add: (day: DayRecord, item: T) => void,
  ) => {
    let index = 0;
    for (const item of items) {
      if (item.timestamp < starts[0]! || item.timestamp >= starts[WINDOW_DAYS]!) continue;
      while (item.timestamp >= starts[index + 1]!) index += 1;
      add(days[index]!, item);
    }
  };
  place(slips, (day, slip) => {
    day.slips.push(slip);
    day.active = true;
    day.bad = true;
  });
  place(wins, (day, win) => {
    day.wins.push(win);
    day.active = true;
    if (win.source === "replacement") day.replacements += 1;
  });

  return {
    now: input.now,
    todayKey,
    hour: new Date(input.now).getHours(),
    settings: input.settings,
    days,
    byKey,
    slips,
    wins,
    slipTimes: slips.map((slip) => slip.timestamp),
    scrollLog: input.scrollLog,
    coachLog: input.coachLog,
  };
}

/** The last `count` days ending `offset` days before today (offset 0 includes today). */
export function lastDays(history: History, count: number, offset = 0): DayRecord[] {
  const end = history.days.length - offset;
  return history.days.slice(Math.max(0, end - count), end);
}

/** Slips in the last `days` × 24 hours. */
export function slipsWithin(history: History, days: number, offsetDays = 0): SlipEntry[] {
  const to = history.now - offsetDays * MS_PER_DAY;
  const from = to - days * MS_PER_DAY;
  return history.slips.filter((slip) => slip.timestamp > from && slip.timestamp <= to);
}

export function winsWithin(history: History, days: number, offsetDays = 0): WinEntry[] {
  const to = history.now - offsetDays * MS_PER_DAY;
  const from = to - days * MS_PER_DAY;
  return history.wins.filter((win) => win.timestamp > from && win.timestamp <= to);
}

/** Whether a slip came within `ms` after `timestamp` (binary search over the sorted slips). */
export function slipSoonAfter(history: History, timestamp: number, ms: number): boolean {
  const times = history.slipTimes;
  let low = 0;
  let high = times.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if (times[middle]! <= timestamp) low = middle + 1;
    else high = middle;
  }
  return low < times.length && times[low]! - timestamp <= ms;
}

/** Days with anything recorded among the last `days`. */
export const activeDayCount = (history: History, days: number) =>
  lastDays(history, days).filter((day) => day.active).length;

export const hourOf = (timestamp: number) => new Date(timestamp).getHours();

/** Late evening counts past midnight: 1 a.m. belongs to the evening that began before it. */
export const isLate = (hour: number, from: number) => hour >= from || hour < 4;
