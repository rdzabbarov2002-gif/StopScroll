import { CATEGORY_ICONS, REPLACEMENTS } from "./catalog";
import type { CustomReplacement, Replacement, TriggerId } from "./types";

export function customToReplacement(item: CustomReplacement): Replacement {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    steps: item.description ? [item.description] : [],
    minutes: item.minutes,
    category: item.category,
    icon: CATEGORY_ICONS[item.category],
    triggers: [],
    custom: true,
  };
}

/** Built-in catalog followed by the user's own replacements. */
export function getAllReplacements(custom: readonly CustomReplacement[]): Replacement[] {
  return [...REPLACEMENTS, ...custom.map(customToReplacement)];
}

export function findReplacement(
  id: string,
  custom: readonly CustomReplacement[],
): Replacement | undefined {
  const builtIn = REPLACEMENTS.find((item) => item.id === id);
  if (builtIn) return builtIn;
  const own = custom.find((item) => item.id === id);
  return own ? customToReplacement(own) : undefined;
}

export const isLocked = (item: Replacement, isPro: boolean) => Boolean(item.premium) && !isPro;

/**
 * Up to `count` replacements for a state: matching ones first, unlocked before locked,
 * then the rest of the free catalog so the list is never empty.
 */
export function suggestReplacements(
  trigger: TriggerId | undefined,
  isPro: boolean,
  count = 3,
): Replacement[] {
  const score = (item: Replacement) =>
    (trigger && item.triggers.includes(trigger) ? 2 : 0) + (isLocked(item, isPro) ? 0 : 1);
  return REPLACEMENTS.map((item, index) => ({ item, index }))
    .sort((a, b) => score(b.item) - score(a.item) || a.index - b.index)
    .slice(0, count)
    .map(({ item }) => item);
}
