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
  /** "accent" tints the icon and the fill with the accent color (e.g. the profile button). */
  tone?: "neutral" | "accent";
  className?: string;
}

/** A round soft-filled icon button, like the close and profile buttons in iOS apps. */
export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  size = 18,
  tone = "neutral",
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
        "h-9 w-9 items-center justify-center rounded-full active:opacity-70",
        tone === "accent" ? "bg-brand-50 dark:bg-brand-900" : "bg-card dark:bg-ink-850",
        className,
      )}
    >
      <Ionicons
        name={icon}
        size={size}
        color={tone === "accent" ? colors.primary : colors.textMuted}
      />
    </Pressable>
  );
}
