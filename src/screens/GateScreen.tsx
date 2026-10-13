import Ionicons from "@expo/vector-icons/Ionicons";
import { useIsFocused } from "@react-navigation/native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Platform, View } from "react-native";

import { AppText } from "../components/AppText";
import { BreathingRing } from "../components/BreathingRing";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { CardLabel, DurationValue, KeyValue, Separator } from "../components/CardLabel";
import { categoryColor } from "../components/categoryColors";
import { IconButton } from "../components/IconButton";
import { ListGroup, ListRow } from "../components/ListGroup";
import { Screen } from "../components/Screen";
import { WinCelebration } from "../components/WinCelebration";
import { useApp } from "../context/AppContext";
import { usePro } from "../context/ProContext";
import type { RootStackScreenProps } from "../navigation/types";
import { allowGateApp, openGateApp } from "../services/appGate";
import { computePatterns } from "../utils/analytics";
import { GATE_ALLOW_MINUTES, GATE_THOUGHTS, getGateApp, isGateApp } from "../utils/catalog";
import {
  DAY_FORMS,
  MS_PER_DAY,
  MS_PER_MINUTE,
  TIMES_FORMS,
  dayKey,
  formatDurationWords,
  formatMinutes,
  pluralize,
} from "../utils/date";
import { haptics } from "../utils/haptics";
import { isLocked, suggestReplacements } from "../utils/replacements";
import { getCurrentStreak, summarizeWins } from "../utils/stats";
import { useThemeColors } from "../utils/theme";
import type { GateApp, GateOutcome, InterceptEntry, WinEntry } from "../utils/types";

const RING = 264;
const TICK_MS = 200;
/** A JS timer doesn't run in the background; longer gaps are not counted as waiting. */
const MAX_TICK_GAP_MS = 1000;
const BREATH_MS = 4000;
const MIN_SCALE = 0.6;
const SECOND_FORMS = ["секунда", "секунды", "секунд"] as const;
const useNativeDriver = Platform.OS !== "web";

const pickRandom = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)]!;

/**
 * The pause in front of TikTok, Reels or Shorts: a breathing countdown, a thought and the
 * user's own numbers. Declining, the SOS pause and a replacement are open right away; the
 * feed app itself only after the countdown.
 */
export function GateScreen({ navigation, route }: RootStackScreenProps<"Gate">) {
  const app = useApp();
  const { isPro } = usePro();
  const requested = route.params?.app;
  const preview = route.params?.preview === true;
  const [gateApp] = useState<GateApp>(() =>
    isGateApp(requested)
      ? requested
      : isGateApp(app.settings.mainApp)
        ? app.settings.mainApp
        : "tiktok",
  );
  const info = getGateApp(gateApp);
  const [win, setWin] = useState<{ win: WinEntry; intercept: InterceptEntry } | null>(null);

  // Whatever ends the pause (a button, the close icon, the back gesture) is recorded once.
  const decided = useRef(preview);
  const { logIntercept, recordWin } = app;
  const decide = (outcome: GateOutcome) => {
    decided.current = true;
    return logIntercept(gateApp, outcome);
  };
  useEffect(
    () =>
      navigation.addListener("beforeRemove", () => {
        // Leaving without a choice (close icon, back button) still kept the feed closed.
        if (decided.current) return;
        decided.current = true;
        logIntercept(gateApp, "declined");
        recordWin({ source: "gate" });
      }),
    [navigation, gateApp, logIntercept, recordWin],
  );

  const close = () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate("Main"));

  if (win) {
    return (
      <Screen>
        <WinCelebration
          win={win.win}
          onDone={close}
          onUndo={() => {
            app.undoWin(win.win.id);
            app.undoIntercept(win.intercept.id);
            decided.current = false;
            setWin(null);
          }}
        />
      </Screen>
    );
  }

  return (
    <GatePause
      key={gateApp}
      appName={info.appName}
      appIcon={info.icon}
      preview={preview}
      isPro={isPro}
      onClose={close}
      onDecline={() => {
        if (preview) return close();
        const intercept = decide("declined");
        const entry = recordWin({ source: "gate" });
        haptics.success();
        setWin({ win: entry, intercept });
      }}
      onSos={() => {
        if (!preview) decide("sos");
        navigation.replace("Intercept");
      }}
      onReplacement={(id) => {
        if (!preview) decide("replacement");
        navigation.replace("Replacement", { id });
      }}
      onOpen={() => {
        if (preview) return close();
        decide("opened");
        allowGateApp(gateApp, Date.now() + GATE_ALLOW_MINUTES * MS_PER_MINUTE);
        close();
        openGateApp(gateApp).catch(() => undefined);
      }}
    />
  );
}

