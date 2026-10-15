import { describe, expect, it, jest } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { addDays, dayKey } from "../../utils/date";
import { DEFAULT_SETTINGS } from "../../utils/persistedState";
import type { SlipEntry, WinEntry } from "../../utils/types";
import { buildAnalytics, challengeReview } from "../analytics";
import {
  buildTimeline,
  challengeMeasure,
  deepStats,
  partOfDay,
  recordsKey,
  type FactsInput,
} from "../facts";
import { buildForecast } from "../forecast";
import { parseChallenge, parseEntryResult, parseMemory, parseQuestions } from "../parse";
import { MAX_DEEP_ENTRIES, deepPayload, duplicateAnalysis, entryPayload } from "../payload";
import { aiReducer } from "../reducer";
import { canProposeChallenge, needsDeep, questionDue } from "../schedule";
import {
  createInitialAiState,
  groupByMonth,
  loadAiState,
  sanitizeAiMeta,
  sanitizeEntry,
  saveAiState,
} from "../storage";
import type { AiChallenge, AiEntry, AiMemory, AiState } from "../types";

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
const entry = (daysAgo: number, hour: number, extra: Partial<AiEntry> = {}): AiEntry => ({
  id: `e${(ids += 1)}`,
  timestamp: at(daysAgo, hour),
  text: "Очень устал после работы",
  outcome: null,
  status: "done",
  attempts: 0,
  analysis: {
    enough: true,
    cause: "усталость",
    emotion: "опустошённость",
    context: "после работы",
    behavior: "бегство от усталости",
    explanation: null,
    missing: null,
    tags: ["усталость", "работа"],
    gist: "устал после работы, открыл ленту дома",
    analyzedAt: at(daysAgo, hour, 1),
  },
  inMemory: false,
  ...extra,
});
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

const memory = (overrides: Partial<AiMemory> = {}): AiMemory => ({
  profile: "Срывы чаще вечером после работы.",
  triggers: [{ title: "После работы", note: "Дома, сразу после прихода." }],
  emotions: [{ title: "Опустошённость", note: "В вечерних записях." }],
  dangerZones: [],
  strengths: [],
  weaknesses: [],
  tips: [],
  events: [{ date: "2026-09", note: "Самый трудный день сместился на пятницу." }],
  changes: ["Днём стало спокойнее."],
  improvements: [],
  worsenings: [],
  hypotheses: [
    { id: "h1", text: "Прогулки помогают вечером", status: "supported", support: 6, against: 1 },
    { id: "h2", text: "Скука на работе ведёт к ленте", status: "proposed", support: 0, against: 0 },
    { id: "h3", text: "Сон не влияет", status: "weakened", support: 0, against: 3 },
  ],
  conclusion: "Главное — вечерняя усталость.",
  openQuestions: [],
  ...overrides,
});

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
    // Thursdays: three observed, three hard.
    expect(stats.weekdays.allTime[3]).toBe("3/3");
    expect(stats.coverage).toMatchObject({ slips: 4, entries: 2, wins: 12 });
    // All saved time, the archived part included.
    expect(stats.savedMinutes.total).toBe(330);
    // Tags and journal reasons are counted together.
    expect(stats.causes[0]).toMatch(/^усталость 6/);
    expect(JSON.stringify(stats).length).toBeLessThan(3000);
  });

  it("notices changes in the records, not in the date", () => {
    const base = { wins: [win(1, 12)], slips, scrollLog: { [TODAY]: 20 } };
    expect(recordsKey(base)).toBe(recordsKey({ ...base }));
    expect(recordsKey(base)).not.toBe(recordsKey({ ...base, scrollLog: { [TODAY]: 25 } }));
    expect(recordsKey(base)).not.toBe(recordsKey({ ...base, slips: [slip(0, 9), ...slips] }));
  });

  it("measures an experiment only from the moment it was accepted", () => {
    const challenge: AiChallenge = {
      ...(parseChallenge(
        { title: "Телефон вне спальни", description: "…", durationDays: 3, focus: "evening" },
        "c",
        at(4, 9),
      ) as AiChallenge),
      status: "active",
      startDay: addDays(TODAY, -3),
      startedAt: at(3, 20),
      endDay: addDays(TODAY, -1),
    };
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
});

