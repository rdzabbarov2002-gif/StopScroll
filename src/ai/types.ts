/**
 * The AI coach's data. Everything here is written by ChatGPT (analyses, memory, analytics,
 * forecasts, questions, experiments) or is the user's own input — it is stored on the device
 * only, apart from the main app state, under its own keys (src/ai/storage.ts).
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
  explanation: string;
  missing: string | null;
  /** Normalized tags, counted locally over the whole history. */
  tags: string[];
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
}

export interface MemoryNote {
  period: string;
  note: string;
}

export interface Milestone {
  date: string;
  note: string;
}

export interface MemoryHypothesis {
  text: string;
  status: "proposed" | "supported" | "weakened";
}

/** The model's own compact, long-term memory about the user, updated with every analysis. */
export interface AiMemory {
  summary: string;
  timeline: MemoryNote[];
  milestones: Milestone[];
  hypotheses: MemoryHypothesis[];
  openQuestions: string[];
}

export interface TitledNote {
  title: string;
  note: string;
}

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
  longTerm: string[];
  numbers: { headline: string; equivalents: string[] } | null;
  conclusion: string;
  dataNote: string | null;
}

export type RiskLevel = "low" | "medium" | "high";

export interface AiForecast {
  probability: number | null;
  level: RiskLevel | null;
  headline: string;
  reasons: string[];
  window: { until: string | null; message: string | null };
  passed: string | null;
  advice: string | null;
  basis: string;
  validUntil: string | null;
  /** Local day the forecast is for, and when it was made. */
  day: string;
  createdAt: number;
}

export interface AiQuestion {
  id: string;
  text: string;
  kind: "yes_no" | "choice";
  options: string[];
  askedAt: number;
}

export interface AiAnswer {
  questionId: string;
  question: string;
  answer: string;
  answeredAt: number;
}

export type ChallengeFocus = "morning" | "day" | "evening" | "night" | "all";

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
  endDay: string | null;
  /** Day key → whether the user managed it that day. */
  checkins: Record<string, boolean>;
  review: string | null;
}

export type SyncStatus = "idle" | "working" | "error";

export interface AiState {
  /** null — not asked yet; the user must allow sending entries to OpenAI first. */
  consent: boolean | null;
  entries: AiEntry[];
  memory: AiMemory | null;
  analytics: AiAnalytics | null;
  forecast: AiForecast | null;
  question: AiQuestion | null;
  answers: AiAnswer[];
  /** When the last question was asked (cooldown: questions come at most every few days). */
  lastQuestionAt: number | null;
  challenge: AiChallenge | null;
  pastChallenges: AiChallenge[];
  insightsAt: number | null;
  /** Fingerprint of the app records the last analytics/forecast saw. */
  insightsRecordsKey: string | null;
  forecastRecordsKey: string | null;
}
