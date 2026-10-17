import { describe, expect, it, jest } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { setLanguage } from "../../i18n";
import { CATALOG } from "../../i18n/messages";
import { addDays, dayKey } from "../../utils/date";
import { DEFAULT_SETTINGS } from "../../utils/persistedState";
import type { SlipEntry, WinEntry } from "../../utils/types";
import { buildAnalytics, challengeHelped, challengeReview } from "../analytics";
import { footprint, isVerified, strength, votesByBelief } from "../evidence";
import {
  buildTimeline,
  challengeMeasure,
  deepStats,
  partOfDay,
  recordsKey,
  type FactsInput,
} from "../facts";
import { buildForecast } from "../forecast";
import { applyDeep, type DeepContext } from "../memory";
import { newBelief, parseChallenge, parseEntryResult, parseMemory, parseQuestions } from "../parse";
import {
  MAX_DEEP_ENTRIES,
  blindPayload,
  deepPayload,
  duplicateAnalysis,
  entryPayload,
  translatable,
} from "../payload";
import { aiReducer } from "../reducer";
import { MAX_BLIND, MAX_READS, planReview, sameReading } from "../review";
import { DEEP_EARLY_ENTRIES, canProposeChallenge, needsDeep, questionDue } from "../schedule";
import {
  createInitialAiState,
  groupByMonth,
  loadAiState,
  readingOf,
  sanitizeAiMeta,
  sanitizeEntry,
  saveAiState,
} from "../storage";
import type {
  AiChallenge,
  AiEntry,
  AiMemory,
  AiState,
  Belief,
  BeliefKind,
  BeliefStatus,
  EntryAnalysis,
  EntryVote,
} from "../types";

