import { View } from "react-native";

import { AppText } from "../components/AppText";
import { ListGroup, ListRow } from "../components/ListGroup";
import { Screen } from "../components/Screen";
import { ComparisonCard } from "../components/stats/ComparisonCard";
import { EquivalentsCard } from "../components/stats/EquivalentsCard";
import { HeatmapCard } from "../components/stats/HeatmapCard";
import { ScrollLogger } from "../components/stats/ScrollLogger";
import { TrendCard } from "../components/stats/TrendCard";
import { useApp } from "../context/AppContext";
import type { RootTabScreenProps } from "../navigation/types";
import { ACHIEVEMENTS } from "../utils/achievements";
import { formatWeekRange } from "../utils/date";
import { useThemeColors } from "../utils/theme";
import { latestReportWeek } from "../utils/weeklyReport";

export function StatsScreen({ navigation }: RootTabScreenProps<"Stats">) {
  const { colors } = useThemeColors();
  const app = useApp();
  return (
    <Screen>
      <View className="px-1 pb-1 pt-3">
        <AppText variant="title" accessibilityRole="header">
          Статистика
        </AppText>
      </View>
      <ListGroup>
        <ListRow
          icon="calendar"
          iconColor={colors.primary}
          title="Отчёт за неделю"
          value={formatWeekRange(latestReportWeek())}
          onPress={() => navigation.navigate("WeeklyReport")}
        />
        <ListRow
          icon="trophy"
          iconColor={colors.warning}
          title="Достижения"
          value={`${Object.keys(app.achievements).length} из ${ACHIEVEMENTS.length}`}
          onPress={() => navigation.navigate("Achievements")}
        />
      </ListGroup>
      <TrendCard />
      <ScrollLogger />
      <ComparisonCard />
      <HeatmapCard />
      <EquivalentsCard />
    </Screen>
  );
}
