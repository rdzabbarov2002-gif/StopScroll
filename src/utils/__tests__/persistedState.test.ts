import { describe, expect, it } from "@jest/globals";

import {
  DEFAULT_SETTINGS,
  MAX_NOTE_LENGTH,
  MAX_SCROLL_DAYS,
  createInitialState,
  sanitizePersistedState,
  minutesToSlider,
  sliderToMinutes,
  trimScrollLog,
} from "../persistedState";
import { MAX_SCROLL_MINUTES } from "../catalog";
import { addDays } from "../date";

const NOW = new Date(2026, 9, 4, 12, 0).getTime();

describe("sanitizePersistedState", () => {
  it("falls back to a fresh state for garbage input", () => {
    expect(sanitizePersistedState(null)).toEqual(createInitialState());
    expect(sanitizePersistedState("oops")).toEqual(createInitialState());
    expect(sanitizePersistedState([1, 2, 3])).toEqual(createInitialState());
  });

  it("keeps valid data and drops or repairs invalid entries", () => {
    const state = sanitizePersistedState({
      onboarded: true,
      settings: {
        dailyLimitMinutes: 47,
        sessionMinutes: -5,
        baselineMinutes: "a lot",
        mainApp: "vine",
      },
      scrollLog: { "2026-10-03": 95.4, "2026-10-04": 9999, yesterday: 10, "2026-10-05": "x" },
      wins: [
        { id: "w1", timestamp: NOW, minutesSaved: 15, source: "sos", trigger: "stress" },
        { id: "w1", timestamp: NOW, minutesSaved: 15, source: "sos" },
        { id: "w2", timestamp: NOW - 10, minutesSaved: 15, source: "magic" },
        {
          id: "w3",
          timestamp: NOW - 20,
          minutesSaved: 10,
          source: "replacement",
          trigger: "anger",
        },
      ],
      slips: [
        {
          id: "s1",
          timestamp: NOW,
          trigger: "boredom",
          app: "myspace",
          minutesLost: 30,
          note: "x".repeat(500),
        },
        { id: "s2", timestamp: NOW, trigger: "unknown", app: "tiktok", minutesLost: 5, note: "" },
      ],
      customReplacements: [
        {
          id: "c1",
          title: "  Отжимания  ",
          description: "10 раз",
          minutes: 9,
          category: "body",
          createdAt: NOW,
        },
        { id: "c2", title: "   ", description: "", minutes: 1, category: "body", createdAt: NOW },
      ],
      winArchive: { count: 12.4, minutes: -3, replacementCount: "many" },
      lastExerciseId: "yoga",
      themePreference: "neon",
    });

    expect(state.onboarded).toBe(true);
    expect(state.settings).toEqual({
      dailyLimitMinutes: 45,
      sessionMinutes: 5,
      baselineMinutes: DEFAULT_SETTINGS.baselineMinutes,
      mainApp: DEFAULT_SETTINGS.mainApp,
    });
    expect(state.scrollLog).toEqual({ "2026-10-03": 95, "2026-10-04": MAX_SCROLL_MINUTES });
    expect(state.wins.map((win) => win.id)).toEqual(["w1", "w3"]);
    expect(state.wins[1]).not.toHaveProperty("trigger");
    expect(state.slips).toHaveLength(1);
    expect(state.slips[0]!.app).toBe("other");
    expect(state.slips[0]!.note).toHaveLength(MAX_NOTE_LENGTH);
    expect(state.customReplacements).toEqual([
      {
        id: "c1",
        title: "Отжимания",
        description: "10 раз",
        minutes: 3,
        category: "body",
        createdAt: NOW,
      },
    ]);
    expect(state.winArchive).toEqual({ count: 12, minutes: 0, replacementCount: 0 });
    expect(state.lastExerciseId).toBe("breath-ground");
    expect(state.themePreference).toBe("system");
  });

  it("keeps only the most recent days of the scroll log", () => {
    const log: Record<string, number> = {};
    for (let index = 0; index < MAX_SCROLL_DAYS + 10; index += 1) {
      log[addDays("2025-01-01", index)] = 30;
    }
    const trimmed = trimScrollLog(log);
    const keys = Object.keys(trimmed).sort();
    expect(keys).toHaveLength(MAX_SCROLL_DAYS);
    expect(keys[0]).toBe(addDays("2025-01-01", 10));
  });
});

describe("time slider curve", () => {
  it("covers the whole day and gives fine steps for short times", () => {
    expect(sliderToMinutes(0)).toBe(0);
    expect(sliderToMinutes(1)).toBe(MAX_SCROLL_MINUTES);
    expect(sliderToMinutes(minutesToSlider(30))).toBe(30);
    expect(sliderToMinutes(minutesToSlider(600))).toBe(600);
    // One percent of the track near half an hour is about a minute.
    expect(sliderToMinutes(minutesToSlider(30) + 0.01) - 30).toBeLessThanOrEqual(5);
  });
});
