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
}

export function Chip({ label, selected, onPress, icon }: ChipProps) {
  const { colors } = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      className={cn(
        "flex-row items-center gap-1.5 rounded-full border px-4 py-2.5 active:opacity-80",
        selected
          ? "border-brand-600 bg-brand-600 dark:border-brand-500 dark:bg-brand-500"
          : "border-slate-200 bg-white dark:border-ink-700 dark:bg-ink-900",
      )}
    >
      {icon ? (
        <Ionicons name={icon} size={16} color={selected ? colors.onPrimary : colors.textMuted} />
      ) : null}
      <AppText
        variant="label"
        className={selected ? "text-white" : "text-slate-700 dark:text-slate-200"}
      >
        {label}
      </AppText>
    </Pressable>
  );
}
