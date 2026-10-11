import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, View } from "react-native";

import { cn } from "../utils/cn";
import { haptics } from "../utils/haptics";
import { useThemeColors } from "../utils/theme";
import { AppText } from "./AppText";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  /** Shows a lock and still calls onChange, so the caller can open the paywall. */
  locked?: boolean;
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  const { colors } = useThemeColors();
  return (
    <View
      className={cn("flex-row rounded-2xl bg-slate-100 p-1 dark:bg-ink-850", className)}
      accessibilityRole="tablist"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => {
              haptics.selection();
              onChange(option.value);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.locked ? `${option.label}, доступно в Pro` : option.label}
            className={cn(
              "h-9 flex-1 flex-row items-center justify-center gap-1 rounded-xl",
              selected && "bg-white shadow-sm shadow-slate-300 dark:bg-ink-700 dark:shadow-none",
            )}
          >
            {option.locked ? (
              <Ionicons name="lock-closed" size={11} color={colors.textMuted} />
            ) : null}
            <AppText variant="label" tone={selected ? "default" : "muted"} className="text-[13px]">
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
