/**
 * JSON Schemas for OpenAI Structured Outputs (strict mode): every property is required,
 * optional values are nullable, no additional properties. The app validates the same shapes
 * again on its side, so a malformed answer never reaches the screen.
 */

const str = { type: "string" } as const;
const nullableStr = { type: ["string", "null"] } as const;
const strings = { type: "array", items: str } as const;

const object = (properties: Record<string, unknown>) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

export const ENTRY_SCHEMA = object({
  enough: {
    type: "boolean",
    description: "Хватает ли в тексте информации, чтобы определить причину.",
  },
  cause: { ...nullableStr, description: "Основная причина, 2–6 слов. null, если не ясно." },
  emotion: {
    ...nullableStr,
    description: "Эмоциональное состояние, 1–4 слова. null, если не ясно.",
  },
  context: { ...nullableStr, description: "Контекст: где, когда, после чего. null, если не ясно." },
  behavior: {
    ...nullableStr,
    description:
      "Тип поведения, например: автоматическое открытие, бегство от эмоции, отдых, откладывание дела. null, если не ясно.",
  },
  explanation: {
    ...str,
    description:
      "1–2 предложения: почему так выглядит. Если информации мало — честно скажите, чего не хватает.",
  },
  missing: { ...nullableStr, description: "Чего не хватает для уверенного вывода, или null." },
  tags: {
    ...strings,
    description:
      "1–4 коротких тега-существительных в нижнем регистре для подсчёта причин (например: усталость, работа, конфликт, скука, автопилот, бессонница). Используйте уже существующие теги, если подходят.",
  },
});

const forecastProperties = {
  probability: {
    type: ["integer", "null"],
    description:
      "Вероятность (0–100), что сегодня до конца дня лента будет открыта или случится срыв. null, если данных мало.",
  },
  level: { anyOf: [{ type: "string", enum: ["low", "medium", "high"] }, { type: "null" }] },
  headline: {
    ...str,
    description:
      "Короткий вывод одним предложением, не повторяя число вероятности (оно показывается отдельно крупно), например: «Вечер, скорее всего, будет непростым.» Если данных мало — честно скажите, что прогноз пока предварительный.",
  },
  reasons: {
    ...strings,
    description: "2–4 причины, каждая опирается на конкретные факты из истории пользователя.",
  },
  window: object({
    until: {
      ...nullableStr,
      description: "До какого времени (ЧЧ:ММ) длится опасный период сегодня.",
    },
    message: {
      ...nullableStr,
      description:
        "Например: «Если удастся не открыть ленту до 22:00, шанс спокойного дня заметно вырастет.»",
    },
  }),
  passed: {
    ...nullableStr,
    description:
      "Если опасный период сегодня уже прошёл без срыва — сообщение об этом, иначе null.",
  },
  advice: { ...nullableStr, description: "Один конкретный шаг на сегодня, исходя из истории." },
  basis: { ...str, description: "На чём основан прогноз (коротко, с числами)." },
  validUntil: {
    ...nullableStr,
    description: "До какого времени сегодня (ЧЧ:ММ) прогноз остаётся актуальным.",
  },
};

export const FORECAST_SCHEMA = object(forecastProperties);

const titled = object({ title: str, note: str });

export const INSIGHTS_SCHEMA = object({
  memory: object({
    summary: {
      ...str,
      description: "Сжатый портрет привычек пользователя до 900 символов: главное, что известно.",
    },
    timeline: {
      type: "array",
      items: object({ period: str, note: str }),
      description:
        "Датированные долгосрочные наблюдения (period — ГГГГ-ММ или диапазон). Не удаляйте старые, объединяйте. До 24 пунктов.",
    },
    milestones: {
      type: "array",
      items: object({ date: str, note: str }),
      description: "Рекорды и важные события с датами. До 12 пунктов.",
    },
    hypotheses: {
      type: "array",
      items: object({
        text: str,
        status: { type: "string", enum: ["proposed", "supported", "weakened"] },
      }),
      description: "Гипотезы и их статус по мере накопления данных. До 8.",
    },
    openQuestions: {
      ...strings,
      description: "Что пока неизвестно и помогло бы анализу. До 4.",
    },
  }),
  analytics: object({
    causes: {
      type: "array",
      items: object({
        title: str,
        share: {
          type: ["integer", "null"],
          description: "Доля в процентах, если её можно посчитать.",
        },
        note: str,
      }),
      description: "Самые частые причины открытия ленты, до 5.",
    },
    situations: { type: "array", items: titled, description: "Повторяющиеся ситуации, до 5." },
    emotions: { type: "array", items: titled, description: "Эмоциональные состояния, до 5." },
    times: { type: "array", items: titled, description: "Опасное время суток, до 3." },
    weekdays: { type: "array", items: titled, description: "Дни недели, до 3." },
    improvements: { ...strings, description: "Положительные изменения, до 4." },
    worsenings: { ...strings, description: "Отрицательные изменения, до 4." },
    habitChanges: { ...strings, description: "Как меняются привычки со временем, до 4." },
    hypotheses: {
      type: "array",
      items: object({
        text: str,
        confidence: { type: "string", enum: ["low", "medium", "high"] },
      }),
      description: "Осторожные гипотезы, не выдаваемые за факт, до 4.",
    },
    warnings: { ...strings, description: "Предупреждения об опасных периодах, до 3." },
    selfComparison: { ...strings, description: "Сравнение только с собственной историей, до 3." },
    longTerm: { ...strings, description: "Что изменилось за долгий срок (по памяти), до 3." },
    numbers: {
      anyOf: [
        object({
          headline: { ...str, description: "Например: «Вы вернули почти четыре часа.»" },
          equivalents: { ...strings, description: "2–4 понятных эквивалента этого времени." },
        }),
        { type: "null" },
      ],
    },
    conclusion: { ...str, description: "Общий вывод, 2–3 предложения." },
    dataNote: {
      ...nullableStr,
      description: "Честное замечание, если для каких-то выводов данных пока мало.",
    },
  }),
  forecast: FORECAST_SCHEMA,
  question: {
    anyOf: [
      object({
        text: str,
        kind: { type: "string", enum: ["yes_no", "choice"] },
        options: { ...strings, description: "Для choice — 3–6 вариантов; для yes_no — пусто." },
        reason: { ...str, description: "Зачем этот вопрос нужен анализу (для журнала)." },
      }),
      { type: "null" },
    ],
  },
  challenge: {
    anyOf: [
      object({
        title: str,
        description: { ...str, description: "Что сделать, одним-двумя предложениями." },
        durationDays: { type: "integer", description: "1–7 дней." },
        focus: {
          ...str,
          description:
            "Что будет сравниваться: morning, day, evening, night или all (часть дня, к которой относится эксперимент).",
        },
        expectation: { ...str, description: "Что ожидаем увидеть, осторожно." },
      }),
      { type: "null" },
    ],
  },
  challengeReview: {
    ...nullableStr,
    description:
      "Итог завершённого эксперимента по цифрам до/во время. Если заметных изменений нет — честно скажите. null, если оценивать нечего.",
  },
});

export const PHRASE_SCHEMA = object({ texts: strings });
