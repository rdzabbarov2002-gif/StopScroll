import { CATEGORIES, EXERCISES, FEED_APPS, MAX_SCROLL_MINUTES, TRIGGERS } from "./catalog";
import { DAY_KEY_PATTERN } from "./date";
import type {
  CustomReplacement,
  ExerciseId,
  FeedApp,
  PersistedState,
  ReplacementCategory,
  Settings,
  SlipEntry,
  ThemePreference,
  TriggerId,
  WinArchive,
  WinEntry,
} from "./types";

/** Upper bounds keep the single JSON blob small and fast to (de)serialize. */
export const MAX_WINS = 2000;
export const MAX_SLIPS = 1000;
/** Ten years of daily entries is still only ~80 KB; trimming earlier would shrink the best streak. */
export const MAX_SCROLL_DAYS = 3660;
export const MAX_CUSTOM_REPLACEMENTS = 30;
export const MAX_NOTE_LENGTH = 200;
export const MAX_TITLE_LENGTH = 60;
export const MAX_DESCRIPTION_LENGTH = 160;

// Only natural bounds: from zero (a session is at least 5 minutes, or a win would be worth
// nothing) up to a whole day.
export const LIMIT_RANGE = { min: 0, max: MAX_SCROLL_MINUTES, step: 5 } as const;
export const SESSION_RANGE = { min: 5, max: MAX_SCROLL_MINUTES, step: 5 } as const;
export const BASELINE_RANGE = { min: 0, max: MAX_SCROLL_MINUTES, step: 5 } as const;

/**
 * Slider position (0…1) → minutes on a quadratic curve: short times get fine steps, while the
 * whole day is still reachable at the end of the track.
 */
export function sliderToMinutes(position: number, step = 5): number {
  const clamped = Math.min(1, Math.max(0, position));
  return Math.round((MAX_SCROLL_MINUTES * clamped * clamped) / step) * step;
}

export function minutesToSlider(minutes: number): number {
  return Math.sqrt(Math.min(MAX_SCROLL_MINUTES, Math.max(0, minutes)) / MAX_SCROLL_MINUTES);
}

export const DEFAULT_SETTINGS: Settings = {
  dailyLimitMinutes: 60,
  sessionMinutes: 15,
  baselineMinutes: 180,
  mainApp: "tiktok",
};

export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createInitialState(): PersistedState {
  return {
    version: 1,
    onboarded: false,
    settings: { ...DEFAULT_SETTINGS },
    scrollLog: {},
    wins: [],
    winArchive: { count: 0, minutes: 0, replacementCount: 0 },
    slips: [],
    customReplacements: [],
    lastExerciseId: "breath-ground",
    themePreference: "system",
  };
}

export function clampToRange(value: number, range: { min: number; max: number; step: number }) {
  const stepped = Math.round(value / range.step) * range.step;
  return Math.min(range.max, Math.max(range.min, stepped));
}

export function clampScrollMinutes(value: number): number {
  return Math.min(MAX_SCROLL_MINUTES, Math.max(0, Math.round(value)));
}

/** Keeps only the most recent days so the log can't grow forever. */
export function trimScrollLog(log: Record<string, number>): Record<string, number> {
  const keys = Object.keys(log);
  if (keys.length <= MAX_SCROLL_DAYS) return log;
  const kept = keys.sort().slice(-MAX_SCROLL_DAYS);
  return Object.fromEntries(kept.map((key) => [key, log[key]!]));
}

/** Folds wins that fall off the capped list into the running totals. */
export function archiveWins(archive: WinArchive, evicted: readonly WinEntry[]): WinArchive {
  if (evicted.length === 0) return archive;
  return evicted.reduce(
    (total, win) => ({
      count: total.count + 1,
      minutes: total.minutes + win.minutesSaved,
      replacementCount: total.replacementCount + (win.source === "replacement" ? 1 : 0),
    }),
    archive,
  );
}

