import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { Pressable, View } from "react-native";

import type { ProFeature } from "../navigation/types";
import { useThemeColors } from "../utils/theme";
import { AppText } from "./AppText";

interface LockedCardProps {
  title: string;
  text: string;
  feature: ProFeature;
}

/** Placeholder for a Pro-only block; tapping it opens the paywall. */
export function LockedCard({ title, text, feature }: LockedCardProps) {
  const navigation = useNavigation();
  const { colors } = useThemeColors();
  return (
    <Pressable
      onPress={() => navigation.navigate("Paywall", { feature })}
      accessibilityRole="button"
      accessibilityLabel={`${title}. Доступно в StopScroll Pro`}
      className="flex-row items-center gap-4 rounded-card bg-card p-[18px] active:opacity-80 dark:bg-ink-900"
    >
      <View className="h-11 w-11 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900">
        <Ionicons name="lock-closed" size={20} color={colors.primary} />
      </View>
      <View className="flex-1 gap-0.5">
        <AppText variant="label" className="text-base">
          {title}
        </AppText>
        <AppText variant="caption" tone="muted">
          {text}
        </AppText>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.chevron} />
    </Pressable>
  );
}
