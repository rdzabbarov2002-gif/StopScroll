import { selectPlural, type PluralForms } from "../../plural";

/**
 * journal — Russian. The source of truth for this area's messages: the other languages must have
 * exactly the same keys (and the same parameters for function messages).
 *
 * The Journal screen: the slip form, the patterns card, the Pro analytics charts, the slip
 * history, and the sentences `utils/analytics.ts` writes about the patterns. Weekday indexes are
 * Monday-first (0 = Monday … 6 = Sunday).
 */

const forms = (value: PluralForms) => value;
const word = (count: number, value: PluralForms) => selectPlural("ru", count, value);

const ENTRIES = forms({ one: "запись", few: "записи", many: "записей", other: "записи" });
const SLIPS = forms({ one: "срыв", few: "срыва", many: "срывов", other: "срыва" });

/** "Труднее всего по пятницам." */
const WEEKDAY_PHRASES = [
  "по понедельникам",
  "по вторникам",
  "по средам",
  "по четвергам",
  "по пятницам",
  "по субботам",
  "по воскресеньям",
] as const;

export const ru = {
  title: "Дневник",
  intro:
    "Запишите срыв за 10 секунд — без самокритики. Коуч спросит, что произошло, и со временем покажет, что повторяется.",
  deepAnalytics: "Глубокая аналитика",
  locked: {
    title: "Часы и дни недели, когда лента побеждает",
    text: "Графики срывов по часам и дням, а также разбор: где вы удерживаетесь, а где — нет.",
  },
  empty: {
    title: "Записей пока нет",
    text: "И это отлично. Если лента всё же победит — отметьте это здесь, чтобы увидеть закономерности.",
  },
  history: "История срывов",
  /** The number of slips next to the history header: "5 записей". */
  entries: (count: number) => `${count} ${word(count, ENTRIES)}`,
  showMore: "Показать ещё",
  form: {
    label: "Записать срыв",
    statement: "Лента победила? Это бывает.",
    where: "Где",
    howLong: "Сколько ушло",
    save: "Записать срыв",
  },
  patterns: {
    label: "Закономерности",
    /** Before there are enough slips to describe a pattern. */
    addMore: (count: number) =>
      `Добавьте ещё ${count} ${word(count, ENTRIES)}, и мы покажем, когда и почему лента побеждает чаще всего.`,
    slipsWeek: "Срывов за неделю",
    lostWeek: "Потеряно за неделю",
    resisted: "Устояли",
    percent: (percent: number) => `${percent}%`,
    riskyTime: "Опасное время",
    topApp: "Главная лента",
    /**
     * The analytics summary: `time` is a catalog time-of-day phrase ("по вечерам"), `reason` a
     * trigger's reason ("от скуки"): "Чаще всего срывы случаются по вечерам от скуки."
     */
    summary: (time: string, reason: string) => `Чаще всего срывы случаются ${time} ${reason}.`,
    /** "Пиковый час — 21:00–22:00. Труднее всего по пятницам." */
    detail: (hours: string, weekday: number) =>
      `Пиковый час — ${hours}. Труднее всего ${WEEKDAY_PHRASES[weekday]}.`,
    /** "по пятницам" — `WEEKDAY_PHRASES` in `utils/analytics.ts`. */
    weekdayPhrases: WEEKDAY_PHRASES as readonly [
      string,
      string,
      string,
      string,
      string,
      string,
      string,
    ],
  },
  deep: {
    byHour: "Срывы по часам",
    byWeekday: "Срывы по дням недели",
    noData: "Пока нет данных",
    /** A chart column for screen readers: "21:00–22:00: 3 срыва". */
    columnA11y: (label: string, count: number) => `${label}: ${count} ${word(count, SLIPS)}`,
    /** The chart's readout of the selected column: "21:00–22:00 · 3 срыва". */
    readout: (label: string, count: number) => `${label} · ${count} ${word(count, SLIPS)}`,
    triggers: "Триггеры: удержались или сорвались",
    resisted: "Удержались",
    slips: "Срывы",
    triggersEmpty: "Отмечайте причину в SOS-паузе и в дневнике — здесь появится разбивка.",
    triggerA11y: (label: string, resisted: number, slips: number) =>
      `${label}: удержались ${resisted}, срывов ${slips}`,
  },
  item: {
    noReason: "Причина не указана",
    delete: "Удалить запись",
    reflectA11y: "Разобрать срыв с коучем",
    reflect: "Разобрать",
    confirm: "Удалить эту запись?",
    cancel: "Отмена",
    confirmDelete: "Удалить",
  },
  /** The note of one slip in the web demo's sample data. */
  demoNote: "Открыл «на минутку» перед сном",
};

export type Messages = typeof ru;
