import { earnedAchievements } from "./achievements";
import { addDays, parseDayKey, weekdayIndex } from "./date";
import { createInitialState } from "./persistedState";
import type {
  CoachLogEntry,
  FeedApp,
  PersistedState,
  SlipEntry,
  ThemePreference,
  TriggerId,
  WinEntry,
} from "./types";

/**
 * The web preview (GitHub Pages) is built with EXPO_PUBLIC_DEMO=1: purchases are off there, so
 * Settings and the paywall offer a test Pro switch and a "fill with sample data" button.
 * Store builds never set the flag.
 */
export const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO === "1";

const HOUR = 3_600_000;

/** A believable month of history so every chart and card has something to show. */
export function createDemoState(today: string, themePreference: ThemePreference): PersistedState {
  const base = createInitialState();
  const now = Date.now();
  const startOfToday = parseDayKey(today).getTime();
  const at = (daysAgo: number, hour: number, minute = 10) =>
    parseDayKey(addDays(today, -daysAgo)).getTime() + hour * HOUR + minute * 60_000;

  // Feed minutes: an older stretch with a 9-day best streak, then the last week.
  const scrollLog: Record<string, number> = {};
  for (let daysAgo = 40; daysAgo >= 7; daysAgo -= 1) {
    scrollLog[addDays(today, -daysAgo)] = daysAgo % 11 === 3 ? 95 : 35 + ((daysAgo * 7) % 25);
  }
  [140, 95, 55, 48, 60, 42, 30].forEach((minutes, index) => {
    scrollLog[addDays(today, index - 6)] = minutes;
  });

  // Wins: three today (spread over the part of the day that has passed), one or two before.
  const elapsedToday = Math.max(now - startOfToday, 4 * 60_000);
  const todayWins: WinEntry[] = [
    { replacementId: "squats", trigger: "boredom", source: "replacement" as const },
    { replacementId: "cold-water", trigger: "fatigue", source: "replacement" as const },
    { trigger: "stress", source: "sos" as const },
  ].map((win, index) => ({
    ...win,
    id: `demo-win-today-${index}`,
    timestamp: startOfToday + Math.round((elapsedToday * (index + 1)) / 4),
    minutesSaved: 15,
  })) as WinEntry[];
  const pastWins: WinEntry[] = [];
  const triggers: TriggerId[] = ["boredom", "fatigue", "stress", "boredom", "procrastination"];
  for (let daysAgo = 1; daysAgo <= 20; daysAgo += 1) {
    for (let index = 0; index < (daysAgo % 2) + 1; index += 1) {
      pastWins.push({
        id: `demo-win-${daysAgo}-${index}`,
        timestamp: at(daysAgo, 12 + index * 5),
        minutesSaved: 15,
        source: index === 0 ? "sos" : "replacement",
        trigger: triggers[(daysAgo + index) % triggers.length],
      });
    }
  }

  // Walks in the late afternoon: none was followed by a slip, so the coach notices they help.
  for (const daysAgo of [3, 6, 9, 13, 17]) {
    pastWins.push({
      id: `demo-walk-${daysAgo}`,
      timestamp: at(daysAgo, 17),
      minutesSaved: 15,
      source: "replacement",
      trigger: "boredom",
      replacementId: "walk-3",
    });
  }

  // Slips: mostly late in the evening, mostly from fatigue and boredom, Sundays the hardest.
  const lastSunday = (weekdayIndex(today) + 1) % 7 || 7;
  const plan: [daysAgo: number, hour: number, trigger: TriggerId | null][] = [
    [lastSunday, 21, "boredom"],
    [lastSunday, 23, "fatigue"],
    [lastSunday + 7, 21, "boredom"],
    [lastSunday + 7, 22, "sleepless"],
    [lastSunday + 14, 22, "fatigue"],
    [lastSunday + 14, 23, "fatigue"],
    [2, 22, null],
    [4, 22, "fatigue"],
    [5, 14, "procrastination"],
    [8, 21, "boredom"],
    [10, 23, "fatigue"],
    [11, 21, "relax"],
    [15, 22, "autopilot"],
    [16, 14, "procrastination"],
    [19, 22, "fatigue"],
    [23, 21, "boredom"],
    [25, 22, "stress"],
  ];
  const apps: FeedApp[] = ["reels", "tiktok", "shorts"];
  const slips: SlipEntry[] = plan
    .map(([daysAgo, hour, trigger], index) => ({
      id: `demo-slip-${index}`,
      timestamp: at(daysAgo, hour, 5 + index),
      trigger,
      app: apps[index % apps.length]!,
      minutesLost: [12, 25, 18, 15][index % 4]!,
      note: index === 1 ? "Открыл «на минутку» перед сном" : "",
    }))
    .sort((a, b) => b.timestamp - a.timestamp);

  // What the coach advised in the last days.
  const coachLog: CoachLogEntry[] = [
    { day: addDays(today, -1), risk: "medium", advice: "phone-away-evening" },
    { day: addDays(today, -2), risk: "high", advice: "early-sleep" },
    { day: addDays(today, -3), risk: "medium", advice: "walk-instead" },
  ];

  const state: PersistedState = {
    ...base,
    onboarded: true,
    settings: { ...base.settings, mainApp: "reels" },
    scrollLog,
    wins: [...todayWins.reverse(), ...pastWins].sort((a, b) => b.timestamp - a.timestamp),
    winArchive: { count: 30, minutes: 450, replacementCount: 15 },
    slips,
    coachLog,
    themePreference,
  };
  return { ...state, achievements: earnedAchievements(state, now) };
}
