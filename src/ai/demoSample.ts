import { m } from "../i18n";
import { dayKey } from "../utils/date";
import type { AiAnalytics, AiChallenge, AiForecast } from "./types";

/**
 * Web preview only (EXPO_PUBLIC_DEMO=1 without an AI server): a sample of what the AI tab shows,
 * so the design can be seen. It is not an analysis — the screen labels it as an example and
 * never shows it in a store build or when the AI server is connected.
 */
export function demoSample(now: number): {
  analytics: AiAnalytics;
  forecast: AiForecast;
  challenge: AiChallenge;
} {
  const today = dayKey(now);
  const demo = m().ai.demo;
  const sample = demo.analytics;
  return {
    forecast: {
      probability: 72,
      level: "high",
      headline: demo.forecast.headline,
      reasons: [...demo.forecast.reasons],
      window: { until: "23:00", message: demo.forecast.window },
      passed: null,
      advice: demo.forecast.advice,
      basis: demo.forecast.basis,
      day: today,
      createdAt: now,
    },
    analytics: {
      conclusion: sample.conclusion,
      dataNote: sample.dataNote,
      warnings: [sample.warning],
      improvements: [sample.improvement],
      worsenings: [sample.worsening],
      habitChanges: [sample.habitChange],
      causes: sample.causes.map((cause, index) => ({
        ...cause,
        share: [41, 27, 18][index] ?? null,
      })),
      situations: [sample.situation],
      emotions: [sample.emotion],
      times: [sample.time],
      weekdays: [sample.weekday],
      hypotheses: [{ text: sample.hypothesis, confidence: "medium" }],
      selfComparison: [sample.selfComparison],
      longTerm: [...sample.longTerm],
      numbers: { headline: sample.savedHeadline, equivalents: [...sample.equivalents] },
    },
    challenge: {
      id: "demo",
      title: demo.challenge.title,
      description: demo.challenge.description,
      durationDays: 3,
      focus: "evening",
      expectation: demo.challenge.expectation,
      tipId: null,
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
