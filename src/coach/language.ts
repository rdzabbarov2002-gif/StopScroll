import { m } from "../i18n";
import { formatMinutesInline } from "../utils/date";

/**
 * Small language kit for the coach. The coach speaks to the user as "ты" (du, tu, sen), calmly
 * and without gendered forms, so the same sentence fits everyone. Every sentence lives in the
 * `coach` messages (src/i18n/messages/coach), one file per language: each language builds it by
 * its own grammar from the facts the coach passes in.
 *
 * The Russian helpers (word forms, weekday cases, ordinals) live with the Russian messages and
 * are re-exported here.
 */
export {
  DAY_WORD_FORMS,
  EVENING_FORMS,
  REPLACEMENT_WORD_FORMS,
  SLIP_FORMS,
  TIME_FORMS,
  WALK_FORMS,
  WEEK_FORMS,
  type WeekdayCase,
  capitalize,
  count,
  genitiveNumber,
  ordinalFeminine,
  ordinalMasculine,
  weekday,
} from "../i18n/messages/coach/ru";

export const minutes = (value: number) => formatMinutesInline(value);

const pad = (value: number) => String(value).padStart(2, "0");

/** "21:00" */
export const clock = (hour: number) => `${pad(((hour % 24) + 24) % 24)}:00`;

/**
 * A stable choice between phrasings of the same fact: it depends on the day (or week) and on
 * what is being said, never on chance — the same data on the same day reads the same.
 */
export function variant<T>(seed: string, options: readonly T[]): T {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return options[Math.abs(hash) % options.length]!;
}

/** "Доброе утро", by the hour. */
export function greeting(hour: number): string {
  const words = m().coach.greeting;
  if (hour >= 5 && hour < 12) return words.morning;
  if (hour >= 12 && hour < 17) return words.afternoon;
  if (hour >= 17 && hour < 23) return words.evening;
  return words.night;
}

/** Percent change rounded to whole numbers: 48 → 36 is −25. */
export const percentChange = (from: number, to: number) =>
  from > 0 ? Math.round(((to - from) / from) * 100) : 0;

/** Keeps "6 из 14" and "21:00 —" from breaking across lines (in the current language). */
export const tidy = (text: string) => m().coach.tidy(text);
