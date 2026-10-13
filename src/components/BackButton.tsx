import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { Pressable } from "react-native";

import { useThemeColors } from "../utils/theme";
import { AppText } from "./AppText";

/** iOS-style "‹ Назад" link at the top of a pushed screen. */
export function BackButton({ label }: { label: string }) {
  const { colors } = useThemeColors();
  const navigation = useNavigation();
  return (
    <Pressable
      onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate("Main"))}
      accessibilityRole="button"
      accessibilityLabel="Назад"
      hitSlop={8}
      className="h-9 flex-row items-center gap-0.5 self-start active:opacity-60"
    >
      <Ionicons name="chevron-back" size={24} color={colors.primary} />
      <AppText variant="body" tone="primary">
        {label}
      </AppText>
    </Pressable>
  );
}
