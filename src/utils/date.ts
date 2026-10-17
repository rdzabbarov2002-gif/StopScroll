import type { LanguageCode } from "../i18n/languages";
import { de, en, fr, ru, tr } from "../i18n/messages/common";
import type { Messages as CommonMessages, Week } from "../i18n/messages/common/ru";
import { selectPlural, type PluralForms } from "../i18n/plural";
import { getLanguage } from "../i18n/store";
import type { TimeOfDay } from "./types";

/**
 * The `common` messages in the current language — the same object as `m().common`, read straight
 * from its folder: other areas' message files import these formatters, and going through the full
 * catalog in `i18n/index.ts` would make an import cycle.
 */
const COMMON: Record<LanguageCode, CommonMessages> = { ru, en, tr, de, fr };
const t = () => COMMON[getLanguage()];

/** "3 дня", "3 days" — `countOf` without the full catalog. */
const countOf = (count: number, forms: PluralForms, separator = " ") =>
  `${count}${separator}${selectPlural(getLanguage(), count, forms)}`;

export const MS_PER_MINUTE = 60_000;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const MS_PER_DAY = 24 * MS_PER_HOUR;

/** Monday-first full weekday name, matching `weekdayIndex()`: "Пятница". */
export function weekdayName(index: number): string {
  return t().date.weekdays[((index % 7) + 7) % 7]!;
}

/** Monday-first short weekday name, matching `weekdayIndex()`: "Пт". */
export function weekdayShort(index: number): string {
  return t().date.weekdaysShort[((index % 7) + 7) % 7]!;
}

/**
 * A fixed-length list whose items are read on access, so `list[i]`, `.map()` and spreads give the
 * current language even though the list itself is created once at import.
 */
function liveList<T extends readonly string[]>(length: number, read: () => T): T {
  const list: string[] = [];
  for (let index = 0; index < length; index += 1) {
    Object.defineProperty(list, index, { enumerable: true, get: () => read()[index] });
  }
  return list as unknown as T;
}

/** Monday-first short weekday names, matching `weekdayIndex()`, in the current language. */
export const WEEKDAYS_SHORT: Week = liveList(7, () => t().date.weekdaysShort);

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * Russian plural form picker: pluralize(5, ["день", "дня", "дней"]) → "дней".
 * Russian only — for the other languages use `plural()` / `countOf()` from `i18n`.
 */
export function pluralize(count: number, forms: readonly [string, string, string]): string {
  const n = Math.abs(Math.trunc(count)) % 100;
  const last = n % 10;
  if (n > 10 && n < 20) return forms[2];
  if (last > 1 && last < 5) return forms[1];
  if (last === 1) return forms[0];
  return forms[2];
}

/** Russian [one, few, many] triple for `pluralize`, from the Russian messages. */
const russianForms = (forms: PluralForms) =>
  [forms.one, forms.few ?? forms.other, forms.many ?? forms.other] as const;

/** Russian only, for `pluralize`; in every language: countOf(n, t().units.days). */
export const DAY_FORMS = russianForms(ru.units.days);
export const ENTRY_FORMS = russianForms(ru.units.entries);
export const WIN_FORMS = russianForms(ru.units.wins);
export const TIMES_FORMS = russianForms(ru.units.times);

/** Local calendar day key, e.g. "2026-10-04". */
export function dayKey(input: Date | number = Date.now()): string {
  const date = typeof input === "number" ? new Date(input) : input;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export const DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Local midnight of a day key. */
export function parseDayKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year!, month! - 1, day!);
}

