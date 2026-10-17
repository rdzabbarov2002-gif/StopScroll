import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Platform, Pressable, Switch, View } from "react-native";

import { AppIconMark } from "../components/AppIconMark";
import { AppText } from "../components/AppText";
import { BackButton } from "../components/BackButton";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Separator } from "../components/CardLabel";
import { Chip } from "../components/Chip";
import { LegalLinks } from "../components/LegalLinks";
import { ListGroup, ListRow } from "../components/ListGroup";
import { Screen } from "../components/Screen";
import { Stepper } from "../components/Stepper";
import { ThemePicker } from "../components/ThemePicker";
import { useAi } from "../context/AiContext";
import { useApp } from "../context/AppContext";
import { usePro } from "../context/ProContext";
import { getLanguageInfo, useT } from "../i18n";
import type { RootStackScreenProps } from "../navigation/types";
import { FEED_APPS } from "../utils/catalog";
import { COACH_VOICE_AVAILABLE } from "../services/coachVoice";
import { enableReportReminder } from "../services/reportReminder";
import { formatMinutes, formatTime } from "../utils/date";
import { DEMO_MODE } from "../utils/demo";
import { haptics } from "../utils/haptics";
import { BASELINE_RANGE, LIMIT_RANGE, SESSION_RANGE } from "../utils/persistedState";
import { useThemeColors } from "../utils/theme";
import { WEEKLY_REPORT_HOUR } from "../utils/weeklyReport";

export function SettingsScreen({ navigation }: RootStackScreenProps<"Settings">) {
  const t = useT();
  const { colors } = useThemeColors();
  const ai = useAi();
  const app = useApp();
  const pro = usePro();
  const [confirmReset, setConfirmReset] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);
  const reportTime = formatTime(new Date().setHours(WEEKLY_REPORT_HOUR, 0, 0, 0));

  const toggleReminder = async (on: boolean) => {
    haptics.selection();
    setReminderMessage(null);
    if (!on) {
      app.updateSettings({ reportReminder: false });
      return;
    }
    const allowed = await enableReportReminder().catch(() => false);
    if (allowed) {
      app.updateSettings({ reportReminder: true });
    } else {
      setReminderMessage(
        Platform.OS === "web"
          ? t.settings.coach.notificationsWeb
          : t.settings.coach.notificationsDenied,
      );
    }
  };

  const restore = async () => {
    setRestoring(true);
    const result = await pro.restore();
    setRestoring(false);
    setRestoreMessage(
      !result.ok
        ? result.message
        : result.restored
          ? t.settings.pro.restored
          : t.settings.pro.nothingToRestore,
    );
  };

  return (
    <Screen>
      <BackButton label={t.settings.back} />
      <AppText variant="title" accessibilityRole="header" className="px-1 pb-1">
        {t.settings.title}
      </AppText>

      <Pressable
        onPress={() => navigation.navigate("Paywall")}
        accessibilityRole="button"
        accessibilityLabel={pro.isPro ? t.settings.pro.active : t.settings.pro.open}
        className="flex-row items-center gap-3.5 rounded-card bg-card p-4 active:opacity-80 dark:bg-ink-900"
      >
        <AppIconMark size={52} />
        <View className="flex-1 gap-0.5">
          <AppText variant="heading">
            {pro.isPro ? t.settings.pro.active : t.settings.pro.title}
          </AppText>
          <AppText variant="caption" tone="subtle" className="text-[14px] leading-[19px]">
            {pro.isPro ? t.settings.pro.activeText : t.settings.pro.pitch}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.chevron} />
      </Pressable>
      {pro.status === "ready" ? (
        <View className="gap-1.5">
          <Button
            label={t.settings.pro.restore}
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
        {t.settings.appearance}
      </AppText>
      <ThemePicker />
      <ListGroup>
        <ListRow
          icon="language-outline"
          iconColor={colors.primary}
          title={t.language.settingsRow}
          value={getLanguageInfo(app.language ?? "ru").nativeName}
          onPress={() => navigation.navigate("Language")}
        />
      </ListGroup>

      <AppText variant="overline" tone="subtle" className="px-1 pt-3" accessibilityRole="header">
        {t.settings.goals.header}
      </AppText>
      <Card className="gap-4">
        <Stepper
          label={t.settings.goals.limit}
          hint={t.settings.goals.limitHint}
          value={app.settings.dailyLimitMinutes}
          min={LIMIT_RANGE.min}
          max={LIMIT_RANGE.max}
          step={LIMIT_RANGE.step}
          format={formatMinutes}
          onChange={(value) => app.updateSettings({ dailyLimitMinutes: value })}
        />
        <Separator />
        <Stepper
          label={t.settings.goals.session}
          hint={t.settings.goals.sessionHint}
          value={app.settings.sessionMinutes}
          min={SESSION_RANGE.min}
          max={SESSION_RANGE.max}
          step={SESSION_RANGE.step}
          format={formatMinutes}
          onChange={(value) => app.updateSettings({ sessionMinutes: value })}
        />
        <Separator />
        <Stepper
          label={t.settings.goals.baseline}
          hint={t.settings.goals.baselineHint}
          value={app.settings.baselineMinutes}
          min={BASELINE_RANGE.min}
          max={BASELINE_RANGE.max}
          step={BASELINE_RANGE.step}
          format={formatMinutes}
          onChange={(value) => app.updateSettings({ baselineMinutes: value })}
        />
      </Card>

      <ListGroup
        header={t.settings.coach.header}
        footer={
          reminderMessage ??
          (COACH_VOICE_AVAILABLE
            ? t.settings.coach.footerWithPhrasing(reportTime)
            : t.settings.coach.footer(reportTime))
        }
      >
        <ListRow
          icon="calendar"
          iconColor={colors.indigo}
          title={t.settings.coach.report}
          right={
            <Switch
              value={app.settings.reportReminder}
              onValueChange={toggleReminder}
              trackColor={{ true: colors.successBright, false: colors.ringTrack }}
              accessibilityLabel={t.settings.coach.reportSwitch}
            />
          }
        />
        {COACH_VOICE_AVAILABLE ? (
          <ListRow
            icon="chatbubble-ellipses"
            iconColor={colors.primary}
            title={t.settings.coach.phrasing}
            right={
              <Switch
                value={app.settings.coachPhrasing}
                onValueChange={(value) => app.updateSettings({ coachPhrasing: value })}
                trackColor={{ true: colors.successBright, false: colors.ringTrack }}
                accessibilityLabel={t.settings.coach.phrasingSwitch}
              />
            }
          />
        ) : null}
      </ListGroup>

      <AiSettings />

      <AppText variant="overline" tone="subtle" className="px-1 pt-3" accessibilityRole="header">
        {t.settings.feed}
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
            {DEMO_MODE ? t.settings.dev.demo : t.settings.dev.development}
          </AppText>
          {DEMO_MODE ? (
            <Card className="gap-3">
              <AppText variant="caption" tone="muted">
                {t.settings.dev.demoText}
              </AppText>
              <Button
                label={t.settings.dev.demoFill}
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
                {t.settings.dev.testPro}
              </AppText>
              <AppText variant="caption" tone="muted">
                {DEMO_MODE ? t.settings.dev.testProDemo : t.settings.dev.testProDev}
              </AppText>
            </View>
            <Switch
              value={pro.devPro}
              onValueChange={pro.setDevPro}
              trackColor={{ true: colors.successBright, false: colors.ringTrack }}
              accessibilityLabel={t.settings.dev.testPro}
            />
          </Card>
        </>
      ) : null}

      <AppText variant="overline" tone="subtle" className="px-1 pt-3" accessibilityRole="header">
        {t.settings.data.header}
      </AppText>
      <Card className="gap-3">
        <AppText variant="caption" tone="muted">
          {t.settings.data.text}
        </AppText>
        {confirmReset ? (
          <View className="flex-row gap-3">
            <Button
              label={t.settings.cancel}
              variant="secondary"
              onPress={() => setConfirmReset(false)}
              className="flex-1"
            />
            <Button
              label={t.settings.erase}
              icon="trash-outline"
              variant="warning"
              className="flex-1"
              onPress={() => {
                app.resetProgress();
                ai.resetAi();
                haptics.success();
                setConfirmReset(false);
              }}
            />
          </View>
        ) : (
          <Button
            label={t.settings.data.reset}
            variant="secondary"
            onPress={() => setConfirmReset(true)}
          />
        )}
      </Card>
      <LegalLinks className="pt-2" />
    </Screen>
  );
}

