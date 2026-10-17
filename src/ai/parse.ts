import { m } from "../i18n";
import type {
  AiChallenge,
  AiMemory,
  AiQuestion,
  Belief,
  BeliefKind,
  BeliefStatus,
  ChallengeFocus,
  EntryAnalysis,
  EntryVote,
  QueuedQuestion,
  TipTime,
  TitledNote,
} from "./types";

/**
 * Checks what comes back from the server (and from storage) before it is used. Only the shape
 * and sizes are checked here — the content is ChatGPT's and is not touched.
 */

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const text = (value: unknown, max = 600): string | null =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;

export const texts = (value: unknown, limit: number, max = 400): string[] =>
  Array.isArray(value)
    ? value
        .map((item) => text(item, max))
        .filter((item): item is string => item !== null)
        .slice(0, limit)
    : [];

export function list<T>(value: unknown, limit: number, parse: (item: unknown) => T | null): T[] {
  return Array.isArray(value)
    ? value
        .map(parse)
        .filter((item): item is T => item !== null)
        .slice(0, limit)
    : [];
}

export const oneOf = <T extends string>(value: unknown, options: readonly T[]): T | null =>
  typeof value === "string" && (options as readonly string[]).includes(value) ? (value as T) : null;

export const integer = (value: unknown, min: number, max: number): number | null =>
  typeof value === "number" && Number.isInteger(value) && value >= min && value <= max
    ? value
    : null;

const count = (value: unknown) =>
  typeof value === "number" && value >= 0 ? Math.min(99_999, Math.floor(value)) : 0;

/** 0–100, rounded to 5; the first reading's 40/70/95 pass through unchanged. */
export const confidence = (value: unknown, fallback = 70) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(100, Math.max(0, Math.round(value / 5) * 5))
    : fallback;

export const titled = (value: unknown): TitledNote | null => {
  if (!isRecord(value)) return null;
  const title = text(value.title, 120);
  return title ? { title, note: text(value.note) ?? "" } : null;
};

export const parseVotes = (value: unknown, limit = 6): EntryVote[] => {
  const seen = new Set<string>();
  return list(value, limit, (item) => {
    if (!isRecord(item)) return null;
    const id = text(item.id, 20);
    const effect = oneOf(item.effect, ["support", "against"] as const);
    if (!id || !effect || seen.has(id)) return null;
    seen.add(id);
    return { id, effect };
  });
};

/**
 * A stored analysis (`explanation`) or a fresh one from the server (`insight`). The phone caps
 * the stated confidence: "not enough information" is never more than a guess, and a few words
 * are never certain.
 */
export function parseEntryAnalysis(
  raw: unknown,
  analyzedAt: number,
  textLength = Infinity,
): EntryAnalysis | null {
  if (!isRecord(raw) || typeof raw.enough !== "boolean") return null;
  const missing = text(raw.missing, 300);
  let conf = confidence(raw.conf);
  if (!raw.enough || missing) conf = Math.min(conf, 40);
  if (textLength < 30) conf = Math.min(conf, 70);
  return {
    enough: raw.enough,
    cause: text(raw.cause, 120),
    emotion: text(raw.emotion, 120),
    context: text(raw.context, 300),
    behavior: text(raw.behavior, 120),
    explanation: text(raw.explanation ?? raw.insight, 800),
    missing,
    tags: texts(raw.tags, 4, 40).map((tag) => tag.toLowerCase()),
    gist: text(raw.gist, 160),
    conf,
    analyzedAt: typeof raw.analyzedAt === "number" ? raw.analyzedAt : analyzedAt,
  };
}

/** One item of `/entry`'s `results`: which entry (n), its analysis and the votes. */
export function parseEntryResult(
  raw: unknown,
  analyzedAt: number,
  textLength = Infinity,
): { n: number; analysis: EntryAnalysis; votes: EntryVote[] } | null {
  if (!isRecord(raw) || typeof raw.n !== "number") return null;
  const analysis = parseEntryAnalysis(raw, analyzedAt, textLength);
  if (!analysis) return null;
  return { n: raw.n, analysis, votes: parseVotes(raw.votes) };
}

export const KINDS: readonly BeliefKind[] = ["hypothesis", "trigger", "zone", "tip"];
export const STATUSES: readonly BeliefStatus[] = [
  "proposed",
  "supported",
  "established",
  "weakened",
  "retired",
  "superseded",
];
const TIP_TIMES: readonly TipTime[] = ["morning", "day", "evening", "night", "any"];
const MONTH = /^\d{4}-\d{2}$/;

const pair = (value: unknown, keys: [string, string]) => {
  const record = isRecord(value) ? value : {};
  return { [keys[0]]: count(record[keys[0]]), [keys[1]]: count(record[keys[1]]) } as Record<
    string,
    number
  >;
};

