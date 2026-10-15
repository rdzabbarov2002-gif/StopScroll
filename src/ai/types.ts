/**
 * The AI coach's data. ChatGPT writes the analysis of each entry and the long-term memory;
 * the analytics and today's forecast shown on screen are built on the device from that memory
 * and the user's own records (src/ai/analytics.ts, src/ai/forecast.ts). Everything is stored on
 * the device only, apart from the main app state, under its own keys (src/ai/storage.ts).
 */

/** "Чем закончилось" — optional, chosen by the user when saving an entry. */
export type EntryOutcome = "resisted" | "opened";

/** ChatGPT's reading of one entry. */
export interface EntryAnalysis {
  enough: boolean;
  cause: string | null;
  emotion: string | null;
  context: string | null;
  behavior: string | null;
  /** A non-obvious observation (a link to the memory); null when there is nothing beyond the text. */
  explanation: string | null;
  missing: string | null;
  /** Normalized tags, counted locally over the whole history. */
  tags: string[];
  /** The entry in one short line — what the deep analysis gets instead of the full text. */
  gist: string | null;
  analyzedAt: number;
}

export type EntryStatus = "pending" | "done" | "failed";

/** What the user wrote before wanting to open the feed. */
export interface AiEntry {
  id: string;
  timestamp: number;
  text: string;
  outcome: EntryOutcome | null;
  status: EntryStatus;
  attempts: number;
  analysis: EntryAnalysis | null;
  /** Already taken into the long-term memory by a deep analysis — it is never sent again. */
  inMemory: boolean;
}

export interface TitledNote {
  title: string;
  note: string;
}

export type ChallengeFocus = "morning" | "day" | "evening" | "night" | "all";
export type TipTime = Exclude<ChallengeFocus, "all"> | "any";

/** A dangerous period: on a weekday (0 — Monday) and/or between hours, or after some event. */
export interface DangerZone {
  title: string;
  note: string;
  weekday: number | null;
  from: number | null;
  to: number | null;
}

export interface MemoryHypothesis {
  /** Stable across analyses, so the votes from single entries add up. */
  id: string;
  text: string;
  status: "proposed" | "supported" | "weakened";
  /** Entries that supported / contradicted it (counted on the device from each entry analysis). */
  support: number;
  against: number;
}

/**
 * The model's long-term memory about the user — the only thing ChatGPT "remembers". It is
 * rebuilt by the rare deep analysis and is what every later request gets instead of the history.
 */
export interface AiMemory {
  profile: string;
  /** Main causes and situations of slips. */
  triggers: TitledNote[];
  emotions: TitledNote[];
  dangerZones: DangerZone[];
  strengths: string[];
  weaknesses: string[];
  /** Personal advice; today's forecast picks the one that fits the time of the danger. */
  tips: { text: string; when: TipTime }[];
  /** Dated important events and changes. */
  events: { date: string; note: string }[];
  /** How the habit changes over the long run. */
  changes: string[];
  improvements: string[];
  worsenings: string[];
  hypotheses: MemoryHypothesis[];
  /** The last overall conclusion — the next analysis builds on it. */
  conclusion: string;
  openQuestions: string[];
}

/** What the AI tab shows: the memory's conclusions plus numbers counted on the device. */
export interface AiAnalytics {
  causes: { title: string; share: number | null; note: string }[];
  situations: TitledNote[];
  emotions: TitledNote[];
  times: TitledNote[];
  weekdays: TitledNote[];
  improvements: string[];
  worsenings: string[];
  habitChanges: string[];
  hypotheses: { text: string; confidence: "low" | "medium" | "high" }[];
  warnings: string[];
  selfComparison: string[];
  /** Long-term memory: dated events, long-run changes and records. */
  longTerm: string[];
  numbers: { headline: string; equivalents: string[] } | null;
  conclusion: string;
  dataNote: string | null;
}

export type RiskLevel = "low" | "medium" | "high";

/** Today's forecast — computed on the device from the history and the memory. */
export interface AiForecast {
  probability: number | null;
  level: RiskLevel | null;
  headline: string;
  reasons: string[];
  window: { until: string | null; message: string | null };
  passed: string | null;
  advice: string | null;
  basis: string;
  /** Local day the forecast is for, and when it was computed. */
  day: string;
  createdAt: number;
}

/** A question the deep analysis prepared; shown one at a time, a few days apart. */
export interface QueuedQuestion {
  text: string;
  kind: "yes_no" | "choice";
  options: string[];
}

export interface AiQuestion extends QueuedQuestion {
  id: string;
  askedAt: number;
}

export interface AiAnswer {
  questionId: string;
  question: string;
  answer: string;
  answeredAt: number;
  /** Already taken into the memory by a deep analysis. */
  inMemory: boolean;
}

export type ChallengeStatus = "proposed" | "active" | "reviewing" | "done" | "declined";

/** The weekly experiment ChatGPT proposes, and how it went. */
export interface AiChallenge {
  id: string;
  title: string;
  description: string;
  durationDays: number;
  focus: ChallengeFocus;
  expectation: string;
  status: ChallengeStatus;
  proposedAt: number;
  /** Day keys, set when the user accepts. */
  startDay: string | null;
  /** The moment the user accepted: what happened earlier that day doesn't count. */
  startedAt: number | null;
  endDay: string | null;
  /** Day key → whether the user managed it that day. */
  checkins: Record<string, boolean>;
  /** The result: days before vs during, counted on the device when the experiment ends. */
  review: string | null;
}

export type SyncStatus = "idle" | "working" | "error";

/** What is left of a deleted entry — no text, only when it was and what ChatGPT called it. */
export interface DeletedEntry {
  date: string;
  time: string;
  cause: string | null;
}

export interface AiState {
  /** null — not asked yet; the user must allow sending entries to OpenAI first. */
  consent: boolean | null;
  entries: AiEntry[];
  memory: AiMemory | null;
  /** When the last deep analysis was made, and when the first one was (the memory's age). */
  deepAt: number | null;
  memorySince: number | null;
  /** Fingerprint of the app records the last deep analysis saw. */
  deepRecordsKey: string | null;
  question: AiQuestion | null;
  questionQueue: QueuedQuestion[];
  /** Questions asked lately, so the next analysis doesn't repeat them. */
  askedRecently: string[];
  answers: AiAnswer[];
  /** When the last question was shown (questions come at most every few days). */
  lastQuestionAt: number | null;
  challenge: AiChallenge | null;
  pastChallenges: AiChallenge[];
  /** Entries the user deleted after ChatGPT saw them: the next analysis forgets what relied on them. */
  deletedSinceDeep: DeletedEntry[];
}
