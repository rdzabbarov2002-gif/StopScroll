import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { getFeedApp, getTrigger } from "../../utils/catalog";
import { formatMinutes, formatRelativeDay } from "../../utils/date";
import { useThemeColors } from "../../utils/theme";
import type { SlipEntry } from "../../utils/types";
import { AppText } from "../AppText";

interface SlipHistoryItemProps {
  entry: SlipEntry;
  now: number;
  onDelete: (id: string) => void;
}

export function SlipHistoryItem({ entry, now, onDelete }: SlipHistoryItemProps) {
  const { colors } = useThemeColors();
  const [confirming, setConfirming] = useState(false);
  const trigger = getTrigger(entry.trigger);
  const app = getFeedApp(entry.app);

  return (
    <View className="gap-3 rounded-3xl border border-slate-200/70 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
      <View className="flex-row items-center gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-950/40">
          <Ionicons name={trigger.icon} size={20} color={colors.text} />
        </View>
        <View className="flex-1 gap-0.5">
          <AppText variant="label" className="text-base">
            {trigger.label}
          </AppText>
          <AppText variant="caption" tone="muted">
            {formatRelativeDay(entry.timestamp, now)} · {app.label}
          </AppText>
        </View>
        <AppText variant="label" tone="muted">
          −{formatMinutes(entry.minutesLost)}
        </AppText>
        <Pressable
          onPress={() => setConfirming((value) => !value)}
          accessibilityRole="button"
          accessibilityLabel="Удалить запись"
          hitSlop={8}
          className="h-8 w-8 items-center justify-center rounded-full active:opacity-60"
        >
          <Ionicons name="trash-outline" size={16} color={colors.textSubtle} />
        </Pressable>
      </View>

      {entry.note ? (
        <AppText variant="caption" className="text-slate-700 dark:text-slate-300">
          {entry.note}
        </AppText>
      ) : null}

      {confirming ? (
        <View className="flex-row items-center justify-end gap-2">
          <AppText variant="caption" tone="muted" className="flex-1">
            Удалить эту запись?
          </AppText>
          <Pressable
            onPress={() => setConfirming(false)}
            accessibilityRole="button"
            className="rounded-full px-3 py-1.5 active:opacity-70"
          >
            <AppText variant="label" tone="muted">
              Отмена
            </AppText>
          </Pressable>
          <Pressable
            onPress={() => onDelete(entry.id)}
            accessibilityRole="button"
            className="rounded-full bg-rose-50 px-3 py-1.5 active:opacity-70 dark:bg-rose-950/40"
          >
            <AppText variant="label" className="text-rose-600 dark:text-rose-400">
              Удалить
            </AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
