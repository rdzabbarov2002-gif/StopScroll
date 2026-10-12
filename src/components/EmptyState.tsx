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
    <View className="items-center gap-2 rounded-card bg-card px-6 py-8 dark:bg-ink-900">
      <View className="mb-1 h-12 w-12 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900">
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
