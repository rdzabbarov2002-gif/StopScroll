import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Pressable, Switch, View } from "react-native";

import { AppIconMark } from "../components/AppIconMark";
import { AppText } from "../components/AppText";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Separator } from "../components/CardLabel";
import { Chip } from "../components/Chip";
import { LegalLinks } from "../components/LegalLinks";
import { Screen } from "../components/Screen";
import { Stepper } from "../components/Stepper";
import { ThemePicker } from "../components/ThemePicker";
import { useApp } from "../context/AppContext";
import { usePro } from "../context/ProContext";
import type { RootStackScreenProps } from "../navigation/types";
import { FEED_APPS } from "../utils/catalog";
import { formatMinutes } from "../utils/date";
import { DEMO_MODE } from "../utils/demo";
import { haptics } from "../utils/haptics";
import { BASELINE_RANGE, LIMIT_RANGE, SESSION_RANGE } from "../utils/persistedState";
import { useThemeColors } from "../utils/theme";

export function SettingsScreen({ navigation }: RootStackScreenProps<"Settings">) {
  const { colors } = useThemeColors();
  const app = useApp();
  const pro = usePro();
  const [confirmReset, setConfirmReset] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  const restore = async () => {
    setRestoring(true);
    const result = await pro.restore();
    setRestoring(false);
    setRestoreMessage(
      !result.ok
        ? result.message
        : result.restored
          ? "Pro восстановлен."
          : "Активных покупок не найдено.",
    );
  };

  return (
    <Screen>
      <Pressable
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        accessibilityLabel="Назад"
        hitSlop={8}
        className="h-9 flex-row items-center gap-0.5 self-start active:opacity-60"
      >
        <Ionicons name="chevron-back" size={24} color={colors.primary} />
        <AppText variant="body" tone="primary">
          Сегодня
        </AppText>
      </Pressable>
      <AppText variant="title" accessibilityRole="header" className="px-1 pb-1">
        Настройки
      </AppText>

      <Pressable
        onPress={() => navigation.navigate("Paywall")}
        accessibilityRole="button"
        accessibilityLabel={pro.isPro ? "StopScroll Pro активен" : "Открыть StopScroll Pro"}
        className="flex-row items-center gap-3.5 rounded-card bg-card p-4 active:opacity-80 dark:bg-ink-900"
      >
        <AppIconMark size={52} />
        <View className="flex-1 gap-0.5">
          <AppText variant="heading">
            {pro.isPro ? "StopScroll Pro активен" : "StopScroll Pro"}
          </AppText>
          <AppText variant="caption" tone="subtle" className="text-[14px] leading-[19px]">
            {pro.isPro
              ? "Все упражнения, замены и глубокая аналитика открыты."
              : "Все упражнения, свои замены и глубокая аналитика"}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.chevron} />
      </Pressable>
      {pro.status === "ready" ? (
        <View className="gap-1.5">
          <Button
            label="Восстановить покупки"
            variant="secondary"
            loading={restoring}
            onPress={restore}
          />
          {restoreMessage ? (
            <AppText
              variant="caption"
              tone="muted"
              className="px-1 text-center"
              accessibilityLiveRegion="polite"
            >
              {restoreMessage}
            </AppText>
          ) : null}
        </View>
      ) : null}

      <AppText variant="overline" tone="subtle" className="px-1 pt-3" accessibilityRole="header">
        Оформление
      </AppText>
      <ThemePicker />

      <AppText variant="overline" tone="subtle" className="px-1 pt-3" accessibilityRole="header">
        Цели
      </AppText>
      <Card className="gap-4">
        <Stepper
          label="Дневной лимит ленты"
          hint="День в пределах лимита продолжает серию"
          value={app.settings.dailyLimitMinutes}
          min={LIMIT_RANGE.min}
          max={LIMIT_RANGE.max}
          step={LIMIT_RANGE.step}
          format={formatMinutes}
          onChange={(value) => app.updateSettings({ dailyLimitMinutes: value })}
        />
        <Separator />
        <Stepper
          label="Одна сессия в ленте"
          hint="Столько минут засчитываем за каждую победу"
          value={app.settings.sessionMinutes}
          min={SESSION_RANGE.min}
          max={SESSION_RANGE.max}
          step={SESSION_RANGE.step}
          format={formatMinutes}
          onChange={(value) => app.updateSettings({ sessionMinutes: value })}
        />
        <Separator />
        <Stepper
          label="Исходный уровень"
          hint="Сколько уходило в день до StopScroll"
          value={app.settings.baselineMinutes}
          min={BASELINE_RANGE.min}
          max={BASELINE_RANGE.max}
          step={BASELINE_RANGE.step}
          format={formatMinutes}
          onChange={(value) => app.updateSettings({ baselineMinutes: value })}
        />
      </Card>

      <AppText variant="overline" tone="subtle" className="px-1 pt-3" accessibilityRole="header">
        Главная лента
      </AppText>
      <Card className="flex-row flex-wrap gap-2">
        {FEED_APPS.map((item) => (
          <Chip
            key={item.id}
            label={item.label}
            icon={item.icon}
            selected={app.settings.mainApp === item.id}
            onPress={() => {
              haptics.selection();
              app.updateSettings({ mainApp: item.id });
            }}
          />
        ))}
      </Card>

      {__DEV__ || DEMO_MODE ? (
        <>
          <AppText variant="overline" tone="subtle" className="px-1 pt-3">
            {DEMO_MODE ? "Демо-версия" : "Разработка"}
          </AppText>
          {DEMO_MODE ? (
            <Card className="gap-3">
              <AppText variant="caption" tone="muted">
                Это версия для просмотра в браузере: оплата отключена. Заполните приложение примером
                данных, чтобы увидеть графики, серии и закономерности.
              </AppText>
              <Button
                label="Заполнить примером данных"
                icon="sparkles"
                variant="secondary"
                onPress={() => {
                  app.loadDemoData();
                  haptics.success();
                }}
              />
            </Card>
          ) : null}
          <Card className="flex-row items-center gap-3">
            <View className="flex-1">
              <AppText variant="label" className="text-base">
                Тестовый Pro
              </AppText>
              <AppText variant="caption" tone="muted">
                {DEMO_MODE
                  ? "Открывает Pro-функции без покупки, чтобы их посмотреть."
                  : "Только в dev-сборке: открывает Pro-функции без покупки."}
              </AppText>
            </View>
            <Switch
              value={pro.devPro}
              onValueChange={pro.setDevPro}
              trackColor={{ true: colors.successBright, false: colors.ringTrack }}
              accessibilityLabel="Тестовый Pro"
            />
          </Card>
        </>
      ) : null}

      <AppText variant="overline" tone="subtle" className="px-1 pt-3" accessibilityRole="header">
        Данные
      </AppText>
      <Card className="gap-3">
        <AppText variant="caption" tone="muted">
          Все записи хранятся только на этом устройстве. Сброс удалит историю времени, побед, срывов
          и свои замены, но сохранит цели и подписку.
        </AppText>
        {confirmReset ? (
          <View className="flex-row gap-3">
            <Button
              label="Отмена"
              variant="secondary"
              onPress={() => setConfirmReset(false)}
              className="flex-1"
            />
            <Button
              label="Стереть"
              icon="trash-outline"
              variant="warning"
              className="flex-1"
              onPress={() => {
                app.resetProgress();
                haptics.success();
                setConfirmReset(false);
              }}
            />
          </View>
        ) : (
          <Button
            label="Сбросить прогресс"
            variant="secondary"
            onPress={() => setConfirmReset(true)}
          />
        )}
      </Card>
      <LegalLinks className="pt-2" />
    </Screen>
  );
}
