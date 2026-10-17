import type { Timeline } from "./facts";
import { footprint, isActive, isVerified, strength, votesByBelief } from "./evidence";
import {
  KINDS,
  integer,
  isRecord,
  list,
  newBelief,
  nextId,
  oneOf,
  parseVotes,
  text,
  texts,
  titled,
  confidence,
} from "./parse";
import { jaccard, overlap, stems } from "./text";
import type {
  AiEntry,
  AiMemory,
  AiState,
  Belief,
  BeliefKind,
  BeliefStatus,
  Correction,
  EntryReading,
  TipTime,
} from "./types";

/**
 * Applies a deep analysis to the memory. The model proposes; the app only controls the pace:
 *
 * - The memory is changed by operations on beliefs with ids. Anything not mentioned stays —
 *   nothing is lost silently.
 * - A belief becomes supported or established, or is weakened or dropped, only with evidence the
 *   memory can't have produced by itself (a reading confirmed independently, the user's answer,
 *   an experiment, the records' own arithmetic). Votes of the light model that sees the memory
 *   are not enough on their own.
 * - A better explanation replaces the old one as a new belief that earns its own evidence; the
 *   old one is kept as superseded and the change is written down as the coach's own mistake.
 * - Strong beliefs are dropped in two steps; one that keeps flipping is frozen; what resembles a
 *   refuted belief needs new evidence; every refusal is reported back to the next analysis.
 * - A re-read entry gets a new reading only from the original text; flipping back to an earlier
 *   reading marks it contested (never re-read again).
 */

const PREFIX: Record<BeliefKind, string> = { hypothesis: "h", trigger: "t", zone: "z", tip: "p" };
/** Active beliefs per kind — the same as the places on the screen. */
const ACTIVE_LIMIT: Record<BeliefKind, number> = { hypothesis: 6, trigger: 5, zone: 4, tip: 4 };
const MAX_ADDS = 4;
const MAX_DROPS = 3;
const DAY = 86_400_000;
const TIP_TIMES: readonly TipTime[] = ["morning", "day", "evening", "night", "any"];
const OPS = ["add", "update", "confirm", "weaken", "retire", "supersede", "scope"] as const;

export interface ReadingUpdate {
  id: string;
  reading: EntryReading;
  past: EntryReading[];
  contested: boolean;
}

export interface DeepResult {
  memory: AiMemory;
  readings: ReadingUpdate[];
  rejected: string[];
}

export interface DeepContext {
  /** Short refs used in the request ("r3") → entry ids. */
  refs: ReadonlyMap<string, string>;
  /** Refs of the entries whose original text was sent. */
  reread: ReadonlySet<string>;
  now: number;
  /** The current month, YYYY-MM. */
  month: string;
  timeline: Timeline;
}

const emptyMemory = (): AiMemory => ({
  profile: "",
  conclusion: "",
  emotions: [],
  strengths: [],
  weaknesses: [],
  changes: [],
  improvements: [],
  worsenings: [],
  events: [],
  beliefs: [],
  corrections: [],
  chapters: [],
  openQuestions: [],
  rejected: [],
});

/** null — "unchanged"; an array — the new section. */
function section<T>(value: unknown, parse: (value: unknown) => T[]): T[] | null {
  return Array.isArray(value) ? parse(value) : null;
}

