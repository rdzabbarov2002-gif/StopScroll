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

import { buildAnalytics, challengeHelped, challengeReview } from "../ai/analytics";
import { AI_CONFIGURED, AiRequestError, aiErrorText, postAi, type AiErrorKind } from "../ai/client";
import { isActive } from "../ai/evidence";
import { buildTimeline, hasHistory, recordsKey } from "../ai/facts";
import { buildForecast } from "../ai/forecast";
import { applyDeep } from "../ai/memory";
import { isRecord, parseChallenge, parseEntryResult, parseQuestions } from "../ai/parse";
import {
  ENTRY_BATCH,
  blindPayload,
  deepPayload,
  duplicateOf,
  entryPayload,
  translatable,
  type Reread,
} from "../ai/payload";
import { aiReducer, type AiAction } from "../ai/reducer";
import { disputed, planReview, sameReading } from "../ai/review";
import { challengeFinished, needsDeep, questionDue } from "../ai/schedule";
import { createInitialAiState, loadAiState, saveAiState } from "../ai/storage";
import type { AiAnalytics, AiEntry, AiForecast, AiState, EntryOutcome } from "../ai/types";
import { getLanguage, m, useLanguage } from "../i18n";
import { dayKey } from "../utils/date";
import { createId } from "../utils/persistedState";
import { useNow } from "../utils/useNow";
import { useApp } from "./AppContext";

export type AiTask = "entry" | "deep" | "translate";

export interface AiSync {
  status: "idle" | "working" | "error";
  task: AiTask | null;
  /** What went wrong, in the app's current language. */
  error: string | null;
}

