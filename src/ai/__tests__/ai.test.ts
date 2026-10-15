import { describe, expect, it, jest } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { addDays, dayKey } from "../../utils/date";
import { DEFAULT_SETTINGS } from "../../utils/persistedState";
import type { SlipEntry, WinEntry } from "../../utils/types";
import { buildFacts, partOfDay, recordsKey, type FactsInput } from "../facts";
import {
  parseAnalytics,
  parseChallenge,
  parseEntryAnalysis,
  parseForecast,
  parseQuestion,
} from "../parse";
import { aiReducer, lastChallengeAt } from "../reducer";
import { forecastStale, needsInsights } from "../schedule";
import {
  createInitialAiState,
  groupByMonth,
  loadAiState,
  sanitizeAiMeta,
  sanitizeEntry,
  saveAiState,
} from "../storage";
import type { AiEntry, AiState } from "../types";

jest.mock("@react-native-async-storage/async-storage", () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Thursday 15 October 2026, 20:00.
const NOW = new Date(2026, 9, 15, 20, 0).getTime();
const TODAY = dayKey(NOW);
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
    explanation: "…",
    missing: null,
    tags: ["усталость", "работа"],
    analyzedAt: at(daysAgo, hour, 1),
  },
  inInsights: false,
  ...extra,
});

function input(overrides: Partial<FactsInput> = {}): FactsInput {
  return {
    wins: [],
    winArchive: { count: 0, minutes: 0, replacementCount: 0 },
    slips: [],
    scrollLog: {},
    settings: DEFAULT_SETTINGS,
    entries: [],
    answers: [],
    challenge: null,
    lastQuestionAt: null,
    lastChallengeAt: null,
    now: NOW,
    ...overrides,
  };
}

describe("facts sent to ChatGPT: arithmetic over the whole history", () => {
  // Thursdays: 7, 14 and 21 days ago, each with a late slip.
  const slips = [slip(7, 21), slip(14, 22), slip(21, 21), slip(2, 13)].sort(
    (a, b) => b.timestamp - a.timestamp,
  );
  const entries = [entry(1, 21, { outcome: "opened" }), entry(3, 9, { outcome: "resisted" })];
  const facts = buildFacts(
    input({
      slips,
      wins: [win(1, 12), win(0, 10)],
      entries,
      scrollLog: { [addDays(TODAY, -1)]: 90, [addDays(TODAY, -2)]: 30, [TODAY]: 20 },
    }),
  );

  it("counts by hour and weekday over everything", () => {
    expect(facts.byHour.slips[21]).toBe(2);
    expect(facts.byHour.slips[22]).toBe(1);
    expect(facts.byHour.entries[21]).toBe(1);
    const thursday = facts.byWeekday.allTime.find((day) => day.weekday === "четверг")!;
    expect(thursday).toMatchObject({ observedDays: 3, hardDays: 3, slips: 3 });
  });

  it("gives base rates for today's forecast", () => {
    expect(facts.now).toEqual({ date: TODAY, weekday: "четверг", time: "20:00" });
    expect(facts.baseRates.sameWeekdayHard).toEqual({ part: 3, of: 3 });
    // Of the observed days in the last four weeks, three had a slip at 20:00 or later
    // (and yesterday's entry ended with the feed opened at 21:00).
    expect(facts.baseRates.afterThisHourHard.part).toBe(4);
    expect(facts.baseRates.yesterdayHard).toBe(true);
  });

  it("counts ChatGPT's tags from the entries and today's state", () => {
    expect(facts.causes.entryTags[0]).toEqual({ name: "усталость", count: 2, last30: 2 });
    expect(facts.today).toMatchObject({ feedMinutes: 20, overLimit: false, wins: 1 });
    expect(facts.savedMinutes.today).toBe(15);
    expect(facts.months.map((month) => month.month)).toEqual(["2026-09", "2026-10"]);
  });

  it("keeps questions and experiments rare", () => {
    expect(facts.questionPolicy.allowed).toBe(true);
    const later = buildFacts(
      input({ lastQuestionAt: NOW - 86_400_000, lastChallengeAt: NOW - 3 * 86_400_000 }),
    );
    expect(later.questionPolicy).toEqual({ allowed: false, daysSinceLast: 1 });
    expect(later.challengePolicy).toEqual({ canPropose: false, daysSinceLast: 3 });
  });

  it("compares an experiment's days with the days before it", () => {
    const challenge = {
      ...parseChallenge(
        { title: "Утро без телефона", description: "…", durationDays: 3, focus: "evening" },
        "c1",
        NOW,
      )!,
      status: "reviewing" as const,
      startDay: addDays(TODAY, -3),
      endDay: addDays(TODAY, -1),
    };
    const result = buildFacts(
      input({ slips: [slip(2, 13), slip(5, 21), slip(6, 22)], challenge }),
    ).challenge!;
    expect(result).toMatchObject({
      before: { days: 3, slipsInFocus: 2 },
      during: { days: 3, slipsInFocus: 0 },
    });
  });

  it("counts an experiment only from the moment it was accepted", () => {
    const challenge = {
      ...parseChallenge(
        { title: "t", description: "d", durationDays: 2, focus: "all" },
        "c1",
        NOW,
      )!,
      status: "reviewing" as const,
      startDay: addDays(TODAY, -2),
      endDay: addDays(TODAY, -1),
      startedAt: at(2, 20),
    };
    const result = buildFacts(
      input({ slips: [slip(2, 18), slip(2, 19), slip(1, 22)], challenge }),
    ).challenge!;
    expect(result).toMatchObject({ startedAt: "20:00", during: { slipsInFocus: 1 } });
  });

  it("counts all saved time, however old", () => {
    const old = Array.from({ length: 3 }, (_, index) => win(900 + index, 12));
    expect(
      buildFacts(input({ wins: old, winArchive: { count: 1, minutes: 15, replacementCount: 0 } }))
        .savedMinutes.total,
    ).toBe(60);
  });

  it("notices changes in the records", () => {
    const before = recordsKey({ wins: [], slips: [], scrollLog: {} });
    expect(recordsKey({ wins: [], slips: [slip(0, 9)], scrollLog: {} })).not.toBe(before);
    // Logging or changing the feed time changes it; the date alone does not.
    expect(recordsKey({ wins: [], slips: [], scrollLog: { [TODAY]: 30 } })).not.toBe(before);
    expect(recordsKey({ wins: [], slips: [], scrollLog: { [TODAY]: 30 } })).not.toBe(
      recordsKey({ wins: [], slips: [], scrollLog: { [TODAY]: 45 } }),
    );
    expect(partOfDay(7)).toBe("morning");
    expect(partOfDay(23)).toBe("night");
  });
});

