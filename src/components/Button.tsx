import Ionicons from "@expo/vector-icons/Ionicons";
import { ActivityIndicator, Pressable, View } from "react-native";

import { cn } from "../utils/cn";
import { useThemeColors } from "../utils/theme";
import type { IconName } from "../utils/types";
import { AppText } from "./AppText";

type Variant = "primary" | "success" | "warning" | "secondary" | "ghost";

const CONTAINER: Record<Variant, string> = {
  primary: "bg-brand-600 dark:bg-brand-500",
  success: "bg-emerald-600 dark:bg-emerald-500",
  warning: "bg-amber-400",
  secondary: "bg-white border border-slate-200 dark:bg-ink-850 dark:border-ink-700",
  ghost: "bg-transparent",
};

const LABEL: Record<Variant, string> = {
  primary: "text-white",
  success: "text-white",
  warning: "text-ink-950",
  secondary: "text-slate-800 dark:text-slate-100",
  ghost: "text-slate-600 dark:text-slate-300",
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
    variant === "primary" || variant === "success"
      ? colors.onPrimary
      : variant === "warning"
        ? colors.onWarning
        : variant === "secondary"
          ? colors.text
          : colors.textMuted;
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
        "flex-row items-center justify-center gap-2 rounded-2xl px-5 active:opacity-80",
        size === "lg" ? "h-14" : "h-12",
        CONTAINER[variant],
        inactive && "opacity-50",
        className,
      )}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon ? <Ionicons name={icon} size={size === "lg" ? 20 : 18} color={iconColor} /> : null}
          <AppText variant="label" className={cn(size === "lg" && "text-base", LABEL[variant])}>
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}
