import { View } from "react-native";

import { AI_CONFIGURED } from "../ai/client";
import { AppText } from "../components/AppText";
import { Card } from "../components/Card";
import { IconButton } from "../components/IconButton";
import { Screen } from "../components/Screen";
import { useT } from "../i18n";
import type { RootStackScreenProps } from "../navigation/types";

/** The policy's sections, in order; texts come from `privacy.sections`. */
const SECTIONS = ["stored", "ai", "widgets", "purchases", "ads", "deletion"] as const;

export function PrivacyScreen({ navigation }: RootStackScreenProps<"Privacy">) {
  const t = useT();
  return (
    <Screen>
      <View className="flex-row items-center gap-3">
        <AppText variant="title" className="flex-1 text-2xl" accessibilityRole="header">
          {t.privacy.title}
        </AppText>
        <IconButton
          icon="close"
          onPress={() => navigation.goBack()}
          accessibilityLabel={t.privacy.close}
        />
      </View>
      {SECTIONS.map((id) => {
        const section = t.privacy.sections[id];
        const text = id === "ai" && !AI_CONFIGURED ? t.privacy.sections.ai.offText : section.text;
        return (
          <Card key={id} className="gap-2">
            <AppText variant="heading">{section.title}</AppText>
            <AppText tone="muted">{text}</AppText>
          </Card>
        );
      })}
    </Screen>
  );
}
