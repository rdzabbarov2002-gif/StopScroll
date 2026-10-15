import type {
  AiAnalytics,
  AiChallenge,
  AiForecast,
  AiMemory,
  AiQuestion,
  ChallengeFocus,
  EntryAnalysis,
  RiskLevel,
  TitledNote,
} from "./types";

/**
 * Checks what comes back from the server (and from storage) before it reaches the screen.
 * Only the shape and sizes are checked here — the content is ChatGPT's and is not touched.
 */

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const text = (value: unknown, max = 600): string | null =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;

const texts = (value: unknown, limit: number, max = 400): string[] =>
  Array.isArray(value)
    ? value
        .map((item) => text(item, max))
        .filter((item): item is string => item !== null)
        .slice(0, limit)
    : [];

function list<T>(value: unknown, limit: number, parse: (item: unknown) => T | null): T[] {
  return Array.isArray(value)
    ? value
        .map(parse)
        .filter((item): item is T => item !== null)
        .slice(0, limit)
    : [];
}

const titled = (value: unknown): TitledNote | null => {
  if (!isRecord(value)) return null;
  const title = text(value.title, 120);
  return title ? { title, note: text(value.note) ?? "" } : null;
};

const oneOf = <T extends string>(value: unknown, options: readonly T[]): T | null =>
  typeof value === "string" && (options as readonly string[]).includes(value) ? (value as T) : null;

const clock = (value: unknown): string | null =>
  typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value.trim()) ? value.trim() : null;

export function parseEntryAnalysis(raw: unknown, analyzedAt: number): EntryAnalysis | null {
  if (!isRecord(raw) || typeof raw.enough !== "boolean") return null;
  const explanation = text(raw.explanation, 800);
  if (!explanation) return null;
  return {
    enough: raw.enough,
    cause: text(raw.cause, 120),
    emotion: text(raw.emotion, 120),
    context: text(raw.context, 300),
    behavior: text(raw.behavior, 120),
    explanation,
    missing: text(raw.missing, 300),
    tags: texts(raw.tags, 4, 40).map((tag) => tag.toLowerCase()),
    analyzedAt: typeof raw.analyzedAt === "number" ? raw.analyzedAt : analyzedAt,
  };
}

export function parseMemory(raw: unknown): AiMemory | null {
  if (!isRecord(raw)) return null;
  return {
    summary: text(raw.summary, 1200) ?? "",
    timeline: list(raw.timeline, 24, (item) => {
      if (!isRecord(item)) return null;
      const period = text(item.period, 40);
      const note = text(item.note, 300);
      return period && note ? { period, note } : null;
    }),
    milestones: list(raw.milestones, 12, (item) => {
      if (!isRecord(item)) return null;
      const date = text(item.date, 40);
      const note = text(item.note, 300);
      return date && note ? { date, note } : null;
    }),
    hypotheses: list(raw.hypotheses, 8, (item) => {
      if (!isRecord(item)) return null;
      const statement = text(item.text, 300);
      const status = oneOf(item.status, ["proposed", "supported", "weakened"] as const);
      return statement && status ? { text: statement, status } : null;
    }),
    openQuestions: texts(raw.openQuestions, 4, 200),
  };
}