/** Re-readings: a new understanding only from the original text, never a flip back. */
function applyRereads(
  raw: unknown,
  entries: readonly AiEntry[],
  ctx: DeepContext,
  activeIds: ReadonlySet<string>,
): ReadingUpdate[] {
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const updates: ReadingUpdate[] = [];
  for (const item of Array.isArray(raw) ? raw.slice(0, 8) : []) {
    if (!isRecord(item)) continue;
    const ref = text(item.ref, 12);
    const id = ref && ctx.reread.has(ref) ? ctx.refs.get(ref) : undefined;
    const entry = id ? byId.get(id) : undefined;
    if (!entry?.reading || updates.some((update) => update.id === entry.id)) continue;
    const current = entry.reading;
    const conf = confidence(item.conf, current.conf);
    if (item.verdict !== "revise") {
      updates.push({
        id: entry.id,
        reading: { ...current, conf: Math.max(current.conf, conf), check: "settled" },
        past: entry.past,
        contested: entry.contested,
      });
      continue;
    }
    const cause = text(item.cause, 120);
    const tags = texts(item.tags, 3, 40).map((tag) => tag.toLowerCase());
    const next: EntryReading = {
      cause,
      tags: tags.length ? tags : current.tags,
      gist: text(item.gist, 160) ?? current.gist,
      conf,
      votes: parseVotes(item.votes, 4).filter((vote) => activeIds.has(vote.id)),
      by: "deep",
      at: ctx.now,
      check: "settled",
    };
    // A→B→A: going back to a reading it already left — the entry is ambiguous, keep B.
    const back = entry.past.some(
      (old) =>
        overlap(stems(old.cause), stems(cause)) > 0 &&
        overlap(stems(current.cause), stems(cause)) === 0,
    );
    updates.push(
      back
        ? {
            id: entry.id,
            reading: { ...current, conf: 50, check: "settled" },
            past: entry.past,
            contested: true,
          }
        : {
            id: entry.id,
            reading: next,
            past: [current, ...entry.past].slice(0, 2),
            contested: false,
          },
    );
  }
  return updates;
}

