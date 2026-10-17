import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, View } from "react-native";

import { useT } from "../i18n";
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

/** The iOS segmented control: a grey track with a raised white (or grey) thumb. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  const t = useT();
  const { colors } = useThemeColors();
  return (
    <View
      className={cn("flex-row rounded-[10px] bg-[#E8E8ED] p-0.5 dark:bg-ink-800", className)}
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
            accessibilityLabel={
              option.locked ? t.common.pro.lockedOption(option.label) : option.label
            }
            className={cn(
              "h-8 flex-1 flex-row items-center justify-center gap-1 rounded-lg",
              selected && "bg-white shadow-sm shadow-black/10 dark:bg-ink-600 dark:shadow-none",
            )}
          >
            {option.locked ? (
              <Ionicons name="lock-closed" size={11} color={colors.textMuted} />
            ) : null}
            <AppText
              variant="label"
              numberOfLines={1}
              className={cn("text-[14px]", selected ? "" : "text-slate-700 dark:text-[#EBEBF5]")}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
