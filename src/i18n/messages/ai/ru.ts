import { selectPlural, type PluralForms } from "../../plural";

/**
 * ai — Russian. The source of truth for this area's messages: the other languages must have
 * exactly the same keys (and the same parameters for function messages).
 *
 * The AI coach on screen: the entry card, the AI tab, the forecast, the analytics and the
 * experiment — the texts built on the device around what ChatGPT wrote. ChatGPT's own texts
 * (causes, conclusions, beliefs, advice) come from the server already in the app's language.
 *
 * Weekday indexes are Monday-first (0 = Monday … 6 = Sunday), month indexes are 0 = January.
 * Parts of the day: "morning" | "day" | "evening" | "night".
 */

type Part = "morning" | "day" | "evening" | "night";
type Focus = Part | "all";

/** A number and its word never break apart: "3 дня". */
const NB = " ";
const word = (value: number, forms: PluralForms) => selectPlural("ru", value, forms);
const count = (value: number, forms: PluralForms) => `${value}${NB}${word(value, forms)}`;
const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const DAYS: PluralForms = { one: "день", few: "дня", many: "дней", other: "дня" };
const SLIPS: PluralForms = { one: "срыв", few: "срыва", many: "срывов", other: "срыва" };
const CASES: PluralForms = { one: "случай", few: "случая", many: "случаев", other: "случая" };
const TIMES: PluralForms = { one: "раз", few: "раза", many: "раз", other: "раза" };
const MONTHS: PluralForms = { one: "месяц", few: "месяца", many: "месяцев", other: "месяца" };
const FILMS: PluralForms = { one: "фильм", few: "фильма", many: "фильмов", other: "фильма" };
const PAGES: PluralForms = { one: "страница", few: "страницы", many: "страниц", other: "страницы" };
const WALKS: PluralForms = {
  one: "прогулка",
  few: "прогулки",
  many: "прогулок",
  other: "прогулки",
};
const ENTRIES: PluralForms = { one: "запись", few: "записи", many: "записей", other: "записи" };
const SHIFTS: PluralForms = {
  one: "рабочая смена",
  few: "рабочие смены",
  many: "рабочих смен",
  other: "рабочей смены",
};

const WEEKDAY = ["понедельник", "вторник", "среда", "четверг", "пятница", "суббота", "воскресенье"];
/** "из последних четырёх вторников" */
const WEEKDAY_GENITIVE_PLURAL = [
  "понедельников",
  "вторников",
  "сред",
  "четвергов",
  "пятниц",
  "суббот",
  "воскресений",
];
/** "во вторник" */
const WEEKDAY_ACCUSATIVE = [
  "в понедельник",
  "во вторник",
  "в среду",
  "в четверг",
  "в пятницу",
  "в субботу",
  "в воскресенье",
];
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
const genitiveNumber = (value: number) => NUMBER_GENITIVE[value] ?? String(value);

const ADVERB: Record<Part, string> = {
  morning: "утром",
  day: "днём",
  evening: "вечером",
  night: "ночью",
};

const MONTH_NAMES = [
  "январь",
  "февраль",
  "март",
  "апрель",
  "май",
  "июнь",
  "июль",
  "август",
  "сентябрь",
  "октябрь",
  "ноябрь",
  "декабрь",
];

