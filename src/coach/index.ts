/**
 * The personal coach. Every finding comes from deterministic analysis of the user's own records
 * (src/coach/patterns.ts); the coach only puts those facts into words. An optional server may
 * rephrase the words (src/services/coachVoice.ts) but never adds facts.
 */
export { ADVICE_RULES, type Advice } from "./advice";
export { DAYS_TO_LEARN, buildBriefing, type DailyBriefing } from "./briefing";
export { type CoachInput, buildHistory } from "./history";
export { tidy } from "./language";
export { type Insight, buildInsights } from "./insights";
export { type Reflection, buildReflection } from "./reflection";
export { type ReplacementPick, pickReplacement } from "./replacement";
export { type ReviewSection, buildWeeklyReview } from "./weeklyReview";
