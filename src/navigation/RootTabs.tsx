import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { FloatingTabBar } from "../components/FloatingTabBar";
import { useT } from "../i18n";
import { AiScreen } from "../screens/AiScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { JournalScreen } from "../screens/JournalScreen";
import { ReplacementsScreen } from "../screens/ReplacementsScreen";
import { StatsScreen } from "../screens/StatsScreen";
import type { RootTabParamList } from "./types";

const Tab = createBottomTabNavigator<RootTabParamList>();

export function RootTabs() {
  const t = useT();
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t.common.tabs.home }} />
      <Tab.Screen name="AI" component={AiScreen} options={{ title: t.common.tabs.ai }} />
      <Tab.Screen
        name="Replacements"
        component={ReplacementsScreen}
        options={{ title: t.common.tabs.replacements }}
      />
      <Tab.Screen name="Stats" component={StatsScreen} options={{ title: t.common.tabs.stats }} />
      <Tab.Screen
        name="Journal"
        component={JournalScreen}
        options={{ title: t.common.tabs.journal }}
      />
    </Tab.Navigator>
  );
}
