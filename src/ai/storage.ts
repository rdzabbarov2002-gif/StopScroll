import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  parseAnalytics,
  parseChallenge,
  parseEntryAnalysis,
  parseForecast,
  parseMemory,
  parseQuestion,
} from "./parse";
import type { AiAnswer, AiEntry, AiState, EntryOutcome, EntryStatus } from "./types";

/**
 * The AI coach keeps its data apart from the main state:
 * - `@stopscroll/ai/v1` — consent, memory, analytics, forecast, question, experiments;
 * - `@stopscroll/ai/entries/YYYY-MM` — the entries of one month.
 * Splitting by month keeps every stored value small (Android reads at most ~2 MB per value),
 * so the whole history can be kept without a cap on the number of entries.
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
    analytics: null,
    forecast: null,
    question: null,
    answers: [],
    lastQuestionAt: null,
    challenge: null,
    pastChallenges: [],
    insightsAt: null,
    insightsRecordsKey: null,
    forecastRecordsKey: null,
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
  };
}

/** Everything but the entries, checked field by field: a bad field falls back to empty. */
export function sanitizeAiMeta(value: unknown): Omit<AiState, "entries"> {
  const base = createInitialAiState();
  if (!isRecord(value)) return base;
  const forecast = isRecord(value.forecast)
    ? parseForecast(
        value.forecast,
        String(value.forecast.day ?? ""),
        Number(value.forecast.createdAt ?? 0),
      )
    : null;
  const challenge = parseChallenge(value.challenge, "", 0);
  return {
    consent: typeof value.consent === "boolean" ? value.consent : null,
    memory: parseMemory(value.memory),
    analytics: parseAnalytics(value.analytics),
    forecast: forecast && forecast.day && forecast.createdAt ? forecast : null,
    question: parseQuestion(value.question, "", 0),
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
    insightsAt: isTimestamp(value.insightsAt) ? value.insightsAt : null,
    insightsRecordsKey:
      typeof value.insightsRecordsKey === "string" ? value.insightsRecordsKey : null,
    forecastRecordsKey:
      typeof value.forecastRecordsKey === "string" ? value.forecastRecordsKey : null,
  };
}

const monthOf = (timestamp: number) => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

/** Entries grouped by the month key they are stored under. */
export function groupByMonth(entries: readonly AiEntry[]): Map<string, AiEntry[]> {
  const months = new Map<string, AiEntry[]>();
  for (const entry of entries) {
    const key = monthOf(entry.timestamp);
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
  for (const key of keys) {
    const list = await readJson(key);
    for (const item of Array.isArray(list) ? list : []) {
      const entry = sanitizeEntry(item);
      if (entry && !seen.has(entry.id)) {
        seen.add(entry.id);
        entries.push(entry);
      }
    }
  }
  entries.sort((a, b) => b.timestamp - a.timestamp);
  return { ...meta, entries };
}

/**
 * Writes the meta and only the months whose entries changed since `previous`.
 * Months that no longer have entries are removed.
 */
export async function saveAiState(state: AiState, previous: AiState | null): Promise<void> {
  const { entries, ...meta } = state;
  await AsyncStorage.setItem(AI_META_KEY, JSON.stringify(meta));
  if (previous?.entries === entries) return;
  const now = groupByMonth(entries);
  const before = previous ? groupByMonth(previous.entries) : new Map<string, AiEntry[]>();
  const changed: [string, string][] = [];
  for (const [month, list] of now) {
    const old = before.get(month);
    if (!old || old.length !== list.length || old.some((entry, index) => entry !== list[index])) {
      changed.push([ENTRIES_PREFIX + month, JSON.stringify(list)]);
    }
  }
  if (changed.length) await AsyncStorage.multiSet(changed);
  const removed = [...before.keys()]
    .filter((month) => !now.has(month))
    .map((month) => ENTRIES_PREFIX + month);
  if (!previous) {
    // First save of a session: clear months left over from a reset in an earlier run.
    const stale = (await AsyncStorage.getAllKeys()).filter(
      (key) =>
        key.startsWith(ENTRIES_PREFIX) &&
        !key.endsWith(CORRUPT_SUFFIX) &&
        !now.has(key.slice(ENTRIES_PREFIX.length)),
    );
    removed.push(...stale);
  }
  if (removed.length) await AsyncStorage.multiRemove(removed);
}
