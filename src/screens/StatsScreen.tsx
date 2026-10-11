import { View } from "react-native";

import { Screen } from "../components/Screen";
import { ScreenHeader } from "../components/ScreenHeader";
import { SectionTitle } from "../components/SectionTitle";
import { ComparisonCard } from "../components/stats/ComparisonCard";
import { EquivalentsCard } from "../components/stats/EquivalentsCard";
import { HeatmapCard } from "../components/stats/HeatmapCard";
import { ScrollLogger } from "../components/stats/ScrollLogger";
import { TrendCard } from "../components/stats/TrendCard";

export function StatsScreen() {
  return (
    <Screen>
      <ScreenHeader
        eyebrow="Статистика"
        title="Ваша динамика"
        subtitle="Отмечайте время в ленте каждый день — и смотрите, как оно тает."
      />
      <ScrollLogger />
      <ComparisonCard />
      <TrendCard />
      <HeatmapCard />
      <View className="gap-3">
        <SectionTitle title="Конвертер спасённого времени" />
        <EquivalentsCard />
      </View>
    </Screen>
  );
}
