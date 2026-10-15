import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { ActivityIndicator, Keyboard, Pressable, TextInput, View } from "react-native";

import { MAX_ENTRY_LENGTH } from "../../ai/storage";
import type { AiEntry, EntryOutcome } from "../../ai/types";
import { useAi } from "../../context/AiContext";
import { haptics } from "../../utils/haptics";
import { useThemeColors } from "../../utils/theme";
import { AppText } from "../AppText";
import { Button } from "../Button";
import { Card } from "../Card";
import { CardLabel } from "../CardLabel";
import { Chip } from "../Chip";
import { EntryAnalysisView } from "./EntryAnalysisView";

const OUTCOMES: { id: EntryOutcome; label: string }[] = [
  { id: "resisted", label: "Удержались" },
  { id: "opened", label: "Открыли ленту" },
];

/**
 * "Что произошло перед тем, как захотелось открыть ленту?" — free text in the user's own words.
 * Saved at once; then ChatGPT reads it and the whole analytics is recalculated.
 */
export function ImpulseEntryCard() {
  const { colors } = useThemeColors();
  const ai = useAi();
  const [text, setText] = useState("");
  const [outcome, setOutcome] = useState<EntryOutcome | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const saved = savedId ? ai.entries.find((entry) => entry.id === savedId) : undefined;

  const save = () => {
    if (!text.trim()) return;
    const entry = ai.addEntry(text, outcome);
    haptics.success();
    Keyboard.dismiss();
    setText("");
    setOutcome(null);
    setSavedId(entry.id);
  };

  return (
    <Card className="gap-3.5">
      <CardLabel icon="create" label="Импульс" color={colors.primary} />
      <AppText variant="statement">Что произошло перед тем, как захотелось открыть ленту?</AppText>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Опишите своими словами, что произошло..."
        placeholderTextColor={colors.textSubtle}
        multiline
        maxLength={MAX_ENTRY_LENGTH}
        className="min-h-[104px] rounded-2xl bg-white px-4 py-3 text-[16px] leading-[22px] text-black dark:bg-ink-800 dark:text-white"
        style={{ textAlignVertical: "top" }}
        accessibilityLabel="Что произошло перед тем, как захотелось открыть ленту"
      />
      <View className="gap-2">
        <AppText variant="caption" tone="subtle" className="text-[13px]">
          Чем закончилось — если уже знаете
        </AppText>
        <View className="flex-row flex-wrap gap-2">
          {OUTCOMES.map((item) => (
            <Chip
              key={item.id}
              label={item.label}
              selected={outcome === item.id}
              onPress={() => {
                haptics.selection();
                setOutcome(outcome === item.id ? null : item.id);
              }}
            />
          ))}
        </View>
      </View>
      <Button label="Сохранить" icon="checkmark" disabled={!text.trim()} onPress={save} />
      {saved ? <SavedEntry entry={saved} onClose={() => setSavedId(null)} /> : null}
    </Card>
  );
}

/** Right under the field: what happens with the entry that was just saved. */
function SavedEntry({ entry, onClose }: { entry: AiEntry; onClose: () => void }) {
  const { colors } = useThemeColors();
  const navigation = useNavigation();
  const ai = useAi();
  const openAi = () => navigation.navigate("Main", { screen: "AI" });

  let body;
  if (entry.status === "done" && entry.analysis) {
    body = (
      <>
        <EntryAnalysisView analysis={entry.analysis} />
        <View className="flex-row flex-wrap gap-2 pt-1">
          <Button
            label="Вся AI-аналитика"
            variant="secondary"
            icon="sparkles-outline"
            onPress={openAi}
          />
          {entry.outcome !== "resisted" ? (
            <Button
              label="SOS-пауза"
              variant="secondary"
              icon="pause"
              onPress={() => navigation.navigate("Intercept")}
            />
          ) : null}
        </View>
      </>
    );
  } else if (!ai.configured) {
    body = (
      <Note icon="information-circle-outline" color={colors.textSubtle}>
        Запись сохранена. В этой сборке AI-анализ не подключён, поэтому ChatGPT её не прочитает.
      </Note>
    );
  } else if (ai.consent !== true) {
    body = (
      <>
        <Note icon="lock-closed-outline" color={colors.primary}>
          Запись сохранена на телефоне. Чтобы ChatGPT разобрал её, нужно ваше разрешение на отправку
          записей.
        </Note>
        <Button label="Разрешить анализ" variant="secondary" onPress={openAi} />
      </>
    );
  } else if (entry.status === "failed") {
    body = (
      <>
        <Note icon="alert-circle-outline" color={colors.warningStrong}>
          Не получилось получить разбор от ChatGPT. Запись сохранена.
        </Note>
        <Button label="Повторить" variant="secondary" onPress={() => ai.retryEntry(entry.id)} />
      </>
    );
  } else {
    body = (
      <View className="flex-row items-center gap-2.5" accessibilityLiveRegion="polite">
        <ActivityIndicator size="small" color={colors.primary} />
        <AppText variant="caption" tone="muted" className="flex-1">
          {ai.sync.status === "error" && ai.sync.task === "entry"
            ? ai.sync.error
            : "Запись сохранена. ChatGPT разбирает её…"}
        </AppText>
      </View>
    );
  }

  return (
    <View className="gap-3 rounded-2xl bg-white p-3.5 dark:bg-ink-850">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="sparkles" size={16} color={colors.indigo} />
          <AppText variant="label" style={{ color: colors.indigo }}>
            Разбор записи
          </AppText>
        </View>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Скрыть разбор"
          hitSlop={10}
        >
          <Ionicons name="close" size={18} color={colors.textSubtle} />
        </Pressable>
      </View>
      {body}
    </View>
  );
}

function Note({
  icon,
  color,
  children,
}: {
  icon: "lock-closed-outline" | "information-circle-outline" | "alert-circle-outline";
  color: string;
  children: string;
}) {
  return (
    <View className="flex-row items-start gap-2.5">
      <Ionicons name={icon} size={18} color={color} style={{ marginTop: 1 }} />
      <AppText variant="caption" className="flex-1 leading-[20px]">
        {children}
      </AppText>
    </View>
  );
}
