import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Pressable, View } from "react-native";

import type { AiEntry } from "../../ai/types";
import { useAi } from "../../context/AiContext";
import { useT } from "../../i18n";
import { formatRelativeDay } from "../../utils/date";
import { useThemeColors } from "../../utils/theme";
import { AppText } from "../AppText";
import { Button } from "../Button";
import { ListGroup } from "../ListGroup";
import { EntryAnalysisView } from "./EntryAnalysisView";

const PAGE = 10;

/** The user's own words and ChatGPT's reading of each entry — the history the analysis uses. */
export function EntryHistory({ entries, now }: { entries: readonly AiEntry[]; now: number }) {
  const t = useT();
  const [visible, setVisible] = useState(PAGE);
  if (!entries.length) return null;
  return (
    <View className="gap-3">
      <ListGroup
        header={t.ai.history.title}
        headerRight={
          <AppText variant="caption" tone="subtle" className="text-[13px]">
            {t.ai.history.count(entries.length)}
          </AppText>
        }
      >
        {entries.slice(0, visible).map((entry) => (
          <EntryRow key={entry.id} entry={entry} now={now} />
        ))}
      </ListGroup>
      {entries.length > visible ? (
        <Button
          label={t.ai.history.more}
          variant="secondary"
          onPress={() => setVisible((count) => count + PAGE)}
        />
      ) : null}
    </View>
  );
}

function EntryRow({ entry, now }: { entry: AiEntry; now: number }) {
  const t = useT();
  const h = t.ai.history;
  const { colors } = useThemeColors();
  const ai = useAi();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const status =
    entry.analysis?.cause ??
    (entry.status === "failed" ? h.failed : entry.status === "pending" ? h.waiting : h.unclear);

  return (
    <View className="gap-2 px-4 py-3">
      <Pressable
        onPress={() => setOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        className="gap-1 active:opacity-70"
      >
        <View className="flex-row items-center justify-between gap-3">
          <AppText variant="caption" tone="subtle" className="text-[13px]">
            {formatRelativeDay(entry.timestamp, now)}
            {entry.outcome === "resisted" ? h.resisted : entry.outcome === "opened" ? h.opened : ""}
          </AppText>
          <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color={colors.chevron} />
        </View>
        <AppText className="text-[16px] leading-[22px]" numberOfLines={open ? undefined : 2}>
          {entry.text}
        </AppText>
        {!open ? (
          <AppText
            variant="caption"
            className="text-[14px]"
            style={{ color: colors.indigo }}
            numberOfLines={1}
          >
            {status}
          </AppText>
        ) : null}
      </Pressable>
      {open ? (
        <View className="gap-3">
          {entry.analysis ? <EntryAnalysisView analysis={entry.analysis} /> : null}
          {entry.status === "failed" ? (
            <Button label={h.retry} variant="secondary" onPress={() => ai.retryEntry(entry.id)} />
          ) : null}
          {confirming ? (
            <View className="flex-row items-center justify-end gap-2">
              <AppText variant="caption" tone="muted" className="flex-1">
                {h.confirmDelete}
              </AppText>
              <Pressable
                onPress={() => setConfirming(false)}
                accessibilityRole="button"
                className="px-3 py-1.5"
              >
                <AppText variant="label" tone="primary">
                  {h.cancel}
                </AppText>
              </Pressable>
              <Pressable
                onPress={() => ai.deleteEntry(entry.id)}
                accessibilityRole="button"
                className="rounded-full bg-rose-50 px-3 py-1.5 dark:bg-rose-950"
              >
                <AppText variant="label" className="text-rose-500 dark:text-rose-400">
                  {h.delete}
                </AppText>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => setConfirming(true)}
              accessibilityRole="button"
              className="self-start"
            >
              <AppText variant="caption" tone="subtle">
                {h.deleteEntry}
              </AppText>
            </Pressable>
          )}
        </View>
      ) : null}
    </View>
  );
}