jest.mock("@react-native-async-storage/async-storage", () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Thursday 15 October 2026, 20:00.
const NOW = new Date(2026, 9, 15, 20, 0).getTime();
const TODAY = dayKey(NOW);
const DAY = 86_400_000;
const at = (daysAgo: number, hour: number, minute = 0) =>
  new Date(2026, 9, 15 - daysAgo, hour, minute).getTime();

let ids = 0;
const slip = (daysAgo: number, hour: number): SlipEntry => ({
  id: `s${(ids += 1)}`,
  timestamp: at(daysAgo, hour),
  trigger: "fatigue",
  app: "tiktok",
  minutesLost: 20,
  note: "",
});
const win = (daysAgo: number, hour: number): WinEntry => ({
  id: `w${(ids += 1)}`,
  timestamp: at(daysAgo, hour),
  minutesSaved: 15,
  source: "sos",
});
const TEXT = "Очень устал после работы, пришёл домой и сразу открыл ленту";
const analysis = (overrides: Partial<EntryAnalysis> = {}): EntryAnalysis => ({
  enough: true,
  cause: "усталость",
  emotion: "опустошённость",
  context: "после работы",
  behavior: "бегство от усталости",
  explanation: null,
  missing: null,
  tags: ["усталость", "работа"],
  gist: "устал после работы, открыл ленту дома",
  conf: 70,
  language: null,
  analyzedAt: NOW,
  ...overrides,
});
/** An analyzed entry: its frozen analysis and the first reading made from it. */
const entry = (
  daysAgo: number,
  hour: number,
  extra: Partial<AiEntry> = {},
  votes: EntryVote[] = [],
  analyzed: Partial<EntryAnalysis> = {},
): AiEntry => {
  const first = analysis({ analyzedAt: at(daysAgo, hour, 1), ...analyzed });
  return {
    id: `e${(ids += 1)}`,
    timestamp: at(daysAgo, hour),
    text: TEXT,
    outcome: null,
    status: "done",
    attempts: 0,
    analysis: first,
    reading: readingOf(first, votes),
    past: [],
    reads: 0,
    readAt: null,
    contested: false,
    blind: null,
    inMemory: false,
    ...extra,
  };
};
const pending = (daysAgo: number, hour: number, text = TEXT): AiEntry =>
  entry(daysAgo, hour, { status: "pending", analysis: null, reading: null, text });
const newest = <T extends { timestamp: number }>(list: T[]) =>
  [...list].sort((a, b) => b.timestamp - a.timestamp);

function input(overrides: Partial<FactsInput> = {}): FactsInput {
  return {
    wins: [],
    winArchive: { count: 0, minutes: 0, replacementCount: 0 },
    slips: [],
    scrollLog: {},
    settings: DEFAULT_SETTINGS,
    entries: [],
    now: NOW,
    ...overrides,
  };
}

const belief = (
  id: string,
  kind: BeliefKind,
  text: string,
  status: BeliefStatus,
  extra: Partial<Belief> = {},
): Belief =>
  newBelief(id, kind, text, "", status, { since: "2026-08", statusAt: NOW - 40 * DAY, ...extra });

const memory = (overrides: Partial<AiMemory> = {}): AiMemory => ({
  profile: "Срывы чаще вечером после работы.",
  conclusion: "Главное — вечерняя усталость.",
  emotions: [{ title: "Опустошённость", note: "В вечерних записях." }],
  strengths: [],
  weaknesses: [],
  changes: ["Днём стало спокойнее."],
  improvements: [],
  worsenings: [],
  events: [{ date: "2026-09", note: "Самый трудный день сместился на пятницу." }],
  beliefs: [
    belief("t1", "trigger", "После работы", "supported", { note: "Дома, сразу после прихода." }),
    belief("h1", "hypothesis", "Прогулки помогают вечером", "established"),
    belief("h2", "hypothesis", "Скука на работе ведёт к ленте", "proposed"),
    belief("h3", "hypothesis", "Сон не влияет", "weakened"),
  ],
  corrections: [],
  chapters: [],
  openQuestions: [],
  rejected: [],
  ...overrides,
});

const stateWith = (overrides: Partial<AiState> = {}): AiState => ({
  ...createInitialAiState(),
  consent: true,
  memory: memory(),
  memoryLanguage: "ru",
  ...overrides,
});

const context = (state: AiState, overrides: Partial<DeepContext> = {}): DeepContext => ({
  refs: new Map(),
  reread: new Set(),
  now: NOW,
  month: TODAY.slice(0, 7),
  timeline: buildTimeline(input({ entries: state.entries })),
  ...overrides,
});
const deep = (beliefs: unknown[], extra: Record<string, unknown> = {}) => ({
  profile: "Профиль",
  conclusion: "Вывод",
  rereads: [],
  beliefs,
  emotions: null,
  strengths: null,
  weaknesses: null,
  changes: null,
  improvements: null,
  worsenings: null,
  events: [],
  corrections: [],
  chapter: null,
  openQuestions: [],
  questions: [],
  challenge: null,
  ...extra,
});
const op = (fields: Record<string, unknown>) => ({
  op: "add",
  id: null,
  kind: null,
  text: null,
  note: null,
  weekday: null,
  from: null,
  to: null,
  when: null,
  until: null,
  cites: [],
  why: null,
  ...fields,
});
const byId = (result: { memory: AiMemory }, id: string) =>
  result.memory.beliefs.find((item) => item.id === id)!;

describe("arithmetic on the device", () => {
  // Thursdays: 7, 14 and 21 days ago, each with a late slip.
  const slips = newest([slip(7, 21), slip(14, 22), slip(21, 21), slip(2, 13)]);
  const entries = [entry(1, 21, { outcome: "opened" }), entry(3, 9, { outcome: "resisted" })];
  const timeline = buildTimeline(
    input({
      slips,
      wins: [win(1, 12), win(0, 10)],
      winArchive: { count: 10, minutes: 300, replacementCount: 0 },
      entries,
      scrollLog: { [addDays(TODAY, -1)]: 90, [addDays(TODAY, -2)]: 30, [TODAY]: 20 },
    }),
  );
  const stats = deepStats(timeline);

  it("sends the whole history as compact tables, not records", () => {
    expect(stats.hours.slips[21]).toBe(2);
    expect(stats.hours.entries[9]).toBe(1);
    expect(stats.months.cols.split(",")).toHaveLength(stats.months.rows[0]!.length);
    expect(stats.weeks.cols.split(",")).toHaveLength(stats.weeks.rows[0]!.length);
    expect(stats.years.cols.split(",")).toHaveLength(stats.years.rows[0]!.length);
    // Thursdays: three observed, three hard.
    expect(stats.weekdays.allTime[3]).toBe("3/3");
    expect(stats.coverage).toMatchObject({ slips: 4, entries: 2, wins: 12 });
    expect(stats.savedMinutes.total).toBe(330);
    // Tags and journal reasons are counted together.
    expect(stats.causes[0]).toMatch(/^усталость 6/);
    expect(JSON.stringify(stats).length).toBeLessThan(3200);
  });

  it("notices changes in the records, not in the date", () => {
    const base = { wins: [win(1, 12)], slips, scrollLog: { [TODAY]: 20 } };
    expect(recordsKey(base)).toBe(recordsKey({ ...base }));
    expect(recordsKey(base)).not.toBe(recordsKey({ ...base, scrollLog: { [TODAY]: 25 } }));
    expect(recordsKey(base)).not.toBe(recordsKey({ ...base, slips: [slip(0, 9), ...slips] }));
  });

  const accepted = (checkins: Record<string, boolean> = {}): AiChallenge => ({
    ...(parseChallenge(
      { title: "Телефон вне спальни", description: "…", durationDays: 3, focus: "evening" },
      "c",
      at(4, 9),
    ) as AiChallenge),
    status: "active",
    startDay: addDays(TODAY, -3),
    startedAt: at(3, 20),
    endDay: addDays(TODAY, -1),
    checkins,
  });

  it("measures an experiment only from the moment it was accepted", () => {
    const challenge = accepted();
    const t = buildTimeline(
      input({
        // Before acceptance on the first day (doesn't count), then one evening slip; two before.
        slips: newest([slip(3, 19), slip(2, 21), slip(5, 21), slip(6, 22)]),
      }),
    );
    const measured = challengeMeasure(challenge, t)!;
    expect(measured.during.losses).toBe(1);
    expect(measured.before.losses).toBe(2);
    expect(challengeReview(challenge, t)).toMatch(/1\sраз за 3\sдня эксперимента против 2\sраза/u);
    expect(partOfDay(21)).toBe("evening");
  });

  it("decides whether the experiment's tip helped only when it was really tried", () => {
    const t = buildTimeline(
      input({ slips: newest([slip(2, 21), slip(4, 21), slip(5, 21), slip(6, 22)]) }),
    );
    // One evening slip during against three before: helped.
    expect(challengeHelped(accepted(), t)).toBe(true);
    const days = [-3, -2, -1].map((offset) => addDays(TODAY, offset));
    // Mostly not done — the tip wasn't tested at all.
    expect(
      challengeHelped(accepted({ [days[0]!]: false, [days[1]!]: false, [days[2]!]: true }), t),
    ).toBeNull();
    const worse = buildTimeline(
      input({
        slips: newest([slip(1, 21), slip(2, 21), slip(3, 22), slip(5, 21), slip(6, 21)]),
      }),
    );
    expect(challengeHelped(accepted(), worse)).toBe(false);
  });
});

describe("today's forecast, computed on the device", () => {
  it("has nothing to say without history and is honest when there is little", () => {
    expect(buildForecast(buildTimeline(input()), null)).toBeNull();
    const thin = buildForecast(buildTimeline(input({ slips: [slip(1, 21)] })), null)!;
    expect(thin.probability).toBeNull();
    expect(thin.headline).toMatch(/предварительный/);
  });

  it("is higher on a weekday that keeps going wrong, with the reasons in numbers", () => {
    const scrollLog: Record<string, number> = {};
    for (let days = 1; days <= 42; days += 1) scrollLog[addDays(TODAY, -days)] = 30;
    const thursdays = [7, 14, 21, 28, 35, 42].map((days) => slip(days, 21));
    const morning = new Date(2026, 9, 15, 9, 0).getTime();
    const tips = [
      belief("p1", "tip", "Положить телефон в другой комнате", "supported", {
        when: "any",
        trials: { helped: 0, failed: 1 },
      }),
      belief("p2", "tip", "Прогулка после работы", "proposed", {
        when: "any",
        trials: { helped: 1, failed: 0 },
      }),
    ];
    const risky = buildForecast(
      buildTimeline(input({ slips: newest(thursdays), scrollLog, now: morning })),
      null,
    )!;
    const calm = buildForecast(
      buildTimeline(input({ scrollLog, now: morning })),
      memory({ beliefs: tips }),
    )!;
    expect(risky.probability!).toBeGreaterThan(calm.probability!);
    expect(risky.reasons.join(" ")).toMatch(/6 из последних шести четвергов были трудными/);
    expect(risky.window.until).toBe("00:00");
    expect(calm.level).toBe("low");
    // The tip that failed in an experiment isn't offered; the one that helped is.
    expect(calm.advice).toBe("Прогулка после работы");
    expect(calm.basis).toMatch(/^история за 42\sдня$/);
  });

  it("says when the dangerous time has passed calmly, and uses the memory's dangerous periods", () => {
    const scrollLog: Record<string, number> = {};
    for (let days = 1; days <= 20; days += 1) scrollLog[addDays(TODAY, -days)] = 30;
    const slips = newest([1, 2, 4, 6, 8, 9].map((days) => slip(days, 14)));
    const zone = belief("z1", "zone", "Вечер четверга", "supported", {
      note: "По четвергам после планёрки тянет в ленту.",
      zone: { weekday: 3, from: 19, to: 23 },
    });
    const forecast = buildForecast(
      buildTimeline(input({ slips, scrollLog })),
      memory({ beliefs: [zone] }),
    )!;
    expect(forecast.passed).toMatch(/уже позади/);
    expect(forecast.reasons).toContain("По четвергам после планёрки тянет в ленту.");
    // A period that is over (scoped) is not today's reason.
    const ended = buildForecast(
      buildTimeline(input({ slips, scrollLog })),
      memory({ beliefs: [{ ...zone, until: "2026-09" }] }),
    )!;
    expect(ended.reasons).not.toContain("По четвергам после планёрки тянет в ленту.");
  });
});

describe("analytics: the memory's conclusions + numbers from the device", () => {
  const scrollLog: Record<string, number> = {};
  for (let days = 0; days <= 30; days += 1) scrollLog[addDays(TODAY, -days)] = days < 7 ? 40 : 80;
  const entries = [
    ...Array.from({ length: 6 }, (_, index) => entry(index + 1, 21)),
    ...Array.from({ length: 3 }, (_, index) => entry(index + 1, 13, {}, [], { tags: ["скука"] })),
  ];
  const timeline = buildTimeline(
    input({
      entries: newest(entries),
      scrollLog,
      wins: [win(1, 12)],
      winArchive: { count: 40, minutes: 1000, replacementCount: 0 },
    }),
  );
  const analytics = buildAnalytics(timeline, memory());

  it("counts causes with shares and when they happen", () => {
    expect(analytics.causes[0]).toMatchObject({ title: "Усталость", share: 67 });
    expect(analytics.causes[0]!.note).toMatch(/6 из 9\sслучаев, чаще всего вечером/);
  });

  it("shows trends, saved time and records in numbers", () => {
    expect(analytics.improvements[0]).toMatch(/В ленте стало меньше времени/);
    expect(analytics.numbers!.headline).toMatch(/^Вы вернули себе 16/);
    expect(analytics.numbers!.equivalents[0]).toMatch(/^около 8\sфильмов$/);
    expect(analytics.longTerm).toContain("Сентябрь 2026: Самый трудный день сместился на пятницу.");
  });

  it("takes situations, hypotheses and the conclusion from the memory's beliefs", () => {
    expect(analytics.conclusion).toBe("Главное — вечерняя усталость.");
    expect(analytics.situations).toEqual([
      { title: "После работы", note: "Дома, сразу после прихода." },
    ]);
    expect(analytics.habitChanges).toEqual(["Днём стало спокойнее."]);
    // The confidence is the status the evidence earned; weakened ones are not shown.
    expect(analytics.hypotheses).toEqual([
      { text: "Прогулки помогают вечером", confidence: "high" },
      { text: "Скука на работе ведёт к ленте", confidence: "low" },
    ]);
  });

  it("keeps the story: chapters, the coach's own corrections and patterns that ended", () => {
    const story = buildAnalytics(
      timeline,
      memory({
        chapters: [{ month: "2026-09", note: "Вечера стали спокойнее." }],
        corrections: [
          {
            at: NOW - 90 * DAY,
            was: "Лента побеждает от скуки.",
            now: "Скука — повод, а причина — усталость после смены.",
            why: "так говорят перечитанные записи",
            refs: [],
            beliefId: "h9",
          },
          {
            at: NOW - 3 * DAY,
            was: "Опасны выходные.",
            now: "Опасен вечер воскресенья.",
            why: "",
            refs: [],
            beliefId: null,
          },
        ],
        beliefs: [
          belief("z2", "zone", "Утро в метро", "supported", {
            since: "2026-03",
            until: "2026-05",
            statusAt: NOW - 120 * DAY,
          }),
        ],
      }),
    );
    expect(story.longTerm).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^Сентябрь 2026: Вечера стали спокойнее\. Спокойных дней — \d+%\.$/),
        "Раньше: Лента побеждает от скуки. Теперь точнее: Скука — повод, а причина — усталость после смены (так говорят перечитанные записи).",
        "Утро в метро (март–май 2026; сейчас уже не так).",
      ]),
    );
    // A fresh correction is news: it shows with the other changes, not yet in the long-term memory.
    expect(story.habitChanges[0]).toBe(
      "Раньше: Опасны выходные. Теперь точнее: Опасен вечер воскресенья.",
    );
    expect(story.longTerm.join(" ")).not.toMatch(/Опасны выходные/);
    // A time-limited zone is history, not a warning for now.
    expect(story.warnings.join(" ")).not.toMatch(/метро/);
  });
});

