import { selectPlural, type PluralForms } from "../../plural";

/**
 * home — Russian. The source of truth for this area's messages: the other languages must have
 * exactly the same keys (and the same parameters for function messages).
 *
 * The Home screen's cards (feed time, limit and streak, saved time, the report and achievement
 * tiles, the replacement of the day). Durations come in already formatted (formatMinutes /
 * formatMinutesInline), weekdays as their short names.
 */

const forms = (value: PluralForms) => value;
const word = (count: number, value: PluralForms) => selectPlural("ru", count, value);

const DAYS = forms({ one: "день", few: "дня", many: "дней", other: "дня" });
const WINS = forms({ one: "победа", few: "победы", many: "побед", other: "победы" });

export const ru = {
  /** The profile button, for screen readers. */
  settings: "Настройки",
  today: "Сегодня",
  yesterday: "Вчера",
  /** A day without a logged feed time, for screen readers. */
  noEntry: "нет записи",
  /** A chart column or a day dot for screen readers: "Пт: 45 мин". */
  dayValue: (day: string, value: string) => `${day}: ${value}`,
  feed: {
    a11y: "Время в ленте, открыть статистику",
    label: "Время в ленте",
    /** The dashed limit line on the week chart. */
    limitLine: (duration: string) => `лимит ${duration}`,
    empty: "Отметьте, сколько времени сегодня ушло на ленту.",
    withinLimit: (duration: string) => `Сегодня в ленте ${duration} — в пределах лимита.`,
    overLimit: (duration: string) => `Сегодня в ленте ${duration} — это выше лимита.`,
    less: (percent: number) => `Сегодня вы провели в ленте на ${percent}% меньше, чем вчера.`,
    more: (percent: number) => `Сегодня вы провели в ленте на ${percent}% больше, чем вчера.`,
    same: "Сегодня в ленте столько же времени, сколько вчера.",
  },
  limit: {
    a11y: "Лимит и серия, открыть статистику",
    label: "Лимит",
    streak: "Серия",
    record: "Рекорд",
    /** The unit after the streak and record numbers. */
    days: DAYS,
    /** A streak of two days or more. */
    streakDays: (days: number) =>
      `${days} ${word(days, DAYS)} подряд вы держитесь в пределах лимита.`,
    firstDay: "Первый день в пределах лимита. Завтра серия продолжится.",
    over: "Сегодня лимит превышен. Завтра — новая серия.",
    start: (limit: string) => `Держитесь в пределах ${limit} в день — и здесь начнётся серия.`,
    /** A day dot for screen readers. */
    dayWithin: "в пределах лимита",
    dayOver: "выше лимита",
  },
  saved: {
    a11y: "Спасённое время, открыть статистику",
    label: "Спасено",
    today: (duration: string, wins: number) =>
      `Сегодня вы вернули себе ${duration} — ${wins} ${word(wins, WINS)} над импульсом.`,
    empty: "Каждая пауза возвращает вам время. Потянет в ленту — нажмите паузу.",
    total: "Всего",
  },
  pick: {
    a11y: (title: string) => `Замена дня: ${title}`,
    label: "Замена дня",
    start: "Начать",
  },
  /** The two tiles under the cards. */
  tiles: {
    a11y: (label: string, title: string, caption: string) => `${label}: ${title}, ${caption}`,
    report: "Отчёт",
    newReport: "Новый отчёт",
    /** Before the first report: when it comes. */
    sunday: "В воскресенье",
    reportSaved: (duration: string) => `Спасено ${duration}`,
    reportPromise: "Коуч разберёт вашу неделю",
    achievements: "Достижения",
    achievementsCount: (earned: number, total: number) => `${earned} из ${total}`,
    firstAchievement: "Первое — после первой паузы",
  },
};

export type Messages = typeof ru;
