import Ionicons from "@expo/vector-icons/Ionicons";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import type { AchievementTone } from "../../utils/achievements";
import { useThemeColors, type ThemeColors } from "../../utils/theme";
import type { IconName } from "../../utils/types";

export function toneColor(tone: AchievementTone, colors: ThemeColors): string {
  switch (tone) {
    case "success":
      return colors.successBright;
    case "warning":
      return colors.warning;
    case "indigo":
      return colors.indigo;
    case "danger":
      return colors.danger;
    default:
      return colors.primary;
  }
}

/**
 * A round medal: filled with the achievement's color once earned, grey with a progress ring
 * around it while it is still ahead.
 */
export function AchievementBadge({
  icon,
  tone,
  unlocked,
  progress,
  size = 56,
}: {
  icon: IconName;
  tone: AchievementTone;
  unlocked: boolean;
  /** 0…1, drawn as a ring while locked. */
  progress: number;
  size?: number;
}) {
  const { colors } = useThemeColors();
  const color = toneColor(tone, colors);
  const stroke = Math.max(3, size / 16);
  const radius = size / 2 - stroke / 2;
  const circumference = 2 * Math.PI * radius;
  const inner = size - stroke * 4;

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      {!unlocked ? (
        <Svg width={size} height={size} style={{ position: "absolute" }}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.ringTrack}
            strokeWidth={stroke}
            fill="none"
          />
          {progress > 0 ? (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={stroke}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${circumference * Math.min(1, progress)} ${circumference}`}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          ) : null}
        </Svg>
      ) : null}
      <View
        className="items-center justify-center rounded-full"
        style={{
          width: unlocked ? size : inner,
          height: unlocked ? size : inner,
          backgroundColor: unlocked ? color : colors.ringTrack,
        }}
      >
        <Ionicons
          name={icon}
          size={(unlocked ? size : inner) * 0.46}
          color={unlocked ? "#FFFFFF" : colors.textSubtle}
        />
      </View>
    </View>
  );
}
