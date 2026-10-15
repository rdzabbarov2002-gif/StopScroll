import Ionicons from "@expo/vector-icons/Ionicons";
import { ActivityIndicator, Pressable, View } from "react-native";

import type { RiskLevel } from "../../ai/types";
import { useAi } from "../../context/AiContext";
import { formatTime } from "../../utils/date";
import { useThemeColors, type ThemeColors } from "../../utils/theme";
import type { IconName } from "../../utils/types";
import { AppText } from "../AppText";

/** A sentence with a small colored icon — the building block of every AI section. */
export function Bullet({ icon, color, text }: { icon: IconName; color: string; text: string }) {
  return (
    <View className="flex-row items-start gap-3">
      <Ionicons name={icon} size={17} color={color} style={{ marginTop: 2 }} />
      <AppText className="flex-1 text-[16px] leading-[22px]">{text}</AppText>
    </View>
  );
}

export function levelColor(
  colors: ThemeColors,
  level: RiskLevel | null,
  probability: number | null,
) {
  const resolved =
    level ??
    (probability === null
      ? null
      : probability >= 65
        ? "high"
        : probability >= 35
          ? "medium"
          : "low");
  return resolved === "high"
    ? colors.danger
    : resolved === "medium"
      ? colors.warningStrong
      : resolved === "low"
        ? colors.success
        : colors.textSubtle;
}

const TASK_TEXT = {
  entry: "ChatGPT разбирает запись…",
  deep: "ChatGPT обновляет аналитику по всей истории…",
} as const;

/** What the AI coach is doing right now, or when it last updated. */
export function SyncLine() {
  const { colors } = useThemeColors();
  const ai = useAi();
  if (ai.sync.status === "working" && ai.sync.task) {
    return (
      <View className="flex-row items-center gap-2" accessibilityLiveRegion="polite">
        <ActivityIndicator size="small" color={colors.primary} />
        <AppText variant="caption" tone="muted" className="text-[14px]">
          {TASK_TEXT[ai.sync.task]}
        </AppText>
      </View>
    );
  }
  if (ai.sync.status === "error" && ai.sync.error) {
    return (
      <View className="flex-row items-center gap-2">
        <Ionicons name="cloud-offline-outline" size={16} color={colors.warningStrong} />
        <AppText variant="caption" tone="muted" className="flex-1 text-[14px]">
          {ai.sync.error}
        </AppText>
        <Pressable
          onPress={ai.retryNow}
          accessibilityRole="button"
          hitSlop={8}
          className="rounded-full bg-brand-50 px-3 py-1 active:opacity-70 dark:bg-brand-900"
        >
          <AppText variant="label" tone="primary" className="text-[14px]">
            Повторить
          </AppText>
        </Pressable>
      </View>
    );
  }
  if (!ai.updatedAt) return null;
  return (
    <AppText variant="caption" tone="subtle" className="text-[14px]">
      Аналитика обновлена {formatUpdated(ai.updatedAt)}
    </AppText>
  );
}

function formatUpdated(timestamp: number) {
  const date = new Date(timestamp);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  return sameDay
    ? `сегодня в ${formatTime(timestamp)}`
    : `${date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })} в ${formatTime(timestamp)}`;
}
