import { describe, expect, it } from "@jest/globals";

import { addDays, dayKey } from "../../utils/date";
import { DEFAULT_SETTINGS } from "../../utils/persistedState";
import type { CoachLogEntry, SlipEntry, TriggerId, WinEntry } from "../../utils/types";
import { ADVICE_RULES, chooseAdvice } from "../advice";
import { buildBriefing } from "../briefing";
import { type CoachInput, buildHistory } from "../history";
import { buildInsights } from "../insights";
import { findTimePattern, findTopReason, recurringHardWeekday } from "../patterns";
import { isFaithfulPhrasing } from "../phrasing";
import { buildReflection } from "../reflection";
import { pickReplacement } from "../replacement";
import { buildWeeklyReview } from "../weeklyReview";

// Wednesday 14 October 2026, 10:00.
const NOW = new Date(2026, 9, 14, 10, 0).getTime();
const TODAY = dayKey(NOW);
const at = (daysAgo: number, hour: number, minute = 0) => {
  const date = new Date(2026, 9, 14 - daysAgo, hour, minute);
  return date.getTime();
};

let ids = 0;
const slip = (daysAgo: number, hour: number, trigger: TriggerId | null = null): SlipEntry => ({
  id: `s${(ids += 1)}`,
  timestamp: at(daysAgo, hour),
  trigger,
  app: "tiktok",
  minutesLost: 20,
  note: "",
});
const win = (daysAgo: number, hour: number, extra: Partial<WinEntry> = {}): WinEntry => ({
  id: `w${(ids += 1)}`,
  timestamp: at(daysAgo, hour),
  minutesSaved: 15,
  source: "sos",
  ...extra,
});

function input(overrides: Partial<CoachInput> = {}): CoachInput {
  return {
    wins: [],
    slips: [],
    scrollLog: {},
    settings: DEFAULT_SETTINGS,
    coachLog: [],
    now: NOW,
    ...overrides,
  };
}

/** Every day of the last `days` logged at `minutes`. */
function log(days: number, minutes: number | ((daysAgo: number) => number)) {
  return Object.fromEntries(
    Array.from({ length: days }, (_, index) => [
      addDays(TODAY, -(index + 1)),
      typeof minutes === "number" ? minutes : minutes(index + 1),
    ]),
  );
}

const FORBIDDEN = /\b(AI|ИИ|GPT|LLM|Claude)\b|искусствен|нейросет/i;

describe("coach: honesty while learning", () => {
  it("says it is still collecting data instead of guessing", () => {
    const briefing = buildBriefing(input({ scrollLog: log(2, 40) }));
    expect(briefing.learning).toEqual({ activeDays: 2, needed: 5 });
    expect(briefing.risk).toBeNull();
    expect(briefing.riskReason).toBeNull();
    expect(briefing.insights).toEqual([]);
    expect(briefing.advice.id).toBe("log-today");
  });
});

describe("coach: patterns", () => {
  it("finds that slips cluster late in the evening", () => {
    const slips = [slip(1, 22), slip(3, 23), slip(5, 21), slip(8, 22), slip(9, 14)];
    expect(findTimePattern(slips)).toEqual({ kind: "after", hour: 21, count: 4, total: 5 });
  });

  it("finds the main reason only among explained slips", () => {
    const slips = [
      slip(1, 22, "fatigue"),
      slip(2, 22, "fatigue"),
      slip(3, 12, "boredom"),
      slip(4, 22),
    ];
    expect(findTopReason(slips)).toEqual({ trigger: "fatigue", count: 2, total: 3 });
    expect(findTopReason([slip(1, 22, "fatigue"), slip(2, 9)])).toBeNull();
  });

  it("remembers that the same weekday was the hardest several weeks in a row", () => {
    // Sundays (4, 11 and 18 October are Sundays: 3, 10, 17 days ago).
    const slips = [
      slip(3, 21),
      slip(3, 22),
      slip(10, 21),
      slip(10, 22),
      slip(17, 21),
      slip(17, 22),
    ];
    const history = buildHistory(input({ slips, scrollLog: log(28, 30) }));
    expect(recurringHardWeekday(history)).toEqual({ index: 6, weeks: 3 });
    const insights = buildInsights(history);
    expect(insights.map((insight) => insight.text)).toContain(
      "Это уже третья неделя подряд, когда воскресенье остаётся самым тяжёлым днём.",
    );
  });

  it("notices when walks are followed by no slips", () => {
    const wins = [3, 6, 9, 12].map((daysAgo) =>
      win(daysAgo, 18, { source: "replacement", replacementId: "walk-3" }),
    );
    const history = buildHistory(input({ wins, slips: [slip(2, 22)], scrollLog: log(20, 40) }));
    const walk = buildInsights(history).find((insight) => insight.id === "walk-effect");
    expect(walk?.text).toBe(
      "За последние четыре недели было 4\u00a0прогулки — и ни после одной в ближайшие три часа не случилось срыва.",
    );
  });
});

