import { View } from "react-native";

import { AppText } from "../components/AppText";
import { Screen } from "../components/Screen";
import { ComparisonCard } from "../components/stats/ComparisonCard";
import { EquivalentsCard } from "../components/stats/EquivalentsCard";
import { HeatmapCard } from "../components/stats/HeatmapCard";
import { ScrollLogger } from "../components/stats/ScrollLogger";
import { TrendCard } from "../components/stats/TrendCard";

export function StatsScreen() {
  return (
    <Screen>
      <View className="px-1 pb-1 pt-3">
        <AppText variant="title" accessibilityRole="header">
          Статистика
        </AppText>
      </View>
      <TrendCard />
      <ScrollLogger />
      <ComparisonCard />
      <HeatmapCard />
      <EquivalentsCard />
    </Screen>
  );
}
