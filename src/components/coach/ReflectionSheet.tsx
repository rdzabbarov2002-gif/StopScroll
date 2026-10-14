import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { TextInput, View } from "react-native";

import { buildReflection, type Reflection } from "../../coach";
import { useApp } from "../../context/AppContext";
import { usePro } from "../../context/ProContext";
import { useCoachVoice } from "../../services/coachVoice";
import { REFLECTION_TRIGGERS, getTrigger } from "../../utils/catalog";
import { haptics } from "../../utils/haptics";
import { MAX_NOTE_LENGTH } from "../../utils/persistedState";
import { findReplacement } from "../../utils/replacements";
import { useThemeColors } from "../../utils/theme";
import type { SlipEntry, TriggerId } from "../../utils/types";
import { AppText } from "../AppText";
import { BottomSheet } from "../BottomSheet";
import { Button } from "../Button";
import { Chip } from "../Chip";
import { CoachBadge } from "./CoachBadge";

interface Draft {
  slipId: string;
  trigger: TriggerId | null;
  note: string;
  reply: Reflection | null;
}

interface ReflectionSheetProps {
  /** The slip being looked at; null hides the sheet. */
  slip: SlipEntry | null;
  /** A reason already known, e.g. from the SOS screen. */
  initialTrigger?: TriggerId;
  onClose: () => void;
}

/**
 * The short talk after a slip: "Что произошло?" with quick answers and an optional note, then
 * the coach's calm reply. Not a chat — two taps and it's done.
 */
export function ReflectionSheet({ slip, initialTrigger, onClose }: ReflectionSheetProps) {
  const { colors } = useThemeColors();
  const navigation = useNavigation();
  const { slips, reflectSlip, customReplacements } = useApp();
  const { isPro } = usePro();
  // The answers belong to one slip: opening another one starts fresh (derived, no effect needed).
  const [draft, setDraft] = useState<Draft | null>(null);
  const current: Draft | null = slip
    ? draft?.slipId === slip.id
      ? draft
      : {
          slipId: slip.id,
          trigger: slip.trigger ?? initialTrigger ?? null,
          note: slip.note,
          reply: null,
        }
    : null;
  const trigger = current?.trigger ?? null;
  const note = current?.note ?? "";
  const reply = current?.reply ?? null;
  const update = (patch: Partial<Draft>) => current && setDraft({ ...current, ...patch });
  const setTrigger = (value: TriggerId | null) => update({ trigger: value });
  const setNote = (value: string) => update({ note: value });

  const answer = () => {
    if (!slip) return;
    // A note alone still counts as an answer: the reason is then "Другое".
    const reason = trigger ?? "other";
    reflectSlip(slip.id, reason, note);
    haptics.success();
    update({ reply: buildReflection(slip, reason, slips, isPro, note) });
  };

  const [replyText] = useCoachVoice(reply ? [reply.text] : []);
  const replacement = reply?.replacementId
    ? findReplacement(reply.replacementId, customReplacements)
    : undefined;

  return (
    <BottomSheet
      visible={slip !== null}
      onClose={onClose}
      title={reply ? "Понимаю" : "Что произошло?"}
      subtitle={reply ? undefined : "Без оценок — только чтобы понять, что повторяется."}
    >
      {reply ? (
        <View className="gap-4">
          <CoachBadge />
          <AppText
            variant="body"
            className="text-[17px] leading-[25px]"
            accessibilityLiveRegion="polite"
          >
            {replyText ?? reply.text}
          </AppText>
          <View className="gap-2 pt-1">
            {replacement ? (
              <Button
                label={`Попробовать: ${replacement.title}`}
                icon="sparkles-outline"
                onPress={() => {
                  onClose();
                  navigation.navigate("Replacement", { id: replacement.id });
                }}
              />
            ) : null}
            <Button label="Спасибо" variant="secondary" onPress={onClose} />
          </View>
        </View>
      ) : (
        <View className="gap-4">
          <View className="flex-row flex-wrap gap-2">
            {REFLECTION_TRIGGERS.map((id) => {
              const option = getTrigger(id);
              return (
                <Chip
                  key={id}
                  label={option.ask}
                  icon={option.icon}
                  selected={trigger === id}
                  onPress={() => {
                    haptics.selection();
                    setTrigger(trigger === id ? null : id);
                  }}
                />
              );
            })}
          </View>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Или своими словами — необязательно"
            placeholderTextColor={colors.textSubtle}
            multiline
            maxLength={MAX_NOTE_LENGTH}
            className="min-h-[72px] rounded-2xl bg-card px-4 py-3 text-[16px] text-black dark:bg-ink-800 dark:text-white"
            style={{ textAlignVertical: "top" }}
            accessibilityLabel="Что произошло, своими словами"
          />
          <View className="gap-2">
            <Button
              label="Готово"
              size="lg"
              disabled={trigger === null && note.trim() === ""}
              onPress={answer}
            />
            <Button label="Не сейчас" variant="ghost" onPress={onClose} />
          </View>
        </View>
      )}
    </BottomSheet>
  );
}
