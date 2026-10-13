import { getFeedApp } from "./catalog";
import { MS_PER_DAY, MS_PER_HOUR, addDays, dayKey, parseDayKey, weekdayIndex } from "./date";
import { isControlled, type ScrollLog } from "./stats";
import type {
  FeedApp,
  IconName,
  InterceptEntry,
  Settings,
  SlipEntry,
  TriggerId,
  WinArchive,
  WinEntry,
} from "./types";

/** Everything an achievement is judged on — the real history, nothing else. */
export interface AchievementData {
  wins: readonly WinEntry[];
  winArchive: WinArchive;
  slips: readonly SlipEntry[];
  intercepts: readonly InterceptEntry[];
  scrollLog: ScrollLog;
  settings: Settings;
}

export type AchievementTone = "primary" | "success" | "warning" | "indigo" | "danger";

/** How progress reads under a locked achievement. */
export type ProgressUnit =
  | { kind: "count"; forms: readonly [string, string, string] }
  | { kind: "minutes" }
  | { kind: "once" };

export interface Achievement {
  id: string;
  title: string | ((mainApp: FeedApp) => string);
  /** What it means, in human words. */
  description: string;
  /** How to earn it, shown while it is locked. */
  hint: string;
  icon: IconName;
  tone: AchievementTone;
  unit: ProgressUnit;
  target: number;
  evaluate: (history: History) => Evaluation;
}

interface Evaluation {
  /** Progress towards `target`. */
  current: number;
  /** When the history first met the goal; null while it hasn't. */
  achievedAt: number | null;
}

export interface AchievementStatus {
  achievement: Achievement;
  title: string;
  current: number;
  target: number;
  /** 0…1 */
  progress: number;
  /** When the history first met the goal (null while locked). */
  achievedAt: number | null;
}

// ---------------------------------------------------------------------------
// Shared, pre-sorted history
// ---------------------------------------------------------------------------

interface History {
  now: number;
  todayKey: string;
  settings: Settings;
  scrollLog: ScrollLog;
  winArchive: WinArchive;
  /** Oldest first. */
  wins: WinEntry[];
  slips: SlipEntry[];
  intercepts: InterceptEntry[];
  /** Local hours of slips, per day key. */
  slipHours: Map<string, number[]>;
  /** Local hours of wins, per day key. */
  winHours: Map<string, number[]>;
}

const byTime = <T extends { timestamp: number }>(items: readonly T[]) =>
  [...items].sort((a, b) => a.timestamp - b.timestamp);

function hoursByDay(items: readonly { timestamp: number }[]): Map<string, number[]> {
  const map = new Map<string, number[]>();
  for (const item of items) {
    const key = dayKey(item.timestamp);
    const hours = map.get(key) ?? [];
    hours.push(new Date(item.timestamp).getHours());
    map.set(key, hours);
  }
  return map;
}

function prepare(data: AchievementData, now: number): History {
  return {
    now,
    todayKey: dayKey(now),
    settings: data.settings,
    scrollLog: data.scrollLog,
    winArchive: data.winArchive,
    wins: byTime(data.wins),
    slips: byTime(data.slips),
    intercepts: byTime(data.intercepts),
    slipHours: hoursByDay(data.slips),
    winHours: hoursByDay(data.wins),
  };
}

/** The local time `hours` after the start of a day (DST-safe for whole days). */
const dayTime = (key: string, hours: number) => parseDayKey(key).getTime() + hours * MS_PER_HOUR;

/**
 * Counts entries until `target`; `start` covers history that was archived away.
 * Returns the timestamp of the entry that reached the goal.
 */
function countUntil(
  items: readonly { timestamp: number }[],
  target: number,
  start = 0,
): Evaluation {
  if (start >= target) return { current: target, achievedAt: items[0]?.timestamp ?? null };
  const total = start + items.length;
  if (total < target) return { current: total, achievedAt: null };
  return { current: target, achievedAt: items[target - start - 1]!.timestamp };
}

function sumUntil(wins: readonly WinEntry[], target: number, start: number): Evaluation {
  let sum = start;
  if (sum >= target) return { current: target, achievedAt: wins[0]?.timestamp ?? null };
  for (const win of wins) {
    sum += win.minutesSaved;
    if (sum >= target) return { current: target, achievedAt: win.timestamp };
  }
  return { current: sum, achievedAt: null };
}

/**
 * Days whose window (`from`…`to` local hours, `to` may pass midnight) held at least one win
 * (or was tracked at all, when `needsWin` is false), had no slip, and is already over.
 * Returns the end time of each such window, oldest first.
 */