describe("today's forecast, computed on the device", () => {
  it("has nothing to say without history and is honest when there is little", () => {
    expect(buildForecast(buildTimeline(input()), null)).toBeNull();
    const thin = buildForecast(buildTimeline(input({ slips: [slip(1, 21)] })), null)!;
    expect(thin.probability).toBeNull();
    expect(thin.headline).toMatch(/предварительный/);
  });

  it("is higher on a weekday that keeps going wrong, with the reasons in numbers", () => {
    // Every Thursday evening for six weeks a slip; other days calm with the feed logged.
    const scrollLog: Record<string, number> = {};
    for (let days = 1; days <= 42; days += 1) scrollLog[addDays(TODAY, -days)] = 30;
    const thursdays = [7, 14, 21, 28, 35, 42].map((days) => slip(days, 21));
    const morning = new Date(2026, 9, 15, 9, 0).getTime();
    const risky = buildForecast(
      buildTimeline(input({ slips: newest(thursdays), scrollLog, now: morning })),
      null,
    )!;
    const calm = buildForecast(
      buildTimeline(input({ scrollLog, now: morning })),
      memory({ tips: [{ text: "Прогулка после работы", when: "any" }] }),
    )!;
    expect(risky.probability!).toBeGreaterThan(calm.probability!);
    expect(risky.reasons.join(" ")).toMatch(/6 из последних шести четвергов были трудными/);
    expect(risky.window.until).toBe("00:00");
    expect(calm.level).toBe("low");
    expect(calm.advice).toBe("Прогулка после работы");
    expect(calm.basis).toMatch(/^история за 42\sдня$/);
  });

  it("says when the dangerous time has passed calmly, and uses the memory's dangerous periods", () => {
    const scrollLog: Record<string, number> = {};
    for (let days = 1; days <= 20; days += 1) scrollLog[addDays(TODAY, -days)] = 30;
    const slips = newest([1, 2, 4, 6, 8, 9].map((days) => slip(days, 14)));
    const forecast = buildForecast(
      buildTimeline(input({ slips, scrollLog })),
      memory({
        dangerZones: [
          {
            title: "Вечер четверга",
            note: "По четвергам после планёрки тянет в ленту.",
            weekday: 3,
            from: 19,
            to: 23,
          },
        ],
      }),
    )!;
    expect(forecast.passed).toMatch(/уже позади/);
    expect(forecast.reasons).toContain("По четвергам после планёрки тянет в ленту.");
  });
});

describe("analytics: the memory's conclusions + numbers from the device", () => {
  const scrollLog: Record<string, number> = {};
  for (let days = 0; days <= 30; days += 1) scrollLog[addDays(TODAY, -days)] = days < 7 ? 40 : 80;
  const entries = [
    ...Array.from({ length: 6 }, (_, index) => entry(index + 1, 21)),
    ...Array.from({ length: 3 }, (_, index) =>
      entry(index + 1, 13, {
        analysis: { ...entry(0, 0).analysis!, tags: ["скука"] },
      }),
    ),
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
    expect(analytics.longTerm).toContain("2026-09: Самый трудный день сместился на пятницу.");
  });

  it("takes situations, hypotheses and the conclusion from the memory", () => {
    expect(analytics.conclusion).toBe("Главное — вечерняя усталость.");
    expect(analytics.situations[0]!.title).toBe("После работы");
    expect(analytics.habitChanges).toEqual(["Днём стало спокойнее."]);
    // Votes from single entries raise the confidence; weakened ones are not shown.
    expect(analytics.hypotheses).toEqual([
      { text: "Прогулки помогают вечером", confidence: "high" },
      { text: "Скука на работе ведёт к ленте", confidence: "low" },
    ]);
  });
});

describe("answers from the server are checked before use", () => {
  it("reads an entry result: no obvious explanation, a gist, votes", () => {
    const result = parseEntryResult(
      {
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
        votes: [
          { id: "h1", effect: "support" },
          { id: "h2", effect: "maybe" },
        ],
      },
      NOW,
    )!;
    expect(result.analysis).toMatchObject({
      cause: "Усталость",
      explanation: null,
      tags: ["усталость", "работа"],
      gist: "Пришёл без сил, открыл ленту",
    });
    expect(result.votes).toEqual([{ id: "h1", effect: "support" }]);
    expect(parseEntryResult({ n: 1 }, NOW)).toBeNull();
  });

  it("keeps hypothesis ids and votes across a rebuild, and gives new ones new ids", () => {
    const previous = memory();
    const rebuilt = parseMemory(
      {
        ...previous,
        hypotheses: [
          { id: "h1", text: "Прогулки помогают вечером", status: "supported" },
          { id: null, text: "Новая гипотеза", status: "proposed" },
          { id: "h99", text: "Выдуманный id", status: "proposed" },
        ],
      },
      previous,
    )!;
    expect(rebuilt.hypotheses.map((item) => [item.id, item.support])).toEqual([
      ["h1", 6],
      ["h4", 0],
      ["h5", 0],
    ]);
    expect(parseMemory({ profile: "", conclusion: "" })).toBeNull();
  });

  it("reads questions and the experiment", () => {
    expect(
      parseQuestions([
        { text: "Вы ложитесь после полуночи?", kind: "yes_no", options: [] },
        { text: "Что обычно перед этим?", kind: "choice", options: ["Работа"] },
      ]),
    ).toEqual([{ text: "Вы ложитесь после полуночи?", kind: "yes_no", options: ["Да", "Нет"] }]);
    expect(
      parseChallenge({ title: "t", description: "d", durationDays: 30, focus: "x" }, "c", NOW),
    ).toMatchObject({ durationDays: 7, focus: "all", status: "proposed" });
  });
});

