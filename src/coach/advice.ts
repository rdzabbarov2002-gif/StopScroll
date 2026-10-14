import { getFeedApp } from "../utils/catalog";
import type { FeedApp, RiskLevel, TriggerId } from "../utils/types";
import { clock, variant } from "./language";
import type { TimePattern } from "./patterns";
import { patternStartHour } from "./patterns";

/**
 * The coach's advice. Which one is given is decided by rules over the user's patterns (the
 * main reason, the risky hour, what helped before, how yesterday's advice went) — never by
 * chance. Only the wording varies from day to day.
 */

export interface AdviceContext {
  day: string;
  risk: RiskLevel | null;
  reason: TriggerId | null;
  timePattern: TimePattern | null;
  /** Walks were followed by no (or almost no) slips. */
  walksHelp: boolean;
  /** Days with a replacement go wrong clearly less often. */
  replacementsHelp: boolean;
  todayLogged: boolean;
  hour: number;
  mainApp: FeedApp;
  learning: boolean;
}

export interface Advice {
  id: string;
  text: string;
  /** A replacement worth offering right with the advice. */
  replacementId?: string;
  /** Evening advice is judged by the evening; the rest by the whole day. */
  focus: "evening" | "day";
}

interface AdviceRule {
  id: string;
  focus: Advice["focus"];
  replacementId?: string;
  score: (context: AdviceContext) => number;
  text: (context: AdviceContext, say: <T>(options: readonly T[]) => T) => string;
}

const feedName = (app: FeedApp) => (app === "other" ? "ленту" : getFeedApp(app).label);

const reasonIs = (context: AdviceContext, ...ids: TriggerId[]) =>
  context.reason !== null && ids.includes(context.reason);

const eveningStart = (context: AdviceContext) => {
  const start = context.timePattern ? patternStartHour(context.timePattern) : null;
  return start !== null && start >= 17 && start <= 23 ? start : null;
};

