import type {
  ExerciseId,
  FeedApp,
  GateApp,
  IconName,
  Replacement,
  ReplacementCategory,
  TimeOfDay,
  TriggerId,
} from "./types";

// ---------------------------------------------------------------------------
// Triggers
// ---------------------------------------------------------------------------

export type TriggerTone = "amber" | "sky" | "rose" | "violet" | "teal" | "slate";

export interface TriggerOption {
  id: TriggerId;
  label: string;
  icon: IconName;
  /** Shown under the label on the quick cards. */
  hint: string;
  tone: TriggerTone;
  /** Completes "Чаще всего срывы случаются по вечерам …". */
  reason: string;
  advice: string;
}

export const TRIGGERS: readonly TriggerOption[] = [
  {
    id: "boredom",
    label: "Скука",
    icon: "hourglass-outline",
    hint: "Хочется новизны",
    tone: "amber",
    reason: "от скуки",
    advice:
      "Скука — это голод по новизне, а лента кормит его пустыми калориями. Держите под рукой одну «живую» новизну: книгу, задачку, новый маршрут.",
  },
  {
    id: "fatigue",
    label: "Усталость",
    icon: "battery-dead-outline",
    hint: "Нет сил ни на что",
    tone: "sky",
    reason: "из-за усталости",
    advice:
      "Уставший мозг выбирает самое лёгкое. Лента не восстанавливает — она добивает. Попробуйте 3 минуты с закрытыми глазами или стакан воды и окно.",
  },
  {
    id: "stress",
    label: "Стресс",
    icon: "thunderstorm-outline",
    hint: "Хочется сбежать",
    tone: "rose",
    reason: "из-за стресса",
    advice:
      "Лента обещает побег, но после неё тревога возвращается сильнее. Сначала тело: длинный выдох, движение, холодная вода — потом решения.",
  },
  {
    id: "loneliness",
    label: "Одиночество",
    icon: "person-outline",
    hint: "Не хватает людей",
    tone: "violet",
    reason: "из-за одиночества",
    advice:
      "Чужие жизни в ленте не заменят контакт. Одно короткое сообщение живому человеку даёт больше, чем час видео.",
  },
  {
    id: "procrastination",
    label: "Прокрастинация",
    icon: "time-outline",
    hint: "Откладываю дело",
    tone: "teal",
    reason: "когда вы откладываете дела",
    advice:
      "Лента — самый удобный способ не начинать. Уменьшите задачу до шага на 2 минуты и сделайте только его.",
  },
  {
    id: "autopilot",
    label: "Автопилот",
    icon: "repeat-outline",
    hint: "Рука сама открыла",
    tone: "slate",
    reason: "на автопилоте",
    advice:
      "Привычка срабатывает раньше мысли. Уберите приложения с первого экрана и положите телефон экраном вниз — трение ломает автопилот.",
  },
];

/** The three quick cards on the home screen. */
export const QUICK_TRIGGER_IDS: readonly TriggerId[] = ["boredom", "fatigue", "stress"];

export function getTrigger(id: TriggerId): TriggerOption {
  return TRIGGERS.find((trigger) => trigger.id === id) ?? TRIGGERS[0]!;
}

// ---------------------------------------------------------------------------
// Feed apps
// ---------------------------------------------------------------------------

export const FEED_APPS: readonly { id: FeedApp; label: string; icon: IconName }[] = [
  { id: "tiktok", label: "TikTok", icon: "logo-tiktok" },
  { id: "reels", label: "Reels", icon: "logo-instagram" },
  { id: "shorts", label: "Shorts", icon: "logo-youtube" },
  { id: "other", label: "Другое", icon: "phone-portrait-outline" },
];

export function getFeedApp(id: FeedApp) {
  return FEED_APPS.find((app) => app.id === id) ?? FEED_APPS[FEED_APPS.length - 1]!;
}

// ---------------------------------------------------------------------------
// The pause before a feed app
// ---------------------------------------------------------------------------

