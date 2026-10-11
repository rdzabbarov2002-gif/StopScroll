import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Switch, View } from "react-native";

import { AppText } from "../components/AppText";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Chip } from "../components/Chip";
import { IconButton } from "../components/IconButton";
import { Screen } from "../components/Screen";
import { SegmentedControl } from "../components/SegmentedControl";
import { SectionTitle } from "../components/SectionTitle";
import { Stepper } from "../components/Stepper";
import { THEME_META } from "../components/ThemeToggle";
import { useApp } from "../context/AppContext";
import { usePro } from "../context/ProContext";
import type { RootStackScreenProps } from "../navigation/types";
import { FEED_APPS } from "../utils/catalog";
import { formatMinutes } from "../utils/date";
import { haptics } from "../utils/haptics";
import { BASELINE_RANGE, LIMIT_RANGE, SESSION_RANGE } from "../utils/persistedState";
import { useThemeColors } from "../utils/theme";
import type { ThemePreference } from "../utils/types";

const THEMES: readonly ThemePreference[] = ["system", "light", "dark"];

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
      <View className="flex-row items-center gap-3">
        <IconButton
          icon="chevron-back"
          onPress={() => navigation.goBack()}
          accessibilityLabel="Назад"
        />
        <AppText variant="title" accessibilityRole="header">
          Настройки
        </AppText>
      </View>

      <Card tone={pro.isPro ? "primary" : "default"} className="gap-4">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 dark:bg-brand-500">
            <Ionicons name="shield-checkmark" size={24} color={colors.onPrimary} />
          </View>
          <View className="flex-1">
            <AppText variant="heading">
              {pro.isPro ? "StopScroll Pro активен" : "Бесплатная версия"}
            </AppText>
            <AppText variant="caption" tone="muted">
              {pro.isPro
                ? "Все упражнения, замены и глубокая аналитика открыты."
                : "Откройте все упражнения, свои замены и глубокую аналитику."}
            </AppText>
          </View>
        </View>
        {!pro.isPro ? (
          <Button
            label="Открыть Pro"
            icon="sparkles"
            onPress={() => navigation.navigate("Paywall")}
          />
        ) : null}
        {pro.status === "ready" ? (
          <Button
            label="Восстановить покупки"
            variant="secondary"
            loading={restoring}
            onPress={restore}
          />
        ) : null}
        {restoreMessage ? (
          <AppText variant="caption" tone="muted" accessibilityLiveRegion="polite">
            {restoreMessage}
          </AppText>
        ) : null}
      </Card>

      <SectionTitle title="Цели" />
      <Card className="gap-5">
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

      <SectionTitle title="Главная лента" />
      <View className="flex-row flex-wrap gap-2">
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
      </View>

      <SectionTitle title="Оформление" />
      <SegmentedControl
        options={THEMES.map((value) => ({
          value,
          label: THEME_META[value].label.charAt(0).toUpperCase() + THEME_META[value].label.slice(1),
        }))}
        value={app.themePreference}
        onChange={app.setThemePreference}
      />

      {__DEV__ ? (
        <>
          <SectionTitle title="Разработка" />
          <Card className="flex-row items-center gap-3">
            <View className="flex-1">
              <AppText variant="label" className="text-base">
                Тестовый Pro
              </AppText>
              <AppText variant="caption" tone="muted">
                Только в dev-сборке: открывает Pro-функции без покупки.
              </AppText>
            </View>
            <Switch
              value={pro.devPro}
              onValueChange={pro.setDevPro}
              trackColor={{ true: colors.primary, false: colors.ringTrack }}
              accessibilityLabel="Тестовый Pro"
            />
          </Card>
        </>
      ) : null}

      <SectionTitle title="Данные" />
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
    </Screen>
  );
}