function GatePause({
  appName,
  appIcon,
  preview,
  isPro,
  onClose,
  onDecline,
  onSos,
  onReplacement,
  onOpen,
}: {
  appName: string;
  appIcon: ReturnType<typeof getGateApp>["icon"];
  preview: boolean;
  isPro: boolean;
  onClose: () => void;
  onDecline: () => void;
  onSos: () => void;
  onReplacement: (id: string) => void;
  onOpen: () => void;
}) {
  const { colors } = useThemeColors();
  const app = useApp();
  const totalMs = app.settings.gateSeconds * 1000;
  const active = useIsFocused();

  // The clock keeps running after the countdown, so the circle keeps breathing.
  const [elapsedMs, setElapsedMs] = useState(0);
  const elapsedRef = useRef(0);
  useEffect(() => {
    if (!active) return;
    let last = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      elapsedRef.current += Math.min(MAX_TICK_GAP_MS, now - last);
      last = now;
      setElapsedMs(elapsedRef.current);
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [active]);

  const done = elapsedMs >= totalMs;
  useEffect(() => {
    if (done) haptics.success();
  }, [done]);

  // Inhale and exhale, four seconds each.
  const [scale] = useState(() => new Animated.Value(MIN_SCALE));
  const breathIndex = Math.floor(elapsedMs / BREATH_MS);
  const inhale = breathIndex % 2 === 0;
  const phaseLeftRef = useRef(BREATH_MS);
  useEffect(() => {
    phaseLeftRef.current = BREATH_MS - (elapsedMs % BREATH_MS);
  });
  useEffect(() => {
    if (!active) {
      scale.stopAnimation();
      return;
    }
    haptics.light();
    const animation = Animated.timing(scale, {
      toValue: breathIndex % 2 === 0 ? 1 : MIN_SCALE,
      duration: Math.max(200, phaseLeftRef.current),
      easing: Easing.inOut(Easing.sin),
      useNativeDriver,
    });
    animation.start();
    return () => animation.stop();
  }, [breathIndex, scale, active]);

  // Picked once per pause: a thought and one of the user's real numbers.
  const [thought] = useState(() => pickRandom(GATE_THOUGHTS));
  const saved = summarizeWins(app.wins, app.winArchive, app.todayKey);
  const streak = getCurrentStreak(app.scrollLog, app.settings.dailyLimitMinutes, app.todayKey);
  const [statLine] = useState(() => {
    const weekAgo = Date.now() - 7 * MS_PER_DAY;
    const prevented = app.intercepts.filter(
      (item) => item.timestamp >= weekAgo && item.outcome !== "opened",
    ).length;
    const lines: string[] = [];
    if (saved.todayMinutes > 0) {
      lines.push(`Сегодня вы уже спасли ${formatDurationWords(saved.todayMinutes)}.`);
    }
    if (streak >= 2)
      lines.push(`У вас серия ${streak} ${pluralize(streak, DAY_FORMS)} в пределах лимита.`);
    if (prevented >= 2) {
      lines.push(
        `За неделю пауза остановила ленту ${prevented} ${pluralize(prevented, TIMES_FORMS)}.`,
      );
    }
    if (saved.weekMinutes > saved.todayMinutes) {
      lines.push(`За 7 дней вы вернули себе ${formatDurationWords(saved.weekMinutes)}.`);
    }
    return lines.length > 0
      ? pickRandom(lines)
      : "Это начало: каждая пауза перед лентой — шаг к первой серии.";
  });

  // A replacement that fits the user's usual trigger and isn't done yet today.
  const pick = useMemo(() => {
    const patterns = computePatterns(app.slips, app.wins);
    const doneToday = new Set(
      app.wins
        .filter((entry) => entry.replacementId && dayKey(entry.timestamp) === app.todayKey)
        .map((entry) => entry.replacementId),
    );
    const options = suggestReplacements(patterns.topTrigger ?? undefined, isPro, 12).filter(
      (item) => !isLocked(item, isPro),
    );
    return options.find((item) => !doneToday.has(item.id)) ?? options[0];
  }, [app.slips, app.wins, app.todayKey, isPro]);

  const secondsLeft = Math.max(0, Math.ceil((totalMs - elapsedMs) / 1000));

  return (
    <Screen>
      <View className="h-10 flex-row items-center justify-between">
        <View className="flex-1 items-start">
          <View className="h-9 flex-row items-center gap-1.5 rounded-full bg-card px-3.5 dark:bg-ink-900">
            <Ionicons name={appIcon} size={15} color={colors.text} />
            <AppText variant="label">{appName}</AppText>
          </View>
        </View>
        <AppText variant="heading">{preview ? "Предпросмотр" : "Пауза"}</AppText>
        <View className="flex-1 items-end">
          <IconButton icon="close" onPress={onClose} accessibilityLabel="Не открывать и закрыть" />
        </View>
      </View>

      <View className="items-center gap-1 px-2 pt-1">
        <AppText
          className="text-center text-[28px] font-bold leading-[34px] tracking-tight"
          accessibilityRole="header"
        >
          {done ? "Решение за вами" : `Вы открываете ${appName}`}
        </AppText>
        <AppText variant="caption" tone="muted" className="text-center">
          {done
            ? `Импульс прошёл проверку временем. ${appName} подождёт — а вы?`
            : "Подышите вместе с кругом: желание обычно слабеет за несколько секунд."}
        </AppText>
      </View>

      <View className="items-center pt-1">
        <BreathingRing
          size={RING}
          scale={scale}
          remaining={done ? 0 : 1 - elapsedMs / totalMs}
          color={done ? colors.successBright : undefined}
          accessibilityLabel={
            done
              ? `${inhale ? "Вдох" : "Выдох"}. Пауза пройдена`
              : `${inhale ? "Вдох" : "Выдох"}. Осталось ${secondsLeft} ${pluralize(secondsLeft, SECOND_FORMS)}`
          }
        >
          <View className="items-center">
            <AppText variant="heading" style={{ color: done ? colors.success : colors.primary }}>
              {inhale ? "Вдох" : "Выдох"}
            </AppText>
            {done ? (
              <View className="h-[92px] items-center justify-center">
                <Ionicons name="checkmark" size={64} color={colors.success} />
              </View>
            ) : (
              <AppText rounded className="text-[84px] font-bold leading-[92px] tracking-tight">
                {secondsLeft}
              </AppText>
            )}
            <AppText variant="label" tone="subtle">
              {done ? "пауза пройдена" : pluralize(secondsLeft, SECOND_FORMS)}
            </AppText>
          </View>
        </BreathingRing>
      </View>

      <AppText variant="statement" tone="muted" className="px-3 text-center">
        «{thought}»
      </AppText>

      <Card>
        <CardLabel icon="leaf" label="Ваш счёт" color={colors.success} />
        <AppText variant="statement" className="mt-2">
          {statLine}
        </AppText>
        <Separator className="my-3.5" />
        <View className="flex-row gap-3">
          <DurationValue label="Сегодня" minutes={saved.todayMinutes} color={colors.success} />
          <KeyValue
            label="Серия"
            value={String(streak)}
            unit={pluralize(streak, DAY_FORMS)}
            color={colors.warningStrong}
          />
        </View>
      </Card>

      <ListGroup header="Вместо ленты">
        <ListRow
          icon="pause-circle"
          iconColor={colors.primary}
          title="SOS-пауза"
          subtitle="15 секунд дыхания — и спокойный выбор"
          onPress={onSos}
        />
        {pick ? (
          <ListRow
            icon={pick.icon}
            iconColor={categoryColor(pick.category, colors)}
            title={pick.title}
            subtitle={`Полезная замена · ${pick.minutes} мин`}
            onPress={() => onReplacement(pick.id)}
          />
        ) : null}
      </ListGroup>

      <View className="gap-2 pt-1">
        <Button
          label={`Не открывать · +${formatMinutes(app.settings.sessionMinutes)}`}
          icon="checkmark-circle"
          variant="success"
          size="lg"
          onPress={onDecline}
        />
        <Button
          label={
            done ? `Всё равно открыть ${appName}` : `Открыть ${appName} через ${secondsLeft} с`
          }
          variant="ghost"
          disabled={!done}
          onPress={onOpen}
          accessibilityHint={`Следующие ${GATE_ALLOW_MINUTES} минут ${appName} будет открываться без паузы`}
        />
      </View>
    </Screen>
  );
}