export function applyDeep(state: AiState, raw: unknown, ctx: DeepContext): DeepResult | null {
  if (!isRecord(raw)) return null;
  const profile = text(raw.profile, 800);
  const conclusion = text(raw.conclusion, 800);
  const previous = state.memory ?? emptyMemory();
  if (!profile && !conclusion && !previous.profile) return null;

  const activeIds = new Set(previous.beliefs.filter(isActive).map((belief) => belief.id));
  const readings = applyRereads(raw.rereads, state.entries, ctx, activeIds);
  const revised = new Map(readings.map((update) => [update.id, update]));
  const entries = state.entries.map((entry) => {
    const update = revised.get(entry.id);
    return update
      ? { ...entry, reading: update.reading, past: update.past, contested: update.contested }
      : entry;
  });
  const verified = new Set(
    entries.filter((entry) => entry.reading && isVerified(entry.reading)).map((entry) => entry.id),
  );
  const votes = votesByBelief(entries);

  const beliefs = previous.beliefs.map((belief) => ({ ...belief }));
  const find = (id: string | null) => (id ? beliefs.find((belief) => belief.id === id) : undefined);
  const corrections: Correction[] = [...previous.corrections];
  const rejected: string[] = [];
  const refuse = (op: string, id: string | null, why: string) => {
    if (rejected.length < 3) rejected.push(`${op}${id ? ` ${id}` : ""}: ${why}`);
  };
  const strengthOf = (belief: Belief) =>
    strength(belief, votes.get(belief.id), footprint(belief, ctx.timeline));
  const setStatus = (belief: Belief, status: BeliefStatus) => {
    belief.history = [
      { at: ctx.now, text: belief.text, status: belief.status },
      ...belief.history,
    ].slice(0, 4);
    belief.status = status;
    belief.statusAt = ctx.now;
    belief.flips = [...belief.flips, ctx.now].slice(-6);
  };
  const flipping = (belief: Belief) =>
    belief.flips.filter((at) => ctx.now - at < 60 * DAY).length >= 3;
  const cites = (value: unknown) =>
    texts(value, 4, 12)
      .map((ref) => ctx.refs.get(ref))
      .filter((id): id is string => Boolean(id));
  const activeOf = (kind: BeliefKind) =>
    beliefs.filter((belief) => belief.kind === kind && isActive(belief)).length;

  let adds = 0;
  let drops = 0;
  for (const op of Array.isArray(raw.beliefs) ? raw.beliefs.slice(0, 12) : []) {
    if (!isRecord(op)) continue;
    const kind = oneOf(op.op, OPS);
    if (!kind) continue;
    const id = text(op.id, 20);
    const belief = find(id);
    const why = text(op.why, 200) ?? "";
    const statement = text(op.text, 300);
    const note = text(op.note, 300);
    const cited = cites(op.cites);
    // Every field is always present in the answer (null when unused): a zone is given only by
    // a weekday or an hour.
    const weekday = integer(op.weekday, 0, 6);
    const from = integer(op.from, 0, 23);
    const zone =
      weekday !== null || from !== null
        ? { weekday, from, to: from === null ? null : integer(op.to, 0, 23) }
        : null;
    const when = oneOf(op.when, TIP_TIMES);

    if (kind === "add" || kind === "supersede") {
      const beliefKind = oneOf(op.kind, KINDS) ?? belief?.kind ?? null;
      if (!statement || !beliefKind) {
        refuse(kind, id, "text and kind are required");
        continue;
      }
      if (kind === "add" && adds >= MAX_ADDS) {
        refuse(kind, null, "too many new beliefs in one analysis");
        continue;
      }
      if (kind === "supersede") {
        if (!belief || !isActive(belief)) {
          refuse(kind, id, "no such active belief");
          continue;
        }
        if (drops >= MAX_DROPS) {
          refuse(kind, id, "too many beliefs dropped in one analysis");
          continue;
        }
        const s = strengthOf(belief);
        if (
          belief.status !== "proposed" &&
          s.independentAgainst < 1 &&
          !cited.some((ref) => verified.has(ref))
        ) {
          refuse(
            kind,
            id,
            "needs independent evidence against it or a verified entry for the replacement",
          );
          continue;
        }
      } else if (activeOf(beliefKind) >= ACTIVE_LIMIT[beliefKind]) {
        refuse(
          kind,
          null,
          `already ${ACTIVE_LIMIT[beliefKind]} active ${beliefKind}s — weaken, retire or supersede one`,
        );
        continue;
      }
      // A refuted belief coming back needs new, verified evidence and some time.
      const words = stems(statement);
      const ghost = beliefs.find(
        (old) =>
          (old.status === "retired" || old.status === "superseded") &&
          old.kind === beliefKind &&
          old.id !== belief?.id &&
          jaccard(words, stems(old.text)) >= 0.55,
      );
      if (
        ghost &&
        (ctx.now - ghost.statusAt < 30 * DAY || !cited.some((ref) => verified.has(ref)))
      ) {
        refuse(
          kind,
          id,
          `too close to ${ghost.status} ${ghost.id}; needs a verified entry and 30 days`,
        );
        continue;
      }
      const created = newBelief(
        nextId(beliefs, PREFIX[beliefKind]),
        beliefKind,
        statement,
        note ?? "",
        "proposed",
        {
          since: ctx.month,
          statusAt: ctx.now,
          zone: beliefKind === "zone" ? zone : null,
          when: beliefKind === "tip" ? (when ?? "any") : null,
          cites: cited,
        },
      );
      beliefs.push(created);
      if (kind === "add") adds += 1;
      else {
        setStatus(belief!, "superseded");
        belief!.by = created.id;
        drops += 1;
        corrections.push({
          at: ctx.now,
          was: belief!.text,
          now: statement,
          why,
          refs: cited,
          beliefId: belief!.id,
        });
      }
      continue;
    }

    if (!belief) {
      refuse(kind, id, "no such belief");
      continue;
    }
    if (kind === "update") {
      if (statement && jaccard(stems(statement), stems(belief.text)) < 0.3) {
        refuse(kind, id, "the meaning changed — use supersede");
        continue;
      }
      if (statement && statement !== belief.text) {
        belief.history = [
          { at: ctx.now, text: belief.text, status: belief.status },
          ...belief.history,
        ].slice(0, 4);
        belief.text = statement;
      }
      if (note) belief.note = note;
      if (belief.kind === "zone" && zone) belief.zone = zone;
      if (belief.kind === "tip" && when) belief.when = when;
      belief.cites = [...new Set([...cited, ...belief.cites])].slice(0, 4);
      continue;
    }
    if (kind === "scope") {
      const until =
        typeof op.until === "string" && /^\d{4}-\d{2}$/.test(op.until) && op.until <= ctx.month
          ? op.until
          : null;
      if (!until) {
        refuse(kind, id, "until must be a past or current month, YYYY-MM");
        continue;
      }
      belief.until = until;
      belief.history = [
        { at: ctx.now, text: belief.text, status: belief.status },
        ...belief.history,
      ].slice(0, 4);
      continue;
    }

    // Status changes: confirm, weaken, retire.
    if (!isActive(belief)) {
      refuse(kind, id, `it is ${belief.status}`);
      continue;
    }
    const s = strengthOf(belief);
    if (flipping(belief) && belief.answers.support + belief.answers.against === 0) {
      refuse(kind, id, "status keeps changing; frozen until the user's answers decide");
      continue;
    }
    if (kind === "confirm") {
      if (belief.status === "proposed") {
        if (s.support >= 3 && s.support >= 2 * s.against && s.independentSupport >= 1)
          setStatus(belief, "supported");
        else
          refuse(
            kind,
            id,
            "needs 3+ supporting entries, twice the contrary, and one independent confirmation",
          );
      } else if (belief.status === "supported") {
        if (
          ctx.now - belief.statusAt >= 21 * DAY &&
          s.independentSupport >= 2 &&
          s.independentAgainst * 3 < s.independentSupport
        ) {
          setStatus(belief, "established");
        } else
          refuse(
            kind,
            id,
            "established needs 21 days as supported and 2+ independent confirmations",
          );
      } else if (belief.status === "weakened") {
        if (s.independentSupport >= 1 && s.independentSupport > s.independentAgainst)
          setStatus(belief, "supported");
        else refuse(kind, id, "needs independent evidence for it");
      }
      continue;
    }
    if (kind === "weaken") {
      if (belief.status === "weakened") continue;
      if (
        belief.status === "proposed" ||
        s.independentAgainst >= 1 ||
        s.against >= Math.max(3, s.support)
      ) {
        setStatus(belief, "weakened");
      } else refuse(kind, id, "needs independent evidence against it");
      continue;
    }
    if (kind === "retire") {
      if (drops >= MAX_DROPS) {
        refuse(kind, id, "too many beliefs dropped in one analysis");
        continue;
      }
      const answered = belief.answers.against > belief.answers.support;
      const strong = belief.status === "supported" || belief.status === "established";
      if (strong && !answered) {
        // Two steps for a strong belief: weakened now, dropped later if still not supported.
        if (s.independentAgainst >= 1) setStatus(belief, "weakened");
        else refuse(kind, id, "a supported belief is first weakened, with independent evidence");
        continue;
      }
      if (belief.status === "weakened" && !answered && ctx.now - belief.statusAt < 5 * DAY) {
        refuse(kind, id, "weakened less than 5 days ago");
        continue;
      }
      const was = belief.status;
      setStatus(belief, "retired");
      drops += 1;
      // Dropping a mere proposal is routine; dropping something it believed is a mistake to remember.
      if (was !== "proposed" && why) {
        corrections.push({
          at: ctx.now,
          was: belief.text,
          now: why,
          why,
          refs: cited,
          beliefId: belief.id,
        });
      }
    }
  }

  // Corrections the model wrote itself ("I thought X — now it's clear it's Y").
  for (const item of list(raw.corrections, 2, (value) => {
    if (!isRecord(value)) return null;
    const was = text(value.was, 200);
    const now = text(value.now, 200);
    return was && now
      ? { was, now, why: text(value.why, 300) ?? "", refs: cites(value.refs) }
      : null;
  })) {
    if (!corrections.some((old) => old.was === item.was && old.now === item.now)) {
      corrections.push({ at: ctx.now, ...item, beliefId: null });
    }
  }

  // Historical beliefs are kept, the oldest compressed away first; active ones are never dropped.
  const historical = beliefs
    .filter((belief) => !isActive(belief))
    .sort((a, b) => b.statusAt - a.statusAt);
  const keep = new Set(
    [...beliefs.filter(isActive), ...historical.slice(0, 60)].map((belief) => belief.id),
  );

  const chapter = isRecord(raw.chapter) ? raw.chapter : null;
  const chapters = [...previous.chapters];
  if (chapter && typeof chapter.month === "string" && /^\d{4}-\d{2}$/.test(chapter.month)) {
    const noteText = text(chapter.note, 240);
    if (noteText) {
      const index = chapters.findIndex((item) => item.month === chapter.month);
      if (index >= 0) chapters[index] = { month: chapter.month, note: noteText };
      else chapters.push({ month: chapter.month, note: noteText });
      chapters.sort((a, b) => (a.month < b.month ? -1 : 1));
    }
  }

  const events = [...previous.events];
  for (const event of list(raw.events, 3, (value) => {
    if (!isRecord(value)) return null;
    const date = text(value.date, 40);
    const noteText = text(value.note, 300);
    return date && noteText ? { date, note: noteText } : null;
  })) {
    if (
      !events.some(
        (old) => old.date === event.date && old.note.slice(0, 30) === event.note.slice(0, 30),
      )
    ) {
      events.push(event);
    }
  }

  const memory: AiMemory = {
    profile: profile ?? previous.profile,
    conclusion: conclusion ?? previous.conclusion,
    emotions: section(raw.emotions, (value) => list(value, 4, titled)) ?? previous.emotions,
    strengths: section(raw.strengths, (value) => texts(value, 3, 300)) ?? previous.strengths,
    weaknesses: section(raw.weaknesses, (value) => texts(value, 3, 300)) ?? previous.weaknesses,
    changes: section(raw.changes, (value) => texts(value, 4)) ?? previous.changes,
    improvements: section(raw.improvements, (value) => texts(value, 3)) ?? previous.improvements,
    worsenings: section(raw.worsenings, (value) => texts(value, 3)) ?? previous.worsenings,
    events: events.slice(-24),
    beliefs: beliefs.filter((belief) => keep.has(belief.id)),
    corrections: corrections.slice(-60),
    chapters: chapters.slice(-48),
    openQuestions: Array.isArray(raw.openQuestions)
      ? texts(raw.openQuestions, 3, 200)
      : previous.openQuestions,
    rejected,
  };
  return { memory, readings, rejected };
}

