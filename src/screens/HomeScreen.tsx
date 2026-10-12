import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo, type ReactNode } from "react";
import { Pressable, View } from "react-native";

import { AppText } from "../components/AppText";
import { Card } from "../components/Card";
import { CardLabel, DurationValue, KeyValue, Separator } from "../components/CardLabel";
import { ColumnChart, type ColumnDatum } from "../components/charts/ColumnChart";
import { Chip } from "../components/Chip";
import { IconButton } from "../components/IconButton";
import { Screen } from "../components/Screen";
import { useApp } from "../context/AppContext";
import type { RootTabScreenProps } from "../navigation/types";
import { MIN_SLIPS_FOR_PATTERNS, computePatterns } from "../utils/analytics";
import { QUICK_TRIGGER_IDS, REPLACEMENTS, getCategory, getTrigger } from "../utils/catalog";
import {
  DAY_FORMS,
  WEEKDAYS_SHORT,
  WIN_FORMS,
  formatLongDate,
  formatMinutes,
  formatMinutesCompact,
  formatMinutesInline,
  parseDayKey,
  pluralize,
  weekdayIndex,
} from "../utils/date";
import { haptics } from "../utils/haptics";
import {
  compareScroll,
  getBestStreak,
  getCurrentStreak,
  getTrend,
  summarizeWins,
} from "../utils/stats";
import { useThemeColors } from "../utils/theme";
import { useNow } from "../utils/useNow";

const pad = (value: number) => String(value).padStart(2, "0");

export function HomeScreen({ navigation }: RootTabScreenProps<"Home">) {
  const { colors, chart } = useThemeColors();
  const now = useNow(60_000);
  const app = useApp();
  const limit = app.settings.dailyLimitMinutes;

  const saved = summarizeWins(app.wins, app.winArchive, app.todayKey);
  const streak = getCurrentStreak(app.scrollLog, limit, app.todayKey);
  const best = Math.max(streak, getBestStreak(app.scrollLog, limit));
  const comparison = compareScroll(app.scrollLog, app.todayKey, app.settings.baselineMinutes);
  const week = getTrend(app.scrollLog, app.todayKey, 7);
  const patterns = useMemo(
    () => computePatterns(app.slips, app.wins, now),
    [app.slips, app.wins, now],
  );

  // A different free replacement every day.
  const freeReplacements = REPLACEMENTS.filter((item) => !item.premium);
  const dayNumber = Math.floor(parseDayKey(app.todayKey).getTime() / 86_400_000);
  const dailyPick = freeReplacements[dayNumber % freeReplacements.length]!;

  const openStats = () => navigation.navigate("Stats");

  const weekData: ColumnDatum[] = week.map((point) => ({
    key: point.key,
    value: point.minutes,
    label: WEEKDAYS_SHORT[weekdayIndex(point.key)],
    a11y: `${WEEKDAYS_SHORT[weekdayIndex(point.key)]}: ${
      point.minutes === null ? "нет записи" : formatMinutes(point.minutes)
    }`,
  }));

  return (
    <Screen>
      <View className="flex-row items-end justify-between gap-3 px-1 pb-1">
        <View className="flex-1">
          <AppText variant="overline" tone="subtle">
            {formatLongDate(now)}
          </AppText>
          <AppText variant="title" accessibilityRole="header">
            Сегодня
          </AppText>
        </View>
        <IconButton
          icon="person"
          tone="accent"
          className="mb-1 h-[38px] w-[38px]"
          onPress={() => navigation.navigate("Settings")}
          accessibilityLabel="Настройки"
        />
      </View>

      <HardHourPill
        peakHour={patterns.totalSlips >= MIN_SLIPS_FOR_PATTERNS ? patterns.peakHour : null}
        reason={patterns.topTrigger ? getTrigger(patterns.topTrigger).reason : null}
        now={now}
        todayLogged={comparison.today !== null}
        onOpenJournal={() => navigation.navigate("Journal")}
        onOpenStats={openStats}
      />

      <PressableCard onPress={openStats} label="Время в ленте, открыть статистику">
        <CardLabel icon="phone-portrait" label="Время в ленте" color={colors.primary} chevron />
        <AppText variant="statement" className="mt-2">
          {feedStatement(comparison.today, comparison.yesterday, comparison.deltaPercent, limit)}
        </AppText>
        <Separator className="my-3.5" />
        <View className="flex-row gap-3">
          <DurationValue label="Сегодня" minutes={comparison.today} color={colors.primary} />
          <DurationValue label="Вчера" minutes={comparison.yesterday} color={colors.textSubtle} />
        </View>
        <View className="mt-4">
          <ColumnChart
            data={weekData}
            highlightKey={app.todayKey}
            reference={{ value: limit, label: `лимит ${formatMinutes(limit)}` }}
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

      <Card>
        <CardLabel icon="pause-circle" label="Быстрая пауза" color={colors.primary} />
        <AppText variant="statement" className="mt-2">
          Что тянет в ленту прямо сейчас?
        </AppText>
        <View className="mt-3.5 flex-row gap-2">
          {QUICK_TRIGGER_IDS.map((id) => {
            const trigger = getTrigger(id);
            return (
              <Chip
                key={id}
                label={trigger.label}
                selected={false}
                className="flex-1 justify-center px-2"
                onPress={() => {
                  haptics.light();
                  navigation.navigate("Intercept", { trigger: id });
                }}
              />
            );
          })}
        </View>
      </Card>

      <PressableCard onPress={openStats} label="Лимит и серия, открыть статистику">
        <CardLabel icon="calendar" label="Лимит" color={colors.warningStrong} chevron />
        <AppText variant="statement" className="mt-2">
          {streakStatement(streak, comparison.today, limit)}
        </AppText>
        <Separator className="my-3.5" />
        <View className="flex-row gap-3">
          <KeyValue
            label="Серия"
            value={String(streak)}
            unit={pluralize(streak, DAY_FORMS)}
            color={colors.warningStrong}
          />
          <KeyValue
            label="Рекорд"
            value={String(best)}
            unit={pluralize(best, DAY_FORMS)}
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

      <PressableCard onPress={openStats} label="Спасённое время, открыть статистику">
        <CardLabel icon="leaf" label="Спасено" color={colors.success} chevron />
        <AppText variant="statement" className="mt-2">
          {saved.todayWins > 0
            ? `Сегодня вы вернули себе ${formatMinutesInline(saved.todayMinutes)} — ${saved.todayWins} ${pluralize(saved.todayWins, WIN_FORMS)} над импульсом.`
            : "Каждая пауза возвращает вам время. Потянет в ленту — нажмите паузу."}
        </AppText>
        <Separator className="my-3.5" />
        <View className="flex-row gap-3">
          <DurationValue label="Сегодня" minutes={saved.todayMinutes} color={colors.success} />
          <DurationValue label="Всего" minutes={saved.totalMinutes} color={colors.textSubtle} />
        </View>
      </PressableCard>

      <PressableCard
        onPress={() => navigation.navigate("Replacement", { id: dailyPick.id })}
        label={`Замена дня: ${dailyPick.title}`}
      >
        <CardLabel icon="sparkles" label="Замена дня" color={colors.indigo} chevron />
        <AppText variant="statement" className="mt-2">
          {dailyPick.title}
        </AppText>
        <AppText variant="caption" tone="muted" className="mt-1" numberOfLines={2}>
          {dailyPick.description}
        </AppText>
        <View className="mt-3.5 flex-row items-center justify-between">
          <AppText variant="caption" tone="subtle">
            {dailyPick.minutes} мин · {getCategory(dailyPick.category).label}
          </AppText>
          <View className="h-9 justify-center rounded-full bg-brand-600 px-5 dark:bg-brand-500">
            <AppText variant="label" className="text-white dark:text-white">
              Начать
            </AppText>
          </View>
        </View>
      </PressableCard>
    </Screen>
  );
}

