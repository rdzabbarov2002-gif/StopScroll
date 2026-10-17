import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useMemo, type ReactNode } from "react";
import { Pressable, View } from "react-native";

import { AppText } from "../components/AppText";
import { Card } from "../components/Card";
import { CardLabel, DurationValue, KeyValue, Separator } from "../components/CardLabel";
import { ColumnChart, type ColumnDatum } from "../components/charts/ColumnChart";
import { AiForecastCard } from "../components/ai/AiForecastCard";
import { AiForecastPending } from "../components/ai/AiForecastPending";
import { AiHighlightsCard } from "../components/ai/AiHighlightsCard";
import { ImpulseEntryCard } from "../components/ai/ImpulseEntryCard";
import { BriefingCard } from "../components/coach/BriefingCard";
import { InsightsCard } from "../components/coach/InsightsCard";
import { IconButton } from "../components/IconButton";
import { Screen } from "../components/Screen";
import { buildBriefing } from "../coach";
import { useAi } from "../context/AiContext";
import { useApp } from "../context/AppContext";
import { usePro } from "../context/ProContext";
import { plural, useT, type Messages } from "../i18n";
import type { RootTabScreenProps } from "../navigation/types";
import { ACHIEVEMENTS, achievementTitle, getAchievement } from "../utils/achievements";
import { getCategory } from "../utils/catalog";
import {
  WEEKDAYS_SHORT,
  formatLongDate,
  formatMinutes,
  formatWeekRange,
  formatMinutesCompact,
  formatMinutesInline,
  weekdayIndex,
} from "../utils/date";
import {
  compareScroll,
  getBestStreak,
  getCurrentStreak,
  getTrend,
  summarizeWins,
} from "../utils/stats";
import { useThemeColors } from "../utils/theme";
import { useNow } from "../utils/useNow";
import { buildWeeklyReport, latestReportWeek, reportWeeks } from "../utils/weeklyReport";

type HomeMessages = Messages["home"];

