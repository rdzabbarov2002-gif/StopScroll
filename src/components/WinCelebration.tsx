import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import { Animated, Platform, View } from "react-native";

import { useApp } from "../context/AppContext";
import { countOf, useT } from "../i18n";
import { formatMinutes } from "../utils/date";
import { computeEquivalents, summarizeWins } from "../utils/stats";
import { useThemeColors } from "../utils/theme";
import type { WinEntry } from "../utils/types";
import { AppText } from "./AppText";
import { Button } from "./Button";
import { Card } from "./Card";

interface WinCelebrationProps {
  win: WinEntry;
  onDone: () => void;
  onUndo: () => void;
}

/** "+15 мин спасено" — shown after an SOS pause or a replacement is counted as a win. */
export function WinCelebration({ win, onDone, onUndo }: WinCelebrationProps) {
  const { colors } = useThemeColors();
  const t = useT();
  const text = t.replacements.win;
  const { wins, winArchive, todayKey } = useApp();
  const summary = summarizeWins(wins, winArchive, todayKey);
  const sleep = computeEquivalents(summary.totalMinutes).find(
    (item) => item.equivalent.id === "sleep",
  );
  const [pop] = useState(() => new Animated.Value(0.6));

  useEffect(() => {
    Animated.spring(pop, {
      toValue: 1,
      friction: 5,
      tension: 90,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [pop]);

  return (
    <View className="gap-6" accessibilityLiveRegion="polite">
      <View className="items-center gap-4 pt-6">
        <Animated.View style={{ transform: [{ scale: pop }] }}>
          <View className="h-28 w-28 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60">
            <Ionicons name="trophy" size={52} color={colors.success} />
          </View>
        </Animated.View>
        <AppText variant="overline" className="text-emerald-600 dark:text-emerald-400">
          {text.overline}
        </AppText>
        <AppText variant="display" className="text-center text-5xl" accessibilityRole="header">
          +{formatMinutes(win.minutesSaved)}
        </AppText>
        <AppText tone="muted" className="text-center">
          {text.saved}
        </AppText>
      </View>

      <Card className="gap-3">
        <Row
          label={text.today}
          value={`${formatMinutes(summary.todayMinutes)} · ${countOf(summary.todayWins, t.common.units.wins)}`}
        />
        <Row label={text.total} value={formatMinutes(summary.totalMinutes)} />
        {sleep && sleep.value > 0 ? <Row label={text.already} value={sleep.label} /> : null}
      </Card>

      <View className="gap-2">
        <Button label={text.back} size="lg" icon="checkmark" onPress={onDone} />
        <Button label={text.undo} variant="ghost" onPress={onUndo} />
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      <AppText variant="label">{value}</AppText>
    </View>
  );
}