/** A stored belief. */
export function parseBelief(raw: unknown): Belief | null {
  if (!isRecord(raw)) return null;
  const id = text(raw.id, 20);
  const kind = oneOf(raw.kind, KINDS);
  const statement = text(raw.text, 300);
  const status = oneOf(raw.status, STATUSES);
  if (!id || !kind || !statement || !status) return null;
  const zone = isRecord(raw.zone)
    ? {
        weekday: integer(raw.zone.weekday, 0, 6),
        from: integer(raw.zone.from, 0, 23),
        to: integer(raw.zone.to, 0, 23),
      }
    : null;
  const legacy = pair(raw.legacy, ["support", "against"]);
  const answers = pair(raw.answers, ["support", "against"]);
  const trials = pair(raw.trials, ["helped", "failed"]);
  return {
    id,
    kind,
    text: statement,
    note: text(raw.note, 300) ?? "",
    status,
    since: typeof raw.since === "string" && MONTH.test(raw.since) ? raw.since : "",
    until: typeof raw.until === "string" && MONTH.test(raw.until) ? raw.until : null,
    statusAt: typeof raw.statusAt === "number" ? raw.statusAt : 0,
    flips: (Array.isArray(raw.flips) ? raw.flips : [])
      .filter((value): value is number => typeof value === "number")
      .slice(-6),
    by: text(raw.by, 20),
    zone,
    when: oneOf(raw.when, TIP_TIMES),
    cites: texts(raw.cites, 4, 60),
    legacy: { support: legacy.support!, against: legacy.against! },
    answers: { support: answers.support!, against: answers.against! },
    trials: { helped: trials.helped!, failed: trials.failed! },
    history: list(raw.history, 4, (item) => {
      if (!isRecord(item) || typeof item.at !== "number") return null;
      const old = text(item.text, 300);
      const was = oneOf(item.status, STATUSES);
      return old && was ? { at: item.at, text: old, status: was } : null;
    }),
  };
}

const dated = (value: unknown, limit: number) =>
  list(value, limit, (item) => {
    if (!isRecord(item)) return null;
    const date = text(item.date, 40);
    const note = text(item.note, 300);
    return date && note ? { date, note } : null;
  });

const BELIEF_LIMIT = 80;

/** The stored memory, current version; or an earlier version, converted (nothing is dropped). */
export function parseMemory(raw: unknown): AiMemory | null {
  if (!isRecord(raw)) return null;
  if (!Array.isArray(raw.beliefs)) return migrateMemory(raw);
  const conclusion = text(raw.conclusion, 800);
  const profile = text(raw.profile, 800);
  if (!conclusion && !profile) return null;
  return {
    profile: profile ?? "",
    conclusion: conclusion ?? "",
    emotions: list(raw.emotions, 4, titled),
    strengths: texts(raw.strengths, 3, 300),
    weaknesses: texts(raw.weaknesses, 3, 300),
    changes: texts(raw.changes, 4),
    improvements: texts(raw.improvements, 3),
    worsenings: texts(raw.worsenings, 3),
    events: dated(raw.events, 24),
    beliefs: list(raw.beliefs, BELIEF_LIMIT, parseBelief),
    corrections: list(raw.corrections, 60, (item) => {
      if (!isRecord(item) || typeof item.at !== "number") return null;
      const was = text(item.was, 200);
      const now = text(item.now, 200);
      return was && now
        ? {
            at: item.at,
            was,
            now,
            why: text(item.why, 300) ?? "",
            refs: texts(item.refs, 6, 60),
            beliefId: text(item.beliefId, 20),
          }
        : null;
    }),
    chapters: list(raw.chapters, 48, (item) => {
      if (!isRecord(item) || typeof item.month !== "string" || !MONTH.test(item.month)) return null;
      const note = text(item.note, 240);
      return note ? { month: item.month, note } : null;
    }),
    openQuestions: texts(raw.openQuestions, 3, 200),
    rejected: texts(raw.rejected, 3, 200),
  };
}

/** The next free id with this prefix: h1, h2, … (ids are never reused). */
export function nextId(beliefs: readonly Pick<Belief, "id">[], prefix: string) {
  const numbers = beliefs
    .filter((belief) => belief.id.startsWith(prefix))
    .map((belief) => Number(belief.id.slice(prefix.length)))
    .filter((value) => Number.isInteger(value));
  return `${prefix}${Math.max(0, ...numbers) + 1}`;
}

const newBelief = (
  id: string,
  kind: BeliefKind,
  statement: string,
  note: string,
  status: BeliefStatus,
  extra: Partial<Belief> = {},
): Belief => ({
  id,
  kind,
  text: statement,
  note,
  status,
  since: "",
  until: null,
  statusAt: 0,
  flips: [],
  by: null,
  zone: null,
  when: null,
  cites: [],
  legacy: { support: 0, against: 0 },
  answers: { support: 0, against: 0 },
  trials: { helped: 0, failed: 0 },
  history: [],
  ...extra,
});

