import Ionicons from "@expo/vector-icons/Ionicons";
import { View } from "react-native";

import { useThemeColors } from "../../utils/theme";
import { AppText } from "../AppText";

/** "Ваш персональный коуч" — who is speaking in a card. */
export function CoachBadge({ caption }: { caption?: string }) {
  const { colors } = useThemeColors();
  return (
    <View className="flex-row items-center gap-2.5">
      <View
        className="h-8 w-8 items-center justify-center rounded-full"
        style={{ backgroundColor: colors.primary }}
        importantForAccessibility="no-hide-descendants"
      >
        <Ionicons name="compass" size={18} color={colors.onPrimary} />
      </View>
      <View className="shrink">
        <AppText variant="label" className="text-[15px]" numberOfLines={1}>
          Ваш персональный коуч
        </AppText>
        {caption ? (
          <AppText
            variant="caption"
            tone="subtle"
            className="text-[12px] leading-4"
            numberOfLines={1}
          >
            {caption}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}
