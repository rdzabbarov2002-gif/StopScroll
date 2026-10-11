import Ionicons from "@expo/vector-icons/Ionicons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Platform } from "react-native";

import { HomeScreen } from "../screens/HomeScreen";
import { JournalScreen } from "../screens/JournalScreen";
import { ReplacementsScreen } from "../screens/ReplacementsScreen";
import { StatsScreen } from "../screens/StatsScreen";
import { useThemeColors } from "../utils/theme";
import type { IconName } from "../utils/types";
import type { RootTabParamList } from "./types";

const Tab = createBottomTabNavigator<RootTabParamList>();

const ICONS: Record<keyof RootTabParamList, { active: IconName; inactive: IconName }> = {
  Home: { active: "home", inactive: "home-outline" },
  Replacements: { active: "swap-horizontal", inactive: "swap-horizontal-outline" },
  Stats: { active: "stats-chart", inactive: "stats-chart-outline" },
  Journal: { active: "journal", inactive: "journal-outline" },
};

export function RootTabs() {
  const { colors } = useThemeColors();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primaryStrong,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          ...(Platform.OS === "web" ? { height: 64, paddingBottom: 8, paddingTop: 6 } : {}),
        },
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons
            name={focused ? ICONS[route.name].active : ICONS[route.name].inactive}
            size={size}
            color={color}
          />
        ),
      })}
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