describe("answers from the server are checked before use", () => {
  it("accepts a valid entry analysis and rejects broken ones", () => {
    const analysis = parseEntryAnalysis(
      {
        enough: false,
        cause: null,
        emotion: null,
        context: null,
        behavior: null,
        explanation: "Мало деталей.",
        missing: "что было до",
        tags: ["Скука"],
      },
      NOW,
    );
    expect(analysis).toMatchObject({ enough: false, tags: ["скука"], missing: "что было до" });
    expect(parseEntryAnalysis({ enough: true }, NOW)).toBeNull();
    expect(parseEntryAnalysis("ok", NOW)).toBeNull();
  });

  it("caps lists and clamps numbers without changing the texts", () => {
    const analytics = parseAnalytics({
      conclusion: "Вывод.",
      causes: Array.from({ length: 9 }, (_, index) => ({
        title: `c${index}`,
        share: 140,
        note: "",
      })),
      hypotheses: [
        { text: "Похоже, прогулки помогают.", confidence: "medium" },
        { text: "x", confidence: "sure" },
      ],
      numbers: { headline: "Вы вернули почти четыре часа.", equivalents: ["два фильма"] },
    })!;
    expect(analytics.causes).toHaveLength(5);
    expect(analytics.causes[0]!.share).toBeNull();
    expect(analytics.hypotheses).toEqual([
      { text: "Похоже, прогулки помогают.", confidence: "medium" },
    ]);
    expect(analytics.numbers?.equivalents).toEqual(["два фильма"]);
    expect(parseAnalytics({})).toBeNull();
  });

  it("reads the forecast, the question and the experiment", () => {
    const forecast = parseForecast(
      {
        probability: 82,
        level: "high",
        headline: "Сегодня вероятность — 82%.",
        reasons: ["a"],
        window: { until: "22:00", message: "m" },
        passed: null,
        advice: null,
        basis: "b",
        validUntil: "25:00",
      },
      TODAY,
      NOW,
    )!;
    expect(forecast).toMatchObject({
      probability: 82,
      window: { until: "22:00" },
      validUntil: null,
      day: TODAY,
    });
    expect(
      parseQuestion(
        { text: "Сегодня было сложнее обычного?", kind: "yes_no", options: [] },
        "q1",
        NOW,
      )?.options,
    ).toEqual(["Да", "Нет"]);
    expect(parseQuestion({ text: "?", kind: "choice", options: ["одно"] }, "q1", NOW)).toBeNull();
    expect(
      parseChallenge({ title: "t", description: "d", durationDays: 30, focus: "space" }, "c", NOW),
    ).toMatchObject({
      durationDays: 7,
      focus: "all",
      status: "proposed",
    });
  });
});

