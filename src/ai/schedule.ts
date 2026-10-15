import { addDays, dayKey } from "../utils/date";
import type { AiChallenge, AiForecast, AiState } from "./types";

/**
 * When to ask ChatGPT again. These are plain timing rules — how often to spend a request —
 * not analysis: what to conclude is always the model's job.
 */

const MINUTE = 60_000;
/** A forecast is refreshed at least this often while the app is in use. */
export const FORECAST_MAX_AGE = 3 * 60 * MINUTE;
/** After a new record (a slip, a win, the feed time) the forecast is redone, but not sooner. */
const FORECAST_RECORD_DELAY = 10 * MINUTE;
/** Entry analysis is attempted this many times before it waits for "Повторить". */
export const MAX_ENTRY_ATTEMPTS = 3;
/** Entries sent with one analytics update; older unsent ones are covered by the counts. */
export const MAX_NEW_ENTRIES = 40;

const minutesOfDay = (clock: string) => {
  const [hours, minutes] = clock.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
};

export function forecastStale(
  forecast: AiForecast | null,
  forecastRecordsKey: string | null,
  recordsKey: string,
  now: number,
): boolean {
  if (!forecast) return true;
  if (forecast.day !== dayKey(now)) return true;
  const age = now - forecast.createdAt;
  if (age > FORECAST_MAX_AGE) return true;
  if (forecastRecordsKey !== recordsKey && age > FORECAST_RECORD_DELAY) return true;
  if (forecast.validUntil) {
    const date = new Date(now);
    const current = date.getHours() * 60 + date.getMinutes();
    if (current > minutesOfDay(forecast.validUntil) && age > 30 * MINUTE) return true;
  }
  return false;
}

/** Entries analyzed after the last analytics update — they go into the next one. */
export function entriesSinceInsights(state: AiState) {
  return state.entries.filter(
    (entry) =>
      entry.analysis !== null &&
      (state.insightsAt === null || entry.analysis.analyzedAt > state.insightsAt),
  );
}

export function needsInsights(
  state: AiState,
  recordsKey: string,
  hasHistory: boolean,
  now: number,
): boolean {
  if (state.insightsAt === null) return hasHistory;
  if (entriesSinceInsights(state).length > 0) return true;
  const lastAnswer = state.answers[0];
  if (lastAnswer && lastAnswer.answeredAt > state.insightsAt) return true;
  if (state.challenge?.status === "reviewing" && !state.challenge.review) return true;
  // Slips, wins and the feed time also change the picture: recount once a day when they did.
  return dayKey(state.insightsAt) !== dayKey(now) && recordsKey !== state.insightsRecordsKey;
}

/** The day an accepted experiment ends. */
export const challengeEndDay = (startDay: string, durationDays: number) =>
  addDays(startDay, Math.max(1, durationDays) - 1);

/** An active experiment whose last day is over is ready for its review. */
export const challengeFinished = (challenge: AiChallenge | null, today: string) =>
  challenge?.status === "active" && challenge.endDay !== null && challenge.endDay < today;
