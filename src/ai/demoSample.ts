import { dayKey } from "../utils/date";
import type { AiAnalytics, AiChallenge, AiForecast, AiMemory } from "./types";

/**
 * Web preview only (EXPO_PUBLIC_DEMO=1 without an AI server): a sample of what the AI tab shows,
 * so the design can be seen. It is not an analysis — the screen labels it as an example and
 * never shows it in a store build or when the AI server is connected.
 */
export function demoSample(now: number): {
  analytics: AiAnalytics;
  memory: AiMemory;
  forecast: AiForecast;
  challenge: AiChallenge;
} {
  const today = dayKey(now);
  return {
    forecast: {
      probability: 72,
      level: "high",
      headline: "Вечер, скорее всего, будет непростым.",
      reasons: [
        "Последние три воскресенья вы открывали ленту между 21:00 и 23:00.",
        "За последние три дня было три срыва — больше, чем обычно для этой недели.",
        "Большинство срывов за месяц случались поздно вечером после усталости.",
      ],
      window: {
        until: "23:00",
        message: "Если удастся не открыть ленту до 23:00, шанс спокойного дня заметно вырастет.",
      },
      passed: null,
      advice: "Положите телефон заряжаться в другой комнате около 21:00.",
      basis: "пример",
      validUntil: "23:00",
      day: today,
      createdAt: now,
    },
    analytics: {
      conclusion:
        "Похоже, лента чаще всего побеждает не от скуки, а от вечерней усталости после длинного дня. Днём вы держитесь заметно лучше, чем месяц назад.",
      dataNote: "Для выводов о выходных пока мало записей.",
      warnings: ["После серии из 5+ спокойных дней у вас дважды начинался откат в выходные."],
      improvements: ["Последние две недели вы всё реже открываете ленту днём: 2 срыва против 6."],
      worsenings: ["Поздние вечера стали тяжелее: 4 из 5 последних срывов — после 22:00."],
      habitChanges: [
        "За месяц больше всего изменилась привычка после работы — она стала спокойнее.",
      ],
      causes: [
        { title: "Усталость", share: 41, note: "Чаще всего — после 21:00 в будни." },
        { title: "Скука", share: 27, note: "В основном днём, в перерывах." },
        { title: "Автопилот", share: 18, note: "Открытие без повода, сразу после разблокировки." },
      ],
      situations: [{ title: "После работы, дома", note: "Повторяется в 6 из 14 записей." }],
      emotions: [{ title: "Опустошённость", note: "Встречается почти во всех вечерних записях." }],
      times: [{ title: "21:00–23:00", note: "Здесь 15 из 17 срывов за месяц." }],
      weekdays: [{ title: "Воскресенье", note: "Три недели подряд — самый тяжёлый день." }],
      hypotheses: [
        {
          text: "Похоже, прогулки вечером уменьшают вероятность открытия ленты: после пяти прогулок срывов не было.",
          confidence: "medium",
        },
      ],
      selfComparison: ["За месяц спокойных дней стало на 24% больше, чем в прошлом."],
      longTerm: ["Раньше самым трудным временем был обед; уже месяц это поздний вечер."],
      numbers: {
        headline: "Вы вернули почти 17 часов.",
        equivalents: ["около восьми фильмов", "две рабочие смены", "34 прогулки по 30 минут"],
      },
    },
    memory: {
      summary: "Пример памяти коуча.",
      timeline: [],
      milestones: [{ date: "сентябрь", note: "самая длинная серия — 9 дней" }],
      hypotheses: [],
      openQuestions: [],
    },
    challenge: {
      id: "demo",
      title: "Телефон вне спальни",
      description: "Три вечера подряд оставляйте телефон заряжаться за пределами спальни с 22:30.",
      durationDays: 3,
      focus: "evening",
      expectation: "Посмотрим, станет ли меньше поздних срывов.",
      status: "proposed",
      proposedAt: now,
      startDay: null,
      startedAt: null,
      endDay: null,
      checkins: {},
      review: null,
    },
  };
}
