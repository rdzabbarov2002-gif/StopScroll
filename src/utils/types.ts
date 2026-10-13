import type Ionicons from "@expo/vector-icons/Ionicons";

export type IconName = keyof typeof Ionicons.glyphMap;

export type ThemePreference = "system" | "light" | "dark";

/** What pushed the hand towards the feed. The first three are the quick cards on the home screen. */
export type TriggerId =
  | "boredom"
  | "fatigue"
  | "stress"
  | "loneliness"
  | "procrastination"
  | "autopilot";

export type FeedApp = "tiktok" | "reels" | "shorts" | "other";

/** A feed app the pause can stand in front of ("other" has no app to open). */
export type GateApp = Exclude<FeedApp, "other">;

/** How an attempt to open a feed app through the pause ended. */
export type GateOutcome = "declined" | "sos" | "replacement" | "opened";

/**
 * How the pause reaches the user on this platform: a Shortcuts automation (iOS), an
 * accessibility service (Android) or only a preview (web).
 */
export type GateMode = "shortcuts" | "service" | "preview";

/** One attempt to open a feed app that was stopped by the pause screen. */
export interface InterceptEntry {
  id: string;
  timestamp: number;
  app: GateApp;
  outcome: GateOutcome;
}

export type ReplacementCategory = "body" | "mind" | "facts";

export type ExerciseId = "breath-ground" | "box-breath" | "serial-sevens" | "intent-check";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

export interface Replacement {
  id: string;
  title: string;
  description: string;
  /** Short instructions; for "facts" each item is one fact card. */
  steps: string[];
  /** 1–3 minutes. */
  minutes: number;
  category: ReplacementCategory;
  icon: IconName;
  /** Available only with StopScroll Pro. */
  premium?: boolean;
  /** States this replacement works best for (used for suggestions). */
  triggers: TriggerId[];
  /** Created by the user (a Pro feature). */
  custom?: boolean;
}

export interface CustomReplacement {
  id: string;
  title: string;
  description: string;
  minutes: number;
  category: ReplacementCategory;
  createdAt: number;
}

export type CustomReplacementInput = Omit<CustomReplacement, "id" | "createdAt">;

/** An impulse that did not end in the feed. Every win credits "saved" minutes. */
export interface WinEntry {
  id: string;
  timestamp: number;
  minutesSaved: number;
  /** "gate" — the user chose not to open a feed app on the pause screen. */
  source: "sos" | "replacement" | "gate";
  trigger?: TriggerId;
  replacementId?: string;
}

export type WinInput = Omit<WinEntry, "id" | "timestamp" | "minutesSaved"> & {
  timestamp?: number;
};

/** A slip: the impulse won and ended in the feed. */
export interface SlipEntry {
  id: string;
  timestamp: number;
  trigger: TriggerId;
  app: FeedApp;
  minutesLost: number;
  note: string;
}

export type SlipInput = Omit<SlipEntry, "id" | "timestamp"> & { timestamp?: number };

export interface Settings {
  /** Daily scrolling budget; a day at or under it counts as "under control". */
  dailyLimitMinutes: number;
  /** How long one feed session usually lasts — credited for every win. */
  sessionMinutes: number;
  /** Daily scrolling before StopScroll, for the "how it was" comparison. */
  baselineMinutes: number;
  mainApp: FeedApp;
  /** Feed apps that open through the pause (Shortcuts automation on iOS, a service on Android). */
  gateApps: GateApp[];
  /** How long the pause before a feed app lasts. */
  gateSeconds: number;
  /** A Sunday notification that the weekly report is ready. */
  reportReminder: boolean;
}

/** Wins pushed out of the capped `wins` list, kept as totals so all-time numbers never shrink. */
export interface WinArchive {
  count: number;
  minutes: number;
  replacementCount: number;
}

/** Everything that is written to AsyncStorage. */
export interface PersistedState {
  version: 1;
  onboarded: boolean;
  settings: Settings;
  /** Minutes of feed scrolling per local day, keyed by "YYYY-MM-DD". */
  scrollLog: Record<string, number>;
  wins: WinEntry[];
  winArchive: WinArchive;
  slips: SlipEntry[];
  /** Attempts to open a feed app that went through the pause screen. */
  intercepts: InterceptEntry[];
  customReplacements: CustomReplacement[];
  lastExerciseId: ExerciseId;
  themePreference: ThemePreference;
  /** Achievement id → when it was earned. */
  achievements: Record<string, number>;
  /** Monday key of the newest weekly report the user has opened. */
  lastSeenReport: string | null;
}
