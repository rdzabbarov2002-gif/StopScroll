import type { PluralForms } from "../../plural";

/**
 * common — Russian. The source of truth for this area's messages: the other languages must have
 * exactly the same keys (and the same parameters for function messages).
 *
 * Shared words, the tab bar, base components and the date/number formatting in `utils/date.ts`.
 * Weekday indexes are Monday-first (0 = Monday … 6 = Sunday), month indexes are 0 = January.
 */

/** Seven weekday names, Monday first. */
export type Week = readonly [string, string, string, string, string, string, string];
/** Twelve month names, January first. */
export type Months = readonly [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

/** "4 октября" */
const MONTHS: Months = [
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

/** "4 окт." */
const MONTHS_SHORT: Months = [
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

const WEEKDAYS: Week = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
];

const WEEKDAYS_SHORT: Week = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const withYear = (text: string, year?: number) => (year === undefined ? text : `${text} ${year}`);

export const ru = {
  /** Bottom tab titles. */
  tabs: {
    home: "Главная",
    ai: "AI",
    replacements: "Замены",
    stats: "Статистика",
    journal: "Дневник",
  },
  back: "Назад",
  close: "Закрыть",
  /** The dimmed backdrop behind a bottom sheet. */
  closeSheet: "Закрыть окно",
  /** Screen readers, when a value is missing. */
  noData: "нет данных",
  sos: {
    label: "SOS-пауза",
    hint: "Открывает 15-секундную паузу с дыханием, чтобы импульс ослаб",
  },
  pro: {
    /** A locked Pro card for screen readers. */
    lockedCard: (title: string) => `${title}. Доступно в StopScroll Pro`,
    /** A locked segment of a segmented control for screen readers. */
    lockedOption: (label: string) => `${label}, доступно в Pro`,
  },
  theme: {
    light: "Светлая",
    dark: "Тёмная",
    lightA11y: "Светлая тема",
    darkA11y: "Тёмная тема",
    system: "Как в системе",
    systemA11y: "Тема как в системе",
  },
  date: {
    /** Standalone names, as a value on their own: "Пятница". */
    weekdays: WEEKDAYS,
    /** Chart and calendar labels. */
    weekdaysShort: WEEKDAYS_SHORT,
    /** "Сегодня, 21:14" */
    todayAt: (time: string) => `Сегодня, ${time}`,
    /** "Вчера, 09:03" */
    yesterdayAt: (time: string) => `Вчера, ${time}`,
    /** "12 сент., 14:00" — `date` comes from `dayShort`. */
    dateAt: (date: string, time: string) => `${date}, ${time}`,
    /** "4 октября", "4 октября 2025" */
    day: (day: number, month: number, year?: number) => withYear(`${day} ${MONTHS[month]}`, year),
    /** "4 окт.", "12 сент. 2024" */
    dayShort: (day: number, month: number, year?: number) =>
      withYear(`${day} ${MONTHS_SHORT[month]}`, year),
    /** "Суббота, 4 октября" — the date line on Home. */
    long: (weekday: number, day: number, month: number) =>
      `${WEEKDAYS[weekday]}, ${day} ${MONTHS[month]}`,
    /** "5–11 октября" — a week inside one month. */
    rangeInMonth: (startDay: number, endDay: number, month: number) =>
      `${startDay}–${endDay} ${MONTHS[month]}`,
    /** "29 сентября – 5 октября" — a week across two months. */
    range: (startDay: number, startMonth: number, endDay: number, endMonth: number) =>
      `${startDay} ${MONTHS[startMonth]} – ${endDay} ${MONTHS[endMonth]}`,
  },
  duration: {
    /** "45 мин", "2 ч 30 мин" (formatMinutes and the big-number cards). */
    minute: "мин",
    hour: "ч",
    /** Chart ticks: "45м", "2ч", "2ч30". */
    compactMinute: "м",
    compactHour: "ч",
    /** In sentences, accusative: "вы вернули себе 1 час 30 минут". */
    hours: { one: "час", few: "часа", many: "часов", other: "часа" } as PluralForms,
    minutes: { one: "минуту", few: "минуты", many: "минут", other: "минуты" } as PluralForms,
  },
  greeting: {
    morning: "Доброе утро",
    afternoon: "Добрый день",
    evening: "Добрый вечер",
    night: "Доброй ночи",
  },
  number: {
    /** Thousands separator: "12 480". */
    group: " ",
    /** Decimal separator: "1,5". */
    decimal: ",",
  },
  /** Counted words: countOf(3, m().common.units.days) → "3 дня". */
  units: {
    days: { one: "день", few: "дня", many: "дней", other: "дня" } as PluralForms,
    entries: { one: "запись", few: "записи", many: "записей", other: "записи" } as PluralForms,
    wins: { one: "победа", few: "победы", many: "побед", other: "победы" } as PluralForms,
    times: { one: "раз", few: "раза", many: "раз", other: "раза" } as PluralForms,
  },
};

export type Messages = typeof ru;
