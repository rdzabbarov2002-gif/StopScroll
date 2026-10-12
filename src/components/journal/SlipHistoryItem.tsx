import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { getFeedApp, getTrigger } from "../../utils/catalog";
import { formatMinutes, formatRelativeDay } from "../../utils/date";
import { useThemeColors } from "../../utils/theme";
import type { SlipEntry } from "../../utils/types";
import { AppText } from "../AppText";
import { RowIcon } from "../ListGroup";

interface SlipHistoryItemProps {
  entry: SlipEntry;
  now: number;
  onDelete: (id: string) => void;
}

/** One row of the slip history, meant to sit inside a ListGroup. */
export function SlipHistoryItem({ entry, now, onDelete }: SlipHistoryItemProps) {
  const { colors } = useThemeColors();
  const [confirming, setConfirming] = useState(false);
  const trigger = getTrigger(entry.trigger);
  const app = getFeedApp(entry.app);

  return (
    <View className="gap-2 px-4 py-2.5">
      <View className="flex-row items-center gap-3">
        <RowIcon icon={trigger.icon} color={colors.warningStrong} />
        <View className="flex-1 gap-0.5">
          <AppText variant="heading" className="text-[16px]">
            {trigger.label}
          </AppText>
          <AppText variant="caption" tone="subtle" className="text-[13px]">
            {formatRelativeDay(entry.timestamp, now)} · {app.label}
          </AppText>
        </View>
        <AppText variant="label" tone="subtle">
          {formatMinutes(entry.minutesLost)}
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
        <AppText variant="caption" tone="muted" className="pl-[42px]">
          {entry.note}
        </AppText>
      ) : null}

      {confirming ? (
        <View className="flex-row items-center justify-end gap-2 pl-[42px]">
          <AppText variant="caption" tone="muted" className="flex-1">
            Удалить эту запись?
          </AppText>
          <Pressable
            onPress={() => setConfirming(false)}
            accessibilityRole="button"
            className="rounded-full px-3 py-1.5 active:opacity-70"
          >
            <AppText variant="label" tone="primary">
              Отмена
            </AppText>
          </Pressable>
          <Pressable
            onPress={() => onDelete(entry.id)}
            accessibilityRole="button"
            className="rounded-full bg-rose-50 px-3 py-1.5 active:opacity-70 dark:bg-rose-950"
          >
            <AppText variant="label" className="text-rose-500 dark:text-rose-400">
              Удалить
            </AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
