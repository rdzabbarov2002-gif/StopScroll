import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { Pressable, View } from "react-native";

import type { AiForecast } from "../../ai/types";
import { formatTime } from "../../utils/date";
import { useThemeColors } from "../../utils/theme";
import { AppText } from "../AppText";
import { Card } from "../Card";
import { CardLabel, Separator } from "../CardLabel";
import { ProgressBar } from "../ProgressBar";
import { Bullet, levelColor } from "./parts";

/** Today's risk as ChatGPT estimates it from the user's own history, and why. */
export function AiForecastCard({
  forecast,
  compact = false,
}: {
  forecast: AiForecast;
  compact?: boolean;
}) {
  const { colors } = useThemeColors();
  const navigation = useNavigation();
  const color = levelColor(colors, forecast.level, forecast.probability);
  const reasons = compact ? forecast.reasons.slice(0, 3) : forecast.reasons;

  return (
    <Card className="gap-3.5">
      <CardLabel icon="pulse" label="Прогноз на сегодня" color={color} />
      {forecast.probability !== null ? (
        <View
          className="gap-2"
          accessible
          accessibilityLabel={`Вероятность открытия ленты сегодня: ${forecast.probability} процентов`}
        >
          <View className="flex-row items-baseline gap-2">
            <AppText rounded className="text-[44px] font-bold leading-[50px]" style={{ color }}>
              {forecast.probability}%
            </AppText>
            <AppText variant="caption" tone="muted" className="flex-1">
              вероятность открытия ленты сегодня
            </AppText>
          </View>
          <ProgressBar progress={forecast.probability / 100} color={color} />
        </View>
      ) : null}
      <AppText variant="statement">{forecast.headline}</AppText>
      {reasons.length ? (
        <View className="gap-2">
          {reasons.map((reason) => (
            <Bullet key={reason} icon="ellipse" color={color} text={reason} />
          ))}
        </View>
      ) : null}
      {forecast.passed ? (
        <Highlight icon="checkmark-circle" color={colors.success} text={forecast.passed} />
      ) : forecast.window.message ? (
        <Highlight icon="time" color={colors.indigo} text={forecast.window.message} />
      ) : null}
      {forecast.advice ? (
        <View className="gap-1">
          <AppText variant="label" tone="primary">
            Что поможет сегодня
          </AppText>
          <AppText className="text-[16px] leading-[22px]">{forecast.advice}</AppText>
        </View>
      ) : null}
      <Separator />
      <View className="flex-row items-center justify-between gap-3">
        <AppText variant="caption" tone="subtle" className="flex-1 text-[13px]">
          Обновлено в {formatTime(forecast.createdAt)}
          {forecast.basis ? ` · ${forecast.basis}` : ""}
        </AppText>
        {compact ? (
          <Pressable
            onPress={() => navigation.navigate("Main", { screen: "AI" })}
            accessibilityRole="button"
            hitSlop={8}
            className="flex-row items-center gap-0.5 active:opacity-70"
          >
            <AppText variant="label" tone="primary" className="text-[14px]">
              Аналитика
            </AppText>
            <Ionicons name="chevron-forward" size={15} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}

function Highlight({
  icon,
  color,
  text,
}: {
  icon: "checkmark-circle" | "time";
  color: string;
  text: string;
}) {
  return (
    <View className="flex-row items-start gap-2.5 rounded-2xl bg-white p-3.5 dark:bg-ink-850">
      <Ionicons name={icon} size={18} color={color} style={{ marginTop: 1 }} />
      <AppText variant="caption" className="flex-1 font-medium leading-[20px]">
        {text}
      </AppText>
    </View>
  );
}
