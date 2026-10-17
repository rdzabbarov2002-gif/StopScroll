import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, Pressable, ScrollView, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { AppText } from "../components/AppText";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Chip } from "../components/Chip";
import { IconButton } from "../components/IconButton";
import { ReplacementCard } from "../components/ReplacementCard";
import { Screen } from "../components/Screen";
import { WinCelebration } from "../components/WinCelebration";
import { useApp } from "../context/AppContext";
import { usePro } from "../context/ProContext";
import { plural, useT } from "../i18n";
import type { RootStackScreenProps } from "../navigation/types";
import {
  EXERCISES,
  INTERCEPT_SECONDS,
  TRIGGERS,
  getExercise,
  getTrigger,
  type Exercise,
} from "../utils/catalog";
import { cn } from "../utils/cn";
import { formatMinutes } from "../utils/date";
import { haptics } from "../utils/haptics";
import { isLocked, suggestReplacements } from "../utils/replacements";
import { useThemeColors } from "../utils/theme";
import type { ExerciseId, TriggerId, WinEntry } from "../utils/types";

type Stage = "pause" | "decide" | "won";

const TOTAL_MS = INTERCEPT_SECONDS * 1000;
const TICK_MS = 200;

export function InterceptScreen({ navigation, route }: RootStackScreenProps<"Intercept">) {
  const themeColors = useThemeColors();
  const t = useT();
  const text = t.replacements.intercept;
  const app = useApp();
  const { isPro } = usePro();
  const [trigger, setTrigger] = useState<TriggerId | undefined>(route.params?.trigger);
  const [exerciseId, setExerciseId] = useState<ExerciseId>(() =>
    isPro || !getExercise(app.lastExerciseId).premium ? app.lastExerciseId : "breath-ground",
  );
  const [stage, setStage] = useState<Stage>("pause");
  // Bumped to restart the pause from zero.
  const [run, setRun] = useState(0);
  const [win, setWin] = useState<WinEntry | null>(null);
  // The pause only counts while this screen is on top (not under the Paywall).
  const isFocused = useIsFocused();
  // A Pro exercise the user tapped before buying; it starts once they come back with Pro.
  const pendingExercise = useRef<ExerciseId | null>(null);
  const { setLastExercise } = app;

  useFocusEffect(
    useCallback(() => {
      const pending = pendingExercise.current;
      pendingExercise.current = null;
      if (!pending || !isPro) return;
      setExerciseId(pending);
      setLastExercise(pending);
      setStage("pause");
      setRun((value) => value + 1);
    }, [isPro, setLastExercise]),
  );

  const close = () => navigation.goBack();

  const chooseExercise = (exercise: Exercise) => {
    if (exercise.premium && !isPro) {
      pendingExercise.current = exercise.id;
      navigation.navigate("Paywall", { feature: "exercises" });
      return;
    }
    haptics.selection();
    setExerciseId(exercise.id);
    app.setLastExercise(exercise.id);
    setRun((value) => value + 1);
  };

  if (stage === "won" && win) {
    return (
      <Screen>
        <WinCelebration
          win={win}
          onDone={close}
          onUndo={() => {
            app.undoWin(win.id);
            setWin(null);
            setStage("decide");
          }}
        />
      </Screen>
    );
  }

  if (stage === "decide") {
    const suggestions = suggestReplacements(trigger, isPro);
    return (
      <Screen>
        <View className="flex-row items-center justify-between px-1">
          <AppText variant="overline" tone="subtle">
            {text.passed}
          </AppText>
          <IconButton icon="close" onPress={close} accessibilityLabel={t.replacements.close} />
        </View>

        <View className="gap-2 px-1">
          <AppText variant="title" accessibilityRole="header">
            {text.title}
          </AppText>
          <AppText tone="muted">{text.text}</AppText>
        </View>

        <Card className="gap-3">
          <AppText variant="heading">{text.whatTriggered}</AppText>
          <View className="flex-row flex-wrap gap-2">
            {TRIGGERS.map((item) => (
              <Chip
                key={item.id}
                label={item.label}
                icon={item.icon}
                selected={trigger === item.id}
                onPress={() => {
                  haptics.selection();
                  setTrigger(trigger === item.id ? undefined : item.id);
                }}
              />
            ))}
          </View>
        </Card>

        <View className="gap-3">
          <AppText variant="overline" tone="subtle" className="px-1 pt-2">
            {trigger ? text.suggestionsFor[trigger] : text.suggestionsAny}
          </AppText>
          {suggestions.map((item) => (
            <ReplacementCard
              key={item.id}
              item={item}
              compact
              locked={isLocked(item, isPro)}
              onPress={() =>
                isLocked(item, isPro)
                  ? navigation.navigate("Paywall", { feature: "replacements" })
                  : navigation.replace("Replacement", { id: item.id, trigger })
              }
            />
          ))}
        </View>

        <View className="gap-2">
          <Button
            label={text.switched(formatMinutes(app.settings.sessionMinutes))}
            icon="checkmark-circle"
            variant="success"
            size="lg"
            onPress={() => {
              const entry = app.recordWin({ source: "sos", trigger });
              haptics.success();
              setWin(entry);
              setStage("won");
            }}
          />
          <Button
            label={text.more}
            icon="refresh"
            variant="secondary"
            onPress={() => {
              setRun((value) => value + 1);
              setStage("pause");
            }}
          />
          <Button
            label={text.logSlip}
            variant="ghost"
            onPress={() =>
              navigation.popTo("Main", {
                screen: "Journal",
                params: { trigger, handoffAt: Date.now() },
              })
            }
          />
        </View>
      </Screen>
    );
  }

  const exercise = getExercise(exerciseId);
  const { colors } = themeColors;

  return (
    <Screen>
      <View className="h-10 flex-row items-center justify-between">
        <View className="flex-1 items-start">
          {trigger ? (
            <View className="h-9 flex-row items-center gap-1.5 rounded-full bg-card px-3.5 dark:bg-ink-900">
              <Ionicons name={getTrigger(trigger).icon} size={15} color={colors.indigo} />
              <AppText variant="label">{getTrigger(trigger).label}</AppText>
            </View>
          ) : null}
        </View>
        <AppText variant="heading">{text.pause}</AppText>
        <View className="flex-1 items-end">
          <IconButton icon="close" onPress={close} accessibilityLabel={text.closePause} />
        </View>
      </View>

      <View className="items-center gap-1 px-2 pt-2">
        <AppText
          className="text-center text-[28px] font-bold leading-[34px] tracking-tight"
          accessibilityRole="header"
        >
          {text.heading}
        </AppText>
        <AppText variant="caption" tone="muted" className="text-center">
          {text.wave}
        </AppText>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
        className="-mx-4 grow-0"
      >
        {EXERCISES.map((item) => (
          <ExerciseChip
            key={item.id}
            exercise={item}
            selected={item.id === exerciseId}
            locked={Boolean(item.premium) && !isPro}
            onPress={() => chooseExercise(item)}
          />
        ))}
      </ScrollView>

      <PausePhase
        key={`${exerciseId}-${run}`}
        active={isFocused}
        exercise={exercise}
        onDone={() => setStage("decide")}
      />
    </Screen>
  );
}

