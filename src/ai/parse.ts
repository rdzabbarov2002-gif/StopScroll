import type {
  AiChallenge,
  AiMemory,
  AiQuestion,
  ChallengeFocus,
  DangerZone,
  EntryAnalysis,
  MemoryHypothesis,
  QueuedQuestion,
  TipTime,
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

const oneOf = <T extends string>(value: unknown, options: readonly T[]): T | null =>
  typeof value === "string" && (options as readonly string[]).includes(value) ? (value as T) : null;

const integer = (value: unknown, min: number, max: number): number | null =>
  typeof value === "number" && Number.isInteger(value) && value >= min && value <= max
    ? value
    : null;

const count = (value: unknown) =>
  typeof value === "number" && value >= 0 ? Math.min(9999, Math.floor(value)) : 0;

export const titled = (value: unknown): TitledNote | null => {
  if (!isRecord(value)) return null;
  const title = text(value.title, 120);
  return title ? { title, note: text(value.note) ?? "" } : null;
};

/** A stored analysis (`explanation`) or a fresh one from the server (`insight`). */
export function parseEntryAnalysis(raw: unknown, analyzedAt: number): EntryAnalysis | null {
  if (!isRecord(raw) || typeof raw.enough !== "boolean") return null;
  return {
    enough: raw.enough,
    cause: text(raw.cause, 120),
    emotion: text(raw.emotion, 120),
    context: text(raw.context, 300),
    behavior: text(raw.behavior, 120),
    explanation: text(raw.explanation ?? raw.insight, 800),
    missing: text(raw.missing, 300),
    tags: texts(raw.tags, 4, 40).map((tag) => tag.toLowerCase()),
    gist: text(raw.gist, 160),
    analyzedAt: typeof raw.analyzedAt === "number" ? raw.analyzedAt : analyzedAt,
  };
}

export interface EntryVote {
  id: string;
  effect: "support" | "against";
}

/** One item of `/entry`'s `results`: which entry (n), its analysis and the hypothesis votes. */
export function parseEntryResult(
  raw: unknown,
  analyzedAt: number,
): { n: number; analysis: EntryAnalysis; votes: EntryVote[] } | null {
  if (!isRecord(raw) || typeof raw.n !== "number") return null;
  const analysis = parseEntryAnalysis(raw, analyzedAt);
  if (!analysis) return null;
  const votes = list(raw.votes, 6, (item) => {
    if (!isRecord(item)) return null;
    const id = text(item.id, 20);
    const effect = oneOf(item.effect, ["support", "against"] as const);
    return id && effect ? { id, effect } : null;
  });
  return { n: raw.n, analysis, votes };
}

const TIP_TIMES: readonly TipTime[] = ["morning", "day", "evening", "night", "any"];
const STATUSES = ["proposed", "supported", "weakened"] as const;

/**
 * Hypotheses keep their id across analyses, so the votes counted from single entries add up.
 * `previous` is the memory the server was given: a returned id (or the same text) keeps its
 * counts, anything else gets a new id. Without `previous` (from storage) ids and counts are read.
 */
function parseHypotheses(value: unknown, previous: MemoryHypothesis[] | null) {
  const items = list(value, 6, (item) => {
    if (!isRecord(item)) return null;
    const statement = text(item.text, 300);
    const status = oneOf(item.status, STATUSES) ?? (previous ? null : "proposed");
    if (!statement || !status) return null;
    return { id: text(item.id, 20), text: statement, status, raw: item };
  });
  const numbers = (previous ?? items)
    .map((item) => Number(item.id?.slice(1)))
    .filter((value) => Number.isInteger(value));
  let next = Math.max(0, ...numbers) + 1;
  const used = new Set<string>();
  const result: MemoryHypothesis[] = [];
  for (const item of items) {
    const known = previous
      ? (previous.find((old) => old.id === item.id && !used.has(old.id)) ??
        previous.find((old) => old.text === item.text && !used.has(old.id)))
      : null;
    const id =
      known?.id ??
      (!previous && item.id && /^h\d+$/.test(item.id) && !used.has(item.id) ? item.id : null) ??
      `h${next++}`;
    used.add(id);
    result.push({
      id,
      text: item.text,
      status: item.status,
      support: known ? known.support : count(item.raw.support),
      against: known ? known.against : count(item.raw.against),
    });
  }
  return result;
}

const parseZone = (value: unknown): DangerZone | null => {
  const base = titled(value);
  if (!base || !isRecord(value)) return null;
  return {
    ...base,
    weekday: integer(value.weekday, 0, 6),
    from: integer(value.from, 0, 23),
    to: integer(value.to, 0, 23),
  };
};

/** The memory from the deep analysis (with `previous`, to carry the votes) or from storage. */
export function parseMemory(raw: unknown, previous: AiMemory | null = null): AiMemory | null {
  if (!isRecord(raw)) return null;
  // Memory written by the earlier version of the coach: a summary, a timeline and milestones.
  if (typeof raw.profile !== "string" && typeof raw.summary === "string") {
    return migrateMemory(raw);
  }
  const conclusion = text(raw.conclusion, 800);
  const profile = text(raw.profile, 800);
  if (!conclusion && !profile) return null;
  return {
    profile: profile ?? "",
    triggers: list(raw.triggers, 5, titled),
    emotions: list(raw.emotions, 4, titled),
    dangerZones: list(raw.dangerZones, 4, parseZone),
    strengths: texts(raw.strengths, 3, 300),
    weaknesses: texts(raw.weaknesses, 3, 300),
    tips: list(raw.tips, 4, (item) => {
      if (!isRecord(item)) return null;
      const tip = text(item.text, 300);
      return tip ? { text: tip, when: oneOf(item.when, TIP_TIMES) ?? "any" } : null;
    }),
    events: list(raw.events, 12, (item) => {
      if (!isRecord(item)) return null;
      const date = text(item.date, 40);
      const note = text(item.note, 300);
      return date && note ? { date, note } : null;
    }),
    changes: texts(raw.changes, 4),
    improvements: texts(raw.improvements, 3),
    worsenings: texts(raw.worsenings, 3),
    hypotheses: parseHypotheses(raw.hypotheses, previous?.hypotheses ?? null),
    conclusion: conclusion ?? "",
    openQuestions: texts(raw.openQuestions, 3, 200),
  };
}

function migrateMemory(raw: Record<string, unknown>): AiMemory {
  const dated = (value: unknown, key: "period" | "date") =>
    list(value, 24, (item) => {
      if (!isRecord(item)) return null;
      const date = text(item[key], 40);
      const note = text(item.note, 300);
      return date && note ? { date, note } : null;
    });
  return {
    profile: text(raw.summary, 800) ?? "",
    triggers: [],
    emotions: [],
    dangerZones: [],
    strengths: [],
    weaknesses: [],
    tips: [],
    events: [...dated(raw.timeline, "period"), ...dated(raw.milestones, "date")].slice(-12),
    changes: [],
    improvements: [],
    worsenings: [],
    hypotheses: parseHypotheses(raw.hypotheses, null),
    conclusion: "",
    openQuestions: texts(raw.openQuestions, 3, 200),
  };
}

const parseQueued = (raw: unknown): QueuedQuestion | null => {
  if (!isRecord(raw)) return null;
  const question = text(raw.text, 200);
  const kind = oneOf(raw.kind, ["yes_no", "choice"] as const);
  if (!question || !kind) return null;
  const options = kind === "yes_no" ? ["Да", "Нет"] : texts(raw.options, 6, 60);
  return options.length >= 2 ? { text: question, kind, options } : null;
};

export const parseQuestions = (raw: unknown): QueuedQuestion[] => list(raw, 2, parseQueued);

export function parseQuestion(raw: unknown, id: string, askedAt: number): AiQuestion | null {
  const question = parseQueued(raw);
  if (!question || !isRecord(raw)) return null;
  return {
    ...question,
    id: typeof raw.id === "string" ? raw.id : id,
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
    startedAt: typeof raw.startedAt === "number" && raw.startedAt > 0 ? raw.startedAt : null,
    endDay: dayOrNull(raw.endDay),
    checkins,
    review: text(raw.review, 600),
  };
}
