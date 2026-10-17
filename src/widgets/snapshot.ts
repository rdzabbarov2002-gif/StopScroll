import { isLanguage, type LanguageCode } from "../i18n/languages";
import { REPLACEMENTS } from "../utils/catalog";
import { addDays, dayKey } from "../utils/date";
import { getAllReplacements, isLocked } from "../utils/replacements";
import { getCurrentStreak, summarizeWins, type ScrollLog } from "../utils/stats";
import type {
  CustomReplacement,
  ReplacementCategory,
  Settings,
  WinArchive,
  WinEntry,
} from "../utils/types";

/**
 * The numbers every widget shows, written by the app whenever they change. iOS reads it
 * from the App Group (targets/widget/Snapshot.swift mirrors this shape), Android from
 * AsyncStorage in the widget task handler.
 */
export interface WidgetSnapshot {
  /**
   * The app's language: the widgets draw their texts in it. Snapshots saved before the app spoke
   * other languages have none — read it with `widgetLanguage()`.
   */
  language: LanguageCode;
  /** The local day the "today" numbers belong to. */
  day: string;
  savedToday: number;
  winsToday: number;
  streak: number;
  /** The streak on the next day if nothing gets logged: today only counts once it is logged. */
  streakTomorrow: number;
  limit: number;
  /** Logged feed minutes today, null when today isn't logged yet. */
  scrolledToday: number | null;
  /** Replacements open to the user; the widget shows a different one every half hour. */
  replacements: { id: string; title: string; minutes: number; category: ReplacementCategory }[];
}

export interface WidgetSource {
  todayKey: string;
  wins: readonly WinEntry[];
  winArchive: WinArchive;
  scrollLog: ScrollLog;
  settings: Settings;
  customReplacements: readonly CustomReplacement[];
  /** The app's language; Russian until the user has picked one. */
  language?: LanguageCode | null;
}

export function buildWidgetSnapshot(source: WidgetSource, isPro: boolean): WidgetSnapshot {
  const saved = summarizeWins(source.wins, source.winArchive, source.todayKey);
  const limit = source.settings.dailyLimitMinutes;
  const streak = getCurrentStreak(source.scrollLog, limit, source.todayKey);
  const today = source.scrollLog[source.todayKey];
  const replacements = (isPro ? getAllReplacements(source.customReplacements) : REPLACEMENTS)
    .filter((item) => !isLocked(item, isPro))
    .map(({ id, title, minutes, category }) => ({ id, title, minutes, category }));
  return {
    language: source.language ?? "ru",
    day: source.todayKey,
    savedToday: saved.todayMinutes,
    winsToday: saved.todayWins,
    streak,
    streakTomorrow: today !== undefined && today <= limit ? streak : 0,
    limit,
    scrolledToday: today ?? null,
    replacements,
  };
}

/** The language to draw a saved snapshot in: Russian for snapshots older than the field. */
export function widgetLanguage(snapshot: WidgetSnapshot): LanguageCode {
  const language: unknown = snapshot.language;
  return isLanguage(language) ? language : "ru";
}

export interface WidgetDay {
  saved: number;
  wins: number;
  streak: number;
  scrolled: number | null;
  limit: number;
}

/** The numbers as they stand at `now`: a snapshot from yesterday means nothing happened yet today. */
export function widgetDay(snapshot: WidgetSnapshot, now: number = Date.now()): WidgetDay {
  const today = dayKey(now);
  if (snapshot.day === today) {
    return {
      saved: snapshot.savedToday,
      wins: snapshot.winsToday,
      streak: snapshot.streak,
      scrolled: snapshot.scrolledToday,
      limit: snapshot.limit,
    };
  }
  return {
    saved: 0,
    wins: 0,
    streak: snapshot.day === addDays(today, -1) ? snapshot.streakTomorrow : 0,
    scrolled: null,
    limit: snapshot.limit,
  };
}

const HALF_HOUR_MS = 30 * 60 * 1000;

/** A different replacement every half hour (the iOS widget uses the same slots). */
export function widgetReplacement(
  snapshot: WidgetSnapshot,
  now: number = Date.now(),
): WidgetSnapshot["replacements"][number] | null {
  const items = snapshot.replacements;
  if (items.length === 0) return null;
  return items[Math.floor(now / HALF_HOUR_MS) % items.length]!;
}
