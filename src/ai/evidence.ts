import { addDays } from "../utils/date";
import { DAY_MS, type Timeline, hourOf, isObserved, lossTimes } from "./facts";
import { stems, overlap } from "./text";
import type { AiEntry, Belief, BeliefStatus, EntryReading } from "./types";

/**
 * How much the memory's beliefs are actually supported, counted on the device.
 *
 * The first reading of every entry is made by a light model that sees the memory, so its votes
 * echo what the memory already thinks: they are weak evidence. Strong ("independent") evidence
 * is what that loop can't produce by itself — a vote from a reading confirmed without the memory
 * or re-read from the original by the deep analysis, the user's own answer, the outcome of an
 * experiment, and arithmetic over the records (a dangerous period is only real if hard days
 * really cluster in it).
 */

export const ACTIVE: readonly BeliefStatus[] = ["proposed", "supported", "established", "weakened"];

export const isActive = (belief: Belief) => ACTIVE.includes(belief.status) && belief.until === null;

/** Confirmed independently: a memory-free reading agreed, or the deep analysis read the original. */
export const isVerified = (reading: EntryReading) =>
  reading.check === "agreed" || reading.check === "settled" || reading.by === "deep";

export interface Votes {
  support: number;
  against: number;
  verifiedSupport: number;
  verifiedAgainst: number;
  /** Entries that voted, for picking what to re-read. */
  supporters: AiEntry[];
  opponents: AiEntry[];
}

const empty = (): Votes => ({
  support: 0,
  against: 0,
  verifiedSupport: 0,
  verifiedAgainst: 0,
  supporters: [],
  opponents: [],
});

/** Votes per belief, from the current reading of every entry (so a revised reading counts anew). */
export function votesByBelief(entries: readonly AiEntry[]): Map<string, Votes> {
  const result = new Map<string, Votes>();
  for (const entry of entries) {
    const reading = entry.reading;
    if (!reading) continue;
    const weight = entry.contested ? 0.5 : 1;
    for (const vote of reading.votes) {
      const item = result.get(vote.id) ?? empty();
      const verified = isVerified(reading);
      if (vote.effect === "support") {
        item.support += weight;
        if (verified) item.verifiedSupport += weight;
        item.supporters.push(entry);
      } else {
        item.against += weight;
        if (verified) item.verifiedAgainst += weight;
        item.opponents.push(entry);
      }
      result.set(vote.id, item);
    }
  }
  return result;
}

export interface Footprint {
  /** "strong" — the records back it; "failing" — enough data and they don't. */
  verdict: "strong" | "failing" | null;
  /** A short model-facing summary: "lift 2.1 over 23 days". */
  summary: string | null;
}

/**
 * The records' own test of a belief. A dangerous period: are hard moments really more likely
 * inside it (lift)? A trigger: does it actually show up in the entries of the last 90 days?
 */
export function footprint(belief: Belief, t: Timeline): Footprint {
  if (belief.kind === "zone" && belief.zone) {
    const { weekday, from, to } = belief.zone;
    const since = addDays(t.today, -56);
    const days = t.past.filter((day) => day.key >= since && isObserved(day));
    const inHours = (hour: number) =>
      from === null || to === null
        ? true
        : from <= to
          ? hour >= from && hour < to
          : hour >= from || hour < to;
    const matches = (weekdayIndex: number) => weekday === null || weekdayIndex === weekday;
    const hard = (list: typeof days, inside: boolean) =>
      list.filter((day) =>
        lossTimes(day).some((timestamp) =>
          inside ? inHours(hourOf(timestamp)) : !inHours(hourOf(timestamp)),
        ),
      ).length;
    const inside = days.filter((day) => matches(day.weekday));
    const outside = weekday === null ? days : days.filter((day) => !matches(day.weekday));
    if (inside.length < 6 || outside.length < 6) return { verdict: null, summary: null };
    const rateIn = hard(inside, true) / inside.length;
    const rateOut =
      (weekday === null ? hard(outside, false) : hard(outside, true)) / outside.length;
    const lift = rateIn / Math.max(rateOut, 0.05);
    const summary = `lift ${lift.toFixed(1)} over ${inside.length} days`;
    if (lift >= 1.3 && inside.length >= 8) return { verdict: "strong", summary };
    if (lift < 1.05 && inside.length >= 10) return { verdict: "failing", summary };
    return { verdict: null, summary };
  }
  if (belief.kind === "trigger") {
    const since = t.now - 90 * DAY_MS;
    const words = stems(belief.text);
    const recent = t.input.entries.filter((entry) => entry.reading && entry.timestamp >= since);
    if (recent.length < 10 || !words.size) return { verdict: null, summary: null };
    const hits = recent.filter((entry) => {
      const reading = entry.reading!;
      return overlap(words, stems([reading.cause ?? "", ...reading.tags].join(" "))) > 0;
    }).length;
    const share = hits / recent.length;
    const summary = `in ${hits} of ${recent.length} entries (90d)`;
    if (share >= 0.15) return { verdict: "strong", summary };
    if (share < 0.03 && recent.length >= 30) return { verdict: "failing", summary };
    return { verdict: null, summary };
  }
  return { verdict: null, summary: null };
}

export interface Strength {
  /** Evidence the memory can't have produced by itself. */
  independentSupport: number;
  independentAgainst: number;
  /** All votes, weak ones included, plus the votes counted before this version. */
  support: number;
  against: number;
}

export function strength(belief: Belief, votes: Votes | undefined, print: Footprint): Strength {
  const v = votes ?? empty();
  return {
    independentSupport:
      v.verifiedSupport +
      belief.answers.support * 2 +
      belief.trials.helped +
      (print.verdict === "strong" ? 1 : 0),
    independentAgainst:
      v.verifiedAgainst +
      belief.answers.against * 2 +
      belief.trials.failed +
      (print.verdict === "failing" ? 1 : 0),
    support: v.support + belief.legacy.support,
    against: v.against + belief.legacy.against,
  };
}

/** For picking the belief the memory leans on most. */
export const weight = (belief: Belief, s: Strength) =>
  (belief.status === "established" ? 100 : belief.status === "supported" ? 50 : 0) +
  s.independentSupport * 3 +
  s.support;
