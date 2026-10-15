import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState as RNAppState } from "react-native";

import { AI_CONFIGURED, AI_ERROR_TEXT, AiRequestError, postAi } from "../ai/client";
import { WEEKDAYS, buildFacts, clock, recordsKey, type Facts } from "../ai/facts";
import {
  parseAnalytics,
  parseChallenge,
  parseEntryAnalysis,
  parseForecast,
  parseMemory,
  parseQuestion,
} from "../ai/parse";
import { aiReducer, lastChallengeAt, type AiAction } from "../ai/reducer";
import {
  MAX_NEW_ENTRIES,
  challengeFinished,
  entriesSinceInsights,
  forecastStale,
  needsInsights,
} from "../ai/schedule";
import { createInitialAiState, loadAiState, saveAiState } from "../ai/storage";
import type { AiEntry, AiState, EntryOutcome } from "../ai/types";
import { dayKey, weekdayIndex } from "../utils/date";
import { createId } from "../utils/persistedState";
import { useApp } from "./AppContext";

export type AiTask = "entry" | "insights" | "forecast";

export interface AiSync {
  status: "idle" | "working" | "error";
  task: AiTask | null;
  error: string | null;
}

export interface AiContextValue extends AiState {
  /** Whether the app was built with the AI server's address. */
  configured: boolean;
  hydrated: boolean;
  /** Configured, allowed by the user and loaded: entries are being sent to ChatGPT. */
  enabled: boolean;
  sync: AiSync;
  addEntry: (text: string, outcome: EntryOutcome | null) => AiEntry;
  retryEntry: (id: string) => void;
  deleteEntry: (id: string) => void;
  setConsent: (consent: boolean) => void;
  answerQuestion: (answer: string) => void;
  dismissQuestion: () => void;
  acceptChallenge: () => void;
  declineChallenge: () => void;
  checkinChallenge: (done: boolean) => void;
  /** Forgets every entry and everything ChatGPT concluded (the consent choice stays). */
  resetAi: () => void;
  /** Tries the pending work again now (after an error). */
  retryNow: () => void;
}

const AiContext = createContext<AiContextValue | null>(null);

const MINUTE = 60_000;
const TIMEOUTS: Record<AiTask, number> = { entry: 45_000, insights: 150_000, forecast: 60_000 };
/** A failed request waits this long before the next automatic attempt. */
const RETRY_DELAY = 2 * MINUTE;
/** While the app is open, staleness of the forecast is checked this often. */
const CHECK_INTERVAL = 10 * MINUTE;
/** A burst of record changes (a slip, a win) settles before the forecast is redone. */
const RECORDS_DEBOUNCE = 5_000;

function topTags(entries: readonly AiEntry[], size: number): string[] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of entry.analysis?.tags ?? []) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, size)
    .map(([tag]) => tag);
}

const describeEntry = (entry: AiEntry) => ({
  date: dayKey(entry.timestamp),
  time: clock(entry.timestamp),
  weekday: WEEKDAYS[weekdayIndex(entry.timestamp)],
  outcome: entry.outcome,
});

/** The part of the facts a forecast needs — keeps the frequent refresh small. */
function forecastFacts(facts: Facts) {
  const { now, settings, today, recentDays, byHour, byWeekday, streaks, baseRates, coverage } =
    facts;
  return {
    now,
    settings,
    coverage,
    today,
    recentDays: recentDays.slice(-7),
    byHour,
    byWeekday: byWeekday.last8Weeks,
    streaks,
    baseRates,
  };
}

