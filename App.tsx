import "./global.css";

import { DarkTheme, DefaultTheme, NavigationContainer, type Theme } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { colorScheme } from "nativewind";
import { useEffect, useMemo } from "react";
import { ActivityIndicator, Appearance, Platform, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppProvider, useApp } from "./src/context/AppContext";
import { ProProvider } from "./src/context/ProContext";
import { RootNavigator } from "./src/navigation/RootNavigator";
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
  const { hydrated } = useApp();
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

  return (
    <>
      <ThemeSync />
      <StatusBar style={isDark ? "light" : "dark"} />
      {hydrated ? (
        <NavigationContainer theme={navigationTheme}>
          <RootNavigator />
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
          <AppShell />
        </ProProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}
