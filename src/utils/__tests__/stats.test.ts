import { describe, expect, it } from "@jest/globals";

import { addDays, dayKey, formatMinutes, weekdayIndex } from "../date";
import {
  averageMinutes,
  compareScroll,
  computeEquivalents,
  countControlledDays,
  getBestStreak,
  getCurrentStreak,
  getDayStatus,
  getHeatmap,
  getTrend,
  summarizeWins,
} from "../stats";
import type { WinEntry } from "../types";

const TODAY = "2026-10-11"; // a Sunday
const day = (offset: number) => addDays(TODAY, offset);

describe("date helpers", () => {
  it("does calendar arithmetic across month and year boundaries", () => {
    expect(addDays("2026-10-01", -1)).toBe("2026-09-30");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
  });

  it("formats minutes the Russian way", () => {
    expect(formatMinutes(0)).toBe("0 мин");
    expect(formatMinutes(45)).toBe("45 мин");
    expect(formatMinutes(180)).toBe("3 ч");
    expect(formatMinutes(150)).toBe("2 ч 30 мин");
  });

  it("indexes weekdays from Monday", () => {
    expect(weekdayIndex("2026-10-05")).toBe(0);
    expect(weekdayIndex(TODAY)).toBe(6);
  });
});

describe("scroll comparison", () => {
  it("shows the drop from yesterday and from the baseline", () => {
    const result = compareScroll({ [day(-1)]: 180, [TODAY]: 30 }, TODAY, 240);
    expect(result).toMatchObject({
      today: 30,
      yesterday: 180,
      deltaMinutes: -150,
      deltaPercent: -83,
      baselinePercent: -88,
    });
  });

  it("returns nulls when a day is missing", () => {
    const result = compareScroll({ [TODAY]: 30 }, TODAY, 180);
    expect(result.yesterday).toBeNull();
    expect(result.deltaMinutes).toBeNull();
    expect(result.deltaPercent).toBeNull();
  });

  it("builds an oldest-first trend and averages only logged days", () => {
    const trend = getTrend({ [day(-2)]: 60, [TODAY]: 30 }, TODAY, 3);
    expect(trend).toEqual([
      { key: day(-2), minutes: 60 },
      { key: day(-1), minutes: null },
      { key: TODAY, minutes: 30 },
    ]);
    expect(averageMinutes(trend)).toBe(45);
    expect(averageMinutes(getTrend({}, TODAY, 7))).toBeNull();
  });
});

describe("streaks", () => {
  const limit = 60;

  it("classifies days against the limit", () => {
    expect(getDayStatus(undefined, limit)).toBe("empty");
    expect(getDayStatus(30, limit)).toBe("great");
    expect(getDayStatus(60, limit)).toBe("ok");
    expect(getDayStatus(61, limit)).toBe("over");
  });

  it("does not break the chain while today is not logged yet", () => {
    const log = { [day(-3)]: 90, [day(-2)]: 40, [day(-1)]: 60 };
    expect(getCurrentStreak(log, limit, TODAY)).toBe(2);
    expect(getCurrentStreak({ ...log, [TODAY]: 10 }, limit, TODAY)).toBe(3);
    expect(getCurrentStreak({ ...log, [TODAY]: 100 }, limit, TODAY)).toBe(0);
  });

  it("finds the best run of consecutive controlled days", () => {
    const log = {
      [day(-9)]: 10,
      [day(-8)]: 10,
      [day(-7)]: 10,
      [day(-6)]: 200,
      [day(-5)]: 10,
      // day(-4) not logged: a gap breaks the run
      [day(-3)]: 10,
      [day(-2)]: 10,
    };
    expect(getBestStreak(log, limit)).toBe(3);
    expect(getBestStreak({}, limit)).toBe(0);
  });

  it("counts controlled days in a window", () => {
    const log = { [day(-1)]: 30, [day(-2)]: 120, [TODAY]: 60 };
    expect(countControlledDays(log, limit, TODAY, 7)).toEqual({ controlled: 2, logged: 3 });
  });

  it("lays the heatmap out as Monday-first weeks ending this week", () => {
    const weeks = getHeatmap({ [TODAY]: 20, [day(-1)]: 300 }, limit, TODAY, 2);
    expect(weeks).toHaveLength(2);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(weeks[0]![0]!.key).toBe("2026-09-28");
    const last = weeks[1]!;
    expect(last[6]).toMatchObject({ key: TODAY, status: "great", isToday: true });
    expect(last[5]).toMatchObject({ status: "over", minutes: 300 });
    expect(last[0]).toMatchObject({ status: "empty", minutes: null });
  });

  it("pads future days of the current week", () => {
    const wednesday = "2026-10-07";
    const week = getHeatmap({}, limit, wednesday, 1)[0]!;
    expect(week.map((cell) => cell.status)).toEqual([
      "empty",
      "empty",
      "empty",
      "future",
      "future",
      "future",
      "future",
    ]);
  });
});

describe("saved time", () => {
  const at = (key: string, hour = 12) => {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y!, m! - 1, d!, hour).getTime();
  };
  const win = (id: string, key: string, minutes = 15): WinEntry => ({
    id,
    timestamp: at(key),
    minutesSaved: minutes,
    source: "sos",
  });

  it("summarizes today, the last 7 days and all time", () => {
    const summary = summarizeWins(
      [win("a", TODAY), win("b", TODAY, 20), win("c", day(-6)), win("d", day(-7))],
      { count: 10, minutes: 150, replacementCount: 3 },
      TODAY,
    );
    expect(summary).toEqual({
      todayMinutes: 35,
      todayWins: 2,
      weekMinutes: 50,
      // Archived (evicted) wins still count towards the all-time totals.
      totalMinutes: 215,
      totalWins: 14,
    });
    expect(dayKey(at(TODAY))).toBe(TODAY);
  });

  it("converts saved minutes into tangible equivalents", () => {
    const byId = Object.fromEntries(
      computeEquivalents(450).map((item) => [item.equivalent.id, item]),
    );
    expect(byId.books!.label).toBe("1,5 книги");
    expect(byId.sleep!.label).toBe("7,5 часа сна");
    expect(byId.walks!.label).toBe("15 прогулок");
    expect(byId.books!.progress).toBeCloseTo(0.5);
    expect(computeEquivalents(0)[0]!.label).toBe("0 книг");
  });
});
