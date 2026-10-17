import { m } from "../i18n";
import { getTrigger } from "../utils/catalog";
import { MS_PER_DAY } from "../utils/date";
import { isLocked, suggestReplacements } from "../utils/replacements";
import type { SlipEntry, TriggerId } from "../utils/types";
import { hourOf, isLate } from "./history";
import { variant } from "./language";

/** What the coach says after the user answers "Что произошло?". */
export interface Reflection {
  text: string;
  /** A replacement for the next time this happens. */
  replacementId?: string;
}

/**
 * A short, calm answer: understanding without blame, what the history says about this reason
 * (only real counts), and one small step for next time.
 */
export function buildReflection(
  slip: SlipEntry,
  trigger: TriggerId,
  slips: readonly SlipEntry[],
  isPro: boolean,
  note = "",
): Reflection {
  const twoWeeks = slips.filter(
    (entry) =>
      entry.timestamp > slip.timestamp - 14 * MS_PER_DAY &&
      entry.timestamp <= slip.timestamp &&
      (entry.id === slip.id ? trigger : entry.trigger) === trigger,
  ).length;
  const t = m().coach.reflection;
  const cause = getTrigger(trigger);
  const late = isLate(hourOf(slip.timestamp), 21);

  let pattern: string;
  if (trigger === "other") {
    pattern = note.trim() ? t.thanksForNote : t.noted;
  } else if (twoWeeks >= 3) {
    pattern = t.repeated(twoWeeks, cause);
  } else if (twoWeeks === 2) {
    pattern = t.twice;
  } else {
    pattern = t.first;
  }

  const sentences = [t.understanding[trigger], pattern];
  if (late && (trigger === "fatigue" || trigger === "sleepless")) {
    sentences.push(t.lateEvening(cause));
  }
  if (!(trigger === "other" && note.trim())) sentences.push(t.nextTime[trigger]);
  sentences.push(variant(`${slip.id}:close`, t.close));

  // Late in the evening a calm replacement fits better than squats or a walk.
  const matching = suggestReplacements(trigger, isPro, 8).filter(
    (item) => !isLocked(item, isPro) && item.triggers.includes(trigger),
  );
  const calm = (item: (typeof matching)[number]) =>
    item.triggers.includes("relax") || item.triggers.includes("sleepless");
  const replacement = (late ? matching.find(calm) : undefined) ?? matching[0];
  return {
    text: sentences.join(" "),
    ...(replacement ? { replacementId: replacement.id } : {}),
  };
}