function cleanWindows(
  history: History,
  from: number,
  to: number,
  options: { needsWin: boolean; weekday?: number },
): number[] {
  const inWindow = (key: string, map: Map<string, number[]>) => {
    const sameDay = (map.get(key) ?? []).some((hour) => hour >= from && hour < Math.min(to, 24));
    if (to <= 24) return sameDay;
    const nextDay = (map.get(addDays(key, 1)) ?? []).some((hour) => hour < to - 24);
    return sameDay || nextDay;
  };

  const days = new Set<string>(history.winHours.keys());
  if (!options.needsWin) {
    for (const key of Object.keys(history.scrollLog)) days.add(key);
    for (const item of history.intercepts) days.add(dayKey(item.timestamp));
  }

  const ends: number[] = [];
  for (const key of [...days].sort()) {
    if (options.weekday !== undefined && weekdayIndex(key) !== options.weekday) continue;
    const end = to <= 24 ? dayTime(key, to) : dayTime(addDays(key, 1), to - 24);
    if (end > history.now) continue;
    if (options.needsWin && !inWindow(key, history.winHours)) continue;
    if (inWindow(key, history.slipHours)) continue;
    ends.push(end);
  }
  return ends;
}

function windowsUntil(ends: readonly number[], target: number): Evaluation {
  return ends.length >= target
    ? { current: target, achievedAt: ends[target - 1]! }
    : { current: ends.length, achievedAt: null };
}

/** Wins in a row with no slip and no "open anyway" between them. */
function refusalRun(history: History, target: number): Evaluation {
  type Event = { timestamp: number; win: boolean };
  const events: Event[] = [
    ...history.wins.map((win) => ({ timestamp: win.timestamp, win: true })),
    ...history.slips.map((slip) => ({ timestamp: slip.timestamp, win: false })),
    ...history.intercepts
      .filter((item) => item.outcome === "opened")
      .map((item) => ({ timestamp: item.timestamp, win: false })),
  ].sort((a, b) => a.timestamp - b.timestamp);

  let run = 0;
  let achievedAt: number | null = null;
  for (const event of events) {
    run = event.win ? run + 1 : 0;
    if (achievedAt === null && run >= target) achievedAt = event.timestamp;
  }
  return { current: achievedAt !== null ? target : run, achievedAt };
}

/** A win on the same day after a slip — the comeback. */
function comeback(history: History): Evaluation {
  let slipIndex = 0;
  let lastSlip: number | null = null;
  for (const win of history.wins) {
    while (
      slipIndex < history.slips.length &&
      history.slips[slipIndex]!.timestamp < win.timestamp
    ) {
      lastSlip = history.slips[slipIndex]!.timestamp;
      slipIndex += 1;
    }
    if (lastSlip !== null && win.timestamp - lastSlip <= MS_PER_DAY) {
      return { current: 1, achievedAt: win.timestamp };
    }
  }
  return { current: 0, achievedAt: null };
}

/** Consecutive days within the limit; `current` is the streak running now. */
function limitStreak(history: History, target: number): Evaluation {
  const limit = history.settings.dailyLimitMinutes;
  let run = 0;
  let previous: string | null = null;
  let achievedAt: number | null = null;
  for (const key of Object.keys(history.scrollLog).sort()) {
    const controlled = isControlled(history.scrollLog[key], limit);
    const continues = previous !== null && addDays(previous, 1) === key;
    run = controlled ? (continues ? run + 1 : 1) : 0;
    previous = controlled ? key : null;
    if (achievedAt === null && run >= target) {
      achievedAt = Math.min(history.now, dayTime(addDays(key, 1), 0) - 1);
    }
  }
  if (achievedAt !== null) return { current: target, achievedAt };
  // A run only counts while it reaches yesterday or today.
  const alive =
    previous !== null &&
    (previous === history.todayKey || previous === addDays(history.todayKey, -1));
  return { current: alive ? run : 0, achievedAt: null };
}

/** Seven days that averaged half of the "before StopScroll" baseline or less. */
function halfFeed(history: History): Evaluation {
  const baseline = history.settings.baselineMinutes;
  if (baseline <= 0) return { current: 0, achievedAt: null };
  for (const key of Object.keys(history.scrollLog).sort()) {
    const week = Array.from({ length: 7 }, (_, index) => history.scrollLog[addDays(key, -index)]);
    const logged = week.filter((minutes): minutes is number => minutes !== undefined);
    if (logged.length < 5) continue;
    const average = logged.reduce((sum, minutes) => sum + minutes, 0) / logged.length;
    if (average <= baseline / 2) {
      return { current: 1, achievedAt: Math.min(history.now, dayTime(addDays(key, 1), 0) - 1) };
    }
  }
  return { current: 0, achievedAt: null };
}

const triggerWins = (history: History, trigger: TriggerId) =>
  history.wins.filter((win) => win.trigger === trigger);

