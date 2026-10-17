import { dayKey } from "../utils/date";
import {
  DAY_MS,
  WEEKDAYS,
  WEEKDAYS_SHORT,
  clock,
  deepStats,
  monthStats,
  type Timeline,
} from "./facts";
import { footprint, isActive, strength, votesByBelief } from "./evidence";
import { baseRate, type ReviewReason } from "./review";
import { canProposeChallenge, entriesSinceDeep } from "./schedule";
import { clip, normalize, overlap, stems } from "./text";
import type {
  AiChallenge,
  AiEntry,
  AiMemory,
  AiState,
  Belief,
  EntryAnalysis,
  EntryReading,
  QueuedQuestion,
} from "./types";

/**
 * What goes to ChatGPT, kept small: every request carries the memory, never the history. An
 * entry's text goes once to /entry; after that only its one-line gist travels, once more, to the
 * next deep analysis. The few originals the deep analysis reads again are picked on the device
 * (src/ai/review.ts). Model-facing labels are English; the answers come in the app's language.
 */

/** Entries read in one /entry request (a backlog after being offline goes in batches). */
export const ENTRY_BATCH = 5;
/** Entries sent with one deep analysis; the rest wait for the next one (none is skipped). */
export const MAX_DEEP_ENTRIES = 45;
/** The same text within this time reuses its analysis instead of a new request. */
const DUPLICATE_WINDOW_DAYS = 30;

const when = (timestamp: number) =>
  `${dayKey(timestamp)} ${WEEKDAYS_SHORT[(new Date(timestamp).getDay() + 6) % 7]} ${clock(timestamp)}`;

/** Tags of the last 90 days — older labels shouldn't keep being suggested forever. */
export function topTags(entries: readonly AiEntry[], size: number, now = Date.now()): string[] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    if (now - entry.timestamp > 90 * DAY_MS) continue;
    for (const tag of (entry.reading ?? entry.analysis)?.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, size)
    .map(([tag]) => tag);
}

/** An earlier entry with the same words, already analyzed — its analysis fits this one too. */
export function duplicateOf(entry: AiEntry, entries: readonly AiEntry[]): AiEntry | null {
  const words = normalize(entry.text);
  if (!words) return null;
  return (
    entries.find(
      (other) =>
        other.id !== entry.id &&
        other.analysis !== null &&
        Math.abs(entry.timestamp - other.timestamp) <= DUPLICATE_WINDOW_DAYS * DAY_MS &&
        normalize(other.text) === words,
    ) ?? null
  );
}

export const duplicateAnalysis = (
  entry: AiEntry,
  entries: readonly AiEntry[],
): EntryAnalysis | null => duplicateOf(entry, entries)?.analysis ?? null;

const OUTCOME = { resisted: "resisted", opened: "opened" } as const;

/**
 * Up to two earlier situations like this one — so the coach can say "the same happened on
 * 3 September after a call, and a walk helped then". Picked on the device by shared words;
 * checked readings and the times the user held on come first.
 */
export function similarEpisodes(entry: AiEntry, entries: readonly AiEntry[], size = 2) {
  const words = stems(entry.text);
  if (words.size < 2) return [];
  return entries
    .filter(
      (other) =>
        other.id !== entry.id && other.reading && entry.timestamp - other.timestamp > 2 * DAY_MS,
    )
    .map((other) => {
      const reading = other.reading!;
      const shared = overlap(
        words,
        stems(`${other.text} ${reading.cause ?? ""} ${reading.tags.join(" ")}`),
      );
      const bonus =
        (reading.check === "agreed" || reading.check === "settled" ? 0.5 : 0) +
        (other.outcome === "resisted" ? 0.5 : 0);
      return { other, score: shared + bonus, shared };
    })
    .filter((item) => item.shared >= 2)
    .sort((a, b) => b.score - a.score || b.other.timestamp - a.other.timestamp)
    .slice(0, size)
    .map(({ other }) =>
      [
        dayKey(other.timestamp),
        other.outcome ? OUTCOME[other.outcome] : "—",
        other.reading!.gist ?? clip(other.text, 100),
      ].join(" | "),
    );
}

