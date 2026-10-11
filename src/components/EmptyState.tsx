import Ionicons from "@expo/vector-icons/Ionicons";
import { View } from "react-native";

import { useThemeColors } from "../utils/theme";
import type { IconName } from "../utils/types";
import { AppText } from "./AppText";

interface EmptyStateProps {
  icon: IconName;
  title: string;
  text: string;
}

export function EmptyState({ icon, title, text }: EmptyStateProps) {
  const { colors } = useThemeColors();
  return (
    <View className="items-center gap-2 rounded-3xl border border-dashed border-slate-300 px-6 py-8 dark:border-ink-700">
      <View className="mb-1 h-12 w-12 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-950/50">
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <AppText variant="label" className="text-base">
        {title}
      </AppText>
      <AppText variant="caption" tone="muted" className="text-center">
        {text}
      </AppText>
    </View>
  );
}