// ---------------------------------------------------------------------------
// The achievements
// ---------------------------------------------------------------------------

const EVENING = { from: 17, to: 23 } as const;
const MORNING = { from: 5, to: 12 } as const;
/** 22:00 → 05:00 the next morning. */
const NIGHT = { from: 22, to: 29 } as const;

const TIMES = ["раз", "раза", "раз"] as const;

export const ACHIEVEMENTS: readonly Achievement[] = [
  {
    id: "first-choice",
    title: "Первый выбор в свою пользу",
    description: "Импульс тянул в ленту, а вы выбрали паузу. С этого всё начинается.",
    hint: "Пройдите паузу или выполните замену вместо ленты.",
    icon: "hand-left",
    tone: "primary",
    unit: { kind: "once" },
    target: 1,
    evaluate: (history) => countUntil(history.wins, 1, history.winArchive.count),
  },
  {
    id: "first-evening",
    title: (mainApp) =>
      `Первый вечер без ${mainApp === "other" ? "ленты" : getFeedApp(mainApp).label}`,
    description: "Вечер, когда вы удержались и ни разу не сорвались в ленту.",
    hint: "Удержитесь от ленты вечером (17–23 ч) и закончите вечер без срыва.",
    icon: "moon",
    tone: "indigo",
    unit: { kind: "once" },
    target: 1,
    evaluate: (history) =>
      windowsUntil(cleanWindows(history, EVENING.from, EVENING.to, { needsWin: true }), 1),
  },
  {
    id: "first-prevented",
    title: "Пауза сильнее привычки",
    description: "Палец уже открыл ленту, но вы остановились и закрыли её, не начав листать.",
    hint: "Откажитесь от ленты на экране паузы перед приложением.",
    icon: "shield-checkmark",
    tone: "primary",
    unit: { kind: "once" },
    target: 1,
    evaluate: (history) =>
      countUntil(
        history.intercepts.filter((item) => item.outcome !== "opened"),
        1,
      ),
  },
  {
    id: "first-hour",
    title: "Первый спасённый час",
    description: "60 минут, которые остались вам, а не алгоритму.",
    hint: "Спасите 60 минут паузами и заменами.",
    icon: "hourglass",
    tone: "success",
    unit: { kind: "minutes" },
    target: 60,
    evaluate: (history) => sumUntil(history.wins, 60, history.winArchive.minutes),
  },
  {
    id: "morning-free",
    title: "Утро принадлежит вам",
    description: "Утро, которое началось с паузы, а не с бесконечной прокрутки.",
    hint: "Удержитесь от ленты утром (5–12 ч) и не сорвитесь до полудня.",
    icon: "sunny",
    tone: "warning",
    unit: { kind: "once" },
    target: 1,
    evaluate: (history) =>
      windowsUntil(cleanWindows(history, MORNING.from, MORNING.to, { needsWin: true }), 1),
  },
  {
    id: "comeback",
    title: "Сорвались — и вернулись",
    description: "Срыв не стал поводом сдаться: следующий импульс остался за вами.",
    hint: "Удержитесь в течение суток после записанного срыва.",
    icon: "refresh-circle",
    tone: "success",
    unit: { kind: "once" },
    target: 1,
    evaluate: comeback,
  },
  {
    id: "sunday-evening",
    title: "Воскресный вечер за вами",
    description: "Самый «ленточный» вечер недели прошёл без единого срыва.",
    hint: "Удержитесь в воскресенье вечером и закончите его без срыва.",
    icon: "cafe",
    tone: "indigo",
    unit: { kind: "once" },
    target: 1,
    evaluate: (history) =>
      windowsUntil(
        cleanWindows(history, EVENING.from, EVENING.to, { needsWin: true, weekday: 6 }),
        1,
      ),
  },
  {
    id: "week-in-limit",
    title: "Неделя в своём ритме",
    description: "Семь дней подряд в пределах лимита. Лента больше не задаёт темп.",
    hint: "Держитесь в пределах дневного лимита 7 дней подряд.",
    icon: "calendar",
    tone: "warning",
    unit: { kind: "count", forms: ["день", "дня", "дней"] },
    target: 7,
    evaluate: (history) => limitStreak(history, 7),
  },
  {
    id: "nights-7",
    title: "7 вечеров без ночного скролла",
    description: "Семь ночей, когда сон оказался важнее ленты.",
    hint: "Проведите 7 ночей (22–5 ч) без срывов в дни, когда пользуетесь StopScroll.",
    icon: "bed",
    tone: "indigo",
    unit: { kind: "count", forms: ["ночь", "ночи", "ночей"] },
    target: 7,
    evaluate: (history) =>
      windowsUntil(cleanWindows(history, NIGHT.from, NIGHT.to, { needsWin: false }), 7),
  },
  {
    id: "stress-10",
    title: "Стресс без побега",
    description: "10 раз вы встретили стресс без ленты. Это и есть устойчивость.",
    hint: "Удержитесь 10 раз, когда в ленту тянет из-за стресса.",
    icon: "thunderstorm",
    tone: "danger",
    unit: { kind: "count", forms: TIMES },
    target: 10,
    evaluate: (history) => countUntil(triggerWins(history, "stress"), 10),
  },
  {
    id: "boredom-20",
    title: "20 побед над скукой",
    description: "Скука звала в ленту двадцать раз — и двадцать раз проиграла.",
    hint: "Удержитесь 20 раз, когда в ленту тянет от скуки.",
    icon: "hourglass-outline",
    tone: "warning",
    unit: { kind: "count", forms: TIMES },
    target: 20,
    evaluate: (history) => countUntil(triggerWins(history, "boredom"), 20),
  },
  {
    id: "replacements-25",
    title: "Тело и голова вместо ленты",
    description: "25 раз вы выбрали движение, задачу или факт вместо прокрутки.",
    hint: "Выполните 25 полезных замен.",
    icon: "barbell",
    tone: "success",
    unit: { kind: "count", forms: ["замена", "замены", "замен"] },
    target: 25,
    evaluate: (history) =>
      countUntil(
        history.wins.filter((win) => win.source === "replacement"),
        25,
        history.winArchive.replacementCount,
      ),
  },
  {
    id: "refusals-30",
    title: "30 успешных отказов подряд",
    description: "Тридцать импульсов подряд — и ни одного срыва между ними.",
    hint: "Удержитесь 30 раз подряд без срыва и без «всё равно открыть».",
    icon: "flame",
    tone: "danger",
    unit: { kind: "count", forms: ["отказ", "отказа", "отказов"] },
    target: 30,
    evaluate: (history) => refusalRun(history, 30),
  },
  {
    id: "half-feed",
    title: "Вдвое меньше ленты",
    description: "Неделя, когда лента заняла вдвое меньше времени, чем до StopScroll.",
    hint: "Отмечайте время 7 дней: в среднем — не больше половины исходного уровня.",
    icon: "trending-down",
    tone: "primary",
    unit: { kind: "once" },
    target: 1,
    evaluate: halfFeed,
  },
  {
    id: "prevented-100",
    title: "100 предотвращённых открытий",
    description: "Сто раз палец тянулся к ленте, а пауза оказалась сильнее.",
    hint: "Откажитесь от ленты на экране паузы 100 раз.",
    icon: "shield",
    tone: "primary",
    unit: { kind: "count", forms: ["открытие", "открытия", "открытий"] },
    target: 100,
    evaluate: (history) =>
      countUntil(
        history.intercepts.filter((item) => item.outcome !== "opened"),
        100,
      ),
  },
  {
    id: "day-of-life",
    title: "Сутки жизни — ваши",
    description: "1 440 минут спасено. Целые сутки, которые вы вернули себе.",
    hint: "Спасите 24 часа паузами и заменами.",
    icon: "infinite",
    tone: "success",
    unit: { kind: "minutes" },
    target: 24 * 60,
    evaluate: (history) => sumUntil(history.wins, 24 * 60, history.winArchive.minutes),
  },
];

