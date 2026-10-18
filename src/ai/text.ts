/**
 * Language-independent text helpers for comparing short texts on the device: a reading made
 * without the memory against the stored one, a new belief against the graveyard, a new entry
 * against past episodes. Word stems (first five letters of longer words) survive most
 * inflection in Russian well enough for "is this about the same".
 */

export const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

/** Content-word stems of a text. */
export function stems(value: string | null | undefined): Set<string> {
  if (!value) return new Set();
  return new Set(
    normalize(value)
      .split(" ")
      .filter((word) => word.length >= 4)
      .map((word) => word.slice(0, 5)),
  );
}

export function overlap(a: ReadonlySet<string>, b: ReadonlySet<string>) {
  let shared = 0;
  for (const item of a) if (b.has(item)) shared += 1;
  return shared;
}

export function jaccard(a: ReadonlySet<string>, b: ReadonlySet<string>) {
  const union = new Set([...a, ...b]).size;
  return union ? overlap(a, b) / union : 0;
}

/** Cuts a long text to its start and end, which carry most of what happened. */
export function clip(value: string, max = 450) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const head = Math.round(max * 0.7);
  return `${clean.slice(0, head).trim()} … ${clean.slice(-(max - head - 3)).trim()}`;
}