/** Calendar arithmetic on day keys (safe across DST changes). */
export function addDays(key: string, amount: number): string {
  const date = parseDayKey(key);
  return dayKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount));
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayIndex(input: Date | number | string): number {
  const date =
    typeof input === "string"
      ? parseDayKey(input)
      : typeof input === "number"
        ? new Date(input)
        : input;
  return (date.getDay() + 6) % 7;
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** "Суббота, 4 октября" */
export function formatLongDate(timestamp: number = Date.now()): string {
  const date = new Date(timestamp);
  return t().date.long(weekdayIndex(date), date.getDate(), date.getMonth());
}

/** "4 октября", with the year when it isn't the current one. */
export function formatDate(timestamp: number, now: number = Date.now()): string {
  const date = new Date(timestamp);
  const year = date.getFullYear() === new Date(now).getFullYear() ? undefined : date.getFullYear();
  return t().date.day(date.getDate(), date.getMonth(), year);
}

/** "5–11 октября" or "29 сентября – 5 октября" for a Monday…Sunday week. */
export function formatWeekRange(monday: string): string {
  const start = parseDayKey(monday);
  const end = parseDayKey(addDays(monday, 6));
  const messages = t().date;
  if (start.getMonth() === end.getMonth()) {
    return messages.rangeInMonth(start.getDate(), end.getDate(), end.getMonth());
  }
  return messages.range(start.getDate(), start.getMonth(), end.getDate(), end.getMonth());
}

/** "4 окт." for a day key. */
export function formatDayShort(key: string): string {
  const date = parseDayKey(key);
  return t().date.dayShort(date.getDate(), date.getMonth());
}

/** "Сегодня, 21:14", "Вчера, 09:03" or "12 сент., 14:00". */
export function formatRelativeDay(timestamp: number, now: number = Date.now()): string {
  const messages = t().date;
  const today = dayKey(now);
  const yesterday = addDays(today, -1);
  const key = dayKey(timestamp);
  const time = formatTime(timestamp);
  if (key === today) return messages.todayAt(time);
  if (key === yesterday) return messages.yesterdayAt(time);
  const date = new Date(timestamp);
  const sameYear = date.getFullYear() === new Date(now).getFullYear();
  const day = messages.dayShort(
    date.getDate(),
    date.getMonth(),
    sameYear ? undefined : date.getFullYear(),
  );
  return messages.dateAt(day, time);
}

/** "0 мин", "45 мин", "1 ч", "2 ч 30 мин". */
export function formatMinutes(totalMinutes: number): string {
  const { minute, hour } = t().duration;
  const minutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} ${minute}`;
  if (rest === 0) return `${hours} ${hour}`;
  return `${hours} ${hour} ${rest} ${minute}`;
}

/** "6 часов", "1 час 30 минут", "21 минуту" — for sentences like "вы вернули себе …". */
export function formatDurationWords(totalMinutes: number): string {
  const words = t().duration;
  const minutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const hoursPart = countOf(hours, words.hours, "\u00A0");
  const minutesPart = countOf(rest, words.minutes, "\u00A0");
  if (hours === 0) return minutesPart;
  if (rest === 0) return hoursPart;
  return `${hoursPart} ${minutesPart}`;
}

/** formatMinutes with non-breaking spaces, for use inside sentences ("2 ч 30 мин" never wraps). */
export function formatMinutesInline(totalMinutes: number): string {
  return formatMinutes(totalMinutes).replace(/ /g, "\u00A0");
}

/** Compact form for chart labels: "45м", "2ч", "2ч30". */
export function formatMinutesCompact(totalMinutes: number): string {
  const { compactMinute, compactHour } = t().duration;
  const minutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}${compactMinute}`;
  if (rest === 0) return `${hours}${compactHour}`;
  return `${hours}${compactHour}${pad(rest)}`;
}

/** "21:00–22:00" */
export function formatHourRange(hour: number): string {
  return `${pad(hour)}:00–${pad((hour + 1) % 24)}:00`;
}

export function getTimeOfDay(timestamp: number): TimeOfDay {
  const hour = new Date(timestamp).getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 23) return "evening";
  return "night";
}

export function getGreeting(timestamp: number = Date.now()): string {
  return t().greeting[getTimeOfDay(timestamp)];
}

/** "12 480" with the language's thousands separator: "12,480", "12.480", "12 480". */
export function formatNumber(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, t().number.group);
}

/** One decimal for small values ("1,5"; "1.5" in English), whole numbers otherwise. */
export function formatDecimal(value: number): string {
  if (value >= 10 || Number.isInteger(value)) return formatNumber(value);
  const fixed = value.toFixed(1);
  const trimmed = fixed.endsWith(".0") ? fixed.slice(0, -2) : fixed;
  return trimmed.replace(".", t().number.decimal);
}
