import { pluralize } from "../../../utils/date";

/**
 * coach — Russian. The source of truth for this area's messages: the other languages must have
 * exactly the same keys (and the same parameters for function messages).
 *
 * The on-device coach speaks to the user as "ты", calmly and without gendered past-tense verbs
 * ("ты устал" → "не было сил"), so the same sentence fits everyone. The cards around it (the
 * badge, buttons) address the user as "вы", like the rest of the app.
 *
 * Function messages get facts, never ready-made Russian words: weekdays come as Monday-first
 * indexes, counts as numbers, times and durations as already formatted strings, a reason as its
 * catalog texts. Arrays are the phrasings of one fact; the coach picks one by a stable seed, so
 * each language may have its own number of them.
 */

// ---------------------------------------------------------------------------
// Russian language kit (also re-exported by src/coach/language.ts)
// ---------------------------------------------------------------------------

export const SLIP_FORMS = ["срыв", "срыва", "срывов"] as const;
export const DAY_WORD_FORMS = ["день", "дня", "дней"] as const;
export const WEEK_FORMS = ["неделя", "недели", "недель"] as const;
export const TIME_FORMS = ["раз", "раза", "раз"] as const;
export const REPLACEMENT_WORD_FORMS = ["замена", "замены", "замен"] as const;
export const WALK_FORMS = ["прогулка", "прогулки", "прогулок"] as const;
export const EVENING_FORMS = ["вечер", "вечера", "вечеров"] as const;

/** "3 срыва", "1 день" — a number with its word, never broken across lines. */
export const count = (value: number, forms: readonly [string, string, string]) =>
  `${value}\u00A0${pluralize(value, forms)}`;

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

