import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { Pressable, View, type LayoutChangeEvent } from "react-native";

import { useApp } from "../../context/AppContext";
import { usePro } from "../../context/ProContext";
import {
  DAY_FORMS,
  WEEKDAYS_SHORT,
  formatDayShort,
  formatMinutes,
  pluralize,
} from "../../utils/date";
import { FREE_HEATMAP_WEEKS, PRO_HEATMAP_WEEKS } from "../../utils/pro";
import {
  countControlledDays,
  getBestStreak,
  getCurrentStreak,
  getHeatmap,
  type DayStatus,
} from "../../utils/stats";
import { useThemeColors, type ChartColors } from "../../utils/theme";
import { AppText } from "../AppText";
import { Card } from "../Card";

const GAP = 4;
const LABEL_GUTTER = 24;
const MAX_CELL = 30;

const STATUS_TEXT: Record<DayStatus, string> = {
  great: "меньше половины лимита",
  ok: "в пределах лимита",
  over: "выше лимита",
  empty: "нет записи",
  future: "",
};

function cellColor(status: DayStatus, chart: ChartColors): string {
  switch (status) {
    case "great":
      return chart.series;
    case "ok":
      return chart.seriesMid;
    case "over":
      return chart.slip;
    case "empty":
      return chart.empty;
    default:
      return "transparent";
  }
}

/** Streak chain + calendar heatmap of days under control. */
export function HeatmapCard() {
  const navigation = useNavigation();
  const { colors, chart } = useThemeColors();
  const { scrollLog, todayKey, settings } = useApp();
  const { isPro } = usePro();
  const [width, setWidth] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const limit = settings.dailyLimitMinutes;
  const weeks = isPro ? PRO_HEATMAP_WEEKS : FREE_HEATMAP_WEEKS;
  const grid = getHeatmap(scrollLog, limit, todayKey, weeks);
  // Derived on every render so the caption follows new logs and limit changes.
  const selected = selectedKey
    ? (grid.flat().find((cell) => cell.key === selectedKey) ?? null)
    : null;
  const streak = getCurrentStreak(scrollLog, limit, todayKey);
  const best = getBestStreak(scrollLog, limit);
  const month = countControlledDays(scrollLog, limit, todayKey, 30);

  const cell = Math.max(
    8,
    Math.min(MAX_CELL, Math.floor((width - LABEL_GUTTER - GAP * (weeks - 1)) / weeks)),
  );

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  return (
    <Card className="gap-5">
      <View className="gap-0.5">
        <AppText variant="heading">Дни под контролем</AppText>
        <AppText variant="caption" tone="muted">
          День засчитывается, если в ленте не больше {formatMinutes(limit)}.
        </AppText>
      </View>

      <View className="flex-row gap-3">
        <Metric value={`${streak}`} unit={pluralize(streak, DAY_FORMS)} label="Серия" />
        <Metric value={`${best}`} unit={pluralize(best, DAY_FORMS)} label="Рекорд" />
        <Metric value={`${month.controlled}/${month.logged}`} label="За 30 дней" />
      </View>

      <View onLayout={onLayout} className="gap-3">
        {width > 0 ? (
          <View className="flex-row" style={{ gap: GAP }}>
            <View style={{ width: LABEL_GUTTER - GAP, gap: GAP }}>
              {WEEKDAYS_SHORT.map((label, index) => (
                <View key={label} style={{ height: cell, justifyContent: "center" }}>
                  {index % 2 === 0 ? (
                    <AppText variant="caption" tone="muted" className="text-[10px]">
                      {label}
                    </AppText>
                  ) : null}
                </View>
              ))}
            </View>
            {grid.map((week) => (
              <View key={week[0]!.key} style={{ gap: GAP }}>
                {week.map((day) => (
                  <Pressable
                    key={day.key}
                    disabled={day.status === "future"}
                    onPress={() => setSelectedKey(day.key)}
                    accessibilityRole="button"
                    accessibilityLabel={`${formatDayShort(day.key)}: ${
                      day.minutes === null
                        ? "нет записи"
                        : `${formatMinutes(day.minutes)}, ${STATUS_TEXT[day.status]}`
                    }`}
                    style={{
                      width: cell,
                      height: cell,
                      borderRadius: 4,
                      backgroundColor: cellColor(day.status, chart),
                      borderWidth: day.isToday || selectedKey === day.key ? 2 : 0,
                      borderColor: colors.text,
                    }}
                  />
                ))}
              </View>
            ))}
          </View>
        ) : null}

        <AppText variant="caption" tone="muted" accessibilityLiveRegion="polite">
          {selected
            ? `${formatDayShort(selected.key)}: ${
                selected.minutes === null
                  ? "нет записи"
                  : `${formatMinutes(selected.minutes)} — ${STATUS_TEXT[selected.status]}`
              }`
            : "Нажмите на день, чтобы увидеть детали."}
        </AppText>

        <View className="flex-row flex-wrap gap-x-4 gap-y-2">
          <Legend color={chart.series} label="≤ ½ лимита" />
          <Legend color={chart.seriesMid} label="в лимите" />
          <Legend color={chart.slip} label="выше лимита" />
          <Legend color={chart.empty} label="нет записи" />
        </View>
      </View>

      {!isPro ? (
        <Pressable
          onPress={() => navigation.navigate("Paywall", { feature: "history" })}
          accessibilityRole="button"
          className="active:opacity-70"
        >
          <AppText variant="caption" tone="primary" className="font-semibold">
            Показать {PRO_HEATMAP_WEEKS} недель истории — в Pro
          </AppText>
        </Pressable>
      ) : null}
    </Card>
  );
}

function Metric({ value, unit, label }: { value: string; unit?: string; label: string }) {
  return (
    <View className="flex-1 gap-0.5 rounded-2xl bg-slate-50 px-3 py-2.5 dark:bg-ink-850">
      <View className="flex-row items-baseline gap-1">
        <AppText variant="heading">{value}</AppText>
        {unit ? (
          <AppText variant="caption" tone="muted" className="text-xs" numberOfLines={1}>
            {unit}
          </AppText>
        ) : null}
      </View>
      <AppText variant="caption" tone="muted" className="text-xs" numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
      <AppText variant="caption" tone="muted" className="text-xs">
        {label}
      </AppText>
    </View>
  );
}