describe("AI reducer", () => {
  const base = (): AiState => ({ ...createInitialAiState(), consent: true });

  it("analyzes entries, retries failures and stops after three", () => {
    const pending = { ...entry(0, 19), status: "pending" as const, analysis: null };
    let state = aiReducer(base(), { type: "addEntry", entry: pending });
    for (let attempt = 0; attempt < 3; attempt += 1) {
      state = aiReducer(state, { type: "entryFailed", id: pending.id, countAttempt: true });
    }
    expect(state.entries[0]).toMatchObject({ status: "failed", attempts: 3 });
    state = aiReducer(state, { type: "retryEntry", id: pending.id });
    expect(state.entries[0]).toMatchObject({ status: "pending", attempts: 0 });
  });

  it("takes a question only when none is waiting, and runs the weekly experiment", () => {
    const question = parseQuestion(
      { text: "Что мешало?", kind: "choice", options: ["скука", "стресс"] },
      "q1",
      NOW,
    )!;
    const challenge = parseChallenge(
      { title: "t", description: "d", durationDays: 2, focus: "evening" },
      "c1",
      NOW,
    )!;
    const update = {
      type: "insightsUpdated" as const,
      at: NOW,
      recordsKey: "k",
      sentEntryIds: [],
      sentAnswerIds: [],
      sentDeleted: 0,
      memory: null,
      analytics: parseAnalytics({ conclusion: "Вывод." })!,
      forecast: null,
      question,
      challenge,
      challengeReview: null,
    };
    let state = aiReducer(base(), update);
    expect(state.question?.id).toBe("q1");
    expect(state.lastQuestionAt).toBe(NOW);
    expect(lastChallengeAt(state)).toBe(NOW);

    state = aiReducer(state, { type: "answerQuestion", answer: "стресс", at: NOW + 1 });
    expect(state.question).toBeNull();
    expect(state.answers[0]).toMatchObject({ question: "Что мешало?", answer: "стресс" });

    state = aiReducer(state, { type: "acceptChallenge", today: TODAY, at: NOW });
    expect(state.challenge).toMatchObject({
      status: "active",
      startDay: TODAY,
      endDay: addDays(TODAY, 1),
    });
    state = aiReducer(state, { type: "checkinChallenge", day: TODAY, done: true });
    state = aiReducer(state, { type: "finishChallenge" });
    state = aiReducer(state, {
      ...update,
      question: null,
      challenge: null,
      challengeReview: "Поздних срывов стало на 50% меньше.",
    });
    expect(state.challenge).toMatchObject({
      status: "done",
      review: "Поздних срывов стало на 50% меньше.",
    });

    // A new proposal moves the finished experiment to the history.
    state = aiReducer(state, { ...update, question: null, challenge: { ...challenge, id: "c2" } });
    expect(state.challenge?.id).toBe("c2");
    expect(state.pastChallenges[0]?.id).toBe("c1");
  });

  it("forgets the history on reset but keeps the consent", () => {
    const state = aiReducer({ ...base(), entries: [entry(0, 9)] }, { type: "reset" });
    expect(state.entries).toEqual([]);
    expect(state.consent).toBe(true);
  });
});

describe("AI reducer: sending, failures and deletions", () => {
  const base = (): AiState => ({ ...createInitialAiState(), consent: true });

  it("waits out passing trouble without spending attempts, and retries failed entries on demand", () => {
    const pending = { ...entry(0, 19), status: "pending" as const, analysis: null };
    let state = aiReducer(base(), { type: "addEntry", entry: pending });
    for (let attempt = 0; attempt < 5; attempt += 1) {
      state = aiReducer(state, { type: "entryFailed", id: pending.id, countAttempt: false });
    }
    expect(state.entries[0]).toMatchObject({ status: "pending", attempts: 0 });
    for (let attempt = 0; attempt < 3; attempt += 1) {
      state = aiReducer(state, { type: "entryFailed", id: pending.id, countAttempt: true });
    }
    expect(state.entries[0]!.status).toBe("failed");
    expect(aiReducer(state, { type: "retryFailed" }).entries[0]).toMatchObject({
      status: "pending",
      attempts: 0,
    });
  });

  it("marks what was sent and remembers deleted entries ChatGPT had already seen", () => {
    const seen = entry(1, 21);
    const later = entry(0, 9);
    let state: AiState = { ...base(), entries: [later, seen] };
    state = aiReducer(state, {
      type: "insightsUpdated",
      at: NOW,
      recordsKey: "k",
      sentEntryIds: [seen.id],
      sentAnswerIds: [],
      sentDeleted: 0,
      memory: null,
      analytics: parseAnalytics({ conclusion: "Вывод." })!,
      forecast: null,
      question: null,
      challenge: null,
      challengeReview: null,
    });
    expect(state.entries.map((item) => item.inInsights)).toEqual([false, true]);
    state = aiReducer(state, { type: "deleteEntry", id: seen.id });
    state = aiReducer(state, { type: "deleteEntry", id: later.id });
    // Only the one ChatGPT had seen needs forgetting; the text itself is not kept.
    expect(state.deletedSinceInsights).toEqual([
      { date: addDays(TODAY, -1), time: "21:00", cause: "усталость" },
    ]);
  });
});