describe("what goes to ChatGPT", () => {
  const state: AiState = {
    ...createInitialAiState(),
    consent: true,
    memory: memory(),
    entries: [
      entry(0, 19, { status: "pending", analysis: null, text: "Новая запись" }),
      ...Array.from({ length: 45 }, (_, index) => entry(index + 1, 21)),
      entry(50, 21, { inMemory: true, text: "Старая запись, уже в памяти" }),
    ],
  };

  it("/entry gets the new text and a short digest of the memory — never the history", () => {
    const payload = entryPayload([state.entries[0]!], state.memory, state.entries);
    expect(payload.entries).toEqual([
      { n: 1, when: `${TODAY} чт 19:00`, outcome: null, text: "Новая запись" },
    ]);
    expect(payload.memory.hypotheses.map((item) => item.id)).toEqual(["h1", "h2"]);
    expect(payload.memory.tags).toEqual(["усталость", "работа"]);
    expect(JSON.stringify(payload)).not.toMatch(/Очень устал/);
  });

  it("/deep gets gists instead of texts, each entry once, and the rules for questions", () => {
    const body = deepPayload(state, buildTimeline(input({ entries: state.entries })));
    expect(body.newEntries).toHaveLength(MAX_DEEP_ENTRIES);
    expect(body.olderEntriesNotSent).toBe(5);
    expect(body.newEntries[0]).toMatch(
      /\| — \| усталость, работа \| усталость \| устал после работы/,
    );
    expect(JSON.stringify(body)).not.toMatch(/Очень устал|Старая запись/);
    expect(body.memory!.hypotheses[0]).toMatchObject({ id: "h1", votes: "+6 −1" });
    expect(body.policy).toEqual({ questions: true, challenge: true });
  });

  it("reuses the analysis of the same words instead of a new request", () => {
    const repeated = entry(0, 22, {
      status: "pending",
      analysis: null,
      text: "очень  устал после работы!",
    });
    expect(duplicateAnalysis(repeated, [repeated, ...state.entries])).toMatchObject({
      cause: "усталость",
    });
    const other = entry(0, 22, { status: "pending", analysis: null, text: "Поругался с другом" });
    expect(duplicateAnalysis(other, [other, ...state.entries])).toBeNull();
  });
});

