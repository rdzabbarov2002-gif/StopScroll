/**
 * The AI coach's data. ChatGPT reads each entry and keeps a long-term memory; the analytics and
 * today's forecast on screen are built on the device from that memory and the user's own
 * records (src/ai/analytics.ts, src/ai/forecast.ts). Everything is stored on the device only,
 * apart from the main app state, under its own keys (src/ai/storage.ts).
 *
 * An entry has two layers: `analysis` — what the user saw under it that day, never changed —
 * and `reading` — the coach's current understanding, which a later re-reading of the original
 * text may revise. Long-term conclusions are `beliefs` with stable ids, a status, a history and
 * evidence that is counted on the device, so the memory can correct itself without forgetting.
 */

import type { LanguageCode } from "../i18n/languages";

/** "Чем закончилось" — optional, chosen by the user when saving an entry. */
export type EntryOutcome = "resisted" | "opened";

export interface EntryVote {
  id: string;
  effect: "support" | "against";
}

/** ChatGPT's reading of one entry as the user saw it on the day — kept exactly as shown. */
export interface EntryAnalysis {
  enough: boolean;
  cause: string | null;
  emotion: string | null;
  context: string | null;
  behavior: string | null;
  /** A non-obvious observation (a link to the memory); null when there is nothing beyond the text. */
  explanation: string | null;
  missing: string | null;
  tags: string[];
  /** The entry in one short line — what the deep analysis gets instead of the full text. */
  gist: string | null;
  /** How sure the first reading was: 40 (a guess), 70 (follows from context), 95 (said outright). */
  conf: number;
  /** The language it was written in (null — before languages existed, i.e. Russian). */
  language: LanguageCode | null;
  analyzedAt: number;
}

/**
 * How the coach understands an entry now. Starts as the first reading; the deep analysis may
 * revise it after reading the original text again. Analytics and memory use this, not the
 * frozen `analysis`.
 */
export interface EntryReading {
  cause: string | null;
  tags: string[];
  gist: string | null;
  conf: number;
  /** What this entry says about the memory's beliefs. */
  votes: EntryVote[];
  /** "entry" — the first reading; "deep" — revised from the original text. */
  by: "entry" | "deep";
  at: number;
  /**
   * The independent check: a second reading made without the memory agreed ("agreed"),
   * disagreed ("disputed" — the deep analysis decides), or the deep analysis confirmed the
   * reading after reading the original ("settled").
   */
  check: "none" | "agreed" | "disputed" | "settled";
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
  reading: EntryReading | null;
  /** Earlier readings, newest first (at most two). */
  past: EntryReading[];
  /** How many times the original text went back to ChatGPT, and when last. */
  reads: number;
  readAt: number | null;
  /** The reading flipped back to an earlier one: no more re-reading. */
  contested: boolean;
  /** The memory-free reading that disagreed, waiting for the deep analysis to settle it. */
  blind: { cause: string | null; tags: string[]; enough: boolean } | null;
  /** Already taken into the long-term memory by a deep analysis. */
  inMemory: boolean;
}

export interface TitledNote {
  title: string;
  note: string;
}

export type ChallengeFocus = "morning" | "day" | "evening" | "night" | "all";
export type TipTime = Exclude<ChallengeFocus, "all"> | "any";

export type BeliefKind = "hypothesis" | "trigger" | "zone" | "tip";

/**
 * proposed → supported → established; weakened, retired (refuted) or superseded (replaced by a
 * better explanation). Retired and superseded beliefs stay: the coach remembers what it got wrong.
 */
export type BeliefStatus =
  | "proposed"
  | "supported"
  | "established"
  | "weakened"
  | "retired"
  | "superseded";

export interface Belief {
  /** Stable across analyses: h… hypothesis, t… trigger, z… dangerous period, p… tip. */
  id: string;
  kind: BeliefKind;
  text: string;
  /** Explanation without absolute numbers (the app shows the numbers). */
  note: string;
  status: BeliefStatus;
  /** Month it appeared, and — when it was true only for a while — the month it stopped. */
  since: string;
  until: string | null;
  statusAt: number;
  /** When the status changed (for spotting a belief that keeps flipping). */
  flips: number[];
  /** For a superseded belief: the one that replaced it. */
  by: string | null;
  /** A dangerous period: weekday 0 (Monday) … 6 and/or hours. */
  zone: { weekday: number | null; from: number | null; to: number | null } | null;
  /** A tip: the part of the day it is for. */
  when: TipTime | null;
  /** Entries it rests on (ids). */
  cites: string[];
  /** Votes counted before this version of the memory (kept as a starting point). */
  legacy: { support: number; against: number };
  /** The user's own answers to questions about it — the strongest evidence. */
  answers: { support: number; against: number };
  /** Experiments that tested it (tips): helped or did not. */
  trials: { helped: number; failed: number };
  history: { at: number; text: string; status: BeliefStatus }[];
}

/** A conclusion the coach once drew and later corrected. */
export interface Correction {
  at: number;
  was: string;
  now: string;
  why: string;
  /** Entries that showed it (ids). */
  refs: string[];
  beliefId: string | null;
}

/** One month of the user's story, in a sentence (the numbers are counted on the device). */
export interface Chapter {
  month: string;
  note: string;
}

/**
 * The long-term memory — the only thing ChatGPT "remembers". Every request gets the memory,
 * never the history; the deep analysis changes it by operations, so nothing is lost silently.
 */
export interface AiMemory {
  profile: string;
  /** The last overall conclusion — the next analysis builds on it. */
  conclusion: string;
  emotions: TitledNote[];
  strengths: string[];
  weaknesses: string[];
  /** How the habit changes over the long run. */
  changes: string[];
  improvements: string[];
  worsenings: string[];
  /** Dated important events. */
  events: { date: string; note: string }[];
  beliefs: Belief[];
  corrections: Correction[];
  chapters: Chapter[];
  openQuestions: string[];
  /** What the app did not apply from the last analysis, and why — the next one sees it. */
  rejected: string[];
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
  /** Long-term memory: chapters, revised conclusions, dated events, long-run changes, records. */
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
  /** The belief the answer tests (yes supports it, no contradicts it). */
  about: string | null;
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
  about: string | null;
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
  /** The tip it tests, if any — its result counts as evidence for that tip. */
  tipId: string | null;
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

/** How often first readings at each confidence turned out wrong when checked independently. */
export type Calibration = Record<"40" | "70" | "95", { checked: number; disputed: number }>;

export interface AiState {
  /** null — not asked yet; the user must allow sending entries to OpenAI first. */
  consent: boolean | null;
  entries: AiEntry[];
  memory: AiMemory | null;
  /** When the last deep analysis was made, and when the first one was (the memory's age). */
  deepAt: number | null;
  memorySince: number | null;
  deepCount: number;
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
  calibration: Calibration;
  /** Turning points in behavior whose entries the deep analysis already re-read. */
  pivotsSeen: string[];
  /** The language the memory's texts are written in; another app language translates them once. */
  memoryLanguage: LanguageCode | null;
}
