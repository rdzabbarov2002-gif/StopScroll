import { addDays } from "../utils/date";
import { CHALLENGE_COOLDOWN_DAYS, DAY_MS, QUESTION_COOLDOWN_DAYS } from "./facts";
import type { AiChallenge, AiState } from "./types";

/**
 * When to spend a request. Each new entry is read once, as it comes (a light request); the
 * long-term memory is rebuilt rarely — about once a week, more often only while it is young
 * or when many entries piled up. Everything in between is computed on the device.
 */

/** Entry analysis is attempted this many times before it waits for "Повторить". */
export const MAX_ENTRY_ATTEMPTS = 3;
/** The usual rhythm of the deep analysis. */
export const DEEP_INTERVAL_DAYS = 7;
/** During the first two weeks the memory is rebuilt every few days: it learns the most then. */
export const YOUNG_MEMORY_DAYS = 14;
const YOUNG_INTERVAL_DAYS = 3;
/** So many new entries rebuild the memory early (but not more than every few days). */
export const DEEP_EARLY_ENTRIES = 25;

/** Analyzed entries the memory hasn't taken in yet — they go into the next deep analysis. */
export function entriesSinceDeep(state: AiState) {
  return state.entries.filter((entry) => entry.analysis !== null && !entry.inMemory);
}

export function needsDeep(
  state: AiState,
  recordsKey: string,
  hasHistory: boolean,
  now: number,
): boolean {
  if (state.deepAt === null) return hasHistory;
  const fresh = entriesSinceDeep(state).length;
  const changed =
    fresh > 0 ||
    state.answers.some((answer) => !answer.inMemory) ||
    state.deletedSinceDeep.length > 0 ||
    recordsKey !== state.deepRecordsKey;
  if (!changed) return false;
  const days = (now - state.deepAt) / DAY_MS;
  const age = state.memorySince === null ? Infinity : (now - state.memorySince) / DAY_MS;
  // The first memory is often built from one entry: the day after, it is redone once.
  if (age < 2 && days >= 1 && fresh >= 3) return true;
  if (age < YOUNG_MEMORY_DAYS) return days >= YOUNG_INTERVAL_DAYS;
  return days >= DEEP_INTERVAL_DAYS || (fresh >= DEEP_EARLY_ENTRIES && days >= YOUNG_INTERVAL_DAYS);
}

/** A prepared question is shown when none is waiting and the last one was a few days ago. */
export const questionDue = (state: AiState, now: number) =>
  state.question === null &&
  state.questionQueue.length > 0 &&
  (state.lastQuestionAt === null || now - state.lastQuestionAt >= QUESTION_COOLDOWN_DAYS * DAY_MS);

/** When the last experiment was offered — for the once-a-week rhythm. */
export const lastChallengeAt = (state: AiState) =>
  state.challenge?.proposedAt ?? state.pastChallenges[0]?.proposedAt ?? null;

export function canProposeChallenge(state: AiState, now: number) {
  const last = lastChallengeAt(state);
  return (
    (state.challenge === null ||
      state.challenge.status === "done" ||
      state.challenge.status === "declined") &&
    (last === null || now - last >= CHALLENGE_COOLDOWN_DAYS * DAY_MS)
  );
}

/** The day an accepted experiment ends. */
export const challengeEndDay = (startDay: string, durationDays: number) =>
  addDays(startDay, Math.max(1, durationDays) - 1);

/** An experiment whose last day is over (or one left waiting for a review) gets its result. */
export const challengeFinished = (challenge: AiChallenge | null, today: string) =>
  challenge?.status === "reviewing" ||
  (challenge?.status === "active" && challenge.endDay !== null && challenge.endDay < today);
