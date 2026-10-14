import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { View } from "react-native";

import type { DailyBriefing } from "../../coach";
import { useApp } from "../../context/AppContext";
import { usePro } from "../../context/ProContext";
import { useCoachVoice } from "../../services/coachVoice";
import { DAY_FORMS, pluralize } from "../../utils/date";
import { findReplacement, isLocked } from "../../utils/replacements";
import { useThemeColors } from "../../utils/theme";
import type { RiskLevel } from "../../utils/types";
import { AppText } from "../AppText";
import { Button } from "../Button";
import { Card } from "../Card";
import { Separator } from "../CardLabel";
import { ProgressBar } from "../ProgressBar";
import { CoachBadge } from "./CoachBadge";

const RISK_LABEL: Record<RiskLevel, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
};
const RISK_STEPS: Record<RiskLevel, number> = { low: 1, medium: 2, high: 3 };

/** The heart of the home screen: today's risk, why, one piece of advice and a look back. */
export function BriefingCard({ briefing }: { briefing: DailyBriefing }) {
  const { colors } = useThemeColors();
  const navigation = useNavigation();
  const { customReplacements } = useApp();
  const { isPro } = usePro();
  const { risk, learning, advice } = briefing;

  const spoken = [briefing.riskReason ?? "", advice.text, briefing.memory ?? ""];
  const [riskReason, adviceText, memory] = useCoachVoice(spoken);

  const replacement = advice.replacementId
    ? findReplacement(advice.replacementId, customReplacements)
    : undefined;
  const offer = replacement && !isLocked(replacement, isPro) ? replacement : undefined;
  const riskColor =
    risk === "high" ? colors.danger : risk === "medium" ? colors.warningStrong : colors.success;

  return (
    <Card className="gap-4">
      <CoachBadge caption={learning ? "Знакомлюсь с твоими привычками" : "Брифинг на сегодня"} />

      {learning ? (
        <View className="gap-3">
          <AppText variant="statement">
            Пока я собираю информацию — прогноз появится, когда наберётся {learning.needed}{" "}
            {pluralize(learning.needed, DAY_FORMS)} с записями.
          </AppText>
          <View className="gap-1.5">
            <ProgressBar progress={learning.activeDays / learning.needed} />
            <AppText variant="caption" tone="subtle" className="text-[13px]">
              Дней с записями: {learning.activeDays} из {learning.needed}. Подойдёт любое: время в
              ленте, SOS-пауза, замена или срыв.
            </AppText>
          </View>
        </View>
      ) : risk ? (
        <View className="gap-2.5">
          <View
            className="gap-1.5"
            accessible
            accessibilityLabel={`Риск бесконтрольного скролла сегодня: ${RISK_LABEL[risk]}`}
          >
            <AppText variant="caption" tone="muted">
              Риск бесконтрольного скролла сегодня
            </AppText>
            <View className="flex-row items-center gap-3">
              <AppText variant="statement" style={{ color: riskColor }}>
                {RISK_LABEL[risk]}
              </AppText>
              <View className="flex-1 flex-row gap-1.5">
                {[1, 2, 3].map((step) => (
                  <View
                    key={step}
                    className="h-1.5 flex-1 rounded-full"
                    style={{
                      backgroundColor: step <= RISK_STEPS[risk] ? riskColor : colors.ringTrack,
                    }}
                  />
                ))}
              </View>
            </View>
          </View>
          {riskReason ? (
            <AppText className="text-[16px] leading-[22px]">
              <AppText className="text-[16px] font-semibold leading-[22px]">Почему: </AppText>
              {riskReason}
            </AppText>
          ) : null}
        </View>
      ) : null}

      <Separator />

      <View className="gap-2">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="compass-outline" size={16} color={colors.primary} />
          <AppText variant="label" tone="primary">
            Совет на сегодня
          </AppText>
        </View>
        <AppText variant="statement">{adviceText}</AppText>
        {offer ? (
          <Button
            label={`Начать: ${offer.title}`}
            icon="play"
            variant="secondary"
            className="mt-1 self-start"
            onPress={() => navigation.navigate("Replacement", { id: offer.id })}
          />
        ) : null}
      </View>

      {memory ? (
        <View className="flex-row items-start gap-2.5 rounded-2xl bg-white p-3.5 dark:bg-ink-850">
          <Ionicons name="time-outline" size={18} color={colors.indigo} style={{ marginTop: 1 }} />
          <AppText variant="caption" className="flex-1 font-medium">
            {memory}
          </AppText>
        </View>
      ) : null}
    </Card>
  );
}
