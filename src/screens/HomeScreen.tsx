import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, View } from "react-native";

import { AppText } from "../components/AppText";
import { Card } from "../components/Card";
import { IconButton } from "../components/IconButton";
import { ProgressBar } from "../components/ProgressBar";
import { ProBadge } from "../components/ProBadge";
import { ReplacementCard } from "../components/ReplacementCard";
import { SOSButton } from "../components/SOSButton";
import { Screen } from "../components/Screen";
import { SectionTitle } from "../components/SectionTitle";
import { TriggerCard } from "../components/TriggerCard";
import { useApp } from "../context/AppContext";
import { usePro } from "../context/ProContext";
import type { RootTabScreenProps } from "../navigation/types";
import { QUICK_TRIGGER_IDS, REPLACEMENTS } from "../utils/catalog";
import {
  DAY_FORMS,
  WIN_FORMS,
  formatLongDate,
  formatMinutes,
  getGreeting,
  parseDayKey,
  pluralize,
} from "../utils/date";
import { getCurrentStreak, summarizeWins } from "../utils/stats";
import { useThemeColors } from "../utils/theme";
import { useNow } from "../utils/useNow";

export function HomeScreen({ navigation }: RootTabScreenProps<"Home">) {
  const { colors } = useThemeColors();
  const now = useNow(60_000);
  const app = useApp();
  const { isPro } = usePro();

  const saved = summarizeWins(app.wins, app.winArchive, app.todayKey);
  const streak = getCurrentStreak(app.scrollLog, app.settings.dailyLimitMinutes, app.todayKey);
  const todayScroll = app.scrollLog[app.todayKey];
  const limit = app.settings.dailyLimitMinutes;

  // A different free replacement every day.
  const freeReplacements = REPLACEMENTS.filter((item) => !item.premium);
  const dayNumber = Math.floor(parseDayKey(app.todayKey).getTime() / 86_400_000);
  const dailyPick = freeReplacements[dayNumber % freeReplacements.length]!;

  return (
    <Screen>
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 gap-0.5">
          <AppText variant="caption" tone="muted">
            {formatLongDate(now)}
          </AppText>
          <AppText variant="title" accessibilityRole="header">
            {getGreeting(now)}
          </AppText>
        </View>
        {isPro ? (
          <ProBadge locked={false} className="self-center" />
        ) : (
          <Pressable
            onPress={() => navigation.navigate("Paywall")}
            accessibilityRole="button"
            accessibilityLabel="Открыть StopScroll Pro"
            className="h-11 flex-row items-center gap-1.5 rounded-full bg-brand-600 px-4 active:opacity-80 dark:bg-brand-500"
          >
            <Ionicons name="sparkles" size={14} color={colors.onPrimary} />
            <AppText variant="label" className="text-white">
              Pro
            </AppText>
          </Pressable>
        )}
        <IconButton
          icon="settings-outline"
          onPress={() => navigation.navigate("Settings")}
          accessibilityLabel="Настройки"
        />
      </View>

      <Card className="flex-row items-center gap-4">
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/60">
          <Ionicons name="hourglass-outline" size={26} color={colors.success} />
        </View>
        <View className="flex-1 gap-0.5">
          <AppText variant="caption" tone="muted">
            Спасено сегодня
          </AppText>
          <AppText variant="heading" className="text-2xl">
            {formatMinutes(saved.todayMinutes)}
          </AppText>
          <AppText variant="caption" tone="muted">
            {saved.todayWins} {pluralize(saved.todayWins, WIN_FORMS)} · всего{" "}
            {formatMinutes(saved.totalMinutes)}
          </AppText>
        </View>
        <View
          className="items-center rounded-2xl bg-amber-50 px-3 py-2 dark:bg-amber-950/40"
          accessible
          accessibilityLabel={`Серия: ${streak} ${pluralize(streak, DAY_FORMS)} под контролем`}
        >
          <Ionicons name="flame" size={18} color={colors.warningStrong} />
          <AppText variant="label" className="text-base">
            {streak}
          </AppText>
          <AppText variant="caption" tone="muted" className="text-[10px] leading-3">
            {pluralize(streak, DAY_FORMS)}
          </AppText>
        </View>
      </Card>

      <View className="items-center">
        <SOSButton onPress={() => navigation.navigate("Intercept")} />
        <AppText variant="caption" tone="muted" className="-mt-2 text-center">
          Рука тянется к ленте? 15 секунд паузы — и импульс ослабнет.
        </AppText>
      </View>

      <SectionTitle title="Что сейчас происходит?" />
      <View className="flex-row gap-3">
        {QUICK_TRIGGER_IDS.map((id) => (
          <TriggerCard
            key={id}
            id={id}
            onPress={() => navigation.navigate("Intercept", { trigger: id })}
          />
        ))}
      </View>

      <Pressable
        onPress={() => navigation.navigate("Stats")}
        accessibilityRole="button"
        accessibilityLabel={
          todayScroll === undefined
            ? "Время в ленте сегодня не отмечено. Отметить"
            : `Сегодня в ленте ${formatMinutes(todayScroll)} из ${formatMinutes(limit)}`
        }
        className="active:opacity-80"
      >
        <Card className="gap-3">
          <View className="flex-row items-center justify-between">
            <AppText variant="label">Сегодня в ленте</AppText>
            <View className="flex-row items-center gap-1">
              <AppText variant="caption" tone="primary" className="font-semibold">
                {todayScroll === undefined ? "Отметить" : "Изменить"}
              </AppText>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </View>
          </View>
          {todayScroll === undefined ? (
            <AppText variant="caption" tone="muted">
              Вечером отметьте, сколько времени ушло на Reels, TikTok и Shorts — так видна динамика.
            </AppText>
          ) : (
            <>
              <View className="flex-row items-baseline gap-2">
                <AppText variant="heading" className="text-2xl">
                  {formatMinutes(todayScroll)}
                </AppText>
                <AppText variant="caption" tone="muted">
                  из {formatMinutes(limit)} лимита
                </AppText>
              </View>
              <ProgressBar
                progress={todayScroll / limit}
                tone={todayScroll > limit ? "warning" : "primary"}
              />
            </>
          )}
        </Card>
      </Pressable>

      <SectionTitle title="Замена дня" />
      <ReplacementCard
        item={dailyPick}
        locked={false}
        onPress={() => navigation.navigate("Replacement", { id: dailyPick.id })}
      />
    </Screen>
  );
}
