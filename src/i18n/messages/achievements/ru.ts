import { selectPlural, type PluralForms } from "../../plural";

/**
 * achievements — Russian. The source of truth for this area's messages: the other languages must have
 * exactly the same keys (and the same parameters for function messages).
 *
 * The achievements screen, the unlock animation and the texts of every achievement
 * (`utils/achievements.ts`), keyed by achievement id.
 */

const forms = (value: PluralForms) => value;
const word = (count: number, value: PluralForms) => selectPlural("ru", count, value);

/** "достижение" after a number. */
const ACHIEVEMENTS = forms({
  one: "достижение",
  few: "достижения",
  many: "достижений",
  other: "достижения",
});

export const ru = {
  title: "Достижения",
  back: "Назад",
  /** Card label above "3 из 15". */
  earned: "Получено",
  /** After the big number of earned achievements: "из 15". */
  ofTotal: (total: number) => `из ${total}`,
  /** `progress` is `progress.*` below, with non-breaking spaces ("ещё впереди" for `once`). */
  closest: (title: string, progress: string) => `Ближе всего: «${title}» — ${progress}.`,
  allEarned: "Вы собрали все достижения. Лента вам больше не хозяйка.",
  /** Section of earned achievements: "3 достижения". */
  earnedCount: (count: number) => `${count} ${word(count, ACHIEVEMENTS)}`,
  ahead: "Впереди",
  /** `date` is formatDate(): "Получено 4 октября". */
  earnedOn: (date: string) => `Получено ${date}`,
  howToEarn: "Как получить",

  /** Progress under a locked achievement. */
  progress: {
    /** "35 мин из 1 ч" — both already formatted by formatMinutes(). */
    minutes: (current: string, target: string) => `${current} из ${target}`,
    /** "12 из 20 раз"; `unit` is one of `units` below. */
    count: (current: number, target: number, unit: PluralForms) =>
      `${current} из ${target} ${word(target, unit)}`,
    /** A one-time achievement still locked. */
    once: "Ещё впереди",
    /** The same inside the "Ближе всего: …" sentence. */
    onceInline: "ещё впереди",
  },

  /** Units counted towards an achievement, for `progress.count`. */
  units: {
    times: forms({ one: "раз", few: "раза", many: "раз", other: "раза" }),
    days: forms({ one: "день", few: "дня", many: "дней", other: "дня" }),
    nights: forms({ one: "ночь", few: "ночи", many: "ночей", other: "ночи" }),
    replacements: forms({ one: "замена", few: "замены", many: "замен", other: "замены" }),
    refusals: forms({ one: "отказ", few: "отказа", many: "отказов", other: "отказа" }),
  },

  /** The unlock animation. */
  unlock: {
    overline: "Новое достижение",
    close: "Отлично",
    openAll: "Все достижения",
  },

  /**
   * Each achievement: `title`, `description` (what it means) and `hint` (how to earn it, shown
   * while locked).
   */
  items: {
    "first-choice": {
      title: "Первый выбор в свою пользу",
      description: "Импульс тянул в ленту, а вы выбрали паузу. С этого всё начинается.",
      hint: "Пройдите паузу или выполните замену вместо ленты.",
    },
    "first-evening": {
      /** When the main feed is "other"; with a named app see `firstEveningWith`. */
      title: "Первый вечер без ленты",
      description: "Вечер, когда вы удержались и ни разу не сорвались в ленту.",
      hint: "Удержитесь от ленты вечером (17–23 ч) и закончите вечер без срыва.",
    },
    "first-hour": {
      title: "Первый спасённый час",
      description: "60 минут, которые остались вам, а не алгоритму.",
      hint: "Спасите 60 минут паузами и заменами.",
    },
    "morning-free": {
      title: "Утро принадлежит вам",
      description: "Утро, которое началось с паузы, а не с бесконечной прокрутки.",
      hint: "Удержитесь от ленты утром (5–12 ч) и не сорвитесь до полудня.",
    },
    comeback: {
      title: "Сорвались — и вернулись",
      description: "Срыв не стал поводом сдаться: следующий импульс остался за вами.",
      hint: "Удержитесь в течение суток после записанного срыва.",
    },
    "honest-look": {
      title: "Пять честных разборов",
      description:
        "Пять раз после срыва вместо самокритики — спокойный разговор о том, что произошло.",
      hint: "Ответьте коучу «Что произошло?» после пяти срывов.",
    },
    "sunday-evening": {
      title: "Воскресный вечер за вами",
      description: "Самый «ленточный» вечер недели прошёл без единого срыва.",
      hint: "Удержитесь в воскресенье вечером и закончите его без срыва.",
    },
    "week-in-limit": {
      title: "Неделя в своём ритме",
      description: "Семь дней подряд в пределах лимита. Лента больше не задаёт темп.",
      hint: "Держитесь в пределах дневного лимита 7 дней подряд.",
    },
    "nights-7": {
      title: "7 вечеров без ночного скролла",
      description: "Семь ночей, когда сон оказался важнее ленты.",
      hint: "Проведите 7 ночей (22–5 ч) без срывов в дни, когда пользуетесь StopScroll.",
    },
    "stress-10": {
      title: "Стресс без побега",
      description: "10 раз вы встретили стресс без ленты. Это и есть устойчивость.",
      hint: "Удержитесь 10 раз, когда в ленту тянет из-за стресса.",
    },
    "boredom-20": {
      title: "20 побед над скукой",
      description: "Скука звала в ленту двадцать раз — и двадцать раз проиграла.",
      hint: "Удержитесь 20 раз, когда в ленту тянет от скуки.",
    },
    "replacements-25": {
      title: "Тело и голова вместо ленты",
      description: "25 раз вы выбрали движение, задачу или факт вместо прокрутки.",
      hint: "Выполните 25 полезных замен.",
    },
    "refusals-30": {
      title: "30 успешных отказов подряд",
      description: "Тридцать импульсов подряд — и ни одного срыва между ними.",
      hint: "Удержитесь 30 раз подряд без срыва.",
    },
    "half-feed": {
      title: "Вдвое меньше ленты",
      description: "Неделя, когда лента заняла вдвое меньше времени, чем до StopScroll.",
      hint: "Отмечайте время 7 дней: в среднем — не больше половины исходного уровня.",
    },
    "day-of-life": {
      title: "Сутки жизни — ваши",
      description: "1 440 минут спасено. Целые сутки, которые вы вернули себе.",
      hint: "Спасите 24 часа паузами и заменами.",
    },
  },

  /** "Первый вечер без TikTok": the main feed app by name (TikTok, Reels, Shorts). */
  firstEveningWith: (app: string) => `Первый вечер без ${app}`,
};

export type Messages = typeof ru;
