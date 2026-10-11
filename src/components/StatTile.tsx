import Ionicons from "@expo/vector-icons/Ionicons";
import { View } from "react-native";

import { useThemeColors } from "../utils/theme";
import type { IconName } from "../utils/types";
import { AppText } from "./AppText";

interface StatTileProps {
  icon: IconName;
  value: string;
  /** Small unit shown after the value, e.g. "дней". */
  unit?: string;
  label: string;
  tone?: "primary" | "warning" | "neutral";
}

export function StatTile({ icon, value, unit, label, tone = "neutral" }: StatTileProps) {
  const { colors } = useThemeColors();
  const iconColor =
    tone === "primary" ? colors.primary : tone === "warning" ? colors.warning : colors.textMuted;
  return (
    <View
      className="flex-1 gap-2 rounded-3xl border border-slate-200/70 bg-white p-4 dark:border-ink-800 dark:bg-ink-900"
      accessible
      accessibilityLabel={`${label}: ${value}${unit ? ` ${unit}` : ""}`}
    >
      <Ionicons name={icon} size={18} color={iconColor} />
      <View className="flex-row items-baseline gap-1">
        <AppText
          variant="heading"
          className="shrink text-xl"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {value}
        </AppText>
        {unit ? (
          <AppText variant="caption" tone="muted" numberOfLines={1} className="shrink">
            {unit}
          </AppText>
        ) : null}
      </View>
      <AppText variant="caption" tone="muted" numberOfLines={2}>
        {label}
      </AppText>
    </View>
  );
}
