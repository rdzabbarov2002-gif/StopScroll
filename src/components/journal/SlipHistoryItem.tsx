import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { useT } from "../../i18n";
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
  /** Opens "Что произошло?" for a slip without a reason. */
  onReflect: (entry: SlipEntry) => void;
}

/** One row of the slip history, meant to sit inside a ListGroup. */
export function SlipHistoryItem({ entry, now, onDelete, onReflect }: SlipHistoryItemProps) {
  const t = useT().journal.item;
  const { colors } = useThemeColors();
  const [confirming, setConfirming] = useState(false);
  const trigger = entry.trigger ? getTrigger(entry.trigger) : null;
  const app = getFeedApp(entry.app);

  return (
    <View className="gap-2 px-4 py-2.5">
      <View className="flex-row items-center gap-3">
        <RowIcon
          icon={trigger?.icon ?? "help-circle-outline"}
          color={trigger ? colors.warningStrong : colors.textSubtle}
        />
        <View className="flex-1 gap-0.5">
          <AppText variant="heading" className="text-[16px]" tone={trigger ? "default" : "muted"}>
            {trigger?.label ?? t.noReason}
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
          accessibilityLabel={t.delete}
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

      {!trigger && !confirming ? (
        <Pressable
          onPress={() => onReflect(entry)}
          accessibilityRole="button"
          accessibilityLabel={t.reflectA11y}
          className="ml-[42px] flex-row items-center gap-1.5 self-start rounded-full bg-brand-50 px-3 py-1.5 active:opacity-70 dark:bg-brand-900"
        >
          <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.primary} />
          <AppText variant="label" tone="primary" className="text-[14px]">
            {t.reflect}
          </AppText>
        </Pressable>
      ) : null}

      {confirming ? (
        <View className="flex-row items-center justify-end gap-2 pl-[42px]">
          <AppText variant="caption" tone="muted" className="flex-1">
            {t.confirm}
          </AppText>
          <Pressable
            onPress={() => setConfirming(false)}
            accessibilityRole="button"
            className="rounded-full px-3 py-1.5 active:opacity-70"
          >
            <AppText variant="label" tone="primary">
              {t.cancel}
            </AppText>
          </Pressable>
          <Pressable
            onPress={() => onDelete(entry.id)}
            accessibilityRole="button"
            className="rounded-full bg-rose-50 px-3 py-1.5 active:opacity-70 dark:bg-rose-950"
          >
            <AppText variant="label" className="text-rose-500 dark:text-rose-400">
              {t.confirmDelete}
            </AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
