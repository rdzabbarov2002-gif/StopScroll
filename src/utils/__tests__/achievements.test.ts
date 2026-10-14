import { describe, expect, it } from "@jest/globals";

import {
  ACHIEVEMENTS,
  earnedAchievements,
  evaluateAchievements,
  type AchievementData,
} from "../achievements";
import { DEFAULT_SETTINGS } from "../persistedState";
import type { SlipEntry, WinEntry } from "../types";

// Day 0 is Monday 5 October 2026.
const at = (day: number, hour: number, minute = 0) =>
  new Date(2026, 9, 5 + day, hour, minute).getTime();

const win = (id: string, timestamp: number, extra: Partial<WinEntry> = {}): WinEntry => ({
  id,
  timestamp,
  minutesSaved: 15,
  source: "sos",
  ...extra,
});

const slip = (id: string, timestamp: number): SlipEntry => ({
  id,
  timestamp,
  trigger: "boredom",
  app: "tiktok",
  minutesLost: 20,
  note: "",
});

function data(overrides: Partial<AchievementData> = {}): AchievementData {
  return {
    wins: [],
    winArchive: { count: 0, minutes: 0, replacementCount: 0 },
    slips: [],
    scrollLog: {},
    settings: DEFAULT_SETTINGS,
    ...overrides,
  };
}

const statusOf = (history: AchievementData, id: string, now: number) =>
  evaluateAchievements(history, now).find((status) => status.achievement.id === id)!;

describe("achievements", () => {
  it("have unique ids", () => {
    expect(new Set(ACHIEVEMENTS.map((item) => item.id)).size).toBe(ACHIEVEMENTS.length);
  });

  it("names the evening after the user's own feed app", () => {
    const status = statusOf(data(), "first-evening", at(0, 12));
    expect(status.title).toBe("Первый вечер без TikTok");
    expect(status.achievedAt).toBeNull();
  });

  it("credits the first saved hour at the win that crossed it", () => {
    const wins = [
      win("w4", at(1, 12)),
      win("w3", at(0, 15)),
      win("w2", at(0, 14)),
      win("w1", at(0, 13)),
    ];
    const status = statusOf(data({ wins }), "first-hour", at(2, 12));
    expect(status.achievedAt).toBe(at(1, 12));
    expect(statusOf(data({ wins: wins.slice(1) }), "first-hour", at(2, 12)).current).toBe(45);
  });

  it("only counts an evening once it is over and had no slip", () => {
    const wins = [win("w1", at(0, 18))];
    expect(statusOf(data({ wins }), "first-evening", at(0, 22)).achievedAt).toBeNull();
    expect(statusOf(data({ wins }), "first-evening", at(0, 23, 30)).achievedAt).toBe(at(0, 23));
    const slips = [slip("s1", at(0, 21))];
    expect(statusOf(data({ wins, slips }), "first-evening", at(1, 12)).achievedAt).toBeNull();
  });

  it("recognizes a Sunday evening and a comeback after a slip", () => {
    const wins = [win("w2", at(6, 19)), win("w1", at(2, 10))];
    const slips = [slip("s1", at(1, 22))];
    const history = data({ wins, slips });
    expect(statusOf(history, "sunday-evening", at(7, 9)).achievedAt).toBe(at(6, 23));
    expect(statusOf(history, "comeback", at(7, 9)).achievedAt).toBe(at(2, 10));
  });

  it("breaks a run of refusals on a slip", () => {
    const wins = Array.from({ length: 31 }, (_, index) => win(`w${index}`, at(0, 0, index * 10)));
    const history = data({ wins, slips: [slip("s1", at(0, 0, 5))] });
    const status = statusOf(history, "refusals-30", at(1, 0));
    expect(status.achievedAt).toBe(wins[30]!.timestamp);
    expect(statusOf(data({ wins: wins.slice(2) }), "refusals-30", at(1, 0)).current).toBe(29);
  });

  it("counts seven days in a row within the limit", () => {
    const scrollLog = Object.fromEntries(
      Array.from({ length: 7 }, (_, index) => [`2026-10-0${index + 1}`, 30]),
    );
    const status = statusOf(data({ scrollLog }), "week-in-limit", at(3, 12));
    expect(status.achievedAt).not.toBeNull();
    const broken = { ...scrollLog, "2026-10-04": 500 };
    expect(statusOf(data({ scrollLog: broken }), "week-in-limit", at(3, 12)).current).toBe(3);
  });

  it("lists everything the history already earned", () => {
    const earned = earnedAchievements(data({ wins: [win("w1", at(0, 9))] }), at(0, 13));
    expect(Object.keys(earned)).toEqual(["first-choice", "morning-free"]);
    expect(earned["first-choice"]).toBe(at(0, 9));
  });
});
