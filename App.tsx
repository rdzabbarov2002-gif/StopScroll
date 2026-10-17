import "./global.css";

import { DarkTheme, DefaultTheme, NavigationContainer, type Theme } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { colorScheme } from "nativewind";
import { useEffect, useMemo } from "react";
import { ActivityIndicator, Appearance, Platform, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AchievementCenter } from "./src/components/achievements/AchievementCenter";
import { AiProvider } from "./src/context/AiContext";
import { AppProvider, useApp } from "./src/context/AppContext";
import { ProProvider } from "./src/context/ProContext";
import { linking, navigationRef } from "./src/navigation/linking";
import { rememberedNavigation } from "./src/navigation/restore";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { LanguageScreen } from "./src/screens/LanguageScreen";
import { NativeSync } from "./src/services/NativeSync";
import { useThemeColors } from "./src/utils/theme";

/** Applies the saved theme preference to NativeWind (and therefore to every `dark:` class). */
function ThemeSync() {
  const { themePreference } = useApp();

  useEffect(() => {
    if (themePreference === "system" && Platform.OS === "web") {
      // On web the "dark" class must be set explicitly, so resolve the system scheme ourselves.
      const apply = () =>
        colorScheme.set(Appearance.getColorScheme() === "dark" ? "dark" : "light");
      apply();
      const subscription = Appearance.addChangeListener(apply);
      return () => subscription.remove();
    }
    colorScheme.set(themePreference);
  }, [themePreference]);

  return null;
}

function AppShell() {
  const { hydrated, onboarded, language } = useApp();
  const { isDark, colors } = useThemeColors();

  const navigationTheme = useMemo<Theme>(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primaryStrong,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        notification: colors.danger,
      },
    };
  }, [isDark, colors]);

  // The native window shows through modal sheets and transitions; keep it on the theme's color.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => undefined);
  }, [colors.background]);

  // A new language re-creates every screen (texts outside React hooks are read during render);
  // the user stays where they were.
  const restore = useMemo(() => (language ? rememberedNavigation() : undefined), [language]);

  return (
    <>
      <ThemeSync />
      <StatusBar style={isDark ? "light" : "dark"} />
      {hydrated && !language ? (
        // The very first launch: nothing else is reachable until a language is chosen.
        <LanguageScreen />
      ) : hydrated ? (
        <NavigationContainer
          key={language ?? "none"}
          initialState={restore}
          ref={navigationRef}
          theme={navigationTheme}
          // Deep links (the pause, widgets, the Sunday report) exist only in the native apps;
          // on the web preview the browser URL stays untouched.
          linking={Platform.OS === "web" ? undefined : linking}
        >
          <RootNavigator />
          {onboarded ? (
            <>
              <NativeSync />
              <AchievementCenter />
            </>
          ) : null}
        </NavigationContainer>
      ) : (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.background,
          }}
        >
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <ProProvider>
          <AiProvider>
            <AppShell />
          </AiProvider>
        </ProProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}