/** Hypotheses for /entry: the two best supported and the two most undecided (to gather evidence). */
function digestHypotheses(memory: AiMemory, entries: readonly AiEntry[]) {
  const votes = votesByBelief(entries);
  const active = memory.beliefs.filter(
    (belief) => belief.kind === "hypothesis" && isActive(belief) && belief.status !== "weakened",
  );
  const scored = active.map((belief) => {
    const v = votes.get(belief.id);
    const support = (v?.support ?? 0) + belief.legacy.support;
    const against = (v?.against ?? 0) + belief.legacy.against;
    return { belief, margin: support - against, total: support + against };
  });
  const best = [...scored].sort((a, b) => b.margin - a.margin).slice(0, 2);
  const open = scored
    .filter((item) => !best.includes(item))
    .sort((a, b) => Math.abs(a.margin) - Math.abs(b.margin) || a.total - b.total)
    .slice(0, 2);
  return [...best, ...open].map(({ belief }) => ({ id: belief.id, text: belief.text }));
}

/** /entry: the new entries and a short digest of the memory (never the history). */
export function entryPayload(
  batch: readonly AiEntry[],
  memory: AiMemory | null,
  entries: readonly AiEntry[],
  now = Date.now(),
) {
  const active = memory?.beliefs.filter(isActive) ?? [];
  return {
    memory: {
      profile: memory?.profile.slice(0, 300) || null,
      zones: active.filter((belief) => belief.kind === "zone").map((belief) => belief.text),
      hypotheses: memory ? digestHypotheses(memory, entries) : [],
      tips: active
        .filter((belief) => belief.kind === "tip")
        .slice(0, 3)
        .map((belief) => ({ id: belief.id, text: belief.text })),
      // Recent corrections, so a mistake fixed in the memory isn't repeated in new readings.
      corrections: (memory?.corrections ?? [])
        .filter((item) => now - item.at < 120 * DAY_MS)
        .slice(-2)
        .map((item) => `${item.was} → ${item.now}`.slice(0, 160)),
      tags: topTags(entries, 15, now),
    },
    entries: batch.map((entry, index) => ({
      n: index + 1,
      when: when(entry.timestamp),
      outcome: entry.outcome,
      text: entry.text,
      similar: similarEpisodes(entry, entries),
    })),
  };
}

/** /entry for the independent check: the same model and prompt, but no memory at all. */
export function blindPayload(batch: readonly AiEntry[]) {
  return {
    memory: { profile: null, zones: [], hypotheses: [], tips: [], corrections: [], tags: [] },
    entries: batch.map((entry, index) => ({
      n: index + 1,
      when: when(entry.timestamp),
      outcome: entry.outcome,
      text: entry.text,
      similar: [],
    })),
  };
}

const readingLine = (reading: EntryReading) =>
  [
    reading.cause ?? "—",
    reading.tags.join(", ") || "—",
    reading.gist ?? "—",
    `conf ${reading.conf}`,
  ].join(" | ");

/** One entry in one line: "r3 | 2026-10-12 Mon 21:40 | opened | conf 70 | tags | cause | gist". */
const entryLine = (ref: string, entry: AiEntry) => {
  const reading = entry.reading;
  return [
    ref,
    when(entry.timestamp),
    entry.outcome ? OUTCOME[entry.outcome] : "—",
    `conf ${reading?.conf ?? 70}`,
    reading?.tags.join(", ") || "—",
    reading?.cause ?? "—",
    reading?.gist ?? clip(entry.text, 120),
  ].join(" | ");
};

function beliefLine(belief: Belief, t: Timeline, votes: ReturnType<typeof votesByBelief>) {
  const v = votes.get(belief.id);
  const print = footprint(belief, t);
  const s = strength(belief, v, print);
  const zone = belief.zone
    ? ` [${belief.zone.weekday === null ? "any day" : WEEKDAYS[belief.zone.weekday]}${
        belief.zone.from !== null ? ` ${belief.zone.from}–${belief.zone.to ?? "?"}h` : ""
      }]`
    : "";
  return [
    belief.id,
    belief.kind,
    belief.status,
    `since ${belief.since || "?"}`,
    `votes +${Math.round(s.support)} −${Math.round(s.against)}`,
    `independent +${Math.round(s.independentSupport)} −${Math.round(s.independentAgainst)}`,
    print.summary,
    belief.kind === "tip"
      ? `${belief.when ?? "any"}; tried ${belief.trials.helped} helped, ${belief.trials.failed} not`
      : null,
    `${belief.text}${zone}${belief.note ? ` — ${belief.note}` : ""}`,
    belief.history[0] && belief.history[0].text !== belief.text
      ? `was: ${belief.history[0].text}`
      : null,
  ]
    .filter(Boolean)
    .join(" | ");
}