export interface GateAppInfo {
  id: GateApp;
  /** The app the feed lives in. */
  appName: string;
  icon: IconName;
  /** URL scheme that opens the app on iOS. */
  scheme: string;
  /** Universal / app link: opens the app when it is installed, the site otherwise. */
  webUrl: string;
  /** Android package names (TikTok ships under two of them). */
  packages: readonly string[];
}

export const GATE_APPS: readonly GateAppInfo[] = [
  {
    id: "tiktok",
    appName: "TikTok",
    icon: "logo-tiktok",
    scheme: "tiktok://",
    webUrl: "https://www.tiktok.com/",
    packages: ["com.zhiliaoapp.musically", "com.ss.android.ugc.trill"],
  },
  {
    id: "reels",
    appName: "Instagram",
    icon: "logo-instagram",
    scheme: "instagram://",
    webUrl: "https://www.instagram.com/reels/",
    packages: ["com.instagram.android"],
  },
  {
    id: "shorts",
    appName: "YouTube",
    icon: "logo-youtube",
    scheme: "youtube://",
    webUrl: "https://www.youtube.com/shorts/",
    packages: ["com.google.android.youtube"],
  },
];

export function getGateApp(id: GateApp): GateAppInfo {
  return GATE_APPS.find((app) => app.id === id) ?? GATE_APPS[0]!;
}

export const isGateApp = (value: unknown): value is GateApp =>
  typeof value === "string" && GATE_APPS.some((app) => app.id === value);

/** After "open anyway" the app opens without a pause for this long. */
export const GATE_ALLOW_MINUTES = 5;

/** Thoughts shown on the pause before a feed app, one at random. */
export const GATE_THOUGHTS: readonly string[] = [
  "Лента не закончится. А этот вечер — да.",
  "Через несколько секунд желание обычно становится слабее.",
  "Вы открываете приложение или оно открывает вас?",
  "Скука — это сигнал, а не приказ.",
  "Алгоритм знает, что вы посмотрите дальше. Удивите его.",
  "Самое интересное сегодня случится не в телефоне.",
  "Импульс длится меньше минуты. Решение — дольше.",
  "Что вы на самом деле хотите сейчас почувствовать?",
  "Один отказ — это маленькая победа. Из них складываются дни.",
  "Отдых — это то, после чего становится легче. Лента так умеет редко.",
  "Пять минут ленты почти никогда не бывают пятью минутами.",
  "Вы уже сделали самое трудное — остановились.",
  "Мозгу нужна пауза, а не новые 200 видео.",
  "Тишина тоже может быть наградой.",
];

// ---------------------------------------------------------------------------
// Micro-replacements
// ---------------------------------------------------------------------------

export const CATEGORIES: readonly {
  id: ReplacementCategory;
  label: string;
  icon: IconName;
  description: string;
}[] = [
  { id: "body", label: "Тело", icon: "body-outline", description: "Движение за 1–3 минуты" },
  { id: "mind", label: "Ум", icon: "bulb-outline", description: "Задачи, которые включают голову" },
  {
    id: "facts",
    label: "Факты",
    icon: "library-outline",
    description: "Короткая полезная новизна",
  },
];

export function getCategory(id: ReplacementCategory) {
  return CATEGORIES.find((category) => category.id === id) ?? CATEGORIES[0]!;
}

