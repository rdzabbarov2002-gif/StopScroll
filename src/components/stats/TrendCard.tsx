import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { View } from "react-native";

import { useApp } from "../../context/AppContext";
import { usePro } from "../../context/ProContext";
import { useT } from "../../i18n";
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
import { useThemeColors } from "../../utils/theme";
import { AppText } from "../AppText";
import { Card } from "../Card";
import { CardLabel, durationParts } from "../CardLabel";
import { ColumnChart, type ColumnDatum } from "../charts/ColumnChart";
import { SegmentedControl } from "../SegmentedControl";

const MINUTE_STEPS = [30, 60, 90, 120, 180, 240, 300, 360, 480, 600, 720];

type Range = "short" | "long";

export function TrendCard() {
  const t = useT().stats;
  const navigation = useNavigation();
  const { colors, chart } = useThemeColors();
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
      a11y: t.dayValue(
        describe(point.key),
        point.minutes === null ? t.noEntry : formatMinutes(point.minutes),
      ),
    };
  });

  return (
    <Card className="gap-4">
      <CardLabel icon="phone-portrait" label={t.trend.label} color={colors.primary} />

      <SegmentedControl
        options={[
          { value: "short", label: t.trend.days(FREE_TREND_DAYS) },
          { value: "long", label: t.trend.days(PRO_TREND_DAYS), locked: !isPro },
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

      <View className="flex-row items-end justify-between gap-3">
        <View className="shrink">
          <AppText variant="overline" tone="subtle">
            {t.trend.average}
          </AppText>
          {average === null ? (
            <AppText variant="statement" tone="muted">
              {t.trend.empty}
            </AppText>
          ) : (
            <View className="flex-row flex-wrap items-baseline gap-x-1">
              {durationParts(average).map((part) => (
                <View key={part.unit} className="flex-row items-baseline gap-1">
                  <AppText rounded className="text-[34px] font-bold leading-[40px]">
                    {part.value}
                  </AppText>
                  <AppText variant="heading" tone="subtle">
                    {part.unit}
                  </AppText>
                </View>
              ))}
              <AppText variant="heading" tone="subtle">
                {t.trend.perDay}
              </AppText>
            </View>
          )}
        </View>
        <View className="items-end">
          <AppText variant="caption" tone="subtle" className="text-[13px]">
            {describe(selected.key)}
          </AppText>
          <AppText variant="label" tone="primary">
            {selected.minutes === null ? t.noEntry : formatMinutes(selected.minutes)}
          </AppText>
        </View>
      </View>

      <ColumnChart
        data={data}
        highlightKey={selected.key}
        onSelect={setSelectedKey}
        reference={{ value: limit, label: t.limitLine(formatMinutes(limit)) }}
        formatTick={formatMinutesCompact}
        niceSteps={MINUTE_STEPS}
        colorFor={(datum, highlighted) =>
          datum.value !== null && datum.value > limit
            ? chart.slip
            : highlighted
              ? chart.series
              : chart.seriesMuted
        }
      />
    </Card>
  );
}