export function AiProvider({ children }: { children: ReactNode }) {
  const app = useApp();
  const [state, dispatch] = useReducer(aiReducer, undefined, createInitialAiState);
  const [hydrated, setHydrated] = useState(false);
  const [sync, setSync] = useState<AiSync>({ status: "idle", task: null, error: null });

  // The async engine reads the latest values through refs; `apply` keeps them current
  // immediately, without waiting for the next render.
  const stateRef = useRef(state);
  const apply = useCallback((action: AiAction) => {
    stateRef.current = aiReducer(stateRef.current, action);
    dispatch(action);
  }, []);

  const appData = useMemo(
    () => ({
      hydrated: app.hydrated,
      wins: app.wins,
      winArchive: app.winArchive,
      slips: app.slips,
      scrollLog: app.scrollLog,
      settings: app.settings,
    }),
    [app.hydrated, app.wins, app.winArchive, app.slips, app.scrollLog, app.settings],
  );
  const appRef = useRef(appData);
  useEffect(() => {
    appRef.current = appData;
  }, [appData]);

  // Load once; saving starts only after a successful load, so nothing real is overwritten.
  const canPersist = useRef(false);
  const lastSaved = useRef<AiState | null>(null);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => {
    let cancelled = false;
    loadAiState()
      .catch(() => loadAiState())
      .then(
        (loaded) => {
          if (cancelled) return;
          canPersist.current = true;
          lastSaved.current = loaded;
          apply({ type: "hydrate", state: loaded });
          setHydrated(true);
        },
        (error: unknown) => {
          console.warn("StopScroll: could not read the AI coach data, saving is paused", error);
          if (!cancelled) setHydrated(true);
        },
      );
    return () => {
      cancelled = true;
    };
  }, [apply]);

  useEffect(() => {
    if (!hydrated || !canPersist.current || state === lastSaved.current) return;
    const previous = lastSaved.current;
    lastSaved.current = state;
    saveQueue.current = saveQueue.current
      .then(() => saveAiState(state, previous))
      .catch((error: unknown) =>
        console.warn("StopScroll: could not save the AI coach data", error),
      );
  }, [state, hydrated]);

  const enabled = AI_CONFIGURED && hydrated && state.consent === true && app.hydrated;
  const enabledRef = useRef(enabled);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const retryAt = useRef(0);

  const fail = useCallback((task: AiTask, error: unknown) => {
    const kind = error instanceof AiRequestError ? error.kind : "unusable";
    retryAt.current = Date.now() + (kind === "offline" ? MINUTE : RETRY_DELAY);
    setSync({ status: "error", task, error: AI_ERROR_TEXT[kind] });
  }, []);

  /** One unit of work: an entry, the analytics, or the forecast. Returns true to continue. */
  const step = useCallback(async (): Promise<boolean> => {
    if (!enabledRef.current || Date.now() < retryAt.current) return false;
    const now = Date.now();
    const today = dayKey(now);
    let ai = stateRef.current;
    const data = appRef.current;

    if (challengeFinished(ai.challenge, today)) {
      apply({ type: "finishChallenge" });
      ai = stateRef.current;
    }

    // 1. Every new entry is read by ChatGPT first, oldest first.
    const entry = [...ai.entries].reverse().find((item) => item.status === "pending");
    if (entry) {
      setSync({ status: "working", task: "entry", error: null });
      try {
        const raw = await postAi(
          "/entry",
          {
            entry: { ...describeEntry(entry), text: entry.text },
            profile: ai.memory?.summary || null,
            knownTags: topTags(ai.entries, 25),
          },
          TIMEOUTS.entry,
        );
        const analysis = parseEntryAnalysis(raw, Date.now());
        if (!analysis) throw new AiRequestError("unusable");
        apply({ type: "entryAnalyzed", id: entry.id, analysis });
        return true;
      } catch (error) {
        apply({ type: "entryFailed", id: entry.id });
        fail("entry", error);
        return false;
      }
    }

    // 2. Then the whole history: memory + new entries + arithmetic over everything.
    const factsInput = {
      ...data,
      entries: ai.entries,
      answers: ai.answers,
      challenge: ai.challenge,
      lastQuestionAt: ai.lastQuestionAt,
      lastChallengeAt: lastChallengeAt(ai),
      now,
    };
    const key = recordsKey(data, today);
    const facts = buildFacts(factsInput);
    const hasHistory = facts.coverage.observedDays > 0 || ai.entries.length > 0;

    if (needsInsights(ai, key, hasHistory, now)) {
      setSync({ status: "working", task: "insights", error: null });
      const fresh = entriesSinceInsights(ai);
      try {
        const raw = await postAi(
          "/insights",
          {
            memory: ai.memory,
            newEntries: fresh.slice(0, MAX_NEW_ENTRIES).map((item) => ({
              ...describeEntry(item),
              text: item.text.slice(0, 600),
              analysis: item.analysis && {
                enough: item.analysis.enough,
                cause: item.analysis.cause,
                emotion: item.analysis.emotion,
                context: item.analysis.context,
                behavior: item.analysis.behavior,
                tags: item.analysis.tags,
              },
            })),
            olderNewEntriesNotSent: Math.max(0, fresh.length - MAX_NEW_ENTRIES),
            facts,
          },
          TIMEOUTS.insights,
        );
        const result = (raw ?? {}) as Record<string, unknown>;
        const analytics = parseAnalytics(result.analytics);
        if (!analytics) throw new AiRequestError("unusable");
        const at = Date.now();
        apply({
          type: "insightsUpdated",
          at,
          recordsKey: key,
          memory: parseMemory(result.memory),
          analytics,
          forecast: parseForecast(result.forecast, today, at),
          question: facts.questionPolicy.allowed
            ? parseQuestion(result.question, `q-${at}`, at)
            : null,
          challenge: facts.challengePolicy.canPropose
            ? parseChallenge(result.challenge, `c-${at}`, at)
            : null,
          challengeReview:
            typeof result.challengeReview === "string" && result.challengeReview.trim()
              ? result.challengeReview.trim().slice(0, 600)
              : null,
        });
        return true;
      } catch (error) {
        fail("insights", error);
        return false;
      }
    }

    // 3. Between updates, the forecast follows the day.
    if (hasHistory && forecastStale(ai.forecast, ai.forecastRecordsKey, key, now)) {
      setSync({ status: "working", task: "forecast", error: null });
      try {
        const raw = await postAi(
          "/forecast",
          {
            memory: ai.memory && { summary: ai.memory.summary, hypotheses: ai.memory.hypotheses },
            facts: forecastFacts(facts),
          },
          TIMEOUTS.forecast,
        );
        const forecast = parseForecast(raw, today, Date.now());
        if (!forecast) throw new AiRequestError("unusable");
        apply({ type: "forecastUpdated", forecast, recordsKey: key });
        return false;
      } catch (error) {
        fail("forecast", error);
        return false;
      }
    }
    return false;
  }, [apply, fail]);

  // Only one request at a time; a call during a run asks for one more pass.
  const running = useRef(false);
  const again = useRef(false);
  const run = useCallback(async () => {
    if (running.current) {
      again.current = true;
      return;
    }
    running.current = true;
    try {
      let more = true;
      while (more || again.current) {
        again.current = false;
        more = await step();
      }
    } finally {
      running.current = false;
      setSync((current) =>
        current.status === "working" ? { ...current, status: "idle", task: null } : current,
      );
    }
  }, [step]);

  // What sets the engine going: being enabled, a new entry or answer, the experiment,
  // returning to the app, and — a little later — any change in the app's records.
  const pendingCount = state.entries.filter((entry) => entry.status === "pending").length;
  useEffect(() => {
    if (enabled) void run();
  }, [enabled, pendingCount, state.answers.length, state.challenge?.status, run]);

  const recordsFingerprint = recordsKey(appData, app.todayKey);
  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => void run(), RECORDS_DEBOUNCE);
    return () => clearTimeout(timer);
  }, [enabled, recordsFingerprint, run]);

  useEffect(() => {
    if (!enabled) return;
    const subscription = RNAppState.addEventListener("change", (status) => {
      if (status === "active") void run();
    });
    const interval = setInterval(() => {
      if (RNAppState.currentState === "active") void run();
    }, CHECK_INTERVAL);
    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [enabled, run]);

  const addEntry = useCallback(
    (text: string, outcome: EntryOutcome | null) => {
      const entry: AiEntry = {
        id: createId(),
        timestamp: Date.now(),
        text: text.trim(),
        outcome,
        status: "pending",
        attempts: 0,
        analysis: null,
      };
      apply({ type: "addEntry", entry });
      return entry;
    },
    [apply],
  );

  const retryEntry = useCallback(
    (id: string) => {
      retryAt.current = 0;
      apply({ type: "retryEntry", id });
    },
    [apply],
  );
  const deleteEntry = useCallback((id: string) => apply({ type: "deleteEntry", id }), [apply]);
  const setConsent = useCallback(
    (consent: boolean) => {
      retryAt.current = 0;
      apply({ type: "setConsent", consent });
    },
    [apply],
  );
  const answerQuestion = useCallback(
    (answer: string) => apply({ type: "answerQuestion", answer, at: Date.now() }),
    [apply],
  );
  const dismissQuestion = useCallback(() => apply({ type: "dismissQuestion" }), [apply]);
  const acceptChallenge = useCallback(
    () => apply({ type: "acceptChallenge", today: dayKey() }),
    [apply],
  );
  const declineChallenge = useCallback(() => apply({ type: "declineChallenge" }), [apply]);
  const checkinChallenge = useCallback(
    (done: boolean) => apply({ type: "checkinChallenge", day: dayKey(), done }),
    [apply],
  );
  const resetAi = useCallback(() => {
    apply({ type: "reset" });
    setSync({ status: "idle", task: null, error: null });
  }, [apply]);
  const retryNow = useCallback(() => {
    retryAt.current = 0;
    void run();
  }, [run]);

  const value = useMemo<AiContextValue>(
    () => ({
      ...state,
      configured: AI_CONFIGURED,
      hydrated,
      enabled,
      sync,
      addEntry,
      retryEntry,
      deleteEntry,
      setConsent,
      answerQuestion,
      dismissQuestion,
      acceptChallenge,
      declineChallenge,
      checkinChallenge,
      resetAi,
      retryNow,
    }),
    [
      state,
      hydrated,
      enabled,
      sync,
      addEntry,
      retryEntry,
      deleteEntry,
      setConsent,
      answerQuestion,
      dismissQuestion,
      acceptChallenge,
      declineChallenge,
      checkinChallenge,
      resetAi,
      retryNow,
    ],
  );

  return <AiContext.Provider value={value}>{children}</AiContext.Provider>;
}

export function useAi(): AiContextValue {
  const context = useContext(AiContext);
  if (!context) throw new Error("useAi must be used inside AiProvider");
  return context;
}
