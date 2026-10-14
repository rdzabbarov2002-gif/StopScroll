import { useEffect, useMemo, useState } from "react";

import { useApp } from "../../context/AppContext";
import { navigationRef } from "../../navigation/linking";
import type { RootStackParamList } from "../../navigation/types";
import { achievementTitle, evaluateAchievements, getAchievement } from "../../utils/achievements";
import { useNow } from "../../utils/useNow";
import { AchievementUnlock, type UnlockedAchievement } from "./AchievementUnlock";

/**
 * Full-screen modals (the SOS pause, a replacement, the paywall) finish their own moment first;
 * a new achievement waits until the user is back on a regular screen.
 */
const QUIET_ROUTES = new Set<keyof RootStackParamList>([
  "Intercept",
  "Replacement",
  "Paywall",
  "Privacy",
  "Onboarding",
]);

const currentRoute = () =>
  navigationRef.isReady() ? navigationRef.getCurrentRoute()?.name : undefined;

/**
 * Watches the history for newly earned achievements, saves them with the date the history
 * earned them, and plays the unlock animation for each one in turn.
 */
export function AchievementCenter() {
  const app = useApp();
  // Some achievements are earned by time passing (an evening without a slip ends at 23:00).
  const now = useNow(60_000);
  const [route, setRoute] = useState(currentRoute);

  useEffect(() => navigationRef.addListener("state", () => setRoute(currentRoute())), []);

  const statuses = useMemo(
    () =>
      evaluateAchievements(
        {
          wins: app.wins,
          winArchive: app.winArchive,
          slips: app.slips,
          scrollLog: app.scrollLog,
          settings: app.settings,
        },
        now,
      ),
    [app.wins, app.winArchive, app.slips, app.scrollLog, app.settings, now],
  );

  const { achievements, unlockAchievements, unlockQueue, dismissUnlock } = app;
  useEffect(() => {
    const fresh = statuses.filter(
      (status) => status.achievedAt !== null && !(status.achievement.id in achievements),
    );
    if (fresh.length === 0) return;
    unlockAchievements(
      Object.fromEntries(
        fresh.map((status) => [status.achievement.id, Math.min(Date.now(), status.achievedAt!)]),
      ),
    );
  }, [statuses, achievements, unlockAchievements]);

  const quiet = route === undefined || QUIET_ROUTES.has(route as keyof RootStackParamList);
  const id = quiet ? undefined : unlockQueue[0];
  const achievement = id ? getAchievement(id) : undefined;
  // Queued ids are always saved first, so the date is there.
  const achievedAt = id ? achievements[id] : undefined;
  const current: UnlockedAchievement | null =
    achievement && achievedAt !== undefined
      ? {
          achievement,
          title: achievementTitle(achievement, app.settings.mainApp),
          achievedAt,
        }
      : null;

  return (
    <AchievementUnlock
      unlocked={current}
      onClose={() => id && dismissUnlock(id)}
      onOpenAll={() => {
        for (const queued of unlockQueue) dismissUnlock(queued);
        if (navigationRef.isReady()) navigationRef.navigate("Achievements");
      }}
    />
  );
}
