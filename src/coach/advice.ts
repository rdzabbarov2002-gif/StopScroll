import { m } from "../i18n";
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

const feedName = (app: FeedApp) => (app === "other" ? null : getFeedApp(app).label);

const reasonIs = (context: AdviceContext, ...ids: TriggerId[]) =>
  context.reason !== null && ids.includes(context.reason);

const eveningStart = (context: AdviceContext) => {
  const start = context.timePattern ? patternStartHour(context.timePattern) : null;
  return start !== null && start >= 17 && start <= 23 ? start : null;
};

/** The advice texts of the current language. */
const t = () => m().coach.advice;

export const ADVICE_RULES: readonly AdviceRule[] = [
  {
    id: "early-sleep",
    focus: "evening",
    score: (context) =>
      (reasonIs(context, "fatigue", "sleepless") ? 4 : 0) +
      ((eveningStart(context) ?? 0) >= 22 ? 2 : 0),
    text: (_context, say) => say(t().earlySleep),
  },
  {
    id: "phone-away-evening",
    focus: "evening",
    score: (context) =>
      eveningStart(context) !== null ? 3 + (context.risk === "high" ? 1 : 0) : 0,
    text: (context, say) => say(t().phoneAway)(clock(eveningStart(context) ?? 21)),
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
      context.walksHelp ? say(t().walkHelps) : t().walkTry(feedName(context.mainApp)),
  },
  {
    id: "living-alternative",
    focus: "day",
    score: (context) => (reasonIs(context, "boredom") ? 3.5 : 0),
    text: (_context, say) => say(t().livingAlternative),
  },
  {
    id: "move-app",
    focus: "day",
    score: (context) => (reasonIs(context, "autopilot") ? 3.5 : 0),
    text: (context) => {
      const app = feedName(context.mainApp);
      return app === null ? t().moveApps : t().moveApp(app);
    },
  },
  {
    id: "breathe-first",
    focus: "day",
    score: (context) => (reasonIs(context, "stress") ? 3.5 : 0),
    text: (_context, say) => say(t().breatheFirst),
  },
  {
    id: "call-someone",
    focus: "day",
    score: (context) => (reasonIs(context, "loneliness") ? 3.5 : 0),
    text: () => t().callSomeone,
  },
  {
    id: "tiny-step",
    focus: "day",
    score: (context) => (reasonIs(context, "procrastination") ? 3.5 : 0),
    text: () => t().tinyStep,
  },
  {
    id: "real-rest",
    focus: "evening",
    replacementId: "muscle-relax",
    score: (context) => (reasonIs(context, "relax") ? 3.5 : 0),
    text: () => t().realRest,
  },
  {
    id: "keep-rhythm",
    focus: "day",
    score: (context) => (context.risk === "low" ? 2 : 0),
    text: (context, say) => say(context.todayLogged ? t().keepRhythmLogged : t().keepRhythm),
  },
  {
    id: "log-today",
    focus: "day",
    score: (context) =>
      context.learning ? 3 : !context.todayLogged && context.hour >= 18 ? 1.5 : 0,
    text: (context) => (context.learning ? t().logLearning : t().logToday),
  },
  {
    id: "sos-ready",
    focus: "day",
    score: (context) => (context.risk === "high" ? 1.5 : 0.5),
    text: (_context, say) => say(t().sosReady),
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
