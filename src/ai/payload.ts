import { dayKey } from "../utils/date";
import { DAY_MS, WEEKDAYS, clock, deepStats, type Timeline } from "./facts";
import { canProposeChallenge, entriesSinceDeep } from "./schedule";
import type { AiEntry, AiMemory, AiState, EntryAnalysis } from "./types";

/**
 * What goes to ChatGPT, kept as small as possible: each entry's text is sent exactly once
 * (to /entry); after that only its one-line gist and tags travel, and only once more — to the
 * next deep analysis, which then folds it into the memory. Requests carry the memory, never the
 * history.
 */

/** Entries read in one /entry request (a backlog after being offline goes in batches). */
export const ENTRY_BATCH = 5;
/** Entries sent with one deep analysis; any older ones are covered by the counts in the stats. */
export const MAX_DEEP_ENTRIES = 40;
/** The same text within this time reuses its analysis instead of a new request. */
const DUPLICATE_WINDOW_DAYS = 30;

const SHORT = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"] as const;
const when = (timestamp: number) =>
  `${dayKey(timestamp)} ${SHORT[(new Date(timestamp).getDay() + 6) % 7]} ${clock(timestamp)}`;

export function topTags(entries: readonly AiEntry[], size: number): string[] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of entry.analysis?.tags ?? []) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, size)
    .map(([tag]) => tag);
}

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

/** An earlier entry with the same words, already analyzed — its analysis fits this one too. */
export function duplicateAnalysis(
  entry: AiEntry,
  entries: readonly AiEntry[],
): EntryAnalysis | null {
  const text = normalize(entry.text);
  if (!text) return null;
  const match = entries.find(
    (other) =>
      other.id !== entry.id &&
      other.analysis !== null &&
      Math.abs(entry.timestamp - other.timestamp) <= DUPLICATE_WINDOW_DAYS * DAY_MS &&
      normalize(other.text) === text,
  );
  return match?.analysis ?? null;
}

/** /entry: the new entries and a short digest of the memory (never the history). */
export function entryPayload(
  batch: readonly AiEntry[],
  memory: AiMemory | null,
  entries: readonly AiEntry[],
) {
  return {
    memory: {
      profile: memory?.profile.slice(0, 300) || null,
      zones: memory?.dangerZones.map((zone) => zone.title) ?? [],
      // The ones worth checking: not yet refuted, the best supported first.
      hypotheses:
        memory?.hypotheses
          .filter((item) => item.status !== "weakened")
          .sort((a, b) => b.support - b.against - (a.support - a.against))
          .slice(0, 4)
          .map((item) => ({ id: item.id, text: item.text })) ?? [],
      tags: topTags(entries, 15),
    },
    entries: batch.map((entry, index) => ({
      n: index + 1,
      when: when(entry.timestamp),
      outcome: entry.outcome,
      text: entry.text,
    })),
  };
}

const OUTCOME = { resisted: "удержались", opened: "открыли" } as const;

/** One entry in one line: "2026-10-12 пн 21:40 | открыли | усталость, работа | причина | суть". */
const entryLine = (entry: AiEntry) =>
  [
    when(entry.timestamp),
    entry.outcome ? OUTCOME[entry.outcome] : "—",
    entry.analysis?.tags.join(", ") || "—",
    entry.analysis?.cause ?? "—",
    entry.analysis?.gist ?? entry.text.replace(/\s+/g, " ").slice(0, 120),
  ].join(" | ");

/** The memory as ChatGPT gets it back: votes next to the hypotheses, nothing else added. */
function memoryForDeep(memory: AiMemory | null) {
  if (!memory) return null;
  return {
    ...memory,
    hypotheses: memory.hypotheses.map((item) => ({
      id: item.id,
      text: item.text,
      status: item.status,
      votes: `+${item.support} −${item.against}`,
    })),
  };
}

/** /deep: the memory, what's new since the last analysis, and the arithmetic over everything. */
export function deepPayload(state: AiState, t: Timeline) {
  // All of them are marked as taken in afterwards: any beyond the limit are in the counts.
  const fresh = entriesSinceDeep(state);
  const sent = fresh.slice(0, MAX_DEEP_ENTRIES);
  const since = state.deepAt === null ? "" : dayKey(state.deepAt);
  const finished = [state.challenge, ...state.pastChallenges].filter(
    (item): item is NonNullable<typeof item> =>
      item !== null && item.status === "done" && item.endDay !== null && item.endDay >= since,
  );
  return {
    today: `${t.today} ${WEEKDAYS[t.todayRecord.weekday]}`,
    memory: memoryForDeep(state.memory),
    // Oldest first, as they happened.
    newEntries: sent.map(entryLine).reverse(),
    olderEntriesNotSent: fresh.length - sent.length,
    answers: state.answers
      .filter((answer) => !answer.inMemory)
      .map((answer) => ({
        date: dayKey(answer.answeredAt),
        question: answer.question,
        answer: answer.answer,
      })),
    deleted: state.deletedSinceDeep,
    stats: deepStats(t),
    challenges: finished.slice(0, 3).map((item) => ({
      title: item.title,
      days: item.durationDays,
      managed: Object.values(item.checkins).filter(Boolean).length,
      result: item.review,
    })),
    currentChallenge:
      state.challenge &&
      (state.challenge.status === "proposed" || state.challenge.status === "active")
        ? { title: state.challenge.title, status: state.challenge.status }
        : null,
    askedRecently: state.askedRecently,
    policy: {
      questions: state.question === null && state.questionQueue.length === 0,
      challenge: canProposeChallenge(state, t.now),
    },
  };
}
