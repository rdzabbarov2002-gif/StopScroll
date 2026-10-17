import { dayKey } from "../utils/date";
import type { LanguageCode } from "../i18n/languages";
import { applyAnswer, applyTrial, forgetEntry, type ReadingUpdate } from "./memory";
import { applyTranslations } from "./payload";
import { bucketOf, MAX_READS } from "./review";
import { MAX_ENTRY_LENGTH, createInitialAiState, readingOf } from "./storage";
import { MAX_ENTRY_ATTEMPTS, challengeEndDay } from "./schedule";
import type {
  AiAnswer,
  AiChallenge,
  AiEntry,
  AiMemory,
  AiState,
  EntryAnalysis,
  EntryReading,
  EntryVote,
  QueuedQuestion,
} from "./types";

export interface BlindResult {
  id: string;
  blind: { cause: string | null; tags: string[]; enough: boolean };
  agreed: boolean;
}

export type AiAction =
  | { type: "hydrate"; state: AiState }
  | { type: "setConsent"; consent: boolean }
  | { type: "addEntry"; entry: AiEntry }
  | { type: "deleteEntry"; id: string }
  /** `reading` — reused from an identical earlier entry; otherwise built from the analysis. */
  | {
      type: "entryAnalyzed";
      id: string;
      analysis: EntryAnalysis;
      votes: EntryVote[];
      reading?: EntryReading;
    }
  /** `countAttempt` is false for passing trouble (no network, timeout, busy service). */
  | { type: "entryFailed"; id: string; countAttempt: boolean }
  | { type: "retryEntry"; id: string }
  | { type: "retryFailed" }
  /** The independent check: entries read again without the memory. */
  | { type: "blindChecked"; at: number; results: BlindResult[] }
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
      language: LanguageCode;
      /** Entries whose original text was sent, and what the analysis concluded about them. */
      readIds: string[];
      readings: ReadingUpdate[];
      pivotKey: string | null;
      questions: QueuedQuestion[];
      challenge: AiChallenge | null;
    }
  /** The memory, experiments and questions, translated into the app's new language. */
  | {
      type: "translated";
      language: LanguageCode;
      /** Original text → its translation. */
      translations: Record<string, string>;
      /** The app's yes/no answers in the new language. */
      yesNo: [string, string];
    }
  | { type: "showQuestion"; at: number }
  | { type: "answerQuestion"; answer: string; at: number }
  | { type: "dismissQuestion" }
  | { type: "acceptChallenge"; today: string; at: number }
  | { type: "declineChallenge" }
  | { type: "checkinChallenge"; day: string; done: boolean }
  /** The experiment is over: its result, counted on the device (and whether its tip helped). */
  | { type: "finishChallenge"; review: string; helped: boolean | null }
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
        // Its votes leave with it (they live in the entry); its id leaves the memory's references.
        entries: state.entries.filter((entry) => entry.id !== action.id),
        memory: forgetEntry(state.memory, action.id),
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
      return updateEntry(state, action.id, (entry) => ({
        ...entry,
        status: "done",
        analysis: action.analysis,
        reading: action.reading ?? readingOf(action.analysis, action.votes),
      }));
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

    case "blindChecked": {
      const results = new Map(action.results.map((item) => [item.id, item]));
      const calibration = { ...state.calibration };
      const entries = state.entries.map((entry) => {
        const result = results.get(entry.id);
        if (!result || !entry.reading) return entry;
        const bucket = bucketOf(entry.analysis?.conf ?? entry.reading.conf);
        calibration[bucket] = {
          checked: calibration[bucket].checked + 1,
          disputed: calibration[bucket].disputed + (result.agreed ? 0 : 1),
        };
        return {
          ...entry,
          reads: entry.reads + 1,
          readAt: action.at,
          reading: result.agreed
            ? { ...entry.reading, check: "agreed" as const, conf: Math.max(entry.reading.conf, 70) }
            : { ...entry.reading, check: "disputed" as const },
          blind: result.agreed ? null : result.blind,
        };
      });
      return { ...state, entries, calibration };
    }

    case "deepUpdated": {
      const sentEntries = new Set(action.sentEntryIds);
      const sentAnswers = new Set(action.sentAnswerIds);
      const read = new Set(action.readIds);
      const updates = new Map(action.readings.map((update) => [update.id, update]));
      const entries = state.entries.map((entry) => {
        let next =
          sentEntries.has(entry.id) && !entry.inMemory ? { ...entry, inMemory: true } : entry;
        const update = updates.get(entry.id);
        if (update && next.reading) {
          next = {
            ...next,
            reading: update.reading,
            past: update.past,
            contested: update.contested,
            blind: null,
            reads: next.reads + 1,
            readAt: action.at,
          };
        } else if (read.has(entry.id) && next.reading) {
          // Sent but not answered: a dispute is given up after a few tries, never sent forever.
          const giveUp = next.reading.check === "disputed" && next.reads + 1 >= MAX_READS;
          next = {
            ...next,
            reads: next.reads + 1,
            readAt: action.at,
            reading: giveUp ? { ...next.reading, check: "none" } : next.reading,
            blind: giveUp ? null : next.blind,
          };
        }
        return next;
      });
      let next: AiState = {
        ...state,
        entries,
        answers: state.answers.map((answer) =>
          sentAnswers.has(answer.questionId) ? { ...answer, inMemory: true } : answer,
        ),
        memory: action.memory,
        memoryLanguage: action.language,
        deepAt: action.at,
        memorySince: state.memorySince ?? action.at,
        deepCount: state.deepCount + 1,
        deepRecordsKey: action.recordsKey,
        deletedSinceDeep: state.deletedSinceDeep.slice(action.sentDeleted),
        pivotsSeen: action.pivotKey
          ? [...state.pivotsSeen, action.pivotKey].slice(-40)
          : state.pivotsSeen,
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

    case "translated":
      // Only the coach's own texts are translated; what the user saw under an entry stays.
      return {
        ...state,
        ...applyTranslations(state, action.translations, action.yesNo),
        memoryLanguage: action.language,
      };

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
      const { question } = state;
      const answer: AiAnswer = {
        questionId: question.id,
        question: question.text,
        answer: action.answer.slice(0, 60),
        answeredAt: action.at,
        about: question.about,
        inMemory: false,
      };
      // A yes/no about a belief: the user's own word for or against it.
      const index = question.options.indexOf(action.answer);
      const memory =
        question.kind === "yes_no" && question.about && index >= 0
          ? applyAnswer(state.memory, question.about, index === 0)
          : state.memory;
      return {
        ...state,
        memory,
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
        ? {
            ...state,
            memory: applyTrial(state.memory, state.challenge.tipId, action.helped),
            challenge: { ...state.challenge, status: "done", review: action.review },
          }
        : state;

    case "reset":
      // The history goes; the user's choice about sending it does not.
      return { ...createInitialAiState(), consent: state.consent };

    default:
      return state;
  }
}
