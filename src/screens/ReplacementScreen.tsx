import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { AppText } from "../components/AppText";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { EmptyState } from "../components/EmptyState";
import { IconButton } from "../components/IconButton";
import { LockedCard } from "../components/LockedCard";
import { ProgressBar } from "../components/ProgressBar";
import { Screen } from "../components/Screen";
import { WinCelebration } from "../components/WinCelebration";
import { useApp } from "../context/AppContext";
import { usePro } from "../context/ProContext";
import { useT } from "../i18n";
import type { RootStackScreenProps } from "../navigation/types";
import { getCategory } from "../utils/catalog";
import { formatMinutes } from "../utils/date";
import { haptics } from "../utils/haptics";
import { findReplacement, isLocked } from "../utils/replacements";
import { useThemeColors } from "../utils/theme";
import type { WinEntry } from "../utils/types";

export function ReplacementScreen({ navigation, route }: RootStackScreenProps<"Replacement">) {
  const { colors } = useThemeColors();
  const t = useT();
  const text = t.replacements.detail;
  const app = useApp();
  const { isPro } = usePro();
  const item = findReplacement(route.params.id, app.customReplacements);
  const [win, setWin] = useState<WinEntry | null>(null);
  const [factIndex, setFactIndex] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const close = () => navigation.goBack();

  if (!item) {
    return (
      <Screen>
        <View className="flex-row justify-end">
          <IconButton icon="close" onPress={close} accessibilityLabel={t.replacements.close} />
        </View>
        <EmptyState
          icon="help-circle-outline"
          title={text.notFoundTitle}
          text={text.notFoundText}
        />
      </Screen>
    );
  }

  if (win) {
    return (
      <Screen>
        <WinCelebration
          win={win}
          onDone={close}
          onUndo={() => {
            app.undoWin(win.id);
            setWin(null);
          }}
        />
      </Screen>
    );
  }

  const locked = isLocked(item, isPro);
  const category = getCategory(item.category);
  const isFacts = item.category === "facts" && item.steps.length > 0;

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 dark:bg-ink-800">
          <Ionicons name={category.icon} size={14} color={colors.textMuted} />
          <AppText variant="caption" tone="muted" className="font-semibold">
            {category.label} · {formatMinutes(item.minutes)}
          </AppText>
        </View>
        <IconButton icon="close" onPress={close} accessibilityLabel={t.replacements.close} />
      </View>

      <View className="gap-2">
        <AppText variant="title" accessibilityRole="header">
          {item.title}
        </AppText>
        {/* A custom replacement's description already is its single step. */}
        {item.description && !item.custom ? (
          <AppText tone="muted">{item.description}</AppText>
        ) : null}
      </View>

      {locked ? (
        <LockedCard feature="replacements" title={text.lockedTitle} text={text.lockedText} />
      ) : isFacts ? (
        <Card className="gap-4">
          <AppText variant="overline" tone="muted">
            {text.fact(factIndex + 1, item.steps.length)}
          </AppText>
          <AppText variant="heading" className="text-xl leading-7">
            {item.steps[factIndex]}
          </AppText>
          <Button
            label={text.nextFact}
            icon="arrow-forward"
            variant="secondary"
            onPress={() => {
              haptics.selection();
              setFactIndex((index) => (index + 1) % item.steps.length);
            }}
          />
        </Card>
      ) : item.steps.length > 0 ? (
        <Card className="gap-4">
          {item.steps.map((step, index) => (
            <View key={step} className="flex-row gap-3">
              <View className="h-7 w-7 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/60">
                <AppText variant="label" tone="primary">
                  {index + 1}
                </AppText>
              </View>
              <AppText className="flex-1">{step}</AppText>
            </View>
          ))}
        </Card>
      ) : null}

      {!locked && !isFacts ? <ReplacementTimer key={item.id} minutes={item.minutes} /> : null}

      {!locked ? (
        <Button
          label={text.countWin(formatMinutes(app.settings.sessionMinutes))}
          icon="trophy-outline"
          variant="success"
          size="lg"
          onPress={() => {
            const entry = app.recordWin({
              source: "replacement",
              replacementId: item.id,
              trigger: route.params.trigger,
            });
            haptics.success();
            setWin(entry);
          }}
        />
      ) : null}

      {item.custom ? (
        confirmDelete ? (
          <View className="flex-row gap-3">
            <Button
              label={text.cancel}
              variant="secondary"
              onPress={() => setConfirmDelete(false)}
              className="flex-1"
            />
            <Button
              label={text.delete}
              icon="trash-outline"
              variant="warning"
              className="flex-1"
              onPress={() => {
                app.deleteCustomReplacement(item.id);
                close();
              }}
            />
          </View>
        ) : (
          <Button label={text.deleteOwn} variant="ghost" onPress={() => setConfirmDelete(true)} />
        )
      ) : null}
    </Screen>
  );
}

/** Optional countdown for the 1–3 minutes of the replacement. */
function ReplacementTimer({ minutes }: { minutes: number }) {
  const text = useT().replacements.detail;
  const total = minutes * 60;
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (startedAt === null) return;
    const interval = setInterval(() => {
      setElapsed(Math.min(total, Math.floor((Date.now() - startedAt) / 1000)));
    }, 500);
    return () => clearInterval(interval);
  }, [startedAt, total]);

  const done = elapsed >= total;
  useEffect(() => {
    if (done) haptics.success();
  }, [done]);

  const left = total - elapsed;
  const clock = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;

  return (
    <Card tone="muted" className="gap-3">
      <View className="flex-row items-center justify-between">
        <AppText variant="label">{done ? text.timerDone : text.timer}</AppText>
        <AppText variant="heading" accessibilityLabel={text.secondsLeft(left)}>
          {clock}
        </AppText>
      </View>
      <ProgressBar progress={elapsed / total} />
      {startedAt === null || done ? (
        <Button
          label={done ? text.again : text.startTimer(formatMinutes(minutes))}
          icon={done ? "refresh" : "play"}
          variant="secondary"
          onPress={() => {
            setElapsed(0);
            setStartedAt(Date.now());
          }}
        />
      ) : null}
    </Card>
  );
}
