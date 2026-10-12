import Ionicons from "@expo/vector-icons/Ionicons";
import { ActivityIndicator, Pressable, View } from "react-native";

import { cn } from "../utils/cn";
import { useThemeColors } from "../utils/theme";
import type { IconName } from "../utils/types";
import { AppText } from "./AppText";

type Variant = "primary" | "success" | "warning" | "secondary" | "ghost";

const CONTAINER: Record<Variant, string> = {
  primary: "bg-brand-600 dark:bg-brand-500",
  success: "bg-emerald-500 dark:bg-emerald-400",
  // Destructive.
  warning: "bg-rose-500 dark:bg-rose-400",
  // iOS "grey" button: a soft fill with an accent label.
  secondary: "bg-card dark:bg-ink-850",
  ghost: "bg-transparent",
};

const LABEL: Record<Variant, string> = {
  primary: "text-white dark:text-white",
  success: "text-white dark:text-white",
  warning: "text-white dark:text-white",
  secondary: "text-brand-600 dark:text-brand-500",
  ghost: "text-slate-500 dark:text-[#AEAEB2]",
};

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: "md" | "lg";
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  accessibilityHint?: string;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  disabled = false,
  loading = false,
  className,
  accessibilityHint,
}: ButtonProps) {
  const { colors } = useThemeColors();
  const iconColor =
    variant === "secondary" ? colors.primary : variant === "ghost" ? colors.textMuted : "#FFFFFF";
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      className={cn(
        "flex-row items-center justify-center gap-2 rounded-full px-5 active:opacity-80",
        size === "lg" ? "h-[54px]" : "h-[46px]",
        CONTAINER[variant],
        inactive && "opacity-40",
        className,
      )}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} />
      ) : (
        <View className="shrink flex-row items-center gap-2">
          {icon ? <Ionicons name={icon} size={size === "lg" ? 20 : 18} color={iconColor} /> : null}
          <AppText
            variant="label"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            className={cn(
              "shrink text-center",
              size === "lg" ? "text-[17px]" : "text-[16px]",
              LABEL[variant],
            )}
          >
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}