/** A reason as the coach words it: the catalog's texts of a trigger (`getTrigger(id)`). */
export interface Cause {
  /** "усталость" — "основная причина — усталость". */
  noun: string;
  /** "из-за усталости" — "срывы чаще всего из-за усталости". */
  because: string;
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export const ru = {
  /** The briefing's greeting by the hour. */
  greeting: {
    morning: "Доброе утро",
    afternoon: "Добрый день",
    evening: "Добрый вечер",
    night: "Доброй ночи",
  },

  /** Keeps "6 из 14" and "21:00 —" from breaking across lines. */
  tidy: (text: string) =>
    text.replace(/(\d) из (\d)/g, "$1\u00A0из\u00A0$2").replace(/(\d) —/g, "$1\u00A0—"),

  /** What a rephrased sentence must not lose or add (src/coach/phrasing.ts). */
  guard: {
    /** Words about the technology, besides the Latin names checked for every language. */
    forbidden:
      /(^|[^A-Za-zА-Яа-яЁё])ИИ(?![A-Za-zА-Яа-яЁё])|искусствен|нейросет|языков[а-яё]* модел/i,
    /** Monday-first: every form of each weekday the coach's sentences use. */
    weekdays: [
      /понедельник/i,
      /вторник/i,
      /(^|[^A-Za-zА-Яа-яЁё])сред(?:а|у|ы|е|ам|ой|ами|ах)(?![A-Za-zА-Яа-яЁё])/i,
      /четверг/i,
      /пятниц/i,
      /суббот/i,
      /воскресен/i,
    ],
  },

  briefing: {
    /** Why today's risk is what it is. */
    risk: {
      hardWeekday: (day: number, bad: number, active: number) =>
        `${capitalize(weekday(day, "dativePlural"))} у тебя чаще всего бывают трудные дни: ${bad} из последних ${genitiveNumber(active)} ${weekday(day, "genitivePlural")}.`,
      calmWeekday: (day: number, bad: number, active: number) =>
        `${capitalize(weekday(day, "accusative"))} срывы обычно случаются редко: трудных дней — ${bad} из последних ${genitiveNumber(active)}.`,
      recentSlips: (slips: number) =>
        `За последние три дня было ${count(slips, SLIP_FORMS)} — импульсы сейчас сильнее обычного.`,
      oneRecentSlip: "За последние три дня был один срыв.",
      /** Durations come formatted: "1 ч 20 мин". */
      yesterdayOver: (scroll: string, limit: string) =>
        `Вчера лента заняла ${scroll} — больше лимита в ${limit}.`,
      todayOver: (scroll: string, limit: string) =>
        `Сегодня лимит уже исчерпан: ${scroll} из ${limit}.`,
      todaySlip: "Сегодня уже был срыв.",
      streak: (days: number) =>
        `${capitalize(count(days, DAY_WORD_FORMS))} подряд ты держишься в пределах лимита.`,
      heavierWeek: (recent: string, previous: string) =>
        `Последняя неделя тяжелее предыдущей: в среднем ${recent} ленты в день против ${previous}.`,
      lighterWeek: (recent: string, previous: string) =>
        `Последняя неделя легче предыдущей: в среднем ${recent} ленты в день против ${previous}.`,
      calmWeek: "За последнюю неделю не было ни одного срыва.",
      noSignals: (slips: number) =>
        `Явных сигналов риска сегодня нет: за неделю ${count(slips, SLIP_FORMS)}, без серий подряд.`,
    },
    /** How yesterday's advice went. */
    memory: {
      workedEvening: "Вчерашний совет сработал: вечер прошёл без срывов.",
      workedDay: "Вчерашний совет сработал: день прошёл без срывов и в пределах лимита.",
      missed: [
        "Вчера не получилось — это нормально. Сегодня попробуем зайти с другой стороны.",
        "Вчерашний совет не сработал, и это тоже полезно знать. Сегодня — другой подход.",
      ],
    },
  },

  /** What the coach noticed in the records. Times come formatted: "21:00". */
  insights: {
    timeAfter: [
      (slips: number, total: number, time: string) =>
        `За последние четыре недели ${slips} из ${total} срывов случились после ${time}.`,
      (slips: number, total: number, time: string) =>
        `Большинство срывов — ${slips} из ${total} за последние четыре недели — начинаются после ${time}.`,
    ],
    timeWindow: (from: string, to: string, slips: number, total: number) =>
      `Срывы чаще всего случаются между ${from} и ${to}: ${slips} из ${total} за последние четыре недели.`,
    topReason: [
      (cause: Cause, slips: number, total: number) =>
        `Основная причина последних срывов — ${cause.noun}: ${slips} из ${total}.`,
      (cause: Cause, slips: number, total: number) =>
        `Чаще всего в последние три недели срывы случались ${cause.because}: ${slips} из ${total}.`,
    ],
    recurringWeekday: (weeks: number, day: number) =>
      `Это уже ${ordinalFeminine(weeks)} неделя подряд, когда ${weekday(day, "nominative")} остаётся самым тяжёлым днём.`,
    hardWeekday: (day: number, bad: number, active: number) =>
      `${capitalize(weekday(day, "nominative"))} — самый трудный день: ${bad} из последних ${genitiveNumber(active)} ${weekday(day, "genitivePlural")} прошли со срывом или выше лимита.`,
    calmWeekdayNone: (day: number, active: number) =>
      `${capitalize(weekday(day, "accusative"))} вероятность срыва минимальна: из последних ${genitiveNumber(active)} ${weekday(day, "genitivePlural")} трудных не было ни разу.`,
    calmWeekday: (day: number, bad: number, active: number) =>
      `${capitalize(weekday(day, "accusative"))} срывы случаются реже всего: из последних ${genitiveNumber(active)} ${weekday(day, "genitivePlural")} трудный день выпал только ${count(bad, TIME_FORMS)}.`,
    walksNoSlips: (walks: number) =>
      `За последние четыре недели было ${count(walks, WALK_FORMS)} — и ни после одной в ближайшие три часа не случилось срыва.`,
    walksFewSlips: (slipsAfter: number, walks: number) =>
      `После прогулок срывы почти не случаются: лишь ${slipsAfter} из ${count(walks, WALK_FORMS)} ${slipsAfter % 10 === 1 && slipsAfter % 100 !== 11 ? "закончилась" : "закончились"} лентой в ближайшие три часа.`,
    /** Percent of days, whole numbers. */
    replacementsNoSlips: (withoutRate: number) =>
      `В дни, когда ты делаешь хотя бы одну замену, срывов не было ни разу, а без замен трудными были ${withoutRate}% дней.`,
    replacementsFewer: (withRate: number, withoutRate: number) =>
      `В дни с заменами трудных дней заметно меньше: ${withRate}% против ${withoutRate}% в остальные дни.`,
    scrollDownSteady: (average: string, change: number) =>
      `Последние две недели — устойчивый прогресс: лента занимает в среднем ${average} в день, на ${change}% меньше, чем раньше, и срывов не прибавилось.`,
    scrollDown: (average: string, change: number) =>
      `Последние две недели лента занимает в среднем ${average} в день — на ${change}% меньше, чем две недели до этого.`,
    scrollUp: (recent: string, previous: string) =>
      `Последние две недели ленты стало больше: в среднем ${recent} в день против ${previous} раньше.`,
    slipsDown: (recent: number, previous: number) =>
      `Срывов стало заметно меньше: ${recent} за последние две недели против ${previous} перед этим.`,
    slipsUp: (recent: number, previous: number) =>
      `За последние две недели срывов стало больше: ${recent} против ${previous} перед этим.`,
    eveningBetter: (time: string, recent: number, previous: number) =>
      `Вечерняя привычка стала лучше, чем месяц назад: после ${time} — ${count(recent, SLIP_FORMS)} за месяц против ${previous} месяцем раньше.`,
    shorterSlips: (recent: string, previous: string) =>
      `Срывы стали короче: в среднем ${recent} против ${previous} двумя неделями раньше.`,
    streakGap: (best: number, gap: number) =>
      `До твоего лучшего результата — ${count(best, DAY_WORD_FORMS)} подряд — осталось ${count(gap, DAY_WORD_FORMS)}.`,
    streakRecord: (days: number) =>
      `Сейчас идёт твоя самая длинная серия: ${count(days, DAY_WORD_FORMS)} подряд в пределах лимита.`,
  },

  /** The day's advice, by rule (src/coach/advice.ts). */
  advice: {
    earlySleep: [
      "Сегодня попробуй лечь на полчаса раньше и оставить телефон заряжаться за пределами спальни.",
      "Сегодня лучше лечь пораньше: уставшему мозгу лента всегда кажется хорошей идеей, а утром — нет.",
    ],
    phoneAway: [
      (time: string) =>
        `Сегодня после ужина убери телефон в другую комнату хотя бы на 15 минут — особенно ближе к ${time}.`,
      (time: string) =>
        `Ближе к ${time} положи телефон экраном вниз в другой комнате и дай вечеру пройти без ленты.`,
    ],
    walkHelps: [
      "После прогулок у тебя почти не бывает срывов. Сегодня, когда потянет в ленту, начни с пяти минут на улице.",
      "Прогулки тебе помогают — это видно по данным. Когда сегодня потянет в ленту, выйди пройтись хотя бы на пять минут.",
    ],
    /** `app` is "TikTok", "Reels" or "Shorts"; null for any feed. */
    walkTry: (app: string | null) =>
      `Когда сегодня потянет в ${app ?? "ленту"}, попробуй заменить ленту короткой прогулкой.`,
    livingAlternative: [
      "Положи на виду одну «живую» альтернативу ленте — книгу, блокнот, гитару. Скуке нужна новизна, а не бесконечная прокрутка.",
      "Подготовь заранее одно дело на случай скуки: страницу книги, короткую задачку, звонок. Тогда ленте будет с чем соревноваться.",
    ],
    moveApps:
      "Убери приложения с лентой с первого экрана. Автопилот срабатывает быстрее мысли — пусть у него будет на шаг больше.",
    moveApp: (app: string) =>
      `Убери ${app} с первого экрана телефона. Автопилот срабатывает быстрее мысли — пусть у него будет на шаг больше.`,
    breatheFirst: [
      "Если сегодня станет тревожно, сначала сделай длинный выдох или SOS-паузу. Лента обещает побег, но тревога потом возвращается.",
      "Когда накатит напряжение, дай себе 15 секунд SOS-паузы, прежде чем открывать ленту. Телу это помогает быстрее, чем видео.",
    ],
    callSomeone:
      "Напиши сегодня одному близкому человеку. Живой разговор греет лучше, чем чужие жизни в ленте.",
    tinyStep:
      "Если сегодня захочется отложить дело, сделай только первый шаг на две минуты. Лента чаще всего нужна, чтобы не начинать.",
    realRest:
      "Выбери сегодня отдых, после которого правда легче: душ, музыку с закрытыми глазами или растяжку на пять минут.",
    keepRhythmLogged: [
      "Риск сегодня низкий — просто держи свой ритм. Если потянет в ленту, пауза всегда под рукой.",
      "Сегодня спокойный день. Ничего не нужно доказывать — просто продолжай как есть.",
    ],
    keepRhythm: [
      "Риск сегодня низкий — просто держи свой ритм. Вечером отметь время в ленте, чтобы серия продолжилась.",
      "Сегодня спокойный день. Не забудь вечером отметить время в ленте — серия держится на этих отметках.",
    ],
    logLearning:
      "Отмечай каждый день, сколько времени ушло на ленту, и записывай срывы. Через несколько дней я смогу говорить о твоих привычках конкретно.",
    logToday:
      "Отметь сегодня, сколько времени ушло на ленту, — так мне будет проще увидеть закономерности.",
    sosReady: [
      "Держи под рукой SOS-паузу: 15 секунд дыхания — и решение снова за тобой.",
      "Если импульс окажется сильным, нажми SOS-паузу. Она не запрещает, а просто даёт время подумать.",
    ],
    /** The day's advice reworded for the whole next week, in the weekly review. */
    forWeek: (tip: string) => tip.replace(/^Сегодня /, "На этой неделе ").replace(/ сегодня/g, ""),
  },

  /** Why this replacement of the day. */
  replacement: {
    helped: (times: number) => `Уже ${count(times, TIME_FORMS)} после неё обходилось без срывов.`,
    matches: (cause: Cause) =>
      `Подходит, когда причина — ${cause.noun}: у тебя так бывает чаще всего.`,
    lastTime: "После неё в последний раз обошлось без срыва.",
  },

  /** The coach's answer after a slip. */
  reflection: {
    understanding: {
      boredom: "Скука — одна из самых частых причин, по которым рука тянется к ленте.",
      fatigue: "Когда нет сил, мозг выбирает самое лёгкое, а лента всегда под рукой.",
      relax:
        "Хотеть отдыха нормально. Просто лента редко даёт тот отдых, за которым к ней приходишь.",
      sleepless: "Когда не спится, экран кажется спасением, но обычно только отодвигает сон.",
      autopilot: "Автопилот срабатывает раньше мысли — это привычка, а не слабость.",
      stress: "Когда тревожно, лента обещает передышку. Понятно, почему к ней тянется рука.",
      loneliness: "Когда одиноко, чужие жизни в ленте ненадолго создают ощущение компании.",
      procrastination: "Лента часто помогает не начинать трудное дело. Так бывает у всех.",
      other: "Разобрать, что случилось, — уже полезный шаг.",
    },
    nextTime: {
      boredom: "В следующий раз попробуй сначала короткую замену — скуке нужна новизна.",
      fatigue: "Сегодня лучше лечь пораньше, чем держаться на силе воли.",
      relax: "В следующий раз попробуй отдых без экрана — хотя бы пять минут.",
      sleepless: "Если снова не будет спаться, приглуши свет и отложи телефон подальше от кровати.",
      autopilot: "Помогает трение: убери приложение с первого экрана, и автопилоту станет сложнее.",
      stress: "В следующий раз начни с длинного выдоха или SOS-паузы — тело успокоится быстрее.",
      loneliness: "В следующий раз попробуй написать кому-то живому — это греет дольше.",
      procrastination: "В следующий раз начни дело с шага на две минуты — дальше обычно легче.",
      other: "Если захочется, добавь пару слов — так проще заметить, что повторяется.",
    },
    thanksForNote: "Спасибо, что рассказываешь своими словами — запомню.",
    noted: "Запомню это.",
    /** The same reason the third (or later) time within two weeks. */
    repeated: (times: number, cause: Cause) =>
      `Это уже ${ordinalMasculine(times)} раз за две недели, когда причина — ${cause.noun}.`,
    twice: "Похожее было и на днях — запомню это.",
    first: "Запомню это: чем честнее заметки, тем точнее мои советы.",
    /** Tiredness or sleeplessness late in the evening. */
    lateEvening: (cause: Cause) =>
      `Поздний вечер и ${cause.noun} — сочетание, в котором лента почти всегда выигрывает.`,
    close: [
      "Один срыв ничего не перечёркивает.",
      "Это один эпизод, а не итог дня.",
      "Завтра будет новый день.",
    ],
  },

  /** The coach's conclusion under the weekly numbers. */
  review: {
    titles: {
      good: "Что получилось",
      worse: "Что ухудшилось",
      habit: "Какая привычка стала лучше",
      weak: "Где лента выигрывает чаще всего",
      next: "Что попробовать на следующей неделе",
    },
    /** `duration` in words: "2 часа 30 минут"; a movie is two hours. */
    savedMovies: (duration: string, movies: number) =>
      `Эта неделя вернула тебе ${duration} — хватило бы на ${movies === 1 ? "целый фильм" : `${movies} фильма`}.`,
    saved: (duration: string) => `Эта неделя вернула тебе ${duration}.`,
    daysInLimit: (inLimit: number, logged: number) =>
      `${inLimit} из ${count(logged, DAY_WORD_FORMS)} — в пределах лимита.`,
    fewerSlips: (now: number, before: number) =>
      `Срывов стало меньше: ${now} против ${before} неделей раньше.`,
    impulses: (percent: number) => `${percent}% импульсов прошли без ленты.`,
    replacements: (replacements: number) =>
      `${capitalize(count(replacements, REPLACEMENT_WORD_FORMS))} вместо ленты.`,
    noWins: [
      "Явных побед на этой неделе немного — зато теперь видно, на что опереться дальше.",
      "Неделя получилась непростой. Это не провал, а данные: по ним уже понятно, где подстелить соломку.",
    ],
    firstWeek: "Сравнивать пока не с чем — это первая неделя с записями.",
    moreSlips: (now: number, before: number) => `Срывов стало больше: ${now} против ${before}.`,
    moreScroll: (now: string, before: string) =>
      `Лента в среднем заняла ${now} в день против ${before} неделей раньше.`,
    heldLess: (now: number, before: number) =>
      `Удерживаться получалось реже: ${now}% против ${before}%.`,
    nothingWorse: "Заметных ухудшений нет.",
    habitFirstWeek: "Сравнивать пока не с чем — через неделю здесь появится динамика.",
    eveningHabit: (time: string, now: number, before: number) =>
      `Вечерняя привычка: после ${time} — ${count(now, SLIP_FORMS)} против ${before} неделей раньше.`,
    reasonHabit: (cause: Cause, now: number, before: number) =>
      `Срывов ${cause.because} стало меньше: ${now} против ${before} неделей раньше.`,
    switchHabit: (now: number, before: number) =>
      `Привычка переключаться крепнет: ${count(now, REPLACEMENT_WORD_FORMS)} против ${before} неделей раньше.`,
    scrollHabit: (now: string, before: string) =>
      `Время в ленте сократилось: ${now} в день против ${before}.`,
    noHabit: "Пока ни одна привычка заметно не сдвинулась — для одной недели это нормально.",
    noWeakSpots: "Слабых мест не видно: за неделю ни одного срыва.",
    /** The week's only slip: its weekday, hour and reason (if given). */
    singleSlip: (day: number, time: string, cause: Cause | null) =>
      `Срыв был один — ${weekday(day, "accusative")} около ${time}${cause ? `, ${cause.because}` : ""}.`,
    /** When most slips happened; each part is null when there is no clear answer. */
    hardest: (day: number | null, time: string | null, cause: Cause | null) => {
      const where = [day !== null ? weekday(day, "accusative") : null, time && `около ${time}`]
        .filter(Boolean)
        .join(" ");
      const why = cause ? ` — обычно ${cause.because}` : "";
      return `Труднее всего ${where || "было в разное время"}${why}.`;
    },
    goal: (tip: string, target: number) =>
      `${tip} И маленькая цель: ${target} из 7 дней в пределах лимита.`,
    logDaily: (tip: string) =>
      `${tip} И попробуй отмечать время в ленте каждый день — так следующий разбор будет точнее.`,
  },

  /** The coach's cards (src/components/coach). */
  ui: {
    badge: "Ваш персональный коуч",
    briefing: {
      learningCaption: "Знакомлюсь с твоими привычками",
      caption: "Брифинг на сегодня",
      learning: (needed: number) =>
        `Пока я собираю информацию — прогноз появится, когда наберётся ${needed} ${pluralize(needed, DAY_WORD_FORMS)} с записями.`,
      progress: (active: number, needed: number) =>
        `Дней с записями: ${active} из ${needed}. Подойдёт любое: время в ленте, SOS-пауза, замена или срыв.`,
      riskTitle: "Риск бесконтрольного скролла сегодня",
      riskA11y: (level: string) => `Риск бесконтрольного скролла сегодня: ${level}`,
      riskLevels: { low: "Низкий", medium: "Средний", high: "Высокий" },
      why: "Почему: ",
      adviceTitle: "Совет на сегодня",
      start: (title: string) => `Начать: ${title}`,
    },
    insightsTitle: "Что видно по записям",
    reflection: {
      title: "Что произошло?",
      subtitle: "Без оценок — только чтобы понять, что повторяется.",
      replyTitle: "Понимаю",
      placeholder: "Или своими словами — необязательно",
      noteA11y: "Что произошло, своими словами",
      done: "Готово",
      notNow: "Не сейчас",
      tryReplacement: (title: string) => `Попробовать: ${title}`,
      thanks: "Спасибо",
    },
    weeklyCaption: "Разбор недели",
  },
};

export type Messages = typeof ru;
