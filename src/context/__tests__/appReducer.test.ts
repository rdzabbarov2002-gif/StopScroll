import { describe, expect, it } from "@jest/globals";

import { MAX_CUSTOM_REPLACEMENTS, MAX_WINS, createInitialState } from "../../utils/persistedState";
import type { CustomReplacement, WinEntry } from "../../utils/types";
import { appReducer, toPersistedState, type AppState } from "../appReducer";

const TODAY = "2026-10-11";
const NOW = new Date(2026, 9, 11, 12, 0).getTime();

function makeState(overrides: Partial<AppState> = {}): AppState {
  return {
    ...createInitialState(),
    hydrated: true,
    todayKey: TODAY,
    unlockQueue: [],
    ...overrides,
  };
}

const win: WinEntry = {
  id: "w1",
  timestamp: NOW,
  minutesSaved: 15,
  source: "sos",
  trigger: "boredom",
};

describe("appReducer", () => {
  it("logs, overwrites and clears scroll time per day", () => {
    let state = appReducer(makeState(), { type: "logScroll", day: TODAY, minutes: 95.6 });
    expect(state.scrollLog).toEqual({ [TODAY]: 96 });
    state = appReducer(state, { type: "logScroll", day: TODAY, minutes: -5 });
    expect(state.scrollLog[TODAY]).toBe(0);
    state = appReducer(state, { type: "clearScroll", day: TODAY });
    expect(state.scrollLog).toEqual({});
    expect(appReducer(state, { type: "clearScroll", day: TODAY })).toBe(state);
  });

  it("records and undoes wins", () => {
    const state = appReducer(makeState(), { type: "recordWin", entry: win });
    expect(state.wins).toEqual([win]);
    expect(appReducer(state, { type: "undoWin", id: "w1" }).wins).toEqual([]);
  });

  it("archives wins pushed past the cap, so totals survive record + undo", () => {
    const old = (i: number): WinEntry => ({
      id: `old-${i}`,
      timestamp: NOW - (i + 1) * 60_000,
      minutesSaved: 15,
      source: i === MAX_WINS - 1 ? "replacement" : "sos",
    });
    const full = makeState({ wins: Array.from({ length: MAX_WINS }, (_, i) => old(i)) });
    const recorded = appReducer(full, { type: "recordWin", entry: win });
    expect(recorded.wins).toHaveLength(MAX_WINS);
    expect(recorded.wins[0]).toBe(win);
    expect(recorded.winArchive).toEqual({ count: 1, minutes: 15, replacementCount: 1 });

    const undone = appReducer(recorded, { type: "undoWin", id: win.id });
    const total = (state: AppState) =>
      state.wins.reduce((sum, item) => sum + item.minutesSaved, 0) + state.winArchive.minutes;
    expect(total(undone)).toBe(total(full));
  });

  it("caps the number of custom replacements", () => {
    const custom = (id: string): CustomReplacement => ({
      id,
      title: id,
      description: "",
      minutes: 1,
      category: "body",
      createdAt: NOW,
    });
    const full = makeState({
      customReplacements: Array.from({ length: MAX_CUSTOM_REPLACEMENTS }, (_, i) =>
        custom(`c${i}`),
      ),
    });
    expect(appReducer(full, { type: "addCustomReplacement", entry: custom("extra") })).toBe(full);
  });

  it("merges settings and finishes onboarding", () => {
    const state = appReducer(makeState(), {
      type: "completeOnboarding",
      settings: {
        dailyLimitMinutes: 30,
        sessionMinutes: 20,
        baselineMinutes: 240,
        mainApp: "reels",
        reportReminder: false,
        coachPhrasing: true,
      },
    });
    expect(state.onboarded).toBe(true);
    const updated = appReducer(state, {
      type: "updateSettings",
      settings: { dailyLimitMinutes: 45 },
    });
    expect(updated.settings).toEqual({
      dailyLimitMinutes: 45,
      sessionMinutes: 20,
      baselineMinutes: 240,
      mainApp: "reels",
      reportReminder: false,
      coachPhrasing: true,
    });
  });

  it("resets progress but keeps the setup", () => {
    const state = makeState({
      onboarded: true,
      themePreference: "dark",
      scrollLog: { [TODAY]: 30 },
      wins: [win],
    });
    const reset = appReducer(state, { type: "resetProgress" });
    expect(reset.wins).toEqual([]);
    expect(reset.scrollLog).toEqual({});
    expect(reset.onboarded).toBe(true);
    expect(reset.themePreference).toBe("dark");
  });

  it("only re-renders on a real day change", () => {
    const state = makeState();
    expect(appReducer(state, { type: "syncDay", today: TODAY })).toBe(state);
    expect(appReducer(state, { type: "syncDay", today: "2026-10-12" }).todayKey).toBe("2026-10-12");
  });

  it("persists everything except runtime flags", () => {
    const persisted = toPersistedState(makeState({ wins: [win] }));
    expect(persisted).not.toHaveProperty("hydrated");
    expect(persisted).not.toHaveProperty("todayKey");
    expect(persisted.wins).toEqual([win]);
  });
});

describe("appReducer: coach, achievements and reports", () => {
  it("saves the reason given after a slip", () => {
    const slip = {
      id: "s1",
      timestamp: NOW,
      trigger: null,
      app: "tiktok" as const,
      minutesLost: 20,
      note: "",
    };
    const state = appReducer(makeState({ slips: [slip] }), {
      type: "reflectSlip",
      id: "s1",
      trigger: "fatigue",
      note: "после смены",
    });
    expect(state.slips).toEqual([{ ...slip, trigger: "fatigue", note: "после смены" }]);
  });

  it("keeps one briefing per day, with the latest advice", () => {
    const yesterday = { day: "2026-10-10", risk: "low" as const, advice: "keep-rhythm" };
    const entry = { day: TODAY, risk: "medium" as const, advice: "walk-instead" };
    let state = appReducer(makeState({ coachLog: [yesterday] }), { type: "recordBriefing", entry });
    expect(state.coachLog).toEqual([entry, yesterday]);
    expect(appReducer(state, { type: "recordBriefing", entry: { ...entry } })).toBe(state);
    const changed = { ...entry, risk: "high" as const, advice: "sos-ready" };
    state = appReducer(state, { type: "recordBriefing", entry: changed });
    expect(state.coachLog).toEqual([changed, yesterday]);
    expect(appReducer(state, { type: "resetProgress" }).coachLog).toEqual([]);
  });

  it("keeps the first date of an achievement", () => {
    const state = appReducer(makeState(), {
      type: "unlockAchievements",
      unlocked: { "first-hour": NOW },
    });
    const again = appReducer(state, {
      type: "unlockAchievements",
      unlocked: { "first-hour": NOW + 1 },
    });
    expect(again).toBe(state);
    expect(again.achievements).toEqual({ "first-hour": NOW });
  });

  it("only moves the seen report forward and wipes it all on reset", () => {
    let state = appReducer(makeState(), { type: "markReportSeen", week: "2026-10-05" });
    expect(appReducer(state, { type: "markReportSeen", week: "2026-09-28" })).toBe(state);
    state = appReducer(state, { type: "unlockAchievements", unlocked: { "first-hour": NOW } });
    const reset = appReducer(state, { type: "resetProgress" });
    expect(reset.lastSeenReport).toBeNull();
    expect(reset.achievements).toEqual({});
    expect(toPersistedState(reset).coachLog).toEqual([]);
  });
});