export const REPLACEMENTS: readonly Replacement[] = [
  // --- Body -----------------------------------------------------------------
  {
    id: "squats",
    title: "15 приседаний",
    description: "Быстрый прилив крови к мозгу и честный дофамин от сделанного.",
    steps: [
      "Встаньте, стопы на ширине плеч.",
      "Сделайте 15 медленных приседаний, спина прямая.",
      "В конце сделайте глубокий вдох и заметьте, как стало теплее.",
    ],
    minutes: 1,
    category: "body",
    icon: "fitness-outline",
    triggers: ["boredom", "fatigue", "procrastination"],
  },
  {
    id: "neck-shoulders",
    title: "Разминка шеи и плеч",
    description: "Снимает зажим, который копится от взгляда в телефон.",
    steps: [
      "Медленно наклоните голову к правому плечу, затем к левому — по 3 раза.",
      "Сделайте 10 кругов плечами назад.",
      "Сцепите руки за спиной и раскройте грудь на 3 вдоха.",
    ],
    minutes: 2,
    category: "body",
    icon: "accessibility-outline",
    triggers: ["fatigue", "stress"],
  },
  {
    id: "eyes-20-20",
    title: "Отдых для глаз 20-20-20",
    description: "Экран держит фокус на 30 см. Дайте глазам дальний план.",
    steps: [
      "Подойдите к окну или найдите самую дальнюю точку в комнате.",
      "Смотрите на неё 20 секунд, не моргая через силу.",
      "Закройте глаза ладонями на 20 секунд, затем медленно моргните 10 раз.",
    ],
    minutes: 1,
    category: "body",
    icon: "eye-outline",
    triggers: ["fatigue", "autopilot"],
  },
  {
    id: "cold-water",
    title: "Холодная вода",
    description: "Умывание и стакан воды — быстрый сброс для нервной системы.",
    steps: [
      "Умойтесь холодной водой или подержите запястья под струёй 30 секунд.",
      "Медленно выпейте стакан воды.",
      "Отметьте, что изменилось в теле.",
    ],
    minutes: 1,
    category: "body",
    icon: "water-outline",
    triggers: ["stress", "fatigue", "autopilot"],
  },
  {
    id: "walk-3",
    title: "Три минуты ходьбы",
    description: "Движение без цели — лучший перезапуск внимания.",
    steps: [
      "Оставьте телефон на столе.",
      "Пройдитесь по квартире, офису или лестнице три минуты.",
      "Замечайте по пути три новых детали.",
    ],
    minutes: 3,
    category: "body",
    icon: "walk-outline",
    triggers: ["boredom", "autopilot", "procrastination"],
  },
  {
    id: "tidy-surface",
    title: "Порядок на одной поверхности",
    description: "Маленькая завершённая задача даёт ощущение контроля.",
    steps: [
      "Выберите одну поверхность: стол, полку, подоконник.",
      "Уберите с неё всё лишнее за 3 минуты.",
      "Посмотрите на результат — это ваша победа.",
    ],
    minutes: 3,
    category: "body",
    icon: "color-wand-outline",
    triggers: ["procrastination", "boredom"],
  },
  {
    id: "plank",
    title: "Планка 45 секунд",
    description: "Короткое усилие, которое переключает с тревоги на тело.",
    steps: [
      "Встаньте в планку на предплечьях, тело — прямая линия.",
      "Держите 45 секунд, дышите ровно.",
      "Отдохните 15 секунд лёжа, расслабив всё тело.",
    ],
    minutes: 1,
    category: "body",
    icon: "barbell-outline",
    premium: true,
    triggers: ["stress", "boredom"],
  },
  {
    id: "shake-off",
    title: "Стряхнуть напряжение",
    description: "Так животные сбрасывают стресс после опасности.",
    steps: [
      "Встаньте и потрясите кистями рук 20 секунд.",
      "Добавьте плечи, затем ноги — ещё 30 секунд.",
      "Замрите и сделайте три медленных выдоха.",
    ],
    minutes: 1,
    category: "body",
    icon: "pulse-outline",
    premium: true,
    triggers: ["stress"],
  },
  {
    id: "muscle-relax",
    title: "Мышечная релаксация",
    description: "Напряжение и расслабление по очереди — глубокий отдых за 3 минуты.",
    steps: [
      "Сожмите кулаки на 5 секунд, затем резко расслабьте.",
      "Повторите для плеч, лица, живота и ног.",
      "В конце полежите или посидите 30 секунд, ощущая тяжесть тела.",
    ],
    minutes: 3,
    category: "body",
    icon: "bed-outline",
    premium: true,
    triggers: ["stress", "fatigue"],
  },

  // --- Mind -----------------------------------------------------------------
  {
    id: "serial-sevens",
    title: "Счёт от 100 по 7",
    description: "Нагружает префронтальную кору и обрывает автоматический импульс.",
    steps: [
      "Отнимайте по 7 от 100 в уме: 93, 86, 79…",
      "Ошиблись — начните с последнего верного числа.",
      "Дойдите до числа меньше 10.",
    ],
    minutes: 1,
    category: "mind",
    icon: "calculator-outline",
    triggers: ["autopilot", "boredom"],
  },
  {
    id: "two-minute-step",
    title: "Шаг на 2 минуты",
    description: "Вместо ленты — самый маленький шаг отложенного дела.",
    steps: [
      "Вспомните дело, которое откладываете.",
      "Найдите в нём шаг, который займёт 2 минуты: открыть файл, написать первую строку.",
      "Сделайте только его. Продолжать необязательно.",
    ],
    minutes: 2,
    category: "mind",
    icon: "rocket-outline",
    triggers: ["procrastination"],
  },
  {
    id: "gratitude",
    title: "Три хороших вещи",
    description: "Переводит внимание с нехватки на то, что уже есть.",
    steps: [
      "Вспомните три хороших момента за сегодня — даже мелких.",
      "Для каждого ответьте: почему это случилось?",
      "Запишите одну фразу, если есть бумага.",
    ],
    minutes: 2,
    category: "mind",
    icon: "heart-outline",
    triggers: ["loneliness", "stress"],
  },
  {
    id: "message-human",
    title: "Написать живому человеку",
    description: "Настоящий контакт вместо бесконечной чужой жизни.",
    steps: [
      "Выберите человека, с которым давно не говорили.",
      "Напишите ему одно тёплое сообщение или вопрос.",
      "Закройте мессенджер, не дожидаясь ответа.",
    ],
    minutes: 2,
    category: "mind",
    icon: "chatbubbles-outline",
    triggers: ["loneliness", "boredom"],
  },
  {
    id: "brain-dump",
    title: "Выгрузка мыслей",
    description: "Тревога тише, когда мысли на бумаге, а не в голове.",
    steps: [
      "Возьмите лист или заметки.",
      "Пишите всё, что крутится в голове, 2 минуты без остановки.",
      "Подчеркните одну вещь, которую можно сделать сегодня.",
    ],
    minutes: 2,
    category: "mind",
    icon: "create-outline",
    premium: true,
    triggers: ["stress", "procrastination"],
  },
  {
    id: "alphabet-game",
    title: "Алфавитная игра",
    description: "Лёгкая умственная задача, которая утоляет голод по новизне.",
    steps: [
      "Выберите тему: города, животные, блюда.",
      "Назовите по слову на каждую букву алфавита.",
      "Застряли — пропустите букву и вернитесь к ней в конце.",
    ],
    minutes: 3,
    category: "mind",
    icon: "text-outline",
    premium: true,
    triggers: ["boredom", "autopilot"],
  },
  {
    id: "evening-plan",
    title: "Визуализация вечера",
    description: "Мозг охотнее отпускает ленту, когда видит план получше.",
    steps: [
      "Закройте глаза.",
      "Представьте, как вы проведёте ближайший час без ленты, в деталях.",
      "Выберите первое действие и откройте глаза.",
    ],
    minutes: 2,
    category: "mind",
    icon: "sparkles-outline",
    premium: true,
    triggers: ["fatigue", "procrastination"],
  },

  // --- Facts ----------------------------------------------------------------
  {
    id: "facts-brain",
    title: "Мозг и привычки",
    description: "Как устроена тяга к ленте — и почему её можно переучить.",
    steps: [
      "Дофамин больше связан с ожиданием награды, чем с самим удовольствием. Поэтому бесконечная лента цепляет сильнее, чем любое конкретное видео.",
      "Короткие видео работают как игровой автомат: награда приходит непредсказуемо, и мозг продолжает «дёргать рычаг».",
      "Импульс похож на волну: он нарастает и спадает. Даже короткая пауза прерывает автоматическое действие и даёт шанс выбрать иначе.",
      "Эмоциональные системы мозга реагируют быстрее, чем префронтальная кора — «директор», отвечающий за самоконтроль. Пауза даёт ей время догнать импульс.",
      "Новая привычка закрепляется повторением в одном и том же контексте. Одна и та же замена в одной ситуации работает лучше разнообразия.",
    ],
    minutes: 1,
    category: "facts",
    icon: "git-network-outline",
    triggers: ["boredom", "autopilot"],
  },
  {
    id: "facts-nature",
    title: "Удивительная природа",
    description: "Немного живой новизны вместо ленты.",
    steps: [
      "Осьминог пробует мир «на вкус» присосками: рецепторы на щупальцах различают вкусы.",
      "Деревья в лесу могут обмениваться веществами через грибные сети, оплетающие их корни.",
      "Сердце колибри может биться больше 1000 раз в минуту.",
      "Морские выдры держатся за лапы во сне, чтобы течение не разнесло их в разные стороны.",
      "Пчёлы сообщают друг другу направление к цветам с помощью «виляющего танца».",
    ],
    minutes: 1,
    category: "facts",
    icon: "leaf-outline",
    triggers: ["boredom", "stress"],
  },
  {
    id: "facts-space",
    title: "Космос за минуту",
    description: "Масштаб, на фоне которого лента выглядит мелко.",
    steps: [
      "Свет Солнца идёт до Земли около 8 минут — мы всегда видим его чуть в прошлом.",
      "На Венере сутки длиннее года: она вращается медленнее, чем облетает Солнце.",
      "В наблюдаемой Вселенной звёзд больше, чем песчинок на всех пляжах Земли.",
      "Следы астронавтов на Луне могут сохраняться миллионы лет — там нет ветра.",
      "Нейтронная звезда так плотна, что чайная ложка её вещества весила бы миллиарды тонн.",
    ],
    minutes: 1,
    category: "facts",
    icon: "planet-outline",
    premium: true,
    triggers: ["boredom", "loneliness"],
  },
  {
    id: "facts-history",
    title: "История в деталях",
    description: "Короткие истории, которые хочется пересказать.",
    steps: [
      "Клеопатра жила ближе по времени к высадке на Луну, чем к строительству пирамиды Хеопса.",
      "Оксфордский университет старше государства ацтеков.",
      "Самая короткая война в истории — англо-занзибарская 1896 года — длилась меньше часа.",
      "В Древнем Риме был свой «фастфуд» — уличные термополии с горячей едой.",
      "Слово «робот» впервые прозвучало в пьесе Карела Чапека 1920 года, а придумал его брат писателя — Йозеф.",
    ],
    minutes: 1,
    category: "facts",
    icon: "school-outline",
    premium: true,
    triggers: ["boredom", "procrastination"],
  },
];

