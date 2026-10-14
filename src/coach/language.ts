import { formatMinutesInline, pluralize } from "../utils/date";

/**
 * Small Russian language kit for the coach. The coach speaks to the user as "ты", calmly and
 * without gendered past-tense verbs ("ты устал" → "не было сил"), so the same sentence fits
 * everyone.
 */

export const SLIP_FORMS = ["срыв", "срыва", "срывов"] as const;
export const DAY_WORD_FORMS = ["день", "дня", "дней"] as const;
export const WEEK_FORMS = ["неделя", "недели", "недель"] as const;
export const TIME_FORMS = ["раз", "раза", "раз"] as const;
export const REPLACEMENT_WORD_FORMS = ["замена", "замены", "замен"] as const;
export const WALK_FORMS = ["прогулка", "прогулки", "прогулок"] as const;
export const EVENING_FORMS = ["вечер", "вечера", "вечеров"] as const;

/** "3 срыва", "1 день" — a number with its word. */
export const count = (value: number, forms: readonly [string, string, string]) =>
  `${value} ${pluralize(value, forms)}`;

export const minutes = (value: number) => formatMinutesInline(value);

/** Monday-first weekday forms. */
const WEEKDAY = {
  nominative: ["понедельник", "вторник", "среда", "четверг", "пятница", "суббота", "воскресенье"],
  /** "по вторникам" */
  dativePlural: [
    "по понедельникам",
    "по вторникам",
    "по средам",
    "по четвергам",
    "по пятницам",
    "по субботам",
    "по воскресеньям",
  ],
  /** "из последних четырёх вторников" */
  genitivePlural: [
    "понедельников",
    "вторников",
    "сред",
    "четвергов",
    "пятниц",
    "суббот",
    "воскресений",
  ],
  /** "во вторник" */
  accusative: [
    "в понедельник",
    "во вторник",
    "в среду",
    "в четверг",
    "в пятницу",
    "в субботу",
    "в воскресенье",
  ],
} as const;

export type WeekdayCase = keyof typeof WEEKDAY;

export const weekday = (index: number, form: WeekdayCase) => WEEKDAY[form][index] ?? "";

export const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const ORDINAL_MASCULINE = [
  "",
  "первый",
  "второй",
  "третий",
  "четвёртый",
  "пятый",
  "шестой",
  "седьмой",
];
const ORDINAL_FEMININE = [
  "",
  "первая",
  "вторая",
  "третья",
  "четвёртая",
  "пятая",
  "шестая",
  "седьмая",
];

/** "третий раз" */
export const ordinalMasculine = (value: number) => ORDINAL_MASCULINE[value] ?? `${value}-й`;
/** "третья неделя" */
export const ordinalFeminine = (value: number) => ORDINAL_FEMININE[value] ?? `${value}-я`;

const NUMBER_GENITIVE = [
  "",
  "одного",
  "двух",
  "трёх",
  "четырёх",
  "пяти",
  "шести",
  "семи",
  "восьми",
];

/** "из последних четырёх" */
export const genitiveNumber = (value: number) => NUMBER_GENITIVE[value] ?? String(value);

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
  if (hour >= 5 && hour < 12) return "Доброе утро";
  if (hour >= 12 && hour < 17) return "Добрый день";
  if (hour >= 17 && hour < 23) return "Добрый вечер";
  return "Доброй ночи";
}

/** Percent change rounded to whole numbers: 48 → 36 is −25. */
export const percentChange = (from: number, to: number) =>
  from > 0 ? Math.round(((to - from) / from) * 100) : 0;

/** Keeps "6 из 14" and "21:00 —" from breaking across lines. */
export const tidy = (text: string) =>
  text.replace(/(\d) из (\d)/g, "$1\u00a0из\u00a0$2").replace(/(\d) —/g, "$1\u00a0—");