export function parseAnalytics(raw: unknown): AiAnalytics | null {
  if (!isRecord(raw)) return null;
  const conclusion = text(raw.conclusion, 800);
  if (!conclusion) return null;
  const numbers = isRecord(raw.numbers) ? raw.numbers : null;
  const headline = numbers ? text(numbers.headline, 200) : null;
  return {
    causes: list(raw.causes, 5, (item) => {
      const base = titled(item);
      if (!base || !isRecord(item)) return null;
      const share =
        typeof item.share === "number" && item.share >= 0 && item.share <= 100
          ? Math.round(item.share)
          : null;
      return { ...base, share };
    }),
    situations: list(raw.situations, 5, titled),
    emotions: list(raw.emotions, 5, titled),
    times: list(raw.times, 3, titled),
    weekdays: list(raw.weekdays, 3, titled),
    improvements: texts(raw.improvements, 4),
    worsenings: texts(raw.worsenings, 4),
    habitChanges: texts(raw.habitChanges, 4),
    hypotheses: list(raw.hypotheses, 4, (item) => {
      if (!isRecord(item)) return null;
      const statement = text(item.text, 400);
      const confidence = oneOf(item.confidence, ["low", "medium", "high"] as const);
      return statement && confidence ? { text: statement, confidence } : null;
    }),
    warnings: texts(raw.warnings, 3),
    selfComparison: texts(raw.selfComparison, 3),
    longTerm: texts(raw.longTerm, 3),
    numbers: headline ? { headline, equivalents: texts(numbers!.equivalents, 4, 120) } : null,
    conclusion,
    dataNote: text(raw.dataNote, 400),
  };
}

export function parseForecast(raw: unknown, day: string, createdAt: number): AiForecast | null {
  if (!isRecord(raw)) return null;
  const headline = text(raw.headline, 200);
  if (!headline) return null;
  const probability =
    typeof raw.probability === "number" && raw.probability >= 0 && raw.probability <= 100
      ? Math.round(raw.probability)
      : null;
  const window = isRecord(raw.window) ? raw.window : {};
  return {
    probability,
    level: oneOf<RiskLevel>(raw.level, ["low", "medium", "high"]),
    headline,
    reasons: texts(raw.reasons, 4, 300),
    window: { until: clock(window.until), message: text(window.message, 300) },
    passed: text(raw.passed, 300),
    advice: text(raw.advice, 300),
    basis: text(raw.basis, 300) ?? "",
    validUntil: clock(raw.validUntil),
    day: typeof raw.day === "string" ? raw.day : day,
    createdAt: typeof raw.createdAt === "number" ? raw.createdAt : createdAt,
  };
}

export function parseQuestion(raw: unknown, id: string, askedAt: number): AiQuestion | null {
  if (!isRecord(raw)) return null;
  const question = text(raw.text, 200);
  const kind = oneOf(raw.kind, ["yes_no", "choice"] as const);
  if (!question || !kind) return null;
  const options = kind === "yes_no" ? ["Да", "Нет"] : texts(raw.options, 6, 60);
  if (options.length < 2) return null;
  return {
    id: typeof raw.id === "string" ? raw.id : id,
    text: question,
    kind,
    options,
    askedAt: typeof raw.askedAt === "number" ? raw.askedAt : askedAt,
  };
}

const FOCUSES: readonly ChallengeFocus[] = ["morning", "day", "evening", "night", "all"];

/** A newly proposed experiment, or a stored one (with its status and progress). */
export function parseChallenge(raw: unknown, id: string, proposedAt: number): AiChallenge | null {
  if (!isRecord(raw)) return null;
  const title = text(raw.title, 120);
  const description = text(raw.description, 400);
  if (!title || !description) return null;
  const duration =
    typeof raw.durationDays === "number"
      ? Math.min(7, Math.max(1, Math.round(raw.durationDays)))
      : 3;
  const checkins: Record<string, boolean> = {};
  if (isRecord(raw.checkins)) {
    for (const [day, value] of Object.entries(raw.checkins)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(day) && typeof value === "boolean") checkins[day] = value;
    }
  }
  const dayOrNull = (value: unknown) =>
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
  return {
    id: typeof raw.id === "string" ? raw.id : id,
    title,
    description,
    durationDays: duration,
    focus: oneOf(raw.focus, FOCUSES) ?? "all",
    expectation: text(raw.expectation, 300) ?? "",
    status:
      oneOf(raw.status, ["proposed", "active", "reviewing", "done", "declined"] as const) ??
      "proposed",
    proposedAt: typeof raw.proposedAt === "number" ? raw.proposedAt : proposedAt,
    startDay: dayOrNull(raw.startDay),
    endDay: dayOrNull(raw.endDay),
    checkins,
    review: text(raw.review, 600),
  };
}
