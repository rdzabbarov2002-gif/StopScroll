import { describe, expect, it } from "@jest/globals";

import { MIN_SLIPS_FOR_PATTERNS, computePatterns } from "../analytics";
import { MS_PER_DAY } from "../date";
import { suggestReplacements } from "../replacements";
import type { SlipEntry, WinEntry } from "../types";

// Friday, 9 October 2026.
const at = (day: number, hour: number) => new Date(2026, 9, day, hour, 15).getTime();
const NOW = at(11, 12);

const slip = (id: string, timestamp: number, trigger: SlipEntry["trigger"]): SlipEntry => ({
  id,
  timestamp,
  trigger,
  app: "tiktok",
  minutesLost: 30,
  note: "",
});

const win = (id: string, timestamp: number, trigger?: WinEntry["trigger"]): WinEntry => ({
  id,
  timestamp,
  minutesSaved: 15,
  source: "sos",
  ...(trigger ? { trigger } : {}),
});

describe("computePatterns", () => {
  it("waits for enough slips before describing a pattern", () => {
    const patterns = computePatterns([slip("1", at(9, 21), "boredom")], [], NOW);
    expect(patterns.summary).toBeNull();
    expect(patterns.totalSlips).toBeLessThan(MIN_SLIPS_FOR_PATTERNS);
  });

  it("finds the peak hour, weekday and main trigger", () => {
    const slips = [
      slip("1", at(9, 21), "boredom"),
      slip("2", at(2, 21), "boredom"),
      slip("3", at(10, 22), "stress"),
      slip("4", at(8, 9), "boredom"),
    ];
    const wins = [
      win("w1", at(10, 20), "stress"),
      win("w2", at(10, 13)),
      win("w3", NOW - 40 * MS_PER_DAY),
    ];
    const patterns = computePatterns(slips, wins, NOW);

    expect(patterns.byHour[21]).toBe(2);
    expect(patterns.peakHour).toBe(21);
    expect(patterns.peakWeekday).toBe(4); // Friday
    expect(patterns.topTrigger).toBe("boredom");
    expect(patterns.topTimeOfDay).toBe("evening");
    expect(patterns.topApp).toBe("tiktok");
    expect(patterns.summary).toBe("Чаще всего срывы случаются по вечерам от скуки.");
    expect(patterns.detail).toBe("Пиковый час — 21:00–22:00. Труднее всего по пятницам.");
    expect(patterns.slipsLastWeek).toBe(3);
    expect(patterns.minutesLostLastWeek).toBe(90);
    // 2 recent wins vs 4 recent slips; the 40-day-old win is outside the window.
    expect(patterns.resistRate).toBeCloseTo(2 / 6);
    expect(patterns.triggerBreakdown).toEqual([
      { id: "boredom", slips: 3, resisted: 0 },
      { id: "stress", slips: 1, resisted: 1 },
    ]);
  });

  it("has no resist rate without any impulses", () => {
    expect(computePatterns([], [], NOW).resistRate).toBeNull();
  });
});

describe("suggestReplacements", () => {
  it("puts unlocked replacements for the state first", () => {
    const free = suggestReplacements("stress", false);
    expect(free).toHaveLength(3);
    free.forEach((item) => {
      expect(item.premium).toBeFalsy();
      expect(item.triggers).toContain("stress");
    });
  });

  it("can suggest premium items to Pro users", () => {
    const pro = suggestReplacements("stress", true, 10);
    expect(pro.some((item) => item.premium)).toBe(true);
  });
});