/** The user's answer to a yes/no question about a belief: the strongest evidence there is. */
export function applyAnswer(
  memory: AiMemory | null,
  about: string | null,
  yes: boolean,
): AiMemory | null {
  if (!memory || !about) return memory;
  return {
    ...memory,
    beliefs: memory.beliefs.map((belief) =>
      belief.id === about
        ? {
            ...belief,
            answers: {
              support: belief.answers.support + (yes ? 1 : 0),
              against: belief.answers.against + (yes ? 0 : 1),
            },
          }
        : belief,
    ),
  };
}

/** An experiment that tested a tip: did it help? */
export function applyTrial(
  memory: AiMemory | null,
  tipId: string | null,
  helped: boolean | null,
): AiMemory | null {
  if (!memory || !tipId || helped === null) return memory;
  return {
    ...memory,
    beliefs: memory.beliefs.map((belief) =>
      belief.id === tipId
        ? {
            ...belief,
            trials: {
              helped: belief.trials.helped + (helped ? 1 : 0),
              failed: belief.trials.failed + (helped ? 0 : 1),
            },
          }
        : belief,
    ),
  };
}

/** A deleted entry stops supporting anything (its votes go with it; its id leaves the memory). */
export function forgetEntry(memory: AiMemory | null, id: string): AiMemory | null {
  if (!memory) return memory;
  return {
    ...memory,
    beliefs: memory.beliefs.map((belief) =>
      belief.cites.includes(id)
        ? { ...belief, cites: belief.cites.filter((cite) => cite !== id) }
        : belief,
    ),
    corrections: memory.corrections.map((item) =>
      item.refs.includes(id) ? { ...item, refs: item.refs.filter((ref) => ref !== id) } : item,
    ),
  };
}
