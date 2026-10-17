import { addDays, dayKey, parseDayKey } from "../utils/date";
import { DAY_MS, type Timeline, pivots } from "./facts";
import { footprint, isActive, strength, votesByBelief, weight } from "./evidence";
import { overlap, stems } from "./text";
import type { AiEntry, AiState, Calibration, EntryAnalysis, EntryReading } from "./types";

/**
 * Which original entries to read again before a deep analysis — the fix for "the first reading
 * lives forever". Few, and only where a second look can change the picture:
 *
 * - uncertain: the first reading was a guess, or said information was missing;
 * - decisive: entries a still-open belief depends on (and, for a new belief, older entries that
 *   look like it but were written before it existed);
 * - counter: an entry that contradicts the belief the memory leans on most;
 * - anchor: what the strongest belief rests on, checked again after a while;
 * - control: an ordinary confident reading, every other analysis, to learn how often
 *   "confident" is actually right;
 * - pivot: the entries right before a turning point in behavior (sent to the deep analysis itself).
 *
 * All but the pivot are first read again by the light model WITHOUT the memory. If that reading
 * agrees, the entry's reading is confirmed independently and nothing more is spent; if it
 * disagrees, the deep analysis gets the original text and both readings and decides.
 */

/** Entries checked without the memory before one deep analysis. */
export const MAX_BLIND = 6;
/** Texts this short are already their own gist: nothing to gain from reading them again. */
const MIN_TEXT = 30;
const COOLDOWN_DAYS = 60;
const ANCHOR_RECHECK_DAYS = 90;
export const MAX_READS = 3;

export type ReviewReason = "uncertain" | "decisive" | "counter" | "anchor" | "control" | "pivot";

export interface ReviewPlan {
  blind: { entry: AiEntry; reason: ReviewReason }[];
  pivot: { entry: AiEntry; key: string } | null;
}

export const bucketOf = (conf: number): keyof Calibration =>
  conf <= 50 ? "40" : conf <= 80 ? "70" : "95";

/** How often a reading at this confidence holds up, once there is enough data to tell. */
export function effectiveConfidence(conf: number, calibration: Calibration) {
  const bucket = calibration[bucketOf(conf)];
  if (bucket.checked < 8) return conf / 100;
  return 1 - (bucket.disputed + 1) / (bucket.checked + 2);
}

const readable = (entry: AiEntry, now: number) =>
  entry.reading !== null &&
  entry.reading.check !== "disputed" &&
  entry.text.trim().length >= MIN_TEXT &&
  entry.reads < MAX_READS &&
  !entry.contested &&
  (entry.readAt === null || now - entry.readAt >= COOLDOWN_DAYS * DAY_MS);

/** A stable pseudo-random pick: the same data gives the same choice. */
function pick<T extends { id: string }>(list: readonly T[], seed: number): T | undefined {
  if (!list.length) return undefined;
  let hash = 2166136261 ^ seed;
  for (const item of list)
    for (const char of item.id) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return list[Math.abs(hash) % list.length];
}

