import { dayKey } from "../utils/date";
import type { EntryVote } from "./parse";
import { MAX_ENTRY_LENGTH, createInitialAiState } from "./storage";
import { MAX_ENTRY_ATTEMPTS, challengeEndDay } from "./schedule";
import type {
  AiAnswer,
  AiChallenge,
  AiEntry,
  AiMemory,
  AiState,
  EntryAnalysis,
  QueuedQuestion,
} from "./types";

export type AiAction =
  | { type: "hydrate"; state: AiState }
  | { type: "setConsent"; consent: boolean }
  | { type: "addEntry"; entry: AiEntry }
  | { type: "deleteEntry"; id: string }
  /** `votes` — what the entry says about the memory's hypotheses (none for a reused analysis). */
  | { type: "entryAnalyzed"; id: string; analysis: EntryAnalysis; votes: EntryVote[] }
  /** `countAttempt` is false for passing trouble (no network, timeout, busy service). */
  | { type: "entryFailed"; id: string; countAttempt: boolean }
  | { type: "retryEntry"; id: string }
  | { type: "retryFailed" }
  | {
      type: "deepUpdated";
      /** When the request was built — what changed after it goes into the next analysis. */
      at: number;
      recordsKey: string;
      sentEntryIds: string[];
      sentAnswerIds: string[];
      /** How many of `deletedSinceDeep` went with this analysis. */
      sentDeleted: number;
      memory: AiMemory;
      questions: QueuedQuestion[];
      challenge: AiChallenge | null;
    }
  | { type: "showQuestion"; at: number }
  | { type: "answerQuestion"; answer: string; at: number }
  | { type: "dismissQuestion" }
  | { type: "acceptChallenge"; today: string; at: number }
  | { type: "declineChallenge" }
  | { type: "checkinChallenge"; day: string; done: boolean }
  /** The experiment is over: its result, counted on the device. */
  | { type: "finishChallenge"; review: string }
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

/** Each entry's votes add up on the hypotheses between deep analyses (one vote per entry). */
function applyVotes(memory: AiMemory | null, votes: readonly EntryVote[]): AiMemory | null {
  if (!memory || votes.length === 0) return memory;
  const effect = new Map(votes.map((vote) => [vote.id, vote.effect]));
  return {
    ...memory,
    hypotheses: memory.hypotheses.map((item) => {
      const vote = effect.get(item.id);
      if (vote === "support") return { ...item, support: item.support + 1 };
      if (vote === "against") return { ...item, against: item.against + 1 };
      return item;
    }),
  };
}

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
          {
            ...action.entry,
            text: action.entry.text.slice(0, MAX_ENTRY_LENGTH),
            inMemory: false,
          },
          ...state.entries,
        ],
      };

    case "deleteEntry": {
      const removed = state.entries.find((entry) => entry.id === action.id);
      if (!removed) return state;
      const date = new Date(removed.timestamp);
      const pad = (value: number) => String(value).padStart(2, "0");
      return {
        ...state,
        entries: state.entries.filter((entry) => entry.id !== action.id),
        // The memory already took it in: tell the next analysis to drop what rested on it.
        deletedSinceDeep: removed.inMemory
          ? [
              ...state.deletedSinceDeep,
              {
                date: dayKey(removed.timestamp),
                time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
                cause: removed.analysis?.cause ?? null,
              },
            ].slice(-50)
          : state.deletedSinceDeep,
      };
    }

    case "entryAnalyzed": {
      if (!state.entries.some((entry) => entry.id === action.id && entry.analysis === null)) {
        return state;
      }
      const next = updateEntry(state, action.id, (entry) => ({
        ...entry,
        status: "done",
        analysis: action.analysis,
      }));
      return { ...next, memory: applyVotes(state.memory, action.votes) };
    }

    case "entryFailed":
      if (!action.countAttempt) return state;
      return updateEntry(state, action.id, (entry) => ({
        ...entry,
        attempts: entry.attempts + 1,
        status: entry.attempts + 1 >= MAX_ENTRY_ATTEMPTS ? "failed" : "pending",
      }));

    case "retryFailed":
      return state.entries.some((entry) => entry.status === "failed")
        ? {
            ...state,
            entries: state.entries.map((entry) =>
              entry.status === "failed" ? { ...entry, status: "pending", attempts: 0 } : entry,
            ),
          }
        : state;

    case "retryEntry":
      return updateEntry(state, action.id, (entry) => ({
        ...entry,
        status: "pending",
        attempts: 0,
      }));

    case "deepUpdated": {
      const sentEntries = new Set(action.sentEntryIds);
      const sentAnswers = new Set(action.sentAnswerIds);
      let next: AiState = {
        ...state,
        entries: state.entries.map((entry) =>
          sentEntries.has(entry.id) && !entry.inMemory ? { ...entry, inMemory: true } : entry,
        ),
        answers: state.answers.map((answer) =>
          sentAnswers.has(answer.questionId) ? { ...answer, inMemory: true } : answer,
        ),
        memory: action.memory,
        deepAt: action.at,
        memorySince: state.memorySince ?? action.at,
        deepRecordsKey: action.recordsKey,
        deletedSinceDeep: state.deletedSinceDeep.slice(action.sentDeleted),
        // New questions replace the old queue; none — the queue stays as it was.
        questionQueue: action.questions.length ? action.questions : state.questionQueue,
      };
      if (
        action.challenge &&
        (!next.challenge || ["done", "declined"].includes(next.challenge.status))
      ) {
        next = { ...next, ...archive(next), challenge: action.challenge };
      }
      return next;
    }

    case "showQuestion": {
      const [first, ...rest] = state.questionQueue;
      if (state.question || !first) return state;
      return {
        ...state,
        question: { ...first, id: `q-${action.at}`, askedAt: action.at },
        questionQueue: rest,
        lastQuestionAt: action.at,
        askedRecently: [first.text, ...state.askedRecently].slice(0, 8),
      };
    }

    case "answerQuestion": {
      if (!state.question) return state;
      const answer: AiAnswer = {
        questionId: state.question.id,
        question: state.question.text,
        answer: action.answer.slice(0, 60),
        answeredAt: action.at,
        inMemory: false,
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
          startedAt: action.at,
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
      return state.challenge?.status === "active" || state.challenge?.status === "reviewing"
        ? { ...state, challenge: { ...state.challenge, status: "done", review: action.review } }
        : state;

    case "reset":
      // The history goes; the user's choice about sending it does not.
      return { ...createInitialAiState(), consent: state.consent };

    default:
      return state;
  }
}