interface SyncState extends Omit<AiSync, "error"> {
  error: AiErrorKind | null;
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
const TIMEOUTS: Record<AiTask, number> = { entry: 45_000, deep: 150_000, translate: 60_000 };
/** A failed request waits this long before the next automatic attempt. */
const RETRY_DELAY = 2 * MINUTE;
/** While the app is open, whether a deep analysis is due is checked this often (no request). */
const CHECK_INTERVAL = 30 * MINUTE;
/** The on-device forecast follows the clock at this pace (and every new record at once). */
const FORECAST_TICK = 5 * MINUTE;

/** Texts (and characters) per translation request when the memory changes language. */
const TRANSLATE_CHUNK = 60;
const TRANSLATE_CHARS = 12_000;

/** Splits the texts into requests of a size the server takes. */
function chunks(items: readonly string[]): string[][] {
  const result: string[][] = [];
  let current: string[] = [];
  let size = 0;
  for (const item of items) {
    if (
      current.length &&
      (current.length >= TRANSLATE_CHUNK || size + item.length > TRANSLATE_CHARS)
    ) {
      result.push(current);
      current = [];
      size = 0;
    }
    current.push(item.slice(0, 900));
    size += item.length;
  }
  if (current.length) result.push(current);
  return result;
}
/** Disputed readings the deep analysis settles at once (plus one turning point). */
const MAX_DISPUTES = 4;

export function AiProvider({ children }: { children: ReactNode }) {
  const app = useApp();
  const [state, dispatch] = useReducer(aiReducer, undefined, createInitialAiState);
  const [hydrated, setHydrated] = useState(false);
  const [syncState, setSync] = useState<SyncState>({ status: "idle", task: null, error: null });
  const language = useLanguage();

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
  const translateFailures = useRef(0);

  /** Remembers the failure and comes back by itself once the pause is over. */
  const fail = useCallback((task: AiTask, error: unknown) => {
    const kind = error instanceof AiRequestError ? error.kind : "unusable";
    const delay = kind === "offline" ? MINUTE : RETRY_DELAY;
    retryAt.current = Date.now() + delay;
    setSync({ status: "error", task, error: kind });
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
   * repeated texts. Requests: translating the memory once after a language change, new entries
   * (light, in batches) and, rarely, the deep analysis with its independent re-reading.
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
      const t = timeline();
      apply({
        type: "finishChallenge",
        review: challengeReview(finished, t),
        helped: challengeHelped(finished, t),
      });
    }
    if (questionDue(stateRef.current, now)) apply({ type: "showQuestion", at: now });

    // 0. The memory was written in another language: translate it once (the light model).
    const language = getLanguage();
    const before = stateRef.current;
    if (before.memory && before.memoryLanguage && before.memoryLanguage !== language) {
      setSync({ status: "working", task: "translate", error: null });
      try {
        const items = translatable(before);
        const translations: Record<string, string> = {};
        let offset = 0;
        for (const chunk of chunks(items)) {
          const raw = await postAi("/translate", { texts: chunk }, TIMEOUTS.translate);
          const texts = isRecord(raw) && Array.isArray(raw.texts) ? raw.texts : [];
          if (texts.length !== chunk.length) throw new AiRequestError("unusable");
          texts.forEach((value, at) => {
            if (typeof value === "string" && value.trim()) {
              translations[items[offset + at]!] = value.trim();
            }
          });
          offset += chunk.length;
        }
        // The language changed again meanwhile: start over with the new one.
        if (!current() || getLanguage() !== language) return current();
        apply({
          type: "translated",
          language,
          translations,
          yesNo: [m().ai.yes, m().ai.no],
        });
        return true;
      } catch (error) {
        if (!current()) return false;
        // The translation must never hold up the analysis: after a few failures (or at once if
        // the server has no such route) the memory stays as it is and the next deep analysis
        // rewrites it in the new language.
        translateFailures.current += 1;
        const kind = error instanceof AiRequestError ? error.kind : "unusable";
        if (kind === "server" || translateFailures.current >= 3) {
          translateFailures.current = 0;
          apply({ type: "translated", language, translations: {}, yesNo: [m().ai.yes, m().ai.no] });
          return true;
        }
        fail("translate", error);
        return false;
      }
    }

    // 1. New entries, oldest first. The same words again reuse the earlier reading.
    for (const item of [...stateRef.current.entries].reverse()) {
      if (item.status !== "pending") continue;
      const source = duplicateOf(item, stateRef.current.entries);
      if (source?.analysis) {
        apply({
          type: "entryAnalyzed",
          id: item.id,
          analysis: { ...source.analysis, analyzedAt: now },
          votes: [],
          reading: source.reading ? { ...source.reading, votes: [], at: now } : undefined,
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
          entryPayload(batch, ai.memory, ai.entries, now),
          TIMEOUTS.entry,
        );
        if (!current()) return false;
        const at = Date.now();
        const results = (isRecord(raw) && Array.isArray(raw.results) ? raw.results : [])
          .map((item) => {
            const n = isRecord(item) && typeof item.n === "number" ? item.n : 0;
            return parseEntryResult(item, at, batch[n - 1]?.text.trim().length);
          })
          .filter((item) => item !== null);
        if (!results.length) throw new AiRequestError("unusable");
        const known = new Set(
          (ai.memory?.beliefs ?? []).filter(isActive).map((belief) => belief.id),
        );
        batch.forEach((item, index) => {
          const result = results.find((value) => value.n === index + 1);
          apply(
            result
              ? {
                  type: "entryAnalyzed",
                  id: item.id,
                  analysis: result.analysis,
                  votes: result.votes.filter((vote) => known.has(vote.id)),
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

    // 2. Rarely: the deep analysis. First a few chosen entries are read again without the
    // memory; only those where that reading disagrees reach the deep analysis as originals.
    const key = recordsKey(data);
    if (!needsDeep(ai, key, hasHistory(timeline()), now)) return false;
    setSync({ status: "working", task: "deep", error: null });
    try {
      const plan = planReview(ai, timeline(), now);
      if (plan.blind.length) {
        const sent = plan.blind.map((item) => item.entry);
        const raw = await postAi("/entry", blindPayload(sent), TIMEOUTS.entry);
        if (!current()) return false;
        const results = (isRecord(raw) && Array.isArray(raw.results) ? raw.results : [])
          .map((item) => parseEntryResult(item, now))
          .filter((item) => item !== null);
        apply({
          type: "blindChecked",
          at: now,
          results: sent.flatMap((entry, index) => {
            const result = results.find((value) => value.n === index + 1);
            if (!result || !entry.reading) return [];
            const blind = {
              cause: result.analysis.cause,
              tags: result.analysis.tags,
              enough: result.analysis.enough,
            };
            return [
              { id: entry.id, blind, agreed: sameReading(entry.reading, entry.analysis, blind) },
            ];
          }),
        });
      }
      const state = stateRef.current;
      const t = timeline();
      const rereads: Reread[] = disputed(state)
        .slice(0, MAX_DISPUTES)
        .map((entry) => ({ entry, reason: "disputed" as const }));
      const pivot =
        plan.pivot && !rereads.some((item) => item.entry.id === plan.pivot!.entry.id)
          ? state.entries.find((entry) => entry.id === plan.pivot!.entry.id)
          : undefined;
      if (pivot) rereads.push({ entry: pivot, reason: "pivot" });
      const { body, refs, reread, sentIds } = deepPayload(state, t, rereads);
      const raw = await postAi("/deep", body, TIMEOUTS.deep);
      if (!current()) return false;
      // Applied to the latest state: what came in while the request ran is kept.
      const latest = stateRef.current;
      const result = applyDeep(latest, raw, {
        refs,
        reread,
        now: Date.now(),
        month: dayKey(now).slice(0, 7),
        timeline: buildTimeline({ ...appRef.current, entries: latest.entries, now: Date.now() }),
      });
      if (!result) throw new AiRequestError("unusable");
      const at = Date.now();
      const record = isRecord(raw) ? raw : {};
      const active = new Set(result.memory.beliefs.filter(isActive).map((belief) => belief.id));
      const tips = new Set(
        result.memory.beliefs
          .filter((belief) => belief.kind === "tip" && isActive(belief))
          .map((belief) => belief.id),
      );
      const challenge = body.policy.challenge
        ? parseChallenge(record.challenge, `c-${at}`, at)
        : null;
      apply({
        type: "deepUpdated",
        // What is answered or changed while the request runs goes into the next analysis.
        at: now,
        recordsKey: key,
        sentEntryIds: sentIds,
        sentAnswerIds: state.answers
          .filter((answer) => !answer.inMemory)
          .map((answer) => answer.questionId),
        sentDeleted: state.deletedSinceDeep.length,
        memory: result.memory,
        language,
        readIds: rereads.map((item) => item.entry.id),
        readings: result.readings,
        pivotKey: pivot && plan.pivot ? plan.pivot.key : null,
        questions: body.policy.questions
          ? parseQuestions(record.questions).map((question) => ({
              ...question,
              about: question.about && active.has(question.about) ? question.about : null,
            }))
          : [],
        challenge: challenge
          ? {
              ...challenge,
              tipId: challenge.tipId && tips.has(challenge.tipId) ? challenge.tipId : null,
            }
          : null,
      });
      return false;
    } catch (error) {
      if (!current()) return false;
      fail("deep", error);
      return false;
    }
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
  }, [enabled, pendingCount, state.answers.length, state.challenge?.status, language, run]);

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
  // Built in the app's language: a new language rebuilds them at once.
  const forecast = useMemo(
    () => (enabled && language ? buildForecast(timeline, state.memory) : null),
    [enabled, timeline, state.memory, language],
  );
  const analytics = useMemo(
    () => (state.memory && language ? buildAnalytics(timeline, state.memory) : null),
    [timeline, state.memory, language],
  );
  const sync = useMemo<AiSync>(
    () => ({
      ...syncState,
      error: syncState.error && language ? aiErrorText(syncState.error) : null,
    }),
    [syncState, language],
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
        reading: null,
        past: [],
        reads: 0,
        readAt: null,
        contested: false,
        blind: null,
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
