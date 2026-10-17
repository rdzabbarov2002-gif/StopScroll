import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";

import { AchievementBadge, toneColor } from "../components/achievements/AchievementBadge";
import { AppText } from "../components/AppText";
import { BackButton } from "../components/BackButton";
import { BottomSheet } from "../components/BottomSheet";
import { Card } from "../components/Card";
import { CardLabel } from "../components/CardLabel";
import { ProgressBar } from "../components/ProgressBar";
import { Screen } from "../components/Screen";
import { useApp } from "../context/AppContext";
import { m, useT } from "../i18n";
import { evaluateAchievements, type AchievementStatus } from "../utils/achievements";
import { formatDate, formatMinutes } from "../utils/date";
import { useThemeColors } from "../utils/theme";
import { useNow } from "../utils/useNow";

/** "12 из 20 раз", "35 мин из 1 ч". */
export function progressLabel(status: AchievementStatus): string {
  const { unit } = status.achievement;
  const messages = m().achievements.progress;
  if (unit.kind === "minutes") {
    return messages.minutes(formatMinutes(status.current), formatMinutes(status.target));
  }
  if (unit.kind === "count") {
    return messages.count(status.current, status.target, unit.forms);
  }
  return messages.once;
}

/** The progress inside a sentence, kept on one line: "ещё впереди", "12 из 20 раз". */
function inlineProgress(status: AchievementStatus): string {
  const label =
    status.achievement.unit.kind === "once"
      ? m().achievements.progress.onceInline
      : progressLabel(status);
  return label.replace(/ /g, "\u00A0");
}

export function AchievementsScreen() {
  const { colors } = useThemeColors();
  const t = useT().achievements;
  const app = useApp();
  const now = useNow(60_000);
  const [selected, setSelected] = useState<AchievementStatus | null>(null);

  const statuses = useMemo(
    () =>
      evaluateAchievements(
        {
          wins: app.wins,
          winArchive: app.winArchive,
          slips: app.slips,
          scrollLog: app.scrollLog,
          settings: app.settings,
        },
        now,
      ),
    [app.wins, app.winArchive, app.slips, app.scrollLog, app.settings, now],
  );

  // The saved date wins: it is when the user actually saw the achievement unlock.
  const earnedAt = (status: AchievementStatus) => app.achievements[status.achievement.id] ?? null;
  const earned = statuses
    .filter((status) => earnedAt(status) !== null)
    .sort((a, b) => earnedAt(b)! - earnedAt(a)!);
  const ahead = statuses
    .filter((status) => earnedAt(status) === null)
    .sort((a, b) => b.progress - a.progress);
  const next = ahead.find((status) => status.progress > 0) ?? ahead[0];

  return (
    <Screen>
      <BackButton label={t.back} />
      <AppText variant="title" accessibilityRole="header" className="px-1 pb-1">
        {t.title}
      </AppText>

      <Card>
        <CardLabel icon="trophy" label={t.earned} color={colors.warning} />
        <View className="mt-2 flex-row items-baseline gap-1.5">
          <AppText
            rounded
            className="text-[36px] font-bold leading-[42px]"
            style={{ color: colors.warning }}
          >
            {earned.length}
          </AppText>
          <AppText className="text-[17px] font-semibold" style={{ color: colors.warning }}>
            {t.ofTotal(statuses.length)}
          </AppText>
        </View>
        <ProgressBar progress={earned.length / statuses.length} tone="warning" className="mt-2" />
        <AppText variant="caption" tone="muted" className="mt-3">
          {next ? t.closest(next.title, inlineProgress(next)) : t.allEarned}
        </AppText>
      </Card>

      {earned.length > 0 ? (
        <Section title={t.earnedCount(earned.length)}>
          {earned.map((status) => (
            <AchievementTile
              key={status.achievement.id}
              status={status}
              earnedAt={earnedAt(status)}
              onPress={() => setSelected(status)}
            />
          ))}
        </Section>
      ) : null}

      {ahead.length > 0 ? (
        <Section title={t.ahead}>
          {ahead.map((status) => (
            <AchievementTile
              key={status.achievement.id}
              status={status}
              earnedAt={null}
              onPress={() => setSelected(status)}
            />
          ))}
        </Section>
      ) : null}

      <BottomSheet
        visible={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.title ?? ""}
      >
        {selected ? <AchievementDetail status={selected} earnedAt={earnedAt(selected)} /> : null}
      </BottomSheet>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <AppText variant="overline" tone="subtle" className="px-1 pt-3" accessibilityRole="header">
        {title}
      </AppText>
      <View className="flex-row flex-wrap gap-3">{children}</View>
    </View>
  );
}