function memoryForDeep(
  memory: AiMemory | null,
  t: Timeline,
  entries: readonly AiEntry[],
  now: number,
) {
  if (!memory) return null;
  const votes = votesByBelief(entries);
  const active = memory.beliefs.filter(isActive);
  const past = memory.beliefs
    .filter((belief) => !isActive(belief))
    .sort((a, b) => b.statusAt - a.statusAt)
    .slice(0, 6)
    .map((belief) =>
      belief.until
        ? `${belief.id} ${belief.kind} true until ${belief.until}: ${belief.text}`
        : `${belief.id} ${belief.status}${belief.by ? ` by ${belief.by}` : ""} ${dayKey(belief.statusAt)}: ${belief.text}`,
    );
  const halfYear = dayKey(now - 182 * DAY_MS).slice(0, 7);
  const year = dayKey(now - 365 * DAY_MS).slice(0, 7);
  const chapters = [
    ...memory.chapters.filter((item) => item.month === year || item.month === halfYear),
    ...memory.chapters.slice(-3),
  ].filter((item, index, list) => list.findIndex((other) => other.month === item.month) === index);
  return {
    profile: memory.profile,
    conclusion: memory.conclusion,
    beliefs: active.map((belief) => beliefLine(belief, t, votes)),
    pastBeliefs: past,
    mistakes: memory.corrections
      .slice(-5)
      .map((item) => `${dayKey(item.at)}: ${item.was} → ${item.now}`),
    chapters: chapters.map((item) => `${item.month}: ${item.note}`),
    emotions: memory.emotions,
    strengths: memory.strengths,
    weaknesses: memory.weaknesses,
    changes: memory.changes,
    improvements: memory.improvements,
    worsenings: memory.worsenings,
    events: memory.events.slice(-8),
    openQuestions: memory.openQuestions,
    notApplied: memory.rejected,
  };
}

export interface Reread {
  entry: AiEntry;
  reason: ReviewReason | "disputed";
}

/** /deep: the memory, what's new, a few originals worth re-reading, and arithmetic over everything. */
export function deepPayload(state: AiState, t: Timeline, rereads: readonly Reread[] = []) {
  const fresh = entriesSinceDeep(state);
  // Oldest first, as they happened; any beyond the limit go with the next analysis.
  const sent = [...fresh].sort((a, b) => a.timestamp - b.timestamp).slice(0, MAX_DEEP_ENTRIES);
  const refs = new Map<string, string>();
  const refOf = (entry: AiEntry) => {
    // A new entry chosen for re-reading keeps the ref it has among the new entries.
    for (const [known, id] of refs) if (id === entry.id) return known;
    const ref = `r${refs.size + 1}`;
    refs.set(ref, entry.id);
    return ref;
  };
  const newEntries = sent.map((entry) => entryLine(refOf(entry), entry));
  const reread = new Set<string>();
  const originals = rereads.map(({ entry, reason }) => {
    const ref = refOf(entry);
    reread.add(ref);
    // The original first: the model reads it fresh before seeing what was concluded.
    return {
      ref,
      why: reason,
      when: when(entry.timestamp),
      outcome: entry.outcome,
      text: clip(entry.text),
      currentReading: entry.reading ? readingLine(entry.reading) : null,
      memoryFreeReading:
        entry.blind && reason === "disputed"
          ? [
              entry.blind.cause ?? "—",
              entry.blind.tags.join(", ") || "—",
              entry.blind.enough ? "" : "not enough info",
            ]
              .filter(Boolean)
              .join(" | ")
          : null,
      base: baseRate(entry, state.entries),
    };
  });
  const since = state.deepAt === null ? "" : dayKey(state.deepAt);
  const finished = [state.challenge, ...state.pastChallenges].filter(
    (item): item is NonNullable<typeof item> =>
      item !== null && item.status === "done" && item.endDay !== null && item.endDay >= since,
  );
  // A month just over without its chapter: the model writes it now.
  const lastMonth = dayKey(
    new Date(new Date(t.now).getFullYear(), new Date(t.now).getMonth() - 1, 15).getTime(),
  ).slice(0, 7);
  const chapterDue =
    state.memory &&
    !state.memory.chapters.some((item) => item.month === lastMonth) &&
    (monthStats(t).find((month) => month.month === lastMonth)?.observed ?? 0) >= 7
      ? lastMonth
      : null;
  return {
    refs,
    reread,
    sentIds: sent.map((entry) => entry.id),
    body: {
      today: `${t.today} ${WEEKDAYS[t.todayRecord.weekday]}`,
      memory: memoryForDeep(state.memory, t, state.entries, t.now),
      newEntries,
      entriesWaiting: fresh.length - sent.length,
      reread: originals,
      answers: state.answers
        .filter((answer) => !answer.inMemory)
        .map((answer) => ({
          date: dayKey(answer.answeredAt),
          question: answer.question,
          answer: answer.answer,
          about: answer.about,
        })),
      deleted: state.deletedSinceDeep,
      stats: deepStats(t),
      challenges: finished.slice(0, 3).map((item) => ({
        title: item.title,
        tip: item.tipId,
        days: item.durationDays,
        managed: Object.values(item.checkins).filter(Boolean).length,
        result: item.review,
      })),
      currentChallenge:
        state.challenge &&
        (state.challenge.status === "proposed" || state.challenge.status === "active")
          ? { title: state.challenge.title, status: state.challenge.status }
          : null,
      askedRecently: state.askedRecently,
      chapterDue,
      policy: {
        questions: state.question === null && state.questionQueue.length === 0,
        challenge: canProposeChallenge(state, t.now),
      },
    },
  };
}