export function getAchievement(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((achievement) => achievement.id === id);
}

export function achievementTitle(achievement: Achievement, mainApp: FeedApp): string {
  return typeof achievement.title === "function" ? achievement.title(mainApp) : achievement.title;
}

/** Every achievement with its progress, in catalog order. */
export function evaluateAchievements(
  data: AchievementData,
  now: number = Date.now(),
): AchievementStatus[] {
  const history = prepare(data, now);
  return ACHIEVEMENTS.map((achievement) => {
    const { current, achievedAt } = achievement.evaluate(history);
    const clamped = Math.min(achievement.target, Math.max(0, current));
    return {
      achievement,
      title: achievementTitle(achievement, data.settings.mainApp),
      current: achievedAt !== null ? achievement.target : clamped,
      target: achievement.target,
      progress: achievedAt !== null ? 1 : clamped / achievement.target,
      achievedAt,
    };
  });
}

/** Achievement id → when it was earned, for everything the history already satisfies. */
export function earnedAchievements(
  data: AchievementData,
  now: number = Date.now(),
): Record<string, number> {
  const earned: Record<string, number> = {};
  for (const status of evaluateAchievements(data, now)) {
    if (status.achievedAt !== null)
      earned[status.achievement.id] = Math.min(now, status.achievedAt);
  }
  return earned;
}