function AchievementTile({
  status,
  earnedAt,
  onPress,
}: {
  status: AchievementStatus;
  earnedAt: number | null;
  onPress: () => void;
}) {
  const { colors } = useThemeColors();
  const t = useT().achievements;
  const { achievement } = status;
  const unlocked = earnedAt !== null;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${status.title}. ${achievement.description} ${
        unlocked ? t.earnedOn(formatDate(earnedAt)) : progressLabel(status)
      }`}
      className="min-w-[45%] flex-1 gap-2.5 rounded-card bg-card p-4 active:opacity-80 dark:bg-ink-900"
    >
      <AchievementBadge
        icon={achievement.icon}
        tone={achievement.tone}
        unlocked={unlocked}
        progress={status.progress}
      />
      <View className="gap-1">
        <AppText variant="heading" className="text-[15px] leading-5" numberOfLines={3}>
          {status.title}
        </AppText>
        <AppText
          variant="caption"
          tone="muted"
          className="text-[13px] leading-[17px]"
          numberOfLines={3}
        >
          {achievement.description}
        </AppText>
      </View>
      <View className="mt-auto">
        {unlocked ? (
          <View className="flex-row items-center gap-1">
            <Ionicons
              name="checkmark-circle"
              size={15}
              color={toneColor(achievement.tone, colors)}
            />
            <AppText
              variant="caption"
              className="text-[12px] font-semibold"
              style={{ color: toneColor(achievement.tone, colors) }}
            >
              {formatDate(earnedAt)}
            </AppText>
          </View>
        ) : (
          <View className="gap-1.5">
            <ProgressBar
              progress={status.progress}
              color={toneColor(achievement.tone, colors)}
              className="h-1.5"
            />
            <AppText variant="caption" tone="subtle" className="text-[12px]">
              {progressLabel(status)}
            </AppText>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function AchievementDetail({
  status,
  earnedAt,
}: {
  status: AchievementStatus;
  earnedAt: number | null;
}) {
  const { colors } = useThemeColors();
  const t = useT().achievements;
  const { achievement } = status;
  const unlocked = earnedAt !== null;
  return (
    <View className="items-center gap-3 pb-2">
      <AchievementBadge
        icon={achievement.icon}
        tone={achievement.tone}
        unlocked={unlocked}
        progress={status.progress}
        size={96}
      />
      <AppText className="text-center">{achievement.description}</AppText>
      {unlocked ? (
        <AppText variant="label" style={{ color: toneColor(achievement.tone, colors) }}>
          {t.earnedOn(formatDate(earnedAt))}
        </AppText>
      ) : (
        <View className="w-full gap-2">
          <Card className="gap-1">
            <AppText variant="label">{t.howToEarn}</AppText>
            <AppText variant="caption" tone="muted">
              {achievement.hint}
            </AppText>
          </Card>
          {achievement.unit.kind !== "once" ? (
            <View className="gap-1.5">
              <ProgressBar progress={status.progress} color={toneColor(achievement.tone, colors)} />
              <AppText variant="caption" tone="subtle" className="text-center">
                {progressLabel(status)}
              </AppText>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}
