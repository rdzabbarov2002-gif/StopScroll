import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import { Animated, Easing, Platform, Pressable, View } from "react-native";

import { haptics } from "../utils/haptics";
import { useThemeColors } from "../utils/theme";
import { AppText } from "./AppText";

const SIZE = 196;
const useNativeDriver = Platform.OS !== "web";

/** The big central "Переключиться (SOS)" button with a calm, breathing pulse. */
export function SOSButton({ onPress }: { onPress: () => void }) {
  const { colors, isDark } = useThemeColors();
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 2600,
        easing: Easing.out(Easing.quad),
        useNativeDriver,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const ring = (delay: number) => {
    // Repeated input stops ([0, 0, 1]) produce NaN with the native driver, so the first ring
    // uses the pulse value directly.
    const progress =
      delay === 0
        ? pulse
        : pulse.interpolate({
            inputRange: [0, delay, 1],
            outputRange: [0, 0, 1 - delay],
            extrapolate: "clamp",
          });
    return {
      position: "absolute" as const,
      width: SIZE,
      height: SIZE,
      borderRadius: SIZE / 2,
      backgroundColor: isDark ? "rgba(129, 140, 248, 0.25)" : "rgba(99, 102, 241, 0.22)",
      opacity: progress.interpolate({ inputRange: [0, 1 - delay], outputRange: [0.9, 0] }),
      transform: [
        { scale: progress.interpolate({ inputRange: [0, 1 - delay], outputRange: [1, 1.32] }) },
      ],
    };
  };

  return (
    <View className="items-center justify-center py-6" style={{ minHeight: SIZE * 1.32 + 24 }}>
      <Animated.View pointerEvents="none" style={ring(0)} />
      <Animated.View pointerEvents="none" style={ring(0.35)} />
      <Pressable
        onPress={() => {
          haptics.light();
          onPress();
        }}
        accessibilityRole="button"
        accessibilityLabel="Переключиться, SOS"
        accessibilityHint="Открывает 15-секундную паузу с дыханием, чтобы импульс ослаб"
        className="items-center justify-center rounded-full bg-brand-600 active:opacity-90 dark:bg-brand-500"
        style={{ width: SIZE, height: SIZE }}
      >
        <Ionicons name="hand-left-outline" size={40} color={colors.onPrimary} />
        <AppText variant="heading" className="mt-2 text-xl text-white">
          Переключиться
        </AppText>
        <View className="mt-1 rounded-full bg-white/20 px-3 py-0.5">
          <AppText variant="overline" className="text-white">
            SOS
          </AppText>
        </View>
      </Pressable>
    </View>
  );
}
