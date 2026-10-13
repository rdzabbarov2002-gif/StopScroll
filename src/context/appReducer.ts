import {
  MAX_CUSTOM_REPLACEMENTS,
  MAX_INTERCEPTS,
  MAX_SLIPS,
  MAX_WINS,
  archiveWins,
  clampScrollMinutes,
  createInitialState,
  trimScrollLog,
} from "../utils/persistedState";
import type {
  CustomReplacement,
  ExerciseId,
  InterceptEntry,
  PersistedState,
  Settings,
  SlipEntry,
  ThemePreference,
  WinEntry,
} from "../utils/types";

export interface AppState extends PersistedState {
  /** False until the saved state has been read from AsyncStorage. */
  hydrated: boolean;
  /** Current local day key; lets screens notice midnight. */
  todayKey: string;
  /** Achievements earned in this session whose unlock animation hasn't been shown yet. */
  unlockQueue: string[];
}

export type AppAction =
  | { type: "hydrate"; state: PersistedState; today: string }
  | { type: "syncDay"; today: string }
  | { type: "completeOnboarding"; settings: Settings }
  | { type: "updateSettings"; settings: Partial<Settings> }
  | { type: "logScroll"; day: string; minutes: number }
  | { type: "clearScroll"; day: string }
  | { type: "recordWin"; entry: WinEntry }
  | { type: "undoWin"; id: string }
  | { type: "logSlip"; entry: SlipEntry }
  | { type: "deleteSlip"; id: string }
  | { type: "logIntercept"; entry: InterceptEntry }
  | { type: "undoIntercept"; id: string }
  | { type: "unlockAchievements"; unlocked: Record<string, number> }
  | { type: "dismissUnlock"; id: string }
  | { type: "markReportSeen"; week: string }
  | { type: "addCustomReplacement"; entry: CustomReplacement }
  | { type: "deleteCustomReplacement"; id: string }
  | { type: "setLastExercise"; id: ExerciseId }
  | { type: "setTheme"; preference: ThemePreference }
  | { type: "resetProgress" };

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "hydrate":
      // Achievements in a loaded state were already earned; nothing to celebrate again.
      return { ...action.state, hydrated: true, todayKey: action.today, unlockQueue: [] };

    case "syncDay":
      return state.todayKey === action.today ? state : { ...state, todayKey: action.today };

    case "completeOnboarding":
      return { ...state, onboarded: true, settings: action.settings };

    case "updateSettings":
      return { ...state, settings: { ...state.settings, ...action.settings } };

    case "logScroll":
      return {
        ...state,
        scrollLog: trimScrollLog({
          ...state.scrollLog,
          [action.day]: clampScrollMinutes(action.minutes),
        }),
      };

    case "clearScroll": {
      if (!(action.day in state.scrollLog)) return state;
      const { [action.day]: _removed, ...rest } = state.scrollLog;
      return { ...state, scrollLog: rest };
    }

    case "recordWin": {
      const wins = [action.entry, ...state.wins];
      return {
        ...state,
        wins: wins.slice(0, MAX_WINS),
        // The oldest win leaves the list but keeps counting towards the all-time totals.
        winArchive: archiveWins(state.winArchive, wins.slice(MAX_WINS)),
      };
    }

    case "undoWin":
      return { ...state, wins: state.wins.filter((entry) => entry.id !== action.id) };

    case "logSlip":
      return { ...state, slips: [action.entry, ...state.slips].slice(0, MAX_SLIPS) };

    case "deleteSlip":
      return { ...state, slips: state.slips.filter((entry) => entry.id !== action.id) };

    case "logIntercept":
      return {
        ...state,
        intercepts: [action.entry, ...state.intercepts].slice(0, MAX_INTERCEPTS),
      };

    case "undoIntercept":
      return { ...state, intercepts: state.intercepts.filter((entry) => entry.id !== action.id) };

    case "unlockAchievements": {
      // An earned achievement keeps its first date.
      const fresh = Object.entries(action.unlocked).filter(([id]) => !(id in state.achievements));
      if (fresh.length === 0) return state;
      return {
        ...state,
        achievements: { ...state.achievements, ...Object.fromEntries(fresh) },
        unlockQueue: [...state.unlockQueue, ...fresh.map(([id]) => id)],
      };
    }

    case "dismissUnlock":
      return { ...state, unlockQueue: state.unlockQueue.filter((id) => id !== action.id) };

    case "markReportSeen":
      return state.lastSeenReport !== null && state.lastSeenReport >= action.week
        ? state
        : { ...state, lastSeenReport: action.week };

    case "addCustomReplacement":
      if (state.customReplacements.length >= MAX_CUSTOM_REPLACEMENTS) return state;
      return { ...state, customReplacements: [action.entry, ...state.customReplacements] };

    case "deleteCustomReplacement":
      return {
        ...state,
        customReplacements: state.customReplacements.filter((entry) => entry.id !== action.id),
      };

    case "setLastExercise":
      return state.lastExerciseId === action.id ? state : { ...state, lastExerciseId: action.id };

    case "setTheme":
      return state.themePreference === action.preference
        ? state
        : { ...state, themePreference: action.preference };

    case "resetProgress": {
      // Wipes the tracked history but keeps the user's setup.
      const fresh = createInitialState();
      return {
        ...state,
        scrollLog: fresh.scrollLog,
        wins: fresh.wins,
        winArchive: fresh.winArchive,
        slips: fresh.slips,
        intercepts: fresh.intercepts,
        customReplacements: fresh.customReplacements,
        achievements: fresh.achievements,
        lastSeenReport: fresh.lastSeenReport,
        unlockQueue: [],
      };
    }

    default:
      return state;
  }
}

export function toPersistedState(state: AppState): PersistedState {
  return {
    version: 1,
    onboarded: state.onboarded,
    settings: state.settings,
    scrollLog: state.scrollLog,
    wins: state.wins,
    winArchive: state.winArchive,
    slips: state.slips,
    intercepts: state.intercepts,
    customReplacements: state.customReplacements,
    lastExerciseId: state.lastExerciseId,
    themePreference: state.themePreference,
    achievements: state.achievements,
    lastSeenReport: state.lastSeenReport,
  };
}
