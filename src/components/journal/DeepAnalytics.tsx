import { useState } from "react";
import { View } from "react-native";

import type { Patterns } from "../../utils/analytics";
import { getTrigger } from "../../utils/catalog";
import { WEEKDAYS_SHORT, formatHourRange, pluralize } from "../../utils/date";
import { useThemeColors } from "../../utils/theme";
import { AppText } from "../AppText";
import { Card } from "../Card";
import { ColumnChart, type ColumnDatum } from "../charts/ColumnChart";

const COUNT_STEPS = [2, 4, 6, 8, 10, 12, 16, 20, 30, 40, 50, 60, 80, 100];
const SLIP_FORMS = ["срыв", "срыва", "срывов"] as const;

const plural = (count: number) => pluralize(count, SLIP_FORMS);

const formatCount = (value: number) => String(Math.round(value));

/** Pro: slips by hour and weekday, and resisted vs slipped per trigger. */
export function DeepAnalytics({ patterns }: { patterns: Patterns }) {
  const [hour, setHour] = useState<string | null>(null);
  const [weekday, setWeekday] = useState<string | null>(null);

  const hourData: ColumnDatum[] = patterns.byHour.map((count, index) => ({
    key: String(index),
    value: count,
    label: index % 6 === 0 ? String(index).padStart(2, "0") : "",
    a11y: `${formatHourRange(index)}: ${count} ${plural(count)}`,
  }));
  const weekdayData: ColumnDatum[] = patterns.byWeekday.map((count, index) => ({
    key: String(index),
    value: count,
    label: WEEKDAYS_SHORT[index],
    a11y: `${WEEKDAYS_SHORT[index]}: ${count} ${plural(count)}`,
  }));

  const hourKey = hour ?? (patterns.peakHour === null ? null : String(patterns.peakHour));
  const weekdayKey =
    weekday ?? (patterns.peakWeekday === null ? null : String(patterns.peakWeekday));
  const hourValue = hourKey === null ? null : patterns.byHour[Number(hourKey)]!;
  const weekdayValue = weekdayKey === null ? null : patterns.byWeekday[Number(weekdayKey)]!;

  return (
    <View className="gap-4">
      {patterns.detail ? (
        <AppText variant="caption" tone="muted">
          {patterns.detail}
        </AppText>
      ) : null}

      <Card className="gap-3">
        <ChartHeader
          title="Срывы по часам"
          readout={
            hourKey === null
              ? "Пока нет данных"
              : `${formatHourRange(Number(hourKey))} · ${hourValue} ${plural(hourValue ?? 0)}`
          }
        />
        <ColumnChart
          data={hourData}
          highlightKey={hourKey}
          onSelect={setHour}
          formatTick={formatCount}
          niceSteps={COUNT_STEPS}
          plotHeight={110}
        />
      </Card>

      <Card className="gap-3">
        <ChartHeader
          title="Срывы по дням недели"
          readout={
            weekdayKey === null
              ? "Пока нет данных"
              : `${WEEKDAYS_SHORT[Number(weekdayKey)]} · ${weekdayValue} ${plural(weekdayValue ?? 0)}`
          }
        />
        <ColumnChart
          data={weekdayData}
          highlightKey={weekdayKey}
          onSelect={setWeekday}
          formatTick={formatCount}
          niceSteps={COUNT_STEPS}
          plotHeight={110}
        />
      </Card>

      <TriggerBreakdown patterns={patterns} />
    </View>
  );
}

function ChartHeader({ title, readout }: { title: string; readout: string }) {
  return (
    <View className="flex-row items-baseline justify-between gap-3">
      <AppText variant="label" className="text-base">
        {title}
      </AppText>
      <AppText variant="caption" tone="muted" accessibilityLiveRegion="polite">
        {readout}
      </AppText>
    </View>
  );
}

/** Two-series stacked bars: resisted (indigo) vs slipped (orange), with a legend. */
function TriggerBreakdown({ patterns }: { patterns: Patterns }) {
  const { chart } = useThemeColors();
  const rows = patterns.triggerBreakdown;
  const max = Math.max(1, ...rows.map((row) => row.slips + row.resisted));

  return (
    <Card className="gap-4">
      <View className="gap-2">
        <AppText variant="label" className="text-base">
          Триггеры: удержались или сорвались
        </AppText>
        <View className="flex-row gap-4">
          <LegendItem color={chart.series} label="Удержались" />
          <LegendItem color={chart.slip} label="Срывы" />
        </View>
      </View>
      {rows.length === 0 ? (
        <AppText variant="caption" tone="muted">
          Отмечайте причину в SOS-паузе и в дневнике — здесь появится разбивка.
        </AppText>
      ) : (
        rows.map((row) => {
          const label = getTrigger(row.id).label;
          return (
            <View
              key={row.id}
              className="gap-1.5"
              accessible
              accessibilityLabel={`${label}: удержались ${row.resisted}, срывов ${row.slips}`}
            >
              <View className="flex-row items-center justify-between">
                <AppText variant="caption">{label}</AppText>
                <AppText variant="caption" tone="muted">
                  {row.resisted} / {row.slips}
                </AppText>
              </View>
              <View
                className="h-3 flex-row"
                style={{ gap: row.resisted > 0 && row.slips > 0 ? 2 : 0 }}
              >
                {row.resisted > 0 ? (
                  <View
                    style={{
                      width: `${(row.resisted / max) * 100}%`,
                      backgroundColor: chart.series,
                      borderTopRightRadius: row.slips > 0 ? 0 : 4,
                      borderBottomRightRadius: row.slips > 0 ? 0 : 4,
                    }}
                  />
                ) : null}
                {row.slips > 0 ? (
                  <View
                    style={{
                      width: `${(row.slips / max) * 100}%`,
                      backgroundColor: chart.slip,
                      borderTopRightRadius: 4,
                      borderBottomRightRadius: 4,
                    }}
                  />
                ) : null}
              </View>
            </View>
          );
        })
      )}
    </Card>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
    </View>
  );
}