/** The AI coach: permission to send entries to ChatGPT, and forgetting everything it learned. */
function AiSettings() {
  const t = useT();
  const { colors } = useThemeColors();
  const ai = useAi();
  const [confirming, setConfirming] = useState(false);
  if (!ai.configured) {
    return (
      <ListGroup header={t.settings.ai.header} footer={t.settings.ai.offFooter}>
        <ListRow
          icon="sparkles"
          iconColor={colors.textSubtle}
          title="ChatGPT"
          value={t.settings.ai.offValue}
        />
      </ListGroup>
    );
  }
  return (
    <ListGroup header={t.settings.ai.header} footer={t.settings.ai.footer}>
      <ListRow
        icon="sparkles"
        iconColor={colors.indigo}
        title={t.settings.ai.consent}
        right={
          <Switch
            value={ai.consent === true}
            onValueChange={ai.setConsent}
            trackColor={{ true: colors.successBright, false: colors.ringTrack }}
            accessibilityLabel={t.settings.ai.consentSwitch}
          />
        }
      />
      {confirming ? (
        <ListRow
          icon="trash"
          iconColor={colors.danger}
          title={t.settings.ai.confirmErase}
          destructive
          right={
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setConfirming(false)}
                accessibilityRole="button"
                hitSlop={8}
              >
                <AppText variant="label" tone="primary">
                  {t.settings.cancel}
                </AppText>
              </Pressable>
              <Pressable
                onPress={() => {
                  ai.resetAi();
                  haptics.success();
                  setConfirming(false);
                }}
                accessibilityRole="button"
                hitSlop={8}
              >
                <AppText variant="label" className="text-rose-500 dark:text-rose-400">
                  {t.settings.erase}
                </AppText>
              </Pressable>
            </View>
          }
        />
      ) : (
        <ListRow
          icon="trash"
          iconColor={colors.danger}
          title={t.settings.ai.erase}
          destructive
          onPress={() => setConfirming(true)}
        />
      )}
    </ListGroup>
  );
}