export function HomeScreen({ navigation }: RootTabScreenProps<"Home">) {
  const t = useT().home;
  const { colors, chart } = useThemeColors();
  const now = useNow(60_000);
  const app = useApp();
  const limit = app.settings.dailyLimitMinutes;

  const saved = summarizeWins(app.wins, app.winArchive, app.todayKey);
  const streak = getCurrentStreak(app.scrollLog, limit, app.todayKey);
  const best = Math.max(streak, getBestStreak(app.scrollLog, limit));
  const comparison = compareScroll(app.scrollLog, app.todayKey, app.settings.baselineMinutes);
  const week = getTrend(app.scrollLog, app.todayKey, 7);
  const { isPro } = usePro();

  // The coach's briefing, rebuilt from the records as they change (cheap: eight weeks of data).
  const briefing = useMemo(
    () =>
      buildBriefing(
        {
          wins: app.wins,
          slips: app.slips,
          scrollLog: app.scrollLog,
          settings: app.settings,
          coachLog: app.coachLog,
          now,
        },
        isPro,
      ),
    [app.wins, app.slips, app.scrollLog, app.settings, app.coachLog, now, isPro],
  );
  const { recordBriefing } = app;
  const { day, risk, advice: adviceId } = briefing.logEntry;
  const ai = useAi();
  useEffect(() => {
    // Remember what the on-device coach said today (only when it is the one shown), so tomorrow
    // it can look back on it.
    if (app.hydrated && !ai.enabled) recordBriefing({ day, risk, advice: adviceId });
  }, [app.hydrated, ai.enabled, day, risk, adviceId, recordBriefing]);
  const dailyPick = briefing.replacement.replacement;
  const aiForecast = ai.enabled && ai.forecast?.day === app.todayKey ? ai.forecast : null;

  const openStats = () => navigation.navigate("Stats");

  const weekData: ColumnDatum[] = week.map((point) => ({
    key: point.key,
    value: point.minutes,
    label: WEEKDAYS_SHORT[weekdayIndex(point.key)],
    a11y: t.dayValue(
      WEEKDAYS_SHORT[weekdayIndex(point.key)],
      point.minutes === null ? t.noEntry : formatMinutes(point.minutes),
    ),
  }));

  return (
    <Screen>
      <View className="flex-row items-end justify-between gap-3 px-1 pb-1">
        <View className="flex-1">
          <AppText variant="overline" tone="subtle">
            {formatLongDate(now)}
          </AppText>
          <AppText variant="title" accessibilityRole="header">
            {briefing.greeting}
          </AppText>
        </View>
        <IconButton
          icon="person"
          tone="accent"
          className="mb-1 h-[38px] w-[38px]"
          onPress={() => navigation.navigate("Settings")}
          accessibilityLabel={t.settings}
        />
      </View>

      {/* With the AI coach connected, ChatGPT's forecast leads; otherwise the on-device coach. */}
      {ai.enabled ? (
        <>
          {aiForecast ? <AiForecastCard forecast={aiForecast} compact /> : <AiForecastPending />}
          <AiHighlightsCard />
        </>
      ) : (
        <>
          <BriefingCard briefing={briefing} />
          <InsightsCard insights={briefing.insights} />
        </>
      )}

      <PressableCard onPress={openStats} label={t.feed.a11y}>
        <CardLabel icon="phone-portrait" label={t.feed.label} color={colors.primary} chevron />
        <AppText variant="statement" className="mt-2">
          {feedStatement(t, comparison.today, comparison.yesterday, comparison.deltaPercent, limit)}
        </AppText>
        <Separator className="my-3.5" />
        <View className="flex-row gap-3">
          <DurationValue label={t.today} minutes={comparison.today} color={colors.primary} />
          <DurationValue
            label={t.yesterday}
            minutes={comparison.yesterday}
            color={colors.textSubtle}
          />
        </View>
        <View className="mt-4">
          <ColumnChart
            data={weekData}
            highlightKey={app.todayKey}
            reference={{ value: limit, label: t.feed.limitLine(formatMinutes(limit)) }}
            formatTick={formatMinutesCompact}
            showYAxis={false}
            plotHeight={96}
            colorFor={(datum, highlighted) =>
              datum.value !== null && datum.value > limit
                ? chart.slip
                : highlighted
                  ? chart.series
                  : chart.seriesMuted
            }
          />
        </View>
      </PressableCard>

      <ImpulseEntryCard />

      <PressableCard onPress={openStats} label={t.limit.a11y}>
        <CardLabel icon="calendar" label={t.limit.label} color={colors.warningStrong} chevron />
        <AppText variant="statement" className="mt-2">
          {streakStatement(t, streak, comparison.today, limit)}
        </AppText>
        <Separator className="my-3.5" />
        <View className="flex-row gap-3">
          <KeyValue
            label={t.limit.streak}
            value={String(streak)}
            unit={plural(streak, t.limit.days)}
            color={colors.warningStrong}
          />
          <KeyValue
            label={t.limit.record}
            value={String(best)}
            unit={plural(best, t.limit.days)}
            color={colors.textSubtle}
          />
        </View>
        <View className="mt-4 flex-row justify-between">
          {week.map((point) => (
            <DayDot
              key={point.key}
              label={WEEKDAYS_SHORT[weekdayIndex(point.key)]}
              minutes={point.minutes}
              limit={limit}
              today={point.key === app.todayKey}
            />
          ))}
        </View>
      </PressableCard>

      <PressableCard onPress={openStats} label={t.saved.a11y}>
        <CardLabel icon="leaf" label={t.saved.label} color={colors.success} chevron />
        <AppText variant="statement" className="mt-2">
          {saved.todayWins > 0
            ? t.saved.today(formatMinutesInline(saved.todayMinutes), saved.todayWins)
            : t.saved.empty}
        </AppText>
        <Separator className="my-3.5" />
        <View className="flex-row gap-3">
          <DurationValue label={t.today} minutes={saved.todayMinutes} color={colors.success} />
          <DurationValue
            label={t.saved.total}
            minutes={saved.totalMinutes}
            color={colors.textSubtle}
          />
        </View>
      </PressableCard>

      <ProgressTiles now={now} />

      <PressableCard
        onPress={() => navigation.navigate("Replacement", { id: dailyPick.id })}
        label={t.pick.a11y(dailyPick.title)}
      >
        <CardLabel icon="sparkles" label={t.pick.label} color={colors.indigo} chevron />
        <AppText variant="statement" className="mt-2">
          {dailyPick.title}
        </AppText>
        <AppText variant="caption" tone="muted" className="mt-1" numberOfLines={2}>
          {briefing.replacement.why ?? dailyPick.description}
        </AppText>
        <View className="mt-3.5 flex-row items-center justify-between">
          <AppText variant="caption" tone="subtle">
            {formatMinutes(dailyPick.minutes)} · {getCategory(dailyPick.category).label}
          </AppText>
          <View className="h-9 justify-center rounded-full bg-brand-600 px-5 dark:bg-brand-500">
            <AppText variant="label" className="text-white dark:text-white">
              {t.pick.start}
            </AppText>
          </View>
        </View>
      </PressableCard>
    </Screen>
  );
}

