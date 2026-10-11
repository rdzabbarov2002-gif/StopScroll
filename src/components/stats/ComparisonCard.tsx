import Ionicons from "@expo/vector-icons/Ionicons";
import { View } from "react-native";

import { useApp } from "../../context/AppContext";
import { cn } from "../../utils/cn";
import { formatMinutes } from "../../utils/date";
import { compareScroll } from "../../utils/stats";
import { useThemeColors } from "../../utils/theme";
import { AppText } from "../AppText";
import { Card } from "../Card";

/** "Вчера — 3 ч, сегодня — 30 мин": a before/after scale against yesterday and the baseline. */
export function ComparisonCard() {
  const { scrollLog, todayKey, settings } = useApp();
  const comparison = compareScroll(scrollLog, todayKey, settings.baselineMinutes);
  const { today, yesterday, baseline } = comparison;

  const rows = [
    { label: "До StopScroll", value: baseline, emphasis: false },
    { label: "Вчера", value: yesterday, emphasis: false },
    { label: "Сегодня", value: today, emphasis: true },
  ];
  const max = Math.max(1, ...rows.map((row) => row.value ?? 0));

  const headline =
    today !== null && yesterday !== null
      ? `Вчера — ${formatMinutes(yesterday)}, сегодня — ${formatMinutes(today)}`
      : today !== null
        ? `Сегодня — ${formatMinutes(today)}`
        : "Отметьте время за сегодня";

  return (
    <Card className="gap-5">
      <View className="gap-1">
        <AppText variant="overline" tone="muted">
          Сравнение
        </AppText>
        <AppText variant="heading" className="text-xl leading-7">
          {headline}
        </AppText>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {comparison.deltaPercent !== null ? (
          <DeltaBadge percent={comparison.deltaPercent} suffix="к вчера" sameText="как вчера" />
        ) : null}
        {comparison.baselinePercent !== null ? (
          <DeltaBadge
            percent={comparison.baselinePercent}
            suffix="к исходному уровню"
            sameText="на исходном уровне"
          />
        ) : null}
      </View>

      <View className="gap-3">
        {rows.map((row) => (
          <ScaleRow
            key={row.label}
            label={row.label}
            value={row.value}
            max={max}
            emphasis={row.emphasis}
          />
        ))}
      </View>
    </Card>
  );
}

function ScaleRow({
  label,
  value,
  max,
  emphasis,
}: {
  label: string;
  value: number | null;
  max: number;
  emphasis: boolean;
}) {
  const { chart } = useThemeColors();
  return (
    <View
      className="gap-1.5"
      accessible
      accessibilityLabel={`${label}: ${value === null ? "нет данных" : formatMinutes(value)}`}
    >
      <View className="flex-row items-center justify-between">
        <AppText
          variant="caption"
          tone={emphasis ? "default" : "muted"}
          className={cn(emphasis && "font-semibold")}
        >
          {label}
        </AppText>
        <AppText variant="label" tone={value === null ? "subtle" : "default"}>
          {value === null ? "нет данных" : formatMinutes(value)}
        </AppText>
      </View>
      <View className="h-3 justify-center">
        {value === null ? (
          <View className="h-0.5 w-full rounded-full" style={{ backgroundColor: chart.empty }} />
        ) : (
          <View
            style={{
              height: 12,
              width: `${Math.max(1.5, (value / max) * 100)}%`,
              backgroundColor: emphasis ? chart.series : chart.seriesMuted,
              borderTopRightRadius: 4,
              borderBottomRightRadius: 4,
            }}
          />
        )}
      </View>
    </View>
  );
}

function DeltaBadge({
  percent,
  suffix,
  sameText,
}: {
  percent: number;
  suffix: string;
  /** Shown when the change rounds to 0%. */
  sameText: string;
}) {
  const { colors } = useThemeColors();
  const better = percent < 0;
  const same = percent === 0;
  const text = same ? sameText : `${better ? "−" : "+"}${Math.abs(percent)}% ${suffix}`;
  return (
    <View
      className={cn(
        "flex-row items-center gap-1.5 rounded-full px-3 py-1.5",
        same
          ? "bg-slate-100 dark:bg-ink-800"
          : better
            ? "bg-emerald-100 dark:bg-emerald-950/50"
            : "bg-amber-100 dark:bg-amber-950/50",
      )}
    >
      <Ionicons
        name={same ? "remove-outline" : better ? "trending-down" : "trending-up"}
        size={15}
        color={same ? colors.textMuted : better ? colors.success : colors.warningStrong}
      />
      <AppText
        variant="caption"
        className={cn(
          "font-semibold",
          same
            ? "text-slate-600 dark:text-slate-300"
            : better
              ? "text-emerald-700 dark:text-emerald-300"
              : "text-amber-700 dark:text-amber-300",
        )}
      >
        {text}
      </AppText>
    </View>
  );
}