describe("answers from the server are checked before use", () => {
  const raw = {
    n: 1,
    enough: true,
    cause: "  Усталость  ",
    emotion: null,
    context: null,
    behavior: null,
    insight: null,
    missing: null,
    tags: ["Усталость", "Работа"],
    gist: "Пришёл без сил, открыл ленту",
    conf: 95,
    votes: [
      { id: "h1", effect: "support" },
      { id: "h2", effect: "maybe" },
    ],
  };

  it("reads an entry result and caps the stated confidence on the device", () => {
    const result = parseEntryResult(raw, NOW, 200)!;
    expect(result.analysis).toMatchObject({
      cause: "Усталость",
      explanation: null,
      tags: ["усталость", "работа"],
      conf: 95,
    });
    expect(result.votes).toEqual([{ id: "h1", effect: "support" }]);
    // A few words are never certain; "not enough information" is never more than a guess.
    expect(parseEntryResult(raw, NOW, 12)!.analysis.conf).toBe(70);
    expect(parseEntryResult({ ...raw, enough: false }, NOW, 200)!.analysis.conf).toBe(40);
    expect(parseEntryResult({ n: 1 }, NOW)).toBeNull();
  });

  it("reads questions with the belief they test, and the experiment with its tip", () => {
    expect(
      parseQuestions([
        { text: "Вы ложитесь после полуночи?", kind: "yes_no", options: [], about: "h2" },
        { text: "Что обычно перед этим?", kind: "choice", options: ["Работа"], about: null },
      ]),
    ).toEqual([
      { text: "Вы ложитесь после полуночи?", kind: "yes_no", options: ["Да", "Нет"], about: "h2" },
    ]);
    expect(
      parseChallenge(
        { title: "t", description: "d", durationDays: 30, focus: "x", tip: "p1" },
        "c",
        NOW,
      ),
    ).toMatchObject({ durationDays: 7, focus: "all", status: "proposed", tipId: "p1" });
  });

  it("converts the earlier memory into beliefs, keeping the counted votes", () => {
    const old = parseMemory({
      profile: "Старый профиль",
      conclusion: "Старый вывод",
      triggers: [{ title: "После работы", note: "Дома" }],
      dangerZones: [{ title: "Вечер", note: "После 21:00", weekday: null, from: 21, to: 23 }],
      tips: [{ text: "Прогулка", when: "evening" }],
      hypotheses: [
        { id: "h1", text: "Прогулки помогают", status: "supported", support: 6, against: 1 },
        { id: null, text: "Новая", status: "proposed", support: 0, against: 0 },
      ],
      events: [],
      emotions: [],
    })!;
    expect(old.beliefs.map((item) => [item.id, item.kind, item.status])).toEqual([
      ["h1", "hypothesis", "supported"],
      ["h2", "hypothesis", "proposed"],
      ["t1", "trigger", "supported"],
      ["z1", "zone", "supported"],
      ["p1", "tip", "proposed"],
    ]);
    expect(old.beliefs[0]!.legacy).toEqual({ support: 6, against: 1 });
    expect(old.beliefs[3]!.zone).toEqual({ weekday: null, from: 21, to: 23 });
    // The current version reads back as it was written.
    expect(parseMemory(JSON.parse(JSON.stringify(old)))).toEqual(old);
    expect(parseMemory({ profile: "", conclusion: "" })).toBeNull();
  });
});

describe("evidence is counted on the device", () => {
  it("separates echoes of the memory from independent confirmations", () => {
    const echoed = entry(1, 21, {}, [{ id: "h2", effect: "support" }]);
    const agreed = entry(2, 21, {}, [{ id: "h2", effect: "support" }]);
    agreed.reading = { ...agreed.reading!, check: "agreed" };
    const contested = entry(3, 21, { contested: true }, [{ id: "h2", effect: "against" }]);
    const votes = votesByBelief([echoed, agreed, contested]).get("h2")!;
    expect(votes).toMatchObject({ support: 2, verifiedSupport: 1, against: 0.5 });
    expect(isVerified(echoed.reading!)).toBe(false);
    const h2 = {
      ...belief("h2", "hypothesis", "x", "proposed"),
      answers: { support: 1, against: 0 },
    };
    expect(strength(h2, votes, { verdict: null, summary: null })).toMatchObject({
      independentSupport: 3,
      support: 2,
    });
  });

  it("tests a dangerous period against the records themselves", () => {
    const scrollLog: Record<string, number> = {};
    for (let days = 1; days <= 56; days += 1) scrollLog[addDays(TODAY, -days)] = 30;
    // Every slip at 21–22: an evening zone is real, a morning one is not.
    const slips = newest(Array.from({ length: 20 }, (_, index) => slip(index * 2 + 1, 21)));
    const t = buildTimeline(input({ slips, scrollLog }));
    const evening = belief("z1", "zone", "Вечер", "proposed", {
      zone: { weekday: null, from: 20, to: 23 },
    });
    const morning = belief("z2", "zone", "Утро", "proposed", {
      zone: { weekday: null, from: 7, to: 10 },
    });
    expect(footprint(evening, t).verdict).toBe("strong");
    expect(footprint(morning, t).verdict).toBe("failing");
  });
});

