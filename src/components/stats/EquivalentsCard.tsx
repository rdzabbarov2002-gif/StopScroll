import Ionicons from "@expo/vector-icons/Ionicons";
import { View } from "react-native";

import { useApp } from "../../context/AppContext";
import { usePro } from "../../context/ProContext";
import { WIN_FORMS, formatMinutes, pluralize } from "../../utils/date";
import { computeEquivalents, summarizeWins } from "../../utils/stats";
import { useThemeColors } from "../../utils/theme";
import { AppText } from "../AppText";
import { Card } from "../Card";
import { LockedCard } from "../LockedCard";
import { ProgressBar } from "../ProgressBar";

/** Saved minutes → books, sleep, walks… */
export function EquivalentsCard() {
  const { colors } = useThemeColors();
  const { wins, todayKey, settings } = useApp();
  const { isPro } = usePro();
  const summary = summarizeWins(wins, todayKey);
  const items = computeEquivalents(summary.totalMinutes);
  const visible = items.filter((item) => isPro || !item.equivalent.premium);
  const hidden = items.length - visible.length;

  return (
    <View className="gap-3">
      <Card tone="primary" className="gap-2">
        <AppText variant="overline" tone="primary">
          Выиграно у алгоритмов
        </AppText>
        <AppText variant="display" className="text-5xl">
          {formatMinutes(summary.totalMinutes)}
        </AppText>
        <AppText variant="caption" tone="muted">
          {summary.totalWins} {pluralize(summary.totalWins, WIN_FORMS)} · за 7 дней{" "}
          {formatMinutes(summary.weekMinutes)}. Каждая победа ={" "}
          {formatMinutes(settings.sessionMinutes)}, которые обычно уходили бы в ленту.
        </AppText>
      </Card>

      <View className="flex-row flex-wrap gap-3">
        {visible.map((item) => (
          <View
            key={item.equivalent.id}
            className="min-w-[45%] flex-1 gap-2 rounded-3xl border border-slate-200/70 bg-white p-4 dark:border-ink-800 dark:bg-ink-900"
            accessible
            accessibilityLabel={`${item.label}, ${item.equivalent.caption}`}
          >
            <Ionicons name={item.equivalent.icon} size={20} color={colors.primary} />
            <AppText variant="heading" numberOfLines={2}>
              {item.label}
            </AppText>
            <AppText variant="caption" tone="muted" className="text-xs" numberOfLines={2}>
              {item.equivalent.caption}
            </AppText>
            <ProgressBar progress={item.progress} className="h-1.5" />
          </View>
        ))}
      </View>

      {hidden > 0 ? (
        <LockedCard
          feature="converter"
          title={`Ещё ${hidden} ${pluralize(hidden, ["эквивалент", "эквивалента", "эквивалентов"])} в Pro`}
          text="Тренировки, уроки языка и разговоры с близкими."
        />
      ) : null}
    </View>
  );
}
