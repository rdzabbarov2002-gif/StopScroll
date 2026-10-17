/**
 * settings — Russian. The source of truth for this area's messages: the other languages must have
 * exactly the same keys (and the same parameters for function messages).
 *
 * The Settings screen. `time` in the coach footers is the formatted hour of the weekly report.
 */
export const ru = {
  /** The back button: the Home tab. */
  back: "Сегодня",
  title: "Настройки",
  pro: {
    title: "StopScroll Pro",
    active: "StopScroll Pro активен",
    open: "Открыть StopScroll Pro",
    activeText: "Все упражнения, замены и глубокая аналитика открыты.",
    pitch: "Все упражнения, свои замены и глубокая аналитика",
    restore: "Восстановить покупки",
    restored: "Pro восстановлен.",
    nothingToRestore: "Активных покупок не найдено.",
  },
  appearance: "Оформление",
  goals: {
    header: "Цели",
    limit: "Дневной лимит ленты",
    limitHint: "День в пределах лимита продолжает серию",
    session: "Одна сессия в ленте",
    sessionHint: "Столько минут засчитываем за каждую победу",
    baseline: "Исходный уровень",
    baselineHint: "Сколько уходило в день до StopScroll",
  },
  coach: {
    header: "Коуч и отчёты",
    footer: (time: string) =>
      `В воскресенье в ${time} коуч разберёт неделю и пришлёт уведомление, что отчёт готов.`,
    footerWithPhrasing: (time: string) =>
      `В воскресенье в ${time} коуч разберёт неделю и пришлёт уведомление. Живые формулировки: выводы коуча (без заметок и записей) переписывает ChatGPT — факты и цифры остаются прежними. Работают, если разрешён AI-анализ.`,
    report: "Отчёт по воскресеньям",
    reportSwitch: "Уведомлять о недельном отчёте",
    phrasing: "Живые формулировки",
    phrasingSwitch: "Живые формулировки советов коуча",
    notificationsWeb: "Уведомления работают в приложении на iPhone и Android.",
    notificationsDenied:
      "Разрешите уведомления для StopScroll в настройках телефона, чтобы получать отчёт.",
  },
  ai: {
    header: "AI-коуч",
    offFooter: "В этой сборке AI-анализ не подключён: записи остаются на телефоне.",
    offValue: "Не подключён",
    footer:
      "Записи, ответы и статистика привычек отправляются в OpenAI (ChatGPT) через сервер StopScroll только с вашего разрешения. Память коуча хранится на телефоне.",
    consent: "Анализ в ChatGPT",
    consentSwitch: "Разрешить анализ записей в ChatGPT",
    confirmErase: "Стереть записи и память коуча?",
    erase: "Удалить данные AI-коуча",
  },
  feed: "Главная лента",
  dev: {
    demo: "Демо-версия",
    development: "Разработка",
    demoText:
      "Это версия для просмотра в браузере: оплата отключена. Заполните приложение примером данных, чтобы увидеть графики, серии и закономерности.",
    demoFill: "Заполнить примером данных",
    testPro: "Тестовый Pro",
    testProDemo: "Открывает Pro-функции без покупки, чтобы их посмотреть.",
    testProDev: "Только в dev-сборке: открывает Pro-функции без покупки.",
  },
  data: {
    header: "Данные",
    text: "Все записи хранятся только на этом устройстве. Сброс удалит историю времени, побед, срывов, свои замены, записи об импульсах и память AI-коуча, но сохранит цели и подписку.",
    reset: "Сбросить прогресс",
  },
  cancel: "Отмена",
  erase: "Стереть",
};

export type Messages = typeof ru;