describe("re-reading old entries", () => {
  it("picks a few entries where a second look can change the picture", () => {
    const counter = entry(40, 21, {}, [{ id: "h1", effect: "against" }]);
    const guess = entry(35, 21, {}, [], { conf: 40 });
    const short = entry(30, 21, { text: "Устал" }, [], { conf: 40 });
    const recent = entry(33, 21, { readAt: NOW - 10 * DAY }, [], { conf: 40 });
    const contested = entry(32, 21, { contested: true }, [], { conf: 40 });
    const supporters = Array.from({ length: 4 }, (_, index) =>
      entry(50 + index, 21, {}, [{ id: "h1", effect: "support" }]),
    );
    const state = stateWith({
      entries: [counter, guess, short, recent, contested, ...supporters],
    });
    const plan = planReview(state, buildTimeline(input({ entries: state.entries })), NOW);
    const reasons = new Map(plan.blind.map((item) => [item.entry.id, item.reason]));
    expect(reasons.get(counter.id)).toBe("counter");
    expect(reasons.get(guess.id)).toBe("uncertain");
    for (const skipped of [short, recent, contested]) expect(reasons.has(skipped.id)).toBe(false);
    expect(plan.blind.length).toBeLessThanOrEqual(MAX_BLIND);
  });

  it("compares the memory-free reading structurally", () => {
    const reading = readingOf(analysis());
    expect(
      sameReading(reading, analysis(), { cause: "что-то", tags: ["Усталость"], enough: true }),
    ).toBe(true);
    expect(
      sameReading(reading, analysis(), { cause: "усталость вечером", tags: [], enough: true }),
    ).toBe(true);
    expect(
      sameReading(reading, analysis(), { cause: "ссора", tags: ["конфликт"], enough: true }),
    ).toBe(false);
    expect(
      sameReading(reading, analysis({ enough: false }), { cause: null, tags: [], enough: false }),
    ).toBe(true);
  });

  it("takes the independent check in: calibration, agreement, disputes", () => {
    const agreed = entry(40, 21);
    const disputed = entry(41, 21);
    let state = stateWith({ entries: [agreed, disputed] });
    state = aiReducer(state, {
      type: "blindChecked",
      at: NOW,
      results: [
        { id: agreed.id, blind: { cause: "усталость", tags: [], enough: true }, agreed: true },
        {
          id: disputed.id,
          blind: { cause: "ссора", tags: ["конфликт"], enough: true },
          agreed: false,
        },
      ],
    });
    expect(state.calibration["70"]).toEqual({ checked: 2, disputed: 1 });
    expect(state.entries[0]!.reading!.check).toBe("agreed");
    expect(state.entries[1]!).toMatchObject({
      reads: 1,
      blind: { cause: "ссора" },
      reading: { check: "disputed" },
    });
  });

  it("revises a reading only from the original — the entry's own analysis never changes", () => {
    const old = entry(40, 21, {}, [], { cause: "скука", tags: ["скука"] });
    const state = stateWith({ entries: [old] });
    const ctx = context(state, { refs: new Map([["r1", old.id]]), reread: new Set(["r1"]) });
    const result = applyDeep(
      state,
      deep([], {
        rereads: [
          {
            ref: "r1",
            verdict: "revise",
            cause: "усталость после смены",
            tags: ["Усталость"],
            gist: "после смены нет сил",
            conf: 95,
            votes: [{ id: "h1", effect: "support" }],
            why: "в тексте — двенадцать часов на ногах",
          },
        ],
      }),
      ctx,
    )!;
    expect(result.readings).toHaveLength(1);
    const update = result.readings[0]!;
    expect(update.reading).toMatchObject({
      cause: "усталость после смены",
      tags: ["усталость"],
      by: "deep",
      check: "settled",
      votes: [{ id: "h1", effect: "support" }],
    });
    expect(update.past[0]!.cause).toBe("скука");

    let next = aiReducer(state, {
      type: "deepUpdated",
      at: NOW,
      recordsKey: "k",
      sentEntryIds: [],
      sentAnswerIds: [],
      sentDeleted: 0,
      deletedMeanwhile: [],
      memory: result.memory,
      language: "ru",
      readIds: [old.id],
      readings: result.readings,
      pivotKey: null,
      questions: [],
      challenge: null,
    });
    expect(next.entries[0]!.analysis).toEqual(old.analysis);
    expect(next.entries[0]).toMatchObject({ reads: 1, readAt: NOW });

    // Going back to the reading it already left: the entry is ambiguous — kept, never re-read.
    const back = applyDeep(
      next,
      deep([], {
        rereads: [
          {
            ref: "r1",
            verdict: "revise",
            cause: "скука вечером",
            tags: ["скука"],
            gist: null,
            conf: 70,
            votes: [],
            why: "",
          },
        ],
      }),
      context(next, { refs: new Map([["r1", old.id]]), reread: new Set(["r1"]) }),
    )!;
    expect(back.readings[0]).toMatchObject({
      contested: true,
      reading: { cause: "усталость после смены", conf: 50 },
    });
    // An entry that went only as a gist can't be revised.
    const notSent = applyDeep(
      next,
      deep([], {
        rereads: [
          {
            ref: "r2",
            verdict: "revise",
            cause: "x",
            tags: [],
            gist: null,
            conf: 70,
            votes: [],
            why: "",
          },
        ],
      }),
      context(next, { refs: new Map([["r2", old.id]]) }),
    )!;
    expect(notSent.readings).toEqual([]);
    next = aiReducer(next, { type: "deleteEntry", id: old.id });
    expect(next.entries).toEqual([]);
  });

  it("gives up a dispute after a few tries instead of sending it forever", () => {
    const stuck = entry(40, 21, {
      reads: MAX_READS - 1,
      blind: { cause: "x", tags: [], enough: true },
    });
    stuck.reading = { ...stuck.reading!, check: "disputed" };
    const state = aiReducer(stateWith({ entries: [stuck] }), {
      type: "deepUpdated",
      at: NOW,
      recordsKey: "k",
      sentEntryIds: [],
      sentAnswerIds: [],
      sentDeleted: 0,
      deletedMeanwhile: [],
      memory: memory(),
      language: "ru",
      readIds: [stuck.id],
      readings: [],
      pivotKey: null,
      questions: [],
      challenge: null,
    });
    expect(state.entries[0]).toMatchObject({
      reads: MAX_READS,
      blind: null,
      reading: { check: "none" },
    });
  });
});

