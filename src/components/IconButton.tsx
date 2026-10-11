import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable } from "react-native";

import { cn } from "../utils/cn";
import { useThemeColors } from "../utils/theme";
import type { IconName } from "../utils/types";

interface IconButtonProps {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
  className?: string;
}

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  size = 20,
  className,
}: IconButtonProps) {
  const { colors } = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      className={cn(
        "h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white active:opacity-70 dark:border-ink-800 dark:bg-ink-900",
        className,
      )}
    >
      <Ionicons name={icon} size={size} color={colors.text} />
    </Pressable>
  );
}
