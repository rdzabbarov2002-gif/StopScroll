import { selectPlural, type PluralForms } from "../../plural";

const word = (count: number, forms: PluralForms) => selectPlural("ru", count, forms);
const DAYS: PluralForms = { one: "день", few: "дня", many: "дней", other: "дня" };
const WINS: PluralForms = { one: "победа", few: "победы", many: "побед", other: "победы" };

/**
 * widgets — Russian. The source of truth for this area's messages: the other languages must have
 * exactly the same keys (and the same parameters for function messages).
 *
 * The Android Home Screen widgets. The iOS widgets can't run JS and keep their own table of the
 * same texts in targets/widget/Snapshot.swift — change both together. Durations come in already
 * formatted ("1 ч 20 мин").
 */
export const ru = {
  /** Before the app has written any numbers. */
  empty: "Откройте StopScroll, чтобы здесь появились ваши цифры.",
  today: {
    a11y: (saved: string) => `Сегодня спасено ${saved}`,
    label: "Спасено",
    caption: "Сегодня",
    wins: (count: number) => `${count} ${word(count, WINS)} над лентой`,
    noWins: "Пауза вернёт время",
  },
  streak: {
    a11y: (days: number) => `Серия ${days}`,
    label: "Серия",
    /** The small word after the big number: "5 дней". */
    unit: (days: number) => word(days, DAYS),
    active: "в пределах лимита",
    start: "Начните серию сегодня",
  },
  limit: {
    a11yUnlogged: "Лимит: время не отмечено",
    a11yLeft: (left: string) => `Лимит: осталось ${left}`,
    label: "Лимит",
    /** Above the big number: today's limit, what is left of it, or how far it is exceeded. */
    today: "Сегодня",
    left: "Осталось",
    over: "Сверх лимита",
    logPrompt: "Отметьте время за сегодня",
    ofToday: (limit: string) => `из ${limit} на сегодня`,
  },
  ring: {
    /** `used` is null when today isn't logged yet. */
    a11y: (used: string | null, limit: string) =>
      `Лента сегодня: ${used ?? "не отмечено"} из ${limit}`,
    /** Under the minutes in the middle of the ring. */
    of: (limit: string) => `из ${limit}`,
    logPrompt: "Отметьте время",
    over: "Лимит превышен",
    feedToday: "Лента сегодня",
  },
  replacement: {
    a11y: (title: string) => `Вместо ленты: ${title}`,
    label: "Вместо ленты",
    caption: (duration: string) => `${duration} · новая каждые полчаса`,
  },
};

export type Messages = typeof ru;