describe("the deep analysis changes the memory under the app's evidence rules", () => {
  it("moves a belief up only with independent evidence, and says why it refused", () => {
    const echoes = Array.from({ length: 3 }, (_, index) =>
      entry(index + 1, 21, {}, [{ id: "h2", effect: "support" }]),
    );
    const state = stateWith({ entries: echoes });
    const refused = applyDeep(state, deep([op({ op: "confirm", id: "h2" })]), context(state))!;
    expect(byId(refused, "h2").status).toBe("proposed");
    expect(refused.rejected[0]).toMatch(/^confirm h2: needs 3\+ supporting entries/);

    echoes[0]!.reading = { ...echoes[0]!.reading!, check: "agreed" };
    const checked = stateWith({ entries: echoes });
    const confirmed = applyDeep(
      checked,
      deep([op({ op: "confirm", id: "h2" })]),
      context(checked),
    )!;
    expect(byId(confirmed, "h2")).toMatchObject({ status: "supported", statusAt: NOW });
    expect(confirmed.memory.rejected).toEqual([]);
  });

  it("replaces a belief with a better one that starts from zero and remembers the mistake", () => {
    const state = stateWith({
      memory: memory({
        beliefs: [
          belief("h1", "hypothesis", "Прогулки помогают вечером", "established", {
            legacy: { support: 9, against: 0 },
            answers: { support: 0, against: 1 },
          }),
        ],
      }),
    });
    const result = applyDeep(
      state,
      deep([
        op({
          op: "supersede",
          id: "h1",
          kind: "hypothesis",
          text: "Прогулки помогают только в будни",
          why: "в выходные прогулки не меняли вечер",
        }),
      ]),
      context(state),
    )!;
    expect(byId(result, "h1")).toMatchObject({ status: "superseded", by: "h2" });
    expect(byId(result, "h2")).toMatchObject({
      status: "proposed",
      legacy: { support: 0, against: 0 },
      answers: { support: 0, against: 0 },
      since: TODAY.slice(0, 7),
    });
    expect(result.memory.corrections).toEqual([
      expect.objectContaining({
        was: "Прогулки помогают вечером",
        now: "Прогулки помогают только в будни",
        beliefId: "h1",
      }),
    ]);
  });

  it("drops a strong belief in two steps, and freezes one that keeps flipping", () => {
    const against = entry(1, 21, {}, [{ id: "h1", effect: "against" }]);
    against.reading = { ...against.reading!, check: "settled" };
    const state = stateWith({ entries: [against] });
    const first = applyDeep(
      state,
      deep([op({ op: "retire", id: "h1", why: "нет" })]),
      context(state),
    )!;
    expect(byId(first, "h1").status).toBe("weakened");
    const soon = { ...state, memory: first.memory };
    const again = applyDeep(
      soon,
      deep([op({ op: "retire", id: "h1", why: "нет" })]),
      context(soon),
    )!;
    expect(byId(again, "h1").status).toBe("weakened");
    expect(again.rejected[0]).toMatch(/less than 5 days/);
    const later = applyDeep(
      soon,
      deep([op({ op: "retire", id: "h1", why: "прогулки ничего не меняли" })]),
      context(soon, { now: NOW + 6 * DAY }),
    )!;
    expect(byId(later, "h1").status).toBe("retired");
    expect(later.memory.corrections.at(-1)).toMatchObject({ was: "Прогулки помогают вечером" });

    const flipping = stateWith({
      memory: memory({
        beliefs: [
          belief("h2", "hypothesis", "x", "supported", {
            flips: [NOW - 30 * DAY, NOW - 20 * DAY, NOW - 10 * DAY],
          }),
        ],
      }),
    });
    const frozen = applyDeep(flipping, deep([op({ op: "weaken", id: "h2" })]), context(flipping))!;
    expect(byId(frozen, "h2").status).toBe("supported");
    expect(frozen.rejected[0]).toMatch(/frozen/);
  });

  it("doesn't let a refuted belief come back or the active list grow without limit", () => {
    const state = stateWith({
      memory: memory({
        beliefs: [
          belief("h3", "hypothesis", "Сон не влияет на ленту", "retired", {
            statusAt: NOW - 10 * DAY,
          }),
          ...[1, 2, 3, 4].map((n) =>
            belief(`z${n}`, "zone", `Период ${n}`, "proposed", {
              zone: { weekday: n, from: null, to: null },
            }),
          ),
        ],
      }),
    });
    const result = applyDeep(
      state,
      deep([
        op({ kind: "hypothesis", text: "Сон не влияет на ленту вечером" }),
        op({ kind: "zone", text: "Пятница", weekday: 4 }),
        op({ kind: "trigger", text: "Звонок начальника" }),
      ]),
      context(state),
    )!;
    expect(result.rejected).toEqual([
      expect.stringMatching(/too close to retired h3/),
      expect.stringMatching(/already 4 active zones/),
    ]);
    expect(result.memory.beliefs.map((item) => item.id)).toContain("t1");
  });

  it("marks what was true only for a while, keeps unmentioned sections and dates", () => {
    const state = stateWith({
      memory: memory({
        beliefs: [
          belief("z1", "zone", "Вечер пятницы", "supported", {
            zone: { weekday: 4, from: 19, to: 23 },
            // The user said it is no longer so — the evidence a supported belief needs to end.
            answers: { support: 0, against: 1 },
          }),
        ],
        chapters: [{ month: "2026-08", note: "Старая глава" }],
      }),
    });
    const result = applyDeep(
      state,
      deep(
        [
          // An update with every zone field null keeps the zone.
          op({ op: "update", id: "z1", note: "После тяжёлой недели" }),
          op({ op: "scope", id: "z1", until: "2026-09" }),
        ],
        {
          events: [
            { date: "2026-09", note: "Самый трудный день сместился на пятницу." },
            { date: "2026-10-02", note: "Новая работа" },
          ],
          chapter: { month: "2026-09", note: "Сентябрь спокойнее августа." },
          changes: ["Вечера стали легче."],
        },
      ),
      context(state),
    )!;
    expect(byId(result, "z1")).toMatchObject({
      until: "2026-09",
      note: "После тяжёлой недели",
      zone: { weekday: 4, from: 19, to: 23 },
    });
    expect(result.memory.emotions).toEqual(state.memory!.emotions);
    expect(result.memory.changes).toEqual(["Вечера стали легче."]);
    expect(result.memory.events.map((event) => event.date)).toEqual(["2026-09", "2026-10-02"]);
    expect(result.memory.chapters.map((chapter) => chapter.month)).toEqual(["2026-08", "2026-09"]);
  });

  it("ends, replaces and drops beliefs only under the evidence rules", () => {
    const strong = (id: string, extra: Partial<Belief> = {}) =>
      belief(id, "hypothesis", `Гипотеза ${id}`, "established", extra);
    const state = stateWith({
      memory: memory({
        beliefs: [
          strong("h1"),
          strong("h2", { answers: { support: 0, against: 1 } }),
          strong("h3", { flips: [NOW - 30 * DAY, NOW - 20 * DAY, NOW - 10 * DAY] }),
          ...[1, 2, 3, 4].map((n) => belief(`p${n}`, "tip", `Совет ${n}`, "proposed")),
        ],
      }),
    });
    const result = applyDeep(
      state,
      deep([
        // No evidence that it stopped; the user's "no" is; a frozen one can't change.
        op({ op: "scope", id: "h1", until: "2026-09" }),
        op({ op: "scope", id: "h2", until: "2026-09" }),
        op({ op: "scope", id: "h3", until: "2026-09" }),
      ]),
      context(state),
    )!;
    expect(byId(result, "h1").until).toBeNull();
    expect(byId(result, "h2").until).toBe("2026-09");
    expect(byId(result, "h3").until).toBeNull();
    expect(result.rejected).toEqual([
      expect.stringMatching(/^scope h1: needs evidence that it stopped/),
      expect.stringMatching(/^scope h3: status keeps changing/),
    ]);

    // Replacing a hypothesis with a tip may not push the tips over their limit.
    const swap = applyDeep(
      state,
      deep([
        op({ op: "supersede", id: "h2", kind: "tip", text: "Совет вместо гипотезы", why: "x" }),
      ]),
      context(state),
    )!;
    expect(byId(swap, "h2").status).toBe("established");
    expect(swap.rejected[0]).toMatch(/already 4 active tips/);
  });

  it("drops a once-strong belief only while the independent evidence is against it", () => {
    const weakened = belief("h1", "hypothesis", "Прогулки помогают", "weakened", {
      statusAt: NOW - 6 * DAY,
      history: [{ at: NOW - 6 * DAY, text: "Прогулки помогают", status: "established" }],
      // The user has confirmed it since.
      answers: { support: 2, against: 0 },
    });
    const state = stateWith({ memory: memory({ beliefs: [weakened] }) });
    const kept = applyDeep(
      state,
      deep([op({ op: "retire", id: "h1", why: "x" })]),
      context(state),
    )!;
    expect(byId(kept, "h1").status).toBe("weakened");
    expect(kept.rejected[0]).toMatch(/not against it/);
    // Never believed: dropped after the wait without more ado.
    const proposal = { ...weakened, history: [], answers: { support: 0, against: 0 } };
    const plain = stateWith({ memory: memory({ beliefs: [proposal] }) });
    const dropped = applyDeep(plain, deep([op({ op: "retire", id: "h1" })]), context(plain))!;
    expect(byId(dropped, "h1").status).toBe("retired");
  });

  it("lets the records and the user's answers confirm what entries rarely vote on", () => {
    const zone = belief("z1", "zone", "Вечер", "proposed", {
      zone: { weekday: null, from: 20, to: 23 },
      answers: { support: 1, against: 0 },
    });
    const state = stateWith({ memory: memory({ beliefs: [zone] }) });
    // One answer (×2) is enough without a single vote; nothing at all is not.
    const confirmed = applyDeep(state, deep([op({ op: "confirm", id: "z1" })]), context(state))!;
    expect(byId(confirmed, "z1").status).toBe("supported");
    const bare = stateWith({
      memory: memory({ beliefs: [{ ...zone, answers: { support: 0, against: 0 } }] }),
    });
    const refused = applyDeep(bare, deep([op({ op: "confirm", id: "z1" })]), context(bare))!;
    expect(byId(refused, "z1").status).toBe("proposed");
  });

  it("never cites a deleted entry and never reuses an id", () => {
    const kept = entry(2, 21, {}, [{ id: "h7", effect: "support" }]);
    const state = stateWith({ entries: [kept] });
    const result = applyDeep(
      state,
      deep([op({ kind: "hypothesis", text: "Новая гипотеза", cites: ["r1", "r2"] })]),
      // r2 was deleted while the request ran.
      context(state, {
        refs: new Map([
          ["r1", kept.id],
          ["r2", "gone"],
        ]),
      }),
    )!;
    const added = result.memory.beliefs.at(-1)!;
    // h7 is still voted for by an old entry, so the new one gets h8.
    expect(added).toMatchObject({ id: "h8", cites: [kept.id] });
  });

  it("keeps every active belief when the memory is loaded, cutting only old history", () => {
    const history = Array.from({ length: 90 }, (_, n) =>
      belief(`h${n + 10}`, "hypothesis", `Старая ${n}`, "retired", { statusAt: NOW - n * DAY }),
    );
    const active = belief("h200", "hypothesis", "Новая", "proposed");
    const loaded = parseMemory(
      JSON.parse(JSON.stringify(memory({ beliefs: [...history, active] }))),
    )!;
    expect(loaded.beliefs.map((item) => item.id)).toContain("h200");
    expect(loaded.beliefs.filter((item) => item.status === "retired")).toHaveLength(60);
    // The newest history stays.
    expect(loaded.beliefs[0]!.id).toBe("h10");
  });

  it("counts the user's answers and the experiments' results as evidence", () => {
    let state = stateWith({
      questionQueue: [
        { text: "Скука бывает на работе?", kind: "yes_no", options: ["Да", "Нет"], about: "h2" },
      ],
      challenge: {
        ...parseChallenge({ title: "t", description: "d", tip: "p1" }, "c1", NOW)!,
        status: "active",
      },
      memory: memory({
        beliefs: [
          ...memory().beliefs,
          belief("p1", "tip", "Прогулка", "proposed", { when: "any" }),
        ],
      }),
    });
    state = aiReducer(state, { type: "showQuestion", at: NOW });
    state = aiReducer(state, { type: "answerQuestion", answer: "Нет", at: NOW });
    expect(state.memory!.beliefs.find((item) => item.id === "h2")!.answers).toEqual({
      support: 0,
      against: 1,
    });
    expect(state.answers[0]).toMatchObject({ about: "h2", inMemory: false });
    state = aiReducer(state, { type: "finishChallenge", review: "Итог", helped: true });
    expect(state.memory!.beliefs.find((item) => item.id === "p1")!.trials).toEqual({
      helped: 1,
      failed: 0,
    });
  });
});

