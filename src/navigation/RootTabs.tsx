import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { FloatingTabBar } from "../components/FloatingTabBar";
import { HomeScreen } from "../screens/HomeScreen";
import { JournalScreen } from "../screens/JournalScreen";
import { ReplacementsScreen } from "../screens/ReplacementsScreen";
import { StatsScreen } from "../screens/StatsScreen";
import type { RootTabParamList } from "./types";

const Tab = createBottomTabNavigator<RootTabParamList>();

export function RootTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Главная" }} />
      <Tab.Screen
        name="Replacements"
        component={ReplacementsScreen}
        options={{ title: "Замены" }}
      />
      <Tab.Screen name="Stats" component={StatsScreen} options={{ title: "Статистика" }} />
      <Tab.Screen name="Journal" component={JournalScreen} options={{ title: "Дневник" }} />
    </Tab.Navigator>
  );
}
