import { describe, expect, it } from "@jest/globals";

import { DEFAULT_SETTINGS } from "../../utils/persistedState";
import type { WinEntry } from "../../utils/types";
import { buildWidgetSnapshot, widgetDay, widgetReplacement, type WidgetSource } from "../snapshot";

const TODAY = "2026-10-13";
const at = (day: number, hour: number) => new Date(2026, 9, 13 + day, hour).getTime();
const win = (id: string, timestamp: number): WinEntry => ({
  id,
  timestamp,
  minutesSaved: 15,
  source: "sos",
});

function source(overrides: Partial<WidgetSource> = {}): WidgetSource {
  return {
    todayKey: TODAY,
    wins: [],
    winArchive: { count: 0, minutes: 0, replacementCount: 0 },
    scrollLog: {},
    settings: DEFAULT_SETTINGS,
    customReplacements: [],
    ...overrides,
  };
}

describe("widget snapshot", () => {
  const snapshot = buildWidgetSnapshot(
    source({
      wins: [win("w2", at(0, 10)), win("w1", at(-1, 10))],
      scrollLog: { "2026-10-11": 30, "2026-10-12": 40, "2026-10-13": 20 },
    }),
    false,
  );

  it("carries today's real numbers and only the free catalog without Pro", () => {
    expect(snapshot).toMatchObject({
      day: TODAY,
      savedToday: 15,
      winsToday: 1,
      streak: 3,
      streakTomorrow: 3,
      limit: 60,
      scrolledToday: 20,
    });
    expect(snapshot.replacements.length).toBeGreaterThan(0);
    expect(snapshot.replacements.every((item) => !("premium" in item))).toBe(true);
  });

  it("rolls over to the next day without the app", () => {
    expect(widgetDay(snapshot, at(0, 23))).toMatchObject({ saved: 15, scrolled: 20 });
    expect(widgetDay(snapshot, at(1, 8))).toEqual({
      saved: 0,
      wins: 0,
      streak: 3,
      scrolled: null,
      limit: 60,
    });
    expect(widgetDay(snapshot, at(2, 8)).streak).toBe(0);
  });

  it("keeps the streak tomorrow only when today is logged within the limit", () => {
    const unlogged = buildWidgetSnapshot(
      source({ scrollLog: { "2026-10-11": 30, "2026-10-12": 40 } }),
      false,
    );
    expect(unlogged.streak).toBe(2);
    expect(unlogged.streakTomorrow).toBe(0);
  });

  it("changes the replacement every half hour", () => {
    const first = widgetReplacement(snapshot, at(0, 10));
    const sameSlot = widgetReplacement(snapshot, at(0, 10) + 10 * 60_000);
    const nextSlot = widgetReplacement(snapshot, at(0, 10) + 30 * 60_000);
    expect(sameSlot).toEqual(first);
    expect(nextSlot).not.toEqual(first);
  });
});
