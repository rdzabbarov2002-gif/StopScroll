import { useState } from "react";
import { TextInput, View } from "react-native";

import { useApp } from "../context/AppContext";
import { CATEGORIES } from "../utils/catalog";
import { haptics } from "../utils/haptics";
import { MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH } from "../utils/persistedState";
import { useThemeColors } from "../utils/theme";
import type { ReplacementCategory } from "../utils/types";
import { AppText } from "./AppText";
import { BottomSheet } from "./BottomSheet";
import { Button } from "./Button";
import { Chip } from "./Chip";

interface CustomReplacementSheetProps {
  visible: boolean;
  onClose: () => void;
}

const INPUT =
  "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 dark:border-ink-700 dark:bg-ink-850 dark:text-slate-100";

/** Pro: the user's own 1–3 minute replacement or healthy habit. */
export function CustomReplacementSheet({ visible, onClose }: CustomReplacementSheetProps) {
  const { colors } = useThemeColors();
  const { addCustomReplacement } = useApp();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ReplacementCategory>("body");
  const [minutes, setMinutes] = useState(2);

  const canSave = title.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    addCustomReplacement({ title, description, category, minutes });
    haptics.success();
    setTitle("");
    setDescription("");
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Своя замена"
      subtitle="То, что работает именно для вас: гитара, отжимания, страница книги."
    >
      <View className="gap-5 pb-2">
        <View className="gap-2">
          <AppText variant="label">Название</AppText>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Например: 10 отжиманий"
            placeholderTextColor={colors.textSubtle}
            maxLength={MAX_TITLE_LENGTH}
            className={INPUT}
            accessibilityLabel="Название замены"
          />
        </View>

        <View className="gap-2">
          <AppText variant="label">Как выполнить</AppText>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Необязательно: пара слов-подсказок"
            placeholderTextColor={colors.textSubtle}
            maxLength={MAX_DESCRIPTION_LENGTH}
            multiline
            className={`${INPUT} min-h-[80px]`}
            style={{ textAlignVertical: "top" }}
            accessibilityLabel="Описание замены, необязательно"
          />
        </View>

        <View className="gap-2">
          <AppText variant="label">Тип</AppText>
          <View className="flex-row flex-wrap gap-2">
            {CATEGORIES.map((item) => (
              <Chip
                key={item.id}
                label={item.label}
                icon={item.icon}
                selected={category === item.id}
                onPress={() => setCategory(item.id)}
              />
            ))}
          </View>
        </View>

        <View className="gap-2">
          <AppText variant="label">Длительность</AppText>
          <View className="flex-row gap-2">
            {[1, 2, 3].map((value) => (
              <Chip
                key={value}
                label={`${value} мин`}
                selected={minutes === value}
                onPress={() => setMinutes(value)}
              />
            ))}
          </View>
        </View>

        <Button
          label="Сохранить замену"
          icon="add-circle-outline"
          size="lg"
          disabled={!canSave}
          onPress={save}
        />
      </View>
    </BottomSheet>
  );
}