export const ru = {
  /** The two answers of a yes/no question from the coach (the first one means "yes"). */
  yes: "Да",
  no: "Нет",

  /** Why a request to the AI server failed — shown under the AI tab's title. */
  errors: {
    offline: "Нет соединения с интернетом. Анализ продолжится, когда сеть появится.",
    timeout: "ChatGPT отвечает слишком долго. Попробуем ещё раз чуть позже.",
    busy: "Сервис сейчас перегружен. Попробуем ещё раз через пару минут.",
    unavailable: "ChatGPT сейчас недоступен. Попробуем ещё раз через пару минут.",
    server: "Сервер AI-коуча недоступен. Попробуем ещё раз позже.",
    unusable: "Ответ ChatGPT не получилось разобрать. Попробуем ещё раз.",
  },

  /** What the coach is doing right now (a line with a spinner). */
  sync: {
    entry: "ChatGPT разбирает запись…",
    deep: "ChatGPT обновляет аналитику по всей истории…",
    translate: "ChatGPT переводит память коуча на новый язык…",
    retry: "Повторить",
    /** "Аналитика обновлена сегодня в 14:05" — `when` is `today` or `onDate`. */
    updated: (when: string) => `Аналитика обновлена ${when}`,
    today: (time: string) => `сегодня в ${time}`,
    /** `date` — "4 октября" in the language's own format. */
    onDate: (date: string, time: string) => `${date} в ${time}`,
  },

  /** Month names on their own ("сентябрь 2026") and dates of the coach's long-term memory. */
  date: {
    month: (month: number, year: number) => `${MONTH_NAMES[month]} ${year}`,
    /** A period of months: "март–май 2026", "ноябрь 2025 – февраль 2026". */
    months: (fromMonth: number, fromYear: number, toMonth: number, toYear: number) =>
      fromYear === toYear && fromMonth === toMonth
        ? `${MONTH_NAMES[fromMonth]} ${fromYear}`
        : fromYear === toYear
          ? `${MONTH_NAMES[fromMonth]}–${MONTH_NAMES[toMonth]} ${toYear}`
          : `${MONTH_NAMES[fromMonth]} ${fromYear} – ${MONTH_NAMES[toMonth]} ${toYear}`,
  },

  /** The home screen card where the user writes what happened before the urge. */
  impulse: {
    label: "Импульс",
    question: "Что произошло перед тем, как захотелось открыть ленту?",
    placeholder: "Опишите своими словами, что произошло...",
    inputA11y: "Что произошло перед тем, как захотелось открыть ленту",
    outcomeLabel: "Чем закончилось — если уже знаете",
    resisted: "Удержались",
    opened: "Открыли ленту",
    save: "Сохранить",
    analysis: "Разбор записи",
    hide: "Скрыть разбор",
    allAnalytics: "Вся AI-аналитика",
    sos: "SOS-пауза",
    notConfigured:
      "Запись сохранена. В этой сборке AI-анализ не подключён, поэтому ChatGPT её не прочитает.",
    needConsent:
      "Запись сохранена на телефоне. Чтобы ChatGPT разобрал её, нужно ваше разрешение на отправку записей.",
    allow: "Разрешить анализ",
    failed: "Не получилось получить разбор от ChatGPT. Запись сохранена.",
    retry: "Повторить",
    analyzing: "Запись сохранена. ChatGPT разбирает её…",
  },

  /** ChatGPT's reading of one entry, as the user saw it on the day. */
  entry: {
    cause: "Причина",
    emotion: "Состояние",
    context: "Ситуация",
    behavior: "Тип поведения",
    /** Between a row's label and its value: "Причина: усталость". */
    colon: ": ",
    notEnough: (missing: string | null) =>
      missing
        ? `Информации пока недостаточно для уверенного вывода: ${missing}`
        : "Информации пока недостаточно для уверенного вывода.",
  },

  /** The list of all entries on the AI tab. */
  history: {
    title: "История записей",
    count: (value: number) => `${value} ${word(value, ENTRIES)}`,
    more: "Показать ещё",
    failed: "Разбор не получен",
    waiting: "Ждёт разбора",
    unclear: "Причина не ясна",
    resisted: " · удержались",
    opened: " · открыли ленту",
    retry: "Повторить разбор",
    confirmDelete: "Удалить запись?",
    cancel: "Отмена",
    delete: "Удалить",
    deleteEntry: "Удалить запись",
  },

  /** The AI tab. */
  screen: {
    overline: "Персональная аналитика",
    title: "AI-коуч",
    preparing: "Анализ готовится",
    startEntry:
      "Начните с записи на главной: что произошло перед тем, как захотелось открыть ленту.",
    studying: "ChatGPT изучает вашу историю — первые выводы появятся здесь сами.",
    moreEntries:
      "Чем больше записей, тем точнее закономерности и прогнозы. Ничего запускать вручную не нужно.",
    notConnected: "Не подключено",
    notConnectedTitle: "AI-анализ в этой сборке не подключён.",
    notConnectedText:
      "Записи сохраняются на телефоне. Когда приложение подключат к серверу AI-коуча, ChatGPT разберёт всю накопленную историю.",
    demoNote:
      "Это пример экрана. В веб-демо ChatGPT не подключён, поэтому тексты ниже — образец, а не анализ ваших данных. В приложении их строит ChatGPT по вашей истории.",
  },

  /** Permission before anything is sent to ChatGPT. */
  consent: {
    label: "Ваше разрешение",
    declined: "AI-анализ выключен — записи остаются только на телефоне.",
    ask: "Чтобы AI-коуч изучал ваши привычки, нужно разрешение",
    text: "Ваши записи, ответы на вопросы и статистика привычек (время в ленте, срывы, победы — без имени, почты и контактов) будут отправляться через сервер StopScroll в OpenAI, где их анализирует ChatGPT. По правилам OpenAI данные, отправленные через API, не используются для обучения моделей. Память коуча и история хранятся только на вашем телефоне. Выключить можно в любой момент в Настройках.",
    allow: "Разрешить анализ",
    notNow: "Не сейчас",
  },

  /** An occasional question from the coach. */
  question: {
    label: "Вопрос для точности",
    skip: "Пропустить",
  },

  /** On the home screen: the most useful lines of the AI analytics. */
  highlights: {
    label: "Главное от AI-коуча",
    a11y: "Главное от AI-коуча, открыть аналитику",
  },

  /** Today's forecast: the card and the sentences computed on the device. */
  forecast: {
    title: "Прогноз на сегодня",
    probabilityA11y: (percent: number) =>
      `Вероятность открытия ленты сегодня: ${percent} процентов`,
    probabilityCaption: "вероятность открытия ленты сегодня",
    helps: "Что поможет сегодня",
    updatedAt: (time: string) => `Обновлено в ${time}`,
    analytics: "Аналитика",
    soon: "Прогноз на сегодня скоро появится.",

    /** The headline when the risk is high, for the part of the day it is about. */
    hardPart: {
      morning: "Утро, скорее всего, будет непростым.",
      day: "День, скорее всего, будет непростым.",
      evening: "Вечер, скорее всего, будет непростым.",
      night: "Ночь, скорее всего, будет непростой.",
    } satisfies Record<Part, string>,
    /** `rest` — the feed already won today, so it is about the rest of the day. */
    medium: (rest: boolean, part: Part | null) =>
      `${rest ? "Остаток дня" : "День"} может быть непростым${part ? ` — особенно ${ADVERB[part]}` : ""}.`,
    lowRest: "Похоже, остаток дня пройдёт спокойнее.",
    low: "Похоже, день будет спокойным.",
    preliminary: "Прогноз пока предварительный: истории ещё мало.",
    passedHeadline: "Самое трудное время сегодня позади.",
    passed: (from: string, to: string) =>
      `Опасное время ${from}–${to} уже позади, и сегодня оно прошло спокойно.`,

    overLimit: (feed: string, limit: string) => `Сегодня лимит уже исчерпан: ${feed} из ${limit}.`,
    slipToday: "Сегодня уже был срыв — в такие дни импульсы обычно сильнее.",
    openedToday: "Сегодня лента уже была открыта — в такие дни импульсы обычно сильнее.",
    window: (inWindow: number, total: number, from: string, to: string) =>
      `${inWindow} из ${total} срывов и записей за два месяца — между ${from} и ${to}.`,
    weekdayHard: (hard: number, of: number, weekday: number) =>
      `${hard} из последних ${genitiveNumber(of)} ${WEEKDAY_GENITIVE_PLURAL[weekday]} были трудными.`,
    weekdayCalm: (hard: number, of: number, weekday: number) =>
      `${cap(WEEKDAY_ACCUSATIVE[weekday]!)} обычно спокойно: трудных дней — ${hard} из последних ${genitiveNumber(of)}.`,
    afterHardUsuallyHard: (hard: number, of: number) =>
      `Вчера был трудный день, а после таких дней следующий бывает трудным в ${hard} из ${of} случаев.`,
    afterHardUsuallyFine: (hard: number, of: number) =>
      `Вчера был трудный день, но обычно вы быстро возвращаетесь: после таких дней трудным бывает ${hard} из ${of}.`,
    afterHard: "Вчера был трудный день.",
    recentSlips: (slips: number) =>
      `За последние три дня было ${count(slips, SLIPS)} — импульсы сейчас сильнее обычного.`,
    streak: (days: number) => `${cap(count(days, DAYS))} подряд вы держитесь в пределах лимита.`,
    calmWeek: "За последнюю неделю лента ни разу не победила.",
    plan: (from: string, to: string) =>
      `Решите заранее, чем займёте время с ${from} до ${to} вместо ленты.`,
    needDays: (min: number, have: number) =>
      `Для прогноза нужно хотя бы ${min} дней с записями за четыре недели — пока их ${have}.`,
    noSignals: "Явных сигналов риска сегодня нет.",
    windowRest: (to: string) =>
      `Если удастся больше не открывать ленту до ${to}, остаток дня пройдёт спокойнее.`,
    windowDay: (to: string) =>
      `Если удастся не открыть ленту до ${to}, шанс спокойного дня заметно вырастет.`,
    basis: (days: number) => `история за ${count(days, DAYS)}`,
  },

  /** The AI tab's analytics: section titles and the sentences computed on the device. */
  analytics: {
    conclusion: "Общий вывод",
    warnings: "Опасные периоды",
    changes: "Что меняется",
    causes: "Частые причины",
    situations: "Повторяющиеся ситуации",
    emotions: "Эмоциональные состояния",
    times: "Опасное время и дни",
    hypotheses: "Гипотезы",
    confidence: {
      low: "Слабые признаки",
      medium: "Заметные признаки",
      high: "Сильные признаки",
    },
    /** After the confidence of a hypothesis that is not confirmed yet / confirmed. */
    notFact: "пока предположение, не факт",
    confirmed: "подтверждено проверкой",
    self: "Вы против себя",
    saved: "Время, которое вы вернули",
    memory: "Долгая память",

    conclusionPending: "Выводы появятся после следующего анализа истории.",
    fewDays: "Данных пока немного — выводы станут точнее через пару недель.",
    fewEntries: "Записей пока немного: причины и ситуации станут точнее, когда их будет больше.",

    /** Under a cause: "6 из 9 случаев, чаще всего вечером". */
    causeNote: (value: number, of: number, part: Part | null) =>
      `${value} из ${count(of, CASES)}${part ? `, чаще всего ${ADVERB[part]}` : ""}`,

    slipsDown: (recent: number, previous: number) =>
      `За две недели срывов стало меньше: ${recent} против ${previous} в предыдущие две.`,
    slipsUp: (recent: number, previous: number) =>
      `За две недели срывов стало больше: ${recent} против ${previous} в предыдущие две.`,
    feedDown: (week: string, before: string) =>
      `В ленте стало меньше времени: в среднем ${week} в день за неделю против ${before} неделей раньше.`,
    feedUp: (week: string, before: string) =>
      `В ленте стало больше времени: в среднем ${week} в день за неделю против ${before} неделей раньше.`,
    heldMore: (resisted: number, of: number, before: number, beforeOf: number) =>
      `Вы чаще удерживаетесь: ${resisted} из ${of} записей за две недели против ${before} из ${beforeOf} раньше.`,
    heldLess: (resisted: number, of: number, before: number, beforeOf: number) =>
      `Удерживаться стало труднее: ${resisted} из ${of} записей за две недели против ${before} из ${beforeOf} раньше.`,

    calmSame: (percent: number) =>
      `Спокойных дней в этом месяце столько же, сколько в прошлом: ${percent}%.`,
    calmVs: (percent: number, before: number) =>
      `В этом месяце спокойных дней ${percent}% против ${before}% в прошлом.`,
    /** `usual` — slips per week, already formatted ("1,5"). */
    weekVsUsual: (week: number, usual: string) =>
      `За последние 7 дней — ${count(week, SLIPS)}; в прошлом месяце в среднем было ${usual} в неделю.`,
    streakRecord: (days: number) => `Текущая серия — ${count(days, DAYS)}, это ваш рекорд.`,
    streakBest: (days: number, best: number) =>
      `Текущая серия — ${count(days, DAYS)}, лучшая — ${count(best, DAYS)}.`,

    hardestMoved: (before: number, now: number) =>
      `Самый трудный день недели раньше — ${WEEKDAY[before]}, сейчас — ${WEEKDAY[now]}.`,
    partMoved: (before: Part, now: Part) =>
      `Срывы сместились: раньше чаще ${ADVERB[before]}, сейчас — ${ADVERB[now]}.`,
    feedVsMonthsAgo: (now: string, before: string, months: number) =>
      `Среднее время в ленте — ${now} в день против ${before} ${count(months, MONTHS)} назад.`,
    bestStreak: (days: number) => `Лучшая серия — ${count(days, DAYS)} в пределах лимита.`,
    longestCalm: (days: number) => `Самый долгий период без срывов — ${count(days, DAYS)}.`,
    /** Two years side by side: the share of hard days. */
    years: (before: number, beforeShare: number, year: number, share: number) =>
      `В ${before} году трудных дней было ${beforeShare}%, в ${year} — ${share}%.`,

    /** A month of the user's story, as the coach summed it up: "Сентябрь 2026: …". */
    chapter: (month: string, note: string, calm: number | null) =>
      `${cap(month)}: ${note}${calm === null ? "" : ` Спокойных дней — ${calm}%.`}`,
    /** The coach corrected itself. `was` and `now` come without a final period. */
    correction: (was: string, now: string, why: string | null) =>
      `Раньше: ${was}. Теперь точнее: ${now}${why ? ` (${why})` : ""}.`,
    /** Something that was true only for a while: `text` without a final period. */
    scoped: (text: string, period: string) => `${text} (${period}; сейчас уже не так).`,
    event: (date: string, note: string) => `${date}: ${note}`,

    savedHeadline: (duration: string) => `Вы вернули себе ${duration}.`,
    films: (films: number) => `около ${count(films, FILMS)}`,
    oneShift: "целая рабочая смена",
    shifts: (shifts: number) => count(shifts, SHIFTS),
    walks: (walks: number) => `${count(walks, WALKS)} по 30 минут`,
    pages: (pages: number) => `${count(pages, PAGES)} книги`,

    windowNote: (inWindow: number, total: number) =>
      `Здесь ${inWindow} из ${total} срывов и записей за два месяца.`,
    weekdayTitle: (weekday: number) => cap(WEEKDAY[weekday]!),
    weekdayNote: (hard: number, of: number, weekday: number) =>
      `Трудными были ${hard} из последних ${genitiveNumber(of)} ${WEEKDAY_GENITIVE_PLURAL[weekday]}.`,
    afterRuns: (slipped: number, runs: number) =>
      `После спокойных серий от 4 дней трудный день в ближайшие три дня случался ${slipped} ${word(slipped, TIMES)} из ${runs}.`,
  },

  /** The weekly experiment ("AI Challenge"). */
  challenge: {
    label: "AI Challenge",
    proposed: "Попробуем маленький эксперимент",
    day: (day: number, of: number) => `Эксперимент · день ${day} из ${of}`,
    pastResult: "Итог прошлого эксперимента",
    result: "Итог эксперимента",
    duration: (days: number) => `На ${days} ${word(days, DAYS)}.`,
    try: "Попробовать",
    notNow: "Не сейчас",
    daysA11y: "Дни эксперимента",
    todayQuestion: "Получилось сегодня?",
    managed: "Получилось",
    missed: "Не вышло",
    managedToday: "Сегодня получилось — отмечено.",
    missedToday: "Сегодня не вышло — это тоже данные для итога.",
    reviewing: "Эксперимент завершён. Сравниваем дни до и во время эксперимента…",
    finished: "Эксперимент завершён.",

    /** The result, counted on the device when the experiment ends. */
    review: {
      managed: (days: number, of: number) => `Получилось ${count(days, DAYS)} из ${of}.`,
      noData: "Записей за дни эксперимента нет, поэтому сравнить пока не с чем.",
      /** `change` — percent against the days before (null — not worth showing). */
      losses: (focus: Focus, during: number, before: number, days: number, change: number | null) =>
        `Лента побеждала${focus === "all" ? "" : ` ${ADVERB[focus]}`} ${count(during, TIMES)} за ${count(days, DAYS)} эксперимента против ${count(before, TIMES)} за ${count(days, DAYS)} до него${
          change === null ? "" : ` (${change > 0 ? "+" : "−"}${Math.abs(change)}%)`
        }.`,
      feed: (during: string, before: string) =>
        `Время в ленте — в среднем ${during} в день против ${before}.`,
      fewBefore: "Данных до эксперимента мало, поэтому сравнение предварительное.",
      helps: "Похоже, это помогает — подход стоит оставить.",
      same: "Разницы пока не видно — возможно, нужно больше дней.",
      worse: "В эти дни было не легче — значит, дело, скорее всего, в другом.",
    },
  },

  /**
   * The web preview's sample of the AI tab (no server): clearly labeled as an example on screen.
   * Written as ChatGPT would write it in this language.
   */
  demo: {
    forecast: {
      headline: "Вечер, скорее всего, будет непростым.",
      reasons: [
        "Последние три воскресенья вы открывали ленту между 21:00 и 23:00.",
        "За последние три дня было три срыва — больше, чем обычно для этой недели.",
        "Большинство срывов за месяц случались поздно вечером после усталости.",
      ],
      window: "Если удастся не открыть ленту до 23:00, шанс спокойного дня заметно вырастет.",
      advice: "Положите телефон заряжаться в другой комнате около 21:00.",
      basis: "пример",
    },
    analytics: {
      conclusion:
        "Похоже, лента чаще всего побеждает не от скуки, а от вечерней усталости после длинного дня. Днём вы держитесь заметно лучше, чем месяц назад.",
      dataNote: "Для выводов о выходных пока мало записей.",
      warning: "После серии из 5+ спокойных дней у вас дважды начинался откат в выходные.",
      improvement: "Последние две недели вы всё реже открываете ленту днём: 2 срыва против 6.",
      worsening: "Поздние вечера стали тяжелее: 4 из 5 последних срывов — после 22:00.",
      habitChange: "За месяц больше всего изменилась привычка после работы — она стала спокойнее.",
      causes: [
        { title: "Усталость", note: "Чаще всего — после 21:00 в будни." },
        { title: "Скука", note: "В основном днём, в перерывах." },
        { title: "Автопилот", note: "Открытие без повода, сразу после разблокировки." },
      ],
      situation: { title: "После работы, дома", note: "Повторяется в 6 из 14 записей." },
      emotion: { title: "Опустошённость", note: "Встречается почти во всех вечерних записях." },
      time: { title: "21:00–23:00", note: "Здесь 15 из 17 срывов за месяц." },
      weekday: { title: "Воскресенье", note: "Три недели подряд — самый тяжёлый день." },
      hypothesis:
        "Похоже, прогулки вечером уменьшают вероятность открытия ленты: после пяти прогулок срывов не было.",
      selfComparison: "За месяц спокойных дней стало на 24% больше, чем в прошлом.",
      longTerm: [
        "Раньше: лента побеждает от скуки в обед. Теперь точнее: от усталости поздним вечером (так говорят записи за последний месяц).",
        "Лучшая серия — 9 дней в пределах лимита.",
      ],
      savedHeadline: "Вы вернули почти 17 часов.",
      equivalents: ["около восьми фильмов", "две рабочие смены", "34 прогулки по 30 минут"],
    },
    challenge: {
      title: "Телефон вне спальни",
      description: "Три вечера подряд оставляйте телефон заряжаться за пределами спальни с 22:30.",
      expectation: "Посмотрим, станет ли меньше поздних срывов.",
    },
  },
};

export type Messages = typeof ru;