export const ADVICE_RULES: readonly AdviceRule[] = [
  {
    id: "early-sleep",
    focus: "evening",
    score: (context) =>
      (reasonIs(context, "fatigue", "sleepless") ? 4 : 0) +
      ((eveningStart(context) ?? 0) >= 22 ? 2 : 0),
    text: (_context, say) =>
      say([
        "Сегодня попробуй лечь на полчаса раньше и оставить телефон заряжаться за пределами спальни.",
        "Сегодня лучше лечь пораньше: уставшему мозгу лента всегда кажется хорошей идеей, а утром — нет.",
      ]),
  },
  {
    id: "phone-away-evening",
    focus: "evening",
    score: (context) =>
      eveningStart(context) !== null ? 3 + (context.risk === "high" ? 1 : 0) : 0,
    text: (context, say) => {
      const hour = eveningStart(context) ?? 21;
      return say([
        `Сегодня после ужина убери телефон в другую комнату хотя бы на 15 минут — особенно ближе к ${clock(hour)}.`,
        `Ближе к ${clock(hour)} положи телефон экраном вниз в другой комнате и дай вечеру пройти без ленты.`,
      ]);
    },
  },
  {
    id: "walk-instead",
    focus: "day",
    replacementId: "walk-3",
    score: (context) =>
      (context.walksHelp ? 3.6 : 0) +
      (context.replacementsHelp ? 1.5 : 0) +
      (reasonIs(context, "boredom") ? 1 : 0),
    text: (context, say) =>
      context.walksHelp
        ? say([
            "После прогулок у тебя почти не бывает срывов. Сегодня, когда потянет в ленту, начни с пяти минут на улице.",
            "Прогулки тебе помогают — это видно по данным. Когда сегодня потянет в ленту, выйди пройтись хотя бы на пять минут.",
          ])
        : `Когда сегодня потянет в ${feedName(context.mainApp)}, попробуй заменить ленту короткой прогулкой.`,
  },
  {
    id: "living-alternative",
    focus: "day",
    score: (context) => (reasonIs(context, "boredom") ? 3.5 : 0),
    text: (_context, say) =>
      say([
        "Положи на виду одну «живую» альтернативу ленте — книгу, блокнот, гитару. Скуке нужна новизна, а не бесконечная прокрутка.",
        "Подготовь заранее одно дело на случай скуки: страницу книги, короткую задачку, звонок. Тогда ленте будет с чем соревноваться.",
      ]),
  },
  {
    id: "move-app",
    focus: "day",
    score: (context) => (reasonIs(context, "autopilot") ? 3.5 : 0),
    text: (context) =>
      context.mainApp === "other"
        ? "Убери приложения с лентой с первого экрана. Автопилот срабатывает быстрее мысли — пусть у него будет на шаг больше."
        : `Убери ${feedName(context.mainApp)} с первого экрана телефона. Автопилот срабатывает быстрее мысли — пусть у него будет на шаг больше.`,
  },
  {
    id: "breathe-first",
    focus: "day",
    score: (context) => (reasonIs(context, "stress") ? 3.5 : 0),
    text: (_context, say) =>
      say([
        "Если сегодня станет тревожно, сначала сделай длинный выдох или SOS-паузу. Лента обещает побег, но тревога потом возвращается.",
        "Когда накатит напряжение, дай себе 15 секунд SOS-паузы, прежде чем открывать ленту. Телу это помогает быстрее, чем видео.",
      ]),
  },
  {
    id: "call-someone",
    focus: "day",
    score: (context) => (reasonIs(context, "loneliness") ? 3.5 : 0),
    text: () =>
      "Напиши сегодня одному близкому человеку. Живой разговор греет лучше, чем чужие жизни в ленте.",
  },
  {
    id: "tiny-step",
    focus: "day",
    score: (context) => (reasonIs(context, "procrastination") ? 3.5 : 0),
    text: () =>
      "Если сегодня захочется отложить дело, сделай только первый шаг на две минуты. Лента чаще всего нужна, чтобы не начинать.",
  },
  {
    id: "real-rest",
    focus: "evening",
    replacementId: "muscle-relax",
    score: (context) => (reasonIs(context, "relax") ? 3.5 : 0),
    text: () =>
      "Выбери сегодня отдых, после которого правда легче: душ, музыку с закрытыми глазами или растяжку на пять минут.",
  },
  {
    id: "keep-rhythm",
    focus: "day",
    score: (context) => (context.risk === "low" ? 2 : 0),
    text: (context, say) =>
      context.todayLogged
        ? say([
            "Риск сегодня низкий — просто держи свой ритм. Если потянет в ленту, пауза всегда под рукой.",
            "Сегодня спокойный день. Ничего не нужно доказывать — просто продолжай как есть.",
          ])
        : say([
            "Риск сегодня низкий — просто держи свой ритм. Вечером отметь время в ленте, чтобы серия продолжилась.",
            "Сегодня спокойный день. Не забудь вечером отметить время в ленте — серия держится на этих отметках.",
          ]),
  },
  {
    id: "log-today",
    focus: "day",
    score: (context) =>
      context.learning ? 3 : !context.todayLogged && context.hour >= 18 ? 1.5 : 0,
    text: (context) =>
      context.learning
        ? "Отмечай каждый день, сколько времени ушло на ленту, и записывай срывы. Через несколько дней я смогу говорить о твоих привычках конкретно."
        : "Отметь сегодня, сколько времени ушло на ленту, — так мне будет проще увидеть закономерности.",
  },
  {
    id: "sos-ready",
    focus: "day",
    score: (context) => (context.risk === "high" ? 1.5 : 0.5),
    text: (_context, say) =>
      say([
        "Держи под рукой SOS-паузу: 15 секунд дыхания — и решение снова за тобой.",
        "Если импульс окажется сильным, нажми SOS-паузу. Она не запрещает, а просто даёт время подумать.",
      ]),
  },
];

export const getAdviceRule = (id: string) => ADVICE_RULES.find((rule) => rule.id === id);

export type AdviceOutcome = "worked" | "missed";

/**
 * Picks today's advice. `previous` is the coach's memory: advice that worked yesterday is worth
 * repeating, advice that didn't is set aside, and the same tip three days running gets a rest.
 */
export function chooseAdvice(
  context: AdviceContext,
  previous: { advice: string; outcome: AdviceOutcome | null }[],
): Advice {
  let best: { rule: AdviceRule; score: number } | null = null;
  for (const rule of ADVICE_RULES) {
    let score = rule.score(context);
    if (score <= 0) continue;
    const yesterday = previous[0];
    if (yesterday?.advice === rule.id) {
      if (yesterday.outcome === "worked") score += 2;
      if (yesterday.outcome === "missed") score -= 2;
    }
    if (previous.length >= 3 && previous.slice(0, 3).every((entry) => entry.advice === rule.id)) {
      score -= 1.5;
    }
    if (!best || score > best.score) best = { rule, score };
  }
  const rule = best?.rule ?? ADVICE_RULES[ADVICE_RULES.length - 1]!;
  const say = <T>(options: readonly T[]) => variant(`${context.day}:${rule.id}`, options);
  return {
    id: rule.id,
    text: rule.text(context, say),
    focus: rule.focus,
    ...(rule.replacementId ? { replacementId: rule.replacementId } : {}),
  };
}