const TRIGGER_IDS = new Set<string>(TRIGGERS.map((trigger) => trigger.id));
const APP_IDS = new Set<string>(FEED_APPS.map((app) => app.id));
const CATEGORY_IDS = new Set<string>(CATEGORIES.map((category) => category.id));
const EXERCISE_IDS = new Set<string>(EXERCISES.map((exercise) => exercise.id));
const THEMES = new Set<string>(["system", "light", "dark"]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isTimestamp = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isTrigger = (value: unknown): value is TriggerId =>
  typeof value === "string" && TRIGGER_IDS.has(value);

function sanitizeSettings(value: unknown): Settings {
  const raw = isRecord(value) ? value : {};
  return {
    dailyLimitMinutes: isFiniteNumber(raw.dailyLimitMinutes)
      ? clampToRange(raw.dailyLimitMinutes, LIMIT_RANGE)
      : DEFAULT_SETTINGS.dailyLimitMinutes,
    sessionMinutes: isFiniteNumber(raw.sessionMinutes)
      ? clampToRange(raw.sessionMinutes, SESSION_RANGE)
      : DEFAULT_SETTINGS.sessionMinutes,
    baselineMinutes: isFiniteNumber(raw.baselineMinutes)
      ? clampToRange(raw.baselineMinutes, BASELINE_RANGE)
      : DEFAULT_SETTINGS.baselineMinutes,
    mainApp:
      typeof raw.mainApp === "string" && APP_IDS.has(raw.mainApp)
        ? (raw.mainApp as FeedApp)
        : DEFAULT_SETTINGS.mainApp,
  };
}

const wholeCount = (value: unknown) => (isFiniteNumber(value) ? Math.max(0, Math.round(value)) : 0);

function sanitizeWinArchive(value: unknown): WinArchive {
  const raw = isRecord(value) ? value : {};
  return {
    count: wholeCount(raw.count),
    minutes: wholeCount(raw.minutes),
    replacementCount: wholeCount(raw.replacementCount),
  };
}

function sanitizeScrollLog(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {};
  const entries = Object.entries(value).filter(
    (entry): entry is [string, number] =>
      DAY_KEY_PATTERN.test(entry[0]) && isFiniteNumber(entry[1]),
  );
  return trimScrollLog(
    Object.fromEntries(entries.map(([key, minutes]) => [key, clampScrollMinutes(minutes)])),
  );
}

function sanitizeWin(value: unknown): WinEntry | null {
  if (!isRecord(value)) return null;
  const { id, timestamp, minutesSaved, source, trigger, replacementId } = value;
  if (typeof id !== "string" || !isTimestamp(timestamp)) return null;
  if (source !== "sos" && source !== "replacement") return null;
  if (!isFiniteNumber(minutesSaved)) return null;
  return {
    id,
    timestamp,
    minutesSaved: Math.min(SESSION_RANGE.max, Math.max(0, Math.round(minutesSaved))),
    source,
    ...(isTrigger(trigger) ? { trigger } : {}),
    ...(typeof replacementId === "string" ? { replacementId } : {}),
  };
}

function sanitizeSlip(value: unknown): SlipEntry | null {
  if (!isRecord(value)) return null;
  const { id, timestamp, trigger, app, minutesLost, note } = value;
  if (typeof id !== "string" || !isTimestamp(timestamp) || !isTrigger(trigger)) return null;
  return {
    id,
    timestamp,
    trigger,
    app: typeof app === "string" && APP_IDS.has(app) ? (app as FeedApp) : "other",
    minutesLost: isFiniteNumber(minutesLost) ? clampScrollMinutes(minutesLost) : 0,
    note: typeof note === "string" ? note.slice(0, MAX_NOTE_LENGTH) : "",
  };
}

function sanitizeCustom(value: unknown): CustomReplacement | null {
  if (!isRecord(value)) return null;
  const { id, title, description, minutes, category, createdAt } = value;
  if (typeof id !== "string" || typeof title !== "string" || !title.trim()) return null;
  return {
    id,
    title: title.trim().slice(0, MAX_TITLE_LENGTH),
    description:
      typeof description === "string" ? description.slice(0, MAX_DESCRIPTION_LENGTH) : "",
    minutes: isFiniteNumber(minutes) ? Math.min(3, Math.max(1, Math.round(minutes))) : 1,
    category:
      typeof category === "string" && CATEGORY_IDS.has(category)
        ? (category as ReplacementCategory)
        : "body",
    createdAt: isTimestamp(createdAt) ? createdAt : Date.now(),
  };
}

function sanitizeList<T extends { id: string }>(
  value: unknown,
  sanitize: (item: unknown) => T | null,
  sortKey: (item: T) => number,
  limit: number,
): T[] {
  const seen = new Set<string>();
  return (Array.isArray(value) ? value : [])
    .map(sanitize)
    .filter((item): item is T => {
      if (item === null || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .sort((a, b) => sortKey(b) - sortKey(a))
    .slice(0, limit);
}

/**
 * Turns whatever was found in storage into a valid state. Unknown or broken fields fall
 * back to defaults instead of crashing the app, so a bad write never bricks it.
 */
export function sanitizePersistedState(raw: unknown): PersistedState {
  const base = createInitialState();
  if (!isRecord(raw)) return base;

  return {
    version: 1,
    onboarded: raw.onboarded === true,
    settings: sanitizeSettings(raw.settings),
    scrollLog: sanitizeScrollLog(raw.scrollLog),
    wins: sanitizeList(raw.wins, sanitizeWin, (item) => item.timestamp, MAX_WINS),
    winArchive: sanitizeWinArchive(raw.winArchive),
    slips: sanitizeList(raw.slips, sanitizeSlip, (item) => item.timestamp, MAX_SLIPS),
    customReplacements: sanitizeList(
      raw.customReplacements,
      sanitizeCustom,
      (item) => item.createdAt,
      MAX_CUSTOM_REPLACEMENTS,
    ),
    lastExerciseId:
      typeof raw.lastExerciseId === "string" && EXERCISE_IDS.has(raw.lastExerciseId)
        ? (raw.lastExerciseId as ExerciseId)
        : base.lastExerciseId,
    themePreference:
      typeof raw.themePreference === "string" && THEMES.has(raw.themePreference)
        ? (raw.themePreference as ThemePreference)
        : base.themePreference,
  };
}