describe("coach: daily briefing", () => {
  it("rates the day as high risk from real signals and explains why", () => {
    const briefing = buildBriefing(
      input({
        slips: [
          slip(1, 22, "fatigue"),
          slip(2, 23, "fatigue"),
          slip(5, 22, "fatigue"),
          slip(6, 21, "boredom"),
        ],
        scrollLog: { ...log(14, (daysAgo) => (daysAgo <= 2 ? 120 : 40)), [TODAY]: 80 },
      }),
    );
    expect(briefing.learning).toBeNull();
    expect(briefing.risk).toBe("high");
    expect(briefing.riskReason).toBe("Сегодня лимит уже исчерпан: 1 ч 20 мин из 1 ч.");
    // Fatigue late in the evening → the advice is about sleep, not a random tip.
    expect(briefing.advice.id).toBe("early-sleep");
  });

  it("rates a calm streak as low risk", () => {
    const briefing = buildBriefing(input({ scrollLog: log(14, 30) }));
    expect(briefing.risk).toBe("low");
    expect(briefing.riskReason).toBe("14 дней подряд ты держишься в пределах лимита.");
    expect(briefing.advice.id).toBe("keep-rhythm");
  });

  it("looks back at yesterday's advice", () => {
    const coachLog: CoachLogEntry[] = [
      { day: addDays(TODAY, -1), risk: "high", advice: "phone-away-evening" },
    ];
    const worked = buildBriefing(input({ scrollLog: log(14, 30), coachLog }));
    expect(worked.memory).toBe("Вчерашний совет сработал: вечер прошёл без срывов.");

    const missed = buildBriefing(input({ scrollLog: log(14, 30), coachLog, slips: [slip(1, 22)] }));
    expect(missed.memory).not.toBeNull();
    expect(missed.memory).not.toContain("сработал");
  });

  it("repeats advice that worked and rests advice that didn't", () => {
    const context = {
      day: TODAY,
      risk: "medium" as const,
      reason: "boredom" as const,
      timePattern: null,
      walksHelp: true,
      replacementsHelp: false,
      todayLogged: true,
      hour: 10,
      mainApp: "tiktok" as const,
      learning: false,
    };
    expect(chooseAdvice(context, []).id).toBe("walk-instead");
    expect(chooseAdvice(context, [{ advice: "walk-instead", outcome: "missed" }]).id).toBe(
      "living-alternative",
    );
  });

  it("never names the technology behind it", () => {
    const briefing = buildBriefing(
      input({
        slips: [slip(1, 22, "stress"), slip(2, 22, "stress"), slip(4, 13, "boredom")],
        scrollLog: log(20, (daysAgo) => (daysAgo % 3 === 0 ? 90 : 40)),
      }),
    );
    const texts = [
      briefing.riskReason ?? "",
      briefing.advice.text,
      briefing.memory ?? "",
      ...briefing.insights.map((insight) => insight.text),
      ...ADVICE_RULES.map((rule) =>
        rule.text(
          {
            day: TODAY,
            risk: "high",
            reason: null,
            timePattern: null,
            walksHelp: true,
            replacementsHelp: true,
            todayLogged: false,
            hour: 20,
            mainApp: "reels",
            learning: false,
          },
          (options) => options[0]!,
        ),
      ),
    ];
    for (const text of texts) expect(text).not.toMatch(FORBIDDEN);
  });
});

