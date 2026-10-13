import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useApp } from "../context/AppContext";
import { AchievementsScreen } from "../screens/AchievementsScreen";
import { GateScreen } from "../screens/GateScreen";
import { GateSetupScreen } from "../screens/GateSetupScreen";
import { InterceptScreen } from "../screens/InterceptScreen";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { PaywallScreen } from "../screens/PaywallScreen";
import { PrivacyScreen } from "../screens/PrivacyScreen";
import { ReplacementScreen } from "../screens/ReplacementScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { WeeklyReportScreen } from "../screens/WeeklyReportScreen";
import { RootTabs } from "./RootTabs";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { onboarded } = useApp();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {onboarded ? (
        <>
          <Stack.Screen name="Main" component={RootTabs} />
          <Stack.Screen
            name="Intercept"
            component={InterceptScreen}
            // The pause is the point: no swipe-to-dismiss, only the explicit close button.
            options={{ presentation: "fullScreenModal", animation: "fade", gestureEnabled: false }}
          />
          <Stack.Screen
            name="Replacement"
            component={ReplacementScreen}
            options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }}
          />
          <Stack.Screen
            name="Paywall"
            component={PaywallScreen}
            options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }}
          />
          <Stack.Screen
            name="Privacy"
            component={PrivacyScreen}
            // Opened from the full-screen Paywall too: a full-screen modal avoids an iOS page sheet.
            options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="Gate"
            component={GateScreen}
            // Like the SOS pause: it opens over the feed app and only closes on a choice.
            options={{ presentation: "fullScreenModal", animation: "fade", gestureEnabled: false }}
          />
          <Stack.Screen
            name="GateSetup"
            component={GateSetupScreen}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="WeeklyReport"
            component={WeeklyReportScreen}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="Achievements"
            component={AchievementsScreen}
            options={{ animation: "slide_from_right" }}
          />
        </>
      ) : (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      )}
    </Stack.Navigator>
  );
}