describe("what goes to ChatGPT", () => {
  const state: AiState = stateWith({
    entries: [
      pending(0, 19, "Новая запись после звонка начальника"),
      ...Array.from({ length: 50 }, (_, index) => entry(index + 1, 21)),
      entry(60, 21, { inMemory: true, text: "Старая запись, уже в памяти" }),
    ],
  });

  it("/entry gets the new text, a short digest and similar episodes — never the history", () => {
    const payload = entryPayload([state.entries[0]!], state.memory, state.entries, NOW);
    expect(payload.entries[0]).toMatchObject({
      n: 1,
      when: `${TODAY} Thu 19:00`,
      outcome: null,
      text: "Новая запись после звонка начальника",
    });
    expect(payload.memory.hypotheses.map((item) => item.id)).toEqual(["h1", "h2"]);
    expect(payload.memory.tags).toEqual(["усталость", "работа"]);
    expect(JSON.stringify(payload)).not.toMatch(/Очень устал|Старая запись/);
    // The independent check: the same texts, nothing of the memory.
    const blind = blindPayload([state.entries[1]!]);
    expect(blind.memory).toEqual({
      profile: null,
      triggers: [],
      zones: [],
      hypotheses: [],
      tips: [],
      corrections: [],
      tags: [],
    });
  });

  it("/deep gets gists instead of texts, a few originals to re-read, and the rules", () => {
    const t = buildTimeline(input({ entries: state.entries }));
    const disputed = state.entries[30]!;
    const { body, refs, reread, sentIds } = deepPayload(state, t, [
      { entry: disputed, reason: "disputed" },
    ]);
    expect(body.newEntries).toHaveLength(MAX_DEEP_ENTRIES);
    expect(sentIds).toHaveLength(MAX_DEEP_ENTRIES);
    expect(body.entriesWaiting).toBe(5);
    expect(body.newEntries[0]).toMatch(
      /\| — \| conf 70 \| усталость, работа \| усталость \| устал/,
    );
    // Only the chosen original goes as text.
    expect(body.reread).toHaveLength(1);
    expect(body.reread[0]).toMatchObject({ why: "disputed", text: TEXT });
    expect(reread.has(body.reread[0]!.ref)).toBe(true);
    expect(refs.get(body.reread[0]!.ref)).toBe(disputed.id);
    const withoutRereads = JSON.stringify({ ...body, reread: [] });
    expect(withoutRereads).not.toMatch(/Очень устал|Старая запись/);
    expect(body.memory!.beliefs[0]).toMatch(/^t1 \| trigger \| supported/);
    expect(body.policy).toEqual({ questions: true, challenge: true });
  });

  it("reuses the analysis of the same words instead of a new request", () => {
    const repeated = pending(
      0,
      22,
      "очень  устал после работы, пришёл домой и сразу открыл ленту!",
    );
    expect(duplicateAnalysis(repeated, [repeated, ...state.entries], "ru")).toMatchObject({
      cause: "усталость",
    });
    const other = pending(0, 22, "Поругался с другом");
    expect(duplicateAnalysis(other, [other, ...state.entries], "ru")).toBeNull();
  });
});

