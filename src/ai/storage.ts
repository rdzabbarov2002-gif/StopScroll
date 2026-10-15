import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  parseChallenge,
  parseEntryAnalysis,
  parseMemory,
  parseQuestion,
  parseQuestions,
  titled,
} from "./parse";
import type { AiAnswer, AiEntry, AiMemory, AiState, EntryOutcome, EntryStatus } from "./types";

/**
 * The AI coach keeps its data apart from the main state:
 * - `@stopscroll/ai/v1` — consent, memory, questions, experiments;
 * - `@stopscroll/ai/entries/YYYY-MM` — the entries of one month.
 * Splitting by month keeps every stored value small (Android reads at most ~2 MB per value),
 * so the whole history can be kept without a cap on the number of entries.
 * Data saved by the earlier version of the coach is read and converted here.
 */
export const AI_META_KEY = "@stopscroll/ai/v1";
const ENTRIES_PREFIX = "@stopscroll/ai/entries/";
const CORRUPT_SUFFIX = ":corrupt";

/** Longest entry text kept (a few paragraphs); the rest of the record is never limited. */
export const MAX_ENTRY_LENGTH = 2000;
const MAX_ANSWERS = 60;
const MAX_PAST_CHALLENGES = 20;

export function createInitialAiState(): AiState {
  return {
    consent: null,
    entries: [],
    memory: null,
    deepAt: null,
    memorySince: null,
    deepRecordsKey: null,
    question: null,
    questionQueue: [],
    askedRecently: [],
    answers: [],
    lastQuestionAt: null,
    challenge: null,
    pastChallenges: [],
    deletedSinceDeep: [],
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isTimestamp = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const STATUSES: readonly EntryStatus[] = ["pending", "done", "failed"];
const OUTCOMES: readonly EntryOutcome[] = ["resisted", "opened"];

export function sanitizeEntry(value: unknown): AiEntry | null {
  if (!isRecord(value) || typeof value.id !== "string" || !isTimestamp(value.timestamp))
    return null;
  if (typeof value.text !== "string" || !value.text.trim()) return null;
  const analysis = parseEntryAnalysis(value.analysis, value.timestamp);
  const status = STATUSES.includes(value.status as EntryStatus)
    ? (value.status as EntryStatus)
    : "pending";
  return {
    id: value.id,
    timestamp: value.timestamp,
    text: value.text.slice(0, MAX_ENTRY_LENGTH),
    outcome: OUTCOMES.includes(value.outcome as EntryOutcome)
      ? (value.outcome as EntryOutcome)
      : null,
    // An analysis that didn't survive validation is asked for again.
    status: status === "done" && !analysis ? "pending" : status,
    attempts:
      typeof value.attempts === "number" && value.attempts >= 0 ? Math.floor(value.attempts) : 0,
    analysis,
    // `inInsights` — the earlier version's name for the same flag.
    inMemory: (value.inMemory === true || value.inInsights === true) && analysis !== null,
  };
}

function sanitizeAnswer(value: unknown): AiAnswer | null {
  if (!isRecord(value) || !isTimestamp(value.answeredAt)) return null;
  const { questionId, question, answer } = value;
  if (
    typeof questionId !== "string" ||
    typeof question !== "string" ||
    typeof answer !== "string"
  ) {
    return null;
  }
  return {
    questionId,
    question: question.slice(0, 200),
    answer: answer.slice(0, 60),
    answeredAt: value.answeredAt,
    inMemory: value.inMemory === true || value.inInsights === true,
  };
}

/**
 * The earlier version kept ChatGPT's analytics next to a smaller memory: its conclusions move
 * into the new memory, so nothing learned is lost before the next deep analysis.
 */
function withOldAnalytics(memory: AiMemory | null, analytics: unknown): AiMemory | null {
  if (!memory || memory.conclusion || !isRecord(analytics)) return memory;
  const strings = (value: unknown, limit: number) =>
    (Array.isArray(value) ? value : [])
      .filter((item): item is string => typeof item === "string" && item.trim() !== "")
      .map((item) => item.trim().slice(0, 400))
      .slice(0, limit);
  const notes = (value: unknown, limit: number) =>
    (Array.isArray(value) ? value : [])
      .map(titled)
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .slice(0, limit);
  return {
    ...memory,
    conclusion: typeof analytics.conclusion === "string" ? analytics.conclusion.slice(0, 800) : "",
    triggers: notes(analytics.situations, 5),
    emotions: notes(analytics.emotions, 4),
    dangerZones: strings(analytics.warnings, 3).map((note) => ({
      title: note.slice(0, 120),
      note,
      weekday: null,
      from: null,
      to: null,
    })),
    improvements: strings(analytics.improvements, 3),
    worsenings: strings(analytics.worsenings, 3),
    changes: strings(analytics.habitChanges, 4),
  };
}

/** Everything but the entries, checked field by field: a bad field falls back to empty. */
export function sanitizeAiMeta(value: unknown): Omit<AiState, "entries"> {
  const base = createInitialAiState();
  if (!isRecord(value)) return base;
  const challenge = parseChallenge(value.challenge, "", 0);
  const deepAt = isTimestamp(value.deepAt)
    ? value.deepAt
    : isTimestamp(value.insightsAt)
      ? value.insightsAt
      : null;
  const deleted = Array.isArray(value.deletedSinceDeep)
    ? value.deletedSinceDeep
    : Array.isArray(value.deletedSinceInsights)
      ? value.deletedSinceInsights
      : [];
  const recordsKey = value.deepRecordsKey ?? value.insightsRecordsKey;
  return {
    consent: typeof value.consent === "boolean" ? value.consent : null,
    memory: withOldAnalytics(parseMemory(value.memory), value.analytics),
    deepAt,
    memorySince: isTimestamp(value.memorySince) ? value.memorySince : deepAt,
    deepRecordsKey: typeof recordsKey === "string" ? recordsKey : null,
    question: parseQuestion(value.question, "", 0),
    questionQueue: parseQuestions(value.questionQueue),
    askedRecently: (Array.isArray(value.askedRecently) ? value.askedRecently : [])
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.slice(0, 200))
      .slice(0, 8),
    answers: (Array.isArray(value.answers) ? value.answers : [])
      .map(sanitizeAnswer)
      .filter((answer): answer is AiAnswer => answer !== null)
      .slice(0, MAX_ANSWERS),
    lastQuestionAt: isTimestamp(value.lastQuestionAt) ? value.lastQuestionAt : null,
    challenge: challenge && challenge.id ? challenge : null,
    pastChallenges: (Array.isArray(value.pastChallenges) ? value.pastChallenges : [])
      .map((item) => parseChallenge(item, "", 0))
      .filter((item): item is NonNullable<typeof item> => item !== null && Boolean(item.id))
      .slice(0, MAX_PAST_CHALLENGES),
    deletedSinceDeep: deleted
      .filter(
        (item): item is { date: string; time: string; cause: unknown } =>
          isRecord(item) && typeof item.date === "string" && typeof item.time === "string",
      )
      .slice(-50)
      .map((item) => ({
        date: item.date.slice(0, 10),
        time: item.time.slice(0, 5),
        cause: typeof item.cause === "string" ? item.cause.slice(0, 120) : null,
      })),
  };
}

/** The month an entry is stored under — in UTC, so a change of time zone doesn't move it. */
const monthOf = (timestamp: number) => new Date(timestamp).toISOString().slice(0, 7);

/** Where each loaded or saved entry actually is, to diff against the real stored keys. */
const storedMonth = new Map<string, string>();

/** Entries grouped by the month key they are stored under. */
export function groupByMonth(
  entries: readonly AiEntry[],
  keyOf: (entry: AiEntry) => string = (entry) => monthOf(entry.timestamp),
): Map<string, AiEntry[]> {
  const months = new Map<string, AiEntry[]>();
  for (const entry of entries) {
    const key = keyOf(entry);
    const list = months.get(key) ?? [];
    list.push(entry);
    months.set(key, list);
  }
  return months;
}

async function readJson(key: string): Promise<unknown> {
  const json = await AsyncStorage.getItem(key);
  if (json === null) return null;
  try {
    return JSON.parse(json) as unknown;
  } catch (error) {
    console.warn(`StopScroll: ${key} is corrupted`, error);
    await AsyncStorage.setItem(key + CORRUPT_SUFFIX, json).catch(() => undefined);
    return null;
  }
}

export async function loadAiState(): Promise<AiState> {
  const meta = sanitizeAiMeta(await readJson(AI_META_KEY));
  const keys = (await AsyncStorage.getAllKeys()).filter(
    (key) => key.startsWith(ENTRIES_PREFIX) && !key.endsWith(CORRUPT_SUFFIX),
  );
  const entries: AiEntry[] = [];
  const seen = new Set<string>();
  storedMonth.clear();
  for (const key of keys) {
    const list = await readJson(key);
    for (const item of Array.isArray(list) ? list : []) {
      const entry = sanitizeEntry(item);
      if (entry && !seen.has(entry.id)) {
        seen.add(entry.id);
        entries.push(entry);
        storedMonth.set(entry.id, key.slice(ENTRIES_PREFIX.length));
      }
    }
  }
  entries.sort((a, b) => b.timestamp - a.timestamp);
  return { ...meta, entries };
}

/**
 * Writes the meta and only the months whose entries changed since `previous` (the last state that
 * was written successfully). Months that no longer have entries are removed.
 */
export async function saveAiState(state: AiState, previous: AiState | null): Promise<void> {
  const { entries, ...meta } = state;
  await AsyncStorage.setItem(AI_META_KEY, JSON.stringify(meta));
  if (previous?.entries === entries) return;
  const now = groupByMonth(entries);
  // Previous entries are placed where they really are stored (an old key may differ).
  const before = previous
    ? groupByMonth(
        previous.entries,
        (entry) => storedMonth.get(entry.id) ?? monthOf(entry.timestamp),
      )
    : new Map<string, AiEntry[]>();
  const changed: [string, string][] = [];
  for (const [month, list] of now) {
    const old = before.get(month);
    if (!old || old.length !== list.length || old.some((entry, index) => entry !== list[index])) {
      changed.push([ENTRIES_PREFIX + month, JSON.stringify(list)]);
    }
  }
  const removed = [...before.keys()]
    .filter((month) => !now.has(month))
    .map((month) => ENTRIES_PREFIX + month);
  if (!previous) {
    // Nothing to diff against: clear any month key not in the current history.
    const stale = (await AsyncStorage.getAllKeys()).filter(
      (key) =>
        key.startsWith(ENTRIES_PREFIX) &&
        !key.endsWith(CORRUPT_SUFFIX) &&
        !now.has(key.slice(ENTRIES_PREFIX.length)),
    );
    removed.push(...stale);
  }
  if (changed.length) await AsyncStorage.multiSet(changed);
  if (removed.length) await AsyncStorage.multiRemove(removed);
  storedMonth.clear();
  for (const [month, list] of now) for (const entry of list) storedMonth.set(entry.id, month);
}
