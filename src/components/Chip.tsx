import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable } from "react-native";

import { cn } from "../utils/cn";
import { useThemeColors } from "../utils/theme";
import type { IconName } from "../utils/types";
import { AppText } from "./AppText";

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: IconName;
  className?: string;
}

export function Chip({ label, selected, onPress, icon, className }: ChipProps) {
  const { colors } = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      className={cn(
        "h-[38px] flex-row items-center gap-1.5 rounded-full px-4 active:opacity-80",
        selected
          ? "bg-brand-600 dark:bg-brand-500"
          : "border border-slate-200 bg-white dark:border-transparent dark:bg-ink-850",
        className,
      )}
    >
      {icon ? (
        <Ionicons name={icon} size={16} color={selected ? colors.onPrimary : colors.textMuted} />
      ) : null}
      <AppText
        variant="label"
        className={selected ? "text-white dark:text-white" : "text-slate-900 dark:text-white"}
      >
        {label}
      </AppText>
    </Pressable>
  );
}
