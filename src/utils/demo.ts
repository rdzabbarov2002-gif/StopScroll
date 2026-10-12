import { addDays, parseDayKey } from "./date";
import { createInitialState } from "./persistedState";
import type {
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

  // Slips: mostly in the evening, mostly from boredom, mostly in Reels.
  const slipTriggers: TriggerId[] = [
    "boredom",
    "boredom",
    "fatigue",
    "stress",
    "boredom",
    "fatigue",
  ];
  const apps: FeedApp[] = ["reels", "tiktok", "shorts"];
  const slips: SlipEntry[] = Array.from({ length: 24 }, (_, index) => {
    const daysAgo = index + 1;
    const hour = index % 5 === 0 ? 14 : index % 3 === 0 ? 22 : 21;
    return {
      id: `demo-slip-${daysAgo}`,
      timestamp: at(daysAgo, hour, 5 + index),
      trigger: slipTriggers[index % slipTriggers.length]!,
      app: apps[index % apps.length]!,
      minutesLost: [12, 25, 18, 15][index % 4]!,
      note: index === 1 ? "Открыл «на минутку» перед сном" : "",
    };
  });

  return {
    ...base,
    onboarded: true,
    settings: { dailyLimitMinutes: 60, sessionMinutes: 15, baselineMinutes: 180, mainApp: "reels" },
    scrollLog,
    wins: [...todayWins.reverse(), ...pastWins].sort((a, b) => b.timestamp - a.timestamp),
    winArchive: { count: 30, minutes: 450, replacementCount: 15 },
    slips,
    themePreference,
  };
}
