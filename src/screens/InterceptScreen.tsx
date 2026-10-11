import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, Pressable, ScrollView, View } from "react-native";

import { AppText } from "../components/AppText";
import { Button } from "../components/Button";
import { Chip } from "../components/Chip";
import { IconButton } from "../components/IconButton";
import { ProgressBar } from "../components/ProgressBar";
import { ReplacementCard } from "../components/ReplacementCard";
import { Screen } from "../components/Screen";
import { WinCelebration } from "../components/WinCelebration";
import { useApp } from "../context/AppContext";
import { usePro } from "../context/ProContext";
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

  const close = () => navigation.goBack();

  const chooseExercise = (exercise: Exercise) => {
    if (exercise.premium && !isPro) {
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
        <View className="flex-row items-center justify-between">
          <AppText variant="overline" tone="primary">
            Пауза пройдена
          </AppText>
          <IconButton icon="close" onPress={close} accessibilityLabel="Закрыть" />
        </View>

        <View className="gap-2">
          <AppText variant="title" accessibilityRole="header">
            Импульс ослаб?
          </AppText>
          <AppText tone="muted">
            Вы дали префронтальной коре время включиться. Теперь выбор за вами, а не за алгоритмом.
          </AppText>
        </View>

        <View className="gap-3">
          <AppText variant="label">Что запустило импульс?</AppText>
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
        </View>

        <View className="gap-3">
          <AppText variant="label">
            {trigger
              ? `Замены, когда ${getTrigger(trigger).label.toLowerCase()}`
              : "Замените ленту на 1–3 минуты"}
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
            label={`Я переключился · +${formatMinutes(app.settings.sessionMinutes)}`}
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
            label="Ещё 15 секунд"
            icon="refresh"
            variant="secondary"
            onPress={() => {
              setRun((value) => value + 1);
              setStage("pause");
            }}
          />
          <Button
            label="Всё-таки сорвался — записать"
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

  return (
    <Screen>
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1 gap-1">
          <AppText variant="overline" tone="primary">
            {trigger ? `SOS · ${getTrigger(trigger).label}` : "SOS-пауза"}
          </AppText>
          <AppText variant="heading" className="text-2xl" accessibilityRole="header">
            15 секунд тишины
          </AppText>
          <AppText variant="caption" tone="muted">
            Импульс похож на волну. Дайте ей пройти — телефон подождёт.
          </AppText>
        </View>
        <IconButton icon="close" onPress={close} accessibilityLabel="Закрыть паузу" />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
        className="-mx-5 grow-0 px-5"
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
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${exercise.title}${locked ? ", доступно в Pro" : ""}`}
      className={cn(
        "flex-row items-center gap-2 rounded-full border px-4 py-2.5 active:opacity-80",
        selected
          ? "border-brand-600 bg-brand-600 dark:border-brand-500 dark:bg-brand-500"
          : "border-slate-200 bg-white dark:border-ink-700 dark:bg-ink-900",
      )}
    >
      <Ionicons
        name={locked ? "lock-closed" : exercise.icon}
        size={15}
        color={selected ? colors.onPrimary : colors.textMuted}
      />
      <AppText
        variant="label"
        className={selected ? "text-white" : "text-slate-700 dark:text-slate-200"}
      >
        {exercise.title}
      </AppText>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// The pause itself
// ---------------------------------------------------------------------------

const CIRCLE = 240;
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

function PausePhase({ exercise, onDone }: { exercise: Exercise; onDone: () => void }) {
  const { colors, isDark } = useThemeColors();
  const [elapsedMs, setElapsedMs] = useState(0);
  const [scale] = useState(() => new Animated.Value(MIN_SCALE));
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  // Wall-clock based, so a slow JS frame never stretches the pause.
  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsedMs(Math.min(TOTAL_MS, Date.now() - start));
    }, TICK_MS);
    return () => clearInterval(interval);
  }, []);

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
  }, [phaseKey, exercise, scale]);

  const secondsLeft = Math.ceil((TOTAL_MS - elapsedMs) / 1000);

  return (
    <View className="items-center gap-6">
      <View
        style={{ width: CIRCLE, height: CIRCLE }}
        className="items-center justify-center"
        accessible
        accessibilityLiveRegion="polite"
        accessibilityLabel={`${phase.label}. Осталось ${secondsLeft} секунд`}
      >
        <View
          className="absolute rounded-full bg-brand-50 dark:bg-brand-950/40"
          style={{ width: CIRCLE, height: CIRCLE }}
        />
        <Animated.View
          style={{
            position: "absolute",
            width: CIRCLE,
            height: CIRCLE,
            borderRadius: CIRCLE / 2,
            backgroundColor: isDark ? "rgba(129, 140, 248, 0.22)" : "rgba(99, 102, 241, 0.16)",
            transform: [{ scale }],
          }}
        />
        <Animated.View
          style={{
            position: "absolute",
            width: CIRCLE * 0.74,
            height: CIRCLE * 0.74,
            borderRadius: CIRCLE,
            backgroundColor: colors.primaryStrong,
            transform: [{ scale }],
          }}
        />
        <View className="items-center">
          <AppText variant="heading" className="text-xl text-white">
            {phase.label}
          </AppText>
          <AppText variant="display" className="text-6xl leading-[68px] text-white">
            {secondsLeft}
          </AppText>
        </View>
      </View>

      <View className="w-full gap-4 rounded-3xl border border-slate-200/70 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
        <View className="flex-row items-center justify-between">
          <AppText variant="overline" tone="muted">
            Шаг {prompt.index + 1} из {exercise.prompts.length}
          </AppText>
          <AppText variant="caption" tone="muted">
            {exercise.title}
          </AppText>
        </View>
        <AppText variant="heading" className="min-h-[56px] text-xl leading-7">
          {exercise.prompts[prompt.index]!.text}
        </AppText>
        <ProgressBar progress={elapsedMs / TOTAL_MS} />
      </View>
    </View>
  );
}
