import type { PluralForms } from "../../plural";

/** Keeps a word's plural forms typed as `PluralForms`, so other languages may omit few/many. */
const forms = (value: PluralForms) => value;

/**
 * replacements — Russian. The source of truth for this area's messages: the other languages must have
 * exactly the same keys (and the same parameters for function messages).
 *
 * The screens around replacements and the SOS pause: the Replacements tab, one replacement, the
 * custom-replacement sheet, the pause itself (InterceptScreen) and the win celebration.
 * Durations ("2 мин", "+15 мин") come from `formatMinutes`, so messages take them as text.
 */
export const ru = {
  units: {
    /** "Сегодня 3 замены" */
    replacements: forms({ one: "замена", few: "замены", many: "замен", other: "замены" }),
    /** The word under the big countdown number. */
    seconds: forms({ one: "секунда", few: "секунды", many: "секунд", other: "секунды" }),
  },

  /** Accessibility suffixes appended after "Название, 2 мин". */
  a11y: {
    locked: ", доступно в Pro",
    doneToday: ", сделано сегодня",
  },

  close: "Закрыть",

  /** The Replacements tab. */
  list: {
    title: "Замены",
    add: "Добавить свою замену",
    filterAll: "Все",
    filterMine: "Свои",
    pickLabel: "Подходит сейчас",
    /**
     * The suggestion for the most frequent trigger: `phrase` is this language's
     * `triggerPhrase` (non-empty), `title` the replacement's title.
     */
    pickForTrigger: (phrase: string, title: string) =>
      `Когда тянет в ленту ${phrase}, попробуйте «${title}».`,
    pick: (title: string) => `Попробуйте «${title}» вместо ленты.`,
    /** Fits `pickForTrigger` of the same language; empty → the plain `pick`. */
    triggerPhrase: {
      boredom: "от скуки",
      fatigue: "от усталости",
      stress: "от стресса",
      loneliness: "от одиночества",
      procrastination: "вместо дела",
      autopilot: "на автопилоте",
      relax: "чтобы расслабиться",
      sleepless: "когда не спится",
      other: "",
    },
    start: "Начать",
    emptyTitle: "Пока пусто",
    emptyPro: "Добавьте привычку, которая заряжает именно вас: гитара, отжимания, страница книги.",
    emptyFree: "Свои замены и привычки доступны в Pro.",
    openPro: "Открыть Pro",
    catalog: "Каталог",
    /** The list header; `count` is "3 замены" (countOf with `units.replacements`). */
    today: (count: string) => `Сегодня ${count}`,
  },

  /** The badge on a user's own replacement. */
  card: {
    own: "Своя",
  },

  /** One replacement (ReplacementScreen). */
  detail: {
    notFoundTitle: "Замена не найдена",
    notFoundText: "Возможно, вы её удалили.",
    lockedTitle: "Эта замена — в StopScroll Pro",
    lockedText: "Откройте полный каталог: больше движений, задач и фактов.",
    fact: (index: number, total: number) => `Факт ${index} из ${total}`,
    nextFact: "Следующий факт",
    /** `minutes` is formatMinutes(): "Засчитать победу · +15 мин". */
    countWin: (minutes: string) => `Засчитать победу · +${minutes}`,
    cancel: "Отмена",
    delete: "Удалить",
    deleteOwn: "Удалить свою замену",
    timer: "Таймер",
    timerDone: "Время вышло — отлично!",
    /** Accessibility label of the countdown. */
    secondsLeft: (seconds: number) => `Осталось ${seconds} секунд`,
    again: "Ещё раз",
    /** `duration` is formatMinutes(): "Запустить на 2 мин". */
    startTimer: (duration: string) => `Запустить на ${duration}`,
  },

  /** The sheet for a user's own replacement. */
  custom: {
    title: "Своя замена",
    subtitle: "То, что работает именно для вас: гитара, отжимания, страница книги.",
    name: "Название",
    namePlaceholder: "Например: 10 отжиманий",
    nameA11y: "Название замены",
    how: "Как выполнить",
    howPlaceholder: "Необязательно: пара слов-подсказок",
    howA11y: "Описание замены, необязательно",
    type: "Тип",
    duration: "Длительность",
    save: "Сохранить замену",
  },

  /** The SOS pause (InterceptScreen): the breathing pause and the choice after it. */
  intercept: {
    passed: "Пауза пройдена",
    title: "Импульс ослаб?",
    text: "Вы дали префронтальной коре время включиться. Теперь выбор за вами, а не за алгоритмом.",
    whatTriggered: "Что запустило импульс?",
    /** The header over the suggestions once a trigger is picked. */
    suggestionsFor: {
      boredom: "Замены, когда скука",
      fatigue: "Замены, когда усталость",
      stress: "Замены, когда стресс",
      loneliness: "Замены, когда одиночество",
      procrastination: "Замены, когда прокрастинация",
      autopilot: "Замены, когда автопилот",
      relax: "Замены, когда отдых",
      sleepless: "Замены, когда бессонница",
      other: "Замены, когда другое",
    },
    suggestionsAny: "Замените ленту на 1–3 минуты",
    /** `minutes` is formatMinutes(): "Я переключился · +15 мин". */
    switched: (minutes: string) => `Я переключился · +${minutes}`,
    more: "Ещё 15 секунд",
    logSlip: "Лента победила — записать срыв",
    pause: "Пауза",
    closePause: "Закрыть паузу",
    heading: "15 секунд тишины",
    wave: "Импульс похож на волну. Дайте ей пройти — телефон подождёт.",
    /** Accessibility label of the breathing circle: "Вдох. Осталось 12 секунд". */
    phaseA11y: (phase: string, seconds: number) => `${phase}. Осталось ${seconds} секунд`,
    /** After the exercise title: "Дыхание и заземление · шаг 1 из 3". */
    step: (index: number, total: number) => `шаг ${index} из ${total}`,
  },

  /** The celebration after a win ("+15 мин спасено у ленты"). */
  win: {
    overline: "Импульс побеждён",
    /** Continues the big "+15 мин" above it. */
    saved: "спасено у ленты. Мозг получил честный дофамин — от выбора, а не от скролла.",
    today: "Сегодня",
    total: "Всего спасено",
    /** Followed by the hours of sleep: "Это уже 1,5 часа сна". */
    already: "Это уже",
    back: "Вернуться",
    undo: "Отменить запись",
  },
};

export type Messages = typeof ru;
