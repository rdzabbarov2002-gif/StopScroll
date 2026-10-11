import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useApp } from "../context/AppContext";
import { InterceptScreen } from "../screens/InterceptScreen";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { PaywallScreen } from "../screens/PaywallScreen";
import { ReplacementScreen } from "../screens/ReplacementScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
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
            name="Settings"
            component={SettingsScreen}
            options={{ animation: "slide_from_right" }}
          />
        </>
      ) : (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      )}
    </Stack.Navigator>
  );
}