/** "Отчёт недели" and "Достижения" side by side. */
function ProgressTiles({ now }: { now: number }) {
  const t = useT().home.tiles;
  const { colors } = useThemeColors();
  const navigation = useNavigation();
  const app = useApp();
  const data = useMemo(
    () => ({
      wins: app.wins,
      slips: app.slips,
      scrollLog: app.scrollLog,
      settings: app.settings,
    }),
    [app.wins, app.slips, app.scrollLog, app.settings],
  );
  const latest = latestReportWeek(now);
  const hasReport = useMemo(() => reportWeeks(data, now).includes(latest), [data, now, latest]);
  const saved = useMemo(
    () => (hasReport ? buildWeeklyReport(data, latest, now).savedMinutes : 0),
    [data, latest, now, hasReport],
  );
  const isNew = hasReport && (app.lastSeenReport === null || app.lastSeenReport < latest);

  const earned = Object.entries(app.achievements).sort((a, b) => b[1] - a[1]);
  const lastEarned = earned[0] ? getAchievement(earned[0][0]) : undefined;

  return (
    <View className="flex-row gap-3">
      <Tile
        onPress={() => navigation.navigate("WeeklyReport")}
        icon="calendar"
        label={t.report}
        color={colors.primary}
        title={hasReport ? (isNew ? t.newReport : formatWeekRange(latest)) : t.sunday}
        caption={hasReport ? t.reportSaved(formatMinutes(saved)) : t.reportPromise}
        badge={isNew}
      />
      <Tile
        onPress={() => navigation.navigate("Achievements")}
        icon="trophy"
        label={t.achievements}
        color={colors.warning}
        title={t.achievementsCount(earned.length, ACHIEVEMENTS.length)}
        caption={
          lastEarned ? achievementTitle(lastEarned, app.settings.mainApp) : t.firstAchievement
        }
      />
    </View>
  );
}

function Tile({
  onPress,
  icon,
  label,
  color,
  title,
  caption,
  badge = false,
}: {
  onPress: () => void;
  icon: "calendar" | "trophy";
  label: string;
  color: string;
  title: string;
  caption: string;
  badge?: boolean;
}) {
  const { colors } = useThemeColors();
  const t = useT().home.tiles;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t.a11y(label, title, caption)}
      className="flex-1 gap-2 rounded-card bg-card p-4 active:opacity-80 dark:bg-ink-900"
    >
      <View className="flex-row items-center justify-between">
        <View className="shrink flex-row items-center gap-1.5">
          <Ionicons name={icon} size={17} color={color} />
          <AppText
            variant="heading"
            className="shrink text-[16px]"
            style={{ color }}
            numberOfLines={1}
          >
            {label}
          </AppText>
        </View>
        {badge ? (
          <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.danger }} />
        ) : (
          <Ionicons name="chevron-forward" size={16} color={colors.chevron} />
        )}
      </View>
      <View className="gap-0.5">
        <AppText variant="heading" className="text-[19px] leading-6" numberOfLines={1}>
          {title}
        </AppText>
        <AppText
          variant="caption"
          tone="subtle"
          className="text-[13px] leading-[17px]"
          numberOfLines={2}
        >
          {caption}
        </AppText>
      </View>
    </Pressable>
  );
}

function feedStatement(
  t: HomeMessages,
  today: number | null,
  yesterday: number | null,
  deltaPercent: number | null,
  limit: number,
): string {
  if (today === null) return t.feed.empty;
  if (deltaPercent === null || yesterday === null) {
    return today <= limit
      ? t.feed.withinLimit(formatMinutesInline(today))
      : t.feed.overLimit(formatMinutesInline(today));
  }
  if (deltaPercent < 0) return t.feed.less(Math.abs(deltaPercent));
  if (deltaPercent > 0) return t.feed.more(deltaPercent);
  return t.feed.same;
}

function streakStatement(
  t: HomeMessages,
  streak: number,
  today: number | null,
  limit: number,
): string {
  if (streak > 1) return t.limit.streakDays(streak);
  if (streak === 1) return t.limit.firstDay;
  if (today !== null && today > limit) return t.limit.over;
  return t.limit.start(formatMinutesInline(limit));
}

function PressableCard({
  onPress,
  label,
  children,
}: {
  onPress: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="active:opacity-80"
    >
      <Card>{children}</Card>
    </Pressable>
  );
}

/** One day of the week: a filled circle within the limit, an outline over it, a dot if unlogged. */
function DayDot({
  label,
  minutes,
  limit,
  today,
}: {
  label: string;
  minutes: number | null;
  limit: number;
  today: boolean;
}) {
  const { colors } = useThemeColors();
  const t = useT().home;
  const state = minutes === null ? "none" : minutes <= limit ? "ok" : "over";
  return (
    <View
      className="items-center gap-1.5"
      accessible
      accessibilityLabel={t.dayValue(
        label,
        state === "none" ? t.noEntry : state === "ok" ? t.limit.dayWithin : t.limit.dayOver,
      )}
    >
      <View
        className="h-8 w-8 items-center justify-center rounded-full"
        style={
          state === "ok"
            ? { backgroundColor: colors.warningStrong }
            : state === "over"
              ? { borderWidth: 2, borderColor: colors.ringTrack }
              : undefined
        }
      >
        {state === "ok" ? (
          <Ionicons name="checkmark" size={18} color="#FFFFFF" />
        ) : state === "over" ? (
          <Ionicons name="close" size={15} color={colors.textSubtle} />
        ) : (
          <View
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: colors.ringTrack }}
          />
        )}
      </View>
      <AppText
        variant="caption"
        className={today ? "text-[12px] font-semibold" : "text-[12px]"}
        tone={today ? "default" : "subtle"}
      >
        {label}
      </AppText>
    </View>
  );
}
