import { selectPlural, type PluralForms } from "../../plural";

/**
 * report — Russian. The source of truth for this area's messages: the other languages must have
 * exactly the same keys (and the same parameters for function messages).
 *
 * The weekly report screen, its charts and the Sunday reminder notification. Durations come in
 * already formatted (formatMinutes / formatMinutesInline), weekdays as their short names.
 */

const forms = (value: PluralForms) => value;
const word = (count: number, value: PluralForms) => selectPlural("ru", count, value);

const DAYS = forms({ one: "день", few: "дня", many: "дней", other: "дня" });
const WINS = forms({ one: "победа", few: "победы", many: "побед", other: "победы" });
const SLIPS = forms({ one: "срыв", few: "срыва", many: "срывов", other: "срыва" });
const IMPULSES = forms({ one: "импульс", few: "импульса", many: "импульсов", other: "импульса" });
const REPLACEMENTS = forms({ one: "замена", few: "замены", many: "замен", other: "замены" });
const TIMES = forms({ one: "раз", few: "раза", many: "раз", other: "раза" });

export const ru = {
  title: "Неделя",
  back: "Назад",
  olderWeek: "Неделей раньше",
  newerWeek: "Неделей позже",

  /** No history at all yet. */
  firstReport: {
    title: "Первый отчёт — в воскресенье",
    text: "Каждое воскресенье вечером ваш персональный коуч разбирает неделю: что получилось, где лента выигрывает и что попробовать дальше. Отмечайте время и срывы — разбору будет на что опереться.",
  },
  /** A week with nothing in it. */
  quietWeek: {
    title: "Тихая неделя",
    text: "За эти дни нет записей: ни побед над импульсом, ни срывов, ни отмеченного времени.",
  },

  /** Accessibility text of a chart column: "Пн: спасено 25 мин". */
  daySaved: (day: string, duration: string) => `${day}: спасено ${duration}`,
  /** "Пн: 1 ч 10 мин" or "Пн: нет записи" (`duration` is null). */
  dayScroll: (day: string, duration: string | null) =>
    `${day}: ${duration === null ? "нет записи" : duration}`,

  saved: {
    label: "Спасено",
    /** Against the previous week; `amount` is formatMinutesInline(). */
    change: (amount: string, more: boolean) =>
      `На ${amount} ${more ? "больше" : "меньше"}, чем неделей раньше.`,
    total: (amount: string) => `Каждая пауза и замена этой недели — ${amount} вашей жизни.`,
    none: "На этой неделе время ещё не спасено — следующая SOS-пауза это исправит.",
    week: "За неделю",
    wins: "Побед",
  },

  metrics: {
    inLimit: "В лимите",
    /** Under the number of days within the limit: "из 5 дней". */
    ofDays: (logged: number) => `из ${logged} ${word(logged, DAYS)}`,
    slips: "Срывы",
    replacements: "Замены",
    streak: "Серия",
    record: (days: number) => `Рекорд — ${days} ${word(days, DAYS)}`,
    /** `delta` comes with its sign: "+2", "−1". */
    vsLastWeek: (delta: string) => `${delta} к прошлой неделе`,
  },

  impulses: {
    label: "Импульсы",
    none: "Импульсов не было.",
    /** `percent` is 0…100. */
    success: (percent: number) => `${percent}% импульсов прошли без ленты.`,
    breakdown: (total: number, wins: number, slips: number) =>
      `${total} ${word(total, IMPULSES)}: ${wins} ${word(wins, WINS)}, ${slips} ${word(slips, SLIPS)}.`,
    byTime: "По времени суток",
    resisted: "Удержались",
    slips: "Срывы",
    /** Accessibility text of a 3-hour slot: "18–21 ч: удержались 2, срывов 1". */
    slot: (from: number, to: number, resisted: number, lost: number) =>
      `${from}–${to} ч: удержались ${resisted}, срывов ${lost}`,
  },

  hardest: {
    header: "Самое трудное",
    noData: "Нет данных",
    day: "Опасный день",
    hour: "Опасное время",
    trigger: "Частая причина",
    /** "2 срыва". */
    slips: (count: number) => `${count} ${word(count, SLIPS)}`,
    /** The day with the most feed minutes, when there were no slips. */
    mostFeed: (duration: string) => `Больше всего ленты: ${duration}`,
    /** The hour with the most urges, when there were no slips. */
    mostPull: (count: number) => `Чаще всего тянет в ленту · ${count} ${word(count, TIMES)}`,
    /** Slips with the top trigger out of all slips: "3 срыва из 5". */
    triggerSlips: (count: number, total: number) => `${count} ${word(count, SLIPS)} из ${total}`,
    noSlips: "Срывов не было",
  },

  feed: {
    label: "Лента по дням",
    none: "Время в ленте на этой неделе не отмечено.",
    /** `average` is formatMinutesInline(). */
    average: (average: string, inLimit: number, logged: number) =>
      `В среднем ${average} в день · ${inLimit} из ${logged} ${word(logged, DAYS)} в пределах лимита.`,
    /** The limit line on the chart; `duration` is formatMinutes(). */
    limit: (duration: string) => `лимит ${duration}`,
  },

  changes: {
    header: "По сравнению с прошлой неделей",
    saved: "Спасено",
    slips: "Срывы",
    success: "Удержались",
    scroll: "Лента в день",
    same: "Без изменений",
  },

  /** A percentage: "80%", "+5%"; `sign` is "", "+" or "−". */
  percent: (value: number, sign = "") => `${sign}${value}%`,

  units: {
    days: DAYS,
    wins: WINS,
    slips: SLIPS,
    replacements: REPLACEMENTS,
  },

  /** The Sunday notification (`services/reportReminder.ts`). */
  reminder: {
    channel: "Недельный отчёт",
    title: "Отчёт за неделю готов",
    body: "Сколько времени вы вернули себе, самые трудные часы и новые достижения.",
  },
};

export type Messages = typeof ru;
