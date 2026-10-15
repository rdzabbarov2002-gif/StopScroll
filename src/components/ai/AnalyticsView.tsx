import type { ReactNode } from "react";
import { View } from "react-native";

import type { AiAnalytics } from "../../ai/types";
import { useThemeColors } from "../../utils/theme";
import type { IconName } from "../../utils/types";
import { AppText } from "../AppText";
import { Card } from "../Card";
import { CardLabel } from "../CardLabel";
import { ProgressBar } from "../ProgressBar";
import { Bullet } from "./parts";

const CONFIDENCE: Record<"low" | "medium" | "high", string> = {
  low: "Слабые признаки",
  medium: "Заметные признаки",
  high: "Сильные признаки",
};

/** ChatGPT's conclusions from the long-term memory and the numbers behind them, as cards. */
export function AnalyticsView({ analytics }: { analytics: AiAnalytics }) {
  const { colors } = useThemeColors();
  const changes = [
    ...analytics.improvements.map((text) => ({
      text,
      icon: "trending-up" as const,
      color: colors.success,
    })),
    ...analytics.worsenings.map((text) => ({
      text,
      icon: "trending-down" as const,
      color: colors.warningStrong,
    })),
    ...analytics.habitChanges.map((text) => ({
      text,
      icon: "swap-vertical" as const,
      color: colors.indigo,
    })),
  ];
  const memoryLines = analytics.longTerm;

  return (
    <>
      <Card tone="primary" className="gap-2">
        <CardLabel icon="sparkles" label="Общий вывод" color={colors.primary} />
        <AppText variant="statement">{analytics.conclusion}</AppText>
        {analytics.dataNote ? (
          <AppText variant="caption" tone="muted" className="leading-[20px]">
            {analytics.dataNote}
          </AppText>
        ) : null}
      </Card>

      {analytics.warnings.length ? (
        <Section icon="warning" label="Опасные периоды" color={colors.warningStrong}>
          {analytics.warnings.map((text) => (
            <Bullet key={text} icon="alert-circle" color={colors.warningStrong} text={text} />
          ))}
        </Section>
      ) : null}

      {changes.length ? (
        <Section icon="git-compare" label="Что меняется" color={colors.success}>
          {changes.map((item) => (
            <Bullet key={item.text} icon={item.icon} color={item.color} text={item.text} />
          ))}
        </Section>
      ) : null}

      {analytics.causes.length ? (
        <Section icon="list" label="Частые причины" color={colors.danger}>
          {analytics.causes.map((cause) => (
            <View key={cause.title} className="gap-1.5">
              <View className="flex-row items-baseline justify-between gap-3">
                <AppText variant="label" className="flex-1">
                  {cause.title}
                </AppText>
                {cause.share !== null ? (
                  <AppText variant="label" tone="muted">
                    {cause.share}%
                  </AppText>
                ) : null}
              </View>
              {cause.share !== null ? (
                <ProgressBar progress={cause.share / 100} color={colors.danger} />
              ) : null}
              {cause.note ? (
                <AppText variant="caption" tone="muted" className="leading-[20px]">
                  {cause.note}
                </AppText>
              ) : null}
            </View>
          ))}
        </Section>
      ) : null}

      <TitledSection
        icon="repeat"
        label="Повторяющиеся ситуации"
        color={colors.indigo}
        items={analytics.situations}
      />
      <TitledSection
        icon="heart"
        label="Эмоциональные состояния"
        color={colors.danger}
        items={analytics.emotions}
      />
      <TitledSection
        icon="time"
        label="Опасное время и дни"
        color={colors.primary}
        items={[...analytics.times, ...analytics.weekdays]}
      />

      {analytics.hypotheses.length ? (
        <Section icon="bulb" label="Гипотезы" color={colors.warning}>
          {analytics.hypotheses.map((item) => (
            <View key={item.text} className="gap-1">
              <AppText className="text-[16px] leading-[22px]">{item.text}</AppText>
              <AppText variant="caption" tone="subtle" className="text-[13px]">
                {CONFIDENCE[item.confidence]} · пока предположение, не факт
              </AppText>
            </View>
          ))}
        </Section>
      ) : null}

      {analytics.selfComparison.length ? (
        <Section icon="person" label="Вы против себя" color={colors.primary}>
          {analytics.selfComparison.map((text) => (
            <Bullet key={text} icon="swap-horizontal" color={colors.primary} text={text} />
          ))}
        </Section>
      ) : null}

      {analytics.numbers ? (
        <Section icon="leaf" label="Время, которое вы вернули" color={colors.success}>
          <AppText variant="statement">{analytics.numbers.headline}</AppText>
          {analytics.numbers.equivalents.map((text) => (
            <Bullet key={text} icon="checkmark" color={colors.success} text={text} />
          ))}
        </Section>
      ) : null}

      {memoryLines.length ? (
        <Section icon="hourglass" label="Долгая память" color={colors.indigo}>
          {memoryLines.map((text) => (
            <Bullet key={text} icon="bookmark" color={colors.indigo} text={text} />
          ))}
        </Section>
      ) : null}
    </>
  );
}

function Section({
  icon,
  label,
  color,
  children,
}: {
  icon: IconName;
  label: string;
  color: string;
  children: ReactNode;
}) {
  return (
    <Card className="gap-3">
      <CardLabel icon={icon} label={label} color={color} />
      {children}
    </Card>
  );
}

function TitledSection({
  icon,
  label,
  color,
  items,
}: {
  icon: IconName;
  label: string;
  color: string;
  items: { title: string; note: string }[];
}) {
  if (!items.length) return null;
  return (
    <Section icon={icon} label={label} color={color}>
      {items.map((item) => (
        <View key={item.title} className="gap-0.5">
          <AppText variant="label">{item.title}</AppText>
          {item.note ? (
            <AppText variant="caption" tone="muted" className="leading-[20px]">
              {item.note}
            </AppText>
          ) : null}
        </View>
      ))}
    </Section>
  );
}
