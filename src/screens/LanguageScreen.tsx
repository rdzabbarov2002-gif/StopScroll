import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { AppIconMark } from "../components/AppIconMark";
import { AppText } from "../components/AppText";
import { BackButton } from "../components/BackButton";
import { Button } from "../components/Button";
import { Screen } from "../components/Screen";
import { useApp } from "../context/AppContext";
import { CATALOG } from "../i18n/messages";
import { LANGUAGES, deviceLanguage, type LanguageCode } from "../i18n";
import { rememberNavigation } from "../navigation/restore";
import { haptics } from "../utils/haptics";
import { useThemeColors } from "../utils/theme";

/**
 * The language picker. On the very first launch nothing else is reachable until a language is
 * chosen; later it opens from Settings. The screen previews its own texts in the language
 * tapped, so the choice is understood before it is confirmed.
 */
export function LanguageScreen({ onDone }: { onDone?: () => void }) {
  const { colors } = useThemeColors();
  const app = useApp();
  const first = app.language === null;
  const [picked, setPicked] = useState<LanguageCode | null>(app.language);
  const suggested = first ? deviceLanguage() : null;
  const preview = CATALOG[picked ?? suggested ?? "en"].language;

  const confirm = () => {
    if (!picked) return;
    haptics.success();
    if (!first) rememberNavigation();
    app.setLanguage(picked);
    onDone?.();
  };

  return (
    <Screen contentClassName="gap-6 px-4">
      {first ? null : <BackButton label={preview.settingsRow} />}
      <View className="items-center gap-4 pt-6">
        <AppIconMark size={72} />
        <AppText variant="title" className="text-center" accessibilityRole="header">
          {picked
            ? preview.title
            : LANGUAGES.map((item) => CATALOG[item.code].language.title).join(" · ")}
        </AppText>
        <AppText tone="muted" className="text-center text-base leading-6">
          {preview.subtitle}
        </AppText>
      </View>

      <View className="overflow-hidden rounded-card bg-card dark:bg-ink-900">
        {LANGUAGES.map((item, index) => {
          const selected = picked === item.code;
          return (
            <View key={item.code}>
              {index > 0 ? (
                <View style={{ height: 0.5, backgroundColor: colors.separator, marginLeft: 16 }} />
              ) : null}
              <Pressable
                onPress={() => {
                  haptics.selection();
                  setPicked(item.code);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={item.nativeName}
                className="min-h-[56px] flex-row items-center gap-3 px-4 py-3 active:opacity-70"
              >
                <View className="flex-1 gap-0.5">
                  <AppText variant="label" className="text-[17px]">
                    {item.nativeName}
                  </AppText>
                  {item.nativeName !== item.englishName ? (
                    <AppText variant="caption" tone="subtle" className="text-[13px]">
                      {item.englishName}
                    </AppText>
                  ) : null}
                </View>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                ) : suggested === item.code && !picked ? (
                  <Ionicons name="ellipse-outline" size={22} color={colors.textSubtle} />
                ) : null}
              </Pressable>
            </View>
          );
        })}
      </View>

      <Button
        label={preview.continue}
        size="lg"
        icon="arrow-forward"
        disabled={!picked}
        onPress={confirm}
      />
    </Screen>
  );
}