describe("AI reducer", () => {
  const base: AiState = { ...createInitialAiState(), consent: true, memory: memory() };

  it("counts votes on the hypotheses with each analyzed entry", () => {
    const pending = entry(0, 9, { status: "pending", analysis: null });
    let state = aiReducer(base, { type: "addEntry", entry: pending });
    state = aiReducer(state, {
      type: "entryAnalyzed",
      id: pending.id,
      analysis: entry(0, 9).analysis!,
      votes: [
        { id: "h2", effect: "support" },
        { id: "h1", effect: "against" },
      ],
    });
    expect(state.entries[0]!.status).toBe("done");
    expect(state.memory!.hypotheses.map((item) => [item.support, item.against])).toEqual([
      [6, 2],
      [1, 0],
      [0, 3],
    ]);
  });

  it("waits out passing trouble without spending attempts, and stops after three", () => {
    const pending = entry(0, 9, { status: "pending", analysis: null });
    let state = aiReducer(base, { type: "addEntry", entry: pending });
    state = aiReducer(state, { type: "entryFailed", id: pending.id, countAttempt: false });
    expect(state.entries[0]!.attempts).toBe(0);
    for (let index = 0; index < 3; index += 1) {
      state = aiReducer(state, { type: "entryFailed", id: pending.id, countAttempt: true });
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
      memory: memory({ conclusion: "Новый вывод" }),
      questions: [
        { text: "Первый?", kind: "yes_no", options: ["Да", "Нет"] },
        { text: "Второй?", kind: "yes_no", options: ["Да", "Нет"] },
      ],
      challenge: parseChallenge({ title: "t", description: "d" }, "c1", NOW),
    });
    expect(state.entries.map((item) => item.inMemory)).toEqual([false, true]);
    expect(state).toMatchObject({ deepAt: NOW, memorySince: NOW, deletedSinceDeep: [] });
    expect(state.memory!.conclusion).toBe("Новый вывод");
    expect(state.challenge!.id).toBe("c1");

    // Questions come one at a time, at most every three days.
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
    state = aiReducer(state, { type: "finishChallenge", review: "Итог" });
    expect(state.challenge).toMatchObject({ status: "done", review: "Итог" });
    expect(canProposeChallenge(state, NOW)).toBe(true);
    expect(canProposeChallenge(state, NOW - 3 * DAY)).toBe(false);
  });

  it("remembers deleted entries only if the memory already took them in, and resets", () => {
    const seen = entry(2, 9, { inMemory: true });
    const unseen = entry(1, 9);
    let state: AiState = { ...base, entries: [unseen, seen] };
    state = aiReducer(state, { type: "deleteEntry", id: unseen.id });
    expect(state.deletedSinceDeep).toEqual([]);
    state = aiReducer(state, { type: "deleteEntry", id: seen.id });
    expect(state.deletedSinceDeep).toEqual([
      { date: addDays(TODAY, -2), time: "09:00", cause: "усталость" },
    ]);
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
    // Nothing new — no request, however long ago.
    expect(needsDeep(fresh, "k", true, NOW + 30 * DAY)).toBe(false);
  });

  it("rebuilds a young memory every few days, a grown one weekly or after many entries", () => {
    const young: AiState = {
      ...empty,
      deepAt: NOW,
      memorySince: NOW,
      deepRecordsKey: "k",
      entries: [entry(0, 9), entry(0, 10), entry(0, 11)],
    };
    expect(needsDeep(young, "k", true, NOW + 0.5 * DAY)).toBe(false);
    // The day after the first one — once, then every three days.
    expect(needsDeep(young, "k", true, NOW + DAY)).toBe(true);
    const second: AiState = { ...young, deepAt: NOW + DAY };
    expect(needsDeep(second, "k", true, NOW + 2 * DAY)).toBe(false);
    expect(needsDeep(second, "k", true, NOW + 4 * DAY)).toBe(true);
    const grown: AiState = { ...young, memorySince: NOW - 30 * DAY };
    expect(needsDeep(grown, "k", true, NOW + 6 * DAY)).toBe(false);
    expect(needsDeep(grown, "k", true, NOW + 7 * DAY)).toBe(true);
    const many: AiState = {
      ...grown,
      entries: Array.from({ length: 25 }, (_, index) => entry(0, index % 24)),
    };
    expect(needsDeep(many, "k", true, NOW + 3 * DAY)).toBe(true);
  });

  it("keeps active use to a few light requests a day and about one deep one a week", () => {
    // Three entries a day, the app opened eight times a day, for two months.
    let state: AiState = { ...empty };
    let entryRequests = 0;
    const deep = [0, 0];
    const start = NOW - 60 * DAY;
    for (let day = 0; day < 60; day += 1) {
      for (let hour = 8; hour < 24; hour += 2) {
        const now = start + day * DAY + hour * 3_600_000;
        if (hour % 4 === 0 && hour >= 12) {
          state = { ...state, entries: [entry(0, 0, { timestamp: now }), ...state.entries] };
          entryRequests += 1;
        }
        if (needsDeep(state, "k", true, now)) {
          deep[day < 30 ? 0 : 1]! += 1;
          state = aiReducer(state, {
            type: "deepUpdated",
            at: now,
            recordsKey: "k",
            sentEntryIds: state.entries.map((item) => item.id),
            sentAnswerIds: [],
            sentDeleted: 0,
            memory: memory(),
            questions: [],
            challenge: null,
          });
        }
      }
    }
    expect(entryRequests).toBe(180);
    // The first month a young memory learns more often; after that — weekly.
    expect(deep).toEqual([8, 4]);
  });
});

describe("AI storage", () => {
  it("reads the earlier version's data and keeps what ChatGPT had learned", () => {
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
      forecast: { headline: "h" },
      answers: [
        { questionId: "q", question: "?", answer: "Да", answeredAt: NOW, inInsights: true },
      ],
    });
    expect(meta).toMatchObject({
      deepAt: NOW,
      memorySince: NOW,
      deepRecordsKey: "k",
      deletedSinceDeep: [{ date: TODAY, time: "09:00", cause: null }],
      answers: [{ inMemory: true }],
    });
    expect(meta.memory).toMatchObject({
      profile: "Старая сводка",
      conclusion: "Старый вывод",
      triggers: [{ title: "После работы", note: "" }],
      events: [
        { date: "2026-08", note: "Вечера были тяжелее" },
        { date: "2026-09-01", note: "Серия 9 дней" },
      ],
      hypotheses: [{ id: "h1", text: "Гипотеза", status: "supported", support: 0, against: 0 }],
    });
    expect(meta).not.toHaveProperty("forecast");
    expect(sanitizeEntry({ ...entry(0, 9), inMemory: undefined, inInsights: true })).toMatchObject({
      inMemory: true,
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
    ).toMatchObject({ status: "pending", outcome: null, analysis: null });
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
    expect(loaded.consent).toBe(true);

    // An entry stored under another month key (an older version, another time zone) is found
    // and removed from where it really is.
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
