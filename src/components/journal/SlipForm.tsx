import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { TextInput, View } from "react-native";

import { useApp } from "../../context/AppContext";
import { FEED_APPS, TRIGGERS } from "../../utils/catalog";
import { formatMinutes } from "../../utils/date";
import { haptics } from "../../utils/haptics";
import { MAX_NOTE_LENGTH } from "../../utils/persistedState";
import { useThemeColors } from "../../utils/theme";
import type { FeedApp, TriggerId } from "../../utils/types";
import { AppText } from "../AppText";
import { Button } from "../Button";
import { Card } from "../Card";
import { Chip } from "../Chip";

const MINUTE_OPTIONS = [5, 15, 30, 60, 120] as const;

interface SlipFormProps {
  initialTrigger?: TriggerId;
}

/** Quick capture of a slip: what triggered it, where, how long. */
export function SlipForm({ initialTrigger }: SlipFormProps) {
  const { colors } = useThemeColors();
  const { logSlip, settings } = useApp();
  const [trigger, setTrigger] = useState<TriggerId | null>(initialTrigger ?? null);
  const [app, setApp] = useState<FeedApp>(settings.mainApp);
  const [minutes, setMinutes] = useState<number>(15);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  const save = () => {
    if (!trigger) return;
    logSlip({ trigger, app, minutesLost: minutes, note });
    haptics.success();
    setTrigger(null);
    setNote("");
    setSaved(true);
  };

  const touch = () => setSaved(false);

  return (
    <Card className="gap-5">
      <View className="gap-3">
        <AppText variant="label">Что запустило срыв?</AppText>
        <View className="flex-row flex-wrap gap-2">
          {TRIGGERS.map((item) => (
            <Chip
              key={item.id}
              label={item.label}
              icon={item.icon}
              selected={trigger === item.id}
              onPress={() => {
                haptics.selection();
                setTrigger(trigger === item.id ? null : item.id);
                touch();
              }}
            />
          ))}
        </View>
      </View>

      <View className="gap-3">
        <AppText variant="label">Где</AppText>
        <View className="flex-row flex-wrap gap-2">
          {FEED_APPS.map((item) => (
            <Chip
              key={item.id}
              label={item.label}
              icon={item.icon}
              selected={app === item.id}
              onPress={() => {
                haptics.selection();
                setApp(item.id);
                touch();
              }}
            />
          ))}
        </View>
      </View>

      <View className="gap-3">
        <AppText variant="label">Сколько ушло</AppText>
        <View className="flex-row flex-wrap gap-2">
          {MINUTE_OPTIONS.map((value) => (
            <Chip
              key={value}
              label={formatMinutes(value)}
              selected={minutes === value}
              onPress={() => {
                haptics.selection();
                setMinutes(value);
                touch();
              }}
            />
          ))}
        </View>
      </View>

      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <AppText variant="label">Заметка</AppText>
          <AppText variant="caption" tone="subtle">
            {note.length}/{MAX_NOTE_LENGTH}
          </AppText>
        </View>
        <TextInput
          value={note}
          onChangeText={(value) => {
            setNote(value);
            touch();
          }}
          placeholder="Например: открыл «на минутку» перед сном"
          placeholderTextColor={colors.textSubtle}
          multiline
          maxLength={MAX_NOTE_LENGTH}
          className="min-h-[72px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 dark:border-ink-700 dark:bg-ink-850 dark:text-slate-100"
          style={{ textAlignVertical: "top" }}
          accessibilityLabel="Заметка, необязательно"
        />
      </View>

      {saved ? (
        <View
          className="flex-row items-center gap-3 rounded-2xl bg-brand-50 p-3.5 dark:bg-brand-950/50"
          accessibilityLiveRegion="polite"
        >
          <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
          <AppText variant="caption" className="flex-1 font-medium">
            Записано. Срыв — это данные, а не приговор: так видно, где подстелить соломку.
          </AppText>
        </View>
      ) : null}

      <Button
        label={trigger ? "Записать срыв" : "Выберите причину"}
        icon="add-circle-outline"
        size="lg"
        disabled={!trigger}
        onPress={save}
      />
    </Card>
  );
}
