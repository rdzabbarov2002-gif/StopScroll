import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Switch, View } from "react-native";

import { useApp } from "../context/AppContext";
import { useT } from "../i18n";
import { haptics } from "../utils/haptics";
import { useThemeColors } from "../utils/theme";
import { AppText } from "./AppText";
import { Separator } from "./CardLabel";

/** Fixed preview colors: the light thumbnail stays light in the dark theme and vice versa. */
const PREVIEW = {
  light: {
    page: "#FFFFFF",
    card: "#EDEDF1",
    line: "#C9C9CE",
    accent: "#1A7FFF",
    border: "#D1D1D6",
  },
  dark: { page: "#0B0B0C", card: "#2A2A2D", line: "#4A4A4E", accent: "#2B8CFF", border: "#3A3A3C" },
} as const;

/** iOS "Display & Brightness" style picker: light / dark thumbnails and a "follow system" switch. */
export function ThemePicker() {
  const t = useT();
  const { themePreference, setThemePreference } = useApp();
  const { isDark, colors } = useThemeColors();
  const resolved = isDark ? "dark" : "light";
  const followsSystem = themePreference === "system";

  return (
    <View className="overflow-hidden rounded-card bg-card dark:bg-ink-900">
      <View className="flex-row justify-center gap-14 pb-3.5 pt-5">
        {(["light", "dark"] as const).map((scheme) => {
          const selected = (followsSystem ? resolved : themePreference) === scheme;
          const label = scheme === "light" ? t.common.theme.light : t.common.theme.dark;
          return (
            <Pressable
              key={scheme}
              onPress={() => {
                haptics.selection();
                setThemePreference(scheme);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={
                scheme === "light" ? t.common.theme.lightA11y : t.common.theme.darkA11y
              }
              className="items-center gap-2 active:opacity-80"
            >
              <PhonePreview scheme={scheme} />
              <AppText variant="caption">{label}</AppText>
              {selected ? (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              ) : (
                <View
                  className="h-[22px] w-[22px] rounded-full"
                  style={{ borderWidth: 1.5, borderColor: colors.ringTrack }}
                />
              )}
            </Pressable>
          );
        })}
      </View>
      <Separator />
      <View className="min-h-[50px] flex-row items-center justify-between gap-3 px-4">
        <AppText variant="body">{t.common.theme.system}</AppText>
        <Switch
          value={followsSystem}
          onValueChange={(value) => {
            haptics.selection();
            setThemePreference(value ? "system" : resolved);
          }}
          trackColor={{ true: colors.successBright, false: isDark ? "#39393D" : "#E9E9EA" }}
          ios_backgroundColor={isDark ? "#39393D" : "#E9E9EA"}
          thumbColor="#FFFFFF"
          accessibilityLabel={t.common.theme.systemA11y}
        />
      </View>
    </View>
  );
}

function PhonePreview({ scheme }: { scheme: "light" | "dark" }) {
  const c = PREVIEW[scheme];
  return (
    <View
      className="h-[122px] w-[66px] gap-1.5 rounded-[13px] p-[7px] pt-4"
      style={{ backgroundColor: c.page, borderWidth: 1, borderColor: c.border }}
    >
      <View className="h-1.5 w-[30px] rounded-full" style={{ backgroundColor: c.line }} />
      <View className="gap-1 rounded-[7px] p-1.5" style={{ backgroundColor: c.card }}>
        <View className="h-1 w-5 rounded-full" style={{ backgroundColor: c.accent }} />
        <View className="h-1 w-9 rounded-full" style={{ backgroundColor: c.line }} />
        <View className="h-1 w-6 rounded-full" style={{ backgroundColor: c.line }} />
      </View>
      <View className="h-7 rounded-[7px]" style={{ backgroundColor: c.card }} />
      <View className="mt-auto flex-row items-center gap-1">
        <View className="h-[11px] flex-1 rounded-full" style={{ backgroundColor: c.card }} />
        <View className="h-[11px] w-[11px] rounded-full" style={{ backgroundColor: c.accent }} />
      </View>
    </View>
  );
}