export const CATEGORY_ICONS: Record<ReplacementCategory, IconName> = {
  body: "body-outline",
  mind: "bulb-outline",
  facts: "library-outline",
};

// ---------------------------------------------------------------------------
// SOS: the 15-second pause
// ---------------------------------------------------------------------------

export const INTERCEPT_SECONDS = 15;

export interface BreathPhase {
  label: string;
  seconds: number;
  /** Target scale of the breathing circle at the end of the phase. */
  scale: number;
}

export interface Exercise {
  id: ExerciseId;
  title: string;
  subtitle: string;
  icon: IconName;
  premium?: boolean;
  /** Breathing cycle that repeats for the whole pause. */
  breath: readonly BreathPhase[];
  /** Grounding prompts; their seconds add up to INTERCEPT_SECONDS. */
  prompts: readonly { text: string; seconds: number }[];
}

const SLOW_BREATH: readonly BreathPhase[] = [
  { label: "Вдох", seconds: 2, scale: 1 },
  { label: "Выдох", seconds: 3, scale: 0.6 },
];

export const EXERCISES: readonly Exercise[] = [
  {
    id: "breath-ground",
    title: "Дыхание и заземление",
    subtitle: "Длинный выдох + техника 3-2-1",
    icon: "leaf-outline",
    breath: SLOW_BREATH,
    prompts: [
      { text: "Назовите про себя 3 предмета, которые видите прямо сейчас", seconds: 5 },
      { text: "Почувствуйте 2 точки опоры: стопы на полу и спину", seconds: 5 },
      { text: "Сделайте 1 длинный выдох и опустите плечи", seconds: 5 },
    ],
  },
  {
    id: "box-breath",
    title: "Квадратное дыхание",
    subtitle: "Ровный ритм для сильного стресса",
    icon: "square-outline",
    premium: true,
    breath: [
      { label: "Вдох", seconds: 4, scale: 1 },
      { label: "Задержка", seconds: 4, scale: 1 },
      { label: "Выдох", seconds: 4, scale: 0.6 },
      { label: "Пауза", seconds: 3, scale: 0.6 },
    ],
    prompts: [
      { text: "Вдох через нос — считайте до четырёх", seconds: 4 },
      { text: "Задержите дыхание, не напрягаясь", seconds: 4 },
      { text: "Медленный выдох через рот", seconds: 4 },
      { text: "Пауза. Заметьте тишину внутри", seconds: 3 },
    ],
  },
  {
    id: "serial-sevens",
    title: "Счёт от 100 по 7",
    subtitle: "Включает «директора» мозга",
    icon: "calculator-outline",
    premium: true,
    breath: SLOW_BREATH,
    prompts: [
      { text: "Посчитайте в уме: 100 − 7 = ?", seconds: 5 },
      { text: "Верно, 93. Дальше: 93 − 7 = ?", seconds: 5 },
      { text: "Это 86. И ещё: 86 − 7 = ?", seconds: 5 },
    ],
  },
  {
    id: "intent-check",
    title: "Три честных вопроса",
    subtitle: "Осознанность вместо автопилота",
    icon: "help-circle-outline",
    premium: true,
    breath: SLOW_BREATH,
    prompts: [
      { text: "Что я чувствую прямо сейчас — одним словом?", seconds: 5 },
      { text: "Что я на самом деле хочу получить от ленты?", seconds: 5 },
      { text: "Что даст мне это чувство без телефона?", seconds: 5 },
    ],
  },
];