function feedStatement(
  today: number | null,
  yesterday: number | null,
  deltaPercent: number | null,
  limit: number,
): string {
  if (today === null) return "Отметьте, сколько времени сегодня ушло на ленту.";
  if (deltaPercent === null || yesterday === null) {
    return today <= limit
      ? `Сегодня в ленте ${formatMinutesInline(today)} — в пределах лимита.`
      : `Сегодня в ленте ${formatMinutesInline(today)} — это выше лимита.`;
  }
  if (deltaPercent < 0) {
    return `Сегодня вы провели в ленте на ${Math.abs(deltaPercent)}% меньше, чем вчера.`;
  }
  if (deltaPercent > 0) return `Сегодня вы провели в ленте на ${deltaPercent}% больше, чем вчера.`;
  return "Сегодня в ленте столько же времени, сколько вчера.";
}

function streakStatement(streak: number, today: number | null, limit: number): string {
  if (streak > 1) {
    return `${streak} ${pluralize(streak, DAY_FORMS)} подряд вы держитесь в пределах лимита.`;
  }
  if (streak === 1) return "Первый день в пределах лимита. Завтра серия продолжится.";
  if (today !== null && today > limit) return "Сегодня лимит превышен. Завтра — новая серия.";
  return `Держитесь в пределах ${formatMinutesInline(limit)} в день — и здесь начнётся серия.`;
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

/** The top pill: "Сейчас трудный час" from the diary, or a nudge to log today's time. */
function HardHourPill({
  peakHour,
  reason,
  now,
  todayLogged,
  onOpenJournal,
  onOpenStats,
}: {
  peakHour: number | null;
  reason: string | null;
  now: number;
  todayLogged: boolean;
  onOpenJournal: () => void;
  onOpenStats: () => void;
}) {
  const { colors } = useThemeColors();
  let title: string;
  let tail: string;
  let onPress: () => void;
  let icon: "moon" | "create";

  if (peakHour !== null) {
    const inWindow = new Date(now).getHours() === peakHour;
    title = inWindow ? "Сейчас трудный час" : "Трудный час";
    tail = inWindow
      ? `до ${pad((peakHour + 1) % 24)}:00`
      : `${pad(peakHour)}:00–${pad((peakHour + 1) % 24)}:00`;
    onPress = onOpenJournal;
    icon = "moon";
  } else if (!todayLogged) {
    title = "Отметьте время в ленте";
    tail = "за сегодня";
    onPress = onOpenStats;
    icon = "create";
  } else {
    return null;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${tail}${reason && peakHour !== null ? `, обычно ${reason}` : ""}`}
      className="h-14 flex-row items-center gap-3 rounded-full bg-card px-4 active:opacity-80 dark:bg-ink-900"
    >
      <View className="h-[30px] w-[30px] items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900">
        <Ionicons name={icon} size={16} color={icon === "moon" ? colors.indigo : colors.primary} />
      </View>
      <AppText variant="heading" className="flex-1 text-[16px]" numberOfLines={1}>
        {title}
        <AppText variant="heading" tone="subtle" className="text-[16px] font-medium">
          {` · ${tail}`}
        </AppText>
      </AppText>
      <Ionicons name="chevron-forward" size={18} color={colors.chevron} />
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
  const state = minutes === null ? "none" : minutes <= limit ? "ok" : "over";
  return (
    <View
      className="items-center gap-1.5"
      accessible
      accessibilityLabel={`${label}: ${
        state === "none" ? "нет записи" : state === "ok" ? "в пределах лимита" : "выше лимита"
      }`}
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