describe("changing the app's language", () => {
  it("translates the reading's cause too, so new readings in the new language still match", () => {
    const seen = entry(1, 21);
    const state = aiReducer(stateWith({ entries: [seen] }), {
      type: "translated",
      language: "en",
      translations: { усталость: "tiredness", работа: "work" },
      yesNo: ["Yes", "No"],
    });
    expect(state.entries[0]!.reading).toMatchObject({
      cause: "tiredness",
      tags: ["tiredness", "work"],
    });
    expect(state.entries[0]!.analysis!.cause).toBe("усталость");
    expect(
      sameReading(state.entries[0]!.reading!, state.entries[0]!.analysis, {
        cause: "tiredness after work",
        tags: [],
        enough: true,
      }),
    ).toBe(true);
  });

  it("keeps the memory marked untranslated when a deep analysis runs before the translation", () => {
    const pendingTranslation = stateWith({ memoryLanguage: "ru" });
    const next = aiReducer(pendingTranslation, {
      type: "deepUpdated",
      at: NOW,
      recordsKey: "k",
      sentEntryIds: [],
      sentAnswerIds: [],
      sentDeleted: 0,
      deletedMeanwhile: [{ date: TODAY, time: "19:00", cause: "скука" }],
      memory: memory(),
      language: "en",
      readIds: [],
      readings: [],
      pivotKey: null,
      questions: [],
      challenge: null,
    });
    expect(next.memoryLanguage).toBe("ru");
    // An entry deleted while that analysis ran is reported to the next one.
    expect(next.deletedSinceDeep).toEqual([{ date: TODAY, time: "19:00", cause: "скука" }]);
  });

  it("keeps stored yes/no answers when loading and reuses an analysis only in its language", () => {
    const meta = sanitizeAiMeta({
      questionQueue: [{ text: "Is it so?", kind: "yes_no", options: ["Yes", "No"], about: null }],
    });
    expect(meta.questionQueue[0]!.options).toEqual(["Yes", "No"]);
    const old = entry(3, 9);
    const again = pending(0, 9);
    expect(duplicateAnalysis(again, [again, old], "ru")).not.toBeNull();
    expect(duplicateAnalysis(again, [again, old], "en")).toBeNull();
  });

  it("translates the coach's own texts once, keeping what happened meanwhile", () => {
    const seen = entry(1, 21, {}, [{ id: "h1", effect: "support" }]);
    let state = stateWith({
      entries: [seen],
      questionQueue: [{ text: "Скука?", kind: "yes_no", options: ["Да", "Нет"], about: "h2" }],
      challenge: parseChallenge({ title: "Прогулка", description: "Вечером" }, "c1", NOW),
    });
    const items = translatable(state);
    expect(items).toEqual(
      expect.arrayContaining(["Главное — вечерняя усталость.", "усталость", "Скука?"]),
    );
    // Nothing the user saw under an entry goes for translation.
    expect(items).not.toContain(seen.analysis!.gist);
    expect(new Set(items).size).toBe(items.length);

    // Meanwhile the user answers and accepts the experiment.
    state = aiReducer(state, { type: "showQuestion", at: NOW });
    state = aiReducer(state, { type: "answerQuestion", answer: "Да", at: NOW });
    state = aiReducer(state, { type: "acceptChallenge", today: TODAY, at: NOW });
    state = aiReducer(state, {
      type: "translated",
      language: "en",
      translations: {
        "Главное — вечерняя усталость.": "Evening tiredness is the main thing.",
        усталость: "Tiredness",
        Прогулка: "A walk",
      },
      yesNo: ["Yes", "No"],
    });
    expect(state.memoryLanguage).toBe("en");
    expect(state.memory!.conclusion).toBe("Evening tiredness is the main thing.");
    expect(state.entries[0]!.reading!.tags).toEqual(["tiredness", "работа"]);
    expect(state.entries[0]!.analysis).toEqual(seen.analysis);
    expect(state.challenge).toMatchObject({ title: "A walk", status: "active" });
    expect(state.memory!.beliefs.find((item) => item.id === "h2")!.answers.support).toBe(1);
  });
});

describe("the on-device sentences follow the app's language", () => {
  it("builds the forecast and the analytics in the current language", () => {
    setLanguage("en");
    try {
      const thin = buildForecast(buildTimeline(input({ slips: [slip(1, 21)] })), null)!;
      expect(thin.headline).toBe(CATALOG.en.ai.forecast.preliminary);
      const analytics = buildAnalytics(
        buildTimeline(input({ slips: [slip(1, 21)] })),
        memory({ conclusion: "" }),
      );
      expect(analytics.conclusion).toBe("Срывы чаще вечером после работы.");
      expect(analytics.dataNote).toBe(CATALOG.en.ai.analytics.fewDays);
    } finally {
      setLanguage("ru");
    }
  });
});

describe("AI reducer", () => {
  const base = stateWith();

  it("keeps each entry's votes in its reading", () => {
    const fresh = pending(0, 9);
    let state = aiReducer(base, { type: "addEntry", entry: fresh });
    state = aiReducer(state, {
      type: "entryAnalyzed",
      id: fresh.id,
      analysis: analysis(),
      votes: [{ id: "h2", effect: "support" }],
    });
    expect(state.entries[0]).toMatchObject({
      status: "done",
      reading: { by: "entry", check: "none", votes: [{ id: "h2", effect: "support" }] },
    });
    // Analyzed once: a late duplicate answer doesn't overwrite it.
    expect(
      aiReducer(state, {
        type: "entryAnalyzed",
        id: fresh.id,
        analysis: analysis({ cause: "x" }),
        votes: [],
      }),
    ).toBe(state);
  });

  it("waits out passing trouble without spending attempts, and stops after three", () => {
    const fresh = pending(0, 9);
    let state = aiReducer(base, { type: "addEntry", entry: fresh });
    state = aiReducer(state, { type: "entryFailed", id: fresh.id, countAttempt: false });
    expect(state.entries[0]!.attempts).toBe(0);
    for (let index = 0; index < 3; index += 1) {
      state = aiReducer(state, { type: "entryFailed", id: fresh.id, countAttempt: true });
    }
    expect(state.entries[0]!.status).toBe("failed");
    state = aiReducer(state, { type: "retryFailed" });
    expect(state.entries[0]).toMatchObject({ status: "pending", attempts: 0 });
  });

  it("takes the deep analysis in: marks what was sent, keeps questions for later", () => {
    const sent = entry(1, 9);
    const later = entry(0, 9);
    let state: AiState = {
      ...base,
      entries: [later, sent],
      deletedSinceDeep: [{ date: TODAY, time: "09:00", cause: null }],
    };
    state = aiReducer(state, {
      type: "deepUpdated",
      at: NOW,
      recordsKey: "k",
      sentEntryIds: [sent.id],
      sentAnswerIds: [],
      sentDeleted: 1,
      deletedMeanwhile: [],
      memory: memory({ conclusion: "Новый вывод" }),
      language: "ru",
      readIds: [],
      readings: [],
      pivotKey: "shift:2026-09-07",
      questions: [
        { text: "Первый?", kind: "yes_no", options: ["Да", "Нет"], about: null },
        { text: "Второй?", kind: "yes_no", options: ["Да", "Нет"], about: null },
      ],
      challenge: parseChallenge({ title: "t", description: "d" }, "c1", NOW),
    });
    expect(state.entries.map((item) => item.inMemory)).toEqual([false, true]);
    expect(state).toMatchObject({
      deepAt: NOW,
      memorySince: NOW,
      deletedSinceDeep: [],
      deepCount: 1,
      pivotsSeen: ["shift:2026-09-07"],
    });
    expect(state.memory!.conclusion).toBe("Новый вывод");
    expect(state.challenge!.id).toBe("c1");

    expect(questionDue(state, NOW)).toBe(true);
    state = aiReducer(state, { type: "showQuestion", at: NOW });
    expect(state.question!.text).toBe("Первый?");
    state = aiReducer(state, { type: "answerQuestion", answer: "Да", at: NOW });
    expect(questionDue(state, NOW + DAY)).toBe(false);
    expect(questionDue(state, NOW + 3 * DAY)).toBe(true);
    expect(state.askedRecently).toEqual(["Первый?"]);
  });

  it("closes an experiment with its result and offers the next one about a week later", () => {
    let state: AiState = {
      ...base,
      challenge: parseChallenge({ title: "t", description: "d" }, "c1", NOW - 8 * DAY),
    };
    state = aiReducer(state, { type: "acceptChallenge", today: TODAY, at: NOW });
    expect(canProposeChallenge(state, NOW)).toBe(false);
    state = aiReducer(state, { type: "finishChallenge", review: "Итог", helped: null });
    expect(state.challenge).toMatchObject({ status: "done", review: "Итог" });
    expect(canProposeChallenge(state, NOW)).toBe(true);
    expect(canProposeChallenge(state, NOW - 3 * DAY)).toBe(false);
  });

  it("forgets deleted entries everywhere and remembers only what the memory took in", () => {
    const seen = entry(2, 9, { inMemory: true });
    const unseen = entry(1, 9);
    let state: AiState = {
      ...base,
      entries: [unseen, seen],
      memory: memory({
        beliefs: [belief("h1", "hypothesis", "x", "supported", { cites: [seen.id, "other"] })],
      }),
    };
    state = aiReducer(state, { type: "deleteEntry", id: unseen.id });
    expect(state.deletedSinceDeep).toEqual([]);
    state = aiReducer(state, { type: "deleteEntry", id: seen.id });
    expect(state.deletedSinceDeep).toEqual([
      { date: addDays(TODAY, -2), time: "09:00", cause: "усталость" },
    ]);
    expect(state.memory!.beliefs[0]!.cites).toEqual(["other"]);
    expect(aiReducer(state, { type: "reset" })).toEqual({
      ...createInitialAiState(),
      consent: true,
    });
  });
});

