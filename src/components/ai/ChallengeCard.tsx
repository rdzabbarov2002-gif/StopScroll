import Ionicons from "@expo/vector-icons/Ionicons";
import { ActivityIndicator, View } from "react-native";

import type { AiChallenge } from "../../ai/types";
import { useAi } from "../../context/AiContext";
import { addDays, dayKey, pluralize, DAY_FORMS } from "../../utils/date";
import { haptics } from "../../utils/haptics";
import { useThemeColors } from "../../utils/theme";
import { AppText } from "../AppText";
import { Button } from "../Button";
import { Card } from "../Card";
import { CardLabel } from "../CardLabel";

/** The weekly experiment: proposed → in progress (daily check) → ChatGPT's review. */
export function ChallengeCard({
  challenge,
  readOnly = false,
}: {
  challenge: AiChallenge;
  /** The web preview's sample: no buttons. */
  readOnly?: boolean;
}) {
  const { colors } = useThemeColors();
  const ai = useAi();
  const today = dayKey();
  const days = challenge.startDay
    ? Array.from({ length: challenge.durationDays }, (_, index) =>
        addDays(challenge.startDay!, index),
      )
    : [];
  const checkedToday = challenge.checkins[today];

  return (
    <Card className="gap-3">
      <CardLabel icon="flask" label="AI Challenge" color={colors.success} />
      <AppText variant="caption" tone="subtle" className="text-[13px]">
        {challenge.status === "proposed"
          ? "Попробуем маленький эксперимент"
          : challenge.status === "active"
            ? `Эксперимент · день ${Math.min(days.indexOf(today) + 1 || days.length, days.length)} из ${days.length}`
            : "Итог эксперимента"}
      </AppText>
      <AppText variant="statement">{challenge.title}</AppText>
      <AppText className="text-[16px] leading-[22px]">{challenge.description}</AppText>

      {challenge.status === "proposed" ? (
        <>
          <AppText variant="caption" tone="muted">
            На {challenge.durationDays} {pluralize(challenge.durationDays, DAY_FORMS)}.{" "}
            {challenge.expectation}
          </AppText>
          {!readOnly ? (
            <View className="gap-2">
              <Button label="Попробовать" onPress={ai.acceptChallenge} />
              <Button label="Не сейчас" variant="ghost" onPress={ai.declineChallenge} />
            </View>
          ) : null}
        </>
      ) : null}

      {challenge.status === "active" ? (
        <>
          <View className="flex-row gap-2" accessible accessibilityLabel="Дни эксперимента">
            {days.map((day) => {
              const value = challenge.checkins[day];
              return (
                <View
                  key={day}
                  className="h-2 flex-1 rounded-full"
                  style={{
                    backgroundColor:
                      value === true
                        ? colors.success
                        : value === false
                          ? colors.warningStrong
                          : colors.ringTrack,
                  }}
                />
              );
            })}
          </View>
          {days.includes(today) ? (
            checkedToday === undefined ? (
              <View className="gap-2">
                <AppText variant="label">Получилось сегодня?</AppText>
                <View className="flex-row gap-2">
                  <Button
                    label="Получилось"
                    className="flex-1"
                    onPress={() => {
                      haptics.success();
                      ai.checkinChallenge(true);
                    }}
                  />
                  <Button
                    label="Не вышло"
                    variant="secondary"
                    className="flex-1"
                    onPress={() => ai.checkinChallenge(false)}
                  />
                </View>
              </View>
            ) : (
              <AppText variant="caption" tone="muted">
                {checkedToday
                  ? "Сегодня получилось — отмечено."
                  : "Сегодня не вышло — это тоже данные для итога."}
              </AppText>
            )
          ) : null}
        </>
      ) : null}

      {challenge.status === "reviewing" ? (
        <View className="flex-row items-center gap-2.5">
          <ActivityIndicator size="small" color={colors.primary} />
          <AppText variant="caption" tone="muted" className="flex-1">
            Эксперимент завершён. ChatGPT сравнивает дни до и во время эксперимента…
          </AppText>
        </View>
      ) : null}

      {challenge.status === "done" && challenge.review ? (
        <View className="flex-row items-start gap-2.5 rounded-2xl bg-white p-3.5 dark:bg-ink-850">
          <Ionicons name="analytics" size={18} color={colors.success} style={{ marginTop: 1 }} />
          <AppText variant="caption" className="flex-1 font-medium leading-[20px]">
            {challenge.review}
          </AppText>
        </View>
      ) : null}
    </Card>
  );
}