function ExerciseChip({
  exercise,
  selected,
  locked,
  onPress,
}: {
  exercise: Exercise;
  selected: boolean;
  locked: boolean;
  onPress: () => void;
}) {
  const { colors } = useThemeColors();
  const t = useT();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${exercise.title}${locked ? t.replacements.a11y.locked : ""}`}
      className={cn(
        "h-9 flex-row items-center gap-1.5 rounded-full px-3.5 active:opacity-80",
        selected ? "bg-brand-600 dark:bg-brand-500" : "bg-card dark:bg-ink-900",
      )}
    >
      <Ionicons
        name={locked ? "lock-closed" : exercise.icon}
        size={15}
        color={selected ? colors.onPrimary : colors.textMuted}
      />
      <AppText
        variant="label"
        className={cn("text-[14px]", selected ? "text-white dark:text-white" : "")}
      >
        {exercise.title}
      </AppText>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// The pause itself
// ---------------------------------------------------------------------------

const CIRCLE = 300;
const RING_STROKE = 6;
const MIN_SCALE = 0.6;
const useNativeDriver = Platform.OS !== "web";

function locate<T extends { seconds: number }>(items: readonly T[], seconds: number) {
  let t = seconds;
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index]!;
    if (t < item.seconds) return { index, remaining: item.seconds - t };
    t -= item.seconds;
  }
  return { index: items.length - 1, remaining: 0 };
}

function PausePhase({
  exercise,
  active,
  onDone,
}: {
  exercise: Exercise;
  /** False while another screen covers this one: the clock and the circle freeze. */
  active: boolean;
  onDone: () => void;
}) {
  const { colors, isDark } = useThemeColors();
  const t = useT();
  const text = t.replacements.intercept;
  const [elapsedMs, setElapsedMs] = useState(0);
  const [scale] = useState(() => new Animated.Value(MIN_SCALE));
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  // Wall-clock deltas, so a slow JS frame never stretches the pause; time only
  // accumulates while the screen is active.
  const elapsedRef = useRef(0);
  useEffect(() => {
    if (!active) return;
    let last = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      elapsedRef.current = Math.min(TOTAL_MS, elapsedRef.current + (now - last));
      last = now;
      setElapsedMs(elapsedRef.current);
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [active]);

  const finished = elapsedMs >= TOTAL_MS;
  useEffect(() => {
    if (!finished) return;
    haptics.success();
    onDoneRef.current();
  }, [finished]);

  const seconds = elapsedMs / 1000;
  const cycleSeconds = exercise.breath.reduce((sum, phase) => sum + phase.seconds, 0);
  const cycle = Math.floor(seconds / cycleSeconds);
  const breath = locate(exercise.breath, seconds % cycleSeconds);
  const prompt = locate(exercise.prompts, Math.min(seconds, INTERCEPT_SECONDS - 0.001));
  const phase = exercise.breath[breath.index]!;
  const phaseKey = cycle * exercise.breath.length + breath.index;
  const remainingRef = useRef(breath.remaining);
  useEffect(() => {
    remainingRef.current = breath.remaining;
  });

  // Each breathing phase animates the circle towards its target size.
  useEffect(() => {
    if (!active) {
      scale.stopAnimation();
      return;
    }
    const target = exercise.breath[phaseKey % exercise.breath.length]!;
    haptics.light();
    const animation = Animated.timing(scale, {
      toValue: target.scale,
      duration: Math.max(200, remainingRef.current * 1000),
      easing: Easing.inOut(Easing.sin),
      useNativeDriver,
    });
    animation.start();
    return () => animation.stop();
  }, [phaseKey, exercise, scale, active]);

  const secondsLeft = Math.ceil((TOTAL_MS - elapsedMs) / 1000);

  const ringRadius = CIRCLE / 2 - RING_STROKE;
  const circumference = 2 * Math.PI * ringRadius;
  const remaining = Math.max(0, 1 - elapsedMs / TOTAL_MS);

  return (
    <View className="items-center gap-5">
      <View
        style={{ width: CIRCLE, height: CIRCLE }}
        className="items-center justify-center"
        accessible
        accessibilityLiveRegion="polite"
        accessibilityLabel={text.phaseA11y(phase.label, secondsLeft)}
      >
        {[0.86, 0.72, 0.58].map((size, index) => (
          <View
            key={size}
            className="absolute rounded-full"
            style={{
              width: CIRCLE * size,
              height: CIRCLE * size,
              backgroundColor: colors.primary,
              opacity: isDark ? [0.1, 0.14, 0.2][index] : [0.07, 0.1, 0.15][index],
            }}
          />
        ))}
        <Animated.View
          style={{
            position: "absolute",
            width: CIRCLE * 0.86,
            height: CIRCLE * 0.86,
            borderRadius: CIRCLE,
            backgroundColor: colors.primary,
            opacity: isDark ? 0.18 : 0.12,
            transform: [{ scale }],
          }}
        />
        <Svg width={CIRCLE} height={CIRCLE} style={{ position: "absolute" }}>
          <Circle
            cx={CIRCLE / 2}
            cy={CIRCLE / 2}
            r={ringRadius}
            stroke={colors.ringTrack}
            strokeWidth={RING_STROKE}
            fill="none"
          />
          <Circle
            cx={CIRCLE / 2}
            cy={CIRCLE / 2}
            r={ringRadius}
            stroke={colors.primary}
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${circumference * remaining} ${circumference}`}
            transform={`rotate(-90 ${CIRCLE / 2} ${CIRCLE / 2})`}
          />
        </Svg>
        <View className="items-center">
          <AppText variant="heading" tone="primary">
            {phase.label}
          </AppText>
          <AppText rounded className="text-[84px] font-bold leading-[92px] tracking-tight">
            {secondsLeft}
          </AppText>
          <AppText variant="label" tone="subtle">
            {plural(secondsLeft, t.replacements.units.seconds)}
          </AppText>
        </View>
      </View>

      <Card className="w-full gap-2">
        <View className="flex-row items-center justify-between gap-3">
          <AppText variant="label" tone="primary" className="shrink" numberOfLines={1}>
            {exercise.title} · {text.step(prompt.index + 1, exercise.prompts.length)}
          </AppText>
          <View className="flex-row items-center gap-1">
            {exercise.prompts.map((item, index) => (
              <View
                key={item.text}
                className="h-1.5 rounded-full"
                style={{
                  width: index === prompt.index ? 18 : 6,
                  backgroundColor: index <= prompt.index ? colors.primary : colors.ringTrack,
                }}
              />
            ))}
          </View>
        </View>
        <AppText variant="statement" className="min-h-[50px]">
          {exercise.prompts[prompt.index]!.text}
        </AppText>
      </Card>
    </View>
  );
}
