import type { TimeOfDay } from "./types";

export const MS_PER_MINUTE = 60_000;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const MS_PER_DAY = 24 * MS_PER_HOUR;

const MONTHS_GENITIVE = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

const MONTHS_SHORT = [
  "янв.",
  "февр.",
  "мар.",
  "апр.",
  "мая",
  "июн.",
  "июл.",
  "авг.",
  "сент.",
  "окт.",
  "нояб.",
  "дек.",
];

const WEEKDAYS = [
  "воскресенье",
  "понедельник",
  "вторник",
  "среда",
  "четверг",
  "пятница",
  "суббота",
];

/** Monday-first full weekday name, matching `weekdayIndex()`: "Пятница". */
export function weekdayName(index: number): string {
  const name = WEEKDAYS[(index + 1) % 7]!;
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}

/** Monday-first short weekday names, matching `weekdayIndex()`. */
export const WEEKDAYS_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const;

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * Russian plural form picker: pluralize(5, ["день", "дня", "дней"]) → "дней".
 */
export function pluralize(count: number, forms: readonly [string, string, string]): string {
  const n = Math.abs(Math.trunc(count)) % 100;
  const last = n % 10;
  if (n > 10 && n < 20) return forms[2];
  if (last > 1 && last < 5) return forms[1];
  if (last === 1) return forms[0];
  return forms[2];
}

export const DAY_FORMS = ["день", "дня", "дней"] as const;
export const ENTRY_FORMS = ["запись", "записи", "записей"] as const;
export const WIN_FORMS = ["победа", "победы", "побед"] as const;
export const TIMES_FORMS = ["раз", "раза", "раз"] as const;
const HOUR_WORD_FORMS = ["час", "часа", "часов"] as const;
const MINUTE_WORD_FORMS = ["минуту", "минуты", "минут"] as const;

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
  const weekday = WEEKDAYS[date.getDay()]!;
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()]}`;
}

/** "4 октября", with the year when it isn't the current one. */
export function formatDate(timestamp: number, now: number = Date.now()): string {
  const date = new Date(timestamp);
  const year = date.getFullYear() === new Date(now).getFullYear() ? "" : ` ${date.getFullYear()}`;
  return `${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()]}${year}`;
}

/** "5–11 октября" or "29 сентября – 5 октября" for a Monday…Sunday week. */
export function formatWeekRange(monday: string): string {
  const start = parseDayKey(monday);
  const end = parseDayKey(addDays(monday, 6));
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()}–${end.getDate()} ${MONTHS_GENITIVE[end.getMonth()]}`;
  }
  return `${start.getDate()} ${MONTHS_GENITIVE[start.getMonth()]} – ${end.getDate()} ${MONTHS_GENITIVE[end.getMonth()]}`;
}

/** "4 окт." for a day key. */
export function formatDayShort(key: string): string {
  const date = parseDayKey(key);
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

/** "Сегодня, 21:14", "Вчера, 09:03" or "12 сент., 14:00". */
export function formatRelativeDay(timestamp: number, now: number = Date.now()): string {
  const today = dayKey(now);
  const yesterday = addDays(today, -1);
  const key = dayKey(timestamp);
  const time = formatTime(timestamp);
  if (key === today) return `Сегодня, ${time}`;
  if (key === yesterday) return `Вчера, ${time}`;
  const date = new Date(timestamp);
  const sameYear = date.getFullYear() === new Date(now).getFullYear();
  const year = sameYear ? "" : ` ${date.getFullYear()}`;
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}${year}, ${time}`;
}

/** "0 мин", "45 мин", "1 ч", "2 ч 30 мин". */
export function formatMinutes(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} мин`;
  if (rest === 0) return `${hours} ч`;
  return `${hours} ч ${rest} мин`;
}

/** "6 часов", "1 час 30 минут", "21 минуту" — for sentences like "вы вернули себе …". */
export function formatDurationWords(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const hoursPart = `${hours}\u00A0${pluralize(hours, HOUR_WORD_FORMS)}`;
  const minutesPart = `${rest}\u00A0${pluralize(rest, MINUTE_WORD_FORMS)}`;
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
  const minutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}м`;
  if (rest === 0) return `${hours}ч`;
  return `${hours}ч${pad(rest)}`;
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
  switch (getTimeOfDay(timestamp)) {
    case "morning":
      return "Доброе утро";
    case "afternoon":
      return "Добрый день";
    case "evening":
      return "Добрый вечер";
    default:
      return "Доброй ночи";
  }
}

/** "12 480" with a grouping space, as is usual in Russian. */
export function formatNumber(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** One decimal for small values ("1,5"), whole numbers otherwise; Russian decimal comma. */
export function formatDecimal(value: number): string {
  if (value >= 10 || Number.isInteger(value)) return formatNumber(value);
  return value.toFixed(1).replace(".", ",").replace(/,0$/, "");
}
