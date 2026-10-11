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
      className="flex-row items-center gap-3"
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: format(value) }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(event) =>
        change(event.nativeEvent.actionName === "increment" ? step : -step)
      }
    >
      <View className="flex-1 gap-0.5">
        <AppText variant="label" className="text-base">
          {label}
        </AppText>
        {hint ? (
          <AppText variant="caption" tone="muted">
            {hint}
          </AppText>
        ) : null}
      </View>
      <View className="flex-row items-center gap-2">
        <StepButton icon="remove" disabled={value <= min} onPress={() => change(-step)} />
        <AppText variant="label" className="min-w-[72px] text-center text-base">
          {format(value)}
        </AppText>
        <StepButton icon="add" disabled={value >= max} onPress={() => change(step)} />
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
        "h-9 w-9 items-center justify-center rounded-full bg-slate-100 active:opacity-70 dark:bg-ink-800",
        disabled && "opacity-40",
      )}
    >
      <Ionicons name={icon} size={18} color={colors.text} />
    </Pressable>
  );
}