/** The parts of the state whose texts change language with the app. */
export type Translated = Pick<
  AiState,
  "memory" | "entries" | "challenge" | "pastChallenges" | "question" | "questionQueue"
>;

/**
 * Walks everything ChatGPT wrote that is still shown or still read by the next analysis — the
 * memory, the tags of the readings, experiments, questions — and maps each text. An entry's own
 * analysis is not touched: it stays as the user saw it that day.
 */
function mapTexts(
  state: AiState,
  next: (value: string) => string,
  yesNo: readonly [string, string],
): Translated {
  const tag = (value: string) => next(value).toLowerCase();
  const reading = (item: EntryReading): EntryReading => ({ ...item, tags: item.tags.map(tag) });
  const challenge = (item: AiChallenge): AiChallenge => ({
    ...item,
    title: next(item.title),
    description: next(item.description),
    expectation: next(item.expectation),
    review: item.review === null ? null : next(item.review),
  });
  const question = <T extends QueuedQuestion>(item: T): T => ({
    ...item,
    text: next(item.text),
    // A yes/no question's answers are the app's own words; a choice's options are ChatGPT's.
    options: item.kind === "yes_no" ? [...yesNo] : item.options.map(next),
  });
  const memory = state.memory;
  return {
    memory: memory && {
      ...memory,
      profile: next(memory.profile),
      conclusion: next(memory.conclusion),
      emotions: memory.emotions.map((item) => ({ title: next(item.title), note: next(item.note) })),
      strengths: memory.strengths.map(next),
      weaknesses: memory.weaknesses.map(next),
      changes: memory.changes.map(next),
      improvements: memory.improvements.map(next),
      worsenings: memory.worsenings.map(next),
      events: memory.events.map((item) => ({ ...item, note: next(item.note) })),
      beliefs: memory.beliefs.map((belief) => ({
        ...belief,
        text: next(belief.text),
        note: next(belief.note),
        history: belief.history.map((item) => ({ ...item, text: next(item.text) })),
      })),
      corrections: memory.corrections.map((item) => ({
        ...item,
        was: next(item.was),
        now: next(item.now),
        why: next(item.why),
      })),
      chapters: memory.chapters.map((item) => ({ ...item, note: next(item.note) })),
      openQuestions: memory.openQuestions.map(next),
      // Model-facing notes, in English like the instructions.
      rejected: memory.rejected,
    },
    entries: state.entries.map((entry) =>
      entry.reading
        ? { ...entry, reading: reading(entry.reading), past: entry.past.map(reading) }
        : entry,
    ),
    challenge: state.challenge && challenge(state.challenge),
    pastChallenges: state.pastChallenges.map(challenge),
    question: state.question && question(state.question),
    questionQueue: state.questionQueue.map(question),
  };
}

/** The distinct texts to send to /translate. */
export function translatable(state: AiState): string[] {
  const items = new Set<string>();
  mapTexts(
    state,
    (value) => {
      if (value.trim()) items.add(value);
      return value;
    },
    ["", ""],
  );
  return [...items];
}

/**
 * Applies the translations to the CURRENT state (not to the one that was sent): an answer, a
 * check-in or a new entry that came while the request ran is kept. A text without a translation
 * stays as it is.
 */
export function applyTranslations(
  state: AiState,
  translations: Readonly<Record<string, string>>,
  yesNo: readonly [string, string],
): Translated {
  return mapTexts(state, (value) => translations[value] ?? value, yesNo);
}
