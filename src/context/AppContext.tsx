import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { AppState as RNAppState } from "react-native";

import { dayKey } from "../utils/date";
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_NOTE_LENGTH,
  MAX_TITLE_LENGTH,
  createId,
  createInitialState,
} from "../utils/persistedState";
import { loadPersistedState, savePersistedState } from "../utils/storage";
import type {
  CustomReplacement,
  CustomReplacementInput,
  ExerciseId,
  PersistedState,
  Settings,
  SlipEntry,
  SlipInput,
  ThemePreference,
  WinEntry,
  WinInput,
} from "../utils/types";
import { appReducer, toPersistedState, type AppState } from "./appReducer";

export interface AppContextValue extends Omit<PersistedState, "version"> {
  hydrated: boolean;
  todayKey: string;
  completeOnboarding: (settings: Settings) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  logScroll: (day: string, minutes: number) => void;
  clearScroll: (day: string) => void;
  /** Credits the user's usual session length as saved time. */
  recordWin: (data: WinInput) => WinEntry;
  undoWin: (id: string) => void;
  logSlip: (data: SlipInput) => SlipEntry;
  deleteSlip: (id: string) => void;
  addCustomReplacement: (data: CustomReplacementInput) => CustomReplacement;
  deleteCustomReplacement: (id: string) => void;
  setLastExercise: (id: ExerciseId) => void;
  setThemePreference: (preference: ThemePreference) => void;
  resetProgress: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const DAY_CHECK_INTERVAL_MS = 60_000;

function createBootState(): AppState {
  return { ...createInitialState(), hydrated: false, todayKey: dayKey() };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, createBootState);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  // Read by recordWin, so the callback can stay stable while the setting changes.
  const sessionMinutes = useRef(state.settings.sessionMinutes);
  useEffect(() => {
    sessionMinutes.current = state.settings.sessionMinutes;
  }, [state.settings.sessionMinutes]);

  // Load the saved state once on startup.
  useEffect(() => {
    let cancelled = false;
    loadPersistedState()
      .catch((error: unknown) => {
        console.warn("StopScroll: could not read saved state", error);
        return createInitialState();
      })
      .then((loaded) => {
        if (!cancelled) dispatch({ type: "hydrate", state: loaded, today: dayKey() });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist every change after hydration. Writes are chained so they land in order.
  useEffect(() => {
    if (!state.hydrated) return;
    const snapshot = toPersistedState(state);
    saveQueue.current = saveQueue.current
      .then(() => savePersistedState(snapshot))
      .catch((error: unknown) => console.warn("StopScroll: could not save state", error));
  }, [state]);

  // Notice local midnight, also when the app returns from background.
  useEffect(() => {
    const sync = () => dispatch({ type: "syncDay", today: dayKey() });
    const subscription = RNAppState.addEventListener("change", (status) => {
      if (status === "active") sync();
    });
    const interval = setInterval(sync, DAY_CHECK_INTERVAL_MS);
    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, []);

  const completeOnboarding = useCallback(
    (settings: Settings) => dispatch({ type: "completeOnboarding", settings }),
    [],
  );

  const updateSettings = useCallback(
    (settings: Partial<Settings>) => dispatch({ type: "updateSettings", settings }),
    [],
  );

  const logScroll = useCallback(
    (day: string, minutes: number) => dispatch({ type: "logScroll", day, minutes }),
    [],
  );

  const clearScroll = useCallback((day: string) => dispatch({ type: "clearScroll", day }), []);

  const recordWin = useCallback((data: WinInput): WinEntry => {
    const entry: WinEntry = {
      id: createId(),
      timestamp: data.timestamp ?? Date.now(),
      minutesSaved: sessionMinutes.current,
      source: data.source,
      ...(data.trigger ? { trigger: data.trigger } : {}),
      ...(data.replacementId ? { replacementId: data.replacementId } : {}),
    };
    dispatch({ type: "recordWin", entry });
    return entry;
  }, []);

  const undoWin = useCallback((id: string) => dispatch({ type: "undoWin", id }), []);

  const logSlip = useCallback((data: SlipInput): SlipEntry => {
    const entry: SlipEntry = {
      id: createId(),
      timestamp: data.timestamp ?? Date.now(),
      trigger: data.trigger,
      app: data.app,
      minutesLost: Math.max(0, Math.round(data.minutesLost)),
      note: data.note.trim().slice(0, MAX_NOTE_LENGTH),
    };
    dispatch({ type: "logSlip", entry });
    return entry;
  }, []);

  const deleteSlip = useCallback((id: string) => dispatch({ type: "deleteSlip", id }), []);

  const addCustomReplacement = useCallback((data: CustomReplacementInput): CustomReplacement => {
    const entry: CustomReplacement = {
      id: `custom-${createId()}`,
      title: data.title.trim().slice(0, MAX_TITLE_LENGTH),
      description: data.description.trim().slice(0, MAX_DESCRIPTION_LENGTH),
      minutes: Math.min(3, Math.max(1, Math.round(data.minutes))),
      category: data.category,
      createdAt: Date.now(),
    };
    dispatch({ type: "addCustomReplacement", entry });
    return entry;
  }, []);

  const deleteCustomReplacement = useCallback(
    (id: string) => dispatch({ type: "deleteCustomReplacement", id }),
    [],
  );

  const setLastExercise = useCallback(
    (id: ExerciseId) => dispatch({ type: "setLastExercise", id }),
    [],
  );

  const setThemePreference = useCallback(
    (preference: ThemePreference) => dispatch({ type: "setTheme", preference }),
    [],
  );

  const resetProgress = useCallback(() => dispatch({ type: "resetProgress" }), []);

  const value = useMemo<AppContextValue>(
    () => ({
      hydrated: state.hydrated,
      todayKey: state.todayKey,
      onboarded: state.onboarded,
      settings: state.settings,
      scrollLog: state.scrollLog,
      wins: state.wins,
      slips: state.slips,
      customReplacements: state.customReplacements,
      lastExerciseId: state.lastExerciseId,
      themePreference: state.themePreference,
      completeOnboarding,
      updateSettings,
      logScroll,
      clearScroll,
      recordWin,
      undoWin,
      logSlip,
      deleteSlip,
      addCustomReplacement,
      deleteCustomReplacement,
      setLastExercise,
      setThemePreference,
      resetProgress,
    }),
    [
      state,
      completeOnboarding,
      updateSettings,
      logScroll,
      clearScroll,
      recordWin,
      undoWin,
      logSlip,
      deleteSlip,
      addCustomReplacement,
      deleteCustomReplacement,
      setLastExercise,
      setThemePreference,
      resetProgress,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside <AppProvider>");
  return context;
}
