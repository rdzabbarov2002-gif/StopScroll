import { useEffect, useState } from "react";
import { Animated, Easing, View } from "react-native";

import { cn } from "../utils/cn";
import { useThemeColors } from "../utils/theme";

interface ProgressBarProps {
  /** 0…1 */
  progress: number;
  tone?: "primary" | "warning";
  className?: string;
}

export function ProgressBar({ progress, tone = "primary", className }: ProgressBarProps) {
  const { colors } = useThemeColors();
  const clamped = Math.min(1, Math.max(0, progress));
  const [value] = useState(() => new Animated.Value(clamped));

  useEffect(() => {
    Animated.timing(value, {
      toValue: clamped,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [clamped, value]);

  return (
    <View
      className={cn("h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-ink-800", className)}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <Animated.View
        style={{
          height: "100%",
          borderRadius: 999,
          backgroundColor: tone === "primary" ? colors.primary : colors.warning,
          width: value.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
        }}
      />
    </View>
  );
}
