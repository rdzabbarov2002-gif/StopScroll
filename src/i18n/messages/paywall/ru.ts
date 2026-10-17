import { selectPlural, type PluralForms } from "../../plural";

/**
 * paywall — Russian. The source of truth for this area's messages: the other languages must have
 * exactly the same keys (and the same parameters for function messages).
 *
 * The paywall screen, the Free/Pro comparison (`utils/pro.ts`), store plans and purchase errors
 * (`services/purchases.ts`, `context/ProContext.tsx`). Prices come in already formatted by the store.
 */

/** The unit of a store trial period, as RevenueCat reports it. */
export type PeriodUnit = "DAY" | "WEEK" | "MONTH" | "YEAR";

const PERIODS: Record<PeriodUnit, PluralForms> = {
  DAY: { one: "день", few: "дня", many: "дней", other: "дня" },
  WEEK: { one: "неделя", few: "недели", many: "недель", other: "недели" },
  MONTH: { one: "месяц", few: "месяца", many: "месяцев", other: "месяца" },
  YEAR: { one: "год", few: "года", many: "лет", other: "года" },
};

export const ru = {
  close: "Закрыть",
  title: "StopScroll Pro",
  activeTitle: "Pro уже с вами",
  thanks: "Спасибо, что поддерживаете приложение!",
  activeText: "Все упражнения, замены и аналитика открыты.",
  done: "Готово",
  plansFailed: "Не удалось загрузить тарифы.",
  retry: "Повторить",
  /** The buy button when the plan has a free trial: "Попробовать 7 дней бесплатно". */
  tryTrial: (trial: string) => `Попробовать ${trial}`,
  subscribe: "Оформить Pro",
  restore: "Восстановить покупки",
  nothingToRestore: "Активных покупок не найдено для этого аккаунта магазина.",
  renewal: (plan: string, price: string) =>
    `Подписка «${plan}» за ${price} продлевается автоматически, пока вы её не отмените. Отменить можно в любой момент в настройках App Store или Google Play — не позднее чем за 24 часа до конца периода.`,
  table: {
    free: "Free",
    pro: "Pro",
    yes: "есть",
    no: "нет",
    /** A comparison row for screen readers: "Замены: бесплатно — 6, Pro — 40 + свои". */
    row: (label: string, free: string, pro: string) =>
      `${label}: бесплатно — ${free}, Pro — ${pro}`,
  },
  rows: {
    sos: "SOS-пауза",
    exercises: "Упражнения паузы",
    replacements: "Замены",
    /** "40 + свои" */
    replacementsPro: (count: number) => `${count} + свои`,
    trend: "Динамика",
    heatmap: "Тепловая карта",
    converter: "Конвертер времени",
    patterns: "Закономерности",
    /** "7 дн." — the history depth in days. */
    days: (count: number) => `${count} дн.`,
    /** "16 нед." — the heatmap depth in weeks. */
    weeks: (count: number) => `${count} нед.`,
  },
  headlines: {
    default: {
      title: "Верните себе время у алгоритмов",
      text: "Все упражнения, полный каталог замен, свои привычки и глубокая аналитика.",
    },
    exercises: {
      title: "Все упражнения для SOS-паузы",
      text: "Квадратное дыхание, счёт от 100 и честные вопросы — разные ключи к разным импульсам.",
    },
    replacements: {
      title: "Полный каталог микро-замен",
      text: "Больше движений, задач для ума и коротких фактов — здоровый дофамин на любой случай.",
    },
    custom: {
      title: "Свои замены и привычки",
      text: "Добавьте то, что работает именно для вас: гитара, отжимания, страница книги.",
    },
    analytics: {
      title: "Глубокая аналитика паттернов",
      text: "Узнайте, в какой час и в какой день недели лента побеждает чаще всего — и подготовьтесь заранее.",
    },
    history: {
      title: "Вся история прогресса",
      text: "Динамика за 30 дней и тепловая карта на 16 недель — видно, как меняется привычка.",
    },
    converter: {
      title: "Полный конвертер времени",
      text: "Тренировки, уроки языка и разговоры с близкими, которые вы выиграли у ленты.",
    },
  },
  plans: {
    annual: "Год",
    sixMonths: "6 месяцев",
    threeMonths: "3 месяца",
    twoMonths: "2 месяца",
    monthly: "Месяц",
    weekly: "Неделя",
    lifetime: "Навсегда",
    /** "7 дней бесплатно" */
    trial: (count: number, unit: PeriodUnit) =>
      `${count} ${selectPlural("ru", count, PERIODS[unit])} бесплатно`,
    oneTime: "разовая покупка",
    /** "≈ 250 ₽ в месяц" for long plans. */
    pricePerMonth: (price: string) => `≈ ${price} в месяц`,
    perMonth: "в месяц",
    perWeek: "в неделю",
    /** The savings badge: "−40%". */
    savings: (percent: number) => `−${percent}%`,
  },
  unavailable: {
    demoTitle: "Это демо-версия: оплата отключена",
    devTitle: "Покупки не подключены в этой сборке",
    title: "Покупки временно недоступны",
    demoText:
      "В приложении из App Store и Google Play здесь будут тарифы. Чтобы посмотреть Pro-функции, включите тестовый Pro.",
    devText:
      "Укажите ключи RevenueCat в .env.local (см. .env.example) и перезапустите сборку — тарифы появятся здесь автоматически.",
    text: "Не удалось связаться с магазином. Попробуйте позже — все бесплатные функции продолжают работать.",
    testProOff: "Выключить тестовый Pro",
    testProOn: "Включить Pro для теста",
  },
  errors: {
    network: "Нет связи с магазином. Проверьте интернет и попробуйте ещё раз.",
    alreadyPurchased: "Эта подписка уже оформлена. Нажмите «Восстановить покупки».",
    notAllowed: "Покупки запрещены на этом устройстве или в этом аккаунте.",
    pending: "Платёж ожидает подтверждения. Pro включится автоматически, когда он пройдёт.",
    planUnavailable: "Этот тариф сейчас недоступен в вашем магазине.",
    generic: "Не удалось завершить покупку. Попробуйте ещё раз чуть позже.",
    noPlans: "Тарифы пока не опубликованы. Загляните чуть позже.",
    notActivated: "Оплата прошла, но Pro ещё не активен. Попробуйте «Восстановить покупки».",
  },
};

export type Messages = typeof ru;
