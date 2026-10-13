import type { ReactNode } from "react";
import { Animated, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { useThemeColors } from "../utils/theme";

const RING_STROKE = 6;

interface BreathingRingProps {
  size: number;
  /** Scale of the breathing disc (the caller animates it between ~0.6 and 1). */
  scale: Animated.Value;
  /** Share of the time left, 1 → 0; the ring empties as the pause runs. */
  remaining: number;
  /** Ring and disc color; the accent by default. */
  color?: string;
  accessibilityLabel: string;
  children: ReactNode;
}

/** Soft concentric tints, a breathing disc and a countdown ring around the content. */
export function BreathingRing({
  size,
  scale,
  remaining,
  color,
  accessibilityLabel,
  children,
}: BreathingRingProps) {
  const { colors, isDark } = useThemeColors();
  const tint = color ?? colors.primary;
  const ringRadius = size / 2 - RING_STROKE;
  const circumference = 2 * Math.PI * ringRadius;
  const left = Math.min(1, Math.max(0, remaining));

  return (
    <View
      style={{ width: size, height: size }}
      className="items-center justify-center"
      accessible
      accessibilityLiveRegion="polite"
      accessibilityLabel={accessibilityLabel}
    >
      {[0.86, 0.72, 0.58].map((share, index) => (
        <View
          key={share}
          className="absolute rounded-full"
          style={{
            width: size * share,
            height: size * share,
            backgroundColor: tint,
            opacity: isDark ? [0.1, 0.14, 0.2][index] : [0.07, 0.1, 0.15][index],
          }}
        />
      ))}
      <Animated.View
        style={{
          position: "absolute",
          width: size * 0.86,
          height: size * 0.86,
          borderRadius: size,
          backgroundColor: tint,
          opacity: isDark ? 0.18 : 0.12,
          transform: [{ scale }],
        }}
      />
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={ringRadius}
          stroke={colors.ringTrack}
          strokeWidth={RING_STROKE}
          fill="none"
        />
        {left > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={ringRadius}
            stroke={tint}
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${circumference * left} ${circumference}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </Svg>
      {children}
    </View>
  );
}
