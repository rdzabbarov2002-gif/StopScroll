import Ionicons from "@expo/vector-icons/Ionicons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useEffect, useState } from "react";
import { Keyboard, Pressable, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { cn } from "../utils/cn";
import { haptics } from "../utils/haptics";
import { useThemeColors } from "../utils/theme";
import type { IconName } from "../utils/types";
import { AppText } from "./AppText";

const BAR_HEIGHT = 64;
const SOS_SIZE = 64;
/** Space a tab screen leaves at the bottom so its last card clears the floating bar. */
export const FLOATING_TAB_BAR_SPACE = BAR_HEIGHT + 40;

const ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  Home: { active: "home", inactive: "home-outline" },
  AI: { active: "sparkles", inactive: "sparkles-outline" },
  Replacements: { active: "swap-horizontal", inactive: "swap-horizontal" },
  Stats: { active: "stats-chart", inactive: "stats-chart-outline" },
  Journal: { active: "book", inactive: "book-outline" },
};

/**
 * The iOS 26 style floating tab bar: a rounded "glass" pill with the sections, and a
 * separate round button on the right that starts the SOS pause from anywhere.
 */
export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();
  const bottom = Math.max(insets.bottom - 8, 12);
  const fadeHeight = bottom + BAR_HEIGHT + 36;
  const keyboardVisible = useKeyboardVisible();

  // The floating bar would otherwise ride up over a text field while typing.
  if (keyboardVisible) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: fadeHeight,
        zIndex: 10,
        elevation: 10,
      }}
    >
      {/* Content fades out under the bar instead of colliding with it. */}
      <Svg
        pointerEvents="none"
        width="100%"
        height={fadeHeight}
        style={{ position: "absolute", bottom: 0 }}
      >
        <Defs>
          <LinearGradient id="tabFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.background} stopOpacity={0} />
            <Stop offset="0.55" stopColor={colors.background} stopOpacity={0.9} />
            <Stop offset="1" stopColor={colors.background} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height={fadeHeight} fill="url(#tabFade)" />
      </Svg>
      <View
        pointerEvents="box-none"
        style={{ position: "absolute", left: 16, right: 16, bottom }}
        className="flex-row items-center gap-3"
      >
        <View
          className="flex-1 flex-row items-center rounded-full p-1 shadow-lg shadow-black/10"
          style={{
            height: BAR_HEIGHT,
            backgroundColor: colors.tabBar,
            borderWidth: 0.5,
            borderColor: colors.separator,
          }}
        >
          {state.routes.map((route, index) => {
            const crowded = state.routes.length > 4;
            const focused = state.index === index;
            const { options } = descriptors[route.key]!;
            const label = typeof options.title === "string" ? options.title : route.name;
            const icon = ICONS[route.name] ?? { active: "ellipse", inactive: "ellipse-outline" };
            const color = focused ? colors.primary : colors.text;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                haptics.selection();
                navigation.navigate(route.name, route.params);
              }
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={label}
                className={cn("h-full flex-1 items-center justify-center gap-0.5 rounded-full")}
                style={focused ? { backgroundColor: colors.tabActive } : undefined}
              >
                <Ionicons name={focused ? icon.active : icon.inactive} size={23} color={color} />
                <AppText
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  className="text-[10.5px] font-semibold"
                  // Five sections leave ~55 pt each; the web can't shrink text to fit by itself.
                  style={[{ color }, crowded ? { fontSize: 9.5, letterSpacing: -0.3 } : null]}
                >
                  {label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={() => {
            haptics.light();
            navigation.getParent()?.navigate("Intercept");
          }}
          accessibilityRole="button"
          accessibilityLabel="SOS-пауза"
          accessibilityHint="Открывает 15-секундную паузу с дыханием, чтобы импульс ослаб"
          className="items-center justify-center rounded-full active:opacity-80"
          style={{
            width: SOS_SIZE,
            height: SOS_SIZE,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOpacity: 0.35,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
          }}
        >
          <Ionicons name="pause" size={28} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setVisible(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}