describe("when to ask ChatGPT again", () => {
  const forecast = parseForecast(
    { probability: 50, headline: "h", reasons: [], window: {}, basis: "", validUntil: "21:00" },
    TODAY,
    NOW,
  )!;

  it("refreshes the forecast on a new day, with age, after new records and past its time", () => {
    expect(forecastStale(null, null, "k", NOW)).toBe(true);
    expect(forecastStale(forecast, "k", "k", NOW + 5 * 60_000)).toBe(false);
    expect(forecastStale(forecast, "k", "k2", NOW + 5 * 60_000)).toBe(false);
    expect(forecastStale(forecast, "k", "k2", NOW + 15 * 60_000)).toBe(true);
    expect(forecastStale(forecast, "k", "k", NOW + 4 * 3_600_000)).toBe(true);
    expect(forecastStale(forecast, "k", "k", NOW + 75 * 60_000)).toBe(true);
    expect(forecastStale({ ...forecast, day: addDays(TODAY, -1) }, "k", "k", NOW)).toBe(true);
  });

  it("recalculates the analytics after new entries, answers and deletions, and daily for other records", () => {
    const state: AiState = { ...createInitialAiState(), consent: true };
    expect(needsInsights(state, "k", false, NOW)).toBe(false);
    expect(needsInsights(state, "k", true, NOW)).toBe(true);
    const done = { ...state, insightsAt: NOW, insightsRecordsKey: "k" };
    expect(needsInsights(done, "k", true, NOW + 60_000)).toBe(false);
    // Entries go once: sent ones don't trigger, new ones do (whatever the device clock says).
    expect(
      needsInsights(
        { ...done, entries: [entry(0, 19, { inInsights: true })] },
        "k",
        true,
        NOW + 60_000,
      ),
    ).toBe(false);
    expect(needsInsights({ ...done, entries: [entry(0, 23)] }, "k", true, NOW + 60_000)).toBe(true);
    expect(
      needsInsights(
        { ...done, deletedSinceInsights: [{ date: TODAY, time: "19:00", cause: null }] },
        "k",
        true,
        NOW,
      ),
    ).toBe(true);
    // Other records: once a day, and only if they really changed.
    expect(needsInsights(done, "k2", true, NOW + 60_000)).toBe(false);
    expect(needsInsights(done, "k", true, NOW + 86_400_000)).toBe(false);
    expect(needsInsights(done, "k2", true, NOW + 86_400_000)).toBe(true);
  });

  it("asks for an experiment's review once, even if none comes back", () => {
    const challenge = {
      ...parseChallenge(
        { title: "t", description: "d", durationDays: 1, focus: "evening" },
        "c1",
        NOW,
      )!,
      status: "reviewing" as const,
      startDay: addDays(TODAY, -1),
      endDay: addDays(TODAY, -1),
    };
    const state: AiState = {
      ...createInitialAiState(),
      consent: true,
      insightsAt: NOW - 1,
      insightsRecordsKey: "k",
      challenge,
    };
    expect(needsInsights(state, "k", true, NOW)).toBe(true);
    const after = aiReducer(state, {
      type: "insightsUpdated",
      at: NOW,
      recordsKey: "k",
      sentEntryIds: [],
      sentAnswerIds: [],
      sentDeleted: 0,
      memory: null,
      analytics: parseAnalytics({ conclusion: "Вывод." })!,
      forecast: null,
      question: null,
      challenge: null,
      challengeReview: null,
    });
    expect(after.challenge).toMatchObject({ status: "done", review: null });
    expect(needsInsights(after, "k", true, NOW + 1)).toBe(false);
  });
});

describe("AI storage", () => {
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
    const meta = sanitizeAiMeta({
      consent: "yes",
      answers: [{ broken: 1 }],
      forecast: { headline: "h" },
    });
    expect(meta).toMatchObject({ consent: null, answers: [], forecast: null });
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
