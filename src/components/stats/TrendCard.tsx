import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { View } from "react-native";

import { useApp } from "../../context/AppContext";
import { usePro } from "../../context/ProContext";
import {
  WEEKDAYS_SHORT,
  formatDayShort,
  formatMinutes,
  formatMinutesCompact,
  parseDayKey,
  weekdayIndex,
} from "../../utils/date";
import { FREE_TREND_DAYS, PRO_TREND_DAYS } from "../../utils/pro";
import { averageMinutes, getTrend } from "../../utils/stats";
import { AppText } from "../AppText";
import { Card } from "../Card";
import { ColumnChart, type ColumnDatum } from "../charts/ColumnChart";
import { SegmentedControl } from "../SegmentedControl";

const MINUTE_STEPS = [30, 60, 90, 120, 180, 240, 300, 360, 480, 600, 720];

type Range = "short" | "long";

export function TrendCard() {
  const navigation = useNavigation();
  const { scrollLog, todayKey, settings } = useApp();
  const { isPro } = usePro();
  const [range, setRange] = useState<Range>("short");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const days = range === "long" && isPro ? PRO_TREND_DAYS : FREE_TREND_DAYS;
  const points = getTrend(scrollLog, todayKey, days);
  const selected = points.find((point) => point.key === selectedKey) ?? points[points.length - 1]!;
  const average = averageMinutes(points);
  const limit = settings.dailyLimitMinutes;

  const describe = (key: string) => `${WEEKDAYS_SHORT[weekdayIndex(key)]}, ${formatDayShort(key)}`;

  const data: ColumnDatum[] = points.map((point, index) => {
    const fromEnd = points.length - 1 - index;
    const label =
      days <= 7
        ? WEEKDAYS_SHORT[weekdayIndex(point.key)]
        : fromEnd % 7 === 0
          ? String(parseDayKey(point.key).getDate())
          : "";
    return {
      key: point.key,
      value: point.minutes,
      label,
      a11y: `${describe(point.key)}: ${point.minutes === null ? "нет записи" : formatMinutes(point.minutes)}`,
    };
  });

  return (
    <Card className="gap-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-0.5">
          <AppText variant="heading">Динамика</AppText>
          <AppText variant="caption" tone="muted">
            {average === null ? "Пока нет записей" : `В среднем ${formatMinutes(average)} в день`}
          </AppText>
        </View>
      </View>

      <SegmentedControl
        options={[
          { value: "short", label: `${FREE_TREND_DAYS} дней` },
          { value: "long", label: `${PRO_TREND_DAYS} дней`, locked: !isPro },
        ]}
        value={range === "long" && isPro ? "long" : "short"}
        onChange={(value) => {
          if (value === "long" && !isPro) {
            navigation.navigate("Paywall", { feature: "history" });
            return;
          }
          setRange(value);
        }}
      />

      <View className="flex-row items-baseline justify-between">
        <AppText variant="caption" tone="muted">
          {describe(selected.key)}
        </AppText>
        <AppText variant="label" className="text-base">
          {selected.minutes === null ? "нет записи" : formatMinutes(selected.minutes)}
        </AppText>
      </View>

      <ColumnChart
        data={data}
        highlightKey={selected.key}
        onSelect={setSelectedKey}
        reference={{ value: limit, label: `Дневной лимит · ${formatMinutes(limit)}` }}
        formatTick={formatMinutesCompact}
        niceSteps={MINUTE_STEPS}
      />
    </Card>
  );
}