/**
 * Memory written by earlier versions of the coach: lists of triggers, dangerous periods, tips and
 * hypotheses (with vote counts), or an even older summary with a timeline. Everything becomes
 * beliefs and events; the counted votes become each belief's starting evidence.
 */
function migrateMemory(raw: Record<string, unknown>): AiMemory | null {
  const beliefs: Belief[] = [];
  const add = (prefix: string, item: Belief) =>
    beliefs.push({ ...item, id: nextId(beliefs, prefix) });
  const hypotheses = list(raw.hypotheses, 8, (item) => {
    if (!isRecord(item)) return null;
    const statement = text(item.text, 300);
    if (!statement) return null;
    const status = oneOf(item.status, ["proposed", "supported", "weakened"] as const) ?? "proposed";
    return {
      id: text(item.id, 20),
      statement,
      status,
      support: count(item.support),
      against: count(item.against),
    };
  });
  for (const item of hypotheses) {
    const belief = newBelief(item.id ?? "", "hypothesis", item.statement, "", item.status, {
      legacy: { support: item.support, against: item.against },
    });
    if (item.id && /^h\d+$/.test(item.id) && !beliefs.some((b) => b.id === item.id)) {
      beliefs.push(belief);
    } else {
      add("h", belief);
    }
  }
  for (const item of list(raw.triggers, 5, titled)) {
    add("t", newBelief("", "trigger", item.title, item.note, "supported"));
  }
  for (const item of list(raw.dangerZones, 4, (value) => {
    const base = titled(value);
    return base && isRecord(value)
      ? {
          ...base,
          zone: {
            weekday: integer(value.weekday, 0, 6),
            from: integer(value.from, 0, 23),
            to: integer(value.to, 0, 23),
          },
        }
      : null;
  })) {
    add("z", newBelief("", "zone", item.title, item.note, "supported", { zone: item.zone }));
  }
  for (const item of list(raw.tips, 4, (value) => {
    if (!isRecord(value)) return null;
    const tip = text(value.text, 300);
    return tip ? { tip, when: oneOf(value.when, TIP_TIMES) ?? "any" } : null;
  })) {
    add("p", newBelief("", "tip", item.tip, "", "proposed", { when: item.when }));
  }
  const events = [
    ...dated(raw.events, 24),
    // The oldest version: a dated timeline and milestones.
    ...list(raw.timeline, 24, (item) => {
      if (!isRecord(item)) return null;
      const date = text(item.period, 40);
      const note = text(item.note, 300);
      return date && note ? { date, note } : null;
    }),
    ...dated(raw.milestones, 12),
  ].slice(-24);
  const profile = text(raw.profile ?? raw.summary, 800) ?? "";
  const conclusion = text(raw.conclusion, 800) ?? "";
  if (!profile && !conclusion && !beliefs.length) return null;
  return {
    profile,
    conclusion,
    emotions: list(raw.emotions, 4, titled),
    strengths: texts(raw.strengths, 3, 300),
    weaknesses: texts(raw.weaknesses, 3, 300),
    changes: texts(raw.changes, 4),
    improvements: texts(raw.improvements, 3),
    worsenings: texts(raw.worsenings, 3),
    events,
    beliefs,
    corrections: [],
    chapters: [],
    openQuestions: texts(raw.openQuestions, 3, 200),
    rejected: [],
  };
}

export { newBelief };

const parseQueued = (raw: unknown): QueuedQuestion | null => {
  if (!isRecord(raw)) return null;
  const question = text(raw.text, 200);
  const kind = oneOf(raw.kind, ["yes_no", "choice"] as const);
  if (!question || !kind) return null;
  const options = kind === "yes_no" ? [m().ai.yes, m().ai.no] : texts(raw.options, 6, 60);
  return options.length >= 2
    ? { text: question, kind, options, about: kind === "yes_no" ? text(raw.about, 20) : null }
    : null;
};

export const parseQuestions = (raw: unknown): QueuedQuestion[] => list(raw, 2, parseQueued);

export function parseQuestion(raw: unknown, id: string, askedAt: number): AiQuestion | null {
  const question = parseQueued(raw);
  if (!question || !isRecord(raw)) return null;
  return {
    ...question,
    // A stored question keeps the options it was shown with.
    options:
      question.kind === "yes_no" && Array.isArray(raw.options) && raw.options.length === 2
        ? texts(raw.options, 2, 60)
        : question.options,
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
    tipId: text(raw.tipId ?? raw.tip, 20),
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
