import { View } from "react-native";

import { useT } from "../../i18n";
import { MIN_SLIPS_FOR_PATTERNS, type Patterns } from "../../utils/analytics";
import { TIME_OF_DAY_LABELS, getFeedApp } from "../../utils/catalog";
import { formatMinutes } from "../../utils/date";
import { useThemeColors } from "../../utils/theme";
import { AppText } from "../AppText";
import { Card } from "../Card";
import { CardLabel } from "../CardLabel";
import { ProgressBar } from "../ProgressBar";

/** Free summary of the trigger diary. */
export function PatternsCard({ patterns }: { patterns: Patterns }) {
  const t = useT().journal.patterns;
  const { colors } = useThemeColors();
  const resistPercent = patterns.resistRate === null ? null : Math.round(patterns.resistRate * 100);

  return (
    <Card className="gap-5">
      <View className="gap-2">
        <CardLabel icon="moon" label={t.label} color={colors.indigo} />
        {patterns.summary ? (
          <>
            <AppText variant="statement">{patterns.summary}</AppText>
            {patterns.advice ? (
              <AppText variant="caption" tone="muted">
                {patterns.advice}
              </AppText>
            ) : null}
          </>
        ) : (
          <>
            <AppText variant="caption" tone="muted">
              {t.addMore(MIN_SLIPS_FOR_PATTERNS - patterns.totalSlips)}
            </AppText>
            <ProgressBar progress={patterns.totalSlips / MIN_SLIPS_FOR_PATTERNS} />
          </>
        )}
      </View>

      <View className="flex-row gap-3">
        <Metric label={t.slipsWeek} value={String(patterns.slipsLastWeek)} />
        <Metric label={t.lostWeek} value={formatMinutes(patterns.minutesLostLastWeek)} />
        <Metric
          label={t.resisted}
          value={resistPercent === null ? "—" : t.percent(resistPercent)}
        />
      </View>

      {patterns.topTimeOfDay || patterns.topApp ? (
        <View className="flex-row gap-3">
          {patterns.topTimeOfDay ? (
            <Metric label={t.riskyTime} value={TIME_OF_DAY_LABELS[patterns.topTimeOfDay].label} />
          ) : null}
          {patterns.topApp ? (
            <Metric label={t.topApp} value={getFeedApp(patterns.topApp).label} />
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 gap-0.5 rounded-2xl bg-white px-3 py-2.5 dark:bg-ink-800">
      <AppText
        rounded
        className={value.length > 6 ? "text-[16px] font-bold" : "text-[20px] font-bold"}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </AppText>
      <AppText variant="caption" tone="muted" className="text-xs leading-4" numberOfLines={2}>
        {label}
      </AppText>
    </View>
  );
}
