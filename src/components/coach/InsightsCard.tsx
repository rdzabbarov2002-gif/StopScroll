import Ionicons from "@expo/vector-icons/Ionicons";
import { View } from "react-native";

import type { Insight } from "../../coach";
import { useT } from "../../i18n";
import { useCoachVoice } from "../../services/coachVoice";
import { useThemeColors } from "../../utils/theme";
import { AppText } from "../AppText";
import { Card } from "../Card";
import { CardLabel } from "../CardLabel";

/** "Что видно по записям" — the strongest patterns from the user's own records. */
export function InsightsCard({ insights }: { insights: readonly Insight[] }) {
  const { colors } = useThemeColors();
  const t = useT();
  const shown = insights.slice(0, 3);
  const texts = useCoachVoice(shown.map((insight) => insight.text));
  if (shown.length === 0) return null;
  const toneColor: Record<Insight["tone"], string> = {
    primary: colors.primary,
    success: colors.success,
    warning: colors.warningStrong,
    indigo: colors.indigo,
  };

  return (
    <Card className="gap-3.5">
      <CardLabel icon="analytics" label={t.coach.ui.insightsTitle} color={colors.indigo} />
      {shown.map((insight, index) => (
        <View key={insight.id} className="flex-row items-start gap-3">
          <Ionicons
            name={insight.icon}
            size={18}
            color={toneColor[insight.tone]}
            style={{ marginTop: 2 }}
          />
          <AppText className="flex-1 text-[16px] leading-[22px]">{texts[index]}</AppText>
        </View>
      ))}
    </Card>
  );
}