describe("when to spend a request", () => {
  const empty = { ...createInitialAiState(), consent: true };

  it("starts the memory as soon as there is history, then waits for new data", () => {
    expect(needsDeep(empty, "k", false, NOW)).toBe(false);
    expect(needsDeep(empty, "k", true, NOW)).toBe(true);
    const fresh: AiState = { ...empty, deepAt: NOW, memorySince: NOW, deepRecordsKey: "k" };
    expect(needsDeep(fresh, "k", true, NOW + 30 * DAY)).toBe(false);
  });

  it("rebuilds a grown memory weekly, or early after about 35 new entries", () => {
    expect(DEEP_EARLY_ENTRIES).toBe(35);
    const grown: AiState = {
      ...empty,
      deepAt: NOW,
      memorySince: NOW - 30 * DAY,
      deepRecordsKey: "k",
      entries: Array.from({ length: 34 }, () => entry(0, 9)),
    };
    expect(needsDeep(grown, "k", true, NOW + 4 * DAY)).toBe(false);
    expect(needsDeep(grown, "k", true, NOW + 7 * DAY)).toBe(true);
    const many: AiState = { ...grown, entries: [...grown.entries, entry(0, 10)] };
    expect(needsDeep(many, "k", true, NOW + 2 * DAY)).toBe(false);
    expect(needsDeep(many, "k", true, NOW + 3 * DAY)).toBe(true);
  });

  const simulate = (perDay: number) => {
    let state: AiState = { ...empty };
    const counts = [0, 0];
    const start = NOW - 60 * DAY;
    for (let day = 0; day < 60; day += 1) {
      for (let hour = 8; hour < 24; hour += 1) {
        const now = start + day * DAY + hour * 3_600_000;
        if (hour >= 10 && hour < 10 + perDay) {
          state = { ...state, entries: [entry(0, 0, { timestamp: now }), ...state.entries] };
        }
        if (needsDeep(state, "k", true, now)) {
          counts[day < 30 ? 0 : 1]! += 1;
          state = aiReducer(state, {
            type: "deepUpdated",
            at: now,
            recordsKey: "k",
            sentEntryIds: state.entries.map((item) => item.id),
            sentAnswerIds: [],
            sentDeleted: 0,
            deletedMeanwhile: [],
            memory: memory(),
            language: "ru",
            readIds: [],
            readings: [],
            pivotKey: null,
            questions: [],
            challenge: null,
          });
        }
      }
    }
    return counts;
  };

  it("keeps the deep analysis about weekly for an active user, every few days for a very active one", () => {
    // Three entries a day: a young memory learns more often, then weekly.
    expect(simulate(3)).toEqual([8, 4]);
    // Six a day: 35 entries come in under six days.
    expect(simulate(6)[1]).toBe(6);
    // Ten a day: never more often than every three days.
    expect(simulate(10)[1]).toBeLessThanOrEqual(10);
  });
});

describe("AI storage", () => {
  it("reads the earlier versions' data and keeps what ChatGPT had learned", () => {
    const meta = sanitizeAiMeta({
      consent: true,
      insightsAt: NOW,
      insightsRecordsKey: "k",
      deletedSinceInsights: [{ date: TODAY, time: "09:00", cause: null }],
      memory: {
        summary: "Старая сводка",
        timeline: [{ period: "2026-08", note: "Вечера были тяжелее" }],
        milestones: [{ date: "2026-09-01", note: "Серия 9 дней" }],
        hypotheses: [{ text: "Гипотеза", status: "supported" }],
        openQuestions: [],
      },
      analytics: { conclusion: "Старый вывод", situations: [{ title: "После работы", note: "" }] },
      answers: [
        { questionId: "q", question: "?", answer: "Да", answeredAt: NOW, inInsights: true },
      ],
    });
    expect(meta).toMatchObject({
      deepAt: NOW,
      memorySince: NOW,
      deepRecordsKey: "k",
      deletedSinceDeep: [{ date: TODAY, time: "09:00", cause: null }],
      answers: [{ inMemory: true, about: null }],
      memoryLanguage: "ru",
      deepCount: 0,
    });
    expect(meta.memory).toMatchObject({
      profile: "Старая сводка",
      conclusion: "Старый вывод",
      events: [
        { date: "2026-08", note: "Вечера были тяжелее" },
        { date: "2026-09-01", note: "Серия 9 дней" },
      ],
    });
    expect(meta.memory!.beliefs.map((item) => [item.id, item.kind, item.text])).toEqual([
      ["h1", "hypothesis", "Гипотеза"],
      ["t1", "trigger", "После работы"],
    ]);
    // An entry from before readings: its analysis becomes the first reading, "follows from context".
    const old = sanitizeEntry({
      ...entry(0, 9),
      reading: undefined,
      inMemory: undefined,
      inInsights: true,
    });
    expect(old).toMatchObject({
      inMemory: true,
      reading: { conf: 70, by: "entry", check: "none" },
    });
  });

  it("keeps entries month by month and repairs bad fields", () => {
    const months = groupByMonth([entry(0, 9), entry(20, 9), entry(1, 9)]);
    expect([...months.keys()].sort()).toEqual(["2026-09", "2026-10"]);
    expect(sanitizeEntry({ id: "x", timestamp: NOW, text: "  ", status: "done" })).toBeNull();
    expect(
      sanitizeEntry({
        id: "x",
        timestamp: NOW,
        text: "текст",
        status: "done",
        analysis: { broken: true },
        outcome: "maybe",
      }),
    ).toMatchObject({ status: "pending", outcome: null, analysis: null, reading: null });
    expect(sanitizeAiMeta({ consent: "yes", answers: [{ broken: 1 }] })).toMatchObject({
      consent: null,
      answers: [],
    });
  });

  it("saves only changed months and loads them back", async () => {
    const first: AiState = {
      ...createInitialAiState(),
      consent: true,
      entries: [entry(0, 9), entry(20, 9)],
    };
    await saveAiState(first, null);
    const loaded = await loadAiState();
    expect(loaded.entries.map((item) => item.id)).toEqual(first.entries.map((item) => item.id));
    expect(loaded.entries[0]).toEqual(first.entries[0]);
    expect(loaded.consent).toBe(true);

    const moved = entry(5, 9, { id: "moved" });
    await AsyncStorage.setItem("@stopscroll/ai/entries/2020-01", JSON.stringify([moved]));
    const reloaded = await loadAiState();
    expect(reloaded.entries.map((item) => item.id)).toContain("moved");
    const withoutMoved = {
      ...reloaded,
      entries: reloaded.entries.filter((item) => item.id !== "moved"),
    };
    await saveAiState(withoutMoved, reloaded);
    expect((await loadAiState()).entries.map((item) => item.id)).not.toContain("moved");

    const reset = { ...withoutMoved, entries: [] };
    await saveAiState(reset, withoutMoved);
    const keys = await AsyncStorage.getAllKeys();
    expect(keys.filter((key) => key.startsWith("@stopscroll/ai/entries/"))).toEqual([]);
  });
});
