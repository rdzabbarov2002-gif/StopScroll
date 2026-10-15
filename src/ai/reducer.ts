import { MAX_ENTRY_LENGTH, createInitialAiState } from "./storage";
import { MAX_ENTRY_ATTEMPTS, challengeEndDay } from "./schedule";
import type {
  AiAnalytics,
  AiAnswer,
  AiChallenge,
  AiEntry,
  AiForecast,
  AiMemory,
  AiQuestion,
  AiState,
  EntryAnalysis,
} from "./types";

export type AiAction =
  | { type: "hydrate"; state: AiState }
  | { type: "setConsent"; consent: boolean }
  | { type: "addEntry"; entry: AiEntry }
  | { type: "deleteEntry"; id: string }
  | { type: "entryAnalyzed"; id: string; analysis: EntryAnalysis }
  | { type: "entryFailed"; id: string }
  | { type: "retryEntry"; id: string }
  | {
      type: "insightsUpdated";
      at: number;
      recordsKey: string;
      memory: AiMemory | null;
      analytics: AiAnalytics;
      forecast: AiForecast | null;
      question: AiQuestion | null;
      challenge: AiChallenge | null;
      challengeReview: string | null;
    }
  | { type: "forecastUpdated"; forecast: AiForecast; recordsKey: string }
  | { type: "answerQuestion"; answer: string; at: number }
  | { type: "dismissQuestion" }
  | { type: "acceptChallenge"; today: string }
  | { type: "declineChallenge" }
  | { type: "checkinChallenge"; day: string; done: boolean }
  | { type: "finishChallenge" }
  | { type: "reset" };

const MAX_ANSWERS = 60;
const MAX_PAST_CHALLENGES = 20;

const updateEntry = (state: AiState, id: string, change: (entry: AiEntry) => AiEntry): AiState => ({
  ...state,
  entries: state.entries.map((entry) => (entry.id === id ? change(entry) : entry)),
});

/** Moves a finished or declined experiment to the history. */
const archive = (state: AiState): Pick<AiState, "challenge" | "pastChallenges"> =>
  state.challenge && (state.challenge.status === "done" || state.challenge.status === "declined")
    ? {
        challenge: null,
        pastChallenges: [state.challenge, ...state.pastChallenges].slice(0, MAX_PAST_CHALLENGES),
      }
    : { challenge: state.challenge, pastChallenges: state.pastChallenges };

export function aiReducer(state: AiState, action: AiAction): AiState {
  switch (action.type) {
    case "hydrate":
      return action.state;

    case "setConsent":
      return { ...state, consent: action.consent };

    case "addEntry":
      return {
        ...state,
        entries: [
          { ...action.entry, text: action.entry.text.slice(0, MAX_ENTRY_LENGTH) },
          ...state.entries,
        ],
      };

    case "deleteEntry":
      return { ...state, entries: state.entries.filter((entry) => entry.id !== action.id) };

    case "entryAnalyzed":
      return updateEntry(state, action.id, (entry) => ({
        ...entry,
        status: "done",
        analysis: action.analysis,
      }));

    case "entryFailed":
      return updateEntry(state, action.id, (entry) => ({
        ...entry,
        attempts: entry.attempts + 1,
        status: entry.attempts + 1 >= MAX_ENTRY_ATTEMPTS ? "failed" : "pending",
      }));

    case "retryEntry":
      return updateEntry(state, action.id, (entry) => ({
        ...entry,
        status: "pending",
        attempts: 0,
      }));

    case "insightsUpdated": {
      let next: AiState = {
        ...state,
        memory: action.memory ?? state.memory,
        analytics: action.analytics,
        forecast: action.forecast ?? state.forecast,
        forecastRecordsKey: action.forecast ? action.recordsKey : state.forecastRecordsKey,
        insightsAt: action.at,
        insightsRecordsKey: action.recordsKey,
      };
      // A question only when none is waiting for an answer.
      if (action.question && !state.question) {
        next = { ...next, question: action.question, lastQuestionAt: action.at };
      }
      if (action.challengeReview && next.challenge?.status === "reviewing") {
        next = {
          ...next,
          challenge: { ...next.challenge, status: "done", review: action.challengeReview },
        };
      }
      if (
        action.challenge &&
        (!next.challenge || ["done", "declined"].includes(next.challenge.status))
      ) {
        next = { ...next, ...archive(next), challenge: action.challenge };
      }
      return next;
    }

    case "forecastUpdated":
      return { ...state, forecast: action.forecast, forecastRecordsKey: action.recordsKey };

    case "answerQuestion": {
      if (!state.question) return state;
      const answer: AiAnswer = {
        questionId: state.question.id,
        question: state.question.text,
        answer: action.answer.slice(0, 60),
        answeredAt: action.at,
      };
      return {
        ...state,
        question: null,
        answers: [answer, ...state.answers].slice(0, MAX_ANSWERS),
      };
    }

    case "dismissQuestion":
      return { ...state, question: null };

    case "acceptChallenge": {
      if (state.challenge?.status !== "proposed") return state;
      return {
        ...state,
        challenge: {
          ...state.challenge,
          status: "active",
          startDay: action.today,
          endDay: challengeEndDay(action.today, state.challenge.durationDays),
        },
      };
    }

    case "declineChallenge": {
      if (state.challenge?.status !== "proposed") return state;
      const declined: AiState = { ...state, challenge: { ...state.challenge, status: "declined" } };
      return { ...declined, ...archive(declined) };
    }

    case "checkinChallenge": {
      if (state.challenge?.status !== "active") return state;
      return {
        ...state,
        challenge: {
          ...state.challenge,
          checkins: { ...state.challenge.checkins, [action.day]: action.done },
        },
      };
    }

    case "finishChallenge":
      return state.challenge?.status === "active"
        ? { ...state, challenge: { ...state.challenge, status: "reviewing" } }
        : state;

    case "reset":
      // The history goes; the user's choice about sending it does not.
      return { ...createInitialAiState(), consent: state.consent };

    default:
      return state;
  }
}

/** When the last experiment was offered — for the once-a-week rhythm. */
export const lastChallengeAt = (state: AiState) =>
  state.challenge?.proposedAt ?? state.pastChallenges[0]?.proposedAt ?? null;
