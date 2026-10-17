import Ionicons from "@expo/vector-icons/Ionicons";
import Slider from "@react-native-community/slider";
import { useState } from "react";
import { View } from "react-native";

import { AppIconMark } from "../components/AppIconMark";
import { AppText } from "../components/AppText";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Chip } from "../components/Chip";
import { Screen } from "../components/Screen";
import { Stepper } from "../components/Stepper";
import { useApp } from "../context/AppContext";
import { useT, type Messages } from "../i18n";
import { DEMO_MODE } from "../utils/demo";
import { FEED_APPS } from "../utils/catalog";
import { cn } from "../utils/cn";
import { formatMinutes } from "../utils/date";
import { haptics } from "../utils/haptics";
import {
  BASELINE_RANGE,
  DEFAULT_SETTINGS,
  LIMIT_RANGE,
  SESSION_RANGE,
  clampToRange,
  minutesToSlider,
  sliderToMinutes,
} from "../utils/persistedState";
import { useThemeColors } from "../utils/theme";
import type { FeedApp, IconName } from "../utils/types";

const STEPS = 3;

const PROMISES: readonly {
  id: keyof Messages["onboarding"]["promises"];
  icon: IconName;
}[] = [
  { id: "sos", icon: "hand-left-outline" },
  { id: "replacements", icon: "swap-horizontal-outline" },
  { id: "stats", icon: "stats-chart-outline" },
];

export function OnboardingScreen() {
  const t = useT();
  const { colors } = useThemeColors();
  const { completeOnboarding, loadDemoData } = useApp();
  const [step, setStep] = useState(0);
  const [baseline, setBaseline] = useState(DEFAULT_SETTINGS.baselineMinutes);
  const [mainApp, setMainApp] = useState<FeedApp>(DEFAULT_SETTINGS.mainApp);
  const [limit, setLimit] = useState(DEFAULT_SETTINGS.dailyLimitMinutes);
  const [session, setSession] = useState(DEFAULT_SETTINGS.sessionMinutes);

  const next = () => {
    haptics.selection();
    if (step === 1) {
      // Suggest a limit of roughly a third of today's habit as the first goal.
      setLimit(
        clampToRange(Math.min(DEFAULT_SETTINGS.dailyLimitMinutes, baseline / 3), LIMIT_RANGE),
      );
    }
    setStep((value) => Math.min(STEPS - 1, value + 1));
  };

  const finish = () => {
    haptics.success();
    completeOnboarding({
      ...DEFAULT_SETTINGS,
      baselineMinutes: baseline,
      mainApp,
      dailyLimitMinutes: limit,
      sessionMinutes: session,
    });
  };

  return (
    <Screen contentClassName="gap-6">
      <View
        className="flex-row justify-center gap-2 pt-2"
        accessible
        accessibilityLabel={t.onboarding.step(step + 1, STEPS)}
      >
        {Array.from({ length: STEPS }, (_, index) => (
          <View
            key={index}
            className={cn(
              "h-1.5 rounded-full",
              index === step
                ? "w-8 bg-brand-600 dark:bg-brand-400"
                : "w-4 bg-slate-200 dark:bg-ink-700",
            )}
          />
        ))}
      </View>

      {step === 0 ? (
        <>
          <View className="items-center gap-4 pt-6">
            <AppIconMark size={96} />
            <AppText variant="title" className="text-center text-4xl" accessibilityRole="header">
              StopScroll
            </AppText>
            <AppText tone="muted" className="text-center text-lg leading-7">
              {t.onboarding.intro}
            </AppText>
          </View>
          <View className="gap-3">
            {PROMISES.map((item) => (
              <Card key={item.id} className="flex-row items-center gap-4">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-900/60">
                  <Ionicons name={item.icon} size={22} color={colors.primary} />
                </View>
                <View className="flex-1 gap-0.5">
                  <AppText variant="label" className="text-base">
                    {t.onboarding.promises[item.id].title}
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    {t.onboarding.promises[item.id].text}
                  </AppText>
                </View>
              </Card>
            ))}
          </View>
          <Button label={t.onboarding.start} size="lg" icon="arrow-forward" onPress={next} />
          {DEMO_MODE ? (
            <Button label={t.onboarding.demo} variant="secondary" onPress={loadDemoData} />
          ) : null}
        </>
      ) : null}

      {step === 1 ? (
        <>
          <View className="gap-2 pt-4">
            <AppText variant="overline" tone="primary">
              {t.onboarding.baseline.overline}
            </AppText>
            <AppText variant="title" accessibilityRole="header">
              {t.onboarding.baseline.title}
            </AppText>
            <AppText tone="muted">{t.onboarding.baseline.text}</AppText>
          </View>
          <Card className="gap-4">
            <AppText variant="display" className="text-center text-5xl">
              {formatMinutes(baseline)}
            </AppText>
            <Slider
              value={minutesToSlider(baseline)}
              minimumValue={0}
              maximumValue={1}
              onValueChange={(position) =>
                setBaseline(clampToRange(sliderToMinutes(position), BASELINE_RANGE))
              }
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.ringTrack}
              thumbTintColor={colors.primaryStrong}
              accessibilityLabel={t.onboarding.baseline.slider}
              style={{ height: 40 }}
            />
          </Card>
          <View className="gap-3">
            <AppText variant="label">{t.onboarding.baseline.mainApp}</AppText>
            <View className="flex-row flex-wrap gap-2">
              {FEED_APPS.map((item) => (
                <Chip
                  key={item.id}
                  label={item.label}
                  icon={item.icon}
                  selected={mainApp === item.id}
                  onPress={() => setMainApp(item.id)}
                />
              ))}
            </View>
          </View>
          <Button
            label={t.onboarding.baseline.next}
            size="lg"
            icon="arrow-forward"
            onPress={next}
          />
        </>
      ) : null}

      {step === 2 ? (
        <>
          <View className="gap-2 pt-4">
            <AppText variant="overline" tone="primary">
              {t.onboarding.goal.overline}
            </AppText>
            <AppText variant="title" accessibilityRole="header">
              {t.onboarding.goal.title}
            </AppText>
            <AppText tone="muted">{t.onboarding.goal.text}</AppText>
          </View>
          <Card className="gap-5">
            <Stepper
              label={t.onboarding.goal.limit}
              value={limit}
              min={LIMIT_RANGE.min}
              max={LIMIT_RANGE.max}
              step={LIMIT_RANGE.step}
              format={formatMinutes}
              onChange={setLimit}
            />
            <Stepper
              label={t.onboarding.goal.session}
              hint={t.onboarding.goal.sessionHint}
              value={session}
              min={SESSION_RANGE.min}
              max={SESSION_RANGE.max}
              step={SESSION_RANGE.step}
              format={formatMinutes}
              onChange={setSession}
            />
          </Card>
          <AppText variant="caption" tone="muted" className="text-center">
            {t.onboarding.goal.summary(
              formatMinutes(Math.max(0, baseline - limit)),
              formatMinutes(Math.max(0, baseline - limit) * 7),
            )}
          </AppText>
          <View className="gap-2">
            <Button
              label={t.onboarding.goal.done}
              size="lg"
              icon="checkmark-circle"
              onPress={finish}
            />
            <Button label={t.onboarding.goal.back} variant="ghost" onPress={() => setStep(1)} />
          </View>
        </>
      ) : null}
    </Screen>
  );
}
