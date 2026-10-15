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

import { buildAnalytics, challengeReview } from "../ai/analytics";
import { AI_CONFIGURED, AI_ERROR_TEXT, AiRequestError, postAi } from "../ai/client";
import { buildTimeline, hasHistory, recordsKey } from "../ai/facts";
import { buildForecast } from "../ai/forecast";
import { parseChallenge, parseEntryResult, parseMemory, parseQuestions } from "../ai/parse";
import { ENTRY_BATCH, deepPayload, duplicateAnalysis, entryPayload } from "../ai/payload";
import { aiReducer, type AiAction } from "../ai/reducer";
import { challengeFinished, entriesSinceDeep, needsDeep, questionDue } from "../ai/schedule";
import { createInitialAiState, loadAiState, saveAiState } from "../ai/storage";
import type { AiAnalytics, AiEntry, AiForecast, AiState, EntryOutcome } from "../ai/types";
import { dayKey } from "../utils/date";
import { createId } from "../utils/persistedState";
import { useNow } from "../utils/useNow";
import { useApp } from "./AppContext";

export type AiTask = "entry" | "deep";

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
  /** The AI tab's analytics: the memory's conclusions + numbers counted on the device. */
  analytics: AiAnalytics | null;
  /** Today's forecast, computed on the device (null while there is no history at all). */
  forecast: AiForecast | null;
  /** When the analysis last changed: the last deep analysis or the last analyzed entry. */
  updatedAt: number | null;
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
const TIMEOUTS: Record<AiTask, number> = { entry: 45_000, deep: 150_000 };
/** A failed request waits this long before the next automatic attempt. */
const RETRY_DELAY = 2 * MINUTE;
/** While the app is open, whether a deep analysis is due is checked this often (no request). */
const CHECK_INTERVAL = 30 * MINUTE;
/** The on-device forecast follows the clock at this pace (and every new record at once). */
const FORECAST_TICK = 5 * MINUTE;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

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
  // `queued` — the last state handed to storage; `written` — the last one written successfully.
  // A failed write keeps `written`, so the next save rewrites everything changed since then.
  const queued = useRef<AiState | null>(null);
  const written = useRef<AiState | null>(null);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => {
    let cancelled = false;
    loadAiState()
      .catch(() => loadAiState())
      .then(
        (loaded) => {
          if (cancelled) return;
          canPersist.current = true;
          queued.current = loaded;
          written.current = loaded;
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
    if (!hydrated || !canPersist.current || state === queued.current) return;
    queued.current = state;
    saveQueue.current = saveQueue.current.then(async () => {
      try {
        await saveAiState(state, written.current);
        written.current = state;
      } catch (error) {
        console.warn("StopScroll: could not save the AI coach data", error);
      }
    });
  }, [state, hydrated]);

  const enabled = AI_CONFIGURED && hydrated && state.consent === true && app.hydrated;
  const enabledRef = useRef(enabled);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const retryAt = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runRef = useRef<() => Promise<void>>(async () => undefined);
  // Bumped by a reset: an answer to a request sent before it is about erased data and is dropped.
  const generation = useRef(0);

  /** Remembers the failure and comes back by itself once the pause is over. */
  const fail = useCallback((task: AiTask, error: unknown) => {
    const kind = error instanceof AiRequestError ? error.kind : "unusable";
    const delay = kind === "offline" ? MINUTE : RETRY_DELAY;
    retryAt.current = Date.now() + delay;
    setSync({ status: "error", task, error: AI_ERROR_TEXT[kind] });
    if (retryTimer.current) clearTimeout(retryTimer.current);
    retryTimer.current = setTimeout(() => void runRef.current(), delay + 1_000);
  }, []);
  useEffect(
    () => () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
    },
    [],
  );

  /**
   * One unit of work. On the device: the experiment's result, the next prepared question,
   * repeated texts. Requests: new entries (light, in batches) and, rarely, the deep analysis.
   * Returns true to continue.
   */
  const step = useCallback(async (): Promise<boolean> => {
    if (!enabledRef.current || Date.now() < retryAt.current) return false;
    const startedIn = generation.current;
    const current = () => generation.current === startedIn && enabledRef.current;
    const now = Date.now();
    const data = appRef.current;
    const timeline = () => buildTimeline({ ...data, entries: stateRef.current.entries, now });

    const finished = stateRef.current.challenge;
    if (finished && challengeFinished(finished, dayKey(now))) {
      apply({ type: "finishChallenge", review: challengeReview(finished, timeline()) });
    }
    if (questionDue(stateRef.current, now)) apply({ type: "showQuestion", at: now });

    // 1. New entries, oldest first. The same words again reuse the earlier analysis.
    for (const item of [...stateRef.current.entries].reverse()) {
      if (item.status !== "pending") continue;
      const reused = duplicateAnalysis(item, stateRef.current.entries);
      if (reused) {
        apply({
          type: "entryAnalyzed",
          id: item.id,
          analysis: { ...reused, analyzedAt: now },
          votes: [],
        });
      }
    }
    const ai = stateRef.current;
    const batch = [...ai.entries]
      .reverse()
      .filter((item) => item.status === "pending")
      .slice(0, ENTRY_BATCH);
    if (batch.length) {
      setSync({ status: "working", task: "entry", error: null });
      try {
        const raw = await postAi(
          "/entry",
          entryPayload(batch, ai.memory, ai.entries),
          TIMEOUTS.entry,
        );
        if (!current()) return false;
        const at = Date.now();
        const results = (isRecord(raw) && Array.isArray(raw.results) ? raw.results : [])
          .map((item) => parseEntryResult(item, at))
          .filter((item) => item !== null);
        if (!results.length) throw new AiRequestError("unusable");
        batch.forEach((item, index) => {
          const result = results.find((value) => value.n === index + 1);
          apply(
            result
              ? {
                  type: "entryAnalyzed",
                  id: item.id,
                  analysis: result.analysis,
                  votes: result.votes,
                }
              : { type: "entryFailed", id: item.id, countAttempt: true },
          );
        });
        return true;
      } catch (error) {
        if (!current()) return false;
        // Only a broken answer or a server fault counts as an attempt; no network, a timeout
        // or a busy service just wait and try again.
        const countAttempt =
          !(error instanceof AiRequestError) ||
          error.kind === "unusable" ||
          error.kind === "server";
        for (const item of batch) apply({ type: "entryFailed", id: item.id, countAttempt });
        fail("entry", error);
        return false;
      }
    }

    // 2. Rarely: the deep analysis rebuilds the long-term memory.
    const t = timeline();
    const key = recordsKey(data);
    if (needsDeep(ai, key, hasHistory(t), now)) {
      setSync({ status: "working", task: "deep", error: null });
      const body = deepPayload(ai, t);
      try {
        const raw = await postAi("/deep", body, TIMEOUTS.deep);
        if (!current()) return false;
        const result = isRecord(raw) ? raw : {};
        // Votes that came in while the request ran are kept: counts come from the latest memory.
        const memory = parseMemory(result, stateRef.current.memory);
        if (!memory) throw new AiRequestError("unusable");
        const at = Date.now();
        apply({
          type: "deepUpdated",
          // What is answered or changed while the request runs goes into the next analysis.
          at: now,
          recordsKey: key,
          sentEntryIds: entriesSinceDeep(ai).map((item) => item.id),
          sentAnswerIds: ai.answers
            .filter((answer) => !answer.inMemory)
            .map((answer) => answer.questionId),
          sentDeleted: ai.deletedSinceDeep.length,
          memory,
          questions: body.policy.questions ? parseQuestions(result.questions) : [],
          challenge: body.policy.challenge ? parseChallenge(result.challenge, `c-${at}`, at) : null,
        });
        return false;
      } catch (error) {
        if (!current()) return false;
        fail("deep", error);
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
  useEffect(() => {
    runRef.current = run;
  }, [run]);

  // What sets the engine going: being enabled, a new entry or answer, the experiment, returning
  // to the app, and a rare check (whether a deep analysis is due costs nothing to find out).
  const pendingCount = state.entries.filter((entry) => entry.status === "pending").length;
  useEffect(() => {
    if (enabled) void run();
  }, [enabled, pendingCount, state.answers.length, state.challenge?.status, run]);

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

  // Computed on the device from the records and the memory — no requests.
  const tick = useNow(FORECAST_TICK);
  const at = Math.max(
    tick,
    appData.slips[0]?.timestamp ?? 0,
    appData.wins[0]?.timestamp ?? 0,
    state.entries[0]?.timestamp ?? 0,
  );
  const timeline = useMemo(
    () => buildTimeline({ ...appData, entries: state.entries, now: at }),
    [appData, state.entries, at],
  );
  const forecast = useMemo(
    () => (enabled ? buildForecast(timeline, state.memory) : null),
    [enabled, timeline, state.memory],
  );
  const analytics = useMemo(
    () => (state.memory ? buildAnalytics(timeline, state.memory) : null),
    [timeline, state.memory],
  );
  const updatedAt = useMemo(() => {
    const analyzed = state.entries.reduce(
      (latest, entry) => Math.max(latest, entry.analysis?.analyzedAt ?? 0),
      state.deepAt ?? 0,
    );
    return analyzed > 0 ? analyzed : null;
  }, [state.entries, state.deepAt]);

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
        inMemory: false,
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
      // Turning it off also drops whatever answer is still on its way.
      if (!consent) {
        generation.current += 1;
        setSync({ status: "idle", task: null, error: null });
      }
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
    () => apply({ type: "acceptChallenge", today: dayKey(), at: Date.now() }),
    [apply],
  );
  const declineChallenge = useCallback(() => apply({ type: "declineChallenge" }), [apply]);
  const checkinChallenge = useCallback(
    (done: boolean) => apply({ type: "checkinChallenge", day: dayKey(), done }),
    [apply],
  );
  const resetAi = useCallback(() => {
    generation.current += 1;
    apply({ type: "reset" });
    setSync({ status: "idle", task: null, error: null });
  }, [apply]);
  const retryNow = useCallback(() => {
    retryAt.current = 0;
    apply({ type: "retryFailed" });
    void run();
  }, [apply, run]);

  const value = useMemo<AiContextValue>(
    () => ({
      ...state,
      configured: AI_CONFIGURED,
      hydrated,
      enabled,
      sync,
      analytics,
      forecast,
      updatedAt,
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
      analytics,
      forecast,
      updatedAt,
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
