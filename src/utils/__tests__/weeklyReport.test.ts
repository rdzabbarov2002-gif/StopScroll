import { describe, expect, it } from "@jest/globals";

import { formatDurationWords } from "../date";
import { DEFAULT_SETTINGS } from "../persistedState";
import type { SlipEntry, WinEntry } from "../types";
import {
  buildWeeklyReport,
  compareReports,
  latestReportWeek,
  reportWeeks,
  type ReportData,
} from "../weeklyReport";

// Monday 5 October 2026 … Sunday 11 October 2026.
const MONDAY = "2026-10-05";
const at = (day: number, hour: number, minute = 0) =>
  new Date(2026, 9, 5 + day, hour, minute).getTime();

const win = (id: string, timestamp: number, extra: Partial<WinEntry> = {}): WinEntry => ({
  id,
  timestamp,
  minutesSaved: 15,
  source: "sos",
  ...extra,
});

const slip = (id: string, timestamp: number, extra: Partial<SlipEntry> = {}): SlipEntry => ({
  id,
  timestamp,
  trigger: "boredom",
  app: "tiktok",
  minutesLost: 20,
  note: "",
  ...extra,
});

function data(overrides: Partial<ReportData> = {}): ReportData {
  return {
    wins: [],
    slips: [],
    scrollLog: {},
    settings: DEFAULT_SETTINGS,
    ...overrides,
  };
}

describe("report schedule", () => {
  it("publishes the week's report on Sunday evening", () => {
    expect(latestReportWeek(at(6, 18, 59))).toBe("2026-09-28");
    expect(latestReportWeek(at(6, 19))).toBe(MONDAY);
    expect(latestReportWeek(at(8, 9))).toBe(MONDAY);
  });

  it("lists only weeks that have history, newest first", () => {
    const history = data({ wins: [win("w", at(-10, 12))] });
    expect(reportWeeks(history, at(6, 20))).toEqual([MONDAY, "2026-09-28", "2026-09-21"]);
    expect(reportWeeks(data(), at(6, 20))).toEqual([]);
  });
});

describe("buildWeeklyReport", () => {
  const history = data({
    wins: [
      win("w3", at(4, 9), { source: "replacement", trigger: "fatigue" }),
      win("w2", at(1, 21, 10)),
      win("w1", at(0, 21)),
      win("old", at(-3, 12)),
    ],
    slips: [
      slip("s3", at(4, 22), { trigger: "stress" }),
      slip("s2", at(4, 21, 30)),
      slip("s1", at(2, 21, 15)),
    ],
    scrollLog: { "2026-10-05": 40, "2026-10-06": 90, "2026-10-09": 30, "2026-10-04": 20 },
  });
  const report = buildWeeklyReport(history, MONDAY, at(8, 9));

  it("counts the week's wins and slips", () => {
    expect(report.savedMinutes).toBe(45);
    expect(report.wins).toBe(3);
    expect(report.slips).toBe(3);
    expect(report.minutesLost).toBe(60);
    expect(report.replacements).toBe(1);
    // 3 wins out of 3 wins + 3 slips.
    expect(report.successRate).toBeCloseTo(3 / 6);
  });

  it("finds the hardest day, hour and the most common reason", () => {
    expect(report.hardestDay).toEqual({ index: 4, basis: "slips", value: 2 });
    expect(report.hardestHour).toEqual({ hour: 21, basis: "slips", count: 2 });
    expect(report.topTrigger).toEqual({ id: "boredom", count: 2 });
    expect(report.slots[7]).toEqual({ hour: 21, resisted: 2, lost: 3 });
  });

  it("summarizes the feed time and the streak at the end of the week", () => {
    expect(report.loggedDays).toBe(3);
    expect(report.daysInLimit).toBe(2);
    expect(report.scrollAverage).toBe(53);
    // Friday (30 min) is the last logged day; Saturday and Sunday were not logged.
    expect(report.currentStreak).toBe(0);
    expect(report.bestStreak).toBe(2);
  });

  it("compares with the previous week", () => {
    const previous = buildWeeklyReport(history, "2026-09-28", at(8, 9));
    expect(previous.wins).toBe(1);
    const changes = compareReports(report, previous);
    expect(changes.find((change) => change.id === "saved")).toEqual({
      id: "saved",
      delta: 30,
      direction: "better",
    });
    expect(changes.find((change) => change.id === "slips")?.direction).toBe("worse");
  });
});

describe("formatDurationWords", () => {
  it("reads like a sentence", () => {
    expect(formatDurationWords(360)).toBe("6 часов");
    expect(formatDurationWords(90)).toBe("1 час 30 минут");
    expect(formatDurationWords(21)).toBe("21 минуту");
  });
});
