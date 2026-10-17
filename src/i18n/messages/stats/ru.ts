import { selectPlural, type PluralForms } from "../../plural";

/**
 * stats — Russian. The source of truth for this area's messages: the other languages must have
 * exactly the same keys (and the same parameters for function messages).
 *
 * The Stats screen and its cards: the feed trend, the time logger, the comparison, the heatmap
 * of days under control and the saved-time equivalents. Durations and dates come in already
 * formatted (formatMinutes / formatMinutesInline / formatDayShort).
 */

const forms = (value: PluralForms) => value;
const word = (count: number, value: PluralForms) => selectPlural("ru", count, value);

const DAYS = forms({ one: "день", few: "дня", many: "дней", other: "дня" });
const WEEKS = forms({ one: "неделю", few: "недели", many: "недель", other: "недели" });
const WINS = forms({ one: "победа", few: "победы", many: "побед", other: "победы" });
const EQUIVALENTS = forms({
  one: "эквивалент",
  few: "эквивалента",
  many: "эквивалентов",
  other: "эквивалента",
});

export const ru = {
  title: "Статистика",
  weeklyReport: "Отчёт за неделю",
  achievements: "Достижения",
  achievementsCount: (earned: number, total: number) => `${earned} из ${total}`,
  today: "Сегодня",
  yesterday: "Вчера",
  /** A day without a logged feed time. */
  noEntry: "нет записи",
  /** "Пт, 9 окт.: 45 мин" — a day and its value, for screen readers and the heatmap caption. */
  dayValue: (day: string, value: string) => `${day}: ${value}`,
  /** The dashed limit line on the charts. */
  limitLine: (duration: string) => `лимит ${duration}`,
  trend: {
    label: "Время в ленте",
    /** The range switch: "7 дней", "30 дней". */
    days: (days: number) => `${days} ${word(days, DAYS)}`,
    average: "В среднем",
    empty: "Пока нет записей",
    /** After the average duration: "1 ч 20 мин в день". */
    perDay: "в день",
  },
  logger: {
    label: "Отметить время",
    question: "Сколько ушло на ленту?",
    hint: "Reels, TikTok, Shorts — всё вместе",
    over: (duration: string) => `Выше лимита на ${duration}`,
    within: (limit: string) => `В пределах лимита ${limit}`,
    minus: "Минус 5 минут",
    plus: "Плюс 5 минут",
    slider: "Минут в ленте за день",
    preset: (duration: string) => `Установить ${duration}`,
    saved: "Записано",
    save: "Записать",
    update: "Обновить запись",
    footnote:
      "Точное время подскажет «Экранное время» на iOS или «Цифровое благополучие» на Android.",
  },
  comparison: {
    label: "Сравнение",
    before: "До StopScroll",
    both: (yesterday: string, today: string) => `Вчера — ${yesterday}, сегодня — ${today}`,
    todayOnly: (today: string) => `Сегодня — ${today}`,
    empty: "Отметьте время за сегодня",
    noData: "нет данных",
    /** A signed change: "−20%", "+15%". */
    change: (sign: string, percent: number) => `${sign}${percent}%`,
    vsYesterday: (change: string) => `${change} к вчера`,
    vsBaseline: (change: string) => `${change} к исходному уровню`,
    sameAsYesterday: "как вчера",
    sameAsBaseline: "на исходном уровне",
  },
  heatmap: {
    label: "Дни под контролем",
    rule: (limit: string) => `День засчитывается, если в ленте не больше ${limit}.`,
    streak: "Серия",
    record: "Рекорд",
    month: "За 30 дней",
    /** The unit after the streak and record numbers. */
    days: DAYS,
    status: {
      great: "меньше половины лимита",
      ok: "в пределах лимита",
      over: "выше лимита",
      empty: "нет записи",
      future: "",
    },
    /** A logged day for screen readers: "45 мин, в пределах лимита". */
    cellValue: (duration: string, status: string) => `${duration}, ${status}`,
    /** The caption under the grid for the tapped day: "45 мин — в пределах лимита". */
    selectedValue: (duration: string, status: string) => `${duration} — ${status}`,
    hint: "Нажмите на день, чтобы увидеть детали.",
    legend: {
      great: "≤ ½ лимита",
      ok: "в лимите",
      over: "выше лимита",
      empty: "нет записи",
    },
    more: (weeks: number) => `Показать ${weeks} ${word(weeks, WEEKS)} истории — в Pro`,
  },
  equivalents: {
    label: "Спасено",
    total: (duration: string) => `За всё время вы вернули себе ${duration}.`,
    empty: "Каждая пауза и замена вернут вам время — оно появится здесь.",
    summary: (wins: number, week: string, session: string) =>
      `${wins} ${word(wins, WINS)} · за 7 дней ${week}. Каждая победа = ${session}, которые обычно уходили бы в ленту.`,
    lockedTitle: (count: number) => `Ещё ${count} ${word(count, EQUIVALENTS)} в Pro`,
    lockedText: "Тренировки, уроки языка и разговоры с близкими.",
  },
};

export type Messages = typeof ru;
