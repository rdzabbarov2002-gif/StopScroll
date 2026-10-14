import { REPLACEMENTS, getTrigger } from "../utils/catalog";
import { MS_PER_HOUR } from "../utils/date";
import { isLocked } from "../utils/replacements";
import type { Replacement } from "../utils/types";
import { type History, slipSoonAfter, slipsWithin, winsWithin } from "./history";
import { TIME_FORMS, count } from "./language";
import { findTopReason } from "./patterns";

export interface ReplacementPick {
  replacement: Replacement;
  /** Why this one, from the records; null when there is nothing to go on yet. */
  why: string | null;
}

/** Per replacement: times it was done in the last four weeks with no slip in the three hours after. */
function helpedCounts(history: History): Map<string, number> {
  const counts = new Map<string, number>();
  for (const win of winsWithin(history, 28)) {
    if (win.replacementId && !slipSoonAfter(history, win.timestamp, 3 * MS_PER_HOUR)) {
      counts.set(win.replacementId, (counts.get(win.replacementId) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * The replacement of the day: one that already worked for the user, or one made for their main
 * reason. Without either, a short one that suits the time of day — and no made-up reason why.
 */
export function pickReplacement(
  history: History,
  isPro: boolean,
  exclude?: string,
): ReplacementPick {
  const reason = findTopReason(slipsWithin(history, 28));
  const evening = history.hour >= 20 || history.hour < 5;
  const candidates = REPLACEMENTS.filter((item) => !isLocked(item, isPro) && item.id !== exclude);
  const helpedBy = helpedCounts(history);

  let best: { item: Replacement; score: number; helped: number; matches: boolean } | null = null;
  for (const item of candidates) {
    const helped = helpedBy.get(item.id) ?? 0;
    const matches = reason !== null && item.triggers.includes(reason.trigger);
    const score = Math.min(helped, 3) * 1.5 + (matches ? 3 : 0);
    if (score > 0 && (!best || score > best.score)) best = { item, score, helped, matches };
  }

  if (best) {
    const why =
      best.helped >= 2
        ? `Уже ${count(best.helped, TIME_FORMS)} после неё обходилось без срывов.`
        : best.matches
          ? `Подходит, когда причина — ${getTrigger(reason!.trigger).noun}: у тебя так бывает чаще всего.`
          : "После неё в последний раз обошлось без срыва.";
    return { replacement: best.item, why };
  }

  const calm = evening
    ? candidates.find(
        (item) => item.triggers.includes("sleepless") || item.triggers.includes("relax"),
      )
    : undefined;
  return { replacement: calm ?? candidates[0]!, why: null };
}
