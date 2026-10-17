/**
 * onboarding — Russian. The source of truth for this area's messages: the other languages must have
 * exactly the same keys (and the same parameters for function messages).
 *
 * The three onboarding steps. Durations come in already formatted ("1 ч 30 мин").
 */
export const ru = {
  /** The progress dots, for screen readers. */
  step: (current: number, total: number) => `Шаг ${current} из ${total}`,
  intro: "Когнитивный анти-скроллинг: перехватываем импульс до того, как лента затянет.",
  promises: {
    sos: {
      title: "SOS-пауза на 15 секунд",
      text: "Дыхание и заземление, пока импульс не ослабнет.",
    },
    replacements: {
      title: "Микро-замены",
      text: "1–3 минуты движения, задачи или факта вместо ленты.",
    },
    stats: {
      title: "Честная статистика",
      text: "Сколько времени вы вернули себе — в книгах, сне и прогулках.",
    },
  },
  start: "Начать",
  demo: "Посмотреть с примером данных",
  baseline: {
    overline: "Честная точка отсчёта",
    title: "Сколько времени в день сейчас уходит на ленту?",
    text: "Примерно — по ощущениям или по «Экранному времени». Это ваш исходный уровень для сравнения.",
    slider: "Минут в ленте в день сейчас",
    mainApp: "Где залипаете чаще всего?",
    next: "Дальше",
  },
  goal: {
    overline: "Реалистичная цель",
    title: "Сколько ленты в день — нормально для вас?",
    text: "Не нужно бросать всё сразу. Каждый день в пределах лимита продлевает серию.",
    limit: "Дневной лимит",
    session: "Одна «сессия» в ленте",
    sessionHint: "Столько минут засчитаем за каждую победу над импульсом",
    /** "Цель — минус 1 ч в день. Это 7 ч в неделю, которые вернутся к вам." */
    summary: (perDay: string, perWeek: string) =>
      `Цель — минус ${perDay} в день. Это ${perWeek} в неделю, которые вернутся к вам.`,
    done: "Готово",
    back: "Назад",
  },
};

export type Messages = typeof ru;
