import Ionicons from "@expo/vector-icons/Ionicons";
import { View } from "react-native";

import { useApp } from "../../context/AppContext";
import { usePro } from "../../context/ProContext";
import { useT } from "../../i18n";
import { formatMinutes, formatMinutesInline } from "../../utils/date";
import { computeEquivalents, summarizeWins } from "../../utils/stats";
import { useThemeColors } from "../../utils/theme";
import { AppText } from "../AppText";
import { Card } from "../Card";
import { CardLabel } from "../CardLabel";
import { LockedCard } from "../LockedCard";
import { ProgressBar } from "../ProgressBar";

/** Saved minutes → books, sleep, walks… */
export function EquivalentsCard() {
  const t = useT().stats.equivalents;
  const { colors } = useThemeColors();
  const { wins, winArchive, todayKey, settings } = useApp();
  const { isPro } = usePro();
  const summary = summarizeWins(wins, winArchive, todayKey);
  const items = computeEquivalents(summary.totalMinutes);
  const visible = items.filter((item) => isPro || !item.equivalent.premium);
  const hidden = items.length - visible.length;

  return (
    <View className="gap-3">
      <Card className="gap-3">
        <View className="gap-2">
          <CardLabel icon="leaf" label={t.label} color={colors.success} />
          <AppText variant="statement">
            {summary.totalMinutes > 0
              ? t.total(formatMinutesInline(summary.totalMinutes))
              : t.empty}
          </AppText>
          <AppText variant="caption" tone="muted">
            {t.summary(
              summary.totalWins,
              formatMinutes(summary.weekMinutes),
              formatMinutes(settings.sessionMinutes),
            )}
          </AppText>
        </View>

        <View className="flex-row flex-wrap gap-2">
          {visible.map((item) => (
            <View
              key={item.equivalent.id}
              className="min-w-[45%] flex-1 gap-1.5 rounded-2xl bg-white p-3 dark:bg-ink-800"
              accessible
              accessibilityLabel={`${item.label}, ${item.equivalent.caption}`}
            >
              <Ionicons name={item.equivalent.icon} size={18} color={colors.success} />
              <AppText variant="heading" className="text-[15px] leading-5" numberOfLines={2}>
                {item.label}
              </AppText>
              <AppText
                variant="caption"
                tone="subtle"
                className="text-[12px] leading-4"
                numberOfLines={2}
              >
                {item.equivalent.caption}
              </AppText>
              <ProgressBar progress={item.progress} className="mt-1 h-1.5" />
            </View>
          ))}
        </View>
      </Card>

      {hidden > 0 ? (
        <LockedCard feature="converter" title={t.lockedTitle(hidden)} text={t.lockedText} />
      ) : null}
    </View>
  );
}