describe("coach: weekly review", () => {
  const data = (slips: SlipEntry[], scrollLog: Record<string, number>, wins: WinEntry[] = []) => ({
    wins,
    slips,
    scrollLog,
    settings: DEFAULT_SETTINGS,
  });
  // Report week: Monday 5 – Sunday 11 October (9…3 days ago); the week before: 28 Sep – 4 Oct.
  it("writes five human sections from the numbers", () => {
    const slips = [
      slip(4, 22, "boredom"), // Saturday 10th
      slip(8, 21, "fatigue"), // Tuesday 6th
      slip(12, 22, "boredom"),
      slip(13, 22, "boredom"),
      slip(14, 23, "boredom"),
      slip(15, 22, "fatigue"),
    ];
    const scrollLog = log(20, (daysAgo) => (daysAgo >= 10 ? 90 : 45));
    const wins = [win(5, 18), win(6, 18), win(7, 18, { source: "replacement" })];
    const review = buildWeeklyReview(data(slips, scrollLog, wins), "2026-10-05", NOW)!;
    expect(review.map((section) => section.id)).toEqual(["good", "worse", "habit", "weak", "next"]);
    const byId = Object.fromEntries(review.map((section) => [section.id, section.text]));
    expect(byId.good).toContain("Эта неделя вернула тебе 45 минут.");
    expect(byId.habit).toBe("Вечерняя привычка: после 21:00 — 2 срыва против 4 неделей раньше.");
    expect(byId.weak).toContain("около 21:00");
    expect(byId.next).toMatch(/цель: \d из 7 дней в пределах лимита\.$/);
    for (const section of review) expect(section.text).not.toMatch(FORBIDDEN);
  });

  it("says nothing about an empty week", () => {
    expect(buildWeeklyReview(data([], {}), "2026-10-05", NOW)).toBeNull();
  });
});

describe("coach: after a slip", () => {
  it("answers calmly, counts the same reason and offers a replacement", () => {
    const earlier = [slip(3, 22, "fatigue"), slip(6, 22, "fatigue")];
    const current = slip(0, 23, null);
    const reflection = buildReflection(current, "fatigue", [current, ...earlier], false);
    expect(reflection.text).toContain(
      "Это уже третий раз за две недели, когда причина — усталость.",
    );
    expect(reflection.text).toContain("Поздний вечер и усталость");
    expect(reflection.text).not.toMatch(FORBIDDEN);
    expect(reflection.replacementId).toBeDefined();
  });
});

describe("coach: replacement of the day", () => {
  it("prefers what already helped, then what fits the main reason", () => {
    const helped = [2, 5, 8].map((daysAgo) =>
      win(daysAgo, 12, { source: "replacement", replacementId: "squats" }),
    );
    const history = buildHistory(input({ wins: helped, scrollLog: log(10, 30) }));
    expect(pickReplacement(history, false)).toEqual({
      replacement: expect.objectContaining({ id: "squats" }),
      why: "Уже 3\u00a0раза после неё обходилось без срывов.",
    });

    const lonely = buildHistory(
      input({
        slips: [slip(1, 22, "loneliness"), slip(2, 22, "loneliness"), slip(3, 9, "boredom")],
      }),
    );
    const pick = pickReplacement(lonely, false);
    expect(pick.replacement.triggers).toContain("loneliness");
    expect(pick.why).toBe("Подходит, когда причина — одиночество: у тебя так бывает чаще всего.");
  });

  it("doesn't invent a reason without data", () => {
    expect(pickReplacement(buildHistory(input()), false).why).toBeNull();
  });
});

describe("coach: rephrasing guard", () => {
  const original = "Во вторник у тебя чаще всего бывают трудные дни: 3 из последних 4 вторников.";
  it("accepts a faithful rewording", () => {
    expect(
      isFaithfulPhrasing(
        original,
        "Вторник для тебя обычно непростой: трудными были 3 из последних 4.",
      ),
    ).toBe(true);
  });
  it("rejects changed facts, hype and the technology", () => {
    expect(isFaithfulPhrasing(original, "Во вторник трудно: 2 из последних 4 вторников.")).toBe(
      false,
    );
    expect(isFaithfulPhrasing(original, "В среду трудно: 3 из последних 4 сред, держись.")).toBe(
      false,
    );
    expect(isFaithfulPhrasing(original, "Вторники трудные: 3 из 4! Ты справишься!")).toBe(false);
    expect(isFaithfulPhrasing(original, "По данным ИИ, вторник трудный: 3 из последних 4.")).toBe(
      false,
    );
    expect(isFaithfulPhrasing(original, null)).toBe(false);
    expect(isFaithfulPhrasing(original, "Вторник.")).toBe(false);
  });
  it("doesn't mistake «в среднем» for a weekday", () => {
    const text = "В среднем 40 мин ленты в день против 55 мин.";
    expect(isFaithfulPhrasing(text, "Теперь в среднем 40 мин ленты в день, а было 55 мин.")).toBe(
      true,
    );
  });
});
