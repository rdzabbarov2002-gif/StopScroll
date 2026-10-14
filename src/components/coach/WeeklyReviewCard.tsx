import Ionicons from "@expo/vector-icons/Ionicons";
import { View } from "react-native";

import type { ReviewSection } from "../../coach";
import { useCoachVoice } from "../../services/coachVoice";
import { useThemeColors } from "../../utils/theme";
import { AppText } from "../AppText";
import { Card } from "../Card";
import { CoachBadge } from "./CoachBadge";

/** The coach's conclusion under the weekly numbers, in five short parts. */
export function WeeklyReviewCard({ sections }: { sections: readonly ReviewSection[] }) {
  const { colors } = useThemeColors();
  const texts = useCoachVoice(sections.map((section) => section.text));
  const toneColor: Record<ReviewSection["tone"], string> = {
    success: colors.success,
    warning: colors.warningStrong,
    primary: colors.primary,
    indigo: colors.indigo,
  };

  return (
    <Card tone="primary" className="gap-4">
      <CoachBadge caption="Разбор недели" />
      {sections.map((section, index) => (
        <View key={section.id} className="flex-row items-start gap-3">
          <View
            className="mt-0.5 h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-ink-900"
            importantForAccessibility="no-hide-descendants"
          >
            <Ionicons name={section.icon} size={16} color={toneColor[section.tone]} />
          </View>
          <View className="flex-1 gap-0.5">
            <AppText variant="label" style={{ color: toneColor[section.tone] }}>
              {section.title}
            </AppText>
            <AppText className="text-[16px] leading-[22px]">{texts[index]}</AppText>
          </View>
        </View>
      ))}
    </Card>
  );
}
