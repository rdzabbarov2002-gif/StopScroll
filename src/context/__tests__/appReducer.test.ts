import { describe, expect, it } from "@jest/globals";

import { MAX_CUSTOM_REPLACEMENTS, createInitialState } from "../../utils/persistedState";
import type { CustomReplacement, WinEntry } from "../../utils/types";
import { appReducer, toPersistedState, type AppState } from "../appReducer";

const TODAY = "2026-10-11";
const NOW = new Date(2026, 9, 11, 12, 0).getTime();

function makeState(overrides: Partial<AppState> = {}): AppState {
  return { ...createInitialState(), hydrated: true, todayKey: TODAY, ...overrides };
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