export function getExercise(id: ExerciseId): Exercise {
  return EXERCISES.find((exercise) => exercise.id === id) ?? EXERCISES[0]!;
}

// ---------------------------------------------------------------------------
// Saved time → tangible equivalents
// ---------------------------------------------------------------------------

export interface Equivalent {
  id: string;
  icon: IconName;
  /** Minutes that make up one unit. */
  unitMinutes: number;
  forms: readonly [string, string, string];
  caption: string;
  premium?: boolean;
}

export const EQUIVALENTS: readonly Equivalent[] = [
  {
    id: "books",
    icon: "book-outline",
    unitMinutes: 300,
    forms: ["книга", "книги", "книг"],
    caption: "средняя книга ≈ 5 часов чтения",
  },
  {
    id: "sleep",
    icon: "moon-outline",
    unitMinutes: 60,
    forms: ["час сна", "часа сна", "часов сна"],
    caption: "время, которое можно вернуть сну",
  },
  {
    id: "walks",
    icon: "walk-outline",
    unitMinutes: 30,
    forms: ["прогулка", "прогулки", "прогулок"],
    caption: "по 30 минут на свежем воздухе",
  },
  {
    id: "workouts",
    icon: "barbell-outline",
    unitMinutes: 45,
    forms: ["тренировка", "тренировки", "тренировок"],
    caption: "по 45 минут",
    premium: true,
  },
  {
    id: "language",
    icon: "language-outline",
    unitMinutes: 20,
    forms: ["урок языка", "урока языка", "уроков языка"],
    caption: "по 20 минут",
    premium: true,
  },
  {
    id: "calls",
    icon: "call-outline",
    unitMinutes: 15,
    forms: ["разговор", "разговора", "разговоров"],
    caption: "с близкими, по 15 минут",
    premium: true,
  },
];

export const TIME_OF_DAY_LABELS: Record<TimeOfDay, { label: string; phrase: string }> = {
  morning: { label: "Утро", phrase: "по утрам" },
  afternoon: { label: "День", phrase: "днём" },
  evening: { label: "Вечер", phrase: "по вечерам" },
  night: { label: "Ночь", phrase: "ночью" },
};

/** Preset values for the scroll-time logger and onboarding. */
export const SCROLL_PRESETS = [30, 60, 120, 180] as const;
/** A whole day: the only real upper bound for minutes in the feed. */
export const MAX_SCROLL_MINUTES = 24 * 60;