export function planReview(state: AiState, t: Timeline, now: number): ReviewPlan {
  const memory = state.memory;
  const pool = state.entries.filter((entry) => readable(entry, now));
  const chosen = new Map<string, ReviewReason>();
  const take = (entry: AiEntry | undefined, reason: ReviewReason) => {
    if (entry && !chosen.has(entry.id) && chosen.size < MAX_BLIND) chosen.set(entry.id, reason);
  };
  const inPool = new Set(pool.map((entry) => entry.id));
  const available = (list: readonly AiEntry[]) =>
    list.filter((entry) => inPool.has(entry.id) && !chosen.has(entry.id));

  const votes = votesByBelief(state.entries);
  const active = (memory?.beliefs ?? []).filter(isActive);
  const ranked = active
    .map((belief) => {
      const s = strength(belief, votes.get(belief.id), footprint(belief, t));
      return { belief, s, weight: weight(belief, s) };
    })
    .sort((a, b) => b.weight - a.weight);
  const strongest = ranked.find(
    (item) => item.belief.status === "established" || item.belief.status === "supported",
  );

  // Counter-example first: the surest way to stop the memory from only confirming itself.
  if (strongest) {
    const against = available(votes.get(strongest.belief.id)?.opponents ?? []).filter(
      (entry) => entry.reading!.check === "none",
    );
    take(against.sort((a, b) => b.timestamp - a.timestamp)[0], "counter");
  }

  // Uncertain first readings (by calibrated confidence once there is enough data).
  const uncertain = available(pool)
    .filter(
      (entry) =>
        entry.analysis?.enough === false ||
        effectiveConfidence(entry.reading!.conf, state.calibration) <= 0.5,
    )
    .sort((a, b) => a.reading!.conf - b.reading!.conf || b.text.length - a.text.length);
  uncertain.slice(0, 2).forEach((entry) => take(entry, "uncertain"));

  // Entries an open belief depends on.
  let decisive = 0;
  for (const item of ranked) {
    if (decisive >= 2) break;
    const v = votes.get(item.belief.id);
    const open =
      item.belief.status === "weakened" ||
      item.belief.status === "supported" ||
      (item.belief.status === "proposed" && (v?.support ?? 0) + (v?.against ?? 0) >= 3);
    if (!open || !v) continue;
    const candidate = available([...v.supporters, ...v.opponents]).filter(
      (entry) => entry.reading!.check === "none",
    )[0];
    if (candidate) {
      take(candidate, "decisive");
      decisive += 1;
    }
  }
  // A belief born lately has never seen the entries written before it.
  const newest = active
    .filter((belief) => belief.statusAt > now - 30 * DAY_MS && belief.kind !== "zone")
    .sort((a, b) => b.statusAt - a.statusAt)[0];
  if (newest && decisive < 2) {
    const words = stems(`${newest.text} ${newest.note}`);
    const retro = available(pool)
      .filter(
        (entry) =>
          entry.timestamp < newest.statusAt &&
          !entry.reading!.votes.some((vote) => vote.id === newest.id) &&
          overlap(words, stems(`${entry.text} ${entry.reading!.cause ?? ""}`)) >= 2,
      )
      .sort((a, b) => b.timestamp - a.timestamp);
    take(retro[0], "decisive");
  }

  // The foundation of the strongest belief, after a while.
  if (strongest) {
    const cites = new Set(strongest.belief.cites);
    const base = available([
      ...state.entries.filter((entry) => cites.has(entry.id)),
      ...(votes.get(strongest.belief.id)?.supporters ?? []),
    ]).filter(
      (entry) => entry.readAt === null || now - entry.readAt >= ANCHOR_RECHECK_DAYS * DAY_MS,
    );
    take(base[0], "anchor");
  }

  // Control: a confident, ordinary reading — the only honest way to learn what "confident" is worth.
  if (state.deepCount % 2 === 1) {
    const confident = available(pool).filter(
      (entry) => entry.reading!.conf >= 90 && now - entry.timestamp >= 30 * DAY_MS,
    );
    take(pick(confident, state.deepCount), "control");
  }

  // A turning point not yet examined: the longest entry written in the three days before it.
  let pivot: ReviewPlan["pivot"] = null;
  for (const turn of pivots(t)) {
    if (state.pivotsSeen.includes(turn.key)) continue;
    const end = parseDayKey(addDays(turn.day, 1)).getTime();
    const start = parseDayKey(addDays(turn.day, -3)).getTime();
    const near = pool
      .filter((entry) => entry.timestamp >= start && entry.timestamp < end && !chosen.has(entry.id))
      .sort((a, b) => b.text.length - a.text.length)[0];
    if (near) {
      pivot = { entry: near, key: turn.key };
      break;
    }
  }

  return {
    blind: [...chosen.entries()].map(([id, reason]) => ({
      entry: state.entries.find((entry) => entry.id === id)!,
      reason,
    })),
    pivot,
  };
}

/** Readings waiting for the deep analysis: the memory-free one disagreed. */
export const disputed = (state: AiState) =>
  state.entries.filter((entry) => entry.reading?.check === "disputed" && entry.blind !== null);

/**
 * Do two readings say the same? Structurally, on the device: the same tag, or a shared word in
 * the cause — or both say there isn't enough to tell.
 */
export function sameReading(
  reading: EntryReading,
  analysis: EntryAnalysis | null,
  blind: { cause: string | null; tags: string[]; enough: boolean },
) {
  if (analysis?.enough === false && !blind.enough) return true;
  const tags = new Set(reading.tags.map((tag) => tag.toLowerCase()));
  if (blind.tags.some((tag) => tags.has(tag.toLowerCase()))) return true;
  return overlap(stems(reading.cause), stems(blind.cause)) > 0;
}

/** For the model: a "base rate" line next to a re-read entry, so one vivid text isn't taken as typical. */
export function baseRate(entry: AiEntry, all: readonly AiEntry[]) {
  const tags = new Set(entry.reading?.tags ?? []);
  if (!tags.size) return null;
  const same = all.filter(
    (other) => other.id !== entry.id && (other.reading?.tags ?? []).some((tag) => tags.has(tag)),
  );
  if (same.length < 3) return null;
  const opened = same.filter((other) => other.outcome === "opened").length;
  return `same tags: ${same.length} entries, feed opened in ${opened}`;
}

export const dayOf = (timestamp: number) => dayKey(timestamp);
