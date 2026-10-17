import { useEffect, useState } from "react";
import { Animated, Easing, Modal, Platform, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useT } from "../../i18n";
import type { Achievement } from "../../utils/achievements";
import { formatDate } from "../../utils/date";
import { haptics } from "../../utils/haptics";
import { useThemeColors } from "../../utils/theme";
import { AppText } from "../AppText";
import { Button } from "../Button";
import { AchievementBadge, toneColor } from "./AchievementBadge";

const useNativeDriver = Platform.OS !== "web";
const BADGE = 112;
const STAGE = 240;
const SPARKS = 14;
const RAYS = 12;

export interface UnlockedAchievement {
  achievement: Achievement;
  title: string;
  achievedAt: number;
}

/** Tapered rays behind the medal, as one path. */
function raysPath(size: number): string {
  const center = size / 2;
  const inner = BADGE / 2 + 6;
  const outer = size / 2 - 4;
  const half = Math.PI / RAYS / 2.6;
  return Array.from({ length: RAYS }, (_, index) => {
    const angle = (index / RAYS) * Math.PI * 2;
    const point = (radius: number, offset: number) =>
      `${(center + Math.cos(angle + offset) * radius).toFixed(1)} ${(center + Math.sin(angle + offset) * radius).toFixed(1)}`;
    return `M ${point(inner, -half)} L ${point(outer, 0)} L ${point(inner, half)} Z`;
  }).join(" ");
}

/**
 * The moment an achievement is earned: the medal pops in, rays turn slowly behind it and
 * sparks fly out. Shown over regular screens, one achievement at a time.
 */
export function AchievementUnlock({
  unlocked,
  onClose,
  onOpenAll,
}: {
  unlocked: UnlockedAchievement | null;
  onClose: () => void;
  onOpenAll: () => void;
}) {
  const { colors } = useThemeColors();
  const t = useT().achievements.unlock;
  const [pop] = useState(() => new Animated.Value(0));
  const [spin] = useState(() => new Animated.Value(0));
  const [burst] = useState(() => new Animated.Value(0));
  const [glow] = useState(() => new Animated.Value(0));
  const [card] = useState(() => new Animated.Value(0));
  const id = unlocked?.achievement.id;

  useEffect(() => {
    if (!id) return;
    for (const value of [pop, burst, glow, card]) value.setValue(0);
    haptics.success();
    const entrance = Animated.parallel([
      Animated.spring(card, { toValue: 1, friction: 8, tension: 70, useNativeDriver }),
      Animated.sequence([
        Animated.delay(140),
        Animated.spring(pop, { toValue: 1, friction: 4, tension: 80, useNativeDriver }),
      ]),
      Animated.sequence([
        Animated.delay(220),
        Animated.timing(burst, {
          toValue: 1,
          duration: 1100,
          easing: Easing.out(Easing.cubic),
          useNativeDriver,
        }),
      ]),
      Animated.sequence([
        Animated.delay(220),
        Animated.loop(
          Animated.timing(glow, {
            toValue: 1,
            duration: 1600,
            easing: Easing.out(Easing.quad),
            useNativeDriver,
          }),
          { iterations: 2 },
        ),
      ]),
    ]);
    spin.setValue(0);
    const rotation = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 14000,
        easing: Easing.linear,
        useNativeDriver,
      }),
    );
    entrance.start();
    rotation.start();
    return () => {
      entrance.stop();
      rotation.stop();
    };
  }, [id, pop, spin, burst, glow, card]);

  if (!unlocked) return null;
  const color = toneColor(unlocked.achievement.tone, colors);
  const sparkColors = [color, colors.warning, colors.primary, colors.successBright];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <Animated.View
          style={{
            width: "100%",
            maxWidth: 380,
            opacity: card,
            transform: [
              { translateY: card.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
              { scale: card.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
            ],
          }}
        >
          <View
            accessibilityViewIsModal
            accessibilityLiveRegion="assertive"
            className="w-full items-center rounded-[32px] bg-canvas px-6 pb-6 pt-2 dark:bg-ink-900"
          >
            <View style={{ width: STAGE, height: STAGE }} className="items-center justify-center">
              <Animated.View
                style={{
                  position: "absolute",
                  opacity: pop.interpolate({ inputRange: [0, 1], outputRange: [0, 0.22] }),
                  transform: [
                    {
                      rotate: spin.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "360deg"],
                      }),
                    },
                  ],
                }}
              >
                <Svg width={STAGE} height={STAGE}>
                  <Path d={raysPath(STAGE)} fill={color} />
                </Svg>
              </Animated.View>

              <Animated.View
                style={{
                  position: "absolute",
                  width: BADGE,
                  height: BADGE,
                  borderRadius: BADGE,
                  backgroundColor: color,
                  opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] }),
                  transform: [
                    { scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] }) },
                  ],
                }}
              />

              {Array.from({ length: SPARKS }, (_, index) => {
                const angle = (index / SPARKS) * Math.PI * 2 + (index % 2) * 0.2;
                const distance = index % 3 === 0 ? 112 : 92;
                const size = index % 3 === 0 ? 9 : 6;
                return (
                  <Animated.View
                    key={index}
                    style={{
                      position: "absolute",
                      width: size,
                      height: size,
                      borderRadius: size,
                      backgroundColor: sparkColors[index % sparkColors.length],
                      opacity: burst.interpolate({
                        inputRange: [0, 0.15, 1],
                        outputRange: [0, 1, 0],
                      }),
                      transform: [
                        {
                          translateX: burst.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, Math.cos(angle) * distance],
                          }),
                        },
                        {
                          translateY: burst.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, Math.sin(angle) * distance],
                          }),
                        },
                      ],
                    }}
                  />
                );
              })}

              <Animated.View
                style={{
                  transform: [
                    { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
                    {
                      rotate: pop.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["-18deg", "0deg"],
                      }),
                    },
                  ],
                }}
              >
                <AchievementBadge
                  icon={unlocked.achievement.icon}
                  tone={unlocked.achievement.tone}
                  unlocked
                  progress={1}
                  size={BADGE}
                />
              </Animated.View>
            </View>

            <AppText variant="overline" style={{ color }} className="text-center">
              {t.overline}
            </AppText>
            <AppText
              className="mt-1.5 text-center text-[26px] font-bold leading-[31px] tracking-tight"
              accessibilityRole="header"
            >
              {unlocked.title}
            </AppText>
            <AppText tone="muted" className="mt-2 text-center">
              {unlocked.achievement.description}
            </AppText>
            <AppText variant="caption" tone="subtle" className="mt-2 text-center">
              {formatDate(unlocked.achievedAt)}
            </AppText>

            <View className="mt-5 w-full gap-2">
              <Button label={t.close} size="lg" onPress={onClose} />
              <Button label={t.openAll} variant="secondary" onPress={onOpenAll} />
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
