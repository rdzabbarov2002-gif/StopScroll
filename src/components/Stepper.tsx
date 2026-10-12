import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, View } from "react-native";

import { cn } from "../utils/cn";
import { haptics } from "../utils/haptics";
import { useThemeColors } from "../utils/theme";
import { AppText } from "./AppText";

interface StepperProps {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
}

export function Stepper({ label, hint, value, min, max, step, format, onChange }: StepperProps) {
  const change = (delta: number) => {
    const next = Math.min(max, Math.max(min, value + delta));
    if (next === value) return;
    haptics.selection();
    onChange(next);
  };

  return (
    <View
      className="gap-1"
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: format(value) }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(event) =>
        change(event.nativeEvent.actionName === "increment" ? step : -step)
      }
    >
      <View className="flex-row items-center justify-between gap-3">
        <AppText variant="heading" className="flex-1 text-[16px]">
          {label}
        </AppText>
        <AppText rounded variant="heading" tone="primary" className="text-[17px]">
          {format(value)}
        </AppText>
      </View>
      <View className="flex-row items-center justify-between gap-3">
        <AppText variant="caption" tone="subtle" className="flex-1 text-[13px] leading-[18px]">
          {hint ?? ""}
        </AppText>
        <View className="flex-row items-center gap-2">
          <StepButton icon="remove" disabled={value <= min} onPress={() => change(-step)} />
          <StepButton icon="add" disabled={value >= max} onPress={() => change(step)} />
        </View>
      </View>
    </View>
  );
}

function StepButton({
  icon,
  disabled,
  onPress,
}: {
  icon: "add" | "remove";
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors } = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      importantForAccessibility="no"
      accessibilityElementsHidden
      className={cn(
        "h-9 w-9 items-center justify-center rounded-full bg-white active:opacity-70 dark:bg-ink-800",
        disabled && "opacity-40",
      )}
    >
      <Ionicons name={icon} size={18} color={colors.primary} />
    </Pressable>
  );
}
